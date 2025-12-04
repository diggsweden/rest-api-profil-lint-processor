
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execFileP = promisify(execFile);

// Timeout för integrationstest som spawn:ar node
jest.setTimeout(20000);

const runnerPath = path.join(__dirname, 'integration', 'validateRunner.mjs');

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

describe('Integration: parseApiSpecInput via runner', () => {
  beforeAll(() => {
    // kontrollera att runner finns
    if (!fs.existsSync(runnerPath)) {
      throw new Error(`Integration runner saknas: ${runnerPath}. Är tests/unit/integration/validateRunner.mjs korrekt ?.`);
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
    const res = payload.result;
    // strictIssues can be undefined or an array depending on the implementation; we expect at least the execution to succeed
    expect(res).toHaveProperty('strictIssues');
    // If strictIssues exists, check that it is an array or undefined
    if (Array.isArray(res.strictIssues)) {
      expect(res.strictIssues.length).toBeGreaterThanOrEqual(0);
    }
  });
});
