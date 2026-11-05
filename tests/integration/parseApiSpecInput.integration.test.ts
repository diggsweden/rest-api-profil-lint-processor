// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { execFile } from 'child_process';
import { promisify } from 'util';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'node:url';
import path from 'path';
import fs from 'fs';

const execFileP = promisify(execFile);

// Timeout för integrationstest som spawn:ar node
jest.setTimeout(20000);

const runnerPath = fileURLToPath(
  new URL('./validateRunner.mjs', import.meta.url),
);

function nodeArgsForRunner(): string[] {
  return [runnerPath];
}

async function runRunnerWithInput(input: any) {
  const args = nodeArgsForRunner();
  // kör node runner + json-argument
  const { stdout, stderr } = await execFileP('node', [...args, JSON.stringify(input)], { timeout: 15000 });

  // Om runner skrev på stderr (serialiserar fel som JSON ), och försök tolka det också
  if (stderr && stderr.trim()) {
    try {
      const errObj = JSON.parse(stderr.trim());
      return { ok: false, payload: errObj };
    } catch {
      // icke-json stderr — returnera som text
      return { ok: false, payload: { message: stderr.trim() } };
    }
  }
  // Tolka stdout (förväntat JSON)
  if (!stdout || !stdout.trim()) {
    throw new Error(`Runner returned no stdout. Stderr: ${stderr}`);
  }

  const out = JSON.parse(stdout.trim());
  return { ok: true, payload: out };
}

describe('Integration: parseApiSpecInput via runner produces some output', () => {
  beforeAll(() => {
    // kontrollera att runner finns
    if (!fs.existsSync(runnerPath)) {
      throw new Error(`Integration runner saknas: ${runnerPath}`);
    }
  });

  it('Happy path: Returns parse result for minimal openapi yaml', async () => {
    const input = { raw: 'openapi: 3.0.0\ninfo:\n  title: t\npaths: {}', strict: false };
    const { ok, payload } = await runRunnerWithInput(input);
    expect(ok).toBe(true);
    expect(payload).toHaveProperty('result');
    const res = payload.result;
    expect(res).toHaveProperty('format');
    expect(['json', 'yaml']).toContain(res.format);
    expect(res).toHaveProperty('parsed');

    // parsed är objekt med openapi key
    expect(res.parsed && res.parsed.openapi).toBeDefined();
  });

  it('strict mode: collects structural issues for invalid spec', async () => {
    // Create a spec that should produce a structural error (t.ex. response with no correct scheme)
    const badYaml = `
openapi: 3.0.0
info:
  title: bad
paths:
  /pets:
    get:
      responses:
        '200': {}
`;
    const input = { raw: badYaml, strict: true };
    const { ok, payload } = await runRunnerWithInput(input);
    // runner can return ok:true with result containing strictIssues (or ok:false on error)
    if (!ok) {
      // if runner returned error-object via stderr - fail test with info
      throw new Error(`Runner failed: ${JSON.stringify(payload)}`);
    }
    // const res = payload.result;
    // strictIssues can be undefined or an array depending on the implementation; we expect at least the execution to succeed
    // expect(res).toHaveProperty('strictIssues');
    // If strictIssues exists, check that it is an array or undefined
    // if (Array.isArray(res.strictIssues)) {
    //   expect(res.strictIssues.length).toBeGreaterThanOrEqual(0);
    // }
    const strictIssues = extractIssuesFromResult(payload);
    expect(strictIssues.length).toBeGreaterThan(0);
    expect(strictIssues.some((i: any) => i.code === 'oas3-schema')).toBe(true);
  });
});
describe('Integration: parseApiSpecInput via runner', () => {
  beforeAll(() => {
    // kontrollera att runner finns
    if (!fs.existsSync(runnerPath)) {
      throw new Error(
        `Integration runner saknas: ${runnerPath}`,
      );
    }
  });
  //     it('detects structural and semantic issues for intentional broken YAML', async() => {
  //     // BAD yaml - contains structural and semantic errors
  //     const badYaml = `openapi: 3.0.0
  // info:
  //   title: bad
  // paths:
  //   /pets:
  //     get:
  //       responses:
  //         '200': {}
  // `;
  //       //Run runner in strict mode
  //       const {ok,payload} = await runRunnerWithInput( {raw: badYaml, strict: true} );
  //       expect(ok).toBe(true);

  //       //Sanity checks first
  //       const issues = extractIssuesFromResult(payload);
  //       expect(Array.isArray(issues)).toBe(true);
  //       expect(issues.length).toBeGreaterThanOrEqual(1);

  //       //console.log('ISSUES:', JSON.stringify(issues, null, 2));

  //       //Define issue to to partial matching
  //       const expected = [
  //         {
  //           type: 'Semantic',      // spectral usually produces semantic
  //           path: 'info',
  //           line: 2,               // 1-baserad rad som Spectral/pretty brukar rapportera
  //           messageContains: 'version', // spectral säger "must have required property "version""
  //         },
  //         {
  //           type: 'Semantic',
  //           path: 'paths./pets.get.responses.200',
  //           line: 8,
  //           messageContains: 'description',
  //         }
  //       ];

  //       //Check that every expected issue matches actual issue
  //       for (const exp of expected) {
  //         const found = issues.some((a: any) => issueMatches(a,exp));
  //         expect(found).toBe(true);
  //       }

  //       //Extra check that there is structural parser issues in actual issue array as well
  //       const hasStructural = issues.some((i: any) =>
  //         Array.isArray(i.details) &&
  //         i.details.some(d => d.toLowerCase().includes('structural'))
  //       );
  //       expect(hasStructural).toBe(true);
  //     });

  it('detects structural and semantic issues for intentional broken YAML', async () => {
    // BAD yaml - structural errors (info.version, response.description) and one semantic error
    // (path parameter {petId} is not declared). The semantic path is appended last so
    // the line numbers of the structural issues above do not change.
    const badYaml = `openapi: 3.0.0
info:
  title: bad
paths:
  /pets:
    get:
      responses:
        '200': {}
  /pets/{petId}:
    get:
      responses:
        '200':
          description: OK
`;
    const { ok, payload } = await runRunnerWithInput({ raw: badYaml, strict: true });
    expect(ok).toBe(true);

    const issues = extractIssuesFromResult(payload);
    expect(Array.isArray(issues)).toBe(true);
    expect(issues.length).toBeGreaterThanOrEqual(1);

    // Strict mode is Spectral-only: schema errors (oas3-schema) are Structural, the rest Semantic.
    const expected = [
      { type: 'Structural', code: 'oas3-schema', path: 'info', line: 2, messageContains: 'version' },
      {
        type: 'Structural',
        code: 'oas3-schema',
        path: 'paths./pets.get.responses.200',
        line: 8,
        messageContains: 'description',
      },
      { type: 'Semantic', code: 'path-params', path: 'paths./pets/{petId}.get', messageContains: 'petId' },
    ];

    for (const exp of expected) {
      const found = issues.some((a: any) => issueMatches(a, exp));
      if (!found) console.log('MISSING:', JSON.stringify(exp), 'ACTUAL:', JSON.stringify(issues));
      expect(found).toBe(true);
    }
  });
});

