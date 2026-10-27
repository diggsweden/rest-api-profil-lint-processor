// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

export type BrowserFamily = 'chrome' | 'firefox' | 'safari' | 'edge' | 'other' | 'non_browser';
export type OsFamily = 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'other';

export type RuleStat = {
  ruleId: string;
  severity: string;
};

export type StatVersions = {
  restApiProfilVersion: string;
  rapLpVersion: string;
};

export type RuleStatRow = {
  ruleId: string;
  severity: string;
  count: number;
};

export type RuleStatEntry = {
  createdAt: string; // ISO 8601, UTC
  ruleId: string;
  severity: string;
  restApiProfilVersion: string;
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
  visitorHash: string | null;
};