// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { DiagnosticSeverity } from '@stoplight/types';
import testRule from '../util/helperTest.js';

testRule('Mog01', [
  {
    name: 'ogiltigt testfall - innehåller endast en resurs',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            responses: { 200: { description: 'OK' } },
          },
        },
      },
    },
    errors: [
      {
        message: 'Alla API:er SKALL designas för att uppnå nivå 2 enligt Richardson Maturity Model.',
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
  {
    name: 'ogiltigt testfall - en resurs saknar giltig REST-metod',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            responses: { 200: { description: 'OK' } },
          },
        },
        '/pets/{petId}': {
          options: {
            responses: { 204: { description: 'Supported methods' } },
          },
        },
      },
    },
    errors: [
      {
        message: 'Alla API:er SKALL designas för att uppnå nivå 2 enligt Richardson Maturity Model.',
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
  {
    name: 'giltigt testfall - två resurser med vardera en giltig REST-metod',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            responses: { 200: { description: 'OK' } },
          },
        },
        '/pets/{petId}': {
          get: {
            responses: { 200: { description: 'OK' } },
          },
        },
      },
    },
    errors: [],
  },
  {
    name: 'giltigt testfall - två resurser med flera metoder',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            responses: { 200: { description: 'OK' } },
          },
          post: {
            responses: { 201: { description: 'Created' } },
          },
        },
        '/pets/{petId}': {
          get: {
            responses: { 200: { description: 'OK' } },
          },
          delete: {
            responses: { 204: { description: 'No content' } },
          },
        },
      },
    },
    errors: [],
  },
]);
testRule('Mog02', [
  {
    name: 'ogiltigt testfall - innehåller endast en resurs',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: { 'application/hal+json': { schema: { type: 'object' } } },
              },
            },
          },
        },
      },
    },
    errors: [
      {
        message: 'Alla API:er BÖR designas för att uppnå nivå 3 enligt Richardson Maturity Model.',
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
  {
    name: 'ogiltigt testfall - en resurs saknar giltig REST-metod',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: { 'application/hal+json': { schema: { type: 'object' } } },
              },
            },
          },
        },
        '/pets/{petId}': {
          options: {
            responses: { '204': { description: 'Supported methods' } },
          },
        },
      },
    },
    errors: [
      {
        message: 'Alla API:er BÖR designas för att uppnå nivå 3 enligt Richardson Maturity Model.',
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
  {
    name: 'ogiltigt testfall - inga HATEOAS-indikatorer i svaren',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            responses: { '200': { description: 'OK' } },
          },
          post: {
            responses: { '201': { description: 'Created' } },
          },
        },
        '/pets/{petId}': {
          get: {
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    },
    errors: [
      {
        message: 'Alla API:er BÖR designas för att uppnå nivå 3 enligt Richardson Maturity Model.',
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
  {
    name: 'giltigt testfall - svar använder application/hal+json',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: { 'application/hal+json': { schema: { type: 'object' } } },
              },
            },
          },
        },
        '/pets/{petId}': {
          get: {
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    },
    errors: [],
  },
  {
    name: 'giltigt testfall - svar innehåller OpenAPI links-objekt',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                links: {
                  GetPetById: { operationId: 'getPetById', parameters: { petId: '$response.body#/id' } },
                },
              },
            },
          },
        },
        '/pets/{petId}': {
          get: {
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    },
    errors: [],
  },
  {
    name: 'giltigt testfall - svarsschemat innehåller _links-egenskap',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        _links: {
                          type: 'object',
                          properties: {
                            self: { type: 'object', properties: { href: { type: 'string' } } },
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
        '/pets/{petId}': {
          get: {
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    },
    errors: [],
  },
]);
