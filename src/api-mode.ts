import express from 'express';
import { importAndCreateRuleInstances } from "./util/ruleUtil.ts"; // Import the helper function
import { registerValidationRoutes } from './routes/validate.ts';
import { errorHadler } from './util/RapLPCustomApiError.ts';
import bodyParser from 'body-parser';

// Funktion för att starta API-servern
export async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  const rules = await importAndCreateRuleInstances();
  app.use(bodyParser.text({type: "text/plain"}))
  // API Endpoint, t.ex. för att validera en YAML-fil
  registerValidationRoutes(app, rules);

  // Middleware för att mappa interna error till HTTP koder.
  app.use(errorHadler)

  app.listen(port, () => {
    console.log(`Servern körs på http://localhost:${port}`);
  });
}