import { RapLPCustomSpectralDiagnostic } from "../util/RapLPCustomSpectralDiagnostic.ts";
import { DiagnosticReport } from "../util/RapLPDiagnostic.ts";

export interface ValidationResponseDto {
  result: RapLPCustomSpectralDiagnostic[];
  report: DiagnosticReport[];
}
