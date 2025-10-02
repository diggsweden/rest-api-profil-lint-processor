// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
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

  private parser = new XMLParser({ ignoreAttributes: false });
  private builder = new XMLBuilder({ ignoreAttributes: false });
  private zip: AdmZip;
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

    if (fs.existsSync(this.config.outputFilePath) && !isFileAccessible(this.config.outputFilePath)) {
      const timestamp = new Date().toISOString().replace(/[^\w]/g, '-');
      const newFileName = `Avstaemning_REST_API_profil_generated_${timestamp}.xlsx`;
      const newOutputFilePath = path.join(path.dirname(this.config.outputFilePath), newFileName);
      this.config.outputFilePath = newOutputFilePath;
    }

    this.zip = new AdmZip(this.config.reportTemplatePath);
  }

  public generateReportDocument(result: RapLPDiagnostic) {
    // Convert the result Raport to map with Rule name as key and status as value.
    const resultMap = this.reportToMap(result);

    // Decode the necessary data from the xlsx document.
    const workbook = this.loadWorkBook();
    const sheetPath = this.getSheetPathFromName(workbook, this.config.dataSheetName);
    const sharedStrings = this.loadSharedStrings();

    if (!sharedStrings || !sheetPath) {
      return;
    }

    // From the shared strings, we want to find the indexes of the available status options.
    const optionIndexMap = this.indexMapOf(['-', 'OK', 'NOK', 'N/A', 'Pågående'], sharedStrings);

    // Update the status column with the results.
    this.updateResultColumn(sheetPath, resultMap, sharedStrings, optionIndexMap);

    // Enable full recalculation of workbok.
    // This is neeeded in order for excell to update the summary tables.
    this.enableFullCalcOnLoad(workbook);

    // Persist and write the output file.
    this.persistUpdates(this.config.outputFilePath);
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
    workbook.workbook.calcPr['@_fullCalcOnLoad'] = '1';
    this.zip.updateFile('xl/workbook.xml', this.builder.build(workbook));
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

    return this.parser.parse(sharedzip)?.sst?.si.map((s) => s.t);
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
   */
  private updateResultColumn(sheetPath: string, results: { [rule: string]: string }, sharedStrings, valueMap) {
    const sheet = this.loadSheet(sheetPath);
    sheet?.worksheet?.sheetData?.row.forEach((row) => {
      const ruleColumn = row.c.find((col) => col['@_r']?.startsWith(this.config.ruleColumn));
      const resultColumn = row.c.find((col) => col['@_r']?.startsWith(this.config.statusColumn));

      // See if the value of the rule column match any reported rule from the result report.
      const status = results[sharedStrings[ruleColumn?.v]];

      if (status) {
        // If so, update the corresponding result column with the correct status.
        resultColumn.v = valueMap[status];
      }
    });
    this.zip.updateFile(sheetPath, this.builder.build(sheet));
  }

  /**
   * This method will persis the current representation of the excel file.
   */
  private persistUpdates(outputFile: string) {
    this.zip.writeZip(outputFile);
  }
}
