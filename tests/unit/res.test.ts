// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { DiagnosticSeverity } from '@stoplight/types';
import testRule from '../util/helperTest.js';

testRule('Res02', [
  {
    name: 'ogiltigt testfall - Personnummer BÖR INTE förekomma i en resurs (query param) ',
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
    errors: [
      {
        message: 'Primärnycklar eller personligt identifierbar information (personnummer, etc.) BÖR INTE exponeras.',
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
  {
    name: 'giltigt testfall - Personnummer BÖR INTE förekomma i en resurs (query param) ',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            parameters: [
              {
                name: 'title',
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
    name: 'ogiltigt testfall - Personnummer BÖR INTE förekomma i en resurs (path param) ',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            parameters: [
              {
                name: 'pnr',
                in: 'path',
              },
            ],
          },
        },
      },
    },
    errors: [
      {
        message: 'Primärnycklar eller personligt identifierbar information (personnummer, etc.) BÖR INTE exponeras.',
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
  {
    name: 'giltigt testfall - Personnummer BÖR INTE förekomma i en resurs (path param) ',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            parameters: [
              {
                name: 'title',
                in: 'path',
              },
            ],
          },
        },
      },
    },
    errors: [],
  },
]);

testRule('Res06', [
  {
    name: 'ogiltigt testfall - Resurser BÖR INTE innehålla versaler',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0.0' },
      paths: {
        '/PETS': {},
      },
    },
    errors: [
      {
        message:
          'Resurser SKALL följa den namnsättningskonvention som beskrivs för URL:er, det vill säga att resurser anges med gemener, använder endast alfanumeriska tecken och bindestreck för att separera eventuella ord.',
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
  {
    name: 'ogiltigt testfall - Bindestreck i resurser BÖR endast användas för att separera andra ord',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0.0' },
      paths: {
        '/-pets': {},
      },
    },
    errors: [
      {
        message:
          'Resurser SKALL följa den namnsättningskonvention som beskrivs för URL:er, det vill säga att resurser anges med gemener, använder endast alfanumeriska tecken och bindestreck för att separera eventuella ord.',
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
  {
    name: 'ogiltigt testfall - Resurser BÖR inte innehålla underline',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0.0' },
      paths: {
        '/my_pets': {},
      },
    },
    errors: [
      {
        message:
          'Resurser SKALL följa den namnsättningskonvention som beskrivs för URL:er, det vill säga att resurser anges med gemener, använder endast alfanumeriska tecken och bindestreck för att separera eventuella ord.',
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
  {
    name: 'giltigt testfall - Resurser BÖR endast innehålla gemener, siffror, och bindestreck för att separera ord',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0.0' },
      paths: {
        '/multiple-words-123': {
          get: {
            parameters: [
              {
                name: 'title',
                in: 'path',
              },
            ],
          },
        },
      },
    },
    errors: [],
  },
  {
    name: 'giltigt testfall - Path params undantas från RES.06 och får därför innehålla versaler',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0.0' },
      paths: {
        '/pets/{petId}': {
          get: {
            parameters: [
              {
                name: 'title',
                in: 'path',
              },
            ],
          },
        },
      },
    },
    errors: [],
  },
]);
