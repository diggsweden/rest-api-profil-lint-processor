// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2


import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { junitReportProcessor } from '../../src/report/junitReportProcessor.js';
import type { DiagnosticReport } from '../../src/util/RapLPDiagnostic.js';

type DiagnosticRule = DiagnosticReport['rules'][number];

function rule(overrides: Partial<DiagnosticRule> = {}): DiagnosticRule {
  return {
    id: 'DOK.01',
    area: 'Dokumentation',
    status: 'OK',
    ...overrides,
  } as DiagnosticRule;
}

function report(...rules: DiagnosticRule[]): DiagnosticReport {
  return { rules } as DiagnosticReport;
}

describe('junitReportProcessor', () => {
  const repoRoot = process.env.CI_PROJECT_DIR ?? process.cwd();
  const inputFilePath = path.join(repoRoot, 'specs', 'openapi.yaml');

  let tempDirectory: string;
  let outputFilePath: string;

  beforeEach(async () => {
    tempDirectory = await mkdtemp(path.join(tmpdir(), 'rap-lp-junit-'));
    outputFilePath = path.join(tempDirectory, 'reports', 'junit.xml');
  });

  afterEach(async () => {
    await rm(tempDirectory, { recursive: true, force: true });
  });

  async function generateXml(
    reports: readonly DiagnosticReport[],
    specPath = inputFilePath,
  ): Promise<string> {
    const processor = new junitReportProcessor({
      inputFilePath: specPath,
      outputFilePath,
    });

    await processor.generateReportDocument(reports);
    return readFile(outputFilePath, 'utf8');
  }

  it('combines multiple reports and calculates compliance for applicable rules', async () => {
    const xml = await generateXml([
      report(
        rule(),
        rule({
          id: 'DOK.02',
          status: 'EJ OK',
          requirement: 'Beskrivning krävs',
          helpUrl: 'https://example.org/rules/dok02',
        }),
      ),
      report(
        rule({ id: 'DOK.03', status: 'N/A' }),
        rule({ id: 'DOK.04' }),
      ),
    ]);

    expect(xml).toContain('Följsamhet: 66.7 %');
    expect(xml).toContain('tests="4" failures="1" errors="0" skipped="1"');
    expect(xml.match(/<testcase\b/g)).toHaveLength(4);
    expect(xml).toContain(
      '<testcase classname="Dokumentation" name="DOK.01" file="specs/openapi.yaml" />',
    );
    expect(xml).toContain('<failure message="DOK.02: EJ OK">');
    expect(xml).toContain('Beskrivning krävs\n\nhttps://example.org/rules/dok02');
    expect(xml).toContain('<skipped message="Regeln är inte tillämplig" />');
  });

  it('indicates that compliance cannot be calculated when all rules are N/A', async () => {
    const xml = await generateXml([report(rule({ status: 'N/A' }))]);

    expect(xml).toContain('Följsamhet: Ej beräkningsbar');
    expect(xml).toContain('tests="1" failures="0" errors="0" skipped="1"');
  });

  it('rejects an unknown rule status before writing the report file', async () => {
    const invalidRule = rule({
      status: 'OKÄND' as DiagnosticRule['status'],
    });

    await expect(generateXml([report(invalidRule)]))
      .rejects.toThrow('Okänd regelstatus för DOK.01: OKÄND');

    await expect(readFile(outputFilePath, 'utf8'))
      .rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('omits the file attribute when the OpenAPI file is outside the project root', async () => {
    const externalSpec = path.resolve(repoRoot, '..', 'extern-openapi.yaml');
    const xml = await generateXml([report(rule())], externalSpec);

    expect(xml).toContain('<testcase classname="Dokumentation" name="DOK.01" />');
  });

  it('escapes XML special characters in attributes and failure text', async () => {
    const xml = await generateXml(
      [
        report(
          rule({
            id: 'DOK".01',
            area: 'API & dokumentation',
            status: 'EJ OK',
            requirement: 'Ange <title> & beskrivning',
          }),
        ),
      ],
      path.join(repoRoot, 'specs', 'a&b.yaml'),
    );

    expect(xml).toContain('classname="API &amp; dokumentation"');
    expect(xml).toContain('name="DOK&quot;.01"');
    expect(xml).toContain('file="specs/a&amp;b.yaml"');
    expect(xml).toContain('<failure message="DOK&quot;.01: EJ OK">');
    expect(xml).toContain('Ange &lt;title&gt; &amp; beskrivning');
  });
});