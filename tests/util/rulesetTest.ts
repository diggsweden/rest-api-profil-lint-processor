// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

'use strict';
/**
 * Usage: Import the ruleClasses that should be loaded in able to run testcases
 */
import * as UfnRules from '../../rulesets/UfnRules.ts';
import * as SakRules from '../../rulesets/SakRules.ts';
import * as VerRules from '../../rulesets/VerRules.ts';
import * as FnsRules from '../../rulesets/FnsRules.ts';
import * as ArqRules from '../../rulesets/ArqRules.ts';
import * as DokRules from '../../rulesets/DokRules.ts';
import * as AmeRules from '../../rulesets/AmeRules.ts';
import * as ForRules from '../../rulesets/ForRules.ts';
import * as DotRules from '../../rulesets/DotRules.ts';
import * as FelRules from '../../rulesets/FelRules.ts';

const ruleInstances: Record<string, any> = {};

/**
 * Define each rule class to create instance of
 */
const ruleTypes = [
  ForRules.For02,
  AmeRules.Ame01,
  AmeRules.Ame02,
  AmeRules.Ame07,
  AmeRules.Ame05,
  AmeRules.Ame04,
  ArqRules.Arq01,
  ArqRules.Arq03,
  ArqRules.Arq05ComplexStructure,
  ArqRules.Arq05NestedStructure,
  ArqRules.Arq05StringBinary,
  UfnRules.Ufn01,
  UfnRules.Ufn02,
  UfnRules.Ufn05Servers,
  UfnRules.Ufn05paths,
  UfnRules.Ufn07,
  UfnRules.Ufn08,
  UfnRules.Ufn09Path,
  UfnRules.Ufn09Server,
  UfnRules.Ufn09InPathParameters,
  SakRules.Sak09,
  SakRules.Sak10,
  SakRules.Sak15,
  SakRules.Sak16,
  SakRules.Sak18,
  VerRules.Ver05,
  VerRules.Ver06,
  FnsRules.Fns01,
  FnsRules.Fns03,
  FnsRules.Fns05,
  FnsRules.Fns09,
  FnsRules.Fns07,
  FnsRules.Fns06,
  DokRules.Dok20,
  DokRules.Dok07,
  FelRules.Fel01,
  FelRules.Fel02,
  FnsRules.Fns08,
  DotRules.Dot02,
  DokRules.Dok15Get,
  DokRules.Dok15ReqBody,
  DotRules.Dot04,
  DokRules.Dok19,
  DokRules.Dok01,
  DokRules.Dok17,
  DokRules.Dok03Info,
  DokRules.Dok03ContactName,
  DokRules.Dok03ContactEmail,
  DokRules.Dok03ContactUrl,
  DokRules.Dok03Contact,
  DokRules.Dok03License,
  DokRules.Dok03LicenseName,
  DokRules.Dok03LicenseUrl,
];
ruleTypes.forEach((RuleClass) => {
  const instance = new RuleClass();
  ruleInstances[RuleClass.name] = instance;
});

export default {
  // Usage outside
  rules: ruleInstances,
};
