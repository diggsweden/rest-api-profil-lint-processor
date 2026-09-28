// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { enumeration, truthy, falsy, undefined as undefinedFunc, pattern, schema } from '@stoplight/spectral-functions';
import { DiagnosticSeverity } from '@stoplight/types';
import { BaseRuleset } from './BaseRuleset.js';
import { CustomProperties } from '../ruleinterface/CustomProperties.js';
import { SakBaseApiKeyRule } from './rulesetUtil.js';
import { RuleExecutionContext } from '../util/RuleExecutionContext.js';
//import Format from "@stoplight/spectral-formats";

const moduleName: string = 'SakRules.js';

export class Sak01 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Säkerhet',
    id: 'SAK.01',
  };
  given = '$.servers[*].url';
  then = [
    {
      function: (targetVal: any, _opts: string, paths: string[]) => {
        const urlPattern = new RegExp('^https://.+$');

        const valid = urlPattern.test(targetVal);

        if (valid) {
          return [];
        }

        return [
          {
            message: this.message,
            severity: this.severity,
            paths: paths,
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
          Sak01.customProperties,
        );
      },
    },
  ];
  constructor(context: RuleExecutionContext) {
    super(context);
    super.initializeFormats(['OAS3']);

    this.message = this.translate('rules.sak01.message');
  }
  severity = DiagnosticSeverity.Error;
}
export class Sak09 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Säkerhet',
    id: 'SAK.09',
  };
  given = '$.components.securitySchemes[*]';
  then = [
    {
      field: 'scheme',
      function: pattern,
      functionOptions: {
        notMatch: 'basic',
      },
    },
    {
      field: 'scheme',
      function: pattern,
      functionOptions: {
        notMatch: 'digest',
      },
    },
    {
      field: 'scheme',
      function: (targetVal: string, _opts: string, paths: string[]) => {
        if (targetVal) {
          this.trackRuleExecutionHandler(
            JSON.stringify(targetVal, null, 2),
            _opts,
            paths,
            this.severity,
            this.constructor.name,
            moduleName,
            Sak09.customProperties,
          );
        }
      },
    },
  ];
  constructor(context: RuleExecutionContext) {
    super(context);
    super.initializeFormats(['OAS3']);

    this.description = this.translate('rules.sak09.description');
    this.message = this.translate('rules.sak09.message');
  }
  severity = DiagnosticSeverity.Error;
}
export class Sak10 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Säkerhet',
    id: 'SAK.10',
  };
  given = '$..components.securitySchemes[?(@ && @.scheme)]';
  then = [
    {
      field: 'scheme',
      function: pattern,
      functionOptions: {
        match: 'bearer',
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
          Sak10.customProperties,
        );
      },
    },
  ];
  constructor(context: RuleExecutionContext) {
    super(context);
    super.initializeFormats(['OAS3']);

    this.description = this.translate('rules.sak10.description');
    this.message = this.translate('rules.sak10.message');
  }
  severity = DiagnosticSeverity.Error;
}
export class Sak15 extends SakBaseApiKeyRule {
  static customProperties: CustomProperties = {
    område: 'Säkerhet',
    id: 'SAK.15',
  };
  constructor(context: RuleExecutionContext) {
    super(context);
    super.initializeFormats(['OAS3']);

    this.description = '-';
    this.message = this.translate('rules.sak15.message');
  }

  protected validate(targetVal: any): any[] {
    const result: any[] = [];
    if (targetVal.in && targetVal.in.toLowerCase() === 'query') {
      result.push({
        message: this.message,
        severity: this.severity,
      });
    }
    return result;
  }
  protected getCustomProperties(): CustomProperties {
    return Sak15.customProperties;
  }
  protected getModuleName(): string {
    return moduleName;
  }
}
/**
 *
 */
export class Sak16 extends SakBaseApiKeyRule {
  static customProperties: CustomProperties = {
    område: 'Säkerhet',
    id: 'SAK.16',
  };
  constructor(context: RuleExecutionContext) {
    super(context);
    super.initializeFormats(['OAS3']);

    this.description = this.translate('rules.sak16.description');
    this.message = this.translate('rules.sak16.message');
  }
  severity = DiagnosticSeverity.Error;

  protected getCustomProperties(): CustomProperties {
    return Sak16.customProperties;
  }
  protected getModuleName(): string {
    return moduleName;
  }
  protected validate(targetVal: any): any[] {
    const result: any[] = [];
    if (targetVal.in?.toLowerCase() !== 'header') {
      result.push({
        message: this.message,
        severity: this.severity,
      });
    }
    return result;
  }
}
export class Sak18 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Säkerhet',
    id: 'SAK.18',
  };
  given =
    "$..[securitySchemes][?(@ && @.type=='oauth2' && @.flows ? true : false)][*].[?(@property && @property.match(/Url$/i))]";
  then = [
    {
      function: pattern,
      functionOptions: {
        notMatch: '^http:',
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
          Sak18.customProperties,
        );
      },
    },
  ];
  constructor(context: RuleExecutionContext) {
    super(context);
    super.initializeFormats(['OAS3']);

    this.description = this.translate('rules.sak18.description');
    this.message = this.translate('rules.sak18.message');
  }
  severity = DiagnosticSeverity.Warning;
}

export class Sak29 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Säkerhet',
    id: 'SAK.29',
  };
  given = '$.paths[*][post,put,patch,delete,options]';
  then = [
    {
      function: (targetVal: any, _opts: string, paths: string[]) => {
        if (!targetVal?.requestBody) {
          return [];
        }

        const response415 = targetVal.responses && (targetVal.responses['415'] || targetVal.responses[415]);

        if (response415) {
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
      function: (targetVal: any, _opts: string, paths: string[]) => {
        this.trackRuleExecutionHandler(
          JSON.stringify(targetVal, null, 2),
          _opts,
          paths,
          this.severity,
          this.constructor.name,
          moduleName,
          Sak29.customProperties,
        );
      },
    },
  ];

  constructor(context: RuleExecutionContext) {
    super(context);
    super.initializeFormats(['OAS3']);

    this.description = '';
    this.message = this.translate('rules.sak29.message');
  }

  severity = DiagnosticSeverity.Warning;
}
export default { Sak09, Sak10, Sak15, Sak16, Sak18, Sak29 };
