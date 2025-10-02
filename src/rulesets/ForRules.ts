// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { falsy, undefined as undefinedFunc } from '@stoplight/spectral-functions';
import { DiagnosticSeverity } from '@stoplight/types';
import { CustomProperties } from '../ruleinterface/CustomProperties.js';
import { BaseRuleset } from './BaseRuleset.js';
import Format from '@stoplight/spectral-formats';
import { CustomFormats } from './util/CustomOasVersion.js';

const moduleName: string = 'ForRules.js';

/**
 * Module contains classes with functions that are need
 */
export class For02 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Förutsättningar',
    id: 'FOR.02',
  };
  description = 'EN GET -förfrågan SKALL INTE acceptera en body';
  message = 'EN GET -förfrågan SKALL INTE acceptera en body';
  given = '$.paths..get';
  then = [
    {
      field: 'requestBody',
      function: undefinedFunc,
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
          For02.customProperties,
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
export default { For02 };
