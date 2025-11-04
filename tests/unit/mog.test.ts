// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { DiagnosticSeverity } from '@stoplight/types';
import testRule from '../util/helperTest.js';

testRule('Mog01', [
  {
    name: 'ogiltigt testfall - resurs innehåller varken get, post, put, delete eller patch',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0.0' },
      paths: {
        '/pets': {
          options: {
            parameters: [
              {
                name: 'pnr',
                in: 'query',
              },
            ],
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
    name: 'giltigt testfall - resurs innehåller get',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            parameters: [
              {
                name: 'pnr',
                in: 'query',
              },
            ],
          },
        },
      },
    },
    errors: [],
  },
  {
    name: 'giltigt testfall - resurs innehåller post och options',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0.0' },
      paths: {
        '/pets': {
          post: {
            parameters: [
              {
                name: 'pnr',
                in: 'query',
              },
            ],
          },
          options: {
            parameters: [
              {
                name: 'pnr',
                in: 'query',
              },
            ],
          },
        },
      },
    },
    errors: [],
  },
]);
testRule('Mog02', [
  {
    name: 'giltigt testfall - innehåller två resurser med två metoder vardera, samt minst en av GET, POST, PUT, DELETE eller PATCH per resurs',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            responses: {
              200: {
                description: 'OK',
              },
            },
          },
          head: {
            responses: {
              '200': {
                description: 'Resource exists',
              },
              '404': {
                description: 'Resource not found',
              },
            },
          },
        },
        '/pets/{petId}': {
          get: {
            responses: {
              200: {
                description: 'OK',
              },
              404: {
                description: 'Not found',
              },
            },
          },
          options: {
            responses: {
              '204': {
                description: 'Supported methods',
              },
            },
          },
        },
      },
    },
    errors: [],
  },
  {
    name: 'ogiltigt testfall - innehåller endast en resurs',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            responses: {
              200: {
                description: 'OK',
              },
            },
          },
          post: {
            responses: {
              201: {
                description: 'Created',
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
    name: 'ogiltigt testfall - GET, POST, PUT, DELETE och PATCH saknas i ena resursen',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            responses: {
              200: {
                description: 'OK',
              },
            },
          },
          post: {
            responses: {
              201: {
                description: 'Created',
              },
            },
          },
        },
        '/pets/{petId}': {
          options: {
            responses: {
              '204': {
                description: 'Supported methods',
              },
            },
          },
          head: {
            responses: {
              '200': {
                description: 'Resource exists',
              },
              '404': {
                description: 'Resource not found',
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
    name: 'ogiltigt testfall - ena resursen innehåller endast en metod',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            responses: {
              200: {
                description: 'OK',
              },
            },
          },
          post: {
            responses: {
              201: {
                description: 'Created',
              },
            },
          },
        },
        '/pets/{petId}': {
          get: {
            responses: {
              200: {
                description: 'OK',
              },
              404: {
                description: 'Not found',
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
]);
