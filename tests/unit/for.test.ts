import { DiagnosticSeverity } from "@stoplight/types";
import testRule from "../util/helperTest.ts";


testRule("For02", [
  {
    name: "giltigt testfall - EN GET -förfrågan SKALL INTE acceptera en  body",
    document: {
      openapi: "3.1.0",
      info: { version: "1.0" },
      paths: {
        "/": {
          get: {},
        },
      },
    },
    errors: [],
  },
  {
    name: "ogiltigt testfall - EN GET -förfrågan SKALL INTE acceptera en body",
    document: {
      openapi: "3.1.0",
      info: { version: "1.0" },
      paths: {
        "/": {
          get: {
            requestBody: {
              description: "En GET operation är en fråga och skall inte innehålla något svar",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
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
        message: "EN GET -förfrågan SKALL INTE acceptera en body",
        path: ["paths", "/", "get", "requestBody"],
        severity: DiagnosticSeverity.Error,
      },
    ],
  }  
  ]);
  /*
testRule("For01", [
    {
      name: "giltigt testfall",
      document: {
        openapi: "3.1.0",
      },
      errors: [],
    },
    {
      name: "ogiltigt testfall",
      document: {
        swagger: "2.0",
      },
      errors: [
        {
          message: "Swagger 2-filer är inte tillåtna. Använd OpenAPI >= 3.0",
          path: ["swagger"],
          severity: DiagnosticSeverity.Error,
        },
      ],
    },
  ]);
  */