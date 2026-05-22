// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { DiagnosticSeverity } from '@stoplight/types';
import { CustomProperties } from '../ruleinterface/CustomProperties.js';
import { BaseRuleset } from './BaseRuleset.js';
import { RuleExecutionContext } from '../util/RuleExecutionContext.js';

const moduleName: string = 'FelRules.js';

/**
 * Module contains classes with functions that are needed for category felhantering
 */
export class Fel01 extends BaseRuleset {
  static mandatoryProperties = ['type', 'title', 'status', 'detail', 'instance'];
  static ruleMessage = `Om HTTP svarskoderna inte räcker SKALL (FEL.01) API:et beskriva feldetaljer enligt RFC 9457 med dessa ingående attribut; ${Fel01.mandatoryProperties.join(
    ', ',
  )}.`;

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
      function: (targetVal: unknown,  
        _opts: unknown,
         paths: string[], otherValues?: { document?: { data?: unknown } }
      ) => {

        const rootDocument = otherValues?.document?.data;
        if (!isOpenApiSchema(targetVal)) {
          return [{ message: 'Schema must be an object' }];
        }
        //No oneOf --> see GUIDELINES.md
        if (Array.isArray(targetVal.oneOf)) {
          return [{ message: Fel01.ruleMessage }];
        }     
        const schemaInfo = this.collectSchemaInfo(
          targetVal,
          rootDocument,
          new Set<string>(),
        );

        return Fel01.mandatoryProperties.flatMap((mandatory) => {
          const issues: Array<{ message: string }> = [];

          if (!schemaInfo.properties.has(mandatory)) {
            issues.push({
              message: `Missing property: ${mandatory}`,
            });
          }

          if (!schemaInfo.required.has(mandatory)) {
            issues.push({
              message: `Missing required field: ${mandatory}`,
            });
          }

          return issues;
        });

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

  constructor(context: RuleExecutionContext) {
    super(context);
    super.initializeFormats(['OAS3']);
  }
  private collectSchemaInfo(
    schema: unknown,
    rootDocument: unknown,
    visitedRefs: Set<string>,
  ): { properties: Set<string>; required: Set<string> } {
    const properties = new Set<string>();
    const required = new Set<string>();

    if (!isOpenApiSchema(schema)) {
      return { properties, required };
    }

    // Ordinary object-schema
    if (isOpenApiObject(schema)) {
      if (schema.properties) {
        Object.keys(schema.properties).forEach((key) => properties.add(key));
      }

      if (Array.isArray(schema.required)) {
        schema.required.forEach((key) => required.add(key));
      }
    }

    // $ref
    if (typeof schema.$ref === 'string') {
      const resolved = this.resolveLocalRef(schema.$ref, rootDocument, visitedRefs);

      if (resolved) {
        const refInfo = this.collectSchemaInfo(resolved, rootDocument, visitedRefs);
        refInfo.properties.forEach((p) => properties.add(p));
        refInfo.required.forEach((r) => required.add(r));
      }
    }

    // allOf
    if (Array.isArray(schema.allOf)) {
      for (const subSchema of schema.allOf) {
        const subInfo = this.collectSchemaInfo(subSchema, rootDocument, visitedRefs);
        subInfo.properties.forEach((p) => properties.add(p));
        subInfo.required.forEach((r) => required.add(r));
      }
    }

    return { properties, required };
  }

  private resolveLocalRef(
    ref: string,
    rootDocument: unknown,
    visitedRefs: Set<string>,
  ): unknown {
    if (!ref.startsWith('#/')) {
      return undefined;
    }

    if (!isOpenApiSchema(rootDocument)) {
      return undefined;
    }

    if (visitedRefs.has(ref)) {
      return undefined;
    }

    visitedRefs.add(ref);

    const pathSegments = ref
      .slice(2)
      .split('/')
      .map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'));

    let current: unknown = rootDocument;

    for (const segment of pathSegments) {
      if (!isOpenApiSchema(current) || !(segment in current)) {
        return undefined;
      }

      current = current[segment];
    }

    return current;
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

  constructor(context: RuleExecutionContext) {
    super(context);
    super.initializeFormats(['OAS3']);
  }
}
export default { Fel01, Fel02 };

const isOpenApiSchema = (x: unknown): x is OpenApiSchema => {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
};

const isOpenApiObject = (x: unknown): x is OpenApiObject => {
  return isOpenApiSchema(x) && x.type === 'object';
};
/**
 * Bredare schematyp för traversal av OpenAPI-schema.
 * Den representerar inte bara "type: object"-scheman,
 * utan även kompositions- och referensnoder.
 */
type OpenApiSchema = {
  $ref?: string;
  allOf?: unknown[];
  oneOf?: unknown[];
  type?: string;
  properties?: Record<string, unknown>;
  required?: string[];
};

type OpenApiObject = OpenApiSchema & {
  type: 'object';
};
