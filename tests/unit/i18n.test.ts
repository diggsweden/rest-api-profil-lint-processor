// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { localeFromAcceptLanguage, resolveLocale, translator } from '../../src/i18n.js';

describe('i18n', () => {
  it('resolves supported locales and falls back to Swedish', () => {
    expect(resolveLocale('en-US')).toBe('en');
    expect(resolveLocale('sv-SE')).toBe('sv');
    expect(resolveLocale('de-DE')).toBe('sv');
    expect(resolveLocale()).toBe('sv');
  });

  it('uses the first Accept-Language preference', () => {
    expect(localeFromAcceptLanguage('en-US,en;q=0.9')).toBe('en');
    expect(localeFromAcceptLanguage('de-DE,en;q=0.9')).toBe('sv');
  });

  it('falls back to Swedish when a key is missing', () => {
    expect(translator('en')('missing.key')).toBe('missing.key');
    expect(translator('en')('api.unknownError')).toBe('An unknown error occurred.');
  });
});
