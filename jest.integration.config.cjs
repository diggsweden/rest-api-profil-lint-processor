// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2
const base = require('./jest.config.cjs');

/** @type {import('jest').Config} */
module.exports = {
  ...base,
    testMatch: ['**/tests/integration/**/*.test.ts']
};