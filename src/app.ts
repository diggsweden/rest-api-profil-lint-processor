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
import * as fs from "node:fs";
import * as path from "node:path";
import { join } from "path";
import Parsers from "@stoplight/spectral-parsers";
import spectralCore from "@stoplight/spectral-core";
import { importAndCreateRuleInstances, getRuleModules } from "./util/ruleUtil.ts"; // Import the helper function
import util from 'util';
import {RapLPCustomSpectral} from "./util/RapLPCustomSpectral.ts";
import chalk from 'chalk';

const { Spectral, Document } = spectralCore;
const writeFileAsync = util.promisify(fs.writeFile);
const appendFileAsync = util.promisify(fs.appendFile);

try {
  // Parse command-line arguments using yargs
  const argv = await yargs(process.argv.slice(2)).version("1.2.0")
    .option("file", {
      alias: "f",
      describe: "Path to the YAML file",
      demandOption: true,
      type: "string",
      coerce: (file: string) => path.resolve(file), // convert to absolute path
    })
    .option("categories", {
      alias: "c",
      describe: `Rule categories separated by commas.\nAvailable categories:\r ${getRuleModules().join(",")}`,
      type: "string",
    })
    .option('log', {
      alias: 'l',
      describe: 'Path to the log file. If not provided, logs will be printed to stdout.',
      type: 'string',
    })
    .option("append", {
      alias: "a",
      describe: "Append log information to the log file (if specified).",
      type: "boolean",
      default: false,
    }).argv;

  // Extract arguments from yargs
  const apiSpecFileName = (argv.file as string) || "";
  const ruleCategories = argv.categories ? (argv.categories as string).split(",") : undefined;
  const logFilePath = argv.log as string | undefined;
  try {
    // Import and create rule instances in RAP-LP
    const enabledRulesAndCategorys = await importAndCreateRuleInstances(ruleCategories);
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
    customSpectral.setCategorys(enabledRulesAndCategorys.instanceCategoryMap);
    customSpectral.setRuleset(enabledRulesAndCategorys.rules);
    const result = await customSpectral.run(apiSpecDocument);

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
        return `allvarlighetsgrad: ${colorizeSeverity(result.allvarlighetsgrad)} \nid: ${result.id} \nkrav: ${result.krav} \nområde: ${result.område} \nsökväg:[${result.sökväg}] \nomfattning:${JSON.stringify(result.omfattning,null,2)} `;
      };
      const content = JSON.stringify(result, null, 2);
      //Check specified option from yargs input
      if (logFilePath) {
        const utf8EncodedContent = Buffer.from(content, 'utf8');
        if (argv.append) {
          await appendFileAsync(logFilePath,utf8EncodedContent);
          console.log(chalk.green(`Appending linting results from RAP-LP to ${logFilePath}`));
        }else {
        //Log to disc
        await writeFileAsync(logFilePath,utf8EncodedContent);
        console.log(chalk.green(`Writing linting results from RAP-LP to ${logFilePath}`));
        }
      }else {
        //Log to stdout
        console.log('<<Regelutfall RAP-LP>> \n');
        result.forEach(item => {
          console.log(formatLintingResult(item));
        });
      }
    } catch (spectralError: any) {
      console.error(chalk.red("Error running Spectral:", spectralError));
    }
  } catch (ruleError: any) {
    console.error(chalk.red("Error importing and creating rule instances:", ruleError));
  }
} catch (yargsError: any) {
  console.error(chalk.red("Error parsing command-line arguments:", yargsError.message));
}