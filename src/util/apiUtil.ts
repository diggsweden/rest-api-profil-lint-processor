// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import * as fs from 'node:fs';
import { RapLPCustomSpectral } from './RapLPCustomSpectral.js';
import { Document } from '@stoplight/spectral-core';
import Parsers from '@stoplight/spectral-parsers';
import { ERROR_TYPE, RapLPBaseApiError } from './RapLPBaseApiErrorHandling.js';
import { DiagnosticReport, RapLPDiagnostic } from '../util/RapLPDiagnostic.js';
import { ValidationResponseDto } from '../model/ValidationResponseDto.js';
import { RuleExecutionContext } from './RuleExecutionContext.js';
import { AggregateError } from '../util/RapLPCustomErrorInfo.js'

const LOG_TARGET = process.env.LOG_TARGET ?? "stderr"; // LOG_TARGET=stderr should be default mode in container. Use LOG_TARGET=file to activate a mode that support writing to disc!

function writeLog(fileName: string, message: string) {
  console.log('LOG_TARGET=', LOG_TARGET);

  if (LOG_TARGET === "file") {
    fs.appendFileSync(fileName, message);
    return;
  }

  console.error(message.trimEnd());
}

declare var AggregateError: {
  prototype: AggregateError;
  new (errors: any[], message?: string): AggregateError;
};

export function decodeBase64String(base64YamlFile: string) {
  // Import the necessary Node.js module (Buffer is built-in)
  const atob = (b64String: string): string => Buffer.from(b64String, 'base64').toString('utf-8');

  // Decode the base64 string
  const decodedYaml = atob(base64YamlFile);

  return decodedYaml;
}

export async function processApiSpec(
  context: RuleExecutionContext,
  enabledRulesAndCategorys: {
    rules: Record<string, any>;
    instanceCategoryMap: Map<string, any>;
  },
  apiSpecDocument: Document<unknown, Parsers.YamlParserResult<unknown>>,
): Promise<ValidationResponseDto> {
  const customSpectral = new RapLPCustomSpectral();
  customSpectral.setCategorys(enabledRulesAndCategorys.instanceCategoryMap);
  customSpectral.setRuleset(enabledRulesAndCategorys.rules);
  const result = await customSpectral.run(apiSpecDocument);


  const customDiagnostic = new RapLPDiagnostic(context);
  customDiagnostic.processRuleExecutionInformation(result, enabledRulesAndCategorys.rules,enabledRulesAndCategorys.instanceCategoryMap);
  const diagnosticReports: DiagnosticReport[] = customDiagnostic.processDiagnosticInformation();

  const sortedReports: DiagnosticReport[] = diagnosticReports.map(report => ({
  ...report,
  regler: [...report.regler].sort((a, b) => a.id.localeCompare(b.id))
  }));
  return { result, report: sortedReports };
}

/**
 * https://oida.dev/typescript-hasownproperty/
 * @param obj Object to check
 * @param prop Property to check for
 * @returns Boolean
 */
export function hasOwnProperty<X extends {}, Y extends PropertyKey>(obj: X, prop: Y): obj is X & Record<Y, unknown> {
  return obj.hasOwnProperty(prop);
}
/**
 * Log error. Either to stderr or to disc!
 * @param error 
 */
export function logError(error:any) {
  const errorMessage = `${new Date().toISOString()} - ${error.stack ?? error}\n`;
  writeLog("rap-lp-api-mode-error.log", errorMessage);

  if (error.errors) {
    const detailedMessage = `${new Date().toISOString()} - ${JSON.stringify(error.errors, null, 2)}\n`;
    writeLog("rap-lp-api-mode-error.log", detailedMessage);
  }

  if (error instanceof AggregateError) {
    error.errors.forEach((err: any, index: number) => {
      const causeMessage = `Cause ${index + 1}: ${err.stack || err}\n`;
      writeLog("rap-lp-api-mode-error.log", causeMessage);
    });
  }  
}
/*
export function logErrorToFile(error: any) {
  const errorMessage = `${new Date().toISOString()} - ${error.stack}\n`;
  fs.appendFileSync('rap-lp-api-mode-error.log', errorMessage);
  if (error.errors) {
    const detailedMessage = `${new Date().toISOString()} - ${JSON.stringify(error.errors, null, 2)}\n`;
    fs.appendFileSync('rap-lp-error.log', detailedMessage);
  }
  if (error instanceof AggregateError) {
    error.errors.forEach((err: any, index: number) => {
      const causeMessage = `Cause ${index + 1}: ${err.stack || err}\n`;
      fs.appendFileSync('rap-lp-api-mode-error.log', causeMessage);
    });
  }
}
  */
