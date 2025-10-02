// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { DiagnosticSeverity } from '@stoplight/types';
import testRule from '../util/helperTest.js';

testRule('Dot02', [
  {
    name: 'giltigt testfall - date/datetime',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      components: {
        schemas: {
          DateRequest: {
            type: 'object',
            properties: {
              postedDate: {
                type: 'string',
                format: 'date',
                example: '2022-12-31',
              },
              postedTime: {
                type: 'string',
                format: 'date-time',
                example: '2022-11-31T04:00:09.12',
              },
            },
          },
        },
      },
    },
    errors: [],
  },
  {
    name: 'ogiltigt testfall - date/date-time',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      components: {
        schemas: {
          DateRequest: {
            type: 'object',
            properties: {
              postedDate: {
                type: 'string',
                format: 'date',
                example: '2022-121-31', // Invalid month
              },
              postedTime: {
                type: 'string',
                format: 'date-time',
                example: '2022-11-31T04:000:09.120', // Invalid minut and fraction of second
              },
            },
          },
        },
      },
    },
    errors: [
      {
        message: 'Datum och tid SKALL anges enligt RFC 3339 som bygger på ISO-8601.',
        path: ['components', 'schemas', 'DateRequest', 'properties', 'postedDate', 'example'],
        severity: DiagnosticSeverity.Error,
      },
      {
        message: 'Datum och tid SKALL anges enligt RFC 3339 som bygger på ISO-8601.',
        path: ['components', 'schemas', 'DateRequest', 'properties', 'postedTime', 'example'],
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
]);
testRule('Dot04', [
  {
    name: 'giltigt testfall - date/datetime',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      components: {
        schemas: {
          DateRequest: {
            type: 'object',
            properties: {
              postedTime: {
                type: 'string',
                format: 'date-time',
                example: '2024-04-23T04:00:09.12+01:00', // Valid offset
              },
            },
          },
        },
      },
    },
    errors: [],
  },
  {
    name: 'ogiltigt testfall - date/date-time',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      components: {
        schemas: {
          DateRequest: {
            type: 'object',
            properties: {
              postedTime: {
                type: 'string',
                format: 'date-time',
                example: '2024-04-23T04:00:09.12', // No offset specified
              },
            },
          },
        },
      },
    },
    errors: [
      {
        message:
          'Tidzonen BÖR representeras med UTC formatet, där tid anges som offset från UTC (Coordinated Universal Time).',
        path: ['components', 'schemas', 'DateRequest', 'properties', 'postedTime', 'example'],
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
]);
