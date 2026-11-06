// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import type { StatisticsStore } from './StatisticsStore.js';
import type { ValidationResponseDto } from '../model/ValidationResponseDto.js';
import type {
  BrowserFamily,
  ClientSummaryRow,
  DateRange,
  OsFamily,
  RequestEntry,
  RequestSummaryRow,
  RuleEntry,
  RuleSummaryRow,
} from './statisticsTypes.js';

export type RulesSummary = {
  enabled: boolean;
  range: DateRange;
  validations: number;
  totalViolations: number;
  totalOk: number;
  byRule: RuleSummaryRow[];
};

export type RequestsSummary = {
  enabled: boolean;
  range: DateRange;
  totalRequests: number;
  byRoute: RequestSummaryRow[];
};

export type ClientsSummary = {
  enabled: boolean;
  range: DateRange;
  totalRequests: number;
  byClient: ClientSummaryRow[];
};

const STATISTICS_ENABLED = process.env.RAP_LP_STATISTICS_ENABLED === 'true'; // Disabled by default

export class StatisticsService {
  private readonly store: StatisticsStore;
  private readonly rapLpVersion: string;
  private available = false;

  constructor(store: StatisticsStore, rapLpVersion: string) {
    this.store = store;
    this.rapLpVersion = rapLpVersion;
  }

  static isStatisticsEnabled(): boolean {
    return STATISTICS_ENABLED;
  }

  // Called at startup. On failure, statistics are disabled until restart.
  async start(): Promise<void> {
    try {
      await this.store.init();
      this.available = true;
    } catch (err) {
      console.warn('Statistics disabled (store could not be initialized):', err instanceof Error ? err.message : err);
    }
  }

  async stop(): Promise<void> {
    this.available = false;
    try {
      await this.store.close();
    } catch (err) {
      console.warn('Failed to close statistics store:', err instanceof Error ? err.message : err);
    }
  }

  // Records every rule outcome of one validation (violations and passed rules) as one row each.
  recordValidationResult(result: ValidationResponseDto): void {
    if (!this.available) {
      return;
    }

    const createdAt = new Date().toISOString();
    const validationId = randomUUID();

    const violations: RuleEntry[] = result.result.map((finding) => ({
      ruleId: finding.id ?? 'unknown',
      validationId,
      createdAt,
      outcome: 'violation',
      severity: (finding.severity ?? 'unknown').toLowerCase(),
      rapLpVersion: this.rapLpVersion,
    }));

    const passed: RuleEntry[] = result.report
      .flatMap((group) => group.rules)
      .filter((rule) => rule.status === 'OK')
      .map((rule) => ({
        ruleId: rule.id,
        validationId,
        createdAt,
        outcome: 'ok',
        severity: 'none',
        rapLpVersion: this.rapLpVersion,
      }));

    const entries = [...violations, ...passed];
    if (entries.length === 0) {
      return;
    }

    this.store.recordRuleOutcomes(entries).catch((err) => {
      console.warn('Failed to record statistics:', err instanceof Error ? err.message : err);
    });
  }

  recordRequest(req: Request, res: Response): void {
    if (!this.available) {
      return;
    }

    const userAgent = req.headers['user-agent'];
    const start = res.locals?.statsStart as bigint | undefined;
    const durationMs = start === undefined ? 0 : Number(process.hrtime.bigint() - start) / 1e6;

    const entry: RequestEntry = {
      createdAt: new Date().toISOString(),
      method: req.method,
      route: req.route?.path ?? 'unmatched',
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs),
      browserFamily: parseBrowser(userAgent),
      osFamily: parseOs(userAgent),
    };

    this.store.recordRequest(entry).catch((err) => {
      console.warn('Failed to record request:', err instanceof Error ? err.message : err);
    });
  }

  async getRuleSummary(range?: DateRange, onlyViolations = false): Promise<RulesSummary> {
    const dateRange = normalizeDateRange(range);

    if (!this.available) {
      return { enabled: false, range: dateRange, validations: 0, totalViolations: 0, totalOk: 0, byRule: [] };
    }

    try {
      const { validations, byRule } = await this.store.getRuleSummary(range, onlyViolations);
      let totalViolations = 0;
      let totalOk = 0;

      for (const row of byRule) {
        if (row.outcome === 'violation') totalViolations += row.count;
        else totalOk += row.count;
      }

      return {
        enabled: true,
        range: dateRange,
        validations,
        totalViolations,
        totalOk,
        byRule,
      };
    } catch (err) {
      console.warn('Failed to read statistics:', err instanceof Error ? err.message : err);
      return { enabled: true, range: dateRange, validations: 0, totalViolations: 0, totalOk: 0, byRule: [] };
    }
  }

  async getRequestsSummary(range?: DateRange): Promise<RequestsSummary> {
    const dateRange = normalizeDateRange(range);

    if (!this.available) {
      return { enabled: false, range: dateRange, totalRequests: 0, byRoute: [] };
    }

    try {
      const byRoute = await this.store.getRequestSummary(range);
      const totalRequests = byRoute.reduce((sum, row) => sum + row.count, 0);
      return { enabled: true, range: dateRange, totalRequests, byRoute };
    } catch (err) {
      console.warn('Failed to read request statistics:', err instanceof Error ? err.message : err);
      return { enabled: true, range: dateRange, totalRequests: 0, byRoute: [] };
    }
  }

  async getClientsSummary(range?: DateRange): Promise<ClientsSummary> {
    const dateRange = normalizeDateRange(range);

    if (!this.available) {
      return { enabled: false, range: dateRange, totalRequests: 0, byClient: [] };
    }

    try {
      const byClient = await this.store.getClientSummary(range);
      const totalRequests = byClient.reduce((sum, row) => sum + row.count, 0);
      return { enabled: true, range: dateRange, totalRequests, byClient };
    } catch (err) {
      console.warn('Failed to read client statistics:', err instanceof Error ? err.message : err);
      return { enabled: true, range: dateRange, totalRequests: 0, byClient: [] };
    }
  }
}

function normalizeDateRange(range?: DateRange): DateRange {
  const normalized: DateRange = {};
  if (range?.from) normalized.from = range.from;
  if (range?.to) normalized.to = range.to;
  return normalized;
}

function parseOs(userAgent = ''): OsFamily {
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'ios';
  if (userAgent.includes('Android')) return 'android';
  if (userAgent.includes('Windows')) return 'windows';
  if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS X')) return 'macos';
  if (userAgent.includes('Linux') || userAgent.includes('X11')) return 'linux';
  return 'other';
}

function parseBrowser(userAgent = ''): BrowserFamily {
  if (userAgent.includes('Edg/') || userAgent.includes('EdgA/') || userAgent.includes('EdgiOS/')) return 'edge';
  if (userAgent.includes('Firefox/') || userAgent.includes('FxiOS/')) return 'firefox';
  if (userAgent.includes('Chrome/') || userAgent.includes('CriOS/')) return 'chrome';
  if (userAgent.includes('Safari/')) return 'safari';
  if (userAgent.includes('Mozilla/')) return 'other'; // looks like a browser, but unrecognized
  return 'non_browser'; // curl, Postman, Java, node-fetch etc.
}
