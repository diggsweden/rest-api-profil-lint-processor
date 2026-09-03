// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

export const RULE_REGISTRY = [
  { rule: 'UfnRules', description: 'URL Format och namngivning' },
  { rule: 'SakRules', description: 'Säkerhet' },
  { rule: 'SpaRules', description: 'Spårbarhet' },
  { rule: 'VerRules', description: 'Versionshantering' },
  { rule: 'FnsRules', description: 'Filtrering, paginering och sökparametrar' },
  { rule: 'ArqRules', description: 'API Request' },
  { rule: 'DokRules', description: 'Dokumentation' },
  { rule: 'AmeRules', description: 'API Message' },
  { rule: 'ForRules', description: 'Förutsättningar' },
  { rule: 'DotRules', description: 'Datum- och tidsformat' },
  { rule: 'ResRules', description: 'Resurser' },
  { rule: 'MogRules', description: 'Mognad' },
  { rule: 'FelRules', description: 'Felhantering' },
] as const;

export type RuleModuleName = (typeof RULE_REGISTRY)[number]['rule'];
export const RULE_MODULE_NAMES: RuleModuleName[] = RULE_REGISTRY.map((r) => r.rule);

export function parseRuleCategories(input?: string | string[]): RuleModuleName[] | undefined {
  if (!input) return undefined;

  const categories = typeof input === 'string' ? input.split(',').map((c) => c.trim()) : input;

  const invalid = categories.filter((c) => !RULE_MODULE_NAMES.includes(c as RuleModuleName));

  if (invalid.length) {
    throw new Error(`Invalid rule categories: ${invalid.join(', ')}`);
  }

  return categories as RuleModuleName[];
}
export function resolveRuleCategories(categories?: RuleModuleName[]): RuleModuleName[] {
  if (!categories || categories.length === 0) {
    return [...RULE_MODULE_NAMES];
  }

  const result = [...categories];
  return result;
}
