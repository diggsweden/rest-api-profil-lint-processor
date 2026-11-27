// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { execFile } from 'child_process';
import { promisify } from 'util';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'node:url';
import path from 'path';
import fs from 'fs';
import os from 'os';

const execFileP = promisify(execFile);

jest.setTimeout(20000);

const runnerPath = fileURLToPath(new URL('./validateRunner.mjs', import.meta.url));

// Spec files are written to a temp directory in beforeAll, so no fixture files are needed in the repo.
let tmpDir: string;
let validSpec: string;
let brokenSpec: string;
let httpSpec: string;
let nestedHttpSpec: string;

const specWithRef = (ref: string) => `openapi: 3.0.3
info:
  title: External refs
  version: 1.0.0
paths:
  /pets:
    get:
      operationId: listPets
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '${ref}'
`;

const petSchema = (type: string) => `type: object
properties:
  name:
    type: ${type}
`;

const EXTERNAL_REFS_NOT_ALLOWED = 'Externa $ref-referenser är ej tillåtna';
const SCHEME_NOT_ALLOWED = 'Endast lokala filreferenser och https-referenser är tillåtna';
const HTTP_REF = 'http://127.0.0.1:9/pet.yaml';

/**
 * Runs parseApiSpecInput in a separate node process. The process runs from the repo root,
 * not from the temp directory with the specs, so relative refs must be resolved against the spec file.
 */
async function run(input: Record<string, unknown>): Promise<{ ok: boolean; payload: any }> {
  try {
    const { stdout } = await execFileP('node', [runnerPath, JSON.stringify(input)], { timeout: 15000 });
    return { ok: true, payload: JSON.parse(stdout.trim()) };
  } catch (err: any) {
    // The runner exits with code 2 and writes the error as JSON to stderr
    const stderr = String(err?.stderr ?? '').trim();
    try {
      return { ok: false, payload: JSON.parse(stderr) };
    } catch {
      return { ok: false, payload: { message: stderr || String(err) } };
    }
  }
}

function strictIssues(payload: any): any[] {
  const issues = payload?.result?.strictIssues;
  return Array.isArray(issues) ? issues : [];
}

function hasEnoent(issues: any[]): boolean {
  return issues.some((i) => /ENOENT|Error opening file/i.test(String(i?.message ?? '')));
}

describe('Integration: external $refs', () => {
  beforeAll(() => {
    if (!fs.existsSync(runnerPath)) throw new Error(`Integration runner saknas: ${runnerPath}`);

    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'raplp-external-refs-'));
    fs.mkdirSync(path.join(tmpDir, 'schemas'));
    fs.writeFileSync(path.join(tmpDir, 'schemas', 'pet.yaml'), petSchema('string'));
    fs.writeFileSync(path.join(tmpDir, 'schemas', 'broken-pet.yaml'), petSchema('strng'));

    validSpec = path.join(tmpDir, 'api.yaml');
    brokenSpec = path.join(tmpDir, 'api-broken.yaml');
    fs.writeFileSync(validSpec, specWithRef('./schemas/pet.yaml'));
    fs.writeFileSync(brokenSpec, specWithRef('./schemas/broken-pet.yaml'));

    // http ref directly in the main file
    httpSpec = path.join(tmpDir, 'api-http.yaml');
    fs.writeFileSync(httpSpec, specWithRef(HTTP_REF));

    // http ref hidden inside an external file
    fs.writeFileSync(
      path.join(tmpDir, 'schemas', 'pet-with-http.yaml'),
      `type: object\nproperties:\n  owner:\n    $ref: '${HTTP_REF}'\n`,
    );
    nestedHttpSpec = path.join(tmpDir, 'api-nested-http.yaml');
    fs.writeFileSync(nestedHttpSpec, specWithRef('./schemas/pet-with-http.yaml'));
  });

  afterAll(() => {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('rejects external refs in file input when allowExternalRefs is not set', async () => {
    const { ok, payload } = await run({ filePath: validSpec, strict: true });
    expect(ok).toBe(false);
    expect(payload.message).toContain(EXTERNAL_REFS_NOT_ALLOWED);
  });

  it('rejects external refs in raw input (API mode) even when allowExternalRefs is set', async () => {
    const raw = fs.readFileSync(validSpec, 'utf8');
    const { ok, payload } = await run({ raw, strict: true, allowExternalRefs: true });
    expect(ok).toBe(false);
    expect(payload.message).toContain(EXTERNAL_REFS_NOT_ALLOWED);
  });

  it('resolves relative refs against the spec file in strict mode, not the working directory', async () => {
    const { ok, payload } = await run({ filePath: validSpec, strict: true, allowExternalRefs: true });
    expect(ok).toBe(true);
    expect(hasEnoent(strictIssues(payload))).toBe(false);
  });

  it('reports structural errors inside an external file in strict mode', async () => {
    // schemas/broken-pet.yaml contains "type: strng"
    const { ok, payload } = await run({ filePath: brokenSpec, strict: true, allowExternalRefs: true });
    expect(ok).toBe(true);
    const issues = strictIssues(payload);
    expect(hasEnoent(issues)).toBe(false);
    expect(issues.length).toBeGreaterThanOrEqual(1);
  });

  it('rejects http refs in the main file even when allowExternalRefs is set', async () => {
    const { ok, payload } = await run({ filePath: httpSpec, strict: true, allowExternalRefs: true });
    expect(ok).toBe(false);
    expect(payload.message).toContain(SCHEME_NOT_ALLOWED);
  });

  it('does not resolve http refs inside an external file', async () => {
    const { ok, payload } = await run({ filePath: nestedHttpSpec, strict: true, allowExternalRefs: true });
    expect(ok).toBe(true);
    // The http ref must show up as an unresolvable ref, not be fetched silently
    const issues = strictIssues(payload);
    expect(issues.some((i) => /http/i.test(String(i?.message ?? '')))).toBe(true);
  });
});
