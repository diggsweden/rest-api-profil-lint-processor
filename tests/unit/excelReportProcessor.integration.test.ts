// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import os from 'os';
import AdmZip from 'adm-zip';

const execFileP = promisify(execFile);

jest.setTimeout(20000);

const runnerPath = path.join(__dirname, 'integration', 'excelRunner.mjs');
const documentDir = path.resolve(__dirname, '../../document');
const TEMPLATE_2_0_0 = path.join(documentDir, 'Avstaemning_REST_API_profil_v_2_0_0_0.xlsx');
const TEMPLATE_1_2_0 = path.join(documentDir, 'Avstaemning_REST_API_profil_v_1_2_0_0.xlsx');
const DATA_SHEET_NAME = 'Kravlista REST API profil';

type RunnerInput = { outputFilePath: string; ok?: string[]; nok?: string[]; na?: string[] };

async function runRunnerWithInput(input: RunnerInput) {
  try {
    const { stdout } = await execFileP('node', [runnerPath, JSON.stringify(input)], { timeout: 15000 });
    return { ok: true, payload: JSON.parse(stdout.trim()) };
  } catch (err: any) {
    try {
      return { ok: false, payload: JSON.parse(String(err.stderr).trim()) };
    } catch {
      return { ok: false, payload: { message: String(err.stderr ?? err.message).trim() } };
    }
  }
}

function loadSheet(file: string) {
  const zip = new AdmZip(file);
  const sharedStrings = [...zip.readAsText('xl/sharedStrings.xml').matchAll(/<si>(.*?)<\/si>/gs)].map((m) =>
    m[1].replace(/<[^>]+>/g, ''),
  );
  const workbook = zip.readAsText('xl/workbook.xml');
  const rId = new RegExp(`<sheet name="${DATA_SHEET_NAME}"[^>]*r:id="(\\w+)"`).exec(workbook)![1];
  const relationship = [...zip.readAsText('xl/_rels/workbook.xml.rels').matchAll(/<Relationship [^>]*>/g)]
    .map((m) => m[0])
    .find((r) => r.includes(`Id="${rId}"`))!;
  const sheetPath = 'xl/' + /Target="([^"]+)"/.exec(relationship)![1].replace(/^\/?xl\//, '');
  return { zip, sharedStrings, sheetPath, xml: zip.readAsText(sheetPath) };
}

function cellMatch(xml: string, ref: string) {
  return new RegExp(`<c r="${ref}"([^>]*?)(?:/>|>(.*?)</c>)`).exec(xml);
}

function cellValue(file: string, ref: string): string | undefined {
  const { sharedStrings, xml } = loadSheet(file);
  const match = cellMatch(xml, ref);
  if (!match) return undefined;
  const [, attributes, content = ''] = match;
  const value = /<v>(.*?)<\/v>/.exec(content)?.[1];
  if (/t="s"/.test(attributes)) return sharedStrings[Number(value)];
  if (/t="inlineStr"/.test(attributes)) return /<t[^>]*>(.*?)<\/t>/.exec(content)?.[1];
  return value ?? '';
}

function rowOf(file: string, rule: string): number {
  const { xml } = loadSheet(file);
  const row = [...xml.matchAll(/<row r="(\d+)"/g)]
    .map((m) => Number(m[1]))
    .find((r) => cellValue(file, `B${r}`) === rule);
  if (row == null) throw new Error(`Regel ${rule} saknas i ${file}`);
  return row;
}

function replaceCell(file: string, ref: string, replacement: (attributes: string) => string) {
  const { zip, sheetPath, xml } = loadSheet(file);
  const match = cellMatch(xml, ref);
  if (!match) throw new Error(`Cell ${ref} saknas i ${file}`);
  zip.updateFile(sheetPath, Buffer.from(xml.replace(match[0], replacement(match[1]))));
  zip.writeZip(file);
}

function setInProgress(file: string, rule: string) {
  const index = loadSheet(file).sharedStrings.indexOf('Pågående');
  const row = rowOf(file, rule);
  replaceCell(
    file,
    `E${row}`,
    (attributes) => `<c r="E${row}"${attributes.replace(/ t="[^"]*"/, '')} t="s"><v>${index}</v></c>`,
  );
}

