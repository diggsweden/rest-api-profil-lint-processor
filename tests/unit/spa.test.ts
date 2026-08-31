// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { DiagnosticSeverity } from '@stoplight/types';
import testRule from '../util/helperTest.js';

testRule('Spa04', [
  {
    name: 'giltigt testfall - traceparent finns med schema',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/users': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                headers: {
                  traceparent: {
                    schema: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    errors: [],
  },
  {
    name: 'giltigt testfall - traceparent finns via ref',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/users': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                headers: {
                  traceparent: {
                    $ref: '#/components/headers/Traceparent',
                  },
                },
              },
            },
          },
        },
      },
    },
    errors: [],
  },
  {
    name: 'ogiltigt testfall - traceparent finns inte',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/users': {
          get: {
            responses: {
              '200': {
                description: 'OK',
              },
            },
          },
        },
      },
    },
    errors: [
      {
        message: 'API-producenten BÖR inkludera HTTP-headern traceparent i ett API-svar.',
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
]);
