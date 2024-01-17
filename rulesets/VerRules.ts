import { enumeration, truthy, falsy, undefined as undefinedFunc, pattern, schema } from "@stoplight/spectral-functions";
import { DiagnosticSeverity } from "@stoplight/types";
import { BaseRuleset, CustomProperties } from "./BaseRuleset.ts"


export class Ver06 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: "Versionhantering",
    id: "VER.06",
  };
  given = "$.paths";
  message = "Information om ett API SKALL tillgängliggöras via resursen api-info under roten '/' till API:et.";
  then = {
    field: '/api-info',
    function: truthy,
  }
  severity = DiagnosticSeverity.Error;
}

export class Ver05 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: "Versionhantering",
    id: "VER.05",
  };

  given = "$.servers.[url]";
  message = "Alla API:er BÖR inkludera MAJOR versionen i den URL som används för ett specifikt API.";
  then = {
    function: (targetVal: string, _opts: string, paths: string[]) => {

      const split = targetVal.split("/").filter(removeEmpty => removeEmpty);

      var valid:boolean = false;
      split.forEach(function (part) {

      // regexp explanation: Allow 'v', 'ver' and 'version' (with optional underscore '_' before version number)
      const containsVersion = /(v|ver|version)[_]?[1-9][0-9]*/g;
      if (containsVersion.test(part)) {
          valid = true;
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
  severity = DiagnosticSeverity.Warning;
}
export default { Ver05, Ver06 };
