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