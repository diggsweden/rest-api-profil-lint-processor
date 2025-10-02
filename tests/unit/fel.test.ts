// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { DiagnosticSeverity } from '@stoplight/types';
import testRule from '../util/helperTest.js';
import { Fel01, Fel02 } from '../../src/rulesets/FelRules.js';

testRule('Fel01', [
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/': {
          get: {
            responses: {
              '501': {
                description: '',
                content: {
                  'application/problem+json': {
                    schema: {
                      type: 'object',
                      properties: {
                        type: {
                          type: 'string',
                        },
                        title: {
                          type: 'string',
                        },
                        status: {
                          type: 'integer',
                        },
                        detail: {
                          type: 'string',
                        },
                        instance: {
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
    name: 'giltigt testfall - XML',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/': {
          get: {
            responses: {
              '501': {
                description: '',
                content: {
                  'application/problem+xml': {
                    schema: {
                      type: 'object',
                      properties: {
                        type: {
                          type: 'string',
                        },
                        title: {
                          type: 'string',
                        },
                        status: {
                          type: 'integer',
                        },
                        detail: {
                          type: 'string',
                        },
                        instance: {
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
    name: 'ogiltigt testfall - XML',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/': {
          get: {
            responses: {
              '501': {
                description: '',
                content: {
                  'application/problem+xml': {
                    schema: {
                      type: 'object',
                      properties: {
                        type: {
                          type: 'string',
                        },
                        title: {
                          type: 'string',
                        },
                        detail: {
                          type: 'string',
                        },
                        instance: {
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
        message: Fel01.ruleMessage,
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
  {
    name: 'ogiltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/': {
          get: {
            responses: {
              '501': {
                description: '',
                content: {
                  'application/problem+json': {
                    schema: {
                      type: 'object',
                      properties: {
                        type: {
                          type: 'string',
                        },
                        title: {
                          type: 'string',
                        },
                        detail: {
                          type: 'string',
                        },
                        instance: {
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
        message: Fel01.ruleMessage,
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
]);

testRule('Fel02', [
  {
    name: 'giltigt testfall - Fel02 application/problem+json',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/': {
          get: {
            responses: {
              '400': {
                content: {
                  'application/problem+json': {},
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
    name: 'giltigt testfall - Fel02 application/problem+xml',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/': {
          get: {
            responses: {
              '500': {
                content: {
                  'application/problem+xml': {},
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
    name: 'giltigt testfall - Fel02',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/': {
          get: {
            responses: {
              '200': {
                content: {
                  'application/json': {},
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
    name: 'ogiltigt testfall - Fel02 400 saknar problem+json',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/': {
          get: {
            responses: {
              '400': {
                content: {
                  'application/json': {},
                },
              },
            },
          },
        },
      },
    },
    errors: [
      {
        code: 'Fel02',
        message: Fel02.errorMessage,
        path: ['paths', '/', 'get', 'responses', '400', 'content'],
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
  {
    name: 'ogiltigt testfall - Fel02 default',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/': {
          get: {
            responses: {
              default: {
                content: {
                  'application/json': {},
                },
              },
            },
          },
        },
      },
    },
    errors: [
      {
        code: 'Fel02',
        message: Fel02.errorMessage,
        path: ['paths', '/', 'get', 'responses', 'default', 'content'],
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
  {
    name: 'ogiltigt testfall - Fel02 no content',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/': {
          get: {
            responses: {
              default: {
                content: null,
              },
            },
          },
        },
      },
    },
    errors: [
      {
        code: 'Fel02',
        message: Fel02.errorMessage,
        path: ['paths', '/', 'get', 'responses', 'default', 'content'],
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
]);
