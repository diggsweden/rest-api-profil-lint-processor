// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import * as SpectralCore from '@stoplight/spectral-core';
import { ruleExecutionStatus, RuleExecutionLog, ruleExecutionLogDictionary } from './RuleExecutionStatusModule.js';
import { ISpectralDiagnostic } from '@stoplight/spectral-core';
import spectralCore from '@stoplight/spectral-core';
const { Spectral, Document } = spectralCore;
import { RapLPCustomSpectralDiagnostic } from './RapLPCustomSpectralDiagnostic.js';

class RapLPCustomSpectral {
  private spectral: SpectralCore.Spectral;
  private rules: Record<string, any>;
  private enabledRules: EnabledRules = {
    rules: {},
  };
  private instanceCategoryMap: Map<string, any>;
  constructor() {
    this.spectral = new Spectral();
    this.rules = {};
    this.instanceCategoryMap = new Map<string, any>();
  }
  setRuleset(enabledRules: Record<string, any>): void {
    this.enabledRules.rules = enabledRules;
    this.spectral.setRuleset(this.enabledRules);
  }
  setCategorys(instanceCategoryMap: Map<string, any>): void {
    this.instanceCategoryMap = instanceCategoryMap;
  }
  async run(document: any): Promise<RapLPCustomSpectralDiagnostic[]> {
    const spectralResults = await this.spectral.run(document);
    const modifiedResults = this.modifyResults(spectralResults);
    return this.modifyResults(spectralResults);
  }

  private modifyRuleset(enabledRules: EnabledRules): Record<string, any> {
    return enabledRules.rules;
  }
  private modifyResults(results: ISpectralDiagnostic[]): RapLPCustomSpectralDiagnostic[] {
    const customResults: RapLPCustomSpectralDiagnostic[] = []; // Initialize
    for (const result of results) {
      const ruleName = result.code as string;
      for (const ruleObject of Object.values(this.enabledRules)) {
        if (ruleObject && Object.keys(ruleObject).includes(ruleName)) {
          const ruleInstance = ruleObject[ruleName];
          const ruleClass = this.instanceCategoryMap.get(ruleName);
          if (ruleClass && typeof ruleClass.getCustomProperties === 'function') {
            // Check for existance
            const customProperties = ruleClass.getCustomProperties;
            const customResult: RapLPCustomSpectralDiagnostic = {
              id: ruleClass.customProperties.id,
              område: ruleClass.customProperties.område,
              ...customProperties, // For more copy
              ...this.mapResultToCustom(result),
            };
            customResults.push(customResult);
            break; // Break the loop once a match is found
          }
        }
      }
    }
    return customResults;
  }
  private mapResultToCustom(result: ISpectralDiagnostic): RapLPCustomSpectralDiagnostic {
    // Map properties from result ISpectralDiagnostic to CustomSpectralDiagnostic
    const { message, code, severity, path, source, range, ...rest } = result;

    // Map severity to corresponding string value for allvarlighetsgrad
    let allvarlighetsgrad: string;
    switch (severity) {
      case 0:
        allvarlighetsgrad = 'ERROR';
        break;
      case 1:
        allvarlighetsgrad = 'WARNING';
        break;
      case 2:
        allvarlighetsgrad = 'INFORMATION';
        break;
      case 3:
        allvarlighetsgrad = 'HINT';
        break;
      default:
        allvarlighetsgrad = ''; // Handle other cases if needed
    }
    return {
      ...rest,

      krav: message,
      allvarlighetsgrad,
      sökväg: path,
      omfattning: range,
    };
  }
}
export { RapLPCustomSpectral };
/**
 * Own defined interface to extend ISpectralDiagnostic.
 * The interface also extends the omit type in order to 'remove' some fields from the iSpectralDiagnostic
 */
interface EnabledRules {
  rules: Record<string, any>;
}
