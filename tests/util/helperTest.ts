// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { IRuleResult, Spectral, Document, Ruleset, RulesetDefinition } from '@stoplight/spectral-core';
import { httpAndFileResolver } from '@stoplight/spectral-ref-resolver';
//import {describe, expect, it} from '@jest/globals';
import allRules from './rulesetTest.js';
export type RuleName = keyof typeof allRules.rules;

type Scenario = ReadonlyArray<
  Readonly<{
    name: string;
    document: Record<string, unknown> | Document<unknown, any>;
    errors: ReadonlyArray<Partial<IRuleResult>>;
    mocks?: Record<string, Record<string, unknown>>;
  }>
>;

const runTestCase = async (
  ruleName: RuleName,
  testName: string,
  document: Document<unknown, any> | Record<string, unknown>,
  errorsExpected: ReadonlyArray<Partial<IRuleResult>>,
): Promise<void> => {
  try {
    const s = createWithRules([ruleName]);
    const doc = document instanceof Document ? document : JSON.stringify(document);
    const errors = await s.run(doc);

    expect(errors.filter(({ code }) => code === ruleName)).toEqual(
      errorsExpected.map((error) => expect.objectContaining(error) as unknown),
    );
  } catch (error) {
    // Log the error
    console.error(`Fel vid körning av testfall "${testName}":`, error);
    // Rethrow the error to indicate test failure
    throw error;
  }
};

export default (ruleName: RuleName, tests: Scenario): void => {
  describe(`Rule ${ruleName}`, () => {
    const concurrent = tests.every((test) => test.mocks === void 0 || Object.keys(test.mocks).length === 0);
    for (const testCase of tests) {
      (concurrent ? it.concurrent : it)(testCase.name, async () => {
        try {
          await runTestCase(ruleName, testCase.name, testCase.document, testCase.errors);
        } catch (error) {
          // Log the error and mark the test as failed
          console.error(`Test fall "${testCase.name}" fallerade:`, error);
          throw error;
        }
      });
    }
  });
};
export function createWithRules(rules: (keyof Ruleset['rules'])[]): Spectral {
  const s = new Spectral({ resolver: httpAndFileResolver });

  s.setRuleset({
    extends: [[allRules as RulesetDefinition, 'off']],
    rules: rules.reduce((obj: Record<string, boolean>, name) => {
      obj[name] = true;
      return obj;
    }, {}),
  });

  return s;
}
