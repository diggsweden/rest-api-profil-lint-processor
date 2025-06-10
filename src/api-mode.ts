import express from "express";
import { registerValidationRoutes } from "./routes/validate.ts";
import {
  registerUrlValidationFallbackRoutes,
  registerUrlValidationRoutes,
} from "./routes/urlValidation.ts";
import { errorHandler } from "./util/RapLPBaseApiErrorHandling.ts";
import OpenApiValidator from "express-openapi-validator";
import path from "path";

export type ApiArgs = {
  enableUrlValidation?: boolean;
  urlValidationConfigFile?: string;
};

// Funktion för att starta API-servern
export async function startServer<T extends ApiArgs>(args: T) {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(
    "/api/v1/openapi.yaml",
    express.static(path.join(process.cwd(), "openapi.yaml"))
  );

  // For the case of content upload
  app.use(express.json());
  // Path to your OpenAPI spec
  const apiSpec = path.join(process.cwd(), "openapi.yaml");

 // Initialize OpenAPI Validator middleware
  app.use(
    OpenApiValidator.middleware({
      apiSpec, // Path to OpenAPI spec
      validateRequests: true, // Automatically validate request bodies
      validateResponses: true, // Automatically validate responses
    })
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
    console.log(`Servern körs på http://localhost:${port}`);
  });
}
