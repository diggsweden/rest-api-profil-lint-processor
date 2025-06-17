// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { DiagnosticSeverity } from '@stoplight/types';
import testRule from './util/helperTest.ts';

testRule('Dok20', [
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'https://example.com/my-api/v1' }],
      paths: {
        '/Dettacase': {
          get: {
            description: 'Ogiltigt testfall av CamelCase',
            parameters: [
              {
                name: 'Very_LongName',
                in: 'path',
                required: false,
              },
            ],
            responses: {
              '200': {
                description: 'test',
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
      servers: [{ url: 'https://example.com/my-api/v1' }],
      paths: {
        '/Dettacase': {
          get: {
            description: 'Ogiltigt testfall av CamelCase',
            parameters: [
              {
                name: 'Very_LongName',
                in: 'path',
                required: false,
              },
            ],
            responses: {
              '200': {
                description: '',
              },
            },
          },
        },
      },
    },
    errors: [
      {
        code: 'Dok20',
        message: 'Förväntade returkoder och felkoder SKALL vara fullständigt dokumenterade.',
        path: ['paths', '/Dettacase', 'get', 'responses', '200', 'description'],
        severity: DiagnosticSeverity.Error,
        range: {
          start: {
            line: 0,
            character: 276,
          },
          end: {
            line: 0,
            character: 278,
          },
        },
      },
    ],
  },
]);
testRule('Dok06', [
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0', description: 'Här finns det dokumentation på svenska and english.' },
    },
    errors: [],
  },
  {
    name: 'ogiltigt testfall - endast svenska',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0', description: 'Detta är på svenska' },
    },
    errors: [
      {
        message: 'Dokumentationen BÖR finnas på både svenska och engelska.',
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
  {
    name: 'ogiltigt testfall - endast engelska',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0', description: 'This is in english' },
    },
    errors: [
      {
        message: 'Dokumentationen BÖR finnas på både svenska och engelska.',
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
  {
    name: 'ogiltigt testfall - båda språken med sammansatta ord',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0', description: 'Härfinnsdetdokumentationpåsvenskaandenglish.' },
    },
    errors: [
      {
        message: 'Dokumentationen BÖR finnas på både svenska och engelska.',
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
]);
testRule('Dok07', [
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0', description: 'john' },
      servers: [{ url: 'https://example.com/my-api/v1' }],
    },
    errors: [],
  },
  {
    name: 'ogiltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'https://example.com/my-api/v1' }],
      paths: {
        '/Dettacase': {
          get: {
            description: 'Ogiltigt testfall av CamelCase',
            parameters: [
              {
                name: 'Very_LongName',
                in: 'path',
                required: false,
              },
            ],
            responses: {
              '200': {
                description: '',
              },
            },
          },
        },
      },
    },
    errors: [
      {
        code: 'Dok07',
        message: 'Dokumentationen av ett API BÖR innehålla övergripande information om API:et.',
        path: ['info'],
        severity: DiagnosticSeverity.Warning,
        range: {
          start: {
            line: 0,
            character: 26,
          },
          end: {
            line: 0,
            character: 42,
          },
        },
      },
    ],
  },
]);
testRule('Dok17', [
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
    },
    errors: [],
  },
  {
    name: 'ogiltigt testfall',
    document: {
      swagger: '2.0',
    },
    errors: [
      {
        message:
          'API specifikation BÖR dokumenteras med den senaste versionen av OpenAPI Specification. ( Linter-analysverktyget (RAP-LP) för den nationella REST API-profilen är designat för senaste major versionen av OpenAPI Specification. Använd därför denna för full täckning av de implementerade reglerna. )',
        //message: "AAA",
        path: ['swagger'],
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
]);
testRule('Dok19', [
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'https://example.com/my-api/v1' }],
      paths: {
        '/thiscase': {
          operation: {
            description: 'description field test',
            responses: {
              '200': {
                description: 'test',
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
      servers: [{ url: 'https://example.com/my-api/v1' }],
      paths: {
        '/thiscase': {
          operation: {
            //description: "dfadfa",
            //summery: "",
            responses: {
              '200': {
                description: '',
              },
            },
          },
        },
      },
    },
    errors: [
      {
        code: 'Dok19',
        message:
          'Ett API:s resurser och de möjliga operationer som kan utföras på resursen SKALL beskrivas så utförligt och tydligt som möjligt',
        path: ['paths', '/thiscase', 'operation'],
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
]);

testRule('Dok01', [
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'https://example.com/my-api/v1' }],
      externalDocs: {
        description: 'API Documentation and specification',
        url: 'External link to API',
      },
    },
    errors: [],
  },
  {
    name: 'ogiltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'https://example.com/my-api/v1' }],
      externalDocs: {
        //description: "API Documentation and specification",
        //url:"External link to API"
      },
    },
    errors: [
      {
        code: 'Dok01',
        path: ['externalDocs'],
        message: 'I regel BÖR dokumentationen och specifikationen för ett API finnas allmänt tillgänglig online',
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
]);
testRule('Dok15Get', [
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'https://example.com/my-api/v1' }],
      paths: {
        '/Dettacase': {
          get: {
            description: 'Ogiltigt testfall av CamelCase',
            parameters: [
              {
                name: 'Very_LongName',
                in: 'path',
                required: false,
              },
            ],

            responses: {
              '200': {
                description: 'test',
                content: {
                  'application/json': {
                    examples: 's',
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Error1: {
            examples: 'test',
          },
        },
      },
    },
    errors: [],
  },
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'https://example.com/my-api/v1' }],
      paths: {
        '/Dettaarettnytttestcase': {
          get: {
            description: 'Giltigt testfall av CamelCase',
            parameters: [
              {
                name: 'VerylongName',
                in: 'path',
                required: false,
              },
            ],
            responses: {
              '200': {
                description: 'test',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Error1',
                    },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Error1: {
            example: 'test',
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
      servers: [{ url: 'https://example.com/my-api/v1' }],
      paths: {
        '/Dettacase': {
          get: {
            description: 'Ogiltigt testfall av CamelCase',
            parameters: [
              {
                name: 'Very_LongName',
                in: 'path',
                required: false,
              },
            ],
            responses: {
              '200': {
                description: '',
                content: {
                  'application/json': {
                    test: 'ds',
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
        code: 'Dok15Get',
        message:
          'I dokumentationen av API:et SKALL exempel på API:ets fråga (eng:request) och svar (eng:reply) finnas i sin helhet.',
        path: ['paths', '/Dettacase', 'get', 'responses', '200', 'content', 'application/json'],
        severity: DiagnosticSeverity.Error,
        range: {
          start: {
            line: 0,
            character: 309,
          },
          end: {
            line: 0,
            character: 321,
          },
        },
      },
    ],
  },
  {
    name: 'ogiltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'https://example.com/my-api/v1' }],
      paths: {
        '/Dettacase': {
          get: {
            description: 'Ogiltigt testfall av CamelCase',
            parameters: [
              {
                name: 'Very_LongName',
                in: 'path',
                required: false,
              },
            ],
            responses: {
              '200': {
                description: '',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Error1',
                    },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Error1: {},
        },
      },
    },
    errors: [
      {
        code: 'Dok15Get',
        message:
          'I dokumentationen av API:et SKALL exempel på API:ets fråga (eng:request) och svar (eng:reply) finnas i sin helhet.',
        path: ['paths', '/Dettacase', 'get', 'responses', '200', 'content', 'application/json'],
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
]);

testRule('Dok15ReqBody', [
  {
    name: 'giltigt testfall med inline examples',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'https://example.com/my-api/v1' }],
      paths: {
        '/Dettacase': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  examples: 's',
                },
              },
              '200': {
                description: 'test',
              },
            },
            description: 'Ogiltigt testfall av CamelCase',
            parameters: [
              {
                name: 'Very_LongName',
                in: 'path',
                required: false,
              },
            ],

            responses: {},
          },
        },
      },
      components: {
        schemas: {
          Error1: {
            examples: 'test',
          },
        },
      },
    },
    errors: [],
  },
  {
    name: 'giltigt testfall med schemaRef example(follow)',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'https://example.com/my-api/v1' }],
      paths: {
        '/Dettacase': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Answer1',
                  },
                },
              },
            },
            description: 'Ogiltigt testfall av CamelCase',
            parameters: [
              {
                name: 'Very_LongName',
                in: 'path',
                required: false,
              },
            ],

            responses: {},
          },
        },
      },
      components: {
        schemas: {
          Answer1: {
            example: 'test',
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
      servers: [{ url: 'https://example.com/my-api/v1' }],
      paths: {
        '/Dettacase': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  inteexamples: 's',
                },
              },
              description: 'Ogiltigt testfall av CamelCase',
              parameters: [
                {
                  name: 'Very_LongName',
                  in: 'path',
                  required: false,
                },
              ],

              responses: {
                '200': {
                  description: 'test',
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Error1: {},
        },
      },
    },
    errors: [
      {
        code: 'Dok15ReqBody',
        message:
          'I dokumentationen av API:et SKALL exempel på API:ets fråga (eng:request) och svar (eng:reply) finnas i sin helhet.',
        path: ['paths', '/Dettacase', 'post', 'requestBody', 'content', 'application/json'],
        severity: DiagnosticSeverity.Error,
        range: {
          start: {
            line: 0,
            character: 172,
          },
          end: {
            line: 0,
            character: 191,
          },
        },
      },
    ],
  },
  {
    name: 'ogiltigt testfall med schemaRef example (follow)',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'https://example.com/my-api/v1' }],
      paths: {
        '/Dettacase': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Answer1',
                  },
                },
              },
              description: 'Ogiltigt testfall av CamelCase',
              parameters: [
                {
                  name: 'Very_LongName',
                  in: 'path',
                  required: false,
                },
              ],

              responses: {
                '200': {
                  description: 'test',
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Answer1: {},
        },
      },
    },
    errors: [
      {
        code: 'Dok15ReqBody',
        message:
          'I dokumentationen av API:et SKALL exempel på API:ets fråga (eng:request) och svar (eng:reply) finnas i sin helhet.',
        path: ['paths', '/Dettacase', 'post', 'requestBody', 'content', 'application/json'],
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
]);
testRule('Dok01', [
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'https://example.com/my-api/v1' }],
      externalDocs: {
        description: 'API Documentation and specification',
        url: 'External link to API',
      },
    },
    errors: [],
  },
  {
    name: 'ogiltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'https://example.com/my-api/v1' }],
      externalDocs: {
        //description: "API Documentation and specification",
        //url:"External link to API"
      },
    },
    errors: [
      {
        code: 'Dok01',
        path: ['externalDocs'],
        message: 'I regel BÖR dokumentationen och specifikationen för ett API finnas allmänt tillgänglig online',
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
]);

