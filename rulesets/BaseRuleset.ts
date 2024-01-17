import { RulesetInterface} from "../ruleinterface/RuleInterface.ts"
import { DiagnosticSeverity } from "@stoplight/types";

export interface CustomProperties {
    område: string;
    id: string;
  }
export class BaseRuleset implements RulesetInterface {
  static customProperties: CustomProperties = { område: undefined!, id: '' };
  static getCustomProperties(): CustomProperties {
    return BaseRuleset.customProperties;
  }
  given: string = '';
  message: string = '';
  then: any = {};
  description: string = '';
  severity: DiagnosticSeverity = DiagnosticSeverity.Error;
}

