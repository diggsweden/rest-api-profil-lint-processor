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
import { resolveLocale, translator } from './i18n.js';
import { cliLocale } from './cliLocale.js';

async function main() {
  const rawArgs = hideBin(process.argv);
  const t = translator(cliLocale(rawArgs));

  const argv = await yargs(rawArgs)
    .version('1.2.0')
    .option('mode', {
      alias: 'm',
      describe: t('cli.help.mode'),
      choices: ['api'],
    })
    .option('file', {
      alias: 'f',
      describe: t('cli.help.file'),
      type: 'string',
      coerce: (file: string) => path.resolve(file), // convert to absolute path
    })
    .option('categories', {
      alias: 'c',
      describe: `${t('cli.help.categories')}\n${t('cli.help.availableCategories')}\r ${getRuleModules().join(',')}`,
      type: 'string',
    })
    .option('logError', {
      alias: 'l',
      describe: t('cli.help.logError'),
      type: 'string',
    })
    .option('append', {
      alias: 'a',
      describe: t('cli.help.append'),
      type: 'boolean',
      default: false,
    })
    .option('logDiagnostic', {
      alias: 'd',
      describe: t('cli.help.logDiagnostic'),
      type: 'string',
    })
    .option('dex', {
      describe: t('cli.help.dex'),
      type: 'string',
    })
    .option('enableUrlValidation', {
      type: 'boolean',
      describe: t('cli.help.enableUrlValidation'),
    })
    .option('urlValidationConfigFile', {
      type: 'string',
      describe: t('cli.help.urlValidationConfigFile'),
    })
    .option('strict', {
      describe: t('cli.help.strict'),
      type: 'boolean',
      default: false,
    })
    .option('lang', {
      describe: t('cli.help.lang'),
      choices: ['sv', 'en'],
      type: 'string',
    })
    .check(function (argv) {
      if (argv.mode !== 'api') {
        if (!argv.file) {
          throw new Error(translator(resolveLocale(argv.lang ?? process.env.RAP_LP_LANG))('cli.missingFile'));
        }
        return true;
      }

      if (argv.mode === 'api') {
        const apiForbiddenArgs = new Set(['f', 'c', 'dex']);
        const hasForbiddenArgs = Object.keys(argv).filter(
          (k) => apiForbiddenArgs.has(k) && Object.prototype.hasOwnProperty.call(argv, k),
        );

        if (hasForbiddenArgs.length > 0) {
          throw new Error(t('cli.apiModeForbiddenArgs'));
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
  const t = translator(cliLocale(hideBin(process.argv)));
  console.error(`${t('cli.unexpectedError')}:`, err);
});
