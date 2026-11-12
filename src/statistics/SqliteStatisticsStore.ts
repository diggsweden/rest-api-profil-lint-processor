// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import * as fs from 'node:fs';
import * as path from 'node:path';
import Database from 'better-sqlite3';
import type { StatisticsStore } from './StatisticsStore.js';
import type {
  ClientSummaryRow,
  DateRange,
  RequestEntry,
  RequestSummaryRow,
  RuleEntry,
  RuleSummary,
  RuleSummaryRow,
} from './statisticsTypes.js';

export class SqliteStatisticsStore implements StatisticsStore {
  private readonly dataDir: string;
  private database: Database.Database | undefined;
  private insertRuleOutcome: Database.Statement | undefined;
  private insertRequest: Database.Statement | undefined;
  private selectRuleSummary: Database.Statement | undefined;
  private selectRequestSummary: Database.Statement | undefined;
  private selectClientSummary: Database.Statement | undefined;
  private selectValidationCount: Database.Statement | undefined;

  constructor(dataDir?: string) {
    this.dataDir = dataDir ?? process.env.RAP_LP_STATISTICS_DATA_DIR ?? '/app/data';
  }

  // Opens the database, creates the tables if missing, and prepares statements.
  async init(): Promise<void> {
    const dbPath = path.join(this.dataDir, 'statistics.db');
    fs.mkdirSync(this.dataDir, { recursive: true });
    const database = new Database(dbPath);
    try {
      database.pragma('journal_mode = DELETE');
      database.pragma('busy_timeout = 5000');
      createRuleStatsTable(database);
      createRequestStatsTable(database);
      this.prepareStatements(database);
    } catch (err) {
      database.close();
      this.clearStatements();
      throw err;
    }
    this.database = database;
    console.log(`Statistics enabled. Using SQLite, writing to ${dbPath}`);
  }

  async close(): Promise<void> {
    this.database?.close();
    this.database = undefined;
    this.clearStatements();
  }

  async recordRuleOutcomes(entries: RuleEntry[]): Promise<void> {
    const database = this.database;
    const insert = this.insertRuleOutcome;
    if (!database || !insert) return;

    try {
      // One transaction for all rows.
      database.transaction(() => {
        for (const entry of entries) {
          insert.run(
            entry.createdAt,
            entry.validationId,
            entry.ruleId,
            entry.outcome,
            entry.severity,
            entry.count,
            entry.rapLpVersion,
          );
        }
      })();
    } catch (err) {
      console.warn('Failed to record statistics:', err instanceof Error ? err.message : err);
    }
  }

  async recordRequest(entry: RequestEntry): Promise<void> {
    const insert = this.insertRequest;
    if (!insert) return;

    try {
      insert.run(
        entry.createdAt,
        entry.method,
        entry.route,
        entry.statusCode,
        entry.durationMs,
        entry.browserFamily,
        entry.osFamily,
      );
    } catch (err) {
      console.warn('Failed to record request:', err instanceof Error ? err.message : err);
    }
  }

  async getRuleSummary(range?: DateRange, onlyViolations = false): Promise<RuleSummary> {
    if (!this.selectRuleSummary || !this.selectValidationCount) {
      return { validations: 0, byRule: [] };
    }

    const params = { from: range?.from ?? null, to: range?.to ?? null };
    const rows = this.selectRuleSummary.all(params) as RuleSummaryRow[];
    const { validations } = this.selectValidationCount.get(params) as { validations: number };

    const byRule = onlyViolations ? rows.filter((row) => row.outcome === 'violation') : rows;
    return { validations, byRule };
  }

  async getRequestSummary(range?: DateRange): Promise<RequestSummaryRow[]> {
    if (!this.selectRequestSummary) return [];
    return this.selectRequestSummary.all({ from: range?.from ?? null, to: range?.to ?? null }) as RequestSummaryRow[];
  }

  async getClientSummary(range?: DateRange): Promise<ClientSummaryRow[]> {
    if (!this.selectClientSummary) return [];
    return this.selectClientSummary.all({ from: range?.from ?? null, to: range?.to ?? null }) as ClientSummaryRow[];
  }

  private prepareStatements(database: Database.Database): void {
    this.insertRuleOutcome = database.prepare(`
      INSERT INTO rule_stats (created_at, validation_id, rule_id, outcome, severity, count, rap_lp_version)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    this.insertRequest = database.prepare(`
      INSERT INTO request_stats
        (created_at, method, route, status_code, duration_ms, browser_family, os_family)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    this.selectRuleSummary = database.prepare(`
      SELECT rule_id AS ruleId, outcome, severity, SUM(count) AS count
      FROM rule_stats
      WHERE (@from IS NULL OR created_at >= @from)
        AND (@to   IS NULL OR created_at <  @to)
      GROUP BY rule_id, outcome, severity
      ORDER BY rule_id ASC, outcome ASC, severity ASC
    `);

    this.selectRequestSummary = database.prepare(`
      SELECT route, method,
      COUNT(*)                                             AS count,
      ROUND(AVG(duration_ms))                              AS avgDurationMs,
      MAX(duration_ms)                                     AS maxDurationMs,
      SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END)  AS errorCount
      FROM request_stats
      WHERE (@from IS NULL OR created_at >= @from)
        AND (@to   IS NULL OR created_at <  @to)
      GROUP BY route, method
      ORDER BY count DESC, route ASC
    `);

    this.selectClientSummary = database.prepare(`
      SELECT browser_family AS browserFamily,
      os_family      AS osFamily,
      COUNT(*)       AS count
      FROM request_stats
      WHERE (@from IS NULL OR created_at >= @from)
        AND (@to   IS NULL OR created_at <  @to)
      GROUP BY browser_family, os_family
      ORDER BY count DESC, browser_family ASC, os_family ASC
    `);

    this.selectValidationCount = database.prepare(`
      SELECT COUNT(DISTINCT validation_id) AS validations
      FROM rule_stats
      WHERE (@from IS NULL OR created_at >= @from)
        AND (@to   IS NULL OR created_at <  @to)
    `);
  }

  private clearStatements(): void {
    this.insertRuleOutcome = undefined;
    this.insertRequest = undefined;
    this.selectRuleSummary = undefined;
    this.selectValidationCount = undefined;
    this.selectRequestSummary = undefined;
    this.selectClientSummary = undefined;
  }
}

function createRuleStatsTable(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS rule_stats (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at      TEXT NOT NULL,
      validation_id   TEXT NOT NULL,
      rule_id         TEXT NOT NULL,
      outcome         TEXT NOT NULL,
      severity        TEXT NOT NULL,
      count           INTEGER NOT NULL,
      rap_lp_version  TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_rule_stats_created_at ON rule_stats (created_at);
  `);
}

function createRequestStatsTable(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS request_stats (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at      TEXT NOT NULL,
      method          TEXT NOT NULL,
      route           TEXT NOT NULL,
      status_code     INTEGER NOT NULL,
      duration_ms     INTEGER NOT NULL,
      browser_family  TEXT NOT NULL,
      os_family       TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_request_stats_created_at ON request_stats (created_at);
  `);
}
