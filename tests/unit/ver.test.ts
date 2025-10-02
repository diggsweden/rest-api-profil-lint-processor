// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { DiagnosticSeverity } from '@stoplight/types';
import testRule from '../util/helperTest.js';

testRule('Ver05', [
  {
    name: "giltigt testfall - prefix 'v'",
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'https://api.example.com/v2/my-api' }],
    },
    errors: [],
  },
  {
    name: "giltigt testfall - prefix 'v inkl major version'",
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'https://api.example.com/v1/my-api' }],
    },
    errors: [],
  },
  {
    name: "giltigt testfall - prefix 'v inkl major version with big number'",
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'https://api.example.com/v100/my-api' }],
    },
    errors: [],
  },
  {
    name: "ogiltigt testfall - major version måste börja med 'v'",
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'https://api.example.com/0/my-api' }],
    },
    errors: [
      {
        message:
          "Version BÖR anges i URL enligt formatet v[x] där 'v' avser förkortning för version och x avser ett och bara ett nummer (0-n) för major-version",
        path: ['servers', '0', 'url'],
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
  {
    name: "ogiltigt testfall - prefix 'v' och major version får inte efterföljas av minor version med char  '.'",
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'https://api.example.com/v1.0/my-api' }],
    },
    errors: [
      {
        message:
          "Version BÖR anges i URL enligt formatet v[x] där 'v' avser förkortning för version och x avser ett och bara ett nummer (0-n) för major-version",
        path: ['servers', '0', 'url'],
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
  {
    name: "ogiltigt testfall - prefix 'v' och major version får inte efterföljas av minor version med char  '-'",
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'https://api.example.com/v1-0/my-api' }],
    },
    errors: [
      {
        message:
          "Version BÖR anges i URL enligt formatet v[x] där 'v' avser förkortning för version och x avser ett och bara ett nummer (0-n) för major-version",
        path: ['servers', '0', 'url'],
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
  {
    name: "ogiltigt testfall - prefix 'v' och major version får inte efterföljas av minor version med char  '_'",
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'https://api.example.com/v1_0/my-api' }],
    },
    errors: [
      {
        message:
          "Version BÖR anges i URL enligt formatet v[x] där 'v' avser förkortning för version och x avser ett och bara ett nummer (0-n) för major-version",
        path: ['servers', '0', 'url'],
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
  {
    name: "ogiltigt testfall - prefix 'any_'",
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      servers: [{ url: 'https://api.example.com/any_2/my-api' }],
    },
    errors: [
      {
        message:
          "Version BÖR anges i URL enligt formatet v[x] där 'v' avser förkortning för version och x avser ett och bara ett nummer (0-n) för major-version",
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
]);

testRule('Ver06', [
  {
    name: 'giltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: { '/api-info': {} },
    },
    errors: [],
  },
  {
    name: 'ogiltigt testfall',
    document: {
      openapi: '3.1.0',
      info: { version: '1.0' },
      paths: {},
    },
    errors: [
      {
        message: 'Information om ett API SKALL tillgängliggöras via resursen api-info under roten till API:et.',
        path: ['paths'],
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
]);
