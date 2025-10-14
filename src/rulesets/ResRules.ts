// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { DiagnosticSeverity } from '@stoplight/types';
import { CustomProperties } from '../ruleinterface/CustomProperties.js';
import { BaseRuleset } from './BaseRuleset.js';
import { personalIdentityNumberFieldNames } from './constants/ResConstants.js';

const moduleName: string = 'ResRules.js';

export class Res02 extends BaseRuleset {
  static customProperties: CustomProperties = {
    omrade: 'Resurser',
    id: 'RES.02',
  };
  message = 'Primärnycklar eller personligt identifierbar information (personnummer, etc.) BÖR INTE exponeras. ';
  given = '$.paths[*].*.parameters[*]';
  then = [
    {
      function: (targetVal: any, _opts: string, paths: string[]) => {
        if (targetVal.in == 'query' || targetVal.in == 'path') {
          const lowerCaseTargetVal = targetVal.name.toLowerCase();
          const containsPersonalIdentityNumber = personalIdentityNumberFieldNames.includes(lowerCaseTargetVal);
          if (containsPersonalIdentityNumber) {
            return [
              {
                message: this.message,
                severity: this.severity,
                paths: paths,
              },
            ];
          }
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
          Res02.customProperties,
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

export class Res06 extends BaseRuleset {
  static customProperties: CustomProperties = {
    omrade: 'Resurser',
    id: 'RES.06',
  };
  message =
    'Resurser SKALL följa den namnsättningskonvention som beskrivs för URL:er, det vill säga att resurser anges med gemener, använder endast alfanumeriska tecken och bindestreck för att separera eventuella ord. ';
  given = '$.paths[*]~';
  then = [
    {
      function: (targetVal: any, _opts: string, paths: string[]) => {
        const expression = new RegExp('^(?!-)[a-z0-9-]+(?<!-)$');
        const invalidPrefixes = ['get-', 'post-', 'put-', 'delete-', 'patch-'];

        let invalid = false;

        targetVal.split('/').forEach((part: string) => {
          if (part.length > 0 && !part.includes('{') && !part.includes('}')) {
            const hasInvalidPrefix = invalidPrefixes.some((prefix) => part.startsWith(prefix));
            if (!expression.test(part) || hasInvalidPrefix) {
              invalid = true;
            }
          }
        });

        if (invalid) {
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
          Res06.customProperties
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

export default { Res02, Res06 };