testRule('Dok03Info', [
  {
    name: 'giltigt testfall',
    document: {
      servers: [
        {
          url: 'https://pets.se/dsa/v1',
        },
      ],
      openapi: '3.1.0',
      info: {
        version: '21.0.0',
        title: 'AME',
        description: 'API message',
        termsOfService: 'http://swagger.io/terms/',
      },
    },
    errors: [],
  },

  {
    name: 'ogiltigt testfall',
    document: {
      openapi: '3.1.0',
      info: {},
    },
    errors: [
      {
        code: 'Dok03Info',
        path: ['info'],
        message:
          'Dokumentationen för ett API SKALL innehålla följande: Om API, Användarvillkor, Datamodell för representation av resurser, Krav på autentisering, Livscykelhantering och versionshantering, Kontaktuppgifter.' +
          '[ info objektet bör ha title, version , description, termsOfService, contact , license ]',
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
]);

testRule('Dok03ContactName', [
  {
    name: 'giltigt testfall',
    document: {
      servers: [
        {
          url: 'https://pets.se/dsa/v1',
        },
      ],
      openapi: '3.1.0',
      info: {
        contact: {
          name: 'Swagger AP',
        },
      },
    },
    errors: [],
  },

  {
    name: 'ogiltigt testfall',
    document: {
      openapi: '3.1.0',
      info: {
        contact: {
          nname: 'Swagger AP',
        },
      },
    },
    errors: [
      {
        code: 'Dok03ContactName',
        path: ['info', 'contact'],
        message:
          'Dokumentationen för ett API SKALL innehålla följande: Om API, Användarvillkor, Datamodell för representation av resurser, Krav på autentisering, Livscykelhantering och versionshantering, Kontaktuppgifter.' +
          '(Contact saknar name)',
      },
    ],
  },
]);

testRule('Dok03ContactEmail', [
  {
    name: 'giltigt testfall',
    document: {
      servers: [
        {
          url: 'https://pets.se/dsa/v1',
        },
      ],
      openapi: '3.1.0',
      info: {
        contact: {
          email: 'email@email.com',
        },
      },
    },
    errors: [],
  },

  {
    name: 'ogiltigt testfall',
    document: {
      openapi: '3.1.0',
      info: {
        contact: {
          gemail: 'abce@emil.com',
        },
      },
    },
    errors: [
      {
        code: 'Dok03ContactEmail',
        path: ['info', 'contact'],
        message:
          'Dokumentationen för ett API SKALL innehålla följande: Om API, Användarvillkor, Datamodell för representation av resurser, Krav på autentisering, Livscykelhantering och versionshantering, Kontaktuppgifter.(Contact saknar email)',
      },
    ],
  },
]);

testRule('Dok03ContactUrl', [
  {
    name: 'giltigt testfall',
    document: {
      servers: [
        {
          url: 'https://pets.se/dsa/v1',
        },
      ],
      openapi: '3.1.0',
      info: {
        contact: {
          url: 'http://swagger.io',
        },
      },
    },
    errors: [],
  },

  {
    name: 'ogiltigt testfall',
    document: {
      openapi: '3.1.0',
      info: {
        contact: {
          uuuurll: 'http://swagger.io',
        },
      },
    },
    errors: [
      {
        code: 'Dok03ContactUrl',
        path: ['info', 'contact'],
        message:
          'Dokumentationen för ett API SKALL innehålla följande: Om API, Användarvillkor, Datamodell för representation av resurser, Krav på autentisering, Livscykelhantering och versionshantering, Kontaktuppgifter.(Contact saknar url)',
      },
    ],
  },
]);

testRule('Dok03Contact', [
  {
    name: 'giltigt testfall',
    document: {
      servers: [
        {
          url: 'https://pets.se/dsa/v1',
        },
      ],
      openapi: '3.1.0',
      info: {
        contact: {},
      },
    },
    errors: [],
  },

  {
    name: 'ogiltigt testfall',
    document: {
      openapi: '3.1.0',
      info: {
        ccontact: {},
      },
    },
    errors: [
      {
        code: 'Dok03Contact',
        path: ['info'],
        message:
          'Dokumentationen för ett API SKALL innehålla följande: Om API, Användarvillkor, Datamodell för representation av resurser, Krav på autentisering, Livscykelhantering och versionshantering, Kontaktuppgifter.(Saknar contact objektet)',
      },
    ],
  },
]);

testRule('Dok03License', [
  {
    name: 'giltigt testfall',
    document: {
      servers: [
        {
          url: 'https://pets.se/dsa/v1',
        },
      ],
      openapi: '3.1.0',
      info: {
        license: {},
      },
    },
    errors: [],
  },

  {
    name: 'ogiltigt testfall',
    document: {
      openapi: '3.1.0',
      info: {
        lllllicense: {},
      },
    },
    errors: [
      {
        code: 'Dok03License',
        path: ['info'],
        message:
          'Dokumentationen för ett API SKALL innehålla följande: Om API, Användarvillkor, Datamodell för representation av resurser, Krav på autentisering, Livscykelhantering och versionshantering, Kontaktuppgifter.(Saknar license objektet)',
      },
    ],
  },
]);

testRule('Dok03LicenseUrl', [
  {
    name: 'giltigt testfall',
    document: {
      servers: [
        {
          url: 'https://pets.se/dsa/v1',
        },
      ],
      openapi: '3.1.0',
      info: {
        license: {
          url: 'https://pets.se/dsa/v1',
        },
      },
    },
    errors: [],
  },

  {
    name: 'ogiltigt testfall',
    document: {
      openapi: '3.1.0',
      info: {
        license: {
          uuuuuuurl: '',
        },
      },
    },
    errors: [
      {
        code: 'Dok03LicenseUrl',
        path: ['info', 'license'],
        message:
          'Dokumentationen för ett API SKALL innehålla följande: Om API, Användarvillkor, Datamodell för representation av resurser, Krav på autentisering, Livscykelhantering och versionshantering, Kontaktuppgifter.(license saknar url)',
      },
    ],
  },
]);

testRule('Dok03LicenseName', [
  {
    name: 'giltigt testfall',
    document: {
      servers: [
        {
          url: 'https://pets.se/dsa/v1',
        },
      ],
      openapi: '3.1.0',
      info: {
        license: {
          name: 'this name',
        },
      },
    },
    errors: [],
  },

  {
    name: 'ogiltigt testfall',
    document: {
      openapi: '3.1.0',
      info: {
        license: {
          nnnnnnname: 'this is name',
        },
      },
    },
    errors: [
      {
        code: 'Dok03LicenseName',
        path: ['info', 'license'],
        message:
          'Dokumentationen för ett API SKALL innehålla följande: Om API, Användarvillkor, Datamodell för representation av resurser, Krav på autentisering, Livscykelhantering och versionshantering, Kontaktuppgifter.(license saknar name)',
      },
    ],
  },
]);
