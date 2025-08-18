// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { DiagnosticSeverity } from '@stoplight/types';
import testRule from './util/helperTest.ts';

testRule('Sak09', [
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
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
        securitySchemes: {
          basicAuth: {
            type: 'http',
            scheme: 'basic',
          },
        },
      },
    },
    errors: [
      {
        message: 'Basic- eller Digest-autentisering SKALL INTE användas.',
        path: ['components', 'securitySchemes', 'basicAuth', 'scheme'],
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
  {
    name: 'ogiltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      components: {
        securitySchemes: {
          digestAuth: {
            type: 'http',
            scheme: 'digest',
          },
        },
      },
    },
    errors: [
      {
        message: 'Basic- eller Digest-autentisering SKALL INTE användas.',
        path: ['components', 'securitySchemes', 'digestAuth', 'scheme'],
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
]);
testRule('Sak10', [
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
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
        securitySchemes: {
          basicAuth: {
            type: 'http',
            scheme: 'basic',
          },
        },
      },
    },
    errors: [
      {
        message: 'Authorization: Bearer header SKALL användas för autentisering/auktorisation.',
        path: ['components', 'securitySchemes', 'basicAuth', 'scheme'],
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
]);
testRule('Sak15', [
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      components: {
        securitySchemes: {
          ApiKeyQuery: {
            type: 'apiKey',
            in: 'header',
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
        securitySchemes: {
          ApiKeyQuery: {
            type: 'apiKey',
            in: 'query',
          },
        },
      },
    },
    errors: [
      {
        message: 'API-nycklar SKALL INTE inkluderas i URL eller querysträngen',
        path: ['components', 'securitySchemes', 'ApiKeyQuery'],
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
]);
testRule('Sak16', [
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      components: {
        securitySchemes: {
          ApiKeyQuery: {
            type: 'apiKey',
            in: 'header',
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
        securitySchemes: {
          ApiKeyQuery: {
            type: 'apiKey',
            in: 'query',
          },
        },
      },
    },
    errors: [
      {
        message: 'API-nycklar SKALL inkluderas i HTTP-headern eftersom querysträngar kan sparas av klienten eller servern i okrypterat format av webbläsaren eller serverapplikationen.',
        path: ['components', 'securitySchemes', 'ApiKeyQuery'],
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
]);
testRule('Sak18', [
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      components: {
        securitySchemes: {
          oAuth2: {
            type: 'oauth2',
            flows: {
              clientCredentials: {
                tokenUrl: 'https://example.com/token',
                refreshUrl: 'https://example.com/refresh',
              },
            },
          },
        },
      },
    },
    errors: [],
  },
  {
    name: 'ogiltigt testfall - http är ej tillåtet',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      components: {
        securitySchemes: {
          oAuth2: {
            type: 'oauth2',
            flows: {
              clientCredentials: {
                tokenUrl: 'http://example.com/token',
              },
            },
          },
        },
      },
    },
    errors: [
      {
        message: 'OAuth version 2.0 eller senare BÖR användas för auktorisation.',
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
]);
