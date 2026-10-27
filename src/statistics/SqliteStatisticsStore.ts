// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import * as fs from 'node:fs';
import * as path from 'node:path';
import Database from 'better-sqlite3';
import type { StatisticsStore } from './StatisticsStore.js';
import type { RequestEntry, RuleStatEntry, RuleStatRow } from './statisticsTypes.js';

export class SqliteStatisticsStore implements StatisticsStore {
  private readonly dataDir: string;
  private database: Database.Database | undefined;
  private insertRuleStat: Database.Statement | undefined;
  private insertRequest: Database.Statement | undefined;
  private selectRuleSummary: Database.Statement | undefined;

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
    console.log(`Statistics enabled. Using Sqlite, writing to ${dbPath}`);
  }

  async close(): Promise<void> {
    this.database?.close();
    this.database = undefined;
    this.clearStatements();
  }

  async recordRuleStats(entries: RuleStatEntry[]): Promise<void> {
    const database = this.database;
    const insert = this.insertRuleStat;
    if (!database || !insert) return;

    try {
      // One transaction for all rows.
      database.transaction(() => {
        for (const entry of entries) {
          insert.run(entry.createdAt, entry.ruleId, entry.severity, entry.restApiProfilVersion, entry.rapLpVersion);
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
        entry.visitorHash,
      );
    } catch (err) {
      console.warn('Failed to record request:', err instanceof Error ? err.message : err);
    }
  }

  async getRuleSummary(): Promise<RuleStatRow[]> {
    if (!this.selectRuleSummary) return [];
    return this.selectRuleSummary.all() as RuleStatRow[];
  }

  private prepareStatements(database: Database.Database): void {
    this.insertRuleStat = database.prepare(`
      INSERT INTO rule_stats (created_at, rule_id, severity, rest_api_profil_version, rap_lp_version)
      VALUES (?, ?, ?, ?, ?)
    `);

    this.insertRequest = database.prepare(`
      INSERT INTO request_stats
        (created_at, method, route, status_code, duration_ms, browser_family, os_family, visitor_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.selectRuleSummary = database.prepare(`
      SELECT rule_id AS ruleId, severity, COUNT(*) AS count
      FROM rule_stats
      GROUP BY rule_id, severity
      ORDER BY count DESC, rule_id ASC
    `);
  }

  private clearStatements(): void {
    this.insertRuleStat = undefined;
    this.insertRequest = undefined;
    this.selectRuleSummary = undefined;
  }
}

function createRuleStatsTable(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS rule_stats (
      id                       INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at               TEXT NOT NULL,
      rule_id                  TEXT NOT NULL,
      severity                 TEXT NOT NULL,
      rest_api_profil_version  TEXT NOT NULL,
      rap_lp_version           TEXT NOT NULL
    );
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
      os_family       TEXT NOT NULL,
      visitor_hash    TEXT
    );
  `);
}