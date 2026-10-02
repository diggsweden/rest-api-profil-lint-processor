// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { DiagnosticSeverity } from '@stoplight/types';
import testRule from '../util/helperTest.js';
import { Fel01, Fel02 } from '../../src/rulesets/FelRules.js';
import { translator } from '../../src/i18n.js';

const t = translator('sv');
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
                      required: ['type', 'title', 'status', 'detail', 'instance'],
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
                      required: ['type', 'title', 'status', 'detail', 'instance'],
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
        message: t('rules.fel01.message', {
          properties: Fel01.mandatoryProperties.join(', '),
        }),
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
        message: t('rules.fel01.message', {
          properties: Fel01.mandatoryProperties.join(', '),
        }),
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
  {
    name: 'ogiltigt testfall - oneOf används',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/': {
          get: {
            responses: {
              '500': {
                content: {
                  'application/problem+json': {
                    schema: {
                      oneOf: [{ type: 'object' }, { type: 'object' }],
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
        message: t('rules.fel01.message', {
          properties: Fel01.mandatoryProperties.join(', '),
        }),
        severity: DiagnosticSeverity.Error,
      },
    ],
  },

  {
    name: 'giltigt testfall - $ref används',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      components: {
        schemas: {
          Problem: {
            type: 'object',
            required: ['type', 'title', 'status', 'detail', 'instance'],
            properties: {
              type: { type: 'string' },
              title: { type: 'string' },
              status: { type: 'string' },
              detail: { type: 'string' },
              instance: { type: 'string' },
            },
          },
        },
      },
      paths: {
        '/': {
          get: {
            responses: {
              '500': {
                content: {
                  'application/problem+json': {
                    schema: {
                      $ref: '#/components/schemas/Problem',
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
    name: 'giltigt testfall - allOf används',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {
        '/': {
          get: {
            responses: {
              '500': {
                content: {
                  'application/problem+json': {
                    schema: {
                      allOf: [
                        {
                          type: 'object',
                          required: ['type', 'title'],
                          properties: {
                            type: { type: 'string' },
                            title: { type: 'string' },
                          },
                        },
                        {
                          type: 'object',
                          required: ['status', 'detail', 'instance'],
                          properties: {
                            status: { type: 'integer' },
                            detail: { type: 'string' },
                            instance: { type: 'string' },
                          },
                        },
                      ],
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
    name: '$ref saknar required fields',
    document: {
      openapi: '3.1.0',
      components: {
        schemas: {
          Problem: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              title: { type: 'string' },
            },
          },
        },
      },
      paths: {
        '/': {
          get: {
            responses: {
              '500': {
                content: {
                  'application/problem+json': {
                    schema: {
                      $ref: '#/components/schemas/Problem',
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
        message: t('rules.fel01.message', {
          properties: Fel01.mandatoryProperties.join(', '),
        }),
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
        message: t('rules.fel02.message'),
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
        message: t('rules.fel02.message'),
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
        message: t('rules.fel02.message'),
        path: ['paths', '/', 'get', 'responses', 'default', 'content'],
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
]);
