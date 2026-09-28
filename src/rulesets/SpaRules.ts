// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { DiagnosticSeverity } from '@stoplight/types';
import { CustomProperties } from '../ruleinterface/CustomProperties.js';
import { BaseRuleset } from './BaseRuleset.js';
import { RuleExecutionContext } from '../util/RuleExecutionContext.js';

const moduleName = 'SpaRules.js';

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'patch'];

const TRACEPARENT_HEADER = 'traceparent';

const ALTERNATIVE_TRACE_HEADERS = ['x-request-id'];

export class Spa02 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Spårbarhet och korrelation',
    id: 'SPA.02',
  };

  given = '$.paths[*]';

  then = [
    {
      function: (targetVal: any, _opts: string, context: { path: (string | number)[] }) => {
        const results: { message: string; path: (string | number)[] }[] = [];

        const pathParameters = Array.isArray(targetVal?.parameters) ? targetVal.parameters : [];

        for (const method of HTTP_METHODS) {
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

    this.message = this.translate('rules.spa02.message');
  }

  severity = DiagnosticSeverity.Error;
}

export class Spa04 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Spårbarhet och korrelation',
    id: 'SPA.04',
  };

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

    this.description = '-';
    this.message = this.translate('rules.spa04.message');
  }

  severity = DiagnosticSeverity.Warning;
}

export class Spa07 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Spårbarhet och korrelation',
    id: 'SPA.07',
  };

  given = '$.paths[*]';

  then = [
    {
      function: (targetVal: any, _opts: string, context: { path: (string | number)[] }) => {
        const results: { message: string; path: (string | number)[] }[] = [];

        const pathParameters = Array.isArray(targetVal?.parameters) ? targetVal.parameters : [];

        for (const method of HTTP_METHODS) {
          const operation = targetVal?.[method];

          if (!operation) {
            continue;
          }

          const operationParameters = Array.isArray(operation.parameters) ? operation.parameters : [];
          const headerNames = this.collectHeaderNames([...pathParameters, ...operationParameters]);

          const usesAlternativeIdentifier = ALTERNATIVE_TRACE_HEADERS.some((header) => headerNames.has(header));

          if (usesAlternativeIdentifier && !headerNames.has(TRACEPARENT_HEADER)) {
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
          Spa07.customProperties,
        );
      },
    },
  ];

  private collectHeaderNames(parameters: any[]): Set<string> {
    const headerNames = new Set<string>();

    for (const parameter of parameters) {
      if (parameter?.in === 'header' && typeof parameter.name === 'string') {
        headerNames.add(parameter.name.toLowerCase());
      }
    }

    return headerNames;
  }

  constructor(context: RuleExecutionContext) {
    super(context);
    super.initializeFormats(['OAS3']);

    this.message = this.translate('rules.spa07.message');
  }

  severity = DiagnosticSeverity.Error;
}

export default {
  Spa02,
  Spa04,
  Spa07,
};
