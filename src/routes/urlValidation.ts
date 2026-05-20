// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { Document } from '@stoplight/spectral-core';
import Parsers from '@stoplight/spectral-parsers';
import { Express } from 'express';
import { processApiSpec, logErrorToFile } from '../util/apiUtil.js';
import { importAndCreateRuleInstances } from '../util/ruleUtil.js';
import { ERROR_TYPE, RapLPBaseApiError, sendProblem } from '../util/RapLPBaseApiErrorHandling.js';
import { loadUrlValidationConfiguration } from '../util/urlValidationConfig.js';
import { RuleExecutionContext } from '../util/RuleExecutionContext.js';
import { parseRuleCategories, resolveRuleCategories } from '../rulesets/util/ruleModules.js';
import { SpecValidationRequestDto } from '../model/SpecValidationRequestDto.js';
import { parseApiSpecInput,detectSpecFormatPreference, ParseResult} from '../util/validateUtil.js';
import { ProblemDetailsDTO } from '../model/ProblemDetailsDto.js';
import * as IssueHelper from '../util/RapLPIssueHelpers.js'; 
import type { IParser } from '@stoplight/spectral-parsers';
import { mapValidationExecutionError } from '../util/mapValidationExecutionError.js';

const assertSsrfSafeUrl = (urlString: string): void => {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new RapLPBaseApiError('Invalid Request', 'Invalid URL format.', ERROR_TYPE.BAD_REQUEST);
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new RapLPBaseApiError(
      'Invalid Request',
      'Only HTTPS and HTTP protocols are allowed.',
      ERROR_TYPE.BAD_REQUEST,
    );
  }
};

export const registerUrlValidationRoutes = (app: Express, urlValidationConfigFile?: string) => {
  const config = loadUrlValidationConfiguration(urlValidationConfigFile);

  // Route for validating openapi yaml from url.
  app.post('/api/v1/validation/url', async (req, res, next) => {

    let strict = true;
    try {
      const context = new RuleExecutionContext();
      const body: SpecValidationRequestDto = req.body;

      const url = body.url!;

      if (config?.urlMatchRegex && !url.match(config.urlMatchRegex)) {
        throw new RapLPBaseApiError(
          'Invalid Request',
          'The requested address did not meet the allowed URL pattern. Please contact your administrator if you believe this is a mistake.',
          ERROR_TYPE.BAD_REQUEST,
        );
      }
      assertSsrfSafeUrl(url);

      let response: Response;
      try {
        response = await fetch(url, { ...config?.customFetchConfig, redirect: 'error' });
      } catch {
        throw new RapLPBaseApiError(
          'Invalid Request',
          'The requested URL could not be retrieved. Redirects are not allowed.',
          ERROR_TYPE.BAD_REQUEST,
        );
      }
      if (!response.ok) {
        throw new RapLPBaseApiError(
          'Invalid Request',
          `The requested URL returned HTTP ${response.status}.`,
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
      const prefer = detectSpecFormatPreference(
        undefined,
        raw,
        'auto',
      );
      // 3. Parse handling + strict-validate (Structural / Semantic errors)
      const parseResult = await parseApiSpecInput(
        { raw},
        {strict,preferJsonError: prefer},
      );
      // 4. Strict-issues → 
      if (parseResult.strictIssues?.length) {
        const sorted = IssueHelper.sortIssues(parseResult.strictIssues);
        const snippet = IssueHelper.formatIssuesAsEditorText(sorted);

         return sendProblem(res, 400,
            new ProblemDetailsDTO({
              type: 'https://raplp.digg.se/problems/semantic-validation',
              title: 'Rule validation failed',
              status: 400,
              detail: 'Specifikationen innehåller strukturella eller semantiska fel',
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
      const parser: IParser<any> = (parseResult.format === 'json' ? Parsers.Json : Parsers.Yaml) as unknown as IParser<any>;
      const apiSpecDocument = new Document(parseResult.raw, parser, 'payload.yaml'); // In-memory-file to calculate correct positions when parsing

      const ruleCategories = parseRuleCategories(categories);
      const resolvedCategories = resolveRuleCategories(ruleCategories);

      const rules = await importAndCreateRuleInstances(context, resolvedCategories);
      const result = await processApiSpec(context, rules, apiSpecDocument);

      const hasRuleViolations = result.result.some(
        d =>d.allvarlighetsgrad === 'ERROR' || d.allvarlighetsgrad === 'WARNING'
      );
      if (hasRuleViolations) {
         //Rulevalidation occured in RapLP-ruleengine
         return sendProblem(res, 400,
            new ProblemDetailsDTO({
              type: 'https://raplp.digg.se/problems/rule-validation',
              title: 'Rule validation failed',
              status: 400,
              detail: 'API-specifikationen bryter mot en eller flera regler enligt den svenska REST API-profilen.',
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
        format:parseResult.format,
        //Payload 
        payload: result, 
      });
    } catch (e) {
      logErrorToFile(e);
      next(
        mapValidationExecutionError(e, {
          strictEnabled: strict,
        }) 
      );
    }
  });
};

// Fallback route if feature dissabled.
export const registerUrlValidationFallbackRoutes = (app: Express) => {
  app.post('/api/v1/validation/url', async (req, res, next) => {
    next(
      new RapLPBaseApiError(
        'Conflict',
        'This feature is currenctly dissabled due to server configuration. Contact your administrator if you think this is a misstake.',
        ERROR_TYPE.CONFLICT,
      ),
    );
  });
};

