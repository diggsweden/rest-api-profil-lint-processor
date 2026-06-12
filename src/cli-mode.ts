// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import * as fs from 'node:fs';
import { join } from 'path';
import Parsers from '@stoplight/spectral-parsers';
import { Document } from '@stoplight/spectral-core';
import { importAndCreateRuleInstances, getRuleModules } from './util/ruleUtil.js'; // Import the helper function
import util from 'util';
import { RapLPCustomSpectral } from './util/RapLPCustomSpectral.js';
import { DiagnosticReport, RapLPDiagnostic } from './util/RapLPDiagnostic.js';
import { AggregateError } from './util/RapLPCustomErrorInfo.js';
import chalk from 'chalk';
import { ExcelReportProcessor } from './util/excelReportProcessor.js';

import type { IParser } from '@stoplight/spectral-parsers';
import { Document as SpectralDocument } from '@stoplight/spectral-core';
import { Issue } from './util/Issue.js';
import { parseApiSpecInput,detectSpecFormatPreference, ParseResult} from './util/validateUtil.js';
import { SpecParseError } from './util/RapLPSpecParseError.js';
import * as path from 'node:path';
import { RuleExecutionContext } from './util/RuleExecutionContext.js';
import { parseRuleCategories,resolveRuleCategories } from './rulesets/util/ruleModules.js';

declare var AggregateError: {
  prototype: AggregateError;
  new (errors: any[], message?: string): AggregateError;
};

const writeFileAsync = util.promisify(fs.writeFile);
const appendFileAsync = util.promisify(fs.appendFile);

export type CliArgs = {
  file?: string;
  categories?: string;
  logError?: string;
  append: boolean;
  logDiagnostic?: string;
  dex?: string;
  strict?: boolean;
};

