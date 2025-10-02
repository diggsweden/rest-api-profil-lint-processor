// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { enumeration, truthy, falsy, undefined as undefinedFunc, pattern, schema } from '@stoplight/spectral-functions';
import { DiagnosticSeverity } from '@stoplight/types';
import { BaseRuleset } from './BaseRuleset.js';
import { CustomProperties } from '../ruleinterface/CustomProperties.js';
const moduleName: string = 'VerRules.js';

export class Ver06 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Versionhantering',
    id: 'VER.06',
  };
  given = '$.paths';
  message = 'Information om ett API SKALL tillgängliggöras via resursen api-info under roten till API:et.';
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
  constructor() {
    super();
    super.initializeFormats(['OAS2', 'OAS3']);
  }
  severity = DiagnosticSeverity.Error;
}
export class Ver05 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Versionhantering',
    id: 'VER.05',
  };

  given = '$.servers.[url]';
  message =
    "Version BÖR anges i URL enligt formatet v[x] där 'v' avser förkortning för version och x avser ett och bara ett nummer (0-n) för major-version";
  then = [
    {
      function: (targetVal: string, _opts: string, paths: string[]) => {
        const split = targetVal.split('/').filter((removeEmpty) => removeEmpty);

        let valid: boolean = false;
        split.forEach(function (part) {
          // regexp : Allow 'v', (and not allow explicit chars '_','-','.' before version number)
          const containsVersion = /(v)[0-9][1-9]*(?![\.\-_])/g;

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
  constructor() {
    super();
    super.initializeFormats(['OAS3']);
  }
  severity = DiagnosticSeverity.Warning;
}
export default { Ver05, Ver06 };
