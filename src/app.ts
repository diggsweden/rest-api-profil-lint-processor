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
import yargs from 'yargs';
import * as path from 'node:path';
import * as fs from 'node:fs';
import Parsers from '@stoplight/spectral-parsers';
import { importAndCreateRuleInstances, getRuleModules } from './util/ruleUtil.js'; // Import the helper function
import util from 'util';
import { RapLPCustomSpectral } from './util/RapLPCustomSpectral.js';
import { DiagnosticReport, RapLPDiagnostic } from './util/RapLPDiagnostic.js';
import { AggregateError } from './util/RapLPCustomErrorInfo.js';
import chalk from 'chalk';
import { ExcelReportProcessor } from './util/excelReportProcessor.js';
import { parseApiSpecInput,detectSpecFormatPreference,semanticValidate, ParseResult} from './util/validateUtil.js';
import { SpecParseError } from './util/RapLPSpecParseError.js';
import type { IParser } from '@stoplight/spectral-parsers';
import { Document as SpectralDocument } from '@stoplight/spectral-core';
import { Issue } from './util/RapLPIssueHelpers.js';

declare var AggregateError: {
  prototype: AggregateError;
  new (errors: any[], message?: string): AggregateError;
};
const writeFileAsync = util.promisify(fs.writeFile);
const appendFileAsync = util.promisify(fs.appendFile);



