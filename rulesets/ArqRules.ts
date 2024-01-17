import { match } from "assert";
import { RulesetInterface } from "../ruleinterface/RuleInterface.ts"
import { BaseRuleset,CustomProperties } from "./BaseRuleset.ts";
import { Arq05Base} from "./rulesetUtil.ts"
import { enumeration, truthy, falsy, undefined as undefinedFunc, pattern, schema, defined } from "@stoplight/spectral-functions";
import { DiagnosticSeverity } from "@stoplight/types";


export class Arq05NestedStructure extends Arq05Base {
  description ="Om en header använder nästlade strukturer, är en requestbody mer lämplig.";
  message ="[" + super.messageValue  + "] " + this.description;
  then = {
    function: (targetVal, _opts, paths) => {
      if (this.checkSchema(targetVal, 'object') && targetVal.schema.properties) {
        return [
          {
            message: this.message,
            severity: this.severity,
          },
        ];
      }
      return [];
    },
  }; 
}

export class Arq05StringBinary extends Arq05Base {
  description ="Om en header förväntas innehålla data med ovanliga MIME-typer kan det indikera en okonventionell användning av headers.";
  message ="[" + super.messageValue  + "] " + this.description;
  then = {
    function: (targetVal, _opts, paths) => {

      if (this.checkSchema(targetVal, 'string', 'binary')) {
        return [
          {
            message: this.message,
            severity: this.severity,
          },
        ];
      }

      return [];
    },
  };
}
export class Arq05ComplexStructure extends Arq05Base {
  description ="Om en header förväntas innehålla komplexa datastrukturer, såsom JSON eller XML, kan det indikera en okonventionell användning av headers.";
  message ="[" + super.messageValue  + "] " + this.description;
  then = {
    function: (targetVal, _opts, paths) => {
      if (this.checkSchema(targetVal, 'object')) {
        return [
          {
            message: this.message,
            severity: this.severity,
          },
        ];
      }
      return [];
    },
  };
}

export class Arq04 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: "API Request",
    id: "ARQ.04",
  };
  description = "Följande värden BÖR användas: [Date, Accept-Charset,ETag,Cache-Control,Cookie,Connection]"
  message = this.description;
  given = "$.paths.[*].parameters[?(@.in=='header')].name";
  then = {
    function: (targetVal: any) => {
      var valid: boolean = false;
      const split = targetVal.split(" ").filter(removeEmpty => removeEmpty); 
      
      for (const acceptableValue of ['Date','Accept-Charset','ETag','Cache-Control','Cookie','Connection']) {
        if (split.includes(acceptableValue)) {
          valid = true;
          break;
        }
      }
      
      if(!valid){
         return [
          {
            message: this.message,
            severity: this.severity,
          },
        ];
      } else {
        return []; 
  
    }
  }
}
  severity = DiagnosticSeverity.Warning;
}
export default {Arq05ComplexStructure, Arq05StringBinary, Arq05NestedStructure, Arq04};
