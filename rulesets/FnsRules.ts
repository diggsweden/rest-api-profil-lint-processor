import { enumeration, truthy, falsy, undefined as undefinedFunc, pattern, schema, casing } from "@stoplight/spectral-functions";
import { DiagnosticSeverity } from "@stoplight/types";
import { BaseRuleset, CustomProperties } from "./BaseRuleset.ts"


export class Fns01 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: "Filtrering, paginering och sökparametrar",
    id: "FNS.01",
  };
  description = "Parameternamn SKALL anges med en konsekvent namnkonvention inom ett API, exempelvis antingen snake_case eller camelCase.";
  message = "Parameternamn SKALL anges med en konsekvent namnkonvention exempelvis antingen snake_case eller camelCase";
  given = "$.paths.*.*.parameters[?(@.in=='query')].name";
  then = {
    function: pattern,
    functionOptions: {
      match: "^(?:[a-z0-9]+(?:_[a-z0-9]+)*|[a-z]+(?:[A-Z][a-z]*)*)$"
    }
  }
  severity = DiagnosticSeverity.Error;
}

export class Fns03 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: "Filtrering, paginering och sökparametrar",
    id: "FNS.03",
  };
  description = "Sökparametrar SKALL starta med en bokstav";
  message = "Sökparametrar SKALL starta med en bokstav.";
  given = "$.paths.*.*.parameters[?(@.in=='query')].name";
  then = {
    function: pattern,
    functionOptions: {
      match: "^[a-zA-Z].*$"
    }
  }
  severity = DiagnosticSeverity.Error;
}

export class Fns04 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: "Filtrering, paginering och sökparametrar",
    id: "FNS.04",
  };
  description = "Sökparametrar BÖR använda enbart gemener";
  message = "Sökparametrar BÖR använda enbart gemener";
  given = "$.paths.[*].parameters[?(@.in=='query')].name";
  then = {
    function: pattern,
    functionOptions: {
      match: "^[a-z_]+$"
    }
  }
  severity = DiagnosticSeverity.Warning;
}
export default { Fns01, Fns03 , Fns04};
