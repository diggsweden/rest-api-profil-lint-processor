// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
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
