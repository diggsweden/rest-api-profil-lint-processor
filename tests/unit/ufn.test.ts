// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { DiagnosticSeverity } from '@stoplight/types';
import testRule from '../util/helperTest.js';

testRule('Ufn09Path', [
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'https://test.se/v1/dsa' }],
      paths: { '/this-is-kebab-case': {} },
    },
    errors: [],
  },
  {
    name: 'ogiltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'https://test.se/v1/dsa' }],
      paths: { '/Detta_e_snake_case': {} },
    },
    errors: [
      {
        message:
          "Blanksteg ' ' och understreck '_' SKALL INTE användas i URL:er med undantag av parameter-delen (gäller alltså URL-elementen Scheme, Authority och Path samt API-elementen protokoll, domännamn, api, version, resurs och identifierare).",
        path: ['paths', '/Detta_e_snake_case'],
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
]);

testRule('Ufn09Server', [
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'https://test.se/v1/dsa' }],
      paths: { '/this-is-kebab-case': {} },
    },
    errors: [],
  },
  {
    name: 'ogiltigt testfall - understreck i server url',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'https://test.se/v1_/dsa' }],
      paths: { '/Dettacase': {} },
    },
    errors: [
      {
        message:
          "Blanksteg ' ' och understreck '_' SKALL INTE användas i URL:er med undantag av parameter-delen (gäller alltså URL-elementen Scheme, Authority och Path samt API-elementen protokoll, domännamn, api, version, resurs och identifierare).",
        path: ['servers', '0', 'url'],
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
]);
testRule('Ufn09InPathParameters', [
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'https://test.se/v1/dsa' }],
      paths: {
        '/this-is-kebab-case': {
          get: {
            description: 'Ogiltigt testfall av CamelCase',
            parameters: [
              {
                name: 'VeryLongName',
                in: 'path',
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
    name: 'ogiltigt testfall - understreck i server url',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'https://test.se/v1_/dsa' }],
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
          },
        },
      },
    },
    errors: [
      {
        message:
          "Blanksteg ' ' och understreck '_' SKALL INTE användas i URL:er med undantag av parameter-delen (gäller alltså URL-elementen Scheme, Authority och Path samt API-elementen protokoll, domännamn, api, version, resurs och identifierare).",
        path: ['paths', '/Dettacase', 'get', 'parameters', '0', 'name'],
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
]);

