// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import type { RequestEntry, RuleStatEntry, RuleStatRow } from './statisticsTypes.js';

export interface StatisticsStore {

  init(): Promise<void>;

  recordRuleStats(entries: RuleStatEntry[]): Promise<void>;
  
  recordRequest(entry: RequestEntry): Promise<void>;
  
  getRuleSummary(): Promise<RuleStatRow[]>;

  close(): Promise<void>;
}