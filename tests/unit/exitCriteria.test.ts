// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { calculateCompliance, findUnmetCriteria } from '../../src/util/exitCriteria.js';
import { RapLPCustomSpectralDiagnostic } from '../../src/util/RapLPCustomSpectralDiagnostic.js';

const violations = [
  { id: 'SAK.16', severity: 'ERROR' },
  { id: 'DOK.1', severity: 'WARNING' },
  { id: 'SAK.16', severity: 'ERROR' },
] as RapLPCustomSpectralDiagnostic[];

const outcome = { passed: 8, failed: 2 };

describe('calculateCompliance', () => {
  it('räknar andelen uppfyllda regler som heltal', () => {
    expect(calculateCompliance({ passed: 3, failed: 1 })).toBe(75);
  });

  it('avrundar nedåt så att tröskeln inte nås genom avrundning', () => {
    expect(calculateCompliance({ passed: 199, failed: 1 })).toBe(99);
    expect(calculateCompliance({ passed: 2, failed: 1 })).toBe(66);
  });

  it('ger 100 när inga regler verkställts', () => {
    expect(calculateCompliance({ passed: 0, failed: 0 })).toBe(100);
  });
});

describe('findUnmetCriteria', () => {
  it('returnerar inget när inga kriterier är aktiverade', () => {
    expect(findUnmetCriteria(violations, outcome, {})).toEqual([]);
  });

  it('failOnError tar bara med SKA-krav, utan dubbletter', () => {
    expect(findUnmetCriteria(violations, outcome, { failOnError: true })).toEqual([
      { flag: 'failOnError', ruleIds: ['SAK.16'] },
    ]);
  });

  it('failOnWarning tar med både SKA- och BÖR-krav', () => {
    expect(findUnmetCriteria(violations, outcome, { failOnWarning: true })).toEqual([
      { flag: 'failOnWarning', ruleIds: ['DOK.1', 'SAK.16'] },
    ]);
  });

  it('failOnError är uppfyllt när det bara finns BÖR-brott', () => {
    const onlyWarnings = [{ id: 'DOK.1', severity: 'WARNING' }] as RapLPCustomSpectralDiagnostic[];
    expect(findUnmetCriteria(onlyWarnings, outcome, { failOnError: true })).toEqual([]);
  });

  it('minCompliance är uppfyllt när graden når tröskeln', () => {
    expect(findUnmetCriteria(violations, outcome, { minCompliance: 80 })).toEqual([]);
  });

  it('minCompliance är inte uppfyllt när graden understiger tröskeln', () => {
    expect(findUnmetCriteria(violations, outcome, { minCompliance: 81 })).toEqual([
      { flag: 'minCompliance', compliance: 80, threshold: 81 },
    ]);
  });
});
