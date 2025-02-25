// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = async () => {
  return {
    preset: 'ts-jest',
    testPathIgnorePatterns: ['util'],
    testEnvironment: 'node',
    "extensionsToTreatAsEsm": [".ts"],
    transform: {
      '.*': ['ts-jest', {useIsolatedModules: true }]
    }
  };
};