// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

export function isValidApplicationJson(property: string): boolean {
  return !!property.match(/application\/json(?:$|;[\s]*charset=.*)/);
}
