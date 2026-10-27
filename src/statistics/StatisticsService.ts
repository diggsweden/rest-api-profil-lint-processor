// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { createHmac } from 'node:crypto';
import type { Request, Response } from 'express';
import type { StatisticsStore } from './StatisticsStore.js';
import type { BrowserFamily, OsFamily, RequestEntry, RuleStat, RuleStatEntry, RuleStatRow, StatVersions } from './statisticsTypes.js';

export type StatsSummary = {
  enabled: boolean;
  total: number;
  byRule: RuleStatRow[];
};

const STATISTICS_ENABLED = process.env.RAP_LP_STATISTICS_ENABLED === 'true'; // Disabled as standard
const DEV_SALT = 'dev-hash-salt';
const VISITOR_SALT = process.env.RAP_LP_VISITOR_SALT || DEV_SALT;

export class StatisticsService {
  private readonly store: StatisticsStore;
  private available = false;

  constructor(store: StatisticsStore) {
    this.store = store;
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
      this.available = false;
      console.warn('Statistics disabled (store could not be initialized):', err instanceof Error ? err.message : err);
      return;
    }

    if (VISITOR_SALT === DEV_SALT) {
      console.warn('RAP_LP_VISITOR_SALT is not set, using insecure default for visitor hashes');
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

  recordRuleStats(rules: RuleStat[], versions: StatVersions): void {
    if (!this.available || rules.length === 0) {
      return;
    }

    const createdAt = new Date().toISOString();
    const entries: RuleStatEntry[] = rules.map((rule) => ({
      createdAt,
      ruleId: rule.ruleId,
      severity: rule.severity.toLowerCase(),
      restApiProfilVersion: versions.restApiProfilVersion,
      rapLpVersion: versions.rapLpVersion,
    }));

    this.store.recordRuleStats(entries).catch((err) => {
      console.warn('Failed to record statistics:', err instanceof Error ? err.message : err);
    });
  }

  recordRequest(req: Request, res: Response): void {
    if (!this.available) {
      return;
    }

    const userAgent = req.headers['user-agent'];
    const start = res.locals?.statsStart as bigint | undefined;
    const durationMs = start === undefined ? 0 : Number(process.hrtime.bigint() - start) / 1e6

    const entry: RequestEntry = {
      createdAt: new Date().toISOString(),
      method: req.method,
      route: req.route?.path ?? 'unmatched',
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs),
      browserFamily: parseBrowser(userAgent),
      osFamily: parseOs(userAgent),
      visitorHash: this.makeVisitorHash(clientAddress(req), userAgent),
    };

    this.store.recordRequest(entry).catch((err) => {
      console.warn('Failed to record request:', err instanceof Error ? err.message : err);
    });
  }

  async getStatsSummary(): Promise<StatsSummary> {
    if (!this.available) {
      return { enabled: false, total: 0, byRule: [] };
    }

    try {
      const byRule = await this.store.getRuleSummary();
      const total = byRule.reduce((sum, row) => sum + row.count, 0);
      return { enabled: true, total, byRule };
    } catch (err) {
      console.warn('Failed to read statistics:', err instanceof Error ? err.message : err);
      return { enabled: true, total: 0, byRule: [] };
    }
  }

  private makeVisitorHash(ip?: string, userAgent = ''): string | null {
    if (!ip) return null;

    const visitorHash = createHmac('sha256', VISITOR_SALT)
      .update(`${ip}|${userAgent}`)
      .digest('hex')
      .slice(0, 32);

    return visitorHash;
  }
}

// Use the first value in X-Forwarded-For. If the header is missing (locally, health checks), fall back to req.ip.
function clientAddress(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  const chain = Array.isArray(forwarded) ? forwarded.join(',') : forwarded;
  return chain?.split(',')[0]?.trim() || req.ip;
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