import { DiagnosticSeverity } from "@stoplight/types";
import testRule from "./util/helperTest.ts";

testRule("Dok23", [
    {
      name: "giltigt testfall",
      document: {
        openapi: "3.1.0",
        info: { version: "1.0" },
        servers: [{ url: "https://example.com/my-api/v1" }],
       
      },
      errors: [],
    },
    {
        name: "ogiltigt testfall 1",
        document: {
          openapi: "3.1.0",
          info: { version: "1.0" },
          servers: [{ url: "http://api.example.com/" }],
          
        },
        errors: [
          {
            message: "API specifikationen SKALL återfinnas under API-roten.",
            path: ["servers", "0", "url"],
            severity: DiagnosticSeverity.Error,
          },
        ],
      },
]);

testRule("Dok24", [
  {
    name: "giltigt testfall",
    document: {
      openapi: "3.1.0",
      info: { version: "1.0" },
      servers: [{ url: "https://example.com/my-api/v1/openapi.yaml" }],
     
    },
    errors: [],
  },
  {
      name: "ogiltigt testfall",
      document: {
        openapi: "3.1.0",
        info: { version: "1.0" },
        servers: [{ url: "https://example.com/my-api/v1/openapi.csv" }],
        
      },
      errors: [
        {
          message: "Om API specifikationen specificeras med OpenAPI SKALL roten till specifikationen namnges med openapi.yaml eller openapi.json",
          path: ["servers", "0", "url"],
          severity: DiagnosticSeverity.Error,
        },
      ],
    },
]);