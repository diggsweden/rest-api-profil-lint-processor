// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { RulesetInterface } from '../ruleinterface/RuleInterface.js';
import { CustomProperties } from '../ruleinterface/CustomProperties.js';
import { CustomFormatType } from './util/CustomOasVersion.js';
import { DiagnosticSeverity } from '@stoplight/types';
import { logRuleExecution } from '../util/RuleExecutionStatusModule.js';
import Format from '@stoplight/spectral-formats';

export class BaseRuleset implements RulesetInterface {
  static customProperties: CustomProperties = { område: undefined!, id: '' };
  static getCustomProperties(): CustomProperties {
    return BaseRuleset.customProperties;
  }
  given: string | string[] = '';
  message: string = '';
  then: any = {};
  description: string = '';
  severity: DiagnosticSeverity = DiagnosticSeverity.Error;

  formats: any = [];

  trackRuleExecutionHandler(
    targetVal: string,
    _opts: string,
    paths: string[],
    serverity: DiagnosticSeverity,
    subclassInfo: any,
    moduleName: any,
    subclassProperties: CustomProperties,
  ) {
    logRuleExecution(moduleName, subclassInfo, subclassProperties, this.severity.toString(), true, targetVal);
    return [];
  }
  async initializeFormats(formats: CustomFormatType[] = []) {
    this.formats = await this.loadFormats(formats);
  }
  async loadFormats(formats: CustomFormatType[]): Promise<any[]> {
    try {
      // If no formats specified, default to loading all available formats
      // Code run if there is support for ES module dynamic import
      return formats.length > 0
        ? formats.map((format) => this.mapCustomFormatToPkgFormat(format, Format)) // Map provided formats
        : [Format.oas2, Format.oas3]; // Default to oas2 and oas3
    } catch (e) {
      // Fallback for CommonJS (Node environments(framework) not using ES modules)
      const pkg = require('@stoplight/spectral-formats');
      return formats.length > 0
        ? formats.map((format) => this.mapCustomFormatToPkgFormat(format, pkg))
        : [pkg.oas2, pkg.oas3];
    }
  }
  // Helper function to map the CustomFormatType to the actual formats
  mapCustomFormatToPkgFormat(format: CustomFormatType, pkg: any): any {
    // Map the formats based on the provided CustomFormatType
    switch (format) {
      case 'OAS2':
        return pkg.oas2;
      case 'OAS3':
        return pkg.oas3;
      case 'OAS3_0':
        return pkg.oas3_0;
      case 'OAS3_1':
        return pkg.oas3_1;
      default:
        throw new Error(`Unknown format: ${format}`);
    }
  }
}