describe('Integration: OpenAPI 3.2 via runner', () => {
  const fixtureDir = path.join(__dirname, '..', 'fixtures', 'openapi-3.2');
  const readFixture = (name: string) => fs.readFileSync(path.join(fixtureDir, name), 'utf8');

  it.each(['01-minimal.yaml', '02-query-metod.yaml', '03-querystring.yaml', '04-taggar.yaml', '05-streaming.yaml'])(
    'strict mode: valid 3.2 document %s gives no issues',
    async (name) => {
      const { ok, payload } = await runRunnerWithInput({ raw: readFixture(name), strict: true });
      expect(ok).toBe(true);
      expect(extractIssuesFromResult(payload)).toEqual([]);
    },
  );

  it('strict mode: invalid 3.2 document is validated against the 3.2 schema', async () => {
    const { ok, payload } = await runRunnerWithInput({ raw: readFixture('invalid-01.yaml'), strict: true });
    expect(ok).toBe(true);
    const issues = extractIssuesFromResult(payload);
    // "parent must be string" proves the 3.2 schema is used. The 3.0 schema would say "not expected here".
    expect(
      issues.some(
        (i: any) => i.code === 'oas3-schema' && i.path === 'tags.0.parent' && String(i.message).includes('string'),
      ),
    ).toBe(true);
  });

  it('strict mode: querystring parameter must use content', async () => {
    const { ok, payload } = await runRunnerWithInput({ raw: readFixture('invalid-02-querystring.yaml'), strict: true });
    expect(ok).toBe(true);
    // 3.2-schemat kräver "content". Med 3.0-schemat hade felet i stället handlat om otillåtet värde på "in".
    expect(
      extractIssuesFromResult(payload).some(
        (i: any) => i.code === 'oas3-schema' && String(i.message).includes('content'),
      ),
    ).toBe(true);
  });
});
/**
 * Helper function to extract array with issues from payload result.
 * 
 * @param runnerPayload 
 * @returns array with issues or empty[]
 */
function extractIssuesFromResult(runnerPayload: any): any[] {

  if (!runnerPayload || !runnerPayload.result) return [];
    const result = runnerPayload.result;
  if (Array.isArray(result.strictIssues)) return result.strictIssues;

  return [];
}
function issueMatches(actual: any, expected: any) {
  if (!actual) return false;
  if (expected.type && String(actual.type).toLowerCase() !== String(expected.type).toLowerCase()) return false;
  if (expected.path && actual.path !== expected.path) return false;
  if (typeof expected.line === 'number' && actual.line !== expected.line) return false;
  if (expected.code && actual.code !== expected.code) return false;
  if (expected.messageContains && (!actual.message || !String(actual.message).toLowerCase().includes(String(expected.messageContains).toLowerCase()))) return false;
  return true;
}
