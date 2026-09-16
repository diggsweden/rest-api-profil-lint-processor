// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { DiagnosticSeverity } from '@stoplight/types';
import testRule from '../util/helperTest.js';

testRule('Spa02', [
  {
    name: 'giltigt testfall - traceparent på operationen',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/users': {
          get: {
            parameters: [{ name: 'traceparent', in: 'header', schema: { type: 'string' } }],
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    },
    errors: [],
  },
  {
    name: 'giltigt testfall - traceparent definierad på path-nivå',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/users': {
          parameters: [{ name: 'traceparent', in: 'header', schema: { type: 'string' } }],
          get: {
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    },
    errors: [],
  },
  {
    name: 'giltigt testfall - headers definierade via $ref till components.parameters',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/users': {
          get: {
            parameters: [{ $ref: '#/components/parameters/TraceParent' }],
            responses: { '200': { description: 'OK' } },
          },
        },
      },
      components: {
        parameters: {
          TraceParent: { name: 'traceparent', in: 'header', schema: { type: 'string' } },
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
        message:
          'API-producenter SKALL acceptera HTTP-headern traceparent i inkommande anrop och propagera spårningsinformationen vidare enligt W3C Trace Context vid vidare anrop till andra system.',
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
  {
    name: 'ogiltigt testfall - headers felaktig definierade via $ref till components.parameters',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/users': {
          get: {
            parameters: [{ $ref: '#/components/parameters/TraceParent' }],
            responses: { '200': { description: 'OK' } },
          },
        },
      },
      components: {
        parameters: {
          TraceParent: { name: 'traceparent', schema: { type: 'string' } },
        },
      },
    },
    errors: [
      {
        message:
          'API-producenter SKALL acceptera HTTP-headern traceparent i inkommande anrop och propagera spårningsinformationen vidare enligt W3C Trace Context vid vidare anrop till andra system.',
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
]);

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
