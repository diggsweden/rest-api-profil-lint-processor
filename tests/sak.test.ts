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
            "oAuth2": {
              type: "oauth2",
              flows: {
                clientCredentials: {
                  tokenUrl: "https://example.com/token",
                  refreshUrl: "https://example.com/refresh",
                },
              }
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
            "oAuth2": {
              type: "oauth2",
              flows: {
                clientCredentials: {
                  tokenUrl: "http://example.com/token",
                },
              },
            }
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
  
  testRule("Sak02", [
    {
      name: "giltigt testfall",
      document: {
        openapi: "3.1.0",
        info: { version: "1.0" },
        components: {
          securitySchemes: {
            "HMAC": {
              type: "apiKey",
              "x-metadata": {
                keyLength: "d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d1e17104e98a72d32d9d3b97a5c73e8c2630621381843e61e2635828440f4625d621381843e61e26358"
             } ,
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
            "HMAC": {
              type: "apiKey",
              "x-metadata": {
                keyLength: "0621381843e61e2635828440f4625d1e17104e98a72d32"
             },
            },
          },
        },
      },
      errors: [
        {
          message: "Alla certifikat SKALL vara från SHA-2 (Secure Hash Algorithm 2) kryptografiska hashfunktioner med minsta nyckellängd på 2048",
          path: ["components", "securitySchemes", "HMAC", "x-metadata", "keyLength"],
          severity: DiagnosticSeverity.Warning,
        },
      ],
    },
  ]);