import { RapLPCustomSpectralDiagnostic } from "../util/RapLPCustomSpectralDiagnostic.js";
import { DiagnosticReport } from "../util/RapLPDiagnostic.js";

export interface ValidationResponseDto {
  result: RapLPCustomSpectralDiagnostic[];
  report: DiagnosticReport[];
}
