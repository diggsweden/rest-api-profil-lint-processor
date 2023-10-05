// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { ISpectralDiagnostic } from '@stoplight/spectral-core';

/**
 * Own defined interface to extend ISpectralDiagnostic.
 * The interface also extends the omit type in order to 'remove' some fields from the iSpectralDiagnostic
 */
export interface RapLPCustomSpectralDiagnostic
  extends Omit<ISpectralDiagnostic, 'message' | 'code' | 'severity' | 'path' | 'source' | 'range'> {
  id?: string;
  område?: string;
  krav?: string;
  allvarlighetsgrad?: string;
  sökväg?: any;
  omfattning?: any;
}
