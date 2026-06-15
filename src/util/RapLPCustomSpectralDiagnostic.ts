// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
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
  area?: string;
  requirement?: string;
  severity?: string;
  path?: any;
  range?: any;

  /**Helper Url for guidelines */
  helpUrl?: string;
}



