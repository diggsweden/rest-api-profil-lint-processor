// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { DiagnosticSeverity } from '@stoplight/types';
import { CustomProperties } from '../ruleinterface/CustomProperties.js';
import { BaseRuleset } from './BaseRuleset.js';
import { RuleExecutionContext } from '../util/RuleExecutionContext.js';

const moduleName = 'SpaRules.js';

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'patch', 'options', 'head', 'trace'];

export class Spa02 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Spårbarhet och korrelation',
    id: 'SPA.02',
  };

  message = 'API-producenter SKALL acceptera HTTP-headern traceparent i inkommande anrop och propagera spårningsinformationen vidare enligt W3C Trace Context vid vidare anrop till andra system.';
  given = '$.paths[*]';

  then = [
    {
      function: (targetVal: any, _opts: string, context: { path: (string | number)[] }) => {
        const results: { message: string; path: (string | number)[] }[] = [];

        const pathParameters = Array.isArray(targetVal?.parameters) ? targetVal.parameters : [];

        const METHODS_TO_CHECK = HTTP_METHODS.filter((method) => !['options', 'head', 'trace'].includes(method));

        for (const method of METHODS_TO_CHECK) {
          const operation = targetVal?.[method];

          if (!operation) {
            continue;
          }

          const operationParameters = Array.isArray(operation.parameters) ? operation.parameters : [];

          const hasTraceparent = this.hasTraceparentParameter([...pathParameters, ...operationParameters]);

          if (!hasTraceparent) {
            results.push({
              message: this.message,
              path: [...context.path, method],
            });
          }
        }

        return results;
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
          Spa02.customProperties,
        );
      },
    },
  ];

  private hasTraceparentParameter(parameters: any[]): boolean {
    return parameters.some((parameter) => {
      return (
        parameter?.in === 'header' &&
        typeof parameter.name === 'string' &&
        parameter.name.toLowerCase() === 'traceparent' &&
        parameter.required !== true
      );
    });
  }

  constructor(context: RuleExecutionContext) {
    super(context);
    super.initializeFormats(['OAS3']);
  }

  severity = DiagnosticSeverity.Error;
}

export class Spa04 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Spårbarhet och korrelation',
    id: 'SPA.04',
  };

  description = '-';
  message = 'API-producenten BÖR inkludera HTTP-headern traceparent i ett API-svar.';
  given = '$.paths[*][get,put,post,delete,patch].responses[*]';

  then = [
    {
      function: (targetVal: any, _opts: string, paths: string[]) => {
        const header = targetVal?.headers?.traceparent;

        const hasTraceparent = header && (header.schema !== undefined || header.$ref !== undefined);

        if (hasTraceparent) {
          return [];
        }

        return [
          {
            message: this.message,
            severity: this.severity,
            paths,
          },
        ];
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
          Spa04.customProperties,
        );
      },
    },
  ];

  constructor(context: RuleExecutionContext) {
    super(context);
    super.initializeFormats(['OAS3']);
  }

  severity = DiagnosticSeverity.Warning;
}

export default {
  Spa02,
  Spa04,
};
