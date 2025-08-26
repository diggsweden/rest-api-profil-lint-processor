// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { CustomProperties } from '../ruleinterface/CustomProperties.ts';
import { BaseRuleset } from './BaseRuleset.ts';
import { truthy, falsy, pattern } from '@stoplight/spectral-functions';
import { DiagnosticSeverity } from '@stoplight/types';
import { Dok03Base } from './rulesetUtil.ts';
import { Dok15Base } from './rulesetUtil.ts';
const moduleName: string = 'DokRules.ts';

export class Dok15Get extends Dok15Base {
  given = '$.paths[*][*].responses[*].content.application/json';
  then = [
    {
      function: (targetVal: any, _opts: string, paths: string[]) => {
        return super.test(targetVal, _opts, paths);
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
          Dok15Base.customProperties,
        );
      },
    },
  ];
}

export class Dok15ReqBody extends Dok15Base {
  given = '$.paths[*][?(@ != "get")].requestBody.content.application/json';
  then = [
    {
      function: (targetVal: any, _opts: string, paths: string[]) => {
        return super.test(targetVal, _opts, paths);
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
          Dok15Base.customProperties,
        );
      },
    },
  ];
}

export class Dok17 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Dokumentation',
    id: 'DOK.17',
  };
  description =
    ' ( Linter-analysverktyget (RAP-LP) för den nationella REST API-profilen är designat för senaste major versionen av OpenAPI Specification. Använd därför denna för full täckning av de implementerade reglerna. )';
  message = 'API specifikation BÖR dokumenteras med den senaste versionen av OpenAPI Specification.' + this.description;
  given = '$';
  then = [
    {
      field: 'swagger',
      function: falsy,
    },
    {
      field: 'openapi',
      function: pattern,
      functionOptions: {
        // Matcha pattern 3.x.y och major version större än 3
        match: '^(3|[4-9]|[1-9]\\d+)\\.\\d+\\.\\d+$',
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
          Dok17.customProperties,
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

export class Dok20 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Dokumentation',
    id: 'DOK.20',
  };
  given = '$.paths[*][*].responses[*]';
  message = 'Förväntade returkoder och felkoder SKALL vara fullständigt dokumenterade.';
  then = [
    {
      field: 'description',
      function: truthy,
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
          Dok20.customProperties,
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
export class Dok07 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Dokumentation',
    id: 'DOK.07',
  };
  given = '$.info';
  message = 'Dokumentationen av ett API BÖR innehålla övergripande information om API:et.';
  then = [
    {
      field: 'description',
      function: truthy,
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
          Dok07.customProperties,
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
export class Dok19 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Dokumentation',
    id: 'DOK.19',
  };
  given = '$.paths[*][*]';
  message =
    'Ett API:s resurser och de möjliga operationer som kan utföras på resursen SKALL beskrivas så utförligt och tydligt som möjligt';
  then = [
    {
      field: 'description',
      function: truthy,
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
          Dok19.customProperties,
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
export class Dok01 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Dokumentation',
    id: 'DOK.01',
  };
  given = '$';
  message = 'I regel BÖR dokumentationen och specifikationen för ett API finnas allmänt tillgänglig online';
  then = [
    {
      function: (targetVal, _opts, paths) => {
        let obj: any = [];
        if (targetVal.hasOwnProperty('externalDocs')) {
          this.trackRuleExecutionHandler(
            JSON.stringify(targetVal, null, 2),
            _opts,
            paths,
            this.severity,
            this.constructor.name,
            moduleName,
            Dok01.customProperties,
          );

          obj = targetVal['externalDocs'];
          if (obj === null) {
            return [
              {
                path: ['externalDocs'],
                message: this.message,
                severity: this.severity,
              },
            ];
          }
          const hasValidDescription =
            obj.hasOwnProperty('description') && obj.description != null && obj.description.toString().trim() !== '';
          const hasValidUrl = obj.hasOwnProperty('url') && obj.url != null && obj.url.toString().trim() !== '';
          if (!hasValidDescription || !hasValidUrl) {
            return [
              {
                path: ['externalDocs'],
                message: this.message,
                severity: this.severity,
              },
            ];
          }
        }
      },
    },
  ];
  constructor() {
    super();
    super.initializeFormats(['OAS2', 'OAS3']);
  }
  severity = DiagnosticSeverity.Warning;
}

/**
 * Dok03Info
 */
export class Dok03Info extends Dok03Base {
  static customProperties: CustomProperties = {
    område: 'Dokumentation',
    id: 'DOK.03',
  };
  given = '$.info';
  message =
    this.description + '[ info objektet bör ha title, version , description, termsOfService, contact , license ]';
  then = [
    {
      field: 'version',
      function: truthy,
    },
    {
      field: 'title',
      function: truthy,
    },
    {
      field: 'description',
      function: truthy,
    },
    {
      field: 'termsOfService',
      function: truthy,
    },

    {
      function: (targetVal, _opts, paths) => {
        this.trackRuleExecutionHandler(
          JSON.stringify(targetVal, null, 2),
          _opts,
          paths,
          this.severity,
          this.constructor.name,
          moduleName,
          Dok03Info.customProperties,
        );
      },
    },
  ];
  severity = DiagnosticSeverity.Warning;
}

export class Dok03ContactName extends Dok03Base {
  static customProperties: CustomProperties = {
    område: 'Dokumentation',
    id: 'DOK.03',
  };
  message = this.description + '(Contact saknar name)';
  given = '$.info.contact';

  then = [
    {
      field: 'name',
      function: truthy,
    },
  ];
  severity = DiagnosticSeverity.Warning;
}

export class Dok03ContactEmail extends Dok03Base {
  static customProperties: CustomProperties = {
    område: 'Dokumentation',
    id: 'DOK.03',
  };
  message = this.description + '(Contact saknar email)';
  given = '$.info.contact';

  then = [
    {
      field: 'email',
      function: truthy,
    },
  ];
  severity = DiagnosticSeverity.Warning;
}

export class Dok03ContactUrl extends Dok03Base {
  static customProperties: CustomProperties = {
    område: 'Dokumentation',
    id: 'DOK.03',
  };
  message = this.description + '(Contact saknar url)';
  given = '$.info.contact';

  then = [
    {
      field: 'url',
      function: truthy,
    },
  ];
  severity = DiagnosticSeverity.Warning;
}

export class Dok03Contact extends Dok03Base {
  static customProperties: CustomProperties = {
    område: 'Dokumentation',
    id: 'DOK.03',
  };
  message = this.description + '(Saknar contact objektet)';
  given = '$.info';

  then = [
    {
      field: 'contact',
      function: truthy,
    },
  ];
}

export class Dok03License extends Dok03Base {
  static customProperties: CustomProperties = {
    område: 'Dokumentation',
    id: 'DOK.03',
  };
  message = this.description + '(Saknar license objektet)';
  given = '$.info';

  then = [
    {
      field: 'license',
      function: truthy,
    },
  ];
}

export class Dok03LicenseUrl extends Dok03Base {
  static customProperties: CustomProperties = {
    område: 'Dokumentation',
    id: 'DOK.03',
  };
  message = this.description + '(license saknar url)';
  given = '$.info.license';

  then = [
    {
      field: 'url',
      function: truthy,
    },
  ];
}

export class Dok03LicenseName extends Dok03Base {
  static customProperties: CustomProperties = {
    område: 'Dokumentation',
    id: 'DOK.03',
  };
  message = this.description + '(license saknar name)';
  given = '$.info.license';

  then = [
    {
      field: 'name',
      function: truthy,
    },
  ];
}

export default {
  Dok20,
  Dok19,
  Dok07,
  Dok01,
  Dok17,
  Dok15Get,
  Dok15ReqBody,
  Dok03Info,
  Dok03Contact,
  Dok03License,
  Dok03ContactEmail,
  Dok03ContactName,
  Dok03ContactUrl,
  Dok03LicenseUrl,
  Dok03LicenseName,
};
