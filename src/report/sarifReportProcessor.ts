// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { createHash } from 'node:crypto';
import * as path from 'node:path';
import { translator } from '../i18n.js';
import { Issue } from '../util/Issue.js';
import { RapLPCustomSpectralDiagnostic } from '../util/RapLPCustomSpectralDiagnostic.js';

const SARIF_EXTENSIONS = ['.sarif', '.json'];

/**
 * Builds a SARIF log from the RAP-LP rule violations, or from the strict
 * validation issues when the run stopped before the rules were evaluated.
 * specUri should be relative to the repository root for code scanning tools.
 */
export function buildSarifLog(
  t: ReturnType<typeof translator>,
  specUri: string,
  toolVersion: string,
  violations: RapLPCustomSpectralDiagnostic[],
  strictIssues: Issue[] = [],
) {
  // region is left out of the JSON output when undefined
  const location = (region?: object) => ({
    physicalLocation: { artifactLocation: { uri: specUri }, region },
  });

  const violationResult = (v: RapLPCustomSpectralDiagnostic) => ({
    ruleId: v.id ?? 'UNKNOWN',
    level: toLevel(v.severity),
    message: { text: withPath(v.requirement ?? v.id ?? 'UNKNOWN', v.path) },
    locations: [location(toRegion(v.range))],
    partialFingerprints: { 'raplpPath/v1': fingerprint(v.id ?? 'UNKNOWN', toJsonPath(v.path)) },
  });

  const strictIssueResult = (issue: Issue) => ({
    ruleId: 'OAS3-STRICT',
    level: 'error',
    message: { text: `${issue.type}: ${issue.message}` },
    locations: [location(issue.line ? { startLine: issue.line } : undefined)],
    partialFingerprints: { 'raplpPath/v1': fingerprint('OAS3-STRICT', `${issue.code ?? issue.type}|${issue.path}`) },
  });

  const results = [...violations.map(violationResult), ...strictIssues.map(strictIssueResult)];

  const rules = [...new Map(violations.map((v) => [v.id ?? 'UNKNOWN', v])).values()].map((v) => {
    const id = v.id ?? 'UNKNOWN';
    return {
      id,
      shortDescription: { text: `RAP-LP: ${id}` },
      helpUri: v.helpUrl,
      help: v.helpUrl ? toHelp(v.helpUrl, t('cli.sarif.designRuleLink', { id })) : undefined,
    };
  });

  if (strictIssues.length > 0) {
    const description = t('cli.sarif.strictRuleDescription');
    rules.push({
      id: 'OAS3-STRICT',
      shortDescription: { text: 'RAP-LP: OAS3-STRICT' },
      helpUri: undefined,
      help: { text: description, markdown: description },
    });
  }

  return {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'RAP-LP',
            version: toolVersion,
            informationUri: 'https://github.com/diggsweden/rest-api-profil-lint-processor',
            rules: rules,
          },
        },
        results: results,
      },
    ],
  };

  /** Spectral positions are 0-based, SARIF positions are 1-based. */
  function toRegion(range: RapLPCustomSpectralDiagnostic['range']) {
    if (!range?.start || !range?.end) return undefined;
    return {
      startLine: range.start.line + 1,
      startColumn: range.start.character + 1,
      endLine: range.end.line + 1,
      endColumn: range.end.character + 1,
    };
  }

  /** SARIF has no hint/info level, so HINT and INFO map to note. */
  function toLevel(severity?: string): 'error' | 'warning' | 'note' {
    if (severity === 'ERROR') return 'error';
    if (severity === 'WARNING') return 'warning';
    return 'note';
  }

  /** Spectral paths are segment arrays; render them as a readable JSONPath-like string. */
  function toJsonPath(segments: unknown): string {
    return Array.isArray(segments) ? segments.join('.') : '';
  }

  function withPath(text: string, segments: unknown): string {
    const jsonPath = toJsonPath(segments);
    return jsonPath ? `${text} (${jsonPath})` : text;
  }

  /** Rule help shown by code scanning: a link to the design rule. */
  function toHelp(helpUrl: string, linkText: string) {
    return { text: helpUrl, markdown: `[${linkText}](${helpUrl})` };
  }

  /** Stable identifier for a finding across runs (rule + JSONPath). */
  function fingerprint(ruleId: string, key: string): string {
    return createHash('sha256').update(`${specUri}|${ruleId}|${key}`).digest('hex');
  }
}

/** A SARIF path must name a file with one of the accepted extensions. */
export function isValidSarifPath(sarifPath: string): boolean {
  const extension = path.extname(sarifPath.trim()).toLowerCase();
  return SARIF_EXTENSIONS.includes(extension);
}
