// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { RuleCategoryError } from "./RapLPBaseApiErrorHandling.js";
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
interface CustomSchema {
  id: string;
  krav: string;
  sokvag: string[];
  allvarlighetsgrad: number;
  omfattning: { start: Record<string, unknown>; end: Record<string, unknown> };
  kategori: string;
  typ: string;
}
/**
 *  Add other rule modules when applying new rules to RAP-LP
 *  Modules are loaded as default ones when no explicit category is choosed from the command line
 */
const ruleModules = [
  'UfnRules',
  'SakRules',
  'VerRules',
  'FnsRules',
  'ArqRules',
  'DokRules',
  'AmeRules',
  'ForRules',
  'DotRules',
  'FelRules',
];
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
  ruleCategories?: string[],
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
  // This file is src/util/ruleUtil.ts -> dist/util/ruleUtil.js after build
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Candidate directories where rules might live (ordered by preference)
  const dirCandidates = [
    // When compiled: dist/util/../rulesets => dist/rulesets
    path.resolve(__dirname, '../rulesets'),
    // When running tests from dist but rules still in src:
    path.resolve(__dirname, '../../src/rulesets'),
    // Fallbacks if code is executed from project root
    path.resolve(process.cwd(), 'dist/rulesets'),
    path.resolve(process.cwd(), 'src/rulesets'),
    path.resolve(process.cwd(), 'rulesets'),
  ];

  // Try JS first (compiled), then TS (source). Also allow mjs/cjs just in case.
  const extCandidates = ['.js', '.mjs', '.cjs', '.ts'];

  // Find the first existing file
  for (const dir of dirCandidates) {
    for (const ext of extCandidates) {
      const candidate = path.join(dir, `${category}${ext}`);
      if (fs.existsSync(candidate)) {
        const url = pathToFileURL(candidate).href;
        const mod = await import(url);
        const values = Object.values(mod);
        if (values.length === 0) {
          throw new Error(`inga exporterade typer hittade i modulen för kategori ${category}`);
        }
        return values as any;
      }
    }
  }

  // Nothing matched → nice error
  const tried = dirCandidates
    .flatMap(d => extCandidates.map(ext => path.relative(process.cwd(), path.join(d, `${category}${ext}`))))
    .join(', ');
  throw new Error(`Fel vid importering av regler för kategori ${category}: kunde inte hitta någon av: ${tried}`);
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
      //Check if we gonna load PrerequisetRules or if it is specified
      if (!ruleCategories.includes('ForRules')) {
        ruleCategories.push('ForRules');
      }
    await importRulesByCategory(ruleCategories);
  } else {
    await importAllRules();
  }
} catch (e) {
  if(e instanceof Error) {
    throw new RuleCategoryError(e.message)
  }
  throw e
} 
  /**
   * Loop entries of instanceCategory map
   */

  // Create instances of rule classes in RAP-LP
  ruleTypes.forEach((RuleClass) => {
    try {
      const instance = new RuleClass();
      ruleInstances[RuleClass.name] = instance;
      instanceCategoryMap.set(RuleClass.name, RuleClass); // Do we have name of ruleClass ?
    } catch (error: any) {
      console.error(`Fel vid skapande av instans för regelklass ${RuleClass.name}:`, error.message);
    }
  });
  return { rules: ruleInstances, instanceCategoryMap };
}
