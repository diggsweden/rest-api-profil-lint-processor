// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { DiagnosticSeverity } from '@stoplight/types';
import testRule from '../util/helperTest.js';

testRule('For02', [
  {
    name: 'giltigt testfall - EN GET -förfrågan SKALL INTE acceptera en  body',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/': {
          get: {},
        },
      },
    },
    errors: [],
  },
  {
    name: 'ogiltigt testfall - EN GET -förfrågan SKALL INTE acceptera en body',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/': {
          get: {
            requestBody: {
              description: 'En GET operation är en fråga och skall inte innehålla något svar',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
      },
    },
    errors: [
      {
        message: 'EN GET -förfrågan SKALL INTE acceptera en body',
        path: ['paths', '/', 'get', 'requestBody'],
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
]);
