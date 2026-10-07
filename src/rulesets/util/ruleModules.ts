// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

export const RULE_REGISTRY = [
  { rule: 'UfnRules', descriptionKey: 'ruleCategories.ufn' },
  { rule: 'SakRules', descriptionKey: 'ruleCategories.sak' },
  { rule: 'SpaRules', descriptionKey: 'ruleCategories.spa' },
  { rule: 'VerRules', descriptionKey: 'ruleCategories.ver' },
  { rule: 'FnsRules', descriptionKey: 'ruleCategories.fns' },
  { rule: 'ArqRules', descriptionKey: 'ruleCategories.arq' },
  { rule: 'DokRules', descriptionKey: 'ruleCategories.dok' },
  { rule: 'AmeRules', descriptionKey: 'ruleCategories.ame' },
  { rule: 'ForRules', descriptionKey: 'ruleCategories.for' },
  { rule: 'DotRules', descriptionKey: 'ruleCategories.dot' },
  { rule: 'ResRules', descriptionKey: 'ruleCategories.res' },
  { rule: 'MogRules', descriptionKey: 'ruleCategories.mog' },
  { rule: 'FelRules', descriptionKey: 'ruleCategories.fel' },
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
