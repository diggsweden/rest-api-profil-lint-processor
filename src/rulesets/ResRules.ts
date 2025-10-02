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
    område: 'Resurser',
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
          Res02.customProperties
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

export default { Res02 };
