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

testRule('Spa07', [
  {
    name: 'giltigt testfall - x-request-id tillsammans med traceparent på operationen',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/users': {
          get: {
            parameters: [
              { name: 'x-request-id', in: 'header', schema: { type: 'string' } },
              { name: 'traceparent', in: 'header', schema: { type: 'string' } },
            ],
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
            parameters: [{ name: 'x-request-id', in: 'header', schema: { type: 'string' } }],
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    },
    errors: [],
  },
  {
    name: 'giltigt testfall - båda headers definierade via $ref till components.parameters',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/users': {
          get: {
            parameters: [
              { $ref: '#/components/parameters/XRequestId' },
              { $ref: '#/components/parameters/TraceParent' },
            ],
            responses: { '200': { description: 'OK' } },
          },
        },
      },
      components: {
        parameters: {
          XRequestId: { name: 'x-request-id', in: 'header', schema: { type: 'string' } },
          TraceParent: { name: 'traceparent', in: 'header', schema: { type: 'string' } },
        },
      },
    },
    errors: [],
  },
  {
    name: 'giltigt testfall - ingen alternativ identifierare används',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/users': {
          get: {
            parameters: [{ name: 'accept-language', in: 'header', schema: { type: 'string' } }],
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    },
    errors: [],
  },
  {
    name: 'giltigt testfall - x-request-id som query-parameter berörs inte av regeln',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/users': {
          get: {
            parameters: [{ name: 'x-request-id', in: 'query', schema: { type: 'string' } }],
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    },
    errors: [],
  },
  {
    name: 'ogiltigt testfall - endast x-request-id på operationen',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/users': {
          get: {
            parameters: [{ name: 'x-request-id', in: 'header', schema: { type: 'string' } }],
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    },
    errors: [
      {
        message:
          'Alternativa identifierare, såsom x-request-id, kan användas som komplement för interna behov, men SKALL INTE ersätta traceparent vid spårning av API-anrop mellan system och organisationer.',
        severity: DiagnosticSeverity.Error,
        path: ['paths', '/users', 'get'],
      },
    ],
  },
  {
    name: 'ogiltigt testfall - endast x-request-id definierad via $ref',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/users': {
          get: {
            parameters: [{ $ref: '#/components/parameters/XRequestId' }],
            responses: { '200': { description: 'OK' } },
          },
        },
      },
      components: {
        parameters: {
          XRequestId: { name: 'x-request-id', in: 'header', schema: { type: 'string' } },
        },
      },
    },
    errors: [
      {
        message:
          'Alternativa identifierare, såsom x-request-id, kan användas som komplement för interna behov, men SKALL INTE ersätta traceparent vid spårning av API-anrop mellan system och organisationer.',
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
  {
    name: 'ogiltigt testfall - x-request-id på path-nivå träffar samtliga operationer',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/users': {
          parameters: [{ name: 'x-request-id', in: 'header', schema: { type: 'string' } }],
          get: { responses: { '200': { description: 'OK' } } },
          post: { responses: { '201': { description: 'Created' } } },
        },
      },
    },
    errors: [
      {
        message:
          'Alternativa identifierare, såsom x-request-id, kan användas som komplement för interna behov, men SKALL INTE ersätta traceparent vid spårning av API-anrop mellan system och organisationer.',
        severity: DiagnosticSeverity.Error,
        path: ['paths', '/users', 'get'],
      },
      {
        message:
          'Alternativa identifierare, såsom x-request-id, kan användas som komplement för interna behov, men SKALL INTE ersätta traceparent vid spårning av API-anrop mellan system och organisationer.',
        severity: DiagnosticSeverity.Error,
        path: ['paths', '/users', 'post'],
      },
    ],
  },
  {
    name: 'ogiltigt testfall - headernamn med avvikande skiftläge saknar traceparent',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/users': {
          get: {
            parameters: [{ name: 'X-Request-Id', in: 'header', schema: { type: 'string' } }],
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    },
    errors: [
      {
        message:
          'Alternativa identifierare, såsom x-request-id, kan användas som komplement för interna behov, men SKALL INTE ersätta traceparent vid spårning av API-anrop mellan system och organisationer.',
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
  {
    name: 'giltigt testfall - traceparent med avvikande skiftläge accepteras',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/users': {
          get: {
            parameters: [
              { name: 'X-Request-Id', in: 'header', schema: { type: 'string' } },
              { name: 'Traceparent', in: 'header', schema: { type: 'string' } },
            ],
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    },
    errors: [],
  },
]);
