import { DiagnosticSeverity } from "@stoplight/types";
import testRule from "./util/helperTest.ts";

testRule("Ame01", [
  {
    name: "giltigt testfall - JSON format",
    document: {
      openapi: "3.1.0",
      info: { version: "1.0" },
      paths: {
        "/foo": {
          post: {
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        foo: {
                          type: 'string'
                        }
                      }
                    }
                  }
                }

              }
            }
          },
        },
      },
    },
    errors: [],
  },
  {
    name: "ogiltigt testfall - ej JSON format",
    document: {
      openapi: "3.1.0",
      info: { version: "1.0" },
      paths: {
        "/foo": {
          post: {
            responses: {
              '200': {
                content: {
                  'application/octet-stream': {
                    schema: {
                      type: 'object',
                      properties: {
                        foo: {
                          type: 'string'
                        }
                      }
                    }
                  }
                }
              }
            }
          },
        },
      },
    },
    errors: [
      {
        message:
          "Datamodellen för en representation BÖR beskrivas med JSON enligt senaste versionen, RFC 8259.",
        path: ["paths", "/foo", "post", "responses", "200", "content"],
        severity: DiagnosticSeverity.Warning,
      },
    ],
  },
]);
