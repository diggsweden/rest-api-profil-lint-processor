// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { readFile } from 'node:fs/promises';
import { Resolver } from '@stoplight/spectral-ref-resolver';
import type { TFunction } from 'i18next';

/**
 * Policy for external $refs (CLI mode, when --allowExternalRefs is set):
 * - local file references (relative or absolute paths) are allowed
 * - https:// references are allowed
 * - http:// and all other URI schemes are blocked
 */
export function isAllowedExternalRef(ref: string): boolean {
  const match = /^([a-z][a-z0-9+.-]*):/i.exec(ref.trim());
  if (!match) return true; // relative or absolute file path
  const scheme = match[1].toLowerCase();
  return scheme === 'https' || scheme.length === 1;
}

/**
 * Resolver for Spectral that follows the policy above.
 */
export function createExternalRefResolver(t: TFunction): Resolver {
  const blocked = (scheme: string) => ({
    resolve: async (ref: { href(): string }) => {
      throw new Error(t('validation.externalRefSchemeBlocked', { scheme, url: ref.href() }));
    },
  });

  return new Resolver({
    resolvers: {
      https: {
        resolve: async (ref: { href(): string }) => {
          const url = ref.href();
          const response = await fetch(url);

          if (!response.url.toLowerCase().startsWith('https://')) {
            throw new Error(t('validation.externalRefRedirectNotHttps', { url }));
          }
          if (!response.ok) {
            throw new Error(t('validation.externalRefFetchFailed', { url, status: response.status, statusText: response.statusText }));
          }
          return response.text();
        },
      },
      http: blocked('http'),
      file: {
        resolve: async (ref: { href(): string }) => readFile(ref.href(), 'utf8'),
      },
    },
  });
}