async function main(): Promise<void> {
  try {
    // Parse command-line arguments using yargs
    const argv = await yargs(process.argv.slice(2))
      .version('1.0.0')
      .option('file', {
        alias: 'f',
        describe: 'Sökväg till OpenAPI specifikation(yaml,json)',
        demandOption: true,
        type: 'string',
        coerce: (file: string) => path.resolve(file),
      })
       .option('categories', {
      alias: 'c',
      describe: `Regelkategorier separerade med kommatecken.Tillgängliga kategorier: ${getRuleModules().join(',')}`,
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
    }).option('strict', {
      describe: 
        'Aktivera strict mode för validering av semantik och struktur.',
      type: 'boolean',
      default: false,
    }).argv;

    // Extract arguments from yargs
    const apiSpecFileName = (argv.file as string) || '';
    const ruleCategories = argv.categories ? (argv.categories as string).split(',') : undefined;
    const logErrorFilePath = argv.logError as string | undefined;
    const logDiagnosticFilePath = argv.logDiagnostic as string | undefined;
    const disableSanity = argv.disableSanity as boolean ?? false;
    const strict = argv.strict as boolean ?? false;

    // Schemevalidation and Spectral  Document creation ----------
    let apiSpecDocument: SpectralDocument;
    let parseResult: any;
    try {
      // NOTE: use filePath (camelCase)
      const prefer = detectSpecFormatPreference(apiSpecFileName,undefined,'auto');
      parseResult = await parseApiSpecInput(
          {filePath: apiSpecFileName},{
            strict: strict,
            preferJsonError: prefer
          }
      );
      if (parseResult.strictIssues && parseResult.strictIssues.length > 0) {
         console.error('Strict validation reported issues:');
          parseResult.strictIssues.forEach((iss: Issue) =>
            console.error(chalk.yellow(`- ${iss.type} at ${iss.path} : ${iss.message} ${iss.line ? `(line ${iss.line})` : ''}`)),
            //console.error(`- ${iss.type} at ${iss.path} : ${iss.message} ${iss.line ? `(line ${iss.line})` : ''}`),
          );
          process.exitCode = 2;
          return;
      }
    } catch (err: any) {
      // Hantering av parse-fel (behåll din logik men använd return; nu innanför main())
      if (err instanceof SpecParseError) {
        const formattedDate = new Date().toISOString();
        const logData = {
          timeStamp: formattedDate,
          message: 'Fel vid parsing av API-specifikationen.',
          error: err.toJSON ? err.toJSON() : { message: String(err) },
        };

        if (logErrorFilePath) {
          try {
            let existingLogs: any[] = [];
            if (argv.append && fs.existsSync(logErrorFilePath)) {
              const fileContent = await fs.promises.readFile(logErrorFilePath, 'utf8');
              try {
                existingLogs = JSON.parse(fileContent);
                if (!Array.isArray(existingLogs)) existingLogs = [existingLogs];
              } catch {
                existingLogs = [];
              }
            }
            existingLogs.push(logData);
            const updatedContent = JSON.stringify(existingLogs, null, 2);
            await writeFileAsync(logErrorFilePath, Buffer.from(updatedContent, 'utf8'));
            console.log(chalk.green(`Parserfel loggat till ${logErrorFilePath}`));
          } catch (fileErr: any) {
            console.error(chalk.red('Misslyckades att skriva parserfel till loggfilen:'), fileErr.message);
          }
        } else {
          // No log file specified - write to stdout
          console.error(chalk.red('<<< Parserfel i API-specifikationen >>>'));
          console.error(chalk.red(`Fel: ${err.message}`));
          if (err.line || err.column) {
            console.error(chalk.yellow(`Rad: ${err.line ?? '-'}, Kolumn: ${err.column ?? '-'}`));
          }
          if (err.snippet && !err.message.includes(err.snippet)) {
            console.error(chalk.gray('--- snippet ---'));
            console.error(chalk.gray(err.snippet));
            console.error(chalk.gray('---------------'));
          }
        }

        process.exitCode = 1;
        return; // terminate main gracefully
      }

      // Övrigt oväntat fel
      logErrorToFile(err);
      console.error(chalk.red('Ett fel uppstod vid inläsning/parsing av spec-filen. Se felloggen för mer information.'));
      process.exitCode = 1;
      return;
    }

  try {
    // Import and create rule instances in RAP-LP
    const enabledRulesAndCategorys = await importAndCreateRuleInstances(ruleCategories);
    // Load API specification into a Document object
    try {
      /**
       * CustomSpectral
       */
      const customSpectral = new RapLPCustomSpectral();
      customSpectral.setCategorys(enabledRulesAndCategorys.instanceCategoryMap);
      customSpectral.setRuleset(enabledRulesAndCategorys.rules);
      //Use previous parseResult 
      const parser: IParser<any> = (parseResult.format === 'json' ? Parsers.Json : Parsers.Yaml) as unknown as IParser<any>;
      apiSpecDocument = new SpectralDocument(parseResult.raw, parser, apiSpecFileName);

      // Run ruleengine
      const result = await customSpectral.run(apiSpecDocument);

      const customDiagnostic = new RapLPDiagnostic();
      customDiagnostic.processRuleExecutionInformation(result, enabledRulesAndCategorys.instanceCategoryMap);
      const diagnosticReports: DiagnosticReport[] = customDiagnostic.processDiagnosticInformation();

      if (argv.dex != null) {
        const reportHandler = new ExcelReportProcessor({
          outputFilePath: argv.dex,
        });
        reportHandler.generateReportDocument(customDiagnostic);
      }

      /**
       * Chalk impl.
       * @param allvarlighetsgrad
       * @returns
       */
      // Run Spectral on the API specification and log the result
      const colorizeSeverity = (allvarlighetsgrad: string) => {
        switch (allvarlighetsgrad) {
          case 'ERROR': // Error
            return chalk.red('Error');
          case 'WARNING': // Warning
            return chalk.yellow('Warning');
          case 'HINT': // Info
            return chalk.greenBright('Hint');
          default:
            return chalk.white('Info');
        }
      };
      const formatLintingResult = (result: any) => {
        return `allvarlighetsgrad: ${colorizeSeverity(result.allvarlighetsgrad)} \nid: ${result.id} \nkrav: ${result.krav} \nområde: ${result.område} \nsökväg:[${result.sökväg}] \nomfattning:${JSON.stringify(result.omfattning, null, 2)} `;
      };
      //Check specified option from yargs input

      const currentDate = new Date(); //.toISOString(); // Get current date and time in ISO format
      const formattedDate = `${currentDate.getFullYear()}-${padZero(currentDate.getMonth() + 1)}-${padZero(currentDate.getDate())} ${padZero(currentDate.getHours())}:${padZero(currentDate.getMinutes())}:${padZero(currentDate.getSeconds())}`;

      function padZero(num: number): string {
        return num < 10 ? `0${num}` : `${num}`;
      }
      if (logDiagnosticFilePath) {
        //Check if we gonna construct logData for diagnostic information
        let logData: any;
        logData = {
          timeStamp: formattedDate,
          result: diagnosticReports,
        };
        let logEntry = JSON.stringify(logData, null, 2) + '\n'; // Properly formatted JSON
        let utf8EncodedContent = Buffer.from(logEntry, 'utf8');

        //Log to disc
        await writeFileAsync(logDiagnosticFilePath, utf8EncodedContent);
        console.log(chalk.green(`Skriver diagnostiseringsinformation från RAP-LP till ${logDiagnosticFilePath}`));
      } else {
        //Log to STDOUT
        if (
          customDiagnostic.diagnosticInformation.executedUniqueRules != undefined &&
          customDiagnostic.diagnosticInformation.executedUniqueRules.length > 0
        ) {
          console.log(chalk.green('<<<Verkställda och godkända regler - RAP-LP>>>\r'));
          console.log(chalk.whiteBright('STATUS\tOMRÅDE') + ' / ' + chalk.whiteBright('IDENTIFIKATIONSNUMMER'));
          customDiagnostic.diagnosticInformation.executedUniqueRules.forEach((item) => {
            console.log(chalk.bgGreen('OK') + '\t' + item.område + ' / ' + item.id);
          });
        }
        if (
          customDiagnostic.diagnosticInformation.executedUniqueRulesWithError != undefined &&
          customDiagnostic.diagnosticInformation.executedUniqueRulesWithError.length > 0
        ) {
          console.log(chalk.green('<<<Verkställda och ej godkända regler - RAP-LP>>>\r'));
          console.log(chalk.whiteBright('STATUS\tOMRÅDE') + ' / ' + chalk.whiteBright('IDENTIFIKATIONSNUMMER'));
          customDiagnostic.diagnosticInformation.executedUniqueRulesWithError.forEach((item) => {
            console.log(chalk.bgRed('EJ OK') + '\t' + item.område + ' / ' + item.id);
          });
        }
        if (
          customDiagnostic.diagnosticInformation.notApplicableRules != undefined &&
          customDiagnostic.diagnosticInformation.notApplicableRules.length > 0
        ) {
          console.log(chalk.grey('<<<Ej tillämpade regler - RAP-LP>>>\r'));
          console.log(chalk.whiteBright('STATUS\tOMRÅDE') + ' / ' + chalk.whiteBright('IDENTIFIKATIONSNUMMER'));
          customDiagnostic.diagnosticInformation.notApplicableRules.forEach((item) => {
            console.log(chalk.bgGrey('N/A') + '\t' + item.område + '/' + item.id);
          });
        }
      }
      if (logErrorFilePath) {
        //Check if we gonna construct some logData for logging purpose
        let content: string;
        let logData: any;

        if (!result || result.length === 0) {
          logData = {
            timeStamp: formattedDate,
            message: 'Inga valideringsfel förekom.',
          };
        } else {
          logData = {
            timestamp: formattedDate,
            message: 'Valideringsfel upptäcktes. Detaljer följer nedan.',
            errors: result,
          };
        }
        try {
          if (argv.append) {
            // Check for appending logging information
            let existingLogs: any[] = [];

            if (fs.existsSync(logErrorFilePath)) {
              // Does any previous file exists?
              const fileContent = await fs.promises.readFile(logErrorFilePath, 'utf8');
              try {
                existingLogs = JSON.parse(fileContent); // Parse json into object
                if (!Array.isArray(existingLogs)) {
                  existingLogs = [existingLogs]; // Only one object
                }
              } catch {
                // No JSON-file  → Ignore
                existingLogs = [];
              }
            }
            existingLogs.push(logData); // Push on stack
            const updatedContent = JSON.stringify(existingLogs, null, 2);
            await writeFileAsync(logErrorFilePath, Buffer.from(updatedContent, 'utf8'));
          } else {
            const content = JSON.stringify([logData], null, 2); // skriv alltid som array
            await writeFileAsync(logErrorFilePath, Buffer.from(content, 'utf8'));
          }
          console.log(chalk.green(`Skriver inspektion/valideringsinformation från RAP-LP till ${logErrorFilePath}`));
        } catch (fileError: any) {
          logErrorToFile(fileError);
          console.error(chalk.red('Misslyckades att skriva till loggfilen!'));
        }
      } else {
        console.log(chalk.whiteBright('\n<<Regelutfall RAP-LP>>\n'));
        if (!result || result.length === 0) {
          console.log(chalk.green('Inga valideringsfel förekom.'));
        } else {
          result.forEach((item) => console.log(formatLintingResult(item)));
        }
      }
    } catch (spectralError: any) {
      logErrorToFile(spectralError); // Log stack
      console.error(
        chalk.red(
          'Ett fel uppstod vid initiering/körning av regelklasser! Undersök felloggen för RAP-LP för mer information om felet',
        ),
      );
    }
  } catch (initializingError: any) {
    logErrorToFile(initializingError);
    console.error(
      chalk.red(
        'Ett fel uppstod vid inläsning av moduler och skapande av regelklasser! Undersök felloggen för RAP-LP för mer information om felet',
      ),
    );
  }    
  } catch (error: any) {
    logErrorToFile(error);
    console.error(
      chalk.red('Ett oväntat fel uppstod! Undersök felloggen för RAP-LP för mer information om felet', error.message),
    );
    process.exitCode = 1;
  }
}
// Kör main och fånga oväntade promise-rejections
main().catch((err) => {
  logErrorToFile(err);
  console.error(chalk.red('Oväntat fel i main:'), err);
  process.exitCode = 1;
});


function logErrorToFile(error: any) {
  const errorMessage = `${new Date().toISOString()} - ${error.stack}\n`;
  fs.appendFileSync('rap-lp-error.log', errorMessage);
  if (error.errors) {
    const detailedMessage = `${new Date().toISOString()} - ${JSON.stringify(error.errors, null, 2)}\n`;
    fs.appendFileSync('rap-lp-error.log', detailedMessage);
  }
  if (error instanceof AggregateError) {
    error.errors.forEach((err: any, index: number) => {
      const causeMessage = `Cause ${index + 1}: ${err.stack || err}\n`;
      fs.appendFileSync('rap-lp-error.log', causeMessage);
    });
  }
}

