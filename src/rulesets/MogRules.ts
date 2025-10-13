// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { DiagnosticSeverity } from '@stoplight/types';
import { CustomProperties } from '../ruleinterface/CustomProperties.js';
import { BaseRuleset } from './BaseRuleset.js';

const moduleName: string = 'MogRules.ts';

export class Mog01 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Mognad',
    id: 'MOG.01',
  };
  message = 'Alla API:er SKALL designas för att uppnå nivå 2 enligt Richardson Maturity Model. ';
  given = '$.paths[*]';
  then = [
    {
      function: (targetVal: any, _opts: string, paths: string[]) => {
        let valid = false;
        const allowedVerbs = ['get', 'post', 'put', 'delete', 'patch'];
        const verbs = Object.keys(targetVal);
        valid = verbs.some((verb) => allowedVerbs.includes(verb.toLowerCase()));

        if (!valid) {
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
  constructor() {
    super();
    super.initializeFormats(['OAS3']);
  }
}

export class Mog02 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Mognad',
    id: 'MOG.02',
  };
  message = 'Alla API:er BÖR samtidigt designas för att uppnå nivå 3 enligt Richardson Maturity Model. ';
  given = '$.paths';
  then = [
    {
      function: (targetVal: any, _opts: string, paths: string[]) => {
        const countEndpoints = (apiPaths: Record<string, any>): number => {
          return Object.keys(apiPaths).length;
        };

        const endPointsAreValid = (apiPaths: Record<string, any>): boolean => {
          const validHttpMethods = ['get', 'post', 'put', 'delete', 'patch'];
          return Object.values(apiPaths).every((methodsObj) => {
            const methodKeys = Object.keys(methodsObj).map((method) => method.toLowerCase());
            const hasAtLeastTwoMethods = methodKeys.length >= 2;
            const hasValidHttpMethod = methodKeys.some((method) => validHttpMethods.includes(method));
            return hasAtLeastTwoMethods && hasValidHttpMethod;
          });
        };

        if (countEndpoints(targetVal) < 2 || !endPointsAreValid(targetVal)) {
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
  constructor() {
    super();
    super.initializeFormats(['OAS3']);
  }
}

export default { Mog01, Mog02 };
