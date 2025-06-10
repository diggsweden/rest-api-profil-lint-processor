// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

/*************************************************************
 *
 *                        RAP-LP
 *            Rest Api Profil - Lint Processor
 *
 *    Linter for the swedish Rest API profile specification
 *    REST API-profil
 *    https://dev.dataportal.se/rest-api-profil
 *
 **************************************************************/

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { execCLI } from './cli-mode.ts';
import { startServer } from './api-mode.ts';
import * as path from "node:path";
import { getRuleModules } from "./util/ruleUtil.ts";

async function main() {
    const argv = await yargs(hideBin(process.argv)).version("1.2.0")
    .option('mode', {
      alias: 'm',
      describe: 'Körläget för applikationen (cli eller api)',
      choices: ['cli', 'api'],
      demandOption: true,
    })
    .option("file", {
      alias: "f",
      describe: "[cli mode] Path to the YAML file",
      type: "string",
      coerce: (file: string) => path.resolve(file), // convert to absolute path
    })
    .option("categories", {
      alias: "c",
      describe: `[cli mode] Regelkategorier separerade med kommatecken.\nAvailable categories:\r ${getRuleModules().join(",")}`,
      type: "string",
    })
    .option("logError", {
      alias: "l",
      describe: 'Sökväg till fil med information för eventuell felloggningsinformation från RAP-LP. Om ej specificerad, så kommer felet att skrivas ut till stdout.',
      type: 'string',
    })
    .option("append", {
      alias: "a",
      describe: "Utöka loginformationen i filen för felloggningsiformation. Utökda loginformation till befintlig fil för loggning av fel( om specificerad ).",
      type: "boolean",
      default: false,
    })  
    .option("logDiagnostic", {
      alias: "d",
      describe: 'Sökväg till fil för diagnostiseringsinformation från  RAP-LP. Om en specificerad, så kommer diagnostiseringsinformationen att skrivas ut till angiven fil i JSON format.',
      type: 'string',
    })
    .option("dex", {
      describe: 'Sökväg till fil för diagnostiseringsinformation från  RAP-LP. Om en specificerad, så kommer diagnostiseringsinformationen att skrivas ut till angiven fil i Excel format.',
      type: 'string',
    })
    .option("enableUrlValidation", {
      type: 'boolean',
      describe: "[api-mode] Möjliggör validering av filer givet url."
    })
    .option("urlValidationConfigFile", {
      type: 'string',
      describe: "[api-mode] Sökväg till fil för configuration av urlValidation funktionalliteten faller tillbaka på ./urlValidationConfig.cjs",
    })
    .check(function (argv) {
      if (!argv.mode) {
        console.error('Missing required argument: mode ')
      }
      if (argv.mode === 'cli' && !argv.file) {
          console.error('Missing required argument for cli mode: file')
          return false;
      }
      else if(argv.mode === 'api') {
        if (argv.file) {
          console.error('Argument "file" is only applicable in CLI mode')
          return false;
        }

        if(argv.categories) {
          console.error(`Argument "categories" is only applicable in CLI mode`)
          return false
        }
      }
      return true;
  })
  .argv;

  const mode = argv.mode;
  
  if (mode === 'cli') {
    await execCLI(argv); // Starta CLI-läget
  } else if (mode === 'api') {
    startServer(argv); // Starta API-läget
  }
}

// Starta huvudprocessen
main().catch((err) => {
  console.error("Ett oväntat fel uppstod:", err);
});