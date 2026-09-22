// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { Document } from '@stoplight/spectral-core';
import Parsers from '@stoplight/spectral-parsers';
import { Express } from 'express';
import { processApiSpec, logError } from '../util/apiUtil.js';
import { importAndCreateRuleInstances } from '../util/ruleUtil.js';
import { ERROR_TYPE, RapLPBaseApiError, sendProblem } from '../util/RapLPBaseApiErrorHandling.js';
import { loadUrlValidationConfiguration } from '../util/urlValidationConfig.js';
import { RuleExecutionContext } from '../util/RuleExecutionContext.js';
import { parseRuleCategories, resolveRuleCategories } from '../rulesets/util/ruleModules.js';
import { SpecValidationRequestDto } from '../model/SpecValidationRequestDto.js';
import { parseApiSpecInput, detectSpecFormatPreference, ParseResult } from '../util/validateUtil.js';
import { ProblemDetailsDTO } from '../model/ProblemDetailsDto.js';
import * as IssueHelper from '../util/RapLPIssueHelpers.js';
import type { IParser } from '@stoplight/spectral-parsers';
import { mapValidationExecutionError } from '../util/mapValidationExecutionError.js';

import { validateConcurrencyLimit } from '../util/validationConcurrencyLimit.js';
import { measure } from '../util/performance.js';
import crypto from 'node:crypto';
import { resolveLocale, translator } from '../i18n.js';

const isIpv4Address = (value: string): boolean => {
  const parts = value.split('.');
  if (parts.length !== 4) {
    return false;
  }
  return parts.every((part) => {
    if (!/^\d+$/.test(part)) {
      return false;
    }
    const n = Number(part);
    return n >= 0 && n <= 255;
  });
};

const isPrivateOrLocalIpv4 = (ip: string): boolean => {
  const [a, b] = ip.split('.').map(Number);
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 0
  );
};

const assertSsrfSafeUrl = (config: any, urlString: string, t: ReturnType<typeof translator>): void => {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new RapLPBaseApiError(t('api.invalidRequest'), t('api.invalidUrlFormat'), ERROR_TYPE.BAD_REQUEST);
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new RapLPBaseApiError(t('api.invalidRequest'), t('api.onlyHttpProtocols'), ERROR_TYPE.BAD_REQUEST);
  }

  const hostname = parsed.hostname.toLowerCase();
  const isLocalhost =
    hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === '::1' || hostname === '[::1]';
  console.log('IsLocalhost: ' + isLocalhost);
  console.log('allowLocalhost: ' + config?.allowLocalhost);

  if (isLocalhost && !config?.allowLocalhost) {
    throw new RapLPBaseApiError(t('api.invalidRequest'), t('api.hostNotAllowed'), ERROR_TYPE.BAD_REQUEST);
  }
  if (isIpv4Address(hostname) && isPrivateOrLocalIpv4(hostname)) {
    throw new RapLPBaseApiError(t('api.invalidRequest'), t('api.hostNotAllowed'), ERROR_TYPE.BAD_REQUEST);
  }
};

