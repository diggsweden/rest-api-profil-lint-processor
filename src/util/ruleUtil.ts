// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { RuleCategoryError } from './RapLPBaseApiErrorHandling.js';
import { RuleExecutionContext } from './RuleExecutionContext.js';
import { RuleModuleName } from '../rulesets/util/ruleModules.js';

/**
 *  Add other rule modules when applying new rules to RAP-LP
 *  Modules are loaded as default ones when no explicit category is choosed from the command line
 */
const ruleModules = [
  'UfnRules',
  'SakRules',
  'SpaRules',
  'VerRules',
  'FnsRules',
  'ArqRules',
  'DokRules',
  'AmeRules',
  'ForRules',
  'DotRules',
  'FelRules',
  'ResRules',
  'MogRules',
];

/** Implemented rules */
export const implementedRulesByArea = {
  Dokumentation: [
    'DOK.01',
    'DOK.03',
    'DOK.06',
    'DOK.07',
    'DOK.08',
    'DOK.09',
    'DOK.11',
    'DOK.15',
    'DOK.17',
    'DOK.19',
    'DOK.20',
    'DOK.21',
  ],
  'Datum- och tidsformat': ['DOT.02', 'DOT.04'],
  Resurser: ['RES.02', 'RES.06'],
  'URL Format och namngivning': ['UFN.01', 'UFN.02', 'UFN.05', 'UFN.07', 'UFN.08', 'UFN.09'],
  Mognad: ['MOG.01', 'MOG.02'],
  'API Message': ['AME.01', 'AME.02', 'AME.04', 'AME.05', 'AME.07'],
  'API Request': ['ARQ.01', 'ARQ.03', 'ARQ.05'],
  Felhantering: ['FEL.01', 'FEL.02'],
  Versionhantering: ['VER.05', 'VER.06'],
  'Spårbarhet och korrelation': ['SPA.02', 'SPA.04', 'SPA.07'],
  'Filtrering, paginering och sökparametrar': ['FNS.01', 'FNS.03', 'FNS.05', 'FNS.06', 'FNS.07', 'FNS.08', 'FNS.09'],
  Säkerhet: ['SAK.01', 'SAK.09', 'SAK.10', 'SAK.15', 'SAK.16', 'SAK.18'],
  Förutsättningar: ['FOR.02'],
};

/** Not implemented rules */
export const additionalRulesByArea = {
  Dokumentation: [
    'DOK.02',
    'DOK.04',
    'DOK.05',
    'DOK.10',
    'DOK.12',
    'DOK.13',
    'DOK.16',
    'DOK.18',
    'DOK.22',
    'DOK.23',
    'DOK.24',
  ],
  'Datum- och tidsformat': ['DOT.01', 'DOT.03'],
  Resurser: ['RES.01', 'RES.03', 'RES.04', 'RES.05'],
  'URL Format och namngivning': ['UFN.03', 'UFN.04'],
  Mognad: ['MOG.03'],
  Säkerhet: [
    'SAK.02',
    'SAK.03',
    'SAK.05',
    'SAK.06',
    'SAK.08',
    'SAK.11',
    'SAK.12',
    'SAK.13',
    'SAK.14',
    'SAK.17',
    'SAK.19',
    'SAK.20',
    'SAK.21',
    'SAK.22',
    'SAK.23',
    'SAK.24',
    'SAK.25',
    'SAK.26',
    'SAK.27',
    'SAK.28',
    'SAK.29',
    'SAK.30',
    'SAK.31',
    'SAK.32',
    'SAK.35',
    'SAK.36',
    'SAK.37',
  ],
  'API Message': ['AME.06'],
  'API Request': ['ARQ.02', 'ARQ.06'],
  'API Response': ['ARP.02', 'ARP.03', 'ARP.04'],
  Versionhantering: [
    'VER.01',
    'VER.02',
    'VER.03',
    'VER.04',
    'VER.07',
    'VER.08',
    'VER.09',
    'VER.10',
    'VER.11',
    'VER.12',
    'VER.13',
    'VER.14',
    'VER.15',
    'VER.16',
    'VER.17',
    'VER.18',
    'VER.19',
  ],
  Webhooks: ['WEB.01', 'WEB.02', 'WEB.03', 'WEB.04', 'WEB.05', 'WEB.06'],
  Hypermedia: [
    'HYP.01',
    'HYP.02',
    'HYP.03',
    'HYP.04',
    'HYP.05',
    'HYP.06',
    'HYP.07',
    'HYP.08',
    'HYP.09',
    'HYP.10',
    'HYP.11',
    'HYP.12',
    'HYP.13',
    'HYP.14',
    'HYP.15',
    'HYP.16',
    'HYP.17',
    'HYP.18',
    'HYP.19',
  ],
  'Filtrering, paginering och sökparametrar': ['FNS.02', 'FNS.10', 'FNS.11', 'FNS.12', 'FNS.13', 'FNS.14'],
  Cachning: ['CAC.01'],
};

