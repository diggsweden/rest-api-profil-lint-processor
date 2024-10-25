import { ISpectralDiagnostic } from '@stoplight/spectral-core';

/**
 * Own defined interface to extend ISpectralDiagnostic.
 * The interface also extends the omit type in order to 'remove' some fields from the iSpectralDiagnostic
 */
export interface RapLPCustomSpectralDiagnostic extends Omit<ISpectralDiagnostic, 'message' | 'code' | 'severity' | 'path' | 'source' | 'range'> {
    id?: string;
    omrade?: string;
    krav?: string;
    allvarlighetsgrad?: string;
    sokvag?: any;
    omfattning?: any;
  }
  