// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { DiagnosticSeverity } from '@stoplight/types';
import testRule from '../util/helperTest.js';
import { Ame01, Ame02 } from '../../src/rulesets/AmeRules.js';

testRule('Ame01', [
  {
    name: 'giltigt testfall - JSON format',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/foo': {
          post: {
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        foo: {
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
      },
    },
    errors: [],
  },
  {
    name: 'giltigt testfall - Request Body',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/foo': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      foo: {
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
    },
    errors: [],
  },
  {
    name: 'ogiltigt testfall - Request Body',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/foo': {
          post: {
            requestBody: {
              content: {
                'application/octet-stream': {
                  schema: {
                    type: 'object',
                    properties: {
                      foo: {
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
    },
    errors: [
      {
        message: Ame01.errorMessage,
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
  {
    name: 'giltigt testfall - Plockar inte error >= 400',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/foo': {
          post: {
            responses: {
              '400': {
                content: {
                  'application/problem+json': {
                    schema: {
                      type: 'object',
                      properties: {
                        foo: {
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
      },
    },
    errors: [],
  },
  {
    name: 'ogiltigt testfall - ej JSON format',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/foo': {
          post: {
            responses: {
              '200': {
                content: {
                  'application/octet-stream': {
                    schema: {
                      type: 'object',
                      properties: {
                        foo: {
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
      },
    },
    errors: [
      {
        message: 'Datamodellen för en representation BÖR beskrivas med JSON enligt senaste versionen, RFC 8259.',
        path: ['paths', '/foo', 'post', 'responses', '200', 'content'],
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
]);

testRule('Ame02', [
  {
    name: 'giltigt testfall - JSON format',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/foo': {
          post: {
            requestBody: {
              content: {
                'application/json; charset=utf-8': {
                  schema: {
                    type: 'object',
                    properties: {
                      foo: {
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
    },
    errors: [],
  },
  {
    name: 'ogiltigt testfall - ej JSON format',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/foo': {
          post: {
            requestBody: {
              content: {
                'application/octet-stream': {
                  schema: {
                    type: 'object',
                    properties: {
                      foo: {
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
    },
    errors: [
      {
        message: Ame02.errorMessage,
        path: ['paths', '/foo', 'post', 'requestBody', 'content'],
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
]);

testRule('Ame04', [
  {
    name: 'giltigt testfall - test av flatcase för snakecase / camelcase',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      components: {
        schemas: {
          Error: {
            type: 'object',
            properties: {
              verylongmessage: {
                type: 'string',
              },
            },
          },
        },
      },
    },
    errors: [],
  },
  {
    name: 'giltigt testfall - test av snakecase',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      components: {
        schemas: {
          Error: {
            type: 'object',
            properties: {
              verylong_message: {
                type: 'string',
              },
            },
          },
        },
      },
    },
    errors: [],
  },
  {
    name: 'giltigt testfall - test av camelcase',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      components: {
        schemas: {
          Error: {
            type: 'object',
            properties: {
              verylongMessage: {
                type: 'string',
              },
            },
          },
        },
      },
    },
    errors: [],
  },
  {
    name: 'ogiltigt testfall - test av snakecase',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      components: {
        schemas: {
          Error: {
            type: 'object',
            properties: {
              _verylongmessage: {
                type: 'string',
              },
            },
          },
        },
      },
    },
    errors: [
      {
        message: 'För fältnamn i request och response body BÖR camelCase eller snake_case notation användas.',
        path: ['components', 'schemas', 'Error', 'properties', '_verylongmessage'],
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
  {
    name: 'ogiltigt testfall - test av camelCase',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      components: {
        schemas: {
          Error: {
            type: 'object',
            properties: {
              VeryLongMessage: {
                type: 'string',
              },
            },
          },
        },
      },
    },
    errors: [
      {
        message: 'För fältnamn i request och response body BÖR camelCase eller snake_case notation användas.',
        path: ['components', 'schemas', 'Error', 'properties', 'VeryLongMessage'],
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
]);
testRule('Ame05', [
  {
    name: 'giltigt testfall - test med flatcase',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      components: {
        schemas: {
          Error: {
            type: 'object',
            properties: {
              verylonoooooooooooongflatcaseingmessage: {
                type: 'string',
              },
              veryshortflatcaseingmessage: {
                type: 'string',
              },
            },
          },
        },
      },
    },
    errors: [],
  },
  {
    name: 'ogiltigt testfall - test med snakecase och camelcase inom samme schemaobjekt',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      components: {
        schemas: {
          Error: {
            type: 'object',
            properties: {
              very_long_message: {
                type: 'string',
              },
              veryLongMessage: {
                type: 'string',
              },
            },
          },
        },
      },
    },
    errors: [
      {
        message: 'Inom ett API SKALL namnsättningen vara konsekvent, dvs blanda inte camelCase och snake_case.',
        path: ['components', 'schemas', 'Error', 'properties', 'very_long_message'],
        severity: DiagnosticSeverity.Error,
      },
      {
        message: 'Inom ett API SKALL namnsättningen vara konsekvent, dvs blanda inte camelCase och snake_case.',
        path: ['components', 'schemas', 'Error', 'properties', 'veryLongMessage'],
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
  {
    name: 'ogiltigt testfall - test med snakecase och camelcase med flera schemaobjekt',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      components: {
        schemas: {
          Error: {
            type: 'object',
            properties: {
              verylong: {
                type: 'string',
              },
              message: {
                type: 'string',
              },
            },
          },
          Error2: {
            type: 'object',
            properties: {
              very_short: {
                type: 'string',
              },
              veryLongg: {
                type: 'string',
              },
            },
          },
        },
      },
    },
    errors: [
      {
        message: 'Inom ett API SKALL namnsättningen vara konsekvent, dvs blanda inte camelCase och snake_case.',
        path: ['components', 'schemas', 'Error2', 'properties', 'very_short'],
        severity: DiagnosticSeverity.Error,
      },
      {
        message: 'Inom ett API SKALL namnsättningen vara konsekvent, dvs blanda inte camelCase och snake_case.',
        path: ['components', 'schemas', 'Error2', 'properties', 'veryLongg'],
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
]);
testRule('Ame07', [
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      components: {
        schemas: {
          Error: {
            type: 'object',
            properties: {
              code: {
                type: 'integer',
                format: 'int32',
              },
              message: {
                type: 'string',
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
      components: {
        schemas: {
          Error: {
            type: 'object',
            properties: {
              'co-de': {
                type: 'integer',
                format: 'int32',
              },
              message: {
                type: 'string',
              },
            },
          },
        },
      },
    },
    errors: [
      {
        message: 'Fältnamn BÖR använda tecken som är alfanumeriska.',
        path: ['components', 'schemas', 'Error', 'properties', 'co-de'],
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
  {
    name: 'ogiltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      components: {
        schemas: {
          Error: {
            type: 'object',
            properties: {
              code: {
                type: 'integer',
                format: 'int32',
              },
              'mes%sage': {
                type: 'string',
              },
            },
          },
        },
      },
    },
    errors: [
      {
        message: 'Fältnamn BÖR använda tecken som är alfanumeriska.',
        path: ['components', 'schemas', 'Error', 'properties', 'mes%sage'],
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
  {
    name: 'ogiltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      components: {
        schemas: {
          Error: {
            type: 'object',
            properties: {
              code: {
                type: 'integer',
                format: 'int32',
              },
              'm-essage': {
                type: 'string',
              },
            },
          },
        },
      },
    },
    errors: [
      {
        message: 'Fältnamn BÖR använda tecken som är alfanumeriska.',
        path: ['components', 'schemas', 'Error', 'properties', 'm-essage'],
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
]);
