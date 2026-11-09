// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { RapLPCustomSpectralDiagnostic } from './RapLPCustomSpectralDiagnostic.js';

export type ExitCriteria = {
  failOnError?: boolean;
  failOnWarning?: boolean;
};

export type UnmetCriterion = {
  flag: keyof ExitCriteria;
  ruleIds: string[];
};

/**
 * Evaluates the enabled exit criteria against the rule violations.
 * ERROR corresponds to SKA requirements and WARNING to BÖR requirements.
 * @returns The criteria that are not met, each with the ids of the violated rules.
 */
export function findUnmetCriteria(
  violations: RapLPCustomSpectralDiagnostic[],
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
  return unmet;
}