describe('Integration: ExcelReportProcessor via runner', () => {
  let tmpDir: string;
  let fileCount = 0;

  const newFile = (template?: string) => {
    const file = path.join(tmpDir, `avstamning_${++fileCount}.xlsx`);
    if (template) fs.copyFileSync(template, file);
    return file;
  };

  beforeAll(() => {
    if (!fs.existsSync(runnerPath)) {
      throw new Error(`Integration runner saknas: ${runnerPath}. Är tests/unit/integration/excelRunner.mjs korrekt ?.`);
    }
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'raplp-excel-'));
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates a new file from the template with status per rule', async () => {
    const file = newFile();
    const { ok, payload } = await runRunnerWithInput({
      outputFilePath: file,
      ok: ['DOK.01'],
      nok: ['DOK.02'],
      na: ['DOK.03'],
    });

    expect(ok).toBe(true);
    expect(payload.result.isBasedOnExistingFile).toBe(false);
    expect(payload.result.missingRules).toEqual([]);
    expect(cellValue(file, `E${rowOf(file, 'DOK.01')}`)).toBe('OK');
    expect(cellValue(file, `E${rowOf(file, 'DOK.02')}`)).toBe('NOK');
    expect(cellValue(file, `E${rowOf(file, 'DOK.03')}`)).toBe('N/A');
    expect(cellValue(file, `E${rowOf(file, 'DOK.04')}`)).toBe('-');
  });

  it('keeps "Pågående" until the rule is validated OK', async () => {
    const file = newFile(TEMPLATE_2_0_0);
    setInProgress(file, 'DOK.01');
    setInProgress(file, 'DOK.02');

    const { ok, payload } = await runRunnerWithInput({ outputFilePath: file, ok: ['DOK.02'], nok: ['DOK.01'] });

    expect(ok).toBe(true);
    expect(payload.result.isBasedOnExistingFile).toBe(true);
    expect(payload.result.keptInProgressRules).toEqual(['DOK.01']);
    expect(payload.result.resolvedInProgressRules).toEqual(['DOK.02']);
    expect(cellValue(file, `E${rowOf(file, 'DOK.01')}`)).toBe('Pågående');
    expect(cellValue(file, `E${rowOf(file, 'DOK.02')}`)).toBe('OK');
  });

  it('preserves user comments in an existing file', async () => {
    const file = newFile(TEMPLATE_2_0_0);
    const row = rowOf(file, 'DOK.01');
    replaceCell(file, `F${row}`, () => `<c r="F${row}" t="inlineStr"><is><t>Min kommentar</t></is></c>`);

    const { ok } = await runRunnerWithInput({ outputFilePath: file, nok: ['DOK.01'] });

    expect(ok).toBe(true);
    expect(cellValue(file, `E${row}`)).toBe('NOK');
    expect(cellValue(file, `F${row}`)).toBe('Min kommentar');
  });

  it('recreates a removed status cell in column order', async () => {
    const file = newFile(TEMPLATE_2_0_0);
    const row = rowOf(file, 'DOK.01');
    replaceCell(file, `E${row}`, () => '');
    expect(cellValue(file, `E${row}`)).toBeUndefined();

    const { ok } = await runRunnerWithInput({ outputFilePath: file, nok: ['DOK.01'] });

    expect(ok).toBe(true);
    expect(cellValue(file, `E${row}`)).toBe('NOK');
    const rowXml = new RegExp(`<row r="${row}"[^>]*>(.*?)</row>`).exec(loadSheet(file).xml)![1];
    const columns = [...rowXml.matchAll(/<c r="([A-Z]+)\d+"/g)].map((m) => m[1]);
    expect(columns.slice(0, 6)).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
  });

  it('reports version mismatch and rules missing compared to the template', async () => {
    const file = newFile(TEMPLATE_1_2_0);

    const { ok, payload } = await runRunnerWithInput({ outputFilePath: file, ok: ['DOK.01', 'SPA.02', 'FOR.02'] });

    expect(ok).toBe(true);
    expect(payload.result.fileProfileVersion).toBe('1.2.0');
    expect(payload.result.templateProfileVersion).toBe('2.0.0');
    expect(payload.result.missingRules).toEqual(['SPA.02']);
    expect(cellValue(file, `E${rowOf(file, 'DOK.01')}`)).toBe('OK');
  });

  it('fails with a clear message for an invalid existing file', async () => {
    const file = newFile();
    fs.writeFileSync(file, 'inte en xlsx-fil');

    const { ok, payload } = await runRunnerWithInput({ outputFilePath: file, ok: ['DOK.01'] });

    expect(ok).toBe(false);
    expect(payload.message).toContain('Kunde inte läsa befintlig avstämningsfil');
  });
});