testRule('Ufn07', [
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'http://api.example.com' }, { url: 'http://api.example.com' }],
      paths: { '/abcdefghijklmnopqrstuvxyz-.~': {} },
    },
    errors: [],
  },
  {
    name: 'ogiltigt testfall med asterisk i path',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'http://api.example.com' }],
      paths: { '/a-*:-is-not-allowed': {} },
    },
    errors: [
      {
        message:
          'URL:n SKALL använda dessa tecknen a-z, 0-9, "-", "." samt "~", se vidare i RFC 3986) (gäller URL-elementen Scheme, Authority och Path samt API-elementen protokoll, domännamn, api, version, resurs och identifierare).',
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
  {
    name: 'ogiltigt testfall med asterisk i server url',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'http://api.exa*mple.com' }],
      paths: { '/a--is-not-allowed': {} },
    },
    errors: [
      {
        message:
          'URL:n SKALL använda dessa tecknen a-z, 0-9, "-", "." samt "~", se vidare i RFC 3986) (gäller URL-elementen Scheme, Authority och Path samt API-elementen protokoll, domännamn, api, version, resurs och identifierare).',
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
  {
    name: 'ogiltigt testfall med # i server url',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'http://api.example.com' }, { url: 'http://api.exam#ple.com' }],
      paths: { '/a--is-not-allowed': {} },
    },
    errors: [
      {
        message:
          'URL:n SKALL använda dessa tecknen a-z, 0-9, "-", "." samt "~", se vidare i RFC 3986) (gäller URL-elementen Scheme, Authority och Path samt API-elementen protokoll, domännamn, api, version, resurs och identifierare).',
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
  {
    name: 'ogiltigt testfall med # i server path',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'http://api.example.com' }, { url: 'http://api.example.com' }],
      paths: { '/a--is-not-allowed': {}, '/a--i#s-not-alslowed': {} },
    },
    errors: [
      {
        message:
          'URL:n SKALL använda dessa tecknen a-z, 0-9, "-", "." samt "~", se vidare i RFC 3986) (gäller URL-elementen Scheme, Authority och Path samt API-elementen protokoll, domännamn, api, version, resurs och identifierare).',
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
]);
testRule('Ufn08', [
  {
    name: "giltigt testfall - bara gemener och bindestreck ('-')",
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: { '/correct-use-of-dash/in-path': {} },
    },
    errors: [],
  },
  {
    name: 'giltigt testfall - ignorera path parametrar',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: { '/correct-use-of-dash/in-path/{path_param_1}/{path_param_2}': {} },
    },
    errors: [],
  },
  {
    name: 'giltigt testfall - ignorera versaler, finns annan regel för det',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: { 'p-ath-with-UPPERCASE': {} },
    },
    errors: [],
  },
  {
    name: 'ogiltigt testfall - underscore i path',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: { '/invalid_path': {} },
    },
    errors: [
      {
        message:
          "Endast bindestreck '-' SKALL användas för att separera ord för att öka läsbarheten samt förenkla för sökmotorer att indexera varje ord för sig (gäller URL-elementen Authority och Path. Mer specifikt API-elementen domännamn, api, resurs, identifierare).",
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
  {
    name: 'ogiltigt testfall - tilde i path',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: { '/invalid~path': {} },
    },
    errors: [
      {
        message:
          "Endast bindestreck '-' SKALL användas för att separera ord för att öka läsbarheten samt förenkla för sökmotorer att indexera varje ord för sig (gäller URL-elementen Authority och Path. Mer specifikt API-elementen domännamn, api, resurs, identifierare).",
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
  {
    name: 'ogiltigt testfall - två eller flera bindestreck i rad',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: { '/invalid--path': {} },
    },
    errors: [
      {
        message:
          "Endast bindestreck '-' SKALL användas för att separera ord för att öka läsbarheten samt förenkla för sökmotorer att indexera varje ord för sig (gäller URL-elementen Authority och Path. Mer specifikt API-elementen domännamn, api, resurs, identifierare).",
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
  {
    name: 'ogiltigt testfall - börjar med bindestreck',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: { '/-invalid-path': {} },
    },
    errors: [
      {
        message:
          "Endast bindestreck '-' SKALL användas för att separera ord för att öka läsbarheten samt förenkla för sökmotorer att indexera varje ord för sig (gäller URL-elementen Authority och Path. Mer specifikt API-elementen domännamn, api, resurs, identifierare).",
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
  {
    name: 'ogiltigt testfall - slutar med bindestreck',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: { '/invalid-path-': {} },
    },
    errors: [
      {
        message:
          "Endast bindestreck '-' SKALL användas för att separera ord för att öka läsbarheten samt förenkla för sökmotorer att indexera varje ord för sig (gäller URL-elementen Authority och Path. Mer specifikt API-elementen domännamn, api, resurs, identifierare).",
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
]);

testRule('Ufn02', [
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: { 'https://www.example.com': {} },
    },
    errors: [],
  },
  {
    name: 'ogiltigt testfall 1',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: { '/': {} },
      servers: [{ url: 'http://api.example.com/' }],
    },
    errors: [
      {
        message: 'Alla API:er SKALL exponeras via HTTPS på port 443.',
        path: ['servers', '0', 'url'],
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
]);

testRule('Ufn05paths', [
  {
    name: 'giltigt testfall',
    document: {
      servers: [
        {
          url: 'https://pets.se/dsa/v1',
        },
      ],
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: { '/pets/{id}': {} },
    },
    errors: [],
  },

  {
    name: 'ogiltigt testfall',
    document: {
      servers: [
        {
          url: 'https://pets.se/dsa/v1',
        },
      ],
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/PAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAram':
          {
            get: {
              summary: 'List all pets',
              operationId: 'listPets',
              tags: ['pets'],
              parameters: [
                {
                  name: 'hgjhg',
                  in: 'query',
                  description: 'How many items to return at one time (max 100)',
                  required: false,
                  schema: {
                    type: 'integer',
                    maximum: 100,
                    format: 'int32',
                  },
                },
              ],
              responses: {
                '200': {
                  description: 'A paged array of pets',
                  headers: {
                    'x-next': {
                      description: 'A link to the next page of responses',
                      schema: {
                        type: 'string',
                      },
                    },
                  },
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/Pets',
                      },
                    },
                  },
                },
                default: {
                  description: 'unexpected error',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/Error',
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
        code: 'Ufn05paths',
        message: 'En URL BÖR INTE vara längre än 2048 tecken.',
        severity: DiagnosticSeverity.Warning,
        path: [
          'paths',
          '/PAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAram',
        ],
      },
    ],
  },
]);

testRule('Ufn05Servers', [
  {
    name: 'giltigt testfall',
    document: {
      servers: [
        {
          url: 'https://pets.se/dsa/v1',
        },
      ],
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: { '/pets/{id}': {} },
    },
    errors: [],
  },

  {
    name: 'ogiltigt testfall',
    document: {
      servers: [
        {
          url: 'https://pets.se/dsaPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAramPAram/v1',
        },
      ],
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/dtestpath': {
          get: {
            summary: 'List all pets',
            operationId: 'listPets',
            tags: ['pets'],
            parameters: [
              {
                name: 'hgjhg',
                in: 'query',
                description: 'How many items to return at one time (max 100)',
                required: false,
                schema: {
                  type: 'integer',
                  maximum: 100,
                  format: 'int32',
                },
              },
            ],
            responses: {
              '200': {
                description: 'A paged array of pets',
                headers: {
                  'x-next': {
                    description: 'A link to the next page of responses',
                    schema: {
                      type: 'string',
                    },
                  },
                },
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Pets',
                    },
                  },
                },
              },
              default: {
                description: 'unexpected error',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Error',
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
        code: 'Ufn05Servers',
        message: 'En URL BÖR INTE vara längre än 2048 tecken.',
        severity: DiagnosticSeverity.Warning,
        path: ['servers', '0', 'url'],
        range: {
          start: {
            character: 19,
            line: 0,
          },
          end: {
            character: 3053,
            line: 0,
          },
        },
      },
    ],
  },
]);
testRule('Ufn01', [
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: { '/exampletest': {} },
      servers: [{ url: 'http://petstore.swwagger.com/api/v2/' }],
    },
    errors: [],
  },
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: { '/exampletest': {} },
      servers: [{ url: 'http://api.petstore.sw/dsad/v22' }],
    },
    errors: [],
  },
  {
    name: 'ogiltigt testfall - fel format på protokoll',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: { '/exampletest232323': {} },
      servers: [{ url: 'htt//petstore.swwagger.com/api/v2' }],
    },
    errors: [
      {
        message:
          'En URL för ett API BÖR följa namnstandarden nedan: {protokoll}://{domännamn}/{api}/{version}/{resurs}/{identifierare}?{parametrar}',
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
  {
    name: 'ogiltigt testfall - saknar major versions nummer',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: { '/exampletest232323': {} },
      servers: [{ url: 'http//petstore.swwagger.com/api/v' }],
    },
    errors: [
      {
        message:
          'En URL för ett API BÖR följa namnstandarden nedan: {protokoll}://{domännamn}/{api}/{version}/{resurs}/{identifierare}?{parametrar}',
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
  {
    name: 'ogiltigt testfall - sknar : efter protokoll',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: { '/exampletest232323': {} },
      servers: [{ url: 'http//petstorecom/api/v2' }],
    },
    errors: [
      {
        message:
          'En URL för ett API BÖR följa namnstandarden nedan: {protokoll}://{domännamn}/{api}/{version}/{resurs}/{identifierare}?{parametrar}',
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
  {
    name: 'ogiltigt testfall - Saknar api och version',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: { '/exampletest232323': {} },
      servers: [{ url: 'http://petstorecom/' }],
    },
    errors: [
      {
        message:
          'En URL för ett API BÖR följa namnstandarden nedan: {protokoll}://{domännamn}/{api}/{version}/{resurs}/{identifierare}?{parametrar}',
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
  {
    name: 'ogiltigt testfall - fel plats version och api',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: { '/exampletest232323': {} },
      servers: [{ url: 'http://petstorecom/v2/api' }],
    },
    errors: [
      {
        message:
          'En URL för ett API BÖR följa namnstandarden nedan: {protokoll}://{domännamn}/{api}/{version}/{resurs}/{identifierare}?{parametrar}',
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
  {
    name: 'ogiltigt testfall - Fel format på version',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: { '/exampletest232323': {} },
      servers: [{ url: 'http://petstorecom/test/v22dsa/' }],
    },
    errors: [
      {
        message:
          'En URL för ett API BÖR följa namnstandarden nedan: {protokoll}://{domännamn}/{api}/{version}/{resurs}/{identifierare}?{parametrar}',
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
  {
    name: 'ogiltigt testfall - dubbel //',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: { '/exampletest232323': {} },
      servers: [{ url: 'https://myapi.example.com//v2' }],
    },
    errors: [
      {
        message:
          'En URL för ett API BÖR följa namnstandarden nedan: {protokoll}://{domännamn}/{api}/{version}/{resurs}/{identifierare}?{parametrar}',
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
]);
