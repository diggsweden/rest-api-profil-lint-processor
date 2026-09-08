// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import i18next, { type TFunction } from 'i18next';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

function loadLocale(locale: string) {
  const candidates = [
    path.resolve(process.cwd(), 'locales', locale, 'translation.json'),
    path.resolve(path.dirname(process.argv[1] ?? ''), '..', 'locales', locale, 'translation.json'),
  ];
  const file = candidates.find((candidate) => existsSync(candidate));
  if (!file) throw new Error(`Translation catalogue not found for locale: ${locale}`);
  return JSON.parse(readFileSync(file, 'utf8'));
}

export const SUPPORTED_LOCALES = ['sv', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

i18next.init({
  lng: 'sv',
  fallbackLng: 'sv',
  supportedLngs: SUPPORTED_LOCALES,
  resources: { sv: { translation: loadLocale('sv') }, en: { translation: loadLocale('en') } },
  interpolation: { escapeValue: false },
});

export function resolveLocale(value?: string): Locale {
  const candidate = value?.split(',')[0]?.trim().toLowerCase().split('-')[0];
  return candidate === 'en' ? 'en' : 'sv';
}

export function localeFromAcceptLanguage(value?: string): Locale {
  return resolveLocale(value);
}

export function translator(locale: Locale): TFunction {
  return i18next.getFixedT(locale);
}
