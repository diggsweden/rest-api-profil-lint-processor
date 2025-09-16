// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { DiagnosticSeverity } from '@stoplight/types';
import testRule from '../util/helperTest.js';

testRule('Arq05ComplexStructure', [
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/foo': {
          post: {
            parameters: [
              {
                name: 'Payload_simple',
                in: 'header',
                description: 'Simple payload in header is ok',
                required: true,
                schema: {
                  type: 'string',
                },
              },
            ],
          },
        },
      },
    },
    errors: [],
  },
  {
    name: 'ogiltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/foo': {
          post: {
            parameters: [
              {
                name: 'Payload_complex',
                in: 'header',
                description: 'Complex payload in header is discouraged',
                required: true,
                schema: {
                  type: 'object',
                },
              },
            ],
          },
        },
      },
    },
    errors: [
      {
        message:
          '[Payload data SKALL INTE användas i HTTP-headers] Om en header förväntas innehålla komplexa datastrukturer, såsom JSON eller XML, kan det indikera en okonventionell användning av headers.',
        path: ['paths', '/foo', 'post', 'parameters', '0'],
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
]);
testRule('Arq05StringBinary', [
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/foo': {
          post: {
            parameters: [
              {
                name: 'Payload_simple',
                in: 'header',
                description: 'Simple payload in header is OK',
                required: true,
                schema: {
                  type: 'string',
                },
              },
            ],
          },
        },
      },
    },
    errors: [],
  },
  {
    name: 'ogiltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/foo': {
          post: {
            parameters: [
              {
                name: 'Payload_complex',
                in: 'header',
                description:
                  'If a header is expected to contain data with unusual MIME types, it may indicate an unconventional use of headers',
                required: true,
                schema: {
                  type: 'string',
                  format: 'binary',
                },
              },
            ],
          },
        },
      },
    },
    errors: [
      {
        message:
          '[Payload data SKALL INTE användas i HTTP-headers] Om en header förväntas innehålla data med ovanliga MIME-typer kan det indikera en okonventionell användning av headers.',
        path: ['paths', '/foo', 'post', 'parameters', '0'],
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
]);
testRule('Arq05NestedStructure', [
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/foo': {
          post: {
            parameters: [
              {
                name: 'Payload_simple',
                in: 'header',
                description: 'Simple payload in header is OK',
                required: true,
                schema: {
                  type: 'string',
                },
              },
              {
                name: 'Payload_simple2',
                in: 'header',
                description: 'Simple payload in header is OK',
                required: true,
                schema: {
                  type: 'string',
                },
              },
            ],
          },
        },
      },
    },
    errors: [],
  },
  {
    name: 'ogiltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/foo': {
          post: {
            parameters: [
              {
                name: 'Payload_complex',
                in: 'header',
                description: 'If a header uses nested structures, a requestbody is more appropriate.',
                required: true,
                schema: {
                  type: 'object',
                  properties: {
                    nestedfield: 'nested',
                    type: 'string',
                  },
                },
              },
            ],
          },
        },
      },
    },
    errors: [
      {
        message:
          '[Payload data SKALL INTE användas i HTTP-headers] Om en header använder nästlade strukturer, är en requestbody mer lämplig.',
        path: ['paths', '/foo', 'post', 'parameters', '0'],
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
]);

testRule('Arq01', [
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/': {
          get: {
            requestBody: {
              description: 'JSON och CSV tillåtet',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                  },
                },
                'text/csv': {
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
    errors: [],
  },
  {
    name: 'ogiltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/': {
          get: {
            requestBody: {
              description: 'Om endast något annat format än JSON, så bör en varning ges',
              content: {
                'text/csv': {
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
    errors: [
      {
        message: 'Ett request BÖR skickas i UTF-8',
        path: ['paths', '/', 'get', 'requestBody', 'content'],
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
]);
testRule('Arq03', [
  {
    name: 'giltigt testfall - Connection: keep-alive',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/foo': {
          post: {
            parameters: [
              {
                name: 'Connection',
                in: 'header',
                description: 'Connection type',
                required: true,
                schema: {
                  type: 'string',
                  enum: ['keep-alive', 'close', 'upgrade'],
                },
              },
            ],
          },
        },
      },
    },
    errors: [],
  },
  {
    name: 'giltigt testfall - Date: ska ha format som är definierat i RFC 3339',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/foo': {
          post: {
            parameters: [
              {
                name: 'Date',
                in: 'header',
                description: 'Date',
                required: true,
                schema: {
                  type: 'string',
                  format: 'date-time',
                },
              },
            ],
          },
        },
      },
    },
    errors: [],
  },
  {
    name: 'giltigt testfall - ETag: etag',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/foo': {
          post: {
            parameters: [
              {
                name: 'ETag',
                in: 'header',
                description: 'ETag',
                required: true,
                schema: {
                  type: 'string',
                  format: 'etag',
                },
              },
            ],
          },
        },
      },
    },
    errors: [],
  },
  {
    name: 'ogiltigt testfall - Connection: keep-alive saknas',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/foo': {
          post: {
            parameters: [
              {
                name: 'Connection',
                in: 'header',
                required: true,
                schema: {
                  type: 'string',
                  enum: ['close', 'upgrade'],
                },
              },
            ],
          },
        },
      },
    },
    errors: [
      {
        message:
          'Alla API:er BÖR supportera följande request headers: Accept, Date, Cache-Control, ETag, Connection och Cookie.',
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
]);
