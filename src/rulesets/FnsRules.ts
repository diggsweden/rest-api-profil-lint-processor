// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { enumeration, truthy, falsy, undefined as undefinedFunc, pattern, schema } from '@stoplight/spectral-functions';
import { DiagnosticSeverity } from '@stoplight/types';
import { CustomProperties } from '../ruleinterface/CustomProperties.js';
import { BaseRuleset } from './BaseRuleset.js';

const moduleName: string = 'FnsRules.js';

export class Fns01 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Filtrering, paginering och sökparametrar',
    id: 'FNS.01',
  };
  description =
    'Parameternamn SKALL anges med en konsekvent namnkonvention inom ett API, exempelvis antingen snake_case eller camelCase';
  message =
    'Parameternamn SKALL anges med en konsekvent namnkonvention inom ett API, exempelvis antingen snake_case eller camelCase';
  given = "$.paths.*.*.parameters[?(@.in=='query')].name";
  then = [
    {
      function: pattern,
      functionOptions: {
        match: '^(?:[a-z0-9]+(?:_[a-z0-9]+)*|[a-z]+(?:[A-Z][a-z]*)*)$',
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
          Fns01.customProperties,
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

export class Fns03 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Filtrering, paginering och sökparametrar',
    id: 'FNS.03',
  };
  description = 'Sökparametrar SKALL starta med en bokstav';
  message = 'Sökparametrar SKALL starta med en bokstav.';
  given = "$.paths.*.*.parameters[?(@.in=='query')].name";
  then = [
    {
      function: pattern,
      functionOptions: {
        match: '^[a-zA-Z].*$',
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
          Fns03.customProperties,
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

export class Fns09 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Filtrering, paginering och sökparametrar',
    id: 'FNS.09',
  };
  description = 'Defaultvärde för limit BÖR vara 20';
  message = 'Defaultvärde för limit BÖR vara 20';
  given = '$.paths..parameters';
  severity = DiagnosticSeverity.Warning;
  then = [
    {
      function: (targetVal: any, _opts: string, paths: string[]) => {
        let isValid = true;
        let hasChecked = false;

        if (Array.isArray(targetVal)) {
          targetVal.forEach((item) => {
            if (item['in'] == 'query' && (item['name'] == 'page' || item['name'] == 'offset')) {
              // check for existense of 'limit' parameter
              const limit = targetVal.find((param) => param.name === 'limit');
              if (limit) {
                isValid = limit.schema.default === 20;
              }
              /**
               * Track ruleexecution
               */
              if (!hasChecked) {
                this.trackRuleExecutionHandler(
                  JSON.stringify(targetVal, null, 2),
                  _opts,
                  paths,
                  this.severity,
                  this.constructor.name,
                  moduleName,
                  Fns09.customProperties,
                );
                hasChecked = true;
              }
            }
          });
        }
        if (!isValid) {
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
  ];
  constructor() {
    super();
    super.initializeFormats(['OAS2', 'OAS3']);
  }
}
export class Fns05 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Filtrering, paginering och sökparametrar',
    id: 'FNS.05',
  };
  description = 'Sökparametrar BÖR vara frivilliga.';
  message = 'Sökparametrar BÖR vara frivilliga.';
  given = "$.paths.[*].parameters[?(@.in=='query')].required";

  then = [
    {
      function: (targetVal) => {
        return false === targetVal
          ? []
          : [
              {
                message: this.message,
                severity: this.severity,
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
          Fns05.customProperties,
        );
      },
    },
  ];
  constructor() {
    super();
    super.initializeFormats(['OAS2', 'OAS3']);
  }
  severity = DiagnosticSeverity.Warning;
}
export class Fns06 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Filtrering, paginering och sökparametrar',
    id: 'FNS.06',
  };
  description =
    "Sökparametrar BÖR använda tecken som är URL-säkra (tecknen A-Z, a-z, 0-9, '-'', '.', '_' samt '~', se vidare i RFC 3986)";
  message =
    "Sökparametrar BÖR använda tecken som är URL-säkra (tecknen A-Z, a-z, 0-9, '-', '.', '_' samt '~', se vidare i RFC 3986)";
  given = "$.paths.[*].parameters[?(@.in=='query')].name";
  then = [
    {
      function: pattern,
      functionOptions: {
        match: '^(?:[a-zA-Z0-9-._~])+$',
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
          Fns06.customProperties,
        );
      },
    },
  ];
  constructor() {
    super();
    super.initializeFormats(['OAS2', 'OAS3']);
  }
  severity = DiagnosticSeverity.Warning;
}

export class Fns07 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Filtrering, paginering och sökparametrar',
    id: 'FNS.07',
  };
  description = '';
  message =
    "Vid användande av paginering, SKALL följande parametrar ingå i request: 'limit' och någon av 'page' eller 'offset'";
  given = '$.paths..parameters';
  then = [
    {
      function: (targetVal: any, _opts: string, paths: string[]) => {
        let isValid = true;
        let hasLimit = false;
        let hasPage = false;
        let hasOffset = false;

        if (Array.isArray(targetVal)) {
          targetVal.forEach(function (parameter, index) {
            if (parameter['in'] == 'query') {
              if (parameter['name'] == 'page') {
                hasPage = true;
              }
              if (parameter['name'] == 'offset') {
                hasOffset = true;
              }
              if (parameter['name'] == 'limit') {
                hasLimit = true;
              }
            }
          });
          if (hasPage || hasOffset) {
            this.trackRuleExecutionHandler(
              JSON.stringify(targetVal, null, 2),
              _opts,
              paths,
              this.severity,
              this.constructor.name,
              moduleName,
              Fns07.customProperties,
            );
          }

          if ((hasPage || hasOffset) && !hasLimit) {
            isValid = false;
          }
        }
        if (isValid) {
          return [];
        } else {
          return [
            {
              message: this.message,
              severity: this.severity,
            },
          ];
        }
      },
    },
  ];
  constructor() {
    super();
    super.initializeFormats(['OAS2', 'OAS3']);
  }
  severity = DiagnosticSeverity.Error;
}

