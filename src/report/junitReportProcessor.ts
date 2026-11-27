// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { DiagnosticReport } from '../util/RapLPDiagnostic.js';
import { Locale, translator } from '../i18n.js';

type DiagnosticRule = DiagnosticReport['rules'][number];

interface JUnitReportOptions {
  outputFilePath: string;
  inputFilePath: string;
  locale: Locale;
}

function getJUnitFilePath(inputFile, repoRoot) {
  const relativePath = path.relative(repoRoot, path.resolve(inputFile));

  if (
    !relativePath ||
    relativePath === '..' ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    return undefined;
  }

  return relativePath.split(path.sep).join('/');
}

function escapeXml(value: string): string {
  return value
    .replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export class junitReportProcessor {
  constructor(private readonly options: JUnitReportOptions) {}

  async generateReportDocument(reports: readonly DiagnosticReport[]): Promise<void> {
    const rules = reports.flatMap((report) => report.rules);
    const t = translator(this.options.locale);
    
    for (const rule of rules) {
      if (rule.status !== t("common.ruleStatus.ok") && rule.status !== t("common.ruleStatus.notOk") && rule.status !== t("common.ruleStatus.notApplicable")) {
        throw new Error(`${t("cli.junit.unknownRulestatus")} ${rule.id}: ${rule.status}`);
      }
    }

    const passed = rules.filter((rule) => rule.status === t("common.ruleStatus.ok")).length;

    const failures = rules.filter((rule) => rule.status === t("common.ruleStatus.notOk")).length;

    const skipped = rules.filter((rule) => rule.status === t("common.ruleStatus.notApplicable")).length;

    const applicable = passed + failures;

    const compliance = applicable > 0 ? `${((passed / applicable) * 100).toFixed(1)} %` : t('cli.junit.notCalculable');

    const suiteName = `${t("cli.junit.compliance")} ${compliance}`;

    const testCases = rules.map((rule) => this.createTestCase(rule)).join('\n');

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<testsuites>',
      `  <testsuite name="${escapeXml(suiteName)}" tests="${rules.length}" failures="${failures}" errors="0" skipped="${skipped}">`,
      testCases,
      '  </testsuite>',
      '</testsuites>',
      '',
    ].join('\n');

    await mkdir(path.dirname(this.options.outputFilePath), {
      recursive: true,
    });

    await writeFile(this.options.outputFilePath, xml, 'utf8');
  }

  private createTestCase(rule: DiagnosticRule): string {
    const t = translator(this.options.locale);
    const specPath = getJUnitFilePath(this.options.inputFilePath, process.env.CI_PROJECT_DIR ?? process.cwd());

    const testCaseAttributes = [`classname="${escapeXml(rule.area)}"`, `name="${escapeXml(rule.id)}"`];

    if (specPath !== undefined) {
      testCaseAttributes.push(`file="${escapeXml(specPath)}"`);
    }

    const attributes = testCaseAttributes.join(' ');
    if (rule.status === t("common.ruleStatus.ok")) {
      return `    <testcase ${attributes} />`;
    }

    if (rule.status === t("common.ruleStatus.notApplicable")) {
      return [
        `    <testcase ${attributes}>`,
        `      <skipped message="${t('cli.junit.notApplicable')}" />`,
        '    </testcase>',
      ].join('\n');
    }

    const details = [rule.requirement, rule.helpUrl].filter(Boolean).join('\n\n') || t("cli.junit.ruleNotOk");

    return [
      `    <testcase ${attributes}>`,
      `      <failure message="${escapeXml(`${rule.id}: ${t("common.ruleStatus.notOk")}`)}">`,
      escapeXml(details),
      '      </failure>',
      '    </testcase>',
    ].join('\n');
  }
}
