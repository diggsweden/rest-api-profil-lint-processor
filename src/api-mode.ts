// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import express from 'express';
import { registerValidationRoutes } from './routes/validate.js';
import { registerUrlValidationFallbackRoutes, registerUrlValidationRoutes } from './routes/urlValidation.js';
import { errorHandler } from './util/RapLPBaseApiErrorHandling.js';
import OpenApiValidator from 'express-openapi-validator';
import path from 'path';

export type ApiArgs = {
  enableUrlValidation?: boolean;
  urlValidationConfigFile?: string;
};

// Funktion för att starta API-servern
export async function startServer<T extends ApiArgs>(args: T) {
  const app = express();
  const DEFAULT_PORT = 3000;

  const port = Number(
    process.env.RAP_LP_PORT ?? DEFAULT_PORT,
  );
  const bodyLimit = process.env.RAP_LP_JSON_BODY_LIMIT || '3mb';

  app.use('/api/v1/rap-lp-openapi.yaml', express.static(path.join(process.cwd(), 'rap-lp-openapi.yaml')));

  // For the case of content upload
  app.use(express.json({ limit: bodyLimit }));
  // Path to your OpenAPI spec
  const apiSpec = path.join(process.cwd(), 'rap-lp-openapi.yaml');

  // Initialize OpenAPI Validator middleware
  app.use(
    OpenApiValidator.middleware({
      apiSpec, // Path to OpenAPI spec
      validateRequests: true, // Automatically validate request bodies
      validateResponses: true, // Automatically validate responses
      ignorePaths: /\/api\/v1\/validation\/validatespec/,
    }),
  );

  // API Endpoint, t.ex. för att validera en YAML-fil
  registerValidationRoutes(app);

  if (args.enableUrlValidation) {
    registerUrlValidationRoutes(app, args.urlValidationConfigFile);
  } else {
    registerUrlValidationFallbackRoutes(app);
  }

  // Middleware för att mappa interna error till HTTP koder.
  app.use(errorHandler);

  return app.listen(port, () => {
    console.log(`Servern startad. Lyssnar på port ${port}.`);
  });
}
