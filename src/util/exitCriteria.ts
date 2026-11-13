// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { RapLPCustomSpectralDiagnostic } from './RapLPCustomSpectralDiagnostic.js';

export type ExitCriteria = {
  failOnError?: boolean;
  failOnWarning?: boolean;
  minCompliance?: number;
};

/** Number of unique executed rules that passed and failed. Not applicable rules are excluded. */
export type RuleOutcome = {
  passed: number;
  failed: number;
};

export type UnmetCriterion =
  | { flag: 'failOnError' | 'failOnWarning'; ruleIds: string[] }
  | { flag: 'minCompliance'; compliance: number; threshold: number; passed: number; executed: number };

/**
 * Calculates the rule compliance as a whole percentage, rounded down so that
 * a threshold is never reached by rounding. No executed rules counts as full compliance.
 */
export function calculateCompliance({ passed, failed }: RuleOutcome): number {
  const executed = passed + failed;
  return executed === 0 ? 100 : Math.floor((passed / executed) * 100);
}

/**
 * Evaluates the enabled exit criteria against the rule violations and outcome.
 * ERROR corresponds to SKA requirements and WARNING to BÖR requirements.
 * @returns The criteria that are not met.
 */
export function findUnmetCriteria(
  violations: RapLPCustomSpectralDiagnostic[],
  outcome: RuleOutcome,
  criteria: ExitCriteria,
): UnmetCriterion[] {
  const violatedRuleIds = (severities: string[]) =>
    [
      ...new Set(
        violations
          .filter((violation) => violation.id && severities.includes(violation.severity ?? ''))
          .map((violation) => violation.id as string),
      ),
    ].sort((a, b) => a.localeCompare(b, 'sv'));

  const unmet: UnmetCriterion[] = [];
  if (criteria.failOnError) {
    const ruleIds = violatedRuleIds(['ERROR']);
    if (ruleIds.length > 0) unmet.push({ flag: 'failOnError', ruleIds });
  }
  if (criteria.failOnWarning) {
    const ruleIds = violatedRuleIds(['ERROR', 'WARNING']);
    if (ruleIds.length > 0) unmet.push({ flag: 'failOnWarning', ruleIds });
  }
  if (criteria.minCompliance !== undefined) {
    const compliance = calculateCompliance(outcome);
    if (compliance < criteria.minCompliance) {
      unmet.push({
        flag: 'minCompliance',
        compliance,
        threshold: criteria.minCompliance,
        passed: outcome.passed,
        executed: outcome.passed + outcome.failed,
      });
    }
  }
  return unmet;
}
