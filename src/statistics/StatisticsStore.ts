// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import type {
  ClientSummaryRow,
  DateRange,
  RequestEntry,
  RequestSummaryRow,
  RuleEntry,
  RuleSummary,
} from './statisticsTypes.js';

export interface StatisticsStore {
  /** Opens the connection and creates the schema if missing. May throw; the service then disables statistics. */
  init(): Promise<void>;

  /** Record operations, should never throw: statistics must not break a request. */
  recordRuleOutcomes(entries: RuleEntry[]): Promise<void>;
  recordRequest(entry: RequestEntry): Promise<void>;

  /** Read methods may throw. `from` is inclusive, `to` exclusive. No range means everything. */
  getRuleSummary(range?: DateRange, onlyViolations?: boolean): Promise<RuleSummary>;
  getRequestSummary(range?: DateRange): Promise<RequestSummaryRow[]>;
  getClientSummary(range?: DateRange): Promise<ClientSummaryRow[]>;

  /** Releases the connection. */
  close(): Promise<void>;
}