/**
 *
 * @returns all rules
 */
export function getAllRules() {
  return {
    implemented: implementedRulesByArea,
    additional: additionalRulesByArea,
  };
}

/**
 *
 * @param ruleCategories
 * @returns
 */
export function getRuleModules() {
  return ruleModules;
}
/**
 *
 * @param ruleCategories Defined category (optional)
 * @returns Promise object with enabled rules in RAP-LP to run
 */
export async function importAndCreateRuleInstances(
  context: RuleExecutionContext,
  ruleCategories: RuleModuleName[],
): Promise<{ rules: Record<string, any>; instanceCategoryMap: Map<string, any> }> {
  const ruleInstances: Record<string, any> = {}; // store instances of rule classes
  const ruleTypes: any[] = []; // array to store rule classes.
  const instanceCategoryMap: Map<string, any> = new Map();

  /**
   *
   * @param category Defined category as an parameter
   * @returns Promise - resolve to exported content of the specified module.
   */
  async function importRuleModule(category: string): Promise<any> {
    try {
      // import the module based on the provided category
      const ruleModule = await import(`../rulesets/${category}.js`);
      //Extract values (exports) from imported ruleModule in RAP-LP
      const values = Object.values(ruleModule);
      if (values.length > 0) {
        return values as any;
      } else {
        //No exports from loaded ruleModule is found for the category
        throw new Error(`inga exporterade typer hittade i modulen för kategori ${category}`);
      }
    } catch (error: any) {
      //Saftey check in case of error when loading module[s]
      throw new Error(`Fel vid importering av regler för kategori ${category}:, category ${error.message}`);
    }
  }
  /**
   *
   * @param categories Defined categoeries to be loaded
   */
  async function importRulesByCategory(categories: string[]) {
    for (const category of categories) {
      const ruleClasses = await importRuleModule(category);
      if (ruleClasses) {
        for (const ruleClass of ruleClasses) {
          if (ruleClass instanceof Function) {
            // Check to see if has constructor function
            ruleTypes.push(ruleClass); // Push the imported ruleClass in RAP-LP to array of ruleTypes
            //Store ruletype for each instance
          }
        }
      }
    }
  }
  async function importAllRules() {
    await importRulesByCategory(ruleModules);
  }
  /**
   * Load modules
   */
  try {
    if (ruleCategories && ruleCategories.length > 0) {
      await importRulesByCategory(ruleCategories);
    } else {
      await importAllRules();
    }
  } catch (e) {
    if (e instanceof Error) {
      throw new RuleCategoryError(e.message);
    }
    throw e;
  }
  /**
   * Loop entries of instanceCategory map
   */

  // Create instances of rule classes in RAP-LP
  ruleTypes.forEach((RuleClass) => {
    try {
      const instance = new RuleClass(context);
      ruleInstances[RuleClass.name] = instance;
      instanceCategoryMap.set(RuleClass.name, RuleClass); // Do we have name of ruleClass ?
    } catch (error: any) {
      console.error('Fel vid skapande av instans för regelklass %s:', RuleClass.name, error.message);
    }
  });
  return { rules: ruleInstances, instanceCategoryMap };
}
