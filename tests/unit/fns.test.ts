// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { DiagnosticSeverity } from '@stoplight/types';
import testRule from '../util/helperTest.js';

testRule('Fns01', [
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/foo': {
          get: {
            description: 'Gilitigt testfall av camelCase',
            parameters: [
              {
                name: 'veryLongName',
                in: 'query',
                required: false,
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
          get: {
            description: 'Ogiltigt testfall av CamelCase',
            parameters: [
              {
                name: 'VeryLongName',
                in: 'query',
                required: false,
              },
            ],
          },
        },
      },
    },
    errors: [
      {
        message:
          'Parameternamn SKALL anges med en konsekvent namnkonvention inom ett API, exempelvis antingen snake_case eller camelCase',
        path: ['paths', '/foo', 'get', 'parameters', '0', 'name'],
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/foo': {
          get: {
            description: 'Gilitigt testfall av snake case',
            parameters: [
              {
                name: 'very_long_name',
                in: 'query',
                required: false,
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
          get: {
            description: 'Ogiltigt testfall av snake case',
            parameters: [
              {
                name: 'very_longName',
                in: 'query',
                required: false,
              },
            ],
          },
        },
      },
    },
    errors: [
      {
        message:
          'Parameternamn SKALL anges med en konsekvent namnkonvention inom ett API, exempelvis antingen snake_case eller camelCase',
        path: ['paths', '/foo', 'get', 'parameters', '0', 'name'],
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
]);

testRule('Fns03', [
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/charactercheck': {
          get: {
            description: 'Sökparametrar SKALL starta med en bokstav.',
            parameters: [
              {
                name: 'veryLongName',
                in: 'query',
                required: false,
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
        '/charactercheck': {
          get: {
            description: 'Sökparametrar SKALL starta med en bokstav.',
            parameters: [
              {
                name: '_VeryLongName',
                in: 'query',
                required: false,
              },
            ],
          },
        },
      },
    },
    errors: [
      {
        message: 'Sökparametrar SKALL starta med en bokstav.',
        path: ['paths', '/charactercheck', 'get', 'parameters', '0', 'name'],
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
]);

testRule('Fns09', [
  {
    name: "giltigt testfall - enbart 'limit' utan 'page' eller 'offset' (dvs default värde för 'limit' kan vara vad som helst)",
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/limitcheck': {
          get: {
            description: 'Defaultvärde för limit BÖR vara 20',
            parameters: [
              {
                name: 'limit',
                in: 'query',
                required: false,
                schema: {
                  type: 'integer',
                  default: 100,
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
    name: "giltigt testfall - med 'limit' och 'page'",
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/limitcheck': {
          get: {
            description: 'Defaultvärde för limit BÖR vara 20',
            parameters: [
              {
                name: 'limit',
                in: 'query',
                required: false,
                schema: {
                  type: 'integer',
                  default: 20,
                },
              },
              {
                name: 'page',
                in: 'query',
                required: false,
                schema: {
                  type: 'integer',
                  default: 1,
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
    name: "ogiltigt testfall - med 'limit' och 'page' där default värde för 'limit' är fel",
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/limitcheck': {
          get: {
            description: 'Defaultvärde för limit BÖR vara 20',
            parameters: [
              {
                name: 'limit',
                in: 'query',
                required: false,
                schema: {
                  type: 'integer',
                  default: 201,
                },
              },
              {
                name: 'page',
                in: 'query',
                required: false,
                schema: {
                  type: 'integer',
                  default: 1,
                },
              },
            ],
          },
        },
      },
    },
    errors: [
      {
        message: 'Defaultvärde för limit BÖR vara 20',
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
]);
testRule('Fns05', [
  {
    name: 'giltigt testfall sökparameter BÖR vara frivillig',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/testpath': {
          get: {
            parameters: [
              {
                name: 'limit',
                in: 'query',
                required: false,
                schema: {
                  type: 'integer',
                  default: 100,
                },
              },
            ],
          },
        },
        '/testpasth': {
          get: {
            parameters: [
              {
                name: 'limit',
                in: 'query',
                required: false,
                schema: {
                  type: 'integer',
                  default: 100,
                },
              },
              {
                name: 'q',
                in: 'query',
                required: false,
                schema: {
                  type: 'string',
                  default: 100,
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
    name: 'ogiltigt testfall - värde true.',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/urlsakratecknencheck': {
          get: {
            description: 'Sökparametrar BÖR vara frivilliga.',
            parameters: [
              {
                name: 'url@sakra,tecknen+checke*',
                in: 'query',
                required: true,
              },
            ],
          },
        },
      },
    },
    errors: [
      {
        message: 'Sökparametrar BÖR vara frivilliga.',
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
  {
    name: 'ogiltigt testfall - värde 0',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/urlsakratecknencheck': {
          get: {
            description: 'Sökparametrar BÖR vara frivilliga.',
            parameters: [
              {
                name: 'url@sakra,tecknen+checke*',
                in: 'query',
                required: 0,
              },
            ],
          },
        },
      },
    },
    errors: [
      {
        message: 'Sökparametrar BÖR vara frivilliga.',
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
]);

testRule('Fns06', [
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/urlsakratecknencheck': {
          get: {
            description:
              "Sökparametrar BÖR använda tecken som är URL-säkra (tecknen A-Z, a-z, 0-9, '-', '.', '_' samt '~', se vidare i RFC 3986)",
            parameters: [
              {
                name: 'url_sakra-tecknen.check~',
                in: 'query',
                required: false,
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
        '/urlsakratecknencheck': {
          get: {
            description:
              "Sökparametrar BÖR använda tecken som är URL-säkra (tecknen A-Z, a-z, 0-9, '-', '.', '_' samt '~', se vidare i RFC 3986)",
            parameters: [
              {
                name: 'url@sakra,tecknen+checke*',
                in: 'query',
                required: false,
              },
            ],
          },
        },
      },
    },
    errors: [
      {
        message:
          "Sökparametrar BÖR använda tecken som är URL-säkra (tecknen A-Z, a-z, 0-9, '-', '.', '_' samt '~', se vidare i RFC 3986)",
        path: ['paths', '/urlsakratecknencheck', 'get', 'parameters', '0', 'name'],
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
]);

testRule('Fns07', [
  {
    name: "giltigt testfall - enbart 'limit' utan 'page' eller 'offset'",
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/testpath': {
          get: {
            parameters: [
              {
                name: 'limit',
                in: 'query',
                required: false,
                schema: {
                  type: 'integer',
                  default: 100,
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
    name: "giltigt testfall - med 'limit' och 'page'",
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/testpath': {
          get: {
            parameters: [
              {
                name: 'limit',
                in: 'query',
                required: false,
                schema: {
                  type: 'integer',
                  default: 20,
                },
              },
              {
                name: 'page',
                in: 'query',
                required: false,
                schema: {
                  type: 'integer',
                  default: 1,
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
    name: "giltigt testfall - med 'limit' och 'offset'",
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/testpath': {
          get: {
            parameters: [
              {
                name: 'limit',
                in: 'query',
                required: false,
                schema: {
                  type: 'integer',
                  default: 20,
                },
              },
              {
                name: 'offset',
                in: 'query',
                required: false,
                schema: {
                  type: 'integer',
                  default: 1,
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
    name: "ogiltigt testfall - med 'limit', 'offset' och 'page'",
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/testpath': {
          get: {
            parameters: [
              {
                name: 'limit2',
                in: 'query',
                required: false,
                schema: {
                  type: 'integer',
                  default: 20,
                },
              },
              {
                name: 'offset',
                in: 'query',
                required: false,
                schema: {
                  type: 'integer',
                  default: 1,
                },
              },
              {
                name: 'page',
                in: 'query',
                required: false,
                schema: {
                  type: 'integer',
                  default: 1,
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
          "Vid användande av paginering, SKALL följande parametrar ingå i request: 'limit' och någon av 'page' eller 'offset'",
        path: ['paths', '/testpath', 'get', 'parameters'],
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
]);

testRule('Fns08', [
  {
    name: "giltigt testfall - enbart 'page', kan ha vilket defaultvärde som helst",
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/testpath': {
          get: {
            parameters: [
              {
                name: 'page',
                in: 'query',
                required: false,
                schema: {
                  type: 'integer',
                  default: 2,
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
    name: "giltigt testfall - 'om 'limit' finns ska 'page' ha defaultvärde 1",
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/testpath': {
          get: {
            parameters: [
              {
                name: 'limit',
                in: 'query',
                required: false,
                schema: {
                  type: 'integer',
                  default: 20,
                },
              },
              {
                name: 'page',
                in: 'query',
                required: false,
                schema: {
                  type: 'integer',
                  default: 1,
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
    name: "ogiltigt testfall - felaktigt defaultvärde på 'page' när 'limit' finns",
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/testpath': {
          get: {
            parameters: [
              {
                name: 'page',
                in: 'query',
                required: false,
                schema: {
                  type: 'integer',
                  default: 2,
                },
              },
              {
                name: 'limit',
                in: 'query',
                required: false,
                schema: {
                  type: 'integer',
                  default: 1,
                },
              },
            ],
          },
        },
      },
    },
    errors: [
      {
        message: "'page' SKALL alltid starta med värde 1",
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
  {
    name: "ogiltigt testfall - med 'limit', 'offset' och 'page'",
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/testpath': {
          get: {
            parameters: [
              {
                name: 'limit',
                in: 'query',
                required: false,
                schema: {
                  type: 'integer',
                  default: 20,
                },
              },
              {
                name: 'page',
                in: 'query',
                required: false,
                schema: {
                  type: 'integer',
                  default: 2,
                },
              },
            ],
          },
        },
      },
    },
    errors: [
      {
        message: "'page' SKALL alltid starta med värde 1",
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
]);
