import express from 'express';
import { registerValidationRoutes } from './routes/validate.ts';
import { errorHandler } from './util/RapLPBaseApiError.ts';
import OpenApiValidator from 'express-openapi-validator';
import path from "path";

// Funktion för att starta API-servern
export async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use('/api/v1/openapi.yaml', express.static(path.join(process.cwd(), 'openapi.yaml')));

  // For the case of content upload
  app.use(express.json())
  // Path to your OpenAPI spec
  const apiSpec = path.join(process.cwd(), 'openapi.yaml');

  // Initialize OpenAPI Validator middleware
app.use(
  OpenApiValidator.middleware({
    apiSpec,              // Path to OpenAPI spec
    validateRequests: true,  // Automatically validate request bodies
    validateResponses: true, // Automatically validate responses
  })
);

  // API Endpoint, t.ex. för att validera en YAML-fil
  registerValidationRoutes(app);

  // Middleware för att mappa interna error till HTTP koder.
  app.use(errorHandler)

  return app.listen(port, () => {
    console.log(`Servern körs på http://localhost:${port}`);
  });
}