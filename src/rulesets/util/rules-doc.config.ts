// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

const RULES_DOC_REPO =
  'https://github.com/diggsweden/rest-api-profil-lint-processor';


  /**
   * Constructs a helper Url together with correct Rule  
   * @param ruleId ( Rule identifier)
   * @returns Normalized help url
   */
  export function buildRuleHelpUrl(ruleId: string): string {
    const ref = process.env.RULES_DOC_REF || 'main';
    const normalizedId = ruleId
    .toLowerCase()
    .replace('.', '');

    return `${RULES_DOC_REPO}/blob/${ref}/GUIDELINES.md#id-${normalizedId}`;
}
