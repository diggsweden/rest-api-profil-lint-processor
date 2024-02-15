import { DiagnosticSeverity } from "@stoplight/types";
import testRule from "./util/helperTest.ts";

testRule("Hyp09", [
    {
      name: "giltigt testfall",
      document: {
        openapi: "3.1.0",
        info: { version: "1.0" },
        paths: {
          "/headertest": {
            post: {
              parameters: [
                {
                  name: "forwarded",
                  in: "header",
                  description: "header name forwarded use",
                  required: false,
                  schema: {
                    type: "string"
                  }
                },
              ],
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
        paths: {
          "/headertest": {
            get: {
              parameters: [
                {
                  name: "noforwarded",
                  in: "header",
                  description: "when forwarded header not used",
                  required: false,
                  schema: {
                    type: "object",
                  }
                },
              ],
            },
          },
        },
      },
      errors: [
        {
          message:
            "Headern SKALL namnges som forwarded, enligt beskrivningen i RFC 7239",
          path: ["paths", "/headertest", "get", "parameters", "0"],
          severity: DiagnosticSeverity.Error,
        },
      ],
    },
  ]);