export const registerUrlValidationRoutes = (app: Express, urlValidationConfigFile?: string) => {
  const config = loadUrlValidationConfiguration(urlValidationConfigFile);
  // Route for validating openapi yaml from url.

  app.post(
    '/api/v1/validation/url',
    validateConcurrencyLimit(Number(process.env.RAP_LP_MAX_CONCURRENT_VALIDATIONS ?? 4)),
    async (req, res, next) => {
      const t = translator(res.locals?.locale ?? resolveLocale());
      let strict = true;
      try {
        const requestId = crypto.randomUUID();
        const context = new RuleExecutionContext();
        const body: SpecValidationRequestDto = req.body;

        const url = body.url!;

        if (config?.urlMatchRegex && !url.match(config.urlMatchRegex)) {
          throw new RapLPBaseApiError(t('api.invalidRequest'), t('api.urlPatternNotAllowed'), ERROR_TYPE.BAD_REQUEST);
        }
        assertSsrfSafeUrl(config, url, t);
        let response: Response;
        try {
          response = await measure({ requestId, operation: 'fetch' }, () =>
            fetch(url, { ...config?.customFetchConfig, redirect: 'error' }),
          );
        } catch {
          throw new RapLPBaseApiError(t('api.invalidRequest'), t('api.urlFetchFailed'), ERROR_TYPE.BAD_REQUEST);
        }
        if (!response.ok) {
          throw new RapLPBaseApiError(
            t('api.invalidRequest'),
            t('api.urlReturnedHttp', { status: response.status }),
            ERROR_TYPE.BAD_REQUEST,
          );
        }
        //UTF-8 encoded here
        const raw = await response.text();

        // 1. Decode input
        // No need to base-64 encode spec here
        strict = body.strict ?? true;
        const categories = body.categories ?? [];

        // 2. Detect format-preferens
        const prefer = await measure({ requestId, operation: 'detectSpecFormatPreference' }, () =>
          detectSpecFormatPreference(undefined, raw, 'auto'),
        );
        // 3. Parse handling + strict-validate (Structural / Semantic errors)
        const parseResult = await measure({ requestId, operation: 'parseApiSpecInput' }, () =>
          parseApiSpecInput({ raw }, { strict, preferJsonError: prefer }),
        );
        // 4. Strict-issues →
        if (parseResult.strictIssues?.length) {
          const sorted = IssueHelper.sortIssues(parseResult.strictIssues);
          const snippet = IssueHelper.formatIssuesAsEditorText(sorted);

          return sendProblem(
            res,
            400,
            new ProblemDetailsDTO({
              type: 'https://raplp.digg.se/problems/semantic-validation',
              title: t('api.ruleValidationFailed'),
              status: 400,
              detail: t('api.semanticValidationDetail'),
              instance: req.originalUrl,

              // Put in kind field to indicate violation
              kind: 'spec-validation',
              format: parseResult.format,
              stage: 'strict',
              //Payload
              issues: sorted,
              snippet,
            }),
          );
        }
        // 5. No strict-errors → run raplp ruleengine
        const parser: IParser<any> = (parseResult.format === 'json'
          ? Parsers.Json
          : Parsers.Yaml) as unknown as IParser<any>;
        const apiSpecDocument = await measure(
          { requestId, operation: 'create Document' },
          () => new Document(parseResult.raw, parser, 'payload.yaml'),
        );

        const ruleCategories = parseRuleCategories(categories);
        const resolvedCategories = resolveRuleCategories(ruleCategories);

        const rules = await measure({ requestId, operation: 'importAndCreateRuleInstances' }, () =>
          importAndCreateRuleInstances(context, resolvedCategories),
        );
        const result = await measure({ requestId, operation: 'processApiSpec' }, () =>
          processApiSpec(context, rules, apiSpecDocument),
        );

        const hasRuleViolations = result.result.some((d) => d.severity === 'ERROR' || d.severity === 'WARNING');
        if (hasRuleViolations) {
          //Rulevalidation occured in RapLP-ruleengine
          return sendProblem(
            res,
            400,
            new ProblemDetailsDTO({
              type: 'https://raplp.digg.se/problems/rule-validation',
              title: t('api.ruleValidationFailed'),
              status: 400,
              detail: t('api.ruleValidationDetail'),
              instance: req.originalUrl,

              // Put in kind field to indicate violation
              kind: 'rule-validation',
              stage: 'rule-engine',
              format: parseResult.format,
              //Payload
              payload: result,
            }),
          );
        }
        // No rule violation and success response goes here
        return res.status(200).json({
          ok: true,
          stage: 'rule-engine',
          format: parseResult.format,
          //Payload
          payload: result,
        });
      } catch (e) {
        logError(e);
        next(
          mapValidationExecutionError(e, {
            strictEnabled: strict,
          }),
        );
      }
    },
  );
};

// Fallback route if feature dissabled.
export const registerUrlValidationFallbackRoutes = (app: Express) => {
  app.post('/api/v1/validation/url', async (req, res, next) => {
    const t = translator(res.locals?.locale ?? resolveLocale());
    next(new RapLPBaseApiError(t('api.featureDisabledTitle'), t('api.featureDisabledDetail'), ERROR_TYPE.CONFLICT));
  });
};
