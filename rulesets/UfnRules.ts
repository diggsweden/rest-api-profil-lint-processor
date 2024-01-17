import { Rule } from "@stoplight/spectral-core";
import { BaseRuleset, CustomProperties } from "./BaseRuleset.ts"
import { enumeration, truthy, falsy, undefined as undefinedFunc, pattern, schema, length} from "@stoplight/spectral-functions";
import { DiagnosticSeverity } from "@stoplight/types";

export class Ufn02 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: "URL Format och namngivning",
    id: "UFN.02",
  };
  given = "$.servers[?(@.url.startsWith('http'))]";
  message = "Alla API:er SKALL exponeras via HTTPS på port 443.";
  then = {
    field: 'url',
    function: pattern,
    functionOptions: {
      match: "/^https:/"
    },
  }
  severity = DiagnosticSeverity.Error;
}

export class Ufn05 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: "URL Format och namngivning",
    id: "UFN.05",
  };
  description = "En URL BÖR INTE vara längre än 2048 tecken.";
  given = "$.paths[*]~";
  message = "En URL BÖR INTE vara längre än 2048 tecken.";
  then = {
    field: "url",
    function: length,
    functionOptions: {
      max: 2048
    }
  }
  severity = DiagnosticSeverity.Warning;
}

export class Ufn06 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: "URL Format och namngivning",
    id: "UFN.06",
  };
  given = "$.paths[*]~";
  message = "Bokstäver i URL:n SKALL bestå av enbart gemener.";
  then = {
    function: pattern,
    functionOptions: {
      notMatch: "[A-Z]"
    }
  }
  severity = DiagnosticSeverity.Error;
}

export class Ufn08 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: "URL Format och namngivning",
    id: "UFN.08",
  };

  given = "$.paths[*]~";
  message = "Endast bindestreck '-' SKALL användas för att separera ord för att öka läsbarheten samt förenkla för sökmotorer att indexera varje ord för sig.";
  then = {
    function: (targetVal: string, _opts: string, paths: string[]) => {

      const split = targetVal.split("/").filter(removeEmpty => removeEmpty);

      const pathElements = split.filter(e => !e.startsWith("{"));

      var valid:boolean = true;
      pathElements.forEach(part => {

        //  regexp tillåter inte "-", ".", "_" samt "~"
        const separators = /([,._~]+)/g;
        if (separators.test(part)) {
          valid = false;
        }
        if (part.startsWith('-') || part.endsWith('-')) {
          valid = false;
        }
        if (part.indexOf('--') >= 0) {
          valid = false;
        }
      });

      if (!valid) {
        return [
          {
            message: this.message,
            severity: this.severity
          },
        ];
      } else {
        return [];
      }
    }
  }
  severity = DiagnosticSeverity.Error;
}
export class Ufn07 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: "URL Format och namngivning",
    id: "UFN.07",
  };
  given = "$.paths[*]~";
  message = "URL:n SKALL använda tecken som är URL-säkra (tecknen A-Z, a-z, 0-9, \"-\", \".\", \"_\" samt \"~\", se vidare i RFC 3986).";
  then = {
    function: pattern,
    functionOptions: {
      match: "^[a-zA-Z0-9/\\\-\\\,\\\.\\\_\\\~{}]*$",
    }
  }
  severity = DiagnosticSeverity.Error;
}

export class Ufn09 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: "URL Format och namngivning",
    id: "UFN.09",
  };
  description = "Blanksteg ' ' och understreck '_' SKALL INTE användas i URL:er med undantag av parameter-delen.";
  given = "$.paths[*]~";
  message = "Blanksteg ' ' och understreck '_' SKALL INTE användas i URL:er med undantag av parameter-delen.";
  then = {
    function: pattern,
    functionOptions: {
      match: "^(/|[a-z0-9-.]+|{[a-zA-Z0-9_]+})+$"
    }
  }
  severity = DiagnosticSeverity.Error;
}

export class Ufn10 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: "URL Format och namngivning",
    id: "UFN.10",
  };
  description = "Understreck '_' SKALL endast användas för att separera ord i parameternamn.";
  given = "$.paths.*.*.parameters[?(@.in=='query')].name";
  message = "Understreck '_' SKALL endast användas för att separera ord i parameternamn.";
  then = {
    function: pattern,
    functionOptions: {
        notMatch: "/[-.~]/",
    }
  }
  severity = DiagnosticSeverity.Error;
}

export class Ufn11 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: "URL Format och namngivning",
    id: "UFN.11",
  };
  description = "Understreck '_' SKALL INTE vara del av bas URL:en.";
  given = "$.servers..url";
  message = "Understreck '_' SKALL INTE vara del av bas URL:en.";
  then = {
    field: "url",
    function: pattern,
    functionOptions: {
      notMatch: "/[_]/",
    }
  }
  severity = DiagnosticSeverity.Error;
}
export default { Ufn02, Ufn05, Ufn06, Ufn08, Ufn09, Ufn10, Ufn11 };