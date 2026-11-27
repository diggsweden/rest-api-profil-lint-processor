// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { translator } from '../../src/i18n.js';
import { Issue } from '../../src/util/Issue.js';
import { RapLPCustomSpectralDiagnostic } from '../../src/util/RapLPCustomSpectralDiagnostic.js';
import { buildSarifLog, isValidSarifPath } from '../../src/report/sarifReportProcessor.js';

const t = translator('sv');
const specUri = 'specs/api.yaml';

const violation = (overrides: Partial<RapLPCustomSpectralDiagnostic> = {}) =>
  ({
    id: 'UFN.02',
    severity: 'ERROR',
    requirement: 'Krav UFN.02',
    helpUrl: 'https://example.org/ufn02',
    path: ['servers', 0, 'url'],
    range: { start: { line: 19, character: 9 }, end: { line: 19, character: 36 } },
    ...overrides,
  }) as RapLPCustomSpectralDiagnostic;

const strictIssue: Issue = { type: 'Semantic', code: 'unique-id', path: 'paths./a.get', message: 'Duplicate', line: 12 };

/** Builds the SARIF run as it ends up in the written file. */
function buildSarifRun(violations: RapLPCustomSpectralDiagnostic[], strictIssues: Issue[] = [], uri = specUri) {
  const sarifLog = buildSarifLog(t, uri, '2.1.0', violations, strictIssues);
  const writtenFile = JSON.parse(JSON.stringify(sarifLog));
  return writtenFile.runs[0];
}

describe('buildSarifLog', () => {
  it('maps a rule violation to a result with 1-based position and path', () => {
    const [result] = buildSarifRun([violation()]).results;

    expect(result.ruleId).toBe('UFN.02');
    expect(result.level).toBe('error');
    expect(result.message.text).toBe('Krav UFN.02 (servers.0.url)');
    expect(result.locations[0].physicalLocation).toEqual({
      artifactLocation: { uri: specUri },
      region: { startLine: 20, startColumn: 10, endLine: 20, endColumn: 37 },
    });
  });

  it.each([
    ['ERROR', 'error'],
    ['WARNING', 'warning'],
    ['HINT', 'note'],
  ])('maps severity %s to %s', (severity, level) => {
    expect(buildSarifRun([violation({ severity })]).results[0].level).toBe(level);
  });

  it('leaves out region and path when missing', () => {
    const [result] = buildSarifRun([violation({ range: undefined, path: undefined })]).results;

    expect(result.message.text).toBe('Krav UFN.02');
    expect(result.locations[0].physicalLocation).toEqual({ artifactLocation: { uri: specUri } });
  });

  it('lists each rule once with the rule id as title and the link as help', () => {
    const { rules } = buildSarifRun([violation(), violation({ path: ['servers', 1, 'url'] })]).tool.driver;

    expect(rules).toHaveLength(1);
    expect(rules[0].shortDescription.text).toBe('RAP-LP: UFN.02');
    expect(rules[0].help.markdown).toBe(
      `[${t('cli.sarif.designRuleLink', { id: 'UFN.02' })}](https://example.org/ufn02)`,
    );
  });

  it('maps strict issues to a result and an OAS3-STRICT rule', () => {
    const run = buildSarifRun([], [strictIssue]);

    expect(run.results[0].ruleId).toBe('OAS3-STRICT');
    expect(run.results[0].message.text).toBe('Semantic: Duplicate');
    expect(run.results[0].locations[0].physicalLocation.region).toEqual({ startLine: 12 });
    expect(run.tool.driver.rules[0].help.text).toBe(t('cli.sarif.strictRuleDescription'));
  });

  describe('partialFingerprints', () => {
    /** Returns the fingerprint that code scanning uses to recognise the finding between runs. */
    function fingerprintOf(finding: RapLPCustomSpectralDiagnostic, uri = specUri) {
      const [result] = buildSarifRun([finding], [], uri).results;
      return result.partialFingerprints['raplpPath/v1'];
    }

    const original = fingerprintOf(violation());

    it('stays the same when the finding moves to another line', () => {
      const movedFinding = violation({ range: { start: { line: 40, character: 9 }, end: { line: 40, character: 36 } } });

      expect(fingerprintOf(movedFinding)).toBe(original);
    });

    it('changes when the path changes', () => {
      const otherServer = violation({ path: ['servers', 1, 'url'] });

      expect(fingerprintOf(otherServer)).not.toBe(original);
    });

    it('changes when the rule changes', () => {
      const otherRule = violation({ id: 'SAK.01' });

      expect(fingerprintOf(otherRule)).not.toBe(original);
    });

    it('changes when the file changes', () => {
      expect(fingerprintOf(violation(), 'specs/other.yaml')).not.toBe(original);
    });
  });
});

describe('isValidSarifPath', () => {
  it.each(['raplp.sarif', 'raplp.json', 'out/raplp.sarif.json', 'RAPLP.SARIF'])('accepts valid extension %s', (sarifPath) => {
    expect(isValidSarifPath(sarifPath)).toBe(true);
  });

  it.each(['', 'raplp', 'raplp.txt'])('rejects invalid extension "%s"', (sarifPath) => {
    expect(isValidSarifPath(sarifPath)).toBe(false);
  });
});