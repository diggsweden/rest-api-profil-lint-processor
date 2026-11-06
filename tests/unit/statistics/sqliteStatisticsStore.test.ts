// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { SqliteStatisticsStore } from '../../../src/statistics/SqliteStatisticsStore.js';
import type { RequestEntry, RuleEntry } from '../../../src/statistics/statisticsTypes.js';

const rule = (validationId: string, createdAt: string, outcome: 'ok' | 'violation'): RuleEntry => ({
  validationId,
  createdAt,
  ruleId: 'r1',
  outcome,
  severity: outcome === 'ok' ? 'none' : 'error',
  rapLpVersion: '2.0.0',
});

const request = (createdAt: string, statusCode: number, durationMs: number): RequestEntry => ({
  createdAt,
  method: 'GET',
  route: '/api/v1/statistics/rules',
  statusCode,
  durationMs,
  browserFamily: 'chrome',
  osFamily: 'windows',
});

describe('SqliteStatisticsStore', () => {
  let dataDir: string;
  let store: SqliteStatisticsStore;

  beforeEach(async () => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rap-lp-stats-'));
    store = new SqliteStatisticsStore(dataDir);
    await store.init();
  });

  afterEach(async () => {
    await store.close();
    fs.rmSync(dataDir, { recursive: true, force: true });
  });

  it('summarizes rule rows and counts distinct validations', async () => {
    await store.recordRuleOutcomes([rule('v1', '2026-10-10T10:00:00.000Z', 'ok'), rule('v1', '2026-10-10T10:00:00.000Z', 'violation')]);
    await store.recordRuleOutcomes([rule('v2', '2026-10-10T10:00:00.000Z', 'ok')]);

    await expect(store.getRuleSummary()).resolves.toEqual({
      validations: 2,
      byRule: [
        { ruleId: 'r1', outcome: 'ok', severity: 'none', count: 2 },
        { ruleId: 'r1', outcome: 'violation', severity: 'error', count: 1 },
      ],
    });
  });

  it('returns only violations when onlyViolations is true', async () => {
    await store.recordRuleOutcomes([rule('v1', '2026-10-10T10:00:00.000Z', 'ok'), rule('v1', '2026-10-10T10:00:00.000Z', 'violation')]);

    const summary = await store.getRuleSummary(undefined, true);

    expect(summary.validations).toBe(1);
    expect(summary.byRule.map((row) => row.outcome)).toEqual(['violation']);
  });

  it('includes from and excludes to', async () => {
    await store.recordRuleOutcomes([rule('v1', '2026-10-01T00:00:00.000Z', 'ok')]); // on from: included
    await store.recordRuleOutcomes([rule('v2', '2026-11-01T00:00:00.000Z', 'ok')]); // on to: excluded

    const summary = await store.getRuleSummary({ from: '2026-10-01T00:00:00.000Z', to: '2026-11-01T00:00:00.000Z' });

    expect(summary.validations).toBe(1);
  });

  it('summarizes requests per route with average, max and errors', async () => {
    await store.recordRequest(request('2026-10-10T10:00:00.000Z', 200, 10));
    await store.recordRequest(request('2026-10-10T10:01:00.000Z', 500, 30));

    await expect(store.getRequestSummary()).resolves.toEqual([
      { route: '/api/v1/statistics/rules', method: 'GET', count: 2, avgDurationMs: 20, maxDurationMs: 30, errorCount: 1 },
    ]);
  });

  it('summarizes requests per browser and os', async () => {
    await store.recordRequest(request('2026-10-10T10:00:00.000Z', 200, 10));

    await expect(store.getClientSummary()).resolves.toEqual([{ browserFamily: 'chrome', osFamily: 'windows', count: 1 }]);
  });
});