export class Fns08 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Filtrering, paginering och sökparametrar',
    id: 'FNS.08',
  };
  description = '';
  message = "'page' SKALL alltid starta med värde 1";
  given = '$.paths..parameters';
  then = [
    {
      function: (targetVal: any, _opts: string, paths: string[]) => {
        let isValidDefaultValue = true;
        let pageDefaultValue = -1;

        let hasLimit = false;
        let hasPage = false;

        if (Array.isArray(targetVal)) {
          targetVal.forEach(function (parameter, index) {
            if (parameter['in'] == 'query') {
              if (parameter['name'] == 'page') {
                hasPage = true;
                pageDefaultValue = parameter.hasOwnProperty('schema')
                  ? parameter['schema']['default']
                  : pageDefaultValue;
              }
              if (parameter['name'] == 'limit') {
                hasLimit = true;
              }
            }
          });
          if (hasPage && hasLimit) {
            /**
             * Track ruleexecution
             */
            this.trackRuleExecutionHandler(
              JSON.stringify(targetVal, null, 2),
              _opts,
              paths,
              this.severity,
              this.constructor.name,
              moduleName,
              Fns08.customProperties,
            );
            isValidDefaultValue = pageDefaultValue == 1;
          }
        }
        if (isValidDefaultValue) {
          return [];
        } else {
          return [
            {
              message: this.message,
              severity: this.severity,
            },
          ];
        }
      },
    },
  ];
  constructor() {
    super();
    super.initializeFormats(['OAS2', 'OAS3']);
  }
  severity = DiagnosticSeverity.Error;
}

export default { Fns01, Fns03, Fns05, Fns06, Fns07, Fns08, Fns09 };
