// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { Document } from '@stoplight/spectral-core';
import Parsers from '@stoplight/spectral-parsers';
import { Express } from 'express';
import { processApiSpec, validateYamlInput } from '../util/apiUtil.js';
import { UrlContentDto } from '../model/UrlContentDto.js';
import { importAndCreateRuleInstances } from '../util/ruleUtil.js';
import { ERROR_TYPE, RapLPBaseApiError } from '../util/RapLPBaseApiErrorHandling.js';
import { loadUrlValidationConfiguration } from '../util/urlValidationConfig.js';
import { RuleExecutionContext } from '../util/RuleExecutionContext.js';
import { parseRuleCategories, resolveRuleCategories } from '../rulesets/util/ruleModules.js';

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
    try {
      const context = new RuleExecutionContext();
      const dto: UrlContentDto = req.body;

      if (config?.urlMatchRegex && !dto.url.match(config.urlMatchRegex)) {
        throw new RapLPBaseApiError(
          'Invalid Request',
          'The requested address failed the allowed url pattern. Contact your administrator if you think this is a misstake.',
          ERROR_TYPE.BAD_REQUEST,
        );
      }

      assertSsrfSafeUrl(dto.url);

      let response: Response;
      try {
        response = await fetch(dto.url, { ...config?.customFetchConfig, redirect: 'error' });
      } catch {
        throw new RapLPBaseApiError(
          'Invalid Request',
          'The requested URL could not be fetched. Redirects are not allowed.',
          ERROR_TYPE.BAD_REQUEST,
        );
      }

      const yamlContentString = await response.text();

      validateYamlInput(yamlContentString);

      const apiSpecDocument = new Document(yamlContentString, Parsers.Yaml, 'payload.yaml');
      const ruleCategories = parseRuleCategories(dto.categories);
      const resolvedCategories = resolveRuleCategories(ruleCategories);

      const rules = await importAndCreateRuleInstances(context, resolvedCategories);

      const result = await processApiSpec(context, rules, apiSpecDocument);
      res.json(result);
    } catch (e) {
      next(e);
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
