// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import * as fs from 'node:fs';
import Parsers from '@stoplight/spectral-parsers';
import { importAndCreateRuleInstances } from './util/ruleUtil.js'; // Import the helper function
import util from 'util';
import { RapLPCustomSpectral } from './util/RapLPCustomSpectral.js';
import { DiagnosticReport, RapLPDiagnostic } from './util/RapLPDiagnostic.js';
import { AggregateError } from './util/RapLPCustomErrorInfo.js';
import chalk from 'chalk';
import { ExcelReportProcessor } from './util/excelReportProcessor.js';

import type { IParser } from '@stoplight/spectral-parsers';
import { Document as SpectralDocument } from '@stoplight/spectral-core';
import { parseApiSpecInput, detectSpecFormatPreference, ParseResult } from './util/validateUtil.js';
import { SpecParseError } from './util/RapLPSpecParseError.js';
import { RuleExecutionContext } from './util/RuleExecutionContext.js';
import { parseRuleCategories, resolveRuleCategories } from './rulesets/util/ruleModules.js';
import { resolveLocale, translator } from './i18n.js';
import { ExitCode } from './util/exitCodes.js';
import { calculateConformance, findUnmetCriteria } from './util/exitCriteria.js';
import i18next from 'i18next';
import {
  printOkRules,
  printNaRules,
  printNokRules,
  printSummary,
  printStrictIssues,
  printVerboseResult,
} from './util/cliOutput.js';

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
  lang?: string;
  failOnError?: boolean;
  failOnWarning?: boolean;
  minConformance?: number;
  verbose?: boolean;
};

export async function execCLI<T extends CliArgs>(argv: T) {
  const locale = resolveLocale(argv.lang ?? process.env.RAP_LP_LANG);
  await i18next.changeLanguage(locale);
  const t = translator(locale);
  try {
    // Parse command-line arguments using yargs
    const apiSpecFileName = (argv.file as string) || '';
    const ruleCategories = parseRuleCategories(argv.categories as string | undefined);
    const resolvedCategories = resolveRuleCategories(ruleCategories);
    const logErrorFilePath = argv.logError as string | undefined;
    const logDiagnosticFilePath = argv.logDiagnostic as string | undefined;
    const strict = (argv.strict as boolean) ?? false;

    const context = new RuleExecutionContext(locale);

    // Schemevalidation and Spectral  Document creation ----------
    let apiSpecDocument: SpectralDocument;
    let parseResult: ParseResult;
    try {
      const prefer = detectSpecFormatPreference(apiSpecFileName, undefined, 'auto');
      parseResult = await parseApiSpecInput(
        { filePath: apiSpecFileName },
        {
          strict: strict,
          preferJsonError: prefer,
        },
        context,
      );

      // Issue handling ----------
      if (parseResult.strictIssues && parseResult.strictIssues.length > 0) {
        printStrictIssues(parseResult.strictIssues);
        process.exitCode = ExitCode.SpecValidationFailed;
        return;
      }
    } catch (err: any) {
      // Parse handling
      if (err instanceof SpecParseError) {
        const formattedDate = new Date().toISOString();
        const logData = {
          timeStamp: formattedDate,
          message: t('cli.parseError'),
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
            console.log(chalk.green(t('cli.parserErrorLogged', { path: logErrorFilePath })));
          } catch (fileErr: any) {
            console.log(chalk.red(t('cli.parserLogWriteFailed')), fileErr.message);
            process.exitCode = ExitCode.InternalError;
          }
        } else {
          // No log file specified - write to stdout
          console.log(chalk.red(t('cli.parserErrorHeader')));
          console.log(chalk.red(`${t('cli.errorLabel')}: ${err.message}`));
          if (err.line || err.column) {
            console.log(
              chalk.yellow(`${t('cli.lineLabel')}: ${err.line ?? '-'}, ${t('cli.columnLabel')}: ${err.column ?? '-'}`),
            );
          }
          if (err.snippet && !err.message.includes(err.snippet)) {
            console.log(chalk.gray('--- snippet ---'));
            console.log(chalk.gray(err.snippet));
            console.log(chalk.gray('---------------'));
          }
        }

        process.exitCode ??= ExitCode.SpecValidationFailed; // a failed log write above takes precedence
        return; // terminate main gracefully
      }

      // Övrigt oväntat fel
      logErrorToFile(err);
      console.log(chalk.red(t('cli.parseOrReadError')));
      process.exitCode = ExitCode.InternalError;
      return;
    }

    try {
      // Import and create rule instances in RAP-LP
      const enabledRulesAndCategorys = await importAndCreateRuleInstances(context, resolvedCategories);
      // Load API specification into a Document object
      const parser: IParser<any> = (parseResult.format === 'json'
        ? Parsers.Json
        : Parsers.Yaml) as unknown as IParser<any>;
      apiSpecDocument = new SpectralDocument(parseResult.raw, parser, apiSpecFileName);
      try {
        /**
         * CustomSpectral
         */
        const customSpectral = new RapLPCustomSpectral(context);
        customSpectral.setCategorys(enabledRulesAndCategorys.instanceCategoryMap);
        customSpectral.setRuleset(enabledRulesAndCategorys.rules);
        const result = await customSpectral.run(apiSpecDocument);

        const customDiagnostic = new RapLPDiagnostic(context);
        customDiagnostic.processRuleExecutionInformation(
          result,
          enabledRulesAndCategorys.rules,
          enabledRulesAndCategorys.instanceCategoryMap,
        );
        const diagnosticReports: DiagnosticReport[] = customDiagnostic.processDiagnosticInformation();
        if (argv.dex != null) {
          try {
            const reportHandler = new ExcelReportProcessor({
              outputFilePath: argv.dex,
            });
            reportHandler.generateReportDocument(customDiagnostic);
            if (reportHandler.lockedFilePath) {
              console.log(
                chalk.yellow(
                  t('cli.excelReport.fileLocked', {
                    lockedFilePath: reportHandler.lockedFilePath,
                    outputFilePath: reportHandler.outputFilePath,
                  }),
                ),
              );
            } else if (reportHandler.isBasedOnExistingFile) {
              console.log(chalk.green(t('cli.excelReport.updating', { filePath: reportHandler.outputFilePath })));
            } else {
              console.log(chalk.green(t('cli.excelReport.writing', { filePath: reportHandler.outputFilePath })));
            }
            if (reportHandler.isBasedOnExistingFile) {
              const { templateProfileVersion, fileProfileVersion } = reportHandler;
              if (!fileProfileVersion) {
                console.log(
                  chalk.yellow(
                    t('cli.excelReport.unknownFileProfileVersion', {
                      templateVersion: templateProfileVersion ?? t('cli.excelReport.unknownVersion'),
                    }),
                  ),
                );
              } else if (templateProfileVersion && fileProfileVersion !== templateProfileVersion) {
                console.log(
                  chalk.yellow(
                    t('cli.excelReport.profileVersionMismatch', {
                      fileVersion: fileProfileVersion,
                      templateVersion: templateProfileVersion,
                    }),
                  ),
                );
              }
              if (reportHandler.missingRules.length > 0) {
                console.log(
                  chalk.yellow(t('cli.excelReport.missingRules', { rules: reportHandler.missingRules.join(', ') })),
                );
              }
            }
            if (reportHandler.keptInProgressRules.length > 0) {
              console.log(
                chalk.yellow(
                  t('cli.excelReport.keptInProgress', { rules: reportHandler.keptInProgressRules.join(', ') }),
                ),
              );
            }
            if (reportHandler.resolvedInProgressRules.length > 0) {
              console.log(
                chalk.green(
                  t('cli.excelReport.resolvedInProgress', { rules: reportHandler.resolvedInProgressRules.join(', ') }),
                ),
              );
            }
          } catch (excelError: any) {
            logErrorToFile(excelError);
            console.log(chalk.red(t('cli.excelReport.writeFailed', { message: excelError.message })));
            process.exitCode = ExitCode.InternalError;
          }
        }

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
          console.log(chalk.green(t('cli.diagnosticOutput', { filePath: logDiagnosticFilePath })));
        } else {
          //STDOUT, approved and not applicable rules are only listed in verbose mode
          if (
            argv.verbose &&
            customDiagnostic.diagnosticInformation.executedUniqueRules != undefined &&
            customDiagnostic.diagnosticInformation.executedUniqueRules.length > 0
          ) {
            printOkRules(customDiagnostic.diagnosticInformation.executedUniqueRules);
          }
          if (
            customDiagnostic.diagnosticInformation.executedUniqueRulesWithError != undefined &&
            customDiagnostic.diagnosticInformation.executedUniqueRulesWithError.length > 0
          ) {
            printNokRules(customDiagnostic.diagnosticInformation.executedUniqueRulesWithError);
          }
          if (
            argv.verbose &&
            customDiagnostic.diagnosticInformation.notApplicableRules != undefined &&
            customDiagnostic.diagnosticInformation.notApplicableRules.length > 0
          ) {
            printNaRules(customDiagnostic.diagnosticInformation.notApplicableRules);
          }
        }
        if (logErrorFilePath) {
          let content = JSON.stringify(result, null, 2);
          let logEntry = `${formattedDate}\n${content}\n`; // Prepend datestamp to log entry
          let utf8EncodedContent = Buffer.from(logEntry, 'utf8');
          if (argv.append) {
            await appendFileAsync(logErrorFilePath, utf8EncodedContent);
            console.log(chalk.green(t('cli.validationOutput', { filePath: logErrorFilePath })));
          } else {
            //Log to disc
            await writeFileAsync(logErrorFilePath, utf8EncodedContent);
            console.log(chalk.green(t('cli.validationOutput', { filePath: logErrorFilePath })));
          }
        } else if (argv.verbose) {
          //Verbose error logging goes here with detailed result
          printVerboseResult(result);
        }

        const outcome = {
          passed: customDiagnostic.diagnosticInformation.executedUniqueRules?.length ?? 0,
          failed: customDiagnostic.diagnosticInformation.executedUniqueRulesWithError?.length ?? 0,
        };
        const notApplicable = customDiagnostic.diagnosticInformation.notApplicableRules?.length ?? 0;
        printSummary(outcome, notApplicable);
        const activeCriteria = (['failOnError', 'failOnWarning', 'minConformance'] as const).filter((flag) =>
          flag === 'minConformance' ? argv.minConformance !== undefined : argv[flag],
        );
        const requirements = activeCriteria.map((flag) =>
          t(`cli.criteria.requirement.${flag}`, { threshold: argv.minConformance }),
        );
        const conformanceLines = [
          ...(outcome.passed + outcome.failed > 0
            ? [
                t('cli.ruleExecution.summaryConformance', {
                  conformance: calculateConformance(outcome),
                  passed: outcome.passed,
                  executed: outcome.passed + outcome.failed,
                }),
              ]
            : []),
          ...(requirements.length > 0
            ? [`${t('cli.criteria.requirementsLabel')}:`, ...requirements.map((requirement) => `  - ${requirement}`)]
            : []),
        ];
        if (conformanceLines.length > 0) {
          console.log(`\n${conformanceLines.join('\n')}`);
        }

        const unmetCriteria = findUnmetCriteria(result, outcome, {
          failOnError: argv.failOnError,
          failOnWarning: argv.failOnWarning,
          minConformance: argv.minConformance,
        });
        if (activeCriteria.length > 0) {
          console.log('');
        }
        activeCriteria.forEach((flag) => {
          const unmet = unmetCriteria.find((criterion) => criterion.flag === flag);
          if (!unmet) {
            console.log(
              chalk.green(
                t(`cli.criteria.${flag}Met`, {
                  conformance: calculateConformance(outcome),
                  threshold: argv.minConformance,
                }),
              ),
            );
            return;
          }
          const message =
            unmet.flag === 'minConformance'
              ? t('cli.criteria.minConformanceNotMet', {
                  conformance: unmet.conformance,
                  threshold: unmet.threshold,
                })
              : t(`cli.criteria.${unmet.flag}NotMet`, { rules: unmet.ruleIds.join(', ') });
          console.log(chalk.red(message));
        });
        if (unmetCriteria.length > 0) {
          process.exitCode ??= ExitCode.CriteriaNotMet;
        }
        if (!argv.verbose && (!logDiagnosticFilePath || !logErrorFilePath)) {
          console.log(chalk.gray(`\n${t('cli.ruleExecution.verboseHint')}`));
        }
      } catch (spectralError: any) {
        logErrorToFile(spectralError); // Log stack
        console.log(chalk.red(t('cli.ruleClassExecutionError')));
        process.exitCode = ExitCode.InternalError;
      }
    } catch (initializingError: any) {
      logErrorToFile(initializingError);
      console.log(chalk.red(t('cli.ruleModuleLoadingError')));
      process.exitCode = ExitCode.InternalError;
    }
  } catch (error: any) {
    logErrorToFile(error);
    console.log(chalk.red(`${t('cli.unexpectedError')} ${t('cli.inspectLog')}`, error.message));
    process.exitCode = ExitCode.InternalError;
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
