// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { buildRuleHelpUrl } from '../../src/rulesets/util/rules-doc.config.js';

describe('buildRuleHelpUrl', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('bygger korrekt GitHub-länk för regel-ID med punkt (SAK.16)', () => {
    process.env.RULES_DOC_REF = 'main';

    const url = buildRuleHelpUrl('SAK.16');

    expect(url).toBe(
      'https://github.com/diggsweden/rest-api-profil-lint-processor/blob/main/GUIDELINES.md#id-sak16'
    );
  });

  it('faller tillbaka till main om RULES_DOC_REF saknas', () => {
    delete process.env.RULES_DOC_REF;

    const url = buildRuleHelpUrl('FOR.02');

    expect(url).toBe(
      'https://github.com/diggsweden/rest-api-profil-lint-processor/blob/main/GUIDELINES.md#id-for02'
    );
  });

  it('hanterar redan normaliserade ID:n korrekt', () => {
    process.env.RULES_DOC_REF = 'feature/test';

    const url = buildRuleHelpUrl('sak16');

    expect(url).toBe(
      'https://github.com/diggsweden/rest-api-profil-lint-processor/blob/feature/test/GUIDELINES.md#id-sak16'
    );
  });
});
