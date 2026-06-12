// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import * as SpectralCore from '@stoplight/spectral-core';
import { ISpectralDiagnostic } from '@stoplight/spectral-core';
import spectralCore from '@stoplight/spectral-core';
const { Spectral, Document } = spectralCore;
import { RapLPCustomSpectralDiagnostic } from './RapLPCustomSpectralDiagnostic.js';
import { buildRuleHelpUrl } from '../rulesets/util/rules-doc.config.js';

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
    return this.modifyResults(spectralResults);
  }
  async runSemanticValidation(document: any): Promise<ISpectralDiagnostic[]> {
    return await this.spectral.run(document);
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
            const ruleId = ruleClass.customProperties.id;   

            const customResult: RapLPCustomSpectralDiagnostic = {
              id: ruleId,
              area: ruleClass.customProperties.område,
              helpUrl: ruleId ? buildRuleHelpUrl(ruleId) : undefined,
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
    const { message, code, severity: spectralSeverity, path, source, range, ...rest } = result;

    // Map severity to corresponding string value for allvarlighetsgrad
    let severity: string;
    switch (spectralSeverity) {
      case 0:
        severity = 'ERROR';
        break;
      case 1:
        severity = 'WARNING';
        break;
      case 2:
        severity = 'INFORMATION';
        break;
      case 3:
        severity = 'HINT';
        break;
      default:
        severity = ''; // Handle other cases if needed
    }
    return {
      ...rest,

      requirement: message,
      severity,
      path: path,
      range: range,
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
