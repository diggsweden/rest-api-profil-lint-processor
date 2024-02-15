import { Rule } from "@stoplight/spectral-core";
import { BaseRuleset, CustomProperties } from "./BaseRuleset.ts"
import { enumeration, truthy, falsy, undefined as undefinedFunc, pattern, schema, length} from "@stoplight/spectral-functions";
import { DiagnosticSeverity } from "@stoplight/types";

export class Hyp09 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: "Hypermedia",
    id: "HYP.09",
  };
  given = "$.paths.[*].parameters[?(@.in=='header' && @.schema)]";
  message = "Headern SKALL namnges som forwarded, enligt beskrivningen i RFC 7239";
  then = {
    function: (targetVal: any)=>{
       if(targetVal.name === 'forwarded' && targetVal.schema.type==='string'){
        return []
       }else {
        return [
            {
              message: this.message,
              severity: this.severity,
            },
          ];
       }
    }
  }
  severity = DiagnosticSeverity.Error;
}