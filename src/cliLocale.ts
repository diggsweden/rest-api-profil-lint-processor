// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { resolveLocale, type Locale } from './i18n.js';

export function getRawOptionValue(args: string[], name: string): string | undefined {
  const prefix = `--${name}=`;
  const assignment = args.find((arg) => arg.startsWith(prefix));
  if (assignment) return assignment.slice(prefix.length);
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
}

export function cliLocale(rawArgs: string[], env: NodeJS.ProcessEnv = process.env): Locale {
  return resolveLocale(getRawOptionValue(rawArgs, 'lang') ?? env.RAP_LP_LANG);
}
