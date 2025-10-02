// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { DiagnosticSeverity } from '@stoplight/types';
import { CustomProperties } from '../ruleinterface/CustomProperties.js';
import { parseProperties, Property } from './rulesetUtil.js';
import { DotRuleBase, DotStateExecutionLog } from './util/DotRulesUtil.js';
import { BaseRuleset } from './BaseRuleset.js';

const moduleName: string = 'DotRules.js';

export class Dot02 extends DotRuleBase {
  static customProperties: CustomProperties = {
    område: 'Datum- och tidsformat',
    id: 'DOT.02',
  };
  description = 'Ett giltigt exempel enligt DOT.02 behöver anges som ett exempel';
  message = 'Datum och tid SKALL anges enligt RFC 3339 som bygger på ISO-8601.';
  then = {
    function: (targetVal: any, _opts: string, paths) => {
      const dotStateExecutionLogDictionary: DotStateExecutionLog = {};
      const data = targetVal;
      const isTrackRuleExecution = { value: false }; // Declate init state and set ByRef

      for (const key in data) {
        const properties: Property[] = parseProperties(key, data);
        properties.forEach((prop) => {
          const stateKey = `${key}:${prop.name}:${Math.floor(Math.random() * 1000)}`;
          if (!dotStateExecutionLogDictionary[stateKey]) {
            dotStateExecutionLogDictionary[stateKey] = [];
          }
          this.executeRuleLogic(
            prop,
            stateKey,
            dotStateExecutionLogDictionary,
            isTrackRuleExecution,
            Dot02.customProperties,
          );
        });
      }
      return this.handleResult(
        dotStateExecutionLogDictionary,
        paths,
        moduleName,
        isTrackRuleExecution,
        Dot02.customProperties,
      );
    },
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
    område: 'Datum- och tidsformat',
    id: 'DOT.04',
  };
  description = 'När man använder RFC 3339 format BÖR tidszonen anges.';
  message =
    'Tidzonen BÖR representeras med UTC formatet, där tid anges som offset från UTC (Coordinated Universal Time).';
  severity: DiagnosticSeverity = DiagnosticSeverity.Warning;

  then = {
    function: (targetVal: any, _opts: string, paths) => {
      const dotStateExecutionLogDictionary: DotStateExecutionLog = {};
      const data = targetVal;
      const isTrackRuleExecution = { value: false };
      for (const key in data) {
        const properties: Property[] = parseProperties(key, data);
        properties.forEach((prop) => {
          const stateKey = `${key}:${prop.name}:${Math.floor(Math.random() * 1000)}`;
          if (!dotStateExecutionLogDictionary[stateKey]) {
            dotStateExecutionLogDictionary[stateKey] = [];
          }
          this.executeRuleLogic(
            prop,
            stateKey,
            dotStateExecutionLogDictionary,
            isTrackRuleExecution,
            Dot04.customProperties,
          );
        });
      }
      return this.handleResult(
        dotStateExecutionLogDictionary,
        paths,
        moduleName,
        isTrackRuleExecution,
        Dot04.customProperties,
      );
    },
  };
  generateDateTimePattern(): string {
    return super.generateDateTimePattern();
  }
  generateDatePattern(): string {
    return super.generateDatePattern();
  }
  isValidWithOffset(example: string): boolean {
    const zuluTimeIndex = example.lastIndexOf('Z');
    const plusIndex = example.lastIndexOf('+');
    const minusIndex = example.lastIndexOf('-');
    const offsetIndex = plusIndex !== -1 ? plusIndex : minusIndex;

    if (zuluTimeIndex !== -1) {
      return true; // Zulu time found
    } else if (offsetIndex !== -1) {
      const offsetPart = example.substring(offsetIndex);
      const offsetRegex = /^([+-])(0[0-9]|1[0-4]):([0-5][0-9])$/;
      const match = offsetPart.match(offsetRegex);
      if (!match) {
        return false; // Offset format is incorrect
      }
      const sign = match[1];
      const hours = parseInt(match[2], 10);
      const minutes = parseInt(match[3], 10);

      // Check hour range
      if ((sign === '+' && hours > 14) || (sign === '-' && hours > 12)) {
        return false; // Invalid hour range
      }

      // Check minute range
      if (minutes < 0 || minutes > 59) {
        return false; // Invalid minute range
      }
      return true; // Offset found (+ or -)
    } else {
      return false; // No offset found
    }
  }
}
export default { Dot02, Dot04 };
