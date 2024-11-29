import AdmZip from "adm-zip";
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import path from "path";
import { RapLPDiagnostic } from "./RapLPDiagnostic";

interface ExcelTemplateConfig {
    reportTemplatePath: string
    dataSheetName: string
    ruleColumn: string
    statusColumn: string
    outputFilePath: string
}

const DEFAULT_CONFIG: ExcelTemplateConfig = {
    reportTemplatePath: path.resolve(process.cwd(), "document/Avstaemning_REST_API_profil_v_1_1_0_0.xlsx"),
    dataSheetName: "Kravlista REST API profil",
    ruleColumn: "B",
    statusColumn: "E",
    outputFilePath: path.resolve(process.cwd(), "Avstaemning_REST_API_profil_generated.xlsx")
}

export class ExcelReportProcessor {

    private config: ExcelTemplateConfig;

    private parser = new XMLParser({ignoreAttributes: false});
    private builder = new XMLBuilder({ignoreAttributes: false});
    private zip: AdmZip
    constructor(config?: Partial<ExcelTemplateConfig>) {

        const isPresent = (x?: string): x is string => {
            return x != null && x !== '';
        }
        const outputPath = config?.outputFilePath
        this.config = {
            ...DEFAULT_CONFIG,
            ...config,
            outputFilePath: isPresent(outputPath) ? outputPath : DEFAULT_CONFIG.outputFilePath
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

        if(!sharedStrings || !sheetPath) {
            return
        }

        // From the shared strings, we want to find the indexes of the available status options.
        const optionIndexMap = this.indexMapOf(['-', 'OK', 'NOK', 'N/A', 'Pågående'], sharedStrings);

        // Update the status column with the results.
        this.updateResultColumn(sheetPath, resultMap, sharedStrings, optionIndexMap)

        // Enable full recalculation of workbok.
        // This is neeeded in order for excell to update the summary tables.
        this.enableFullCalcOnLoad(workbook);

        // Persist and write the output file.
        this.persistUpdates(this.config.outputFilePath)
    }


    private reportToMap(result: RapLPDiagnostic): Record<string, 'OK' | 'NOK' | 'N/A'> {
        const okRules: Record<string, 'OK'>[] = result.diagnosticInformation.executedUniqueRules.map((res) => ({
             [res.id]: 'OK'
         }));
     
         const nokRules: Record<string, 'NOK'>[] = result.diagnosticInformation.executedUniqueRulesWithError.map((res) => ({
             [res.id]: 'NOK'
         }));
     
         const naRules: Record<string, 'N/A'>[] = result.diagnosticInformation.notApplicableRules.map((res) => ({
             [res.id]: 'N/A'
         }));
     
         return [...okRules, ...nokRules, ...naRules].reduce((res, curr) => {
             return {...res, ...curr }
         }, {} as Record<string, 'OK' | 'NOK' | 'N/A'>)
     }


    private loadWorkBook(): unknown {
        const wbzip = this.zip.getEntry("xl/workbook.xml")?.getData();
        if(!wbzip) {
            throw new Error("Could not load workbook component from Template file.")
        }
        return this.parser.parse(wbzip);
    }

    private enableFullCalcOnLoad(workbook): void {
        workbook.workbook.calcPr['@_fullCalcOnLoad'] = "1";
        this.zip.updateFile("xl/workbook.xml",  this.builder.build(workbook))
    }

    private getSheetPathFromName(workbook, name: string): string {
    const sheetId = workbook?.workbook?.sheets?.sheet.find(s => 
        s["@_name"] === name
        )?.['@_r:id']
    
        const relzip = this.zip.getEntry("xl/_rels/workbook.xml.rels")?.getData();
    
        if(!relzip) {
            throw new Error("Could open or find relationship of the template document.")
        }

        const relations = this.parser.parse(relzip)
        const path = relations.Relationships.Relationship.find(r => r['@_Id'] === sheetId)?.['@_Target']
        if(!path) {
            throw new Error(`Could not parse out sheet object named ${name}`)
        }
        return `xl/${path}`
    }

    private loadSharedStrings(): string[] | undefined {
        const sharedzip = this.zip.getEntry("xl/sharedStrings.xml")?.getData();
        if(!sharedzip) {
            return
        }

        return this.parser.parse(sharedzip)?.sst?.si.map(s => s.t);
    }

    private indexMapOf(values: string[], sharedStrings: string[]): Record<string, number> {
        return values.reduce((res, curr) => {
            const indx = sharedStrings.findIndex((v) => v === curr);
            if(indx >= 0) {
                return {...res, [curr]: indx}
            }
            return res
        },  {} as Record<string, number>)
    }


    private loadSheet(path: string) {
        const shzip = this.zip.getEntry(path)

        if(!shzip){
            throw new Error(`Could not find sheet from path: ${path}`)
        }  
        return this.parser.parse(shzip.getData())
    }


    private updateResultColumn(sheetPath: string, results: {[rule: string]: string}, sharedStrings, valueMap) {
        const sheet = this.loadSheet(sheetPath)
        sheet?.worksheet?.sheetData?.row.forEach(row => {
            const ruleColumn = row.c.find(col => col['@_r']?.startsWith(this.config.ruleColumn))
            const resultColumn = row.c.find(col => col['@_r']?.startsWith(this.config.statusColumn))
            
            // See if the value of the rule column match any reported rule from the result report.
            const status = results[sharedStrings[ruleColumn?.v]]
            if(status) {
                // If so, update the corresponding result column with the correct status.
                resultColumn.v = valueMap[status]
            }
        })
        this.zip.updateFile(sheetPath, this.builder.build(sheet))
    }

    private persistUpdates(outputFile: string) {
        this.zip.writeZip(outputFile)
    }
}