// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { RapLPCustomSpectral } from './RapLPCustomSpectral.js';
import { Document } from '@stoplight/spectral-core';
import Parsers from '@stoplight/spectral-parsers';
import { ERROR_TYPE, RapLPBaseApiError } from './RapLPBaseApiErrorHandling.js';
import { DiagnosticReport, RapLPDiagnostic } from '../util/RapLPDiagnostic.js';
import yaml from 'js-yaml';
import { ValidationResponseDto } from '../model/ValidationResponseDto.js';
import { RuleExecutionContext } from './RuleExecutionContext.js';

export const validateYamlInput = (input: string): input is string => {
  try {
    //Parse the yaml to verify
    yaml.load(input);
  } catch (e) {
    // Handle YAML parsing error
    throw new RapLPBaseApiError('Could not validate Yaml', 'Invalid YAML', ERROR_TYPE.BAD_REQUEST);
  }

  return true;
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
