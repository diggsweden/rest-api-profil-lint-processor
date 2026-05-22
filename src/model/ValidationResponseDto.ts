// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { RapLPCustomSpectralDiagnostic } from '../util/RapLPCustomSpectralDiagnostic.js';
import { DiagnosticReport } from '../util/RapLPDiagnostic.js';

export interface ValidationResponseDto {
  result: RapLPCustomSpectralDiagnostic[];
  report: DiagnosticReport[];
}
