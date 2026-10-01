// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { Arq05Base } from './rulesetUtil.js';
import { schema } from '@stoplight/spectral-functions';
import { DiagnosticSeverity } from '@stoplight/types';
import { CustomProperties } from '../ruleinterface/CustomProperties.js';
import { BaseRuleset } from './BaseRuleset.js';
import { isValidApplicationJson } from './rulesetUtil.js';
import { RuleExecutionContext } from '../util/RuleExecutionContext.js';
import { translator } from '../i18n.js';

const moduleName: string = 'ArqRules.js';

export class Arq05NestedStructure extends Arq05Base {
  constructor(context: RuleExecutionContext) {
    super(context);

    this.description = this.translate(context, 'rules.arq05.nestedStructure.description');
    this.message = `[${super.messageValue}] ${this.description}`;
  }

  then = [
    {
      function: (targetVal, _opts, paths) => {
        if (this.checkSchema(targetVal, 'object') && targetVal.schema.properties) {
          return [
            {
              message: this.message,
              severity: this.severity,
            },
          ];
        }
        return [];
      },
    },
    {
      function: (targetVal: string, _opts: string, paths: string[]) => {
        return this.trackRuleExecutionHandler(
          JSON.stringify(targetVal, null, 2),
          _opts,
          paths,
          this.severity,
          this.constructor.name,
          moduleName,
          Arq05NestedStructure.customProperties,
        );
      },
    },
  ];
}
export class Arq05StringBinary extends Arq05Base {
  constructor(context: RuleExecutionContext) {
    super(context);

    this.description = this.translate(context, 'rules.arq05.stringBinary.description');
    this.message = `[${super.messageValue}] ${this.description}`;
  }
  then = [
    {
      function: (targetVal, _opts, paths) => {
        if (this.checkSchema(targetVal, 'string', 'binary')) {
          return [
            {
              message: this.message,
              severity: this.severity,
            },
          ];
        }

        return [];
      },
    },
    {
      function: (targetVal: string, _opts: string, paths: string[]) => {
        return this.trackRuleExecutionHandler(
          JSON.stringify(targetVal, null, 2),
          _opts,
          paths,
          this.severity,
          this.constructor.name,
          moduleName,
          Arq05StringBinary.customProperties,
        );
      },
    },
  ];
}
export class Arq05ComplexStructure extends Arq05Base {
  constructor(context: RuleExecutionContext) {
    super(context);

    this.description = this.translate(context, 'rules.arq05.complexStructure.description');
    this.message = `[${super.messageValue}] ${this.description}`;
  }
  then = [
    {
      function: (targetVal, _opts, paths) => {
        if (this.checkSchema(targetVal, 'object')) {
          return [
            {
              message: this.message,
              severity: this.severity,
            },
          ];
        }
        return [];
      },
    },
    {
      function: (targetVal: string, _opts: string, paths: string[]) => {
        return this.trackRuleExecutionHandler(
          JSON.stringify(targetVal, null, 2),
          _opts,
          paths,
          this.severity,
          this.constructor.name,
          moduleName,
          Arq05ComplexStructure.customProperties,
        );
      },
    },
  ];
}
export class Arq01 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'API Request',
    id: 'ARQ.01',
  };
  given = '$.paths[*][*].requestBody.content';
  then = [
    {
      function: (targetVal: any, _opts: string, paths: string[]) => {
        const valid: boolean = Object.keys(targetVal ?? {}).some((property) => isValidApplicationJson(property));

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
        return this.trackRuleExecutionHandler(
          JSON.stringify(targetVal, null, 2),
          _opts,
          paths,
          this.severity,
          this.constructor.name,
          moduleName,
          Arq01.customProperties,
        );
      },
    },
  ];
  constructor(context: RuleExecutionContext) {
    super(context);
    super.initializeFormats(['OAS3']);

    const t = translator(context.locale);
    this.description = t('rules.arq01.description');
    this.message = t('rules.arq01.message');
  }
  severity = DiagnosticSeverity.Warning;
}
export class Arq03 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'API Request',
    id: 'ARQ.03',
  };
  given = '$.paths.*.*';
  then = [
    {
      function: (targetVal: object, _opts: string, paths: string[]) => {
        let isValid = true;
        if (targetVal['parameters'] !== undefined) {
          targetVal['parameters'].forEach((element) => {
            if (element['in'] == 'header') {
              if (element['name'] == 'Date' && element['schema']['format'] !== 'date-time') {
                isValid = false;
              }
              if (element['name'] == 'Cache-Control' && element['schema']['enum'].length == 0) {
                isValid = false;
              }
              if (element['name'] == 'ETag' && element['schema']['format'] !== 'etag') {
                isValid = false;
              }
              if (element['name'] == 'Connection' && !element['schema']['enum'].includes('keep-alive')) {
                isValid = false;
              }
            }
            if (element['in'] === 'cookie' && element['schema']['type'] == undefined) {
              isValid = false;
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
    {
      function: (targetVal: string, _opts: string, paths: string[]) => {
        return this.trackRuleExecutionHandler(
          JSON.stringify(targetVal, null, 2),
          _opts,
          paths,
          this.severity,
          this.constructor.name,
          moduleName,
          Arq03.customProperties,
        );
      },
    },
  ];
  constructor(context: RuleExecutionContext) {
    super(context);
    super.initializeFormats(['OAS3']);

    const t = translator(context.locale);
    this.description = t('rules.arq03.description');
    this.message = this.description;
  }
  severity = DiagnosticSeverity.Warning;
}
export default { Arq05ComplexStructure, Arq05StringBinary, Arq05NestedStructure, Arq03, Arq01 };
