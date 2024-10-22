import { DiagnosticSeverity } from "@stoplight/types";
import testRule from "../util/helperTest.ts";

testRule("Dot02", [
    {
      name: "giltigt testfall - date/datetime",
      document: {
        openapi: "3.1.0",
        info: { version: "1.0" },
        components: {
          schemas: {
            DateRequest: {
              type: "object",
              properties: {
                "postedDate": {
                  type: "string",
                  format: "date",
                  example: "2022-12-31"
                },
                "postedTime": {
                    type: "string",
                    format: "date-time",
                    example: "2022-11-31T04:00:09.12"
                  },
                },
            },
          },
        },
      },
      errors: [],
    },
    {
      name: "ogiltigt testfall - date/date-time",
      document: {
        openapi: "3.1.0",
        info: { version: "1.0" },
        components: {
          schemas: {
            DateRequest: {
              type: "object",
              properties: {
                "postedDate": {
                  type: "string",
                  format: "date",
                  example: "2022-121-31" // Invalid month
                },
                "postedTime": {
                    type: "string",
                    format: "date-time",
                    example: "2022-11-31T04:000:09.120" // Invalid minut and fraction of second
                  },
                },
            },
          },
        },
      },
      errors: [
        {
          message: "Datum och tid SKALL anges enligt RFC 3339 som bygger på ISO-8601.",
          path: ["components", "schemas", "DateRequest","properties","postedDate","example"],
          severity: DiagnosticSeverity.Error,
        },
        {
          message: "Datum och tid SKALL anges enligt RFC 3339 som bygger på ISO-8601.",
          path: ["components", "schemas", "DateRequest","properties","postedTime","example"],
          severity: DiagnosticSeverity.Error,
        },
      ],
    }]);
    testRule("Dot04", [
      {
        name: "giltigt testfall - date/datetime",
        document: {
          openapi: "3.1.0",
          info: { version: "1.0" },
          components: {
            schemas: {
              DateRequest: {
                type: "object",
                properties: {
                  "postedTime": {
                      type: "string",
                      format: "date-time",
                      example: "2024-04-23T04:00:09.12+01:00" // Valid offset
                    },
                  },
              },
            },
          },
        },
        errors: [],
      },
      {
        name: "ogiltigt testfall - date/date-time",
        document: {
          openapi: "3.1.0",
          info: { version: "1.0" },
          components: {
            schemas: {
              DateRequest: {
                type: "object",
                properties: {
                  "postedTime": {
                      type: "string",
                      format: "date-time",
                      example: "2024-04-23T04:00:09.12" // No offset specified
                    },
                  },
              },
            },
          },
        },
        errors: [
          {
            message: "Tidzonen BÖR representeras med UTC formatet, där tid anges som offset från UTC (Coordinated Universal Time).",
            path: ["components", "schemas", "DateRequest","properties","postedTime","example"],
            severity: DiagnosticSeverity.Warning,
          },
        ],
      }]);
      testRule("Dot01", [
        {
          name: "giltigt testfall - date/datetime",
          document: {
            openapi: "3.1.0",
            info: { version: "1.0" },
            paths:{
              "/test": {
                get:{
                  responses: {
                    "200":{
                      content:{
                        "application/json": {
                          schema: {
                            "$ref": "#/components/schemas/DateRequest"
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            components: {
              schemas: {
                DateRequest: {
                  type: "object",
                  properties: {
                    "postedTime": {
                        type: "string",
                        format: "date-time",
                        example: "2024-04-23T04:00:09.12Z" // No offset specified
                      },
                    },
                },
              },
            }

          },
          errors: [],
        },
        {
          name: "ogiltigt testfall - date/date-time",
          document: {
            openapi: "3.1.0",
            info: { version: "1.0" },
            paths:{
              "/test": {
                get:{
                  responses: {
                    "200":{
                      content:{
                        "application/json": {
                          schema: {
                            "$ref": "#/components/schemas/DateRequest"
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            components: {
              schemas: {
                DateRequest: {
                  type: "object",
                  properties: {
                    "postedTime": {
                        type: "string",
                        format: "date-time",
                        example: "2024-04-23T04:00:09.12+01:00" // No offset specified
                      },
                    },
                },
              },
            }

          },
          errors: [
            {
              message: "Datum och tid SKALL hanteras enligt följande, använd alltid RFC 3339 för datum och tid, acceptera alla tidszoner i API:er returnera datum och tid i UTC och använd inte tidsdelen om du inte behöver den.",
              path: ["paths","/test","get","responses","200","content","application/json","schema","properties","postedTime"],
              severity: DiagnosticSeverity.Error,
            },
          ],
        }
        ]);
  
