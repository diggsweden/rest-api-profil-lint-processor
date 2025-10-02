// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { DiagnosticSeverity } from '@stoplight/types';
import { CustomProperties } from '../ruleinterface/CustomProperties.js';
import { BaseRuleset } from './BaseRuleset.js';

const moduleName: string = 'FelRules.js';

/**
 * Module contains classes with functions that are needed for category felhantering
 */
export class Fel01 extends BaseRuleset {
  static mandatoryProperties = ['type', 'title', 'status', 'detail', 'instance'];
  static ruleMessage = `Om HTTP svarskoderna inte räcker SKALL (FEL.01) API:et beskriva feldetaljer enligt RFC 9457 med dessa ingående attribut; ${Fel01.mandatoryProperties.join(', ')}.`;

  static customProperties: CustomProperties = {
    område: 'Felhantering',
    id: 'FEL.01',
  };
  description = '';
  message = Fel01.ruleMessage;
  given = [
    "$.paths.*.*.responses.*.content['application/problem+json'].schema",
    "$.paths.*.*.responses.*.content['application/problem+xml'].schema",
  ];
  then = [
    {
      function: (targetVal: unknown, _opts: unknown, paths: string[]) => {
        if (!isOpenApiObject(targetVal)) {
          return [{ message: 'Schema must be object' }];
        }

        return Fel01.mandatoryProperties
          .filter((mandatory) => {
            return !targetVal.properties?.[mandatory];
          })
          .map((missing) => ({
            message: `Missing required field: ${missing}`,
          }));
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
          Fel01.customProperties,
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

export class Fel02 extends BaseRuleset {
  static errorMessage =
    'Schemat enligt RFC 9457 bör innehålla de beskrivna attributen i FEL.01 och SKALL (FEL.02) använda mediatypen application/problem+json eller application/problem+xml i svaret.';
  static customProperties: CustomProperties = {
    område: 'Felhantering',
    id: 'FEL.02',
  };
  description = '';
  message = Fel02.errorMessage;
  given = "$.paths[*][*].responses[?(@property == 'default' || @property >= 400)].content";
  then = [
    {
      function: (targetVal: any, opts: any, paths: any) => {
        // Ensure at least one of the fields exists
        const hasJson = !!targetVal?.['application/problem+json'];
        const hasXml = !!targetVal?.['application/problem+xml'];

        if (!hasJson && !hasXml) {
          return [
            {
              message: this.message,
              path: paths.given,
            },
          ];
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
          Fel02.customProperties,
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
export default { Fel01, Fel02 };

type OpenApiObject = {
  type: 'object';
  properties?: Record<string, unknown>;
  required?: string[];
};

const isOpenApiObject = (x: unknown): x is OpenApiObject => {
  return (x as OpenApiObject)?.type === 'object';
};
