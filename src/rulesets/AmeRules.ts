// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { undefined as undefinedFunc, pattern } from '@stoplight/spectral-functions';
import { DiagnosticSeverity } from '@stoplight/types';
import { parsePropertyNames } from './rulesetUtil.js';
import { CustomProperties } from '../ruleinterface/CustomProperties.js';
import { BaseRuleset } from './BaseRuleset.js';
import { isValidApplicationJson } from './util/AmeRulesUtil.js';

const moduleName: string = 'AmeRules.js';

enum CasingType {
  snake = 'snake',
  camel = 'camel',
}
interface State {
  casingCamelState: boolean;
  casingSnakeState: boolean;
  propertyName: string;
  schemaKey: string;
  casingTypeName: CasingType;
}

interface StateExecutionLog {
  [key: string]: State[];
}
export class Ame07 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'API Message',
    id: 'AME.07',
  };
  description = 'Fältnamn BÖR använda tecken som är alfanumeriska.';
  message = 'Fältnamn BÖR använda tecken som är alfanumeriska.';
  given = '$.components.schemas..properties[*]~';
  then = [
    {
      function: pattern,
      functionOptions: {
        match: '^[a-zA-Z0-9_]+$',
      },
    },
    {
      function: (targetVal: string, _opts: string, paths: string[]) => {
        this.trackRuleExecutionHandler(
          JSON.stringify(targetVal, null, 2),
          _opts,
          paths,
          this.severity,
          this.constructor.name,
          moduleName,
          Ame07.customProperties,
        );
      },
    },
  ];
  constructor() {
    super();
    super.initializeFormats(['OAS3']);
  }
  severity = DiagnosticSeverity.Warning;
}

export class Ame04 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'API Message',
    id: 'AME.04',
  };
  description = 'För fältnamn i request och response body BÖR camelCase eller snake_case notation användas.';
  message = 'För fältnamn i request och response body BÖR camelCase eller snake_case notation användas.';
  given = '$.components.schemas..properties[*]~';
  then = [
    {
      function: pattern,
      functionOptions: {
        match: '^(?:[a-z]+(?:_[a-z]+)*|[a-z]+(?:[A-Z][a-z]*)*)$',
      },
    },
    {
      function: (targetVal: string, _opts: string, paths: string[]) => {
        this.trackRuleExecutionHandler(
          JSON.stringify(targetVal, null, 2),
          _opts,
          paths,
          this.severity,
          this.constructor.name,
          moduleName,
          Ame04.customProperties,
        );
      },
    },
  ];
  constructor() {
    super();
    super.initializeFormats(['OAS3']);
  }
  severity = DiagnosticSeverity.Warning;
}
export class Ame01 extends BaseRuleset {
  static errorMessage = 'Datamodellen för en representation BÖR beskrivas med JSON enligt senaste versionen, RFC 8259.';
  static customProperties: CustomProperties = {
    område: 'API Message',
    id: 'AME.01',
  };
  description = 'Denna regel validerar att request och response är application/json.';
  message = Ame01.errorMessage;
  given = ['$.paths[*][*].responses[?(@property < 400)].content', '$.paths.*.*.requestBody.content'];
  then = [
    {
      function: (targetVal: any, _opts: string, paths: string[]) => {
        const valid: boolean = Object.keys(targetVal ?? {}).some((property) => isValidApplicationJson(property));

        if (!valid) {
          return [
            {
              message: this.message,
              severity: this.severity,
            },
          ];
        } else {
          return [];
        }
      },
    },
    {
      function: (targetVal: string, _opts: string, paths: string[]) => {
        this.trackRuleExecutionHandler(
          JSON.stringify(targetVal, null, 2),
          _opts,
          paths,
          this.severity,
          this.constructor.name,
          moduleName,
          Ame01.customProperties,
        );
      },
    },
  ];
  constructor() {
    super();
    super.initializeFormats(['OAS3']);
  }
  severity = DiagnosticSeverity.Warning;
}

