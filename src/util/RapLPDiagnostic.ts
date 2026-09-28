// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { RapLPCustomSpectralDiagnostic } from './RapLPCustomSpectralDiagnostic.js';
import { RuleExecutionLog, RuleExecutionContext } from './RuleExecutionContext.js';
import { buildRuleHelpUrl } from '../rulesets/util/rules-doc.config.js';
import { translator } from '../i18n.js';
import { translateRuleArea } from './ruleAreaTranslation.js';

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
  constructor(private context: RuleExecutionContext) {}
  processRuleExecutionInformation(
    raplpCustomResult: RapLPCustomSpectralDiagnostic[],
    rules: Record<string, any>,
    instanceCategoryMap: Map<string, any>,
  ): void {
    this.processRuleExecutionLog(
      this.context.ruleExecutionLogDictionary,
      raplpCustomResult,
      instanceCategoryMap,
      rules,
    );
  }
  private translate(key: string, options?: Record<string, unknown>): string {
    return translator(this.context.locale)(key, options);
  }
  private processRuleExecutionLog(
    log: RuleExecutionLog,
    spectralResults: RapLPCustomSpectralDiagnostic[],
    instanceCategoryMap: Map<string, any>,
    rules: Record<string, any>,
  ) {
    let executedRuleIds = new Set<string>(); // Set to track executed rule IDs
    let executedRuleIdsWithError = new Set<string>(); // Set to track executed rule IDs with error
    let ruleIdsNotApplicable = new Set<string>(); // Set to track rules that are not applicable, that is the (Δ) between the two above sets

    for (const key in log) {
      const execRules = log[key];
      const { className } = execRules[0]; // Get module and class name from the first entry
      //console.log(`Rule execution status for ${moduleName}:${className}:`);

      execRules.forEach((rule) => {
        const { customProperties, severity, passed, targetVal } = rule;
        const status = passed ? 'PASSED' : 'FAILED';
        const severityText = severity.toUpperCase();
        const message = rules[className]?.message ?? ''; // Lookup instance message
        const translatedArea = translateRuleArea(
          customProperties.område,
          this.context.locale,
        );
        // Check if rule is found in Spectral results
        const spectralResult = spectralResults.find((result) => {
          return result.area === translatedArea && result.id === customProperties.id;
        });

        if (spectralResult) {
          //We have a match, that means there is an error
          if (executedRuleIdsWithError != undefined && executedRuleIdsWithError.size >= 0) {
            if (!executedRuleIdsWithError.has(customProperties.id)) {
              this._ruleSets.executedUniqueRulesWithError.push({
                id: customProperties.id, // Store some more diagnostic info (Duplicate NOT OK)
                area: translatedArea,
                helpUrl: customProperties.id ? buildRuleHelpUrl(customProperties.id) : undefined,
                requirement: message,
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
              area: translatedArea,
              helpUrl: customProperties.id ? buildRuleHelpUrl(customProperties.id) : undefined,
              requirement: message,
            });
          }
          executedRuleIds.add(customProperties.id); // Store current ID of rule with NO error
        }
      });
    }
    ruleIdsNotApplicable = new Set([...executedRuleIds, ...executedRuleIdsWithError]);
    for (const key of instanceCategoryMap.keys()) {
      const customProperties = instanceCategoryMap.get(key).customProperties;

      const translatedArea = translateRuleArea(
        customProperties.område,
        this.context.locale,
      );
      
      const exists = this._ruleSets.notApplicableRules.some((rule) => {
        return rule.id === customProperties.id && translatedArea === customProperties.område;
      });
      if (!ruleIdsNotApplicable.has(customProperties.id) && !exists) {
        // If not present, store the id and område in the not applicableRules
        this._ruleSets.notApplicableRules.push({
          id: customProperties.id,
          area: translatedArea,
          requirement: rules[key]?.message ?? '',
          helpUrl: customProperties.id ? buildRuleHelpUrl(customProperties.id) : undefined,
        }); // Rules
      }
    }
  }
  setFromPrecomputedReport(
    reports: {
      note: string;
      rules: { id: string; area: string; requirement?: string; helpUrl?: string; status: string }[];
    }[],
  ): void {
    const okStatus = this.translate('common.ruleStatus.ok');
    const notOkStatus = this.translate('common.ruleStatus.notOk');
    for (const report of reports) {
      for (const regel of report.rules) {
        const ruleInfo = {
          id: regel.id,
          area: regel.area,
          requirement: regel.requirement ?? '',
          helpUrl: regel.helpUrl,
        };
        if (regel.status === okStatus) {
          this._ruleSets.executedUniqueRules.push(ruleInfo);
        } else if (regel.status === notOkStatus) {
          this._ruleSets.executedUniqueRulesWithError.push(ruleInfo);
        } else {
          this._ruleSets.notApplicableRules.push(ruleInfo);
        }
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
          this.translate('common.ruleStatus.ok'),
          'N/A',
          'N/A',
          this.translate('diagnosticReport.note.approved'),
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
          this.translate('common.ruleStatus.notOk'),
          'N/A',
          'N/A',
          this.translate('diagnosticReport.note.notApproved'),
        ),
      );
    }
    if (this.diagnosticInformation.notApplicableRules && this.diagnosticInformation.notApplicableRules.length > 0) {
      allReports.push(
        this.populateDiagnosticRuleInformation(
          this.diagnosticInformation.notApplicableRules,
          this.translate('common.ruleStatus.notApplicable'),
          'N/A',
          'N/A',
          this.translate('diagnosticReport.note.notApplicable'),
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
    note: string,
  ): DiagnosticReport {
    // Map each rule to a PopulatedDiagnosticRuleInfo object
    const populatedRules: PopulatedDiagnosticRuleInfo[] = rules.map((rule) => ({
      ...rule,
      status,
      //add other fields here as well,
    }));
    // Construct the diagnostic report for current DiagnosticRuleInfo[]
    const report: DiagnosticReport = {
      note: note,
      rules: populatedRules,
    };
    return report;
  }
  // private translateArea(area: string): string {
  //   const areaKeyMap: Record<string, string> = {
  //     'URL Format och namngivning': 'areas.urlFormatAndNaming',
  //     'Säkerhet': 'areas.security',
  //     'Spårbarhet och korrelation': 'areas.traceabilityAndCorrelation',
  //     'Versionshantering': 'areas.versioning',
  //     'Filtrering, paginering och sökparametrar': 'areas.filteringPaginationSearch',
  //     'API Request': 'areas.apiRequest',
  //     'Dokumentation': 'areas.documentation',
  //     'API Message': 'areas.apiMessage',
  //     'Förutsättningar': 'areas.prerequisites',
  //     'Datum- och tidsformat': 'areas.dateTimeFormat',
  //     'Resurser': 'areas.resources',
  //     'Mognad': 'areas.maturity',
  //     'Felhantering': 'areas.errorHandling',
  // };

  //   const key = areaKeyMap[area];

  //   return key ? this.translate(key) : area;
  // }
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
  area: string;
  requirement: string;
  /**Helper Url for guidelines */
  helpUrl?: string;
}
interface PopulatedDiagnosticRuleInfo extends DiagnosticRuleInfo {
  status: string;
}
interface NoteringField {
  note: string;
}
export interface DiagnosticReport {
  note: string;
  rules: PopulatedDiagnosticRuleInfo[];
}
