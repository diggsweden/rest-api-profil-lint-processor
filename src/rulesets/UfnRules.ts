// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { Ufn09Base, Ufn05Base } from './rulesetUtil.js';
import { BaseRuleset } from './BaseRuleset.js';
import {
  enumeration,
  truthy,
  falsy,
  undefined as undefinedFunc,
  pattern,
  schema,
  length,
  alphabetical,
} from '@stoplight/spectral-functions';
import { DiagnosticSeverity } from '@stoplight/types';
import { CustomProperties } from '../ruleinterface/CustomProperties.js';
import Format from '@stoplight/spectral-formats';
const moduleName: string = 'UfnRules.js';

export class Ufn01 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'URL Format och namngivning',
    id: 'UFN.01',
  };
  description = '{protokoll}://{domännamn}/{api}/{version}/{resurs}/{identifierare}?{parametrar}';
  given = '$.servers.[url]';
  message = 'En URL för ett API BÖR följa namnstandarden nedan: ' + this.description;
  then = [
    {
      function: pattern,
      functionOptions: {
        match:
          '^(?<protocol>^[^\/]*:\/\/)+(?<host>(?<=:\/\/)[^\/]+\/)+(?<api>(?<=\/)[^\/]+?\/)(?<version>(?<=\/)v+[0-9]+)+(?<end>\/$|$)',
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
          Ufn01.customProperties,
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
export class Ufn02 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'URL Format och namngivning',
    id: 'UFN.02',
  };
  given = '$.servers.[url]';
  message = 'Alla API:er SKALL exponeras via HTTPS på port 443.';
  then = [
    {
      function: (targetVal): any => {
        const protocollPattern = /^https:/;
        const portPattern = /(?<port>:[0-9]+)\//;
        const port = targetVal.match(portPattern);
        const result: any = [];

        if (protocollPattern.test(targetVal)) {
          if (port != null) {
            if (port.groups.port === ':443') {
              return result;
            }
          } else {
            return result;
          }
        }
        return [
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
          Ufn02.customProperties,
        );
      },
    },
  ];
  constructor() {
    super();
    super.initializeFormats(['OAS3']);
  }
  severity = DiagnosticSeverity.Error;
}
export class Ufn05Servers extends Ufn05Base {
  given = '$.servers[*].url';
  then = [
    {
      function: (targetVal: any, _opts: string, paths: any) => {
        let result: any = [];
        if (targetVal.length > 2048) {
          result.push({
            message: this.message,
            severity: this.severity,
            path: paths.path,
          });
        } else {
          if (Ufn05Base.paths.length > 0) {
            for (let path of Ufn05Base.paths) {
              if (path.string.length + targetVal.length > 2048) {
                result.push(
                  {
                    path: ['paths', path.jsonPath],
                    message: this.message,
                    severity: this.severity,
                  },
                  {
                    path: paths.path,
                    message: this.message,
                    severity: this.severity,
                  },
                );
              }
            }
          } else {
            Ufn05Base.baseurls.push({ string: targetVal, jsonPath: paths.path });
          }
        }
        return result;
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
          Ufn05Servers.customProperties,
        );
      },
    },
  ];
  constructor() {
    super();
    super.initializeFormats(['OAS3']);
  }
}
export class Ufn05paths extends Ufn05Base {
  given = '$.paths';
  then = [
    {
      function: (targetVal: any, _opts: string, paths: any) => {
        let result: any = [];
        let pathArray: any = [];
        for (const [key] of Object.entries(targetVal)) {
          for (let method of Object.entries(targetVal[key])) {
            if (method.length > 1) {
              let metodObj: any = method[1];
              let pathStr = key;
              let paramStr = '';
              if (metodObj.hasOwnProperty('parameters')) {
                for (let parameter of metodObj.parameters) {
                  if (parameter.hasOwnProperty('in') && parameter.in === 'path' && parameter.hasOwnProperty('name')) {
                    paramStr += `${parameter.name}=&`;
                  }
                }
                pathStr += paramStr.length > 0 ? `?${paramStr}` : '';
              }
              pathArray.push({ string: pathStr, jsonPath: key });
            }
          }
        }
        for (let path of pathArray) {
          if (path.string.length > 2048) {
            result.push({
              message: this.message,
              severity: this.severity,
              path: ['paths', path.jsonPath],
            });
          } else {
            if (Ufn05Base.baseurls.length > 0) {
              for (let baseurl of Ufn05Base.baseurls) {
                if (baseurl.string.length + path.string.length > 2048) {
                  result.push(
                    {
                      message: this.message,
                      severity: this.severity,
                      path: ['paths', path.jsonPath],
                    },
                    {
                      message: this.message,
                      severity: this.severity,
                      path: baseurl.jsonPath,
                    },
                  );
                }
              }
            } else {
              Ufn05Base.paths.push(path);
            }
          }
        }
        return result;
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
          Ufn05paths.customProperties,
        );
      },
    },
  ];
  constructor() {
    super();
    super.initializeFormats(['OAS3']);
  }
}
export class Ufn08 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'URL Format och namngivning',
    id: 'UFN.08',
  };

  given = '$.paths[*]~';
  message =
    "Endast bindestreck '-' SKALL användas för att separera ord för att öka läsbarheten samt förenkla för sökmotorer att indexera varje ord för sig (gäller URL-elementen Authority och Path. Mer specifikt API-elementen domännamn, api, resurs, identifierare).";
  then = [
    {
      function: (targetVal: string, _opts: string, paths: string[]) => {
        const split = targetVal.split('/').filter((removeEmpty) => removeEmpty);
        const pathElements = split.filter((e) => !e.startsWith('{'));

        var valid: boolean = true;
        pathElements.forEach((part) => {
          //  regexp tillåter inte "-", ".", "_" samt "~"
          const separators = /([,._~]+)/g;
          if (separators.test(part)) {
            valid = false;
          }
          if (part.startsWith('-') || part.endsWith('-')) {
            valid = false;
          }
          if (part.indexOf('--') >= 0) {
            valid = false;
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
          Ufn08.customProperties,
        );
      },
    },
  ];
  constructor() {
    super();
    super.initializeFormats(['OAS3', 'OAS2']);
  }
  severity = DiagnosticSeverity.Error;
}
export class Ufn07 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'URL Format och namngivning',
    id: 'UFN.07',
  };
  message =
    'URL:n SKALL använda dessa tecknen a-z, 0-9, "-", "." samt "~", se vidare i RFC 3986) (gäller URL-elementen Scheme, Authority och Path samt API-elementen protokoll, domännamn, api, version, resurs och identifierare).';
  given = '$.';
  then = [
    {
      field: 'servers',
      function: (targetVal, _opts, paths) => {
        const result: any = [];
        if (targetVal) {
          const removeTemplating: RegExp = /{.[^{}]*}/;
          const pattern: RegExp = /^[a-z0-9\/\-,.~]+$/;
          const delimiter: RegExp = /:/g;
          const property: string = 'url';

          for (let i = 0; i < targetVal.length; i++) {
            if (targetVal[i].hasOwnProperty(property)) {
              const url = targetVal[i][property].replace(delimiter, '').split(removeTemplating).join('');
              this.trackRuleExecutionHandler(
                JSON.stringify(targetVal[i], null, 2),
                _opts,
                paths,
                this.severity,
                this.constructor.name,
                moduleName,
                Ufn07.customProperties,
              );

              if (!pattern.test(url)) {
                result.push({
                  path: [...paths.path, i, property],
                  message: this.message,
                  severity: this.severity,
                });
              }
            }
          }
        }
        return result;
      },
    },
    {
      field: 'paths',
      function: (targetVal, _opts, paths) => {
        const removeTemplating: RegExp = /{.[^{}]*}/;
        const pattern: RegExp = /^[a-z0-9\/\-,.~]+$/;
        const result: any = [];
        for (let path in targetVal) {
          path = path.split(removeTemplating).join('');
          this.trackRuleExecutionHandler(
            JSON.stringify(targetVal[path], null, 2),
            _opts,
            paths,
            this.severity,
            this.constructor.name,
            moduleName,
            Ufn07.customProperties,
          );

          if (!pattern.test(path)) {
            result.push({
              path: [...paths.path, path],
              message: this.message,
              severity: this.severity,
            });
          }
        }
        return result;
      },
    },
  ];
  constructor() {
    super();
    super.initializeFormats(['OAS3', 'OAS2']);
  }
  severity = DiagnosticSeverity.Error;
}
export class Ufn09Server extends Ufn09Base {
  given = '$.servers.[url]';
  constructor() {
    super();
    super.initializeFormats(['OAS3']);
  }
}
export class Ufn09InPathParameters extends Ufn09Base {
  given = "$.paths.*.*.parameters[?(@.in=='path')].name";
  constructor() {
    super();
    super.initializeFormats(['OAS3']);
  }
}
export class Ufn09Path extends Ufn09Base {
  given = '$.paths[*]~';
  constructor() {
    super();
    super.initializeFormats(['OAS3']);
  }
}
export default { Ufn01, Ufn02, Ufn05Servers, Ufn05paths, Ufn07, Ufn08, Ufn09Server, Ufn09Path, Ufn09InPathParameters };
