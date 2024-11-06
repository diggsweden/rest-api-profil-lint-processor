import path from 'path'
import XLSC, { CellObject, WorkSheet, WSKeys } from 'xlsx'
import { RapLPDiagnostic } from './RapLPDiagnostic'

const REPORT_TEMPLATE = path.resolve(process.cwd(), "document/Avstaemning_REST_API_profil_v_1_1_0_0.xlsx")

export function populateReport(result: RapLPDiagnostic) {
    const wb = XLSC.readFile(REPORT_TEMPLATE)
    const sheet = wb.Sheets['Kravlista REST API profil']
    const statusByKey = getRuleStatusByKey(sheet)
    result.diagnosticInformation.executedUniqueRules.forEach(res => {
        const statusCell = statusByKey[res.id]
        if(statusCell?.v) {
            statusCell.v = 'OK'
        }
    })
    result.diagnosticInformation.executedUniqueRulesWithError.forEach(res => {
        const statusCell = statusByKey[res.id]
        if(statusCell?.v) {
            statusCell.v = 'NOK'
        }
    })
    result.diagnosticInformation.notApplicableRules.forEach(res => {
        const statusCell = statusByKey[res.id]
        if(statusCell?.v) {
            statusCell.v = 'N/A'
        }
    })

    XLSC.writeFile(wb, path.resolve(process.cwd(), "katt.xlsx"))
}

function getRuleStatusByKey(sheet: WorkSheet): Record<string, CellObject | WSKeys | any> {
    return Object.entries(sheet).reduce((res, [key, value]) => {
        const row = key.match(/B(\d+)/)?.[1]
        if(row) {
            if(typeof value?.v === 'string') {
                // We're not sure, but this could be a rule.
                // Try to store the corresponding rule status cell.
                res[value?.v] = sheet[`E${row}`]
            }
        }
        return res
    }, ({} as Record<string, CellObject | WSKeys | any>))
}