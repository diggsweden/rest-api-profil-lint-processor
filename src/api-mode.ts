// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import * as fs from 'node:fs';
import express from 'express';
import { registerValidationRoutes } from './routes/validate.js';
import { registerUrlValidationFallbackRoutes, registerUrlValidationRoutes } from './routes/urlValidation.js';
import { errorHandler } from './util/RapLPBaseApiErrorHandling.js';
import OpenApiValidator from 'express-openapi-validator';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { registerHealthRoutes } from './routes/health.js';
import { localeFromAcceptLanguage } from './i18n.js';
import { StatisticsService } from './statistics/StatisticsService.js';
import { SqliteStatisticsStore } from './statistics/SqliteStatisticsStore.js';
import { registerStatisticsRoutes } from './routes/statistics.js';

export type ApiArgs = {
  enableUrlValidation?: boolean;
  urlValidationConfigFile?: string;
};

// Starts the API server and registers all middleware and routes.
export async function startServer<T extends ApiArgs>(args: T) {
  const app = express();
  const DEFAULT_PORT = 3000;

  const port = Number(process.env.RAP_LP_PORT ?? DEFAULT_PORT);
  const bodyLimit = process.env.RAP_LP_JSON_BODY_LIMIT || '3mb';
  
  let statisticsService: StatisticsService | undefined;

  if (StatisticsService.isStatisticsEnabled()) {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    const service = new StatisticsService(new SqliteStatisticsStore(), pkg.version);
    await service.start();
    statisticsService = service;

    // Middleware for request statistics
    app.use((req, res, next) => {
      res.locals.statsStart = process.hrtime.bigint();
      res.on('finish', () => service.recordRequest(req, res));
      next();
    });
  }
  
  app.use((req, res, next) => {
    res.locals.locale = localeFromAcceptLanguage(req.header('Accept-Language'));
    res.append('Vary', 'Accept-Language');
    next();
  });

  app.use(
    '/api/v1/docs',
    swaggerUi.serve,
    swaggerUi.setup(null, {
      swaggerOptions: {
        url: '/api/v1/rap-lp-openapi.yaml',
      },
    }),
  );
  app.use('/api/v1/rap-lp-openapi.yaml', express.static(path.join(process.cwd(), 'rap-lp-openapi.yaml')));

  registerStatisticsRoutes(app, statisticsService);

  // For the case of content upload
  app.use(express.json({ limit: bodyLimit }));
  // Path to your OpenAPI spec
  const apiSpec = path.join(process.cwd(), 'rap-lp-openapi.yaml');

  // Initialize OpenAPI Validator middleware
  app.use(
    OpenApiValidator.middleware({
      apiSpec, // Path to OpenAPI spec
      validateRequests: true, // Automatically validate request bodies
      validateResponses: true, // Automatically validate response bodies
      ignorePaths: /\/api\/v1\/validation\/validatespec/,
    }),
  );

  // API endpoints, e.g. for validating a YAML file
  registerValidationRoutes(app, statisticsService);

  // Health endpoints
  registerHealthRoutes(app);

  if (args.enableUrlValidation) {
    registerUrlValidationRoutes(app, args.urlValidationConfigFile, statisticsService);
  } else {
    registerUrlValidationFallbackRoutes(app);
  }

  // Middleware to map internal errors to HTTP status codes.
  app.use(errorHandler);

  const server = app.listen(port, () => {
    console.log(`Server started. Listening on port ${port}.`);
  });

  process.once('SIGTERM', () => {
    console.log('SIGTERM received, shutting down.');
    server.close(async () => {
      await statisticsService?.stop();
      process.exit(0);
    });
  });

  return server;
}