export class Ame02 extends BaseRuleset {
  static errorMessage =
    "Det BÖR förutsättas att alla request headers som standard använder 'Accept' med värde 'application/json'";
  static customProperties: CustomProperties = {
    område: 'API Message',
    id: 'AME.02',
  };
  description = 'Denna regel validerar att response är application/json.';
  message = Ame02.errorMessage;
  given = ['$.paths.*.*.requestBody.content'];
  then = [
    {
      function: (targetVal: any, _opts: string, paths: string[]) => {
        const valid: boolean = Object.keys(targetVal ?? {}).some((property) => isValidApplicationJson(property));

        if (!valid) {
          return [
            {
              message: this.message,
              severity: this.severity,
            },
          ];
        } else {
          return [];
        }
      },
    },
    {
      function: (targetVal: string, _opts: string, paths: string[]) => {
        this.trackRuleExecutionHandler(
          JSON.stringify(targetVal, null, 2),
          _opts,
          paths,
          this.severity,
          this.constructor.name,
          moduleName,
          Ame02.customProperties,
        );
      },
    },
  ];
  constructor() {
    super();
    super.initializeFormats(['OAS3']);
  }
  severity = DiagnosticSeverity.Warning;
}
export class Ame05 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'API Message',
    id: 'AME.05',
  };
  description = 'Inom ett API SKALL namnsättningen vara konsekvent, dvs blanda inte camelCase och snake_case.';
  message = 'Inom ett API SKALL namnsättningen vara konsekvent, dvs blanda inte camelCase och snake_case. ';
  given = '$.components.schemas';
  then = [
    {
      function: (targetVal: string, _opts: string, paths) => {
        const result: any = [];
        const stateExecutionLogDictionary: StateExecutionLog = {};
        const data = JSON.parse(JSON.stringify(targetVal, null, 2)); // Need to use both stringfy and parse in order to parse to JSON correctly here...hm ?
        for (const key in data) {
          // Loop throough each Schema object found in given expression
          const propertyNames: string[] = parsePropertyNames(key, data); // Pick out properties of object
          propertyNames.forEach((name) => {
            /**
             * RegExp for scenarios
             */
            const snakeCasePattern: RegExp = /^[a-z]+(?:_[a-z]+)*$/;
            const camelCasePattern: RegExp = /^([a-z]+)(?:([A-Z]{1})([a-z]+))+$/;
            const lowercasePattern: RegExp = /^[a-z]+$/;

            const stateKey = `${'casingCamelState'}:${'casingSnakeState'}:${Math.floor(Math.random() * 1000)}`;
            if (!stateExecutionLogDictionary[stateKey]) {
              // Init dictionary
              stateExecutionLogDictionary[stateKey] = [];
            }
            if (!lowercasePattern.test(name)) {
              // When lowercasepattern we cant test camel/snake pattern for sure
              if (snakeCasePattern.test(name)) {
                //Match for snakeCase / store info about it
                stateExecutionLogDictionary[stateKey].push({
                  casingCamelState: false,
                  casingSnakeState: true,
                  propertyName: name,
                  schemaKey: key,
                  casingTypeName: CasingType.snake,
                });
              } else if (camelCasePattern.test(name)) {
                //Match for camelcase / store info about it
                stateExecutionLogDictionary[stateKey].push({
                  casingCamelState: true,
                  casingSnakeState: false,
                  propertyName: name,
                  schemaKey: key,
                  casingTypeName: CasingType.camel,
                });
              }
            }
          });
        }
        //Find possible vialoations
        const possibleViolations: string[] = this.findPropertyViolations(stateExecutionLogDictionary);
        // Notify the user if both snake case and camel case patterns are present or [] if ok
        for (const key of possibleViolations) {
          const properties = stateExecutionLogDictionary[key];
          // Push items with casingCamelState or casingSnakeState set to true to the result array
          properties.forEach((property) => {
            result.push({
              path: [...paths.path, property.schemaKey, 'properties', property.propertyName],
              message: this.message,
              severity: this.severity,
            });
          });
        }
        return result;
      },
    },
    {
      function: (targetVal: string, _opts: string, paths: string[]) => {
        this.trackRuleExecutionHandler(
          JSON.stringify(targetVal, null, 2),
          _opts,
          paths,
          this.severity,
          this.constructor.name,
          moduleName,
          Ame05.customProperties,
        );
      },
    },
  ];
  /**
   * Search a dictionary for possbile vialoations.
   * Rule is you cant mix casing types[snake/camel] within the same schemaObject
   * Dictionary contains the look of interface State, declared in module
   * @param log
   * @returns array of keys in the dictionary that violates the conditon
   */
  private findPropertyViolations(log: StateExecutionLog): string[] {
    const violations: string[] = [];
    const invalidEntries = new Set<string>();

    // Iterate over each entry in the dictionary
    const schemaKeys = Object.keys(log);
    for (let i = 0; i < schemaKeys.length - 1; i++) {
      const schemaKey1 = schemaKeys[i];
      const states1 = log[schemaKey1];

      for (let j = i + 1; j < schemaKeys.length; j++) {
        const schemaKey2 = schemaKeys[j];
        const states2 = log[schemaKey2];

        // Check if there are states with the same schemaKey value and mix of casing types
        for (const state1 of states1) {
          for (const state2 of states2) {
            if (
              state1.schemaKey === state2.schemaKey &&
              ((state1.casingCamelState && state2.casingSnakeState) ||
                (state1.casingSnakeState && state2.casingCamelState))
            ) {
              invalidEntries.add(schemaKey1);
              invalidEntries.add(schemaKey2);
              break;
            }
          }
        }
      }
    }
    return Array.from(invalidEntries);
  }
  constructor() {
    super();
    super.initializeFormats(['OAS3']);
  }
  severity = DiagnosticSeverity.Error;
}
export default { Ame01, Ame02, Ame05, Ame04, Ame07 };
