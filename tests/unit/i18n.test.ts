// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import i18next from 'i18next';
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
    expect(localeFromAcceptLanguage('de-DE,en;q=0.9')).toBe('en');
    expect(localeFromAcceptLanguage('sv;q=0.4,en;q=0.9')).toBe('en');
    expect(localeFromAcceptLanguage('sv;q=0.9,en;q=0.4')).toBe('sv');
    expect(localeFromAcceptLanguage('en;q=0')).toBe('sv');
  });

  it('falls back to Swedish when an English key is missing', () => {
    i18next.addResource('sv', 'translation', 'test.swedishFallback', 'Svensk fallback');
    expect(translator('en')('test.swedishFallback')).toBe('Svensk fallback');
  });

  it('returns missing keys unchanged', () => {
    expect(translator('en')('api.unknownError')).toBe('An unknown error occurred.');
    expect(translator('en')('missing.key')).toBe('missing.key');
  });
});
