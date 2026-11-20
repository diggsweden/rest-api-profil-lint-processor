// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

export const ExitCode = {
  Success: 0,
  InternalError: 1,
  InvalidArguments: 2,
  SpecValidationFailed: 21,
  CriteriaNotMet: 22,
} as const;
