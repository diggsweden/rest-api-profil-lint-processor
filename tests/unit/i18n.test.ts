// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import i18next from 'i18next';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { cliLocale, getRawOptionValue } from '../../src/cliLocale.js';
import { localeFromAcceptLanguage, resolveLocale, translator } from '../../src/i18n.js';

describe('i18n', () => {
  describe('locale resolution', () => {
    it('resolves supported locales and falls back to Swedish', () => {
      expect(resolveLocale('en-US')).toBe('en');
      expect(resolveLocale('sv-SE')).toBe('sv');
      expect(resolveLocale('de-DE')).toBe('sv');
      expect(resolveLocale()).toBe('sv');
    });

    it('uses Accept-Language preferences', () => {
      expect(localeFromAcceptLanguage('en-US,en;q=0.9')).toBe('en');
      expect(localeFromAcceptLanguage('de-DE,en;q=0.9')).toBe('en');
      expect(localeFromAcceptLanguage('sv;q=0.4,en;q=0.9')).toBe('en');
      expect(localeFromAcceptLanguage('sv;q=0.9,en;q=0.4')).toBe('sv');
      expect(localeFromAcceptLanguage('en;q=0')).toBe('sv');
    });
  });

  describe('translations', () => {
    it('returns English translations when available', () => {
      expect(translator('en')('api.unknownError')).toBe('An unknown error occurred.');
      expect(translator('en')('api.ruleValidationDetail')).toBe(
        'The API specification violates one or more rules in the Swedish REST API Profile.',
      );
    });

    it('falls back to Swedish when an English key is missing', () => {
      i18next.addResource('sv', 'translation', 'test.swedishFallback', 'Svensk fallback');
      expect(translator('en')('test.swedishFallback')).toBe('Svensk fallback');
    });

    it('returns missing keys unchanged', () => {
      expect(translator('en')('missing.key')).toBe('missing.key');
    });

    it('translates rule areas', () => {
      expect(translator('en')('areas.documentation')).toBe('Dokumentation');
      expect(translator('sv')('areas.documentation')).toBe('Dokumentation');
    });
  });
  describe('CLI locale', () => {
    it('resolves CLI flag and environment precedence through the option path', () => {
      expect(getRawOptionValue(['--lang', 'en'], 'lang')).toBe('en');
      expect(cliLocale([], { RAP_LP_LANG: 'en' })).toBe('en');
      expect(cliLocale(['--lang', 'sv'], { RAP_LP_LANG: 'en' })).toBe('sv');
    });

  });
});
