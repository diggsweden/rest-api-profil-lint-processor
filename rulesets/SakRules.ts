// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { enumeration, truthy, falsy, undefined as undefinedFunc, pattern, schema } from '@stoplight/spectral-functions';
import { DiagnosticSeverity } from '@stoplight/types';
import { BaseRuleset } from './BaseRuleset.ts';
import { CustomProperties } from '../ruleinterface/CustomProperties.ts';
import { SakBaseApiKeyRule } from './rulesetUtil.ts';
//import Format from "@stoplight/spectral-formats";

const moduleName: string = 'SakRules.ts';

export class Sak09 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Säkerhet',
    id: 'SAK.09',
  };
  description =
    'HTTP Basic är ett naturligt osäkert sätt att skicka inloggningsuppgifter till API:et. De placeras i URL:en i base64 som enkelt kan dekrypteras. Även om du använder en token finns det mycket bättre sätt att hantera att skicka tokens till ett API som är mindre benägna att läcka ut information';
  message = 'Basic- eller Digest-autentisering SKALL INTE användas.';
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
  constructor() {
    super();
    super.initializeFormats(['OAS3']);
  }
  severity = DiagnosticSeverity.Error;
}
export class Sak10 extends BaseRuleset {
  static customProperties: CustomProperties = {
    område: 'Säkerhet',
    id: 'SAK.10',
  };
  description =
    'Genom att använda HTTPS för att kryptera kommunikationen mellan klient och server kan Bearer Authentication erbjuda en hög nivå av säkerhet. Det gör det svårare för angripare att avlyssna eller ändra åtkomsttoken under överföringen';
  message = 'Authorization: Bearer header SKALL användas för autentisering/auktorisation.';
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
  constructor() {
    super();
    super.initializeFormats(['OAS3']);
  }
  severity = DiagnosticSeverity.Error;
}
export class Sak15 extends SakBaseApiKeyRule {
   static customProperties: CustomProperties = {
    område: 'Säkerhet',
    id: 'SAK.15',
  };
  constructor() {
    super();
  }
  description = '-';
  message = 'API-nycklar SKALL INTE inkluderas i URL eller querysträngen';

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
  constructor() {
    super();
  }
  description =
  'API-nycklar SKALL inkluderas i HTTP-headern eftersom querysträngar kan sparas i okrypterat format.';
  message = 'API-nycklar SKALL inkluderas i HTTP-headern eftersom querysträngar kan sparas av klienten eller servern i okrypterat format av webbläsaren eller serverapplikationen.';
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
  description = 'OAuth är ett auktorisationsprotokoll som säkert delegerar behörighet till en annan resurs.';
  message = 'OAuth version 2.0 eller senare BÖR användas för auktorisation.';
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
  constructor() {
    super();
    super.initializeFormats(['OAS3']);
  }
  severity = DiagnosticSeverity.Warning;
}
export default { Sak09, Sak10, Sak15, Sak16, Sak18 };
