// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { DiagnosticSeverity } from '@stoplight/types';
import { CustomProperties } from '../ruleinterface/CustomProperties.ts';
import { BaseRuleset } from './BaseRuleset.ts';

const moduleName: string = 'ResRules.ts';

export class Res02 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Resurser',
    id: 'RES.02',
  };
  description =
    'Primärnycklar eller personligt identifierbar information (personnummer, etc.) BÖR INTE (RES.02) exponeras. Om detta är svårt att uppnå är det troligt att API:et behöver abstraheras ytterligare från den underliggande datakällan. ';
  message = 'Resurser bör inte innehålla personnummer ';
  given = '$.paths[*].*.parameters[*]';
  then = [
    {
      function: (targetVal: any, _opts: string, paths: string[]) => {
        const forbiddenKeys = [
          'pnr',
          'personalIdentityNumber',
          'personnummer',
          'personnr',
          'ssn',
          'socialSecurityNumber',
        ];
        if (targetVal.in == 'query' || targetVal.in == 'path') {
          if (forbiddenKeys.includes(targetVal.name)) {
            return [
              {
                message: this.message,
                severity: this.severity,
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
