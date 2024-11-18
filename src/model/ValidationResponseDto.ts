import { RapLPCustomSpectralDiagnostic } from "../util/RapLPCustomSpectralDiagnostic";
import { DiagnosticReport } from "../util/RapLPDiagnostic";

export interface ValidationResponseDto {
  result: RapLPCustomSpectralDiagnostic[];
  report: DiagnosticReport[];
}
