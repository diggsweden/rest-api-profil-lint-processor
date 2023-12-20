import { RulesetInterface } from "../ruleinterface/RuleInterface.ts"
import { enumeration, truthy, falsy, undefined as undefinedFunc, pattern, schema, defined } from "@stoplight/spectral-functions";
import { DiagnosticSeverity } from "@stoplight/types";


export class Arq05Base implements RulesetInterface {
  given = "$.paths.*.*.parameters[?(@.in=='header' && @.schema)]";
  message = "Payload data SKALL INTE användas i HTTP-headers.";
  severity = DiagnosticSeverity.Warning;

  protected checkSchema(targetVal: any, expectedType: string, expectedFormat?: string) {
    const schema = targetVal.schema;
    if (schema && typeof schema === 'object' && schema.type === expectedType) {
      if (!expectedFormat || schema.format === expectedFormat) {
        return true;
      }
    }
    return false;    
  }
}

export class Arq05NestedStructure extends Arq05Base {
  description = "Om en header använder nästlade strukturer, är en requestbody mer lämplig.";
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
  description = "Om en header förväntas innehålla data med ovanliga MIME-typer kan det indikera en okonventionell användning av headers";
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
  description = "Om en header förväntas innehålla komplexa datastrukturer, såsom JSON eller XML, kan det indikera en okonventionell användning av headers";
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

export class Arq04 implements RulesetInterface {
    description = "Ett av följande värden för Accept BÖR användas"
    message = "Ett av följande värden för Accept BÖR användas";
    given = "$..parameters.[*].accept"
    then = {
      function: pattern,
      functionOptions: {
        match: '^application/(?:json|xml)$'
      }
    }
    severity = DiagnosticSeverity.Warning;
  }

export default {Arq05ComplexStructure, Arq05StringBinary, Arq05NestedStructure, Arq04};
