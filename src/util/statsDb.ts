// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import * as fs from 'node:fs';
import * as path from 'node:path';
import Database from 'better-sqlite3';

export type RuleStat = {
  ruleId: string;
  severity: string;
};

export type StatVersions = {
  restApiProfilVersion: string;
  rapLpVersion: string;
};

const dataDir = process.env.RAP_LP_DATA_DIR ?? '/app/data';
const dbPath = path.join(dataDir, 'statistics.db');

let db: Database.Database | undefined;
let disabled = false;

function getDb(): Database.Database | undefined {
  if (db || disabled) {
    return db;
  }

  try {
    fs.mkdirSync(dataDir, { recursive: true });
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS rule_stats (
        id                       INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at               TEXT NOT NULL,
        rule_id                  TEXT NOT NULL,
        severity                 TEXT NOT NULL,
        rest_api_profil_version  TEXT NOT NULL,
        rap_lp_version           TEXT NOT NULL
      );
    `);
    console.log(`Statistics enabled. Writing to ${dbPath}`);
    return db;
  } catch (err) {
    disabled = true;
    console.warn(`Statistics disabled (could not open ${dbPath}):`, err instanceof Error ? err.message : err);
    return undefined;
  }
}

export function recordRuleStats(rules: RuleStat[], versions: StatVersions): void {
  if (rules.length === 0) {
    return;
  }

  const database = getDb();
  if (!database) {
    return;
  }

  try {
    const insert = database.prepare(`
      INSERT INTO rule_stats (created_at, rule_id, severity, rest_api_profil_version, rap_lp_version)
      VALUES (?, ?, ?, ?, ?)
    `);
    const createdAt = new Date().toISOString();
    for (const rule of rules) {
      insert.run(
        createdAt,
        rule.ruleId,
        rule.severity.toLowerCase(),
        versions.restApiProfilVersion,
        versions.rapLpVersion,
      );
    }
  } catch (err) {
    console.warn('Failed to record statistics:', err instanceof Error ? err.message : err);
  }
}

export type RuleStatRow = {
  ruleId: string;
  severity: string;
  count: number;
};

export type StatsSummary = {
  enabled: boolean;
  total: number;
  byRule: RuleStatRow[];
};

export function getStatsSummary(): StatsSummary {
  const database = getDb();
  if (!database) {
    return { enabled: false, total: 0, byRule: [] };
  }

  try {
    const byRule = database
      .prepare(
        `SELECT rule_id AS ruleId, severity, COUNT(*) AS count
         FROM rule_stats
         GROUP BY rule_id, severity
         ORDER BY count DESC, rule_id ASC`,
      )
      .all() as RuleStatRow[];
    const total = byRule.reduce((sum, row) => sum + row.count, 0);
    return { enabled: true, total, byRule };
  } catch (err) {
    console.warn('Failed to read statistics:', err instanceof Error ? err.message : err);
    return { enabled: false, total: 0, byRule: [] };
  }
}