export async function execCLI<T extends CliArgs>(argv: T) {
  try {
    // Parse command-line arguments using yargs
    const apiSpecFileName = (argv.file as string) || '';
    //const ruleCategories = argv.categories ? (argv.categories as string).split(',') : undefined;
    const ruleCategories = parseRuleCategories(argv.categories as string | undefined);
    const resolvedCategories = resolveRuleCategories(ruleCategories);
    const logErrorFilePath = argv.logError as string | undefined;
    const logDiagnosticFilePath = argv.logDiagnostic as string | undefined;
    const strict = argv.strict as boolean ?? false;
    const context = new RuleExecutionContext();


    // Schemevalidation and Spectral  Document creation ----------
    let apiSpecDocument: SpectralDocument;
    let parseResult: ParseResult;
    try {
      const prefer = detectSpecFormatPreference(apiSpecFileName,undefined,'auto');
      parseResult = await parseApiSpecInput(
          {filePath: apiSpecFileName},{
            strict: strict,
            preferJsonError: prefer
          }
      );

    // Issue handling ----------
      if (parseResult.strictIssues && parseResult.strictIssues.length > 0) {
         console.error('Strict validation reported issues:');
          parseResult.strictIssues.forEach((iss: Issue) =>
              console.error(chalk.yellow(`- ${iss.type} at ${iss.path} : ${iss.message} ${iss.line ? `(line ${iss.line})` : ''}`)),
          );
          process.exitCode = 2;
          return;
      }
    } catch (err: any) {
      // Parse handling
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
      const enabledRulesAndCategorys = await importAndCreateRuleInstances(context,resolvedCategories);
      // Load API specification into a Document object
      const parser: IParser<any> = (parseResult.format === 'json' ? Parsers.Json : Parsers.Yaml) as unknown as IParser<any>;
      apiSpecDocument = new SpectralDocument(parseResult.raw, parser, apiSpecFileName);
      try {
        /**
         * CustomSpectral
         */
        const customSpectral = new RapLPCustomSpectral();
        customSpectral.setCategorys(enabledRulesAndCategorys.instanceCategoryMap);
        customSpectral.setRuleset(enabledRulesAndCategorys.rules);
        const result = await customSpectral.run(apiSpecDocument);

        const customDiagnostic = new RapLPDiagnostic(context);
        customDiagnostic.processRuleExecutionInformation(result, enabledRulesAndCategorys.rules,enabledRulesAndCategorys.instanceCategoryMap);
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
          return `\nallvarlighetsgrad: ${colorizeSeverity(result.severity)} \nid: ${result.id} \nkrav: ${
            result.requirement
          } \nområde: ${result.area} \nsökväg:[${result.path}] \nomfattning:${JSON.stringify(
            result.range,
            null,
            2,
          )}\ndesignregel: ${result.helpUrl} `;
        };
        //Check specified option from yargs input

        const currentDate = new Date(); //.toISOString(); // Get current date and time in ISO format
        const formattedDate = `${currentDate.getFullYear()}-${padZero(currentDate.getMonth() + 1)}-${padZero(
          currentDate.getDate(),
        )} ${padZero(currentDate.getHours())}:${padZero(currentDate.getMinutes())}:${padZero(
          currentDate.getSeconds(),
        )}`;

        function padZero(num: number): string {
          return num < 10 ? `0${num}` : `${num}`;
        }
        if (logDiagnosticFilePath) {
          let allDiagnosticReports = JSON.stringify(diagnosticReports, null, 2);
          let logEntry = `${formattedDate}\n${allDiagnosticReports}\n`; // Prepend datestamp to log entry
          let utf8EncodedContent = Buffer.from(logEntry, 'utf8');
          //Log to disc
          await writeFileAsync(logDiagnosticFilePath, utf8EncodedContent);
          console.log(chalk.green(`Skriver diagnostiseringsinformation från RAP-LP till ${logDiagnosticFilePath}`));
        } else {
          //STDOUT
          if (
            customDiagnostic.diagnosticInformation.executedUniqueRules != undefined &&
            customDiagnostic.diagnosticInformation.executedUniqueRules.length > 0
          ) {
            console.log(chalk.green('<<<Verkställda och godkända regler - RAP-LP>>>\r'));
            console.log(chalk.whiteBright('STATUS\tOMRÅDE') + ' / ' + chalk.whiteBright('IDENTIFIKATIONSNUMMER'));
            customDiagnostic.diagnosticInformation.executedUniqueRules
              .sort((a, b) => a.id.localeCompare(b.id, 'sv'))
              .forEach((item) => {
                console.log(chalk.bgGreen('OK') + '\t' + item.area + ' / ' + item.id);
              });
          }
          if (
            customDiagnostic.diagnosticInformation.executedUniqueRulesWithError != undefined &&
            customDiagnostic.diagnosticInformation.executedUniqueRulesWithError.length > 0
          ) {
            console.log(chalk.green('<<<Verkställda och ej godkända regler - RAP-LP>>>\r'));
            console.log(chalk.whiteBright('STATUS\tOMRÅDE') + ' / ' + chalk.whiteBright('IDENTIFIKATIONSNUMMER'));
            customDiagnostic.diagnosticInformation.executedUniqueRulesWithError
              .sort((a, b) => a.id.localeCompare(b.id, 'sv'))
              .forEach((item) => {
                console.log(chalk.bgRed('EJ OK') + '\t' + item.area + ' / ' + item.id);
              });
          }
          if (
            customDiagnostic.diagnosticInformation.notApplicableRules != undefined &&
            customDiagnostic.diagnosticInformation.notApplicableRules.length > 0
          ) {
            console.log(chalk.grey('<<<Ej tillämpade regler - RAP-LP>>>\r'));
            console.log(chalk.whiteBright('STATUS\tOMRÅDE') + ' / ' + chalk.whiteBright('IDENTIFIKATIONSNUMMER'));
            customDiagnostic.diagnosticInformation.notApplicableRules
              .sort((a, b) => a.id.localeCompare(b.id, 'sv'))
              .forEach((item) => {
                console.log(chalk.bgGrey('N/A') + '\t' + item.area + '/' + item.id);
              });
          }
        }
        if (logErrorFilePath) {
          let content = JSON.stringify(result, null, 2);
          let logEntry = `${formattedDate}\n${content}\n`; // Prepend datestamp to log entry
          let utf8EncodedContent = Buffer.from(logEntry, 'utf8');
          if (argv.append) {
            await appendFileAsync(logErrorFilePath, utf8EncodedContent);
            console.log(chalk.green(`Skriver inspektion/valideringsinformation från RAP-LP till ${logErrorFilePath}`));
          } else {
            //Log to disc
            await writeFileAsync(logErrorFilePath, utf8EncodedContent);
            console.log(chalk.green(`Skriver inspektion/valideringsinformation från RAP-LP till ${logErrorFilePath}`));
          }
        } else {
          //Verbose error logging goes here with detailed result
          console.log(chalk.whiteBright('\n<<Regelutfall RAP-LP>> \n'));
          result
            .sort((a, b) => {
              const idA = a.id ?? '';
              const idB = b.id ?? '';
              return idA.localeCompare(idB, 'sv');
            })
            .forEach((item) => {
              console.log(formatLintingResult(item));
            });
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
  }
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
  
}
