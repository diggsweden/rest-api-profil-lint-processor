import { DiagnosticSeverity } from "@stoplight/types";
import testRule from "./util/helperTest.ts";

testRule("Ufn09", [
    {
        name: "giltigt testfall",
        document: {
          openapi: "3.1.0",
          info: { version: "1.0" },
          paths: { "/this-is-kebab-case": {} },
        },
        errors: [],
      },
      {
        name: "ogiltigt testfall",
        document: {
          openapi: "3.1.0",
          info: { version: "1.0" },
          paths: { "/Detta_e_snake_case": {} },
        },
        errors: [
          {
            message:
              "Blanksteg ' ' och understreck '_' SKALL INTE användas i URL:er med undantag av parameter-delen.",
            path: ["paths", "/Detta_e_snake_case"],
            severity: DiagnosticSeverity.Error,
          }
        ],
      },
]);
testRule("Ufn07", [
  {
      name: "giltigt testfall",
      document: {
        openapi: "3.1.0",
        info: { version: "1.0" },
        paths: { "/abcdefghijklmnopqrstuvxyzABCDEFGHIJKLMNOPQRSTUVXYZ-._~": {} },
      },
      errors: [],
    },
    {
      name: "ogiltigt testfall med asterisk",
      document: {
        openapi: "3.1.0",
        info: { version: "1.0" },
        paths: { "/a-*-is-not-allowed": {} },
      },
      errors: [
        {
          message:
            "URL:n SKALL använda tecken som är URL-säkra (tecknen A-Z, a-z, 0-9, \"-\", \".\", \"_\" samt \"~\", se vidare i RFC 3986).",
          path: ["paths", "/a-*-is-not-allowed"],
          severity: DiagnosticSeverity.Error,
        }
      ],
    },
]);
testRule("Ufn08", [
  {
    name: "giltigt testfall - bara gemener och bindestreck ('-')",
    document: {
      openapi: "3.1.0",
      info: { version: "1.0" },
      paths: { "/correct-use-of-dash/in-path": {} },
    },
    errors: [],
  },
  {
    name: "giltigt testfall - ignorera path parametrar",
    document: {
      openapi: "3.1.0",
      info: { version: "1.0" },
      paths: { "/correct-use-of-dash/in-path/{path_param_1}/{path_param_2}": {} },
    },
    errors: [],
  },
  {
    name: "giltigt testfall - ignorera versaler, finns annan regel för det",
    document: {
      openapi: "3.1.0",
      info: { version: "1.0" },
      paths: { "p-ath-with-UPPERCASE": {} },
    },
    errors: [],
  },
  {
    name: "ogiltigt testfall - underscore i path",
    document: {
      openapi: "3.1.0",
      info: { version: "1.0" },
      paths: { "/invalid_path": {} },
    },
    errors: [
      {
        message: "Endast bindestreck '-' SKALL användas för att separera ord för att öka läsbarheten samt förenkla för sökmotorer att indexera varje ord för sig.",
        severity: DiagnosticSeverity.Error,
      }
    ],
  },
  {
    name: "ogiltigt testfall - tilde i path",
    document: {
      openapi: "3.1.0",
      info: { version: "1.0" },
      paths: { "/invalid~path": {} },
    },
    errors: [
      {
        message: "Endast bindestreck '-' SKALL användas för att separera ord för att öka läsbarheten samt förenkla för sökmotorer att indexera varje ord för sig.",
        severity: DiagnosticSeverity.Error,
      }
    ],
  },
  {
    name: "ogiltigt testfall - två eller flera bindestreck i rad",
    document: {
      openapi: "3.1.0",
      info: { version: "1.0" },
      paths: { "/invalid--path": {} },
    },
    errors: [
      {
        message: "Endast bindestreck '-' SKALL användas för att separera ord för att öka läsbarheten samt förenkla för sökmotorer att indexera varje ord för sig.",
        severity: DiagnosticSeverity.Error,
      }
    ],
  },
  {
    name: "ogiltigt testfall - börjar med bindestreck",
    document: {
      openapi: "3.1.0",
      info: { version: "1.0" },
      paths: { "/-invalid-path": {} },
    },
    errors: [
      {
        message: "Endast bindestreck '-' SKALL användas för att separera ord för att öka läsbarheten samt förenkla för sökmotorer att indexera varje ord för sig.",
        severity: DiagnosticSeverity.Error,
      }
    ],
  },
  {
    name: "ogiltigt testfall - slutar med bindestreck",
    document: {
      openapi: "3.1.0",
      info: { version: "1.0" },
      paths: { "/invalid-path-": {} },
    },
    errors: [
      {
        message: "Endast bindestreck '-' SKALL användas för att separera ord för att öka läsbarheten samt förenkla för sökmotorer att indexera varje ord för sig.",
        severity: DiagnosticSeverity.Error,
      }
    ],
  },
]);
testRule("Ufn06", [
  {
      name: "giltigt testfall",
      document: {
        openapi: "3.1.0",
        info: { version: "1.0" },
        paths: { "/this-is-not/{an_upper_case_url}": {} },
      },
      errors: [],
    },
    {
      name: "ogiltigt testfall - upper case",
      document: {
        openapi: "3.1.0",
        info: { version: "1.0" },
        paths: { "/This-IsAn_UpperCaseUrl": {} },
      },
      errors: [
        {
          message:
            "Bokstäver i URL:n SKALL bestå av enbart gemener.",
          path: ["paths", "/This-IsAn_UpperCaseUrl"],
          severity: DiagnosticSeverity.Error,
        }
      ],
    },
    {
      name: "ogiltigt testfall - upper case path param",
      document: {
        openapi: "3.1.0",
        info: { version: "1.0" },
        paths: { "/lower/{PathParam}": {} },
      },
      errors: [
        {
          message:
            "Bokstäver i URL:n SKALL bestå av enbart gemener.",
          path: ["paths", "/lower/{PathParam}"],
          severity: DiagnosticSeverity.Error,
        }
      ],
    },
]);
testRule("Ufn02", [
  {
      name: "giltigt testfall",
      document: {
        openapi: "3.1.0",
        info: { version: "1.0" },
        paths: { "https://www.example.com": {} },
      },
      errors: [],
    },
    {
      name: "ogiltigt testfall 1",
      document: {
        openapi: "3.1.0",
        info: { version: "1.0" },
        paths: { "/": {} },
        servers: [{ url: "http://api.example.com/" }],
      },
      errors: [
        {
          message: "Alla API:er SKALL exponeras via HTTPS på port 443.",
          path: ["servers", "0", "url"],
          severity: DiagnosticSeverity.Error,
        },
      ],
    },
]);
testRule("Ufn05", [
    {
      name: "giltigt testfall",
      document: {
        openapi: "3.1.0",
        info: { version: "1.0" },
        paths: { "/pets/{id}": {} },
      },
      errors: [],
    },
    {
      name: "ogiltigt testfall",
      document: {
        openapi: "3.1.0",
        info: { version: "1.0" },
        paths: { "/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}": {} },
      },
      errors: [
        {
          message:"En URL BÖR INTE vara längre än 2048 tecken.",
          path: ["paths","/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}/petshamta/{id}"],
          severity: DiagnosticSeverity.Warning,
        }
      ],
    },
]);

