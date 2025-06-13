// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
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
import * as path from 'node:path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { startServer } from './api-mode.js';
import { execCLI } from './cli-mode.js';
import { getRuleModules } from './util/ruleUtil.js';

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .version('1.2.0')
    .option('mode', {
      alias: 'm',
      describe: 'Körläget för applikationen api',
      choices: ['api'],
    })
    .option('file', {
      alias: 'f',
      describe: '[cli mode] Path to the YAML file',
      type: 'string',
      coerce: (file: string) => path.resolve(file), // convert to absolute path
    })
    .option('categories', {
      alias: 'c',
      describe: `[cli mode] Regelkategorier separerade med kommatecken.\nAvailable categories:\r ${getRuleModules().join(
        ',',
      )}`,
      type: 'string',
    })
    .option('logError', {
      alias: 'l',
      describe:
        'Sökväg till fil med information för eventuell felloggningsinformation från RAP-LP. Om ej specificerad, så kommer felet att skrivas ut till stdout.',
      type: 'string',
    })
    .option('append', {
      alias: 'a',
      describe:
        'Utöka loginformationen i filen för felloggningsiformation. Utökda loginformation till befintlig fil för loggning av fel( om specificerad ).',
      type: 'boolean',
      default: false,
    })
    .option('logDiagnostic', {
      alias: 'd',
      describe:
        'Sökväg till fil för diagnostiseringsinformation från  RAP-LP. Om en specificerad, så kommer diagnostiseringsinformationen att skrivas ut till angiven fil i JSON format.',
      type: 'string',
    })
    .option('dex', {
      describe:
        'Sökväg till fil för diagnostiseringsinformation från  RAP-LP. Om en specificerad, så kommer diagnostiseringsinformationen att skrivas ut till angiven fil i Excel format.',
      type: 'string',
    })
    .option('enableUrlValidation', {
      type: 'boolean',
      describe: '[api-mode] Möjliggör validering av filer givet url.',
    })
    .option('urlValidationConfigFile', {
      type: 'string',
      describe:
        '[api-mode] Sökväg till fil för configuration av urlValidation funktionalliteten faller tillbaka på ./urlValidationConfig.cjs',
    })
    .check(function (argv) {
      if (argv.mode !== 'api') {
        if (!argv.file) {
          throw new Error('Saknar obligatoriskt argument för cli-läge: --file <path>');
        }
        return true;
      }

      if (argv.mode === 'api') {
        const apiForbiddenArgs = new Set(['f', 'c', 'dex']);
        const hasForbiddenArgs = Object.keys(argv).filter(
          (k) => apiForbiddenArgs.has(k) && Object.prototype.hasOwnProperty.call(argv, k),
        );

        if (hasForbiddenArgs.length > 0) {
          throw new Error('I API-läge är endast --enableUrlValidation och --urlValidationConfigFile tillåtna. ');
        }
      }

      return true;
    }).argv;

  const mode = argv.mode;

  if (mode === 'api') {
    startServer(argv); // Starta API-läget
  } else {
    await execCLI(argv); // Starta CLI-läget
  }
}

// Starta huvudprocessen
main().catch((err) => {
  console.error('Ett oväntat fel uppstod:', err);
});