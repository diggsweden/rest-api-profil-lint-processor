import { DiagnosticSeverity } from "@stoplight/types";
import { CustomProperties } from '../ruleinterface/CustomProperties.ts';
import { parseProperties,Property} from "./rulesetUtil.ts";
import { DotRuleBase,DotStateExecutionLog} from "./util/DotRulesUtil.ts";
import { BaseRuleset} from "./BaseRuleset.ts"

const moduleName: string = "DotRules.ts";

export class Dot01 extends BaseRuleset {
  static customProperties: CustomProperties = {
    omrade: "Datum- och tidsformat",
    id: "DOT.01",
  };
  description = "Datum och tid SKALL (DOT.01) hanteras enligt följande, använd alltid RFC 3339 för datum och tid, acceptera alla tidszoner i API:er returnera datum och tid i UTC och använd inte tidsdelen om du inte behöver den.";
  message = "Datum och tid SKALL hanteras enligt följande, använd alltid RFC 3339 för datum och tid, acceptera alla tidszoner i API:er returnera datum och tid i UTC och använd inte tidsdelen om du inte behöver den.";
  given = "$..responses..content.application/json.schema.properties";
  then = [{
      function:  (targetVal: any, _opts: string, paths) => {
        const result:any = [];
        const regexp:RegExp = /^(\d{4})-(0[1-9]|1[0-2])-([0-2][0-9]|3[0-1])T([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])(\.\d{1,6})?(Z|([+-])([0-1][0-9]|2[0-3]):([0-5][0-9]))?Z$/
        for (const [key] of Object.entries(targetVal)){
          if(targetVal[key].hasOwnProperty("format") && targetVal[key].format == "date-time"){
            this.trackRuleExecutionHandler(JSON.stringify(targetVal,null,2), _opts, paths,
            this.severity,this.constructor.name, moduleName,Dot01.customProperties);
            if (!regexp.test(targetVal[key].example) ){
              
              paths.path.push(key);
              result.push(this);
            }

          }

        }
        return result;
      }
    }
  ];
  severity = DiagnosticSeverity.Error;
  constructor() {
    super();
    super.initializeFormats(['OAS3']);
  } 
}

export class Dot02 extends DotRuleBase {
  static customProperties: CustomProperties = {
    omrade: "Datum- och tidsformat",
    id: "DOT.02",
  };
  description = "Ett giltigt exempel enligt DOT.02 behöver anges som ett exempel";
  message = "Datum och tid SKALL anges enligt RFC 3339 som bygger på ISO-8601.";
  then = {
    function: (targetVal: any, _opts: string, paths) => {
      const dotStateExecutionLogDictionary: DotStateExecutionLog = {};
        const data = targetVal;
        const isTrackRuleExecution = {value: false}; // Declate init state and set ByRef

        for (const key in data) {
            const properties: Property[] = parseProperties(key, data);
            properties.forEach(prop => {
                const stateKey = `${key}:${prop.name}:${Math.floor(Math.random() * 1000)}`;
                if (!dotStateExecutionLogDictionary[stateKey]) {
                    dotStateExecutionLogDictionary[stateKey] = [];
                }
                this.executeRuleLogic(prop, stateKey, dotStateExecutionLogDictionary, isTrackRuleExecution,Dot02.customProperties);
            });
        }
        return this.handleResult(dotStateExecutionLogDictionary, paths, moduleName, isTrackRuleExecution,Dot02.customProperties);
    }
  };
  generateDateTimePattern(): string {
    return super.generateDateTimePattern();
  }
  generateDatePattern(): string {
    return super.generateDatePattern();
  }

  isValidWithOffset(example: string): boolean {
    return true; // Always valid offset in DOT.02
  }
}
export class Dot04 extends DotRuleBase {

  static customProperties: CustomProperties = {
    omrade: "Datum- och tidsformat",
    id: "DOT.04",
  };
  description = "När man använder RFC 3339 format BÖR tidszonen anges.";
  message = "Tidzonen BÖR representeras med UTC formatet, där tid anges som offset från UTC (Coordinated Universal Time).";
  severity: DiagnosticSeverity = DiagnosticSeverity.Warning;


  then = {
    function: (targetVal: any, _opts: string, paths) => {
      const dotStateExecutionLogDictionary: DotStateExecutionLog = {};
        const data = targetVal;
        const isTrackRuleExecution = {value:false};
        for (const key in data) {
            const properties: Property[] = parseProperties(key, data);
            properties.forEach(prop => {
                const stateKey = `${key}:${prop.name}:${Math.floor(Math.random() * 1000)}`;
                if (!dotStateExecutionLogDictionary[stateKey]) {
                    dotStateExecutionLogDictionary[stateKey] = [];
                }
                this.executeRuleLogic(prop, stateKey, dotStateExecutionLogDictionary, isTrackRuleExecution,Dot04.customProperties);
              });
        }
        return this.handleResult(dotStateExecutionLogDictionary, paths, moduleName, isTrackRuleExecution,Dot04.customProperties);
    }

  };
  generateDateTimePattern(): string {
    return super.generateDateTimePattern();
  }
  generateDatePattern(): string {
    return super.generateDatePattern();
  }
  isValidWithOffset(example: string): boolean {
    const offsetIndex = example.lastIndexOf('+') || example.lastIndexOf('-');
    if (offsetIndex !== -1) {
        const offsetPart = example.substring(offsetIndex);
        return true; // Offset found
    } else {
        return false; // No offset found
    }
  }
}
export default { Dot01 ,Dot02,Dot04};
