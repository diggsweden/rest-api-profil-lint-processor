// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import AdmZip from 'adm-zip';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import path from 'path';
import { RapLPDiagnostic } from './RapLPDiagnostic.js';
import fs from 'fs';
import { fileURLToPath } from 'url';

interface ExcelTemplateConfig {
  reportTemplatePath: string;
  dataSheetName: string;
  ruleColumn: string;
  statusColumn: string;
  outputFilePath: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE = 'Avstaemning_REST_API_profil_v_1_2_0_0.xlsx';
const candidates = [
  path.resolve(__dirname, '../document', TEMPLATE),
  path.resolve(__dirname, '../../document', TEMPLATE),
];

function resolveTemplatePath() {
  for (const p of candidates) if (fs.existsSync(p)) return p;
  throw new Error('Hittar inte Excel-mallen. Testade:\n  - ' + candidates.join('\n  - '));
}

/**
 * Mapped to actual Excel template for corresponding version of the Swedish REST API-profile
 * This integration is intended to facilitate reconciliation against the respective requirements
 * and to provide an overview of how an API meets this REST API profile.
 */
const DEFAULT_CONFIG: ExcelTemplateConfig = {
  reportTemplatePath: resolveTemplatePath(),
  dataSheetName: 'Kravlista REST API profil',
  ruleColumn: 'B',
  statusColumn: 'E',
  outputFilePath: path.resolve(process.cwd(), 'Avstaemning_REST_API_profil_generated.xlsx'),
};

const STATUS_OPTIONS = ['-', 'OK', 'NOK', 'N/A', 'Pågående'];

const ARRAY_PATHS = new Set([
  'workbook.sheets.sheet',
  'Relationships.Relationship',
  'sst.si',
  'sst.si.r',
  'worksheet.cols.col',
  'worksheet.sheetData.row',
  'worksheet.sheetData.row.c',
]);

const ELEMENTS_AFTER_CALC_PR = [
  'oleSize',
  'customWorkbookViews',
  'pivotCaches',
  'smartTagPr',
  'smartTagTypes',
  'webPublishing',
  'fileRecoveryPr',
  'webPublishObjects',
  'extLst',
];

const textOf = (item: any): string => {
  if (item == null) return '';
  const toText = (t: any): string => (t == null ? '' : typeof t === 'object' ? String(t['#text'] ?? '') : String(t));
  if (item.t != null) return toText(item.t);
  return (item.r ?? []).map((run: any) => toText(run.t)).join('');
};

const columnOf = (cell: any): string => /^[A-Z]+/.exec(cell?.['@_r'] ?? '')?.[0] ?? '';

const columnIndex = (column: string): number =>
  [...column].reduce((res, char) => res * 26 + (char.charCodeAt(0) - 64), 0);

const isFileAccessible = (filePath: string): boolean => {
  try {
    const fd = fs.openSync(filePath, 'r+');
    fs.closeSync(fd);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 *
 * This class is responsible to parse the template Excel report, fill out the result from
 * the current RapLPDiagnostic report and persist the result to a file specified by the user.
 *
 * If the template file (document/Avstaemning_REST_API_profil_v_1_1_0_0.xlsx) is updated, this class will probably need
 * modifications. Tools like "unzip" and  "xmllint" is recomended to identify the updates needed.
 */
export class ExcelReportProcessor {
  private config: ExcelTemplateConfig;

  private parser = new XMLParser({
    ignoreAttributes: false,
    parseTagValue: false,
    trimValues: false,
    isArray: (_tagName, jPath) => ARRAY_PATHS.has(String(jPath)),
  });
  private builder = new XMLBuilder({ ignoreAttributes: false });
  private zip: AdmZip;
  private sourceFilePath: string;
  private requestedOutputFilePath: string;

  constructor(config?: Partial<ExcelTemplateConfig>) {
    const isPresent = (x?: string): x is string => {
      return x != null && x !== '';
    };
    const outputPath = config?.outputFilePath;
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      outputFilePath: isPresent(outputPath) ? outputPath : DEFAULT_CONFIG.outputFilePath,
    };

    this.sourceFilePath =
      isPresent(outputPath) && fs.existsSync(this.config.outputFilePath)
        ? this.config.outputFilePath
        : this.config.reportTemplatePath;

    this.requestedOutputFilePath = this.config.outputFilePath;
    if (fs.existsSync(this.config.outputFilePath) && !isFileAccessible(this.config.outputFilePath)) {
      // The file is locked (e.g. open in Excel), write to a timestamped sibling named after the requested file.
      const timestamp = new Date().toISOString().replace(/[^\w]/g, '-');
      const { dir, name, ext } = path.parse(this.config.outputFilePath);
      this.config.outputFilePath = path.join(dir, `${name}_${timestamp}${ext || '.xlsx'}`);
    }

    try {
      this.zip = new AdmZip(this.sourceFilePath);
    } catch (error: any) {
      if (this.isBasedOnExistingFile) {
        throw new Error(`Kunde inte läsa befintlig avstämningsfil ${this.sourceFilePath}: ${error?.message ?? error}`);
      }
      throw error;
    }
  }
  public get diagnosticInformation(): ExcelTemplateConfig {
    return this.config;
  }

  public get outputFilePath(): string {
    return this.config.outputFilePath;
  }

  public get baseFilePath(): string {
    return this.sourceFilePath;
  }

  public get lockedFilePath(): string | undefined {
    return this.requestedOutputFilePath !== this.config.outputFilePath ? this.requestedOutputFilePath : undefined;
  }

  public get isBasedOnExistingFile(): boolean {
    return this.sourceFilePath !== this.config.reportTemplatePath;
  }

  public generateReportDocument(result: RapLPDiagnostic) {
    // Convert the result Raport to map with Rule name as key and status as value.
    const resultMap = this.reportToMap(result);

    // Decode the necessary data from the xlsx document.
    const workbook = this.loadWorkBook();
    const sheetPath = this.getSheetPathFromName(workbook, this.config.dataSheetName);
    const sharedStrings = this.loadSharedStrings();

    if (!sharedStrings || !sheetPath) {
      throw new Error(`Could not load required components from ${this.sourceFilePath}.`);
    }

    // From the shared strings, we want to find the indexes of the available status options.
    const optionIndexMap = this.indexMapOf(STATUS_OPTIONS, sharedStrings);

    // Update the status column with the results.
    this.updateResultColumn(sheetPath, resultMap, sharedStrings, optionIndexMap);

    // Enable full recalculation of workbok.
    // This is neeeded in order for excell to update the summary tables.
    this.enableFullCalcOnLoad(workbook);

    // Persist and write the output file.
    this.persistUpdates(this.config.outputFilePath);
  }

  public generateReportDocumentBuffer(result: RapLPDiagnostic): Buffer {
    try {
      const resultMap = this.reportToMap(result);
      const workbook = this.loadWorkBook();
      const sheetPath = this.getSheetPathFromName(workbook, this.config.dataSheetName);
      const sharedStrings = this.loadSharedStrings();

      if (!sharedStrings || !sheetPath) {
        throw new Error('Could not load required components from template.');
      }

      const optionIndexMap = this.indexMapOf(STATUS_OPTIONS, sharedStrings);
      this.updateResultColumn(sheetPath, resultMap, sharedStrings, optionIndexMap);
      this.enableFullCalcOnLoad(workbook);

      const reportDocumentBuffer = this.zip.toBuffer();

      if (!reportDocumentBuffer || reportDocumentBuffer.length === 0) {
        throw new Error('Generated buffer is empty or invalid.');
      }

      return reportDocumentBuffer;
    } catch (error) {
      console.error('Error generating report document buffer:', error);
      throw new Error('Failed to generate the report document buffer.');
    }
  }

  /**
   * Utility function to map the Diagnostic report into basic components.
   * A map with the rule name as Key and the reported status as Value.
   *
   */
  private reportToMap(result: RapLPDiagnostic): Record<string, 'OK' | 'NOK' | 'N/A'> {
    const okRules: Record<string, 'OK'>[] = result.diagnosticInformation.executedUniqueRules.map((res) => ({
      [res.id]: 'OK',
    }));

    const nokRules: Record<string, 'NOK'>[] = result.diagnosticInformation.executedUniqueRulesWithError.map((res) => ({
      [res.id]: 'NOK',
    }));

    const naRules: Record<string, 'N/A'>[] = result.diagnosticInformation.notApplicableRules.map((res) => ({
      [res.id]: 'N/A',
    }));

    return [...okRules, ...nokRules, ...naRules].reduce((res, curr) => {
      return { ...res, ...curr };
    }, {} as Record<string, 'OK' | 'NOK' | 'N/A'>);
  }

  /**
   * Unzip the workbook entry from the excel file.
   * The workbook contains general metadata over the files structure and
   * acts as the root object.
   */
  private loadWorkBook(): unknown {
    const wbzip = this.zip.getEntry('xl/workbook.xml')?.getData();
    if (!wbzip) {
      throw new Error('Could not load workbook component from Template file.');
    }
    return this.parser.parse(wbzip);
  }

  /**
   * Sets the parameter "fullCalcOnLoad" to true, this causes the
   * sheet to be re-calculated when the user opens it in order for the
   * linked calculations and tables to be performed since we only update
   * the data column.
   */
  private enableFullCalcOnLoad(workbook): void {
    if (!workbook.workbook.calcPr) {
      const entries = Object.entries(workbook.workbook);
      const index = entries.findIndex(([key]) => ELEMENTS_AFTER_CALC_PR.includes(key));
      entries.splice(index >= 0 ? index : entries.length, 0, ['calcPr', {}]);
      workbook.workbook = Object.fromEntries(entries);
    }
    workbook.workbook.calcPr['@_fullCalcOnLoad'] = '1';
    const xmlString = this.builder.build(workbook);
    const xmlBuffer = Buffer.from(xmlString, 'utf8');
    this.zip.updateFile('xl/workbook.xml', xmlBuffer);
  }

  /**
   * The "Sheet" represents an actual table or sheet in Excel.
   * The workbook contains the name and Id of each sheet. We can then
   * use "xl/_rels/workbook.xml.rels" in order to find the path of the sheet.
   */
  private getSheetPathFromName(workbook, name: string): string {
    const sheetId = workbook?.workbook?.sheets?.sheet.find((s) => s['@_name'] === name)?.['@_r:id'];

    const relzip = this.zip.getEntry('xl/_rels/workbook.xml.rels')?.getData();

    if (!relzip) {
      throw new Error('Could open or find relationship of the template document.');
    }

    const relations = this.parser.parse(relzip);
    const path = relations.Relationships.Relationship.find((r) => r['@_Id'] === sheetId)?.['@_Target'];
    if (!path) {
      throw new Error(`Could not parse out sheet object named ${name}`);
    }
    return `xl/${path}`;
  }

  /**
   * The "sharedStrings" contains a list of all strings used in the sheets.
   * The strings are then referenced by index from the sheet cells.
   */
  private loadSharedStrings(): string[] | undefined {
    const sharedzip = this.zip.getEntry('xl/sharedStrings.xml')?.getData();
    if (!sharedzip) {
      return;
    }

    return this.parser.parse(sharedzip)?.sst?.si?.map(textOf);
  }

  /**
   *  Utility method to create a map from the provided strings to it's corresponding
   *  index within the "sharedStrings" list.
   *
   *  @param values The list of values.
   *  @param sharedStrings The list of sharedStrings extracted from #loadSharedStrings
   *  @returns A Map with each value from the values list as key and its corresponding index from sharedStrings as value.
   */
  private indexMapOf(values: string[], sharedStrings: string[]): Record<string, number> {
    return values.reduce((res, curr) => {
      const indx = sharedStrings.findIndex((v) => v === curr);
      if (indx >= 0) {
        return { ...res, [curr]: indx };
      }
      return res;
    }, {} as Record<string, number>);
  }

  /**
   * Given a path within the xlsx file, load a sheet to memory.
   * See #getSheetPathFromName to extract the path.
   *
   */
  private loadSheet(path: string) {
    const shzip = this.zip.getEntry(path);

    if (!shzip) {
      throw new Error(`Could not find sheet from path: ${path}`);
    }
    return this.parser.parse(shzip.getData());
  }

  /**
   * This function will look at the column specified by "config:ruleColumn", if the value matches any
   * of the reported rule keys in the "results" object the cell object of that row and column specified by "config:statusColumn"
   * will be updated with the value from the results object.
   *
   * The result will update the in-memory instance of the file, but will not persist to disc.
   *
   * Only the status cells of reported rules are touched, all other cells (e.g. comments) are kept as they are.
   */
  private updateResultColumn(
    sheetPath: string,
    results: { [rule: string]: string },
    sharedStrings: string[],
    valueMap: Record<string, number>,
  ) {
    const sheet = this.loadSheet(sheetPath);
    sheet?.worksheet?.sheetData?.row?.forEach((row) => {
      const cells: any[] = row.c ?? [];
      const ruleCell = cells.find((cell) => columnOf(cell) === this.config.ruleColumn);

      // See if the value of the rule column match any reported rule from the result report.
      const status = ruleCell ? results[this.cellText(ruleCell, sharedStrings).trim()] : undefined;
      if (!status) {
        return;
      }

      let resultCell = cells.find((cell) => columnOf(cell) === this.config.statusColumn);
      if (!resultCell) {
        // Excel may drop empty cells when saving, so the status cell has to be created in column order.
        if (row['@_r'] == null) {
          return;
        }
        const target = columnIndex(this.config.statusColumn);
        const columnStyle = sheet.worksheet.cols?.col?.find(
          (col) => Number(col['@_min']) <= target && target <= Number(col['@_max']),
        )?.['@_style'];
        resultCell = {
          '@_r': `${this.config.statusColumn}${row['@_r']}`,
          ...(columnStyle ? { '@_s': columnStyle } : {}),
        };
        const insertAt = cells.findIndex((cell) => columnIndex(columnOf(cell)) > target);
        cells.splice(insertAt >= 0 ? insertAt : cells.length, 0, resultCell);
        row.c = cells;
      }

      // Update the corresponding result column with the correct status.
      delete resultCell.f;
      delete resultCell.is;
      if (valueMap[status] != null) {
        resultCell['@_t'] = 's';
        resultCell.v = String(valueMap[status]);
      } else {
        // The status is missing among the shared strings, write it as an inline string instead.
        delete resultCell.v;
        resultCell['@_t'] = 'inlineStr';
        resultCell.is = { t: status };
      }
    });

    const xmlString = this.builder.build(sheet);
    const xmlBuffer = Buffer.from(xmlString, 'utf8');
    this.zip.updateFile(sheetPath, xmlBuffer);
  }

  /**
   * Resolves the displayed text of a cell, whether it is a shared string, an inline string or a plain value.
   */
  private cellText(cell: any, sharedStrings: string[]): string {
    switch (cell['@_t']) {
      case 's':
        return sharedStrings[Number(cell.v)] ?? '';
      case 'inlineStr':
        return textOf(cell.is);
      default:
        return cell.v == null ? '' : String(cell.v);
    }
  }

  /**
   * This method will persis the current representation of the excel file.
   */
  private persistUpdates(outputFile: string) {
    this.zip.writeZip(outputFile);
  }
}
