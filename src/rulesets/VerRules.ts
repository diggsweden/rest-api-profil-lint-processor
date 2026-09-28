// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { enumeration, truthy, falsy, undefined as undefinedFunc, pattern, schema } from '@stoplight/spectral-functions';
import { DiagnosticSeverity } from '@stoplight/types';
import { BaseRuleset } from './BaseRuleset.js';
import { CustomProperties } from '../ruleinterface/CustomProperties.js';
const moduleName: string = 'VerRules.js';
import { RuleExecutionContext } from '../util/RuleExecutionContext.js';

export class Ver06 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Versionhantering',
    id: 'VER.06',
  };
  given = '$.paths';
  then = [
    {
      field: '/api-info',
      function: truthy,
    },
    {
      function: (targetVal: string, _opts: string, paths: string[]) => {
        // Implement custom log func here
        this.trackRuleExecutionHandler(
          targetVal,
          _opts,
          paths,
          this.severity,
          this.constructor.name,
          moduleName,
          Ver06.customProperties,
        );
      },
    },
  ];
  constructor(context: RuleExecutionContext) {
    super(context);
    super.initializeFormats(['OAS3']);

    this.message = this.translate('rules.ver06.message');
  }
  severity = DiagnosticSeverity.Error;
}
export class Ver05 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Versionhantering',
    id: 'VER.05',
  };

  given = '$.servers.[url]';
  then = [
    {
      function: (targetVal: string, _opts: string, paths: string[]) => {
        const split = targetVal.split('/').filter((removeEmpty) => removeEmpty);
        let valid: boolean = false;
        split.forEach(function (part) {
          const containsVersion = /(v[0-9][1-9]*(?![\.\-_])|\{version\})/;
            if (containsVersion.test(part)) {
              valid = true;
            }
        });

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
          Ver05.customProperties,
        );
      },
    },
  ];
  constructor(context: RuleExecutionContext) {
    super(context);
    super.initializeFormats(['OAS3']);

    this.message = this.translate('rules.ver05.message');
  }
  severity = DiagnosticSeverity.Warning;
}
export default { Ver05, Ver06 };
