import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { DiagnosticReport } from './RapLPDiagnostic.js';

type DiagnosticRule = DiagnosticReport['rules'][number];

interface JUnitReportOptions {
  outputFilePath: string;
}

function escapeXml(value: string): string {
  return (
    value
      // Ta bort tecken som inte är tillåtna i XML 1.0.
      .replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu, '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  );
}

export class JUnitReportProcessor {
  constructor(private readonly options: JUnitReportOptions) {}

  async generateReportDocument(reports: readonly DiagnosticReport[]): Promise<void> {
    const rules = reports.flatMap((report) => report.rules);

    for (const rule of rules) {
      if (rule.status !== 'OK' && rule.status !== 'EJ OK' && rule.status !== 'N/A') {
        throw new Error(`Okänd regelstatus för ${rule.id}: ${rule.status}`);
      }
    }

    const passed = rules.filter((rule) => rule.status === 'OK').length;

    const failures = rules.filter((rule) => rule.status === 'EJ OK').length;

    const skipped = rules.filter((rule) => rule.status === 'N/A').length;

    const applicable = passed + failures;

    const compliance = applicable > 0 ? `${((passed / applicable) * 100).toFixed(1)} %` : 'Ej beräkningsbar';

    const suiteName = `RAP-LP – Följsamhet: ${compliance}`;

    const testCases = rules.map((rule) => this.createTestCase(rule, suiteName)).join('\n');

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<testsuites>',
      `  <testsuite name="${escapeXml(suiteName)}" tests="${rules.length}" failures="${failures}" errors="0" skipped="${skipped}">`,
      testCases,
      '  </testsuite>',
      '</testsuites>',
      '',
    ].join('\n');

    await mkdir(dirname(this.options.outputFilePath), {
      recursive: true,
    });

    await writeFile(this.options.outputFilePath, xml, 'utf8');
  }

  private createTestCase(rule: DiagnosticRule, suiteName: string): string {
    const attributes = `classname="${escapeXml(suiteName)}" ` + `name="${escapeXml(`${rule.area} / ${rule.id}`)}"`;

    if (rule.status === 'OK') {
      return `    <testcase ${attributes} />`;
    }

    if (rule.status === 'N/A') {
      return [
        `    <testcase ${attributes}>`,
        '      <skipped message="Regeln är inte tillämplig" />',
        '    </testcase>',
      ].join('\n');
    }

    const details = [rule.requirement, rule.helpUrl].filter(Boolean).join('\n\n') || 'Regeln är inte godkänd.';

    return [
      `    <testcase ${attributes}>`,
      `      <failure message="${escapeXml(`${rule.id}: EJ OK`)}">`,
      escapeXml(details),
      '      </failure>',
      '    </testcase>',
    ].join('\n');
  }
}
