// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { ruleExecutionStatus, RuleExecutionLog, ruleExecutionLogDictionary } from './RuleExecutionStatusModule.js';
import { RapLPCustomSpectralDiagnostic } from './RapLPCustomSpectralDiagnostic.js';

class RapLPDiagnostic {
  private _ruleSets: DiagnosticRuleinfoSet = {
    //--- Diagnostic information
    notApplicableRules: [],
    executedUniqueRules: [],
    executedUniqueRulesWithError: [],
  };
  public get diagnosticInformation(): DiagnosticRuleinfoSet {
    return this._ruleSets;
  }
  constructor() {}
  processRuleExecutionInformation(
    raplpCustomResult: RapLPCustomSpectralDiagnostic[],
    instanceCategoryMap: Map<string, any>,
  ): void {
    this.processRuleExecutionLog(ruleExecutionLogDictionary, raplpCustomResult, instanceCategoryMap);
  }
  private processRuleExecutionLog(
    log: RuleExecutionLog,
    spectralResults: RapLPCustomSpectralDiagnostic[],
    instanceCategoryMap: Map<string, any>,
  ) {
    let executedRuleIds = new Set<string>(); // Set to track executed rule IDs
    let executedRuleIdsWithError = new Set<string>(); // Set to track executed rule IDs with error
    let ruleIdsNotApplicable = new Set<string>(); // Set to track rules that are not applicable, that is the (Δ) between the two above sets

    for (const key in log) {
      const rules = log[key];
      const { moduleName, className } = rules[0]; // Get module and class name from the first entry

      //console.log(`Rule execution status for ${moduleName}:${className}:`);

      rules.forEach((rule) => {
        const { customProperties, severity, passed, targetVal } = rule;
        const status = passed ? 'PASSED' : 'FAILED';
        const severityText = severity.toUpperCase();
        // Check if rule is found in Spectral results
        const spectralResult = spectralResults.find((result) => {
          return result.område === customProperties.område && result.id === customProperties.id;
        });
        if (spectralResult) {
          //We have a match, that means there is an error
          if (executedRuleIdsWithError != undefined && executedRuleIdsWithError.size >= 0) {
            if (!executedRuleIdsWithError.has(customProperties.id)) {
              this._ruleSets.executedUniqueRulesWithError.push({
                id: customProperties.id, // Store some more diagnostic info (Duplicate NOT OK)
                område: customProperties.område,
              });
            }
          }
          executedRuleIdsWithError.add(customProperties.id); // Store current ID of rule with error
        } else {
          //We dont have a match, that means there is not an error and 'only' a 'tracked' rule execution
          if (executedRuleIds != undefined && executedRuleIds.size >= 0) {
          }
          if (!executedRuleIds.has(customProperties.id)) {
            this._ruleSets.executedUniqueRules.push({
              id: customProperties.id, // Store some more diagnostic info (Duplicate OK)
              område: customProperties.område,
            });
          }
          executedRuleIds.add(customProperties.id); // Store current ID of rule with NO error
        }
      });
    }
    ruleIdsNotApplicable = new Set([...executedRuleIds, ...executedRuleIdsWithError]);
    for (const key of instanceCategoryMap.keys()) {
      const customProperties = instanceCategoryMap.get(key).customProperties;
      const exists = this._ruleSets.notApplicableRules.some((rule) => {
        return rule.id === customProperties.id && rule.område === customProperties.område;
      });
      if (!ruleIdsNotApplicable.has(customProperties.id) && !exists) {
        // If not present, store the id and område in the not applicableRules
        this._ruleSets.notApplicableRules.push({ id: customProperties.id, område: customProperties.område }); // Rules
      }
    }
  }
  processDiagnosticInformation(): DiagnosticReport[] {
    const allReports: DiagnosticReport[] = [];
    // Populate the diagnostic reports and add them to the array
    if (this.diagnosticInformation.executedUniqueRules && this.diagnosticInformation.executedUniqueRules.length > 0) {
      allReports.push(
        this.populateDiagnosticRuleInformation(
          this.diagnosticInformation.executedUniqueRules,
          'OK',
          'N/A',
          'N/A',
          'Godkända regler - RAP-LP',
        ),
      );
    }
    if (
      this.diagnosticInformation.executedUniqueRulesWithError &&
      this.diagnosticInformation.executedUniqueRulesWithError.length > 0
    ) {
      allReports.push(
        this.populateDiagnosticRuleInformation(
          this.diagnosticInformation.executedUniqueRulesWithError,
          'EJ OK',
          'N/A',
          'N/A',
          'Ej Godkända regler - RAP-LP',
        ),
      );
    }
    if (this.diagnosticInformation.notApplicableRules && this.diagnosticInformation.notApplicableRules.length > 0) {
      allReports.push(
        this.populateDiagnosticRuleInformation(
          this.diagnosticInformation.notApplicableRules,
          'N/A',
          'N/A',
          'N/A',
          'Ej tillämpade regler - RAP-LP',
        ),
      );
    }
    return allReports;
  }
  private populateDiagnosticRuleInformation(
    rules: DiagnosticRuleInfo[],
    status: string,
    area: string,
    identificationNumber: string,
    notering: string,
  ): DiagnosticReport {
    // Map each rule to a PopulatedDiagnosticRuleInfo object
    const populatedRules: PopulatedDiagnosticRuleInfo[] = rules.map((rule) => ({
      ...rule,
      status,
      //add other fields here as well,
    }));
    // Construct the diagnostic report for current DiagnosticRuleInfo[]
    const report: DiagnosticReport = {
      Notering: notering,
      regler: populatedRules,
    };
    return report;
  }
}
export { RapLPDiagnostic };

interface DiagnosticRuleinfoSet {
  //--- Diagnostic information
  notApplicableRules: DiagnosticRuleInfo[];
  //--- Unique information
  executedUniqueRules: DiagnosticRuleInfo[];
  executedUniqueRulesWithError: DiagnosticRuleInfo[];
}
interface DiagnosticRuleInfo {
  id: string;
  område: string;
}
interface PopulatedDiagnosticRuleInfo extends DiagnosticRuleInfo {
  status: string;
}
interface NoteringField {
  Notering: string;
}
export interface DiagnosticReport {
  Notering: string;
  regler: PopulatedDiagnosticRuleInfo[];
}
