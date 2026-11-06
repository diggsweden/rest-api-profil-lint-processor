// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

export type BrowserFamily = 'chrome' | 'firefox' | 'safari' | 'edge' | 'other' | 'non_browser';
export type OsFamily = 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'other';
export type RuleOutcome = 'violation' | 'ok';

export type RuleSummaryRow = {
  ruleId: string;
  outcome: RuleOutcome;
  severity: string;
  count: number;
};

export type RuleSummary = {
  validations: number;
  byRule: RuleSummaryRow[];
};

export type RequestSummaryRow = {
  route: string;
  method: string;
  count: number;
  avgDurationMs: number;
  maxDurationMs: number;
  errorCount: number;
};

export type ClientSummaryRow = {
  browserFamily: BrowserFamily;
  osFamily: OsFamily;
  count: number;
};

export type RuleEntry = {
  validationId: string;
  createdAt: string; // ISO 8601, UTC
  ruleId: string;
  outcome: RuleOutcome;
  severity: string;
  rapLpVersion: string;
};

export type RequestEntry = {
  createdAt: string; // ISO 8601, UTC
  method: string;
  route: string;
  statusCode: number;
  durationMs: number;
  browserFamily: BrowserFamily;
  osFamily: OsFamily;
};

export type DateRange = {
  from?: string; // ISO 8601, UTC, inclusive
  to?: string; // ISO 8601, UTC, exclusive
};
