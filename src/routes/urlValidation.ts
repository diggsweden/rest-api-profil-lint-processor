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

export const registerUrlValidationRoutes = (app: Express, urlValidationConfigFile?: string) => {
  const config = loadUrlValidationConfiguration(urlValidationConfigFile);

  // Route for validating openapi yaml from url.
  app.post('/api/v1/validation/url', async (req, res, next) => {
    try {
      const dto: UrlContentDto = req.body;

      if (config?.urlMatchRegex && !dto.url.match(config.urlMatchRegex)) {
        throw new RapLPBaseApiError(
          'Invalid Request',
          'The requested address failed the allowed url pattern. Contact your administrator if you think this is a misstake.',
          ERROR_TYPE.BAD_REQUEST,
        );
      }

      const response = await fetch(dto.url, config?.customFetchConfig);

      const yamlContentString = await response.text();

      validateYamlInput(yamlContentString);

      const apiSpecDocument = new Document(yamlContentString, Parsers.Yaml, '');

      const rules = await importAndCreateRuleInstances(dto.categories);

      const result = await processApiSpec(rules, apiSpecDocument);
      res.send(result);
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
