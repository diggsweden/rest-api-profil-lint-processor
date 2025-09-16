// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { BaseRuleset } from '../BaseRuleset.js';
import { Property } from '../rulesetUtil.js';
import { CustomProperties } from '../../ruleinterface/CustomProperties.js';

/**
 * interface describing propertyes collected and validated
 */
export interface DotState {
  schemaKey: string;
  propertyName: string;
  propertyType: string;
  propertyFormat: string;
  propertyExample: string;
  propertyValidFormatDate: boolean;
  propertyValidFormatDateTime: boolean;
}
/**
 * Make above interface available in dictionary
 */
export interface DotStateExecutionLog {
  [key: string]: DotState[];
}
/**
 * Class that abstracts common logic needed in category of Datetime[DOT rules]
 */
export class DotRuleBase extends BaseRuleset {
  constructor() {
    super();
    super.initializeFormats(['OAS3']);
    this.given = '$.components.schemas';
  }

  /**
   * Function for check valid offset(s) according to RFC3339 [ Overrided function ]
   * @param example
   * @returns
   */
  isValidWithOffset(example: string): boolean {
    return false;
  }
  /**
   * Correct date pattern according to RFC3339
   * @returns Read only copy of text of RegExp
   */
  generateDatePattern(): string {
    return /^([0-9]{4})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.source;
  }
  /**
   * Correct date-time pattern according to RFC3339
   * @returns
   */
  generateDateTimePattern(): string {
    return /^(\d{4})-(0[1-9]|1[0-2])-([0-2][0-9]|3[0-1])T([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])(\.\d{1,6})?(Z|([+-])([0-1][0-9]|2[0-3]):([0-5][0-9]))?$/
      .source;
  }
  /**
   * Execute the logic that is common
   * @param prop current propertyy
   * @param stateKey unique key to push in dictionary
   * @param dotStateExecutionLogDictionary Dictionary
   * @param isTrackRuleExecution ByRef
   * @param subclassProperties
   */
  protected executeRuleLogic(
    prop: Property,
    stateKey: string,
    dotStateExecutionLogDictionary: DotStateExecutionLog,
    isTrackRuleExecution: { value: boolean },
    subclassProperties: CustomProperties,
  ): void {
    if (prop.format === 'date' || prop.format === 'date-time') {
      let isValid = false;
      isTrackRuleExecution.value = true; // Should track

      if (prop.format === 'date' && prop.example !== undefined) {
        const pattern = new RegExp(this.generateDatePattern());
        isValid = prop.example && pattern.test(prop.example);
      } else if (prop.format === 'date-time' && prop.example !== undefined) {
        const pattern = new RegExp(this.generateDateTimePattern());
        isValid = this.isValidWithOffset(prop.example) && pattern.test(prop.example); // Check for Zulu or offset presence
      }
      if (!isValid) {
        //Push info on dictionary
        const isDate = prop.format === 'date';
        dotStateExecutionLogDictionary[stateKey].push({
          schemaKey: stateKey.split(':')[0],
          propertyName: prop.name,
          propertyType: prop.type,
          propertyFormat: prop.format,
          propertyExample: prop.example,
          propertyValidFormatDate: isDate ? false : true,
          propertyValidFormatDateTime: !isDate ? false : true,
        });
      }
    }
  }
  /**
   * Handle the result
   * @param dotStateExecutionLogDictionary //Dictionary containing info to handle
   * @param paths
   * @param moduleName
   * @param isTrackRuleExecution // ByRef
   * @param subclassProperties  //
   * @returns result containing the info sent back to user
   */
  protected handleResult(
    dotStateExecutionLogDictionary: DotStateExecutionLog,
    paths: any,
    moduleName: string,
    isTrackRuleExecution: { value: boolean },
    subclassProperties: CustomProperties,
  ): any[] {
    const result: any[] = [];
    for (const stateKey in dotStateExecutionLogDictionary) {
      const properties = dotStateExecutionLogDictionary[stateKey];
      const hasInvalidFormat = properties.some(
        (property) => !(property.propertyValidFormatDate && property.propertyValidFormatDateTime),
      );

      if (hasInvalidFormat) {
        properties.forEach((property) => {
          result.push({
            path: [...paths.path, property.schemaKey, 'properties', property.propertyName, 'example'], // Correct path in yaml
            message: this.message,
            severity: this.severity,
          });
        });
      }
    }
    if (isTrackRuleExecution.value === true) {
      super.trackRuleExecutionHandler(
        JSON.stringify(dotStateExecutionLogDictionary, null, 2),
        '',
        paths,
        this.severity,
        this.constructor.name,
        moduleName,
        subclassProperties,
      );
    }
    return result;
  }
}
export default { DotRuleBase };
