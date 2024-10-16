import express from 'express';
import { importAndCreateRuleInstances } from "./util/ruleUtil.ts"; // Import the helper function
import { registerValidationRoutes } from './routes/validate.ts';
import { errorHandler } from './util/RapLPCustomApiError.ts';
import bodyParser from 'body-parser';

// Funktion för att starta API-servern
export async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  const rules = await importAndCreateRuleInstances();

  // For the case of content upload
  app.use(bodyParser.text({type: "application/x-yaml"}))


  // API Endpoint, t.ex. för att validera en YAML-fil
  registerValidationRoutes(app, rules);

  // Middleware för att mappa interna error till HTTP koder.
  app.use(errorHandler)

  return app.listen(port, () => {
    console.log(`Servern körs på http://localhost:${port}`);
  });
}