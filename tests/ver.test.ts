import { DiagnosticSeverity } from "@stoplight/types";
import testRule from "./util/helperTest.ts";

testRule("Ver05", [
  {
    name: "giltigt testfall - prefix 'v'",
    document: {
      openapi: "3.1.0",
      info: { version: "1.0" },
      servers: [ { url: "https://api.example.com/v2/my-api" } ],
    },
    errors: [],
  },
  {
    name: "giltigt testfall - prefix 'ver'",
    document: {
      openapi: "3.1.0",
      info: { version: "1.0" },
      servers: [ { url: "https://api.example.com/ver2/my-api" } ],
    },
    errors: [],
  },
  {
    name: "giltigt testfall - prefix 'version'",
    document: {
      openapi: "3.1.0",
      info: { version: "1.0" },
      servers: [ { url: "https://api.example.com/version2/my-api" } ],
    },
    errors: [],
  },
  {
    name: "giltigt testfall - prefix 'v_'",
    document: {
      openapi: "3.1.0",
      info: { version: "1.0" },
      servers: [ { url: "https://api.example.com/v_2/my-api" } ],
    },
    errors: [],
  },
  {
    name: "giltigt testfall - prefix 'ver_'",
    document: {
      openapi: "3.1.0",
      info: { version: "1.0" },
      servers: [ { url: "https://api.example.com/ver_2/my-api" } ],
    },
    errors: [],
  },
  {
    name: "giltigt testfall - prefix 'version_'",
    document: {
      openapi: "3.1.0",
      info: { version: "1.0" },
      servers: [ { url: "https://api.example.com/version_2/my-api" } ],
    },
    errors: [],
  },
  {
    name: "giltigt testfall - tillåt version med major och minor",
    document: {
      openapi: "3.1.0",
      info: { version: "1.0" },
      servers: [ { url: "https://api.example.com/version_2.6/my-api" } ],
    },
    errors: [],
  },
  {
    name: "ogiltigt testfall - major version ska inte börja med '0'",
    document: {
      openapi: "3.1.0",
      info: { version: "1.0" },
      servers: [ { url: "https://api.example.com/v0/my-api" } ],
    },
    errors: [
      {
        message: "Alla API:er BÖR inkludera MAJOR versionen i den URL som används för ett specifikt API.",
        path: ["servers","0","url"],
        severity: DiagnosticSeverity.Warning,
      }
    ],
  },
  {
    name: "ogiltigt testfall - prefix 'any_'",
    document: {
      openapi: "3.1.0",
      info: { version: "1.0" },
      servers: [ { url: "https://api.example.com/any_2/my-api" } ],
    },
    errors: [
      {
        message: "Alla API:er BÖR inkludera MAJOR versionen i den URL som används för ett specifikt API.",
        severity: DiagnosticSeverity.Warning,
      }
    ],
  },
]);

testRule("Ver06", [
  {
      name: "giltigt testfall",
      document: {
        openapi: "3.1.0",
        info: { version: "1.0" },
        paths: { "/api-info": {} },
      },
      errors: [],
    },
    {
      name: "ogiltigt testfall",
      document: {
        openapi: "3.1.0",
        info: { version: "1.0" },
        paths: {},
      },
      errors: [
        {
          message: "Information om ett API SKALL tillgängliggöras via resursen api-info under roten '/' till API:et.",
          path: ["paths"],
          severity: DiagnosticSeverity.Error,
        }
      ]
    },
]);