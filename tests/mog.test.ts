// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { DiagnosticSeverity } from '@stoplight/types';
import testRule from './util/helperTest.ts';

testRule('Mog01', [
  {
    name: 'ogiltigt testfall - resurs innehåller varken get, post, put, delete eller patch',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0.0' },
      paths: {
        '/pets': {
          options: {
            parameters: [
              {
                name: 'pnr',
                in: 'query',
              },
            ],
          },
        },
      },
    },
    errors: [
      {
        message: 'Alla API:er SKALL designas för att uppnå nivå 2 enligt Richardson Maturity Model.',
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
  {
    name: 'giltigt testfall - resurs innehåller get',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            parameters: [
              {
                name: 'pnr',
                in: 'query',
              },
            ],
          },
        },
      },
    },
    errors: [],
  },
  {
    name: 'giltigt testfall - resurs innehåller post och options',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0.0' },
      paths: {
        '/pets': {
          post: {
            parameters: [
              {
                name: 'pnr',
                in: 'query',
              },
            ],
          },
          options: {
            parameters: [
              {
                name: 'pnr',
                in: 'query',
              },
            ],
          },
        },
      },
    },
    errors: [],
  },
]);
