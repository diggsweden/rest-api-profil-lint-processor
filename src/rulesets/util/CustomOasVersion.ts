// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

// Defined constants for the custom formats that RAP-LP supports
export const CustomFormats = {
  OAS2: 'oas2',
  OAS3: 'oas3',
  OAS3_0: 'oas3_0',
  OAS3_1: 'oas3_1',
} as const;

export type CustomFormatType = keyof typeof CustomFormats;
