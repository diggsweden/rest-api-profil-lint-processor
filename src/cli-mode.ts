import * as fs from "node:fs";
import { join } from "path";
import Parsers from "@stoplight/spectral-parsers";
import { Document } from "@stoplight/spectral-core";
import { importAndCreateRuleInstances } from "./util/ruleUtil.ts"; // Import the helper function
import util from "util";
import { RapLPCustomSpectral } from "./util/RapLPCustomSpectral.ts";
import { DiagnosticReport, RapLPDiagnostic } from "./util/RapLPDiagnostic.ts";
import { AggregateError } from "./util/RapLPCustomErrorInfo.ts";
import chalk from "chalk";

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
};

export async function execCLI<T extends CliArgs>(argv: T) {
  try {
    // Parse command-line arguments using yargs

    const apiSpecFileName = (argv.file as string) || "";
    const ruleCategories = argv.categories
      ? (argv.categories as string).split(",")
      : undefined;
    const logErrorFilePath = argv.logError as string | undefined;
    const logDiagnosticFilePath = argv.logDiagnostic as string | undefined;
    try {
      // Import and create rule instances in RAP-LP
      const enabledRulesAndCategorys = await importAndCreateRuleInstances(
        ruleCategories
      );
      // Load API specification into a Document object
      const apiSpecDocument = new Document(
        fs.readFileSync(join(apiSpecFileName), "utf-8").trim(),
        Parsers.Yaml,
        apiSpecFileName
      );
      try {
        /**
         * CustomSpectral
         */
        const customSpectral = new RapLPCustomSpectral();
        customSpectral.setCategorys(
          enabledRulesAndCategorys.instanceCategoryMap
        );
        customSpectral.setRuleset(enabledRulesAndCategorys.rules);
        const result = await customSpectral.run(apiSpecDocument);

        const customDiagnostic = new RapLPDiagnostic();
        customDiagnostic.processRuleExecutionInformation(
          result,
          enabledRulesAndCategorys.instanceCategoryMap
        );
        const diagnosticReports: DiagnosticReport[] =
          customDiagnostic.processDiagnosticInformation();
        /**
         * Chalk impl.
         * @param allvarlighetsgrad
         * @returns
         */
        // Run Spectral on the API specification and log the result
        const colorizeSeverity = (allvarlighetsgrad: string) => {
          switch (allvarlighetsgrad) {
            case "ERROR": // Error
              return chalk.red("Error");
            case "WARNING": // Warning
              return chalk.yellow("Warning");
            case "HINT": // Info
              return chalk.greenBright("Hint");
            default:
              return chalk.white("Info");
          }
        };
        const formatLintingResult = (result: any) => {
          return `allvarlighetsgrad: ${colorizeSeverity(
            result.allvarlighetsgrad
          )} \nid: ${result.id} \nkrav: ${result.krav} \nområde: ${
            result.omrade
          } \nsökväg:[${result.sokvag}] \nomfattning:${JSON.stringify(
            result.omfattning,
            null,
            2
          )} `;
        };
        //Check specified option from yargs input

        const currentDate = new Date(); //.toISOString(); // Get current date and time in ISO format
        const formattedDate = `${currentDate.getFullYear()}-${padZero(
          currentDate.getMonth() + 1
        )}-${padZero(currentDate.getDate())} ${padZero(
          currentDate.getHours()
        )}:${padZero(currentDate.getMinutes())}:${padZero(
          currentDate.getSeconds()
        )}`;

        function padZero(num: number): string {
          return num < 10 ? `0${num}` : `${num}`;
        }
        if (logDiagnosticFilePath) {
          let allDiagnosticReports = JSON.stringify(diagnosticReports, null, 2);
          let logEntry = `${formattedDate}\n${allDiagnosticReports}\n`; // Prepend datestamp to log entry
          let utf8EncodedContent = Buffer.from(logEntry, "utf8");
          //Log to disc
          await writeFileAsync(logDiagnosticFilePath, utf8EncodedContent);
          console.log(
            chalk.green(
              `Skriver diagnostiseringsinformation från RAP-LP till ${logDiagnosticFilePath}`
            )
          );
        } else {
          //STDOUT
          if (
            customDiagnostic.diagnosticInformation.executedUniqueRules !=
              undefined &&
            customDiagnostic.diagnosticInformation.executedUniqueRules.length >
              0
          ) {
            console.log(
              chalk.green("<<<Verkställda och godkända regler - RAP-LP>>>\r")
            );
            console.log(
              chalk.whiteBright("STATUS\tOMRÅDE") +
                " / " +
                chalk.whiteBright("IDENTIFIKATIONSNUMMER")
            );
            customDiagnostic.diagnosticInformation.executedUniqueRules.forEach(
              (item) => {
                console.log(
                  chalk.bgGreen("OK") + "\t" + item.omrade + " / " + item.id
                );
              }
            );
          }
          if (
            customDiagnostic.diagnosticInformation
              .executedUniqueRulesWithError != undefined &&
            customDiagnostic.diagnosticInformation.executedUniqueRulesWithError
              .length > 0
          ) {
            console.log(
              chalk.green("<<<Verkställda och ej godkända regler - RAP-LP>>>\r")
            );
            console.log(
              chalk.whiteBright("STATUS\tOMRÅDE") +
                " / " +
                chalk.whiteBright("IDENTIFIKATIONSNUMMER")
            );
            customDiagnostic.diagnosticInformation.executedUniqueRulesWithError.forEach(
              (item) => {
                console.log(
                  chalk.bgRed("EJ OK") + "\t" + item.omrade + " / " + item.id
                );
              }
            );
          }
          if (
            customDiagnostic.diagnosticInformation.notApplicableRules !=
              undefined &&
            customDiagnostic.diagnosticInformation.notApplicableRules.length > 0
          ) {
            console.log(chalk.grey("<<<Ej tillämpade regler - RAP-LP>>>\r"));
            console.log(
              chalk.whiteBright("STATUS\tOMRÅDE") +
                " / " +
                chalk.whiteBright("IDENTIFIKATIONSNUMMER")
            );
            customDiagnostic.diagnosticInformation.notApplicableRules.forEach(
              (item) => {
                console.log(
                  chalk.bgGrey("N/A") + "\t" + item.omrade + "/" + item.id
                );
              }
            );
          }
        }
        if (logErrorFilePath) {
          let content = JSON.stringify(result, null, 2);
          let logEntry = `${formattedDate}\n${content}\n`; // Prepend datestamp to log entry
          let utf8EncodedContent = Buffer.from(logEntry, "utf8");
          if (argv.append) {
            await appendFileAsync(logErrorFilePath, utf8EncodedContent);
            console.log(
              chalk.green(
                `Skriver inspektion/valideringsinformation från RAP-LP till ${logErrorFilePath}`
              )
            );
          } else {
            //Log to disc
            await writeFileAsync(logErrorFilePath, utf8EncodedContent);
            console.log(
              chalk.green(
                `Skriver inspektion/valideringsinformation från RAP-LP till ${logErrorFilePath}`
              )
            );
          }
        } else {
          //Verbose error logging goes here with detailed result
          console.log(chalk.whiteBright("\n<<Regelutfall RAP-LP>> \n"));
          result.forEach((item) => {
            console.log(formatLintingResult(item));
          });
        }
      } catch (spectralError: any) {
        logErrorToFile(spectralError); // Log stack
        console.error(
          chalk.red(
            "Ett fel uppstod vid initiering/körning av regelklasser! Undersök felloggen för RAP-LP för mer information om felet"
          )
        );
      }
    } catch (initializingError: any) {
      logErrorToFile(initializingError);
      console.error(
        chalk.red(
          "Ett fel uppstod vid inläsning av moduler och skapande av regelklasser! Undersök felloggen för RAP-LP för mer information om felet"
        )
      );
    }
  } catch (error: any) {
    logErrorToFile(error);
    console.error(
      chalk.red(
        "Ett oväntat fel uppstod! Undersök felloggen för RAP-LP för mer information om felet",
        error.message
      )
    );
  }
  function logErrorToFile(error: any) {
    const errorMessage = `${new Date().toISOString()} - ${error.stack}\n`;
    fs.appendFileSync("rap-lp-error.log", errorMessage);
    if (error.errors) {
      const detailedMessage = `${new Date().toISOString()} - ${JSON.stringify(
        error.errors,
        null,
        2
      )}\n`;
      fs.appendFileSync("rap-lp-error.log", detailedMessage);
    }
    if (error instanceof AggregateError) {
      error.errors.forEach((err: any, index: number) => {
        const causeMessage = `Cause ${index + 1}: ${err.stack || err}\n`;
        fs.appendFileSync("rap-lp-error.log", causeMessage);
      });
    }
  }
}
