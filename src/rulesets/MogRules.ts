// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { DiagnosticSeverity } from '@stoplight/types';
import { CustomProperties } from '../ruleinterface/CustomProperties.js';
import { BaseRuleset } from './BaseRuleset.js';
import {
  countEndpoints,
  countDistinctHttpMethods,
  eachPathHasValidRestOperation,
  hasHateoasIndicators,
} from './util/MogRulesUtil.js';
import { RuleExecutionContext } from '../util/RuleExecutionContext.js';

const moduleName: string = 'MogRules.ts';

export class Mog01 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Mognad',
    id: 'MOG.01',
  };
  given = '$.paths';
  then = [
    {
      function: (targetVal: any, _opts: string, paths: string[]) => {
        if (
          countEndpoints(targetVal) < 2 ||
          countDistinctHttpMethods(targetVal) < 2 ||
          !eachPathHasValidRestOperation(targetVal)
        ) {
          return [
            {
              message: this.message,
              severity: this.severity,
              paths: paths,
            },
          ];
        }
        return [];
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
          Mog01.customProperties,
        );
      },
    },
  ];
  severity = DiagnosticSeverity.Error;
  constructor(context: RuleExecutionContext) {
    super(context);
    super.initializeFormats(['OAS3']);

    this.message = this.translate('rules.mog01.message');
  }
}

export class Mog02 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Mognad',
    id: 'MOG.02',
  };
  given = '$.paths';
  then = [
    {
      function: (targetVal: any, _opts: string, paths: string[]) => {
        if (
          countEndpoints(targetVal) < 2 ||
          countDistinctHttpMethods(targetVal) < 2 ||
          !eachPathHasValidRestOperation(targetVal) ||
          !hasHateoasIndicators(targetVal)
        ) {
          return [
            {
              message: this.message,
              severity: this.severity,
              paths: paths,
            },
          ];
        }
        return [];
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
          Mog02.customProperties,
        );
      },
    },
  ];
  severity = DiagnosticSeverity.Warning;
  constructor(context: RuleExecutionContext) {
    super(context);
    super.initializeFormats(['OAS3']);

    this.message = this.translate('rules.mog02.message');
  }
}

export default { Mog01, Mog02 };