testRule("Ufn10", [
  {
    name: "giltigt testfall",
    document: {
      openapi: "3.1.0",
      info: { version: "1.0" },
      paths: {
        "/foo": {
          get: {
            description: "get",
            parameters: [
              {
                name: "tags",
                in: "query",
                required: false,
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
        "/pets": {
          get: {
            description: "get",
            parameters: [
              {
                name: "t.a-g~s",
                in: "query",
                required: false,
              },
            ],
          },
        },
      },
    },
    errors: [
      {
        message:
          "Understreck '_' SKALL endast användas för att separera ord i parameternamn.",
        path: ["paths", "/pets", "get", "parameters", "0","name"],
        severity: DiagnosticSeverity.Error,
      },
    ],
  },
]);
testRule("Ufn11", [
  {
      name: "giltigt testfall",
      document: {
        openapi: "3.1.0",
        info: { version: "1.0" },
        paths: { "/": {} },
        servers: [{ url: "http://petstore.swwagger.com/api/v2" }],        
      },
      errors: [],
    },
    {
      name: "ogiltigt testfall",
      document: {
        openapi: "3.1.0",
        info: { version: "1.0" },
        paths: { "/": {} },
        servers: [{ url: "http://petstore.swwagger.com/a_pi/v_2" }],        
      },
      errors: [
        {
          message:
            "Understreck '_' SKALL INTE vara del av bas URL:en.",
          path: ["servers", "0","url"],
          severity: DiagnosticSeverity.Error,
        }
      ],
    },
]);
