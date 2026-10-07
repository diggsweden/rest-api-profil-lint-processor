// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import i18next, { type TFunction } from 'i18next';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';

function packageRootFromEntrypoint() {
  const entrypoint = process.argv[1];
  if (!entrypoint) return undefined;

  try {
    return path.resolve(path.dirname(realpathSync(entrypoint)), '..');
  } catch {
    return path.resolve(path.dirname(entrypoint), '..');
  }
}

function loadLocale(locale: string) {
  const packageRoot = packageRootFromEntrypoint();
  const candidates = [
    path.resolve(process.cwd(), 'locales', locale, 'translation.json'),
    ...(packageRoot ? [path.resolve(packageRoot, 'locales', locale, 'translation.json')] : []),
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
  showSupportNotice: false,
});

export function resolveLocale(value?: string): Locale {
  const candidate = value?.split(',')[0]?.trim().toLowerCase().split('-')[0];
  return candidate === 'en' ? 'en' : 'sv';
}

function supportedLocale(value: string): Locale | undefined {
  const candidate = value.trim().toLowerCase().split('-')[0];
  return SUPPORTED_LOCALES.find((locale) => locale === candidate);
}

export function localeFromAcceptLanguage(value?: string): Locale {
  if (!value) return 'sv';

  const candidates = value
    .split(',')
    .map((part, index) => {
      const [tag = '', ...params] = part.trim().split(';');
      const q = params.map((param) => param.trim().match(/^q=([0-9.]+)$/)).find(Boolean)?.[1];
      return {
        locale: supportedLocale(tag),
        q: q === undefined ? 1 : Number(q),
        index,
      };
    })
    .filter(
      (candidate): candidate is { locale: Locale; q: number; index: number } =>
        Boolean(candidate.locale) && Number.isFinite(candidate.q) && candidate.q > 0,
    )
    .sort((a, b) => b.q - a.q || a.index - b.index);

  return candidates[0]?.locale ?? 'sv';
}

export function translator(locale: Locale): TFunction {
  return i18next.getFixedT(locale);
}
