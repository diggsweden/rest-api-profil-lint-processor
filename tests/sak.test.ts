import { DiagnosticSeverity } from "@stoplight/types";
import testRule from "./util/helperTest.ts";

testRule("Sak09", [
    {
      name: "giltigt testfall",
      document: {
        openapi: "3.1.0",
        info: { version: "1.0" },
        components: {
          securitySchemes: {
            "något-annat": {
              type: "http",
              scheme: "bearer",
            },
          },
        },
      },
      errors: [],
    },
    {
      name: "ogiltigt testfall",
      document: {
        openapi: "3.1.0",
        info: { version: "1.0" },
        components: {
          securitySchemes: {
            "basicAuth": {
              type: "http",
              scheme: "basic",
            },
          },
        },
      },
      errors: [
        {
          message: "Basic- eller Digest-autentisering SKALL INTE användas.",
          path: ["components", "securitySchemes", "basicAuth", "scheme"],
          severity: DiagnosticSeverity.Error,
        },
      ],
    },
  ]);
  testRule("Sak10", [
    {
      name: "giltigt testfall",
      document: {
        openapi: "3.1.0",
        info: { version: "1.0" },
        components: {
          securitySchemes: {
            "bearerAuth": {
              type: "http",
              scheme: "bearer",
            },
          },
        },
      },
      errors: [],
    },
    {
      name: "ogiltigt testfall",
      document: {
        openapi: "3.1.0",
        info: { version: "1.0" },
        components: {
          securitySchemes: {
            "basicAuth": {
              type: "http",
              scheme: "basic",
            },
          },
        },
      },
      errors: [
        {
          message: "Authorization: Bearer header SKALL användas för autentisering/auktorisation.",
          path: ["components", "securitySchemes", "basicAuth", "scheme"],
          severity: DiagnosticSeverity.Error,
        },
      ],
    },
  ]);
  testRule("Sak18", [
    {
      name: "giltigt testfall",
      document: {
        openapi: "3.1.0",
        info: { version: "1.0" },
        components: {
          securitySchemes: {
            "oAuth2Password": {
              type: "oauth2",
            },
          },
        },
      },
      errors: [],
    },
    {
      name: "ogiltigt testfall - http är ej tillåtet",
      document: {
        openapi: "3.1.0",
        info: { version: "1.0" },
        components: {
          securitySchemes: {
            "oAuth2Password": {
              type: "http"
            },
          },
        },
      },
      errors: [
        {
          message: "OAuth version 2.0 eller senare BÖR användas för auktorisation.",
          severity: DiagnosticSeverity.Warning,
        },
      ],
    },
  ]);


