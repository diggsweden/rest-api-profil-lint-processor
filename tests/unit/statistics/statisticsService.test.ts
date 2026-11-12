// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { StatisticsService } from '../../../src/statistics/StatisticsService.js';
import { expect, describe, it } from '@jest/globals';
import type { StatisticsStore } from '../../../src/statistics/StatisticsStore.js';
import type { Request, Response } from 'express';
import type { ValidationResponseDto } from '../../../src/model/ValidationResponseDto.js';
import type {
  ClientSummaryRow,
  RequestEntry,
  RequestSummaryRow,
  RuleEntry,
  RuleSummary,
  RuleSummaryRow,
} from '../../../src/statistics/statisticsTypes.js';
import { translator } from '../../../src/i18n.js';

/** In-memory store used to test the service without a database. */
class InMemoryStatisticsStore implements StatisticsStore {
  ruleEntries: RuleEntry[][] = [];
  requestEntries: RequestEntry[] = [];
  validations = 0;
  ruleSummary: RuleSummaryRow[] = [];
  requestSummary: RequestSummaryRow[] = [];
  clientSummary: ClientSummaryRow[] = [];

  constructor(private readonly fail: { failInit?: boolean; failClose?: boolean; failRead?: boolean } = {}) {}

  async init(): Promise<void> {
    if (this.fail.failInit) throw new Error('init failed');
  }
  async close(): Promise<void> {
    if (this.fail.failClose) throw new Error('close failed');
  }
  async recordRuleOutcomes(entries: RuleEntry[]): Promise<void> {
    this.ruleEntries.push(entries);
  }
  async recordRequest(entry: RequestEntry): Promise<void> {
    this.requestEntries.push(entry);
  }
  async getRuleSummary(): Promise<RuleSummary> {
    if (this.fail.failRead) throw new Error('read failed');
    return { validations: this.validations, byRule: this.ruleSummary };
  }
  async getRequestSummary(): Promise<RequestSummaryRow[]> {
    if (this.fail.failRead) throw new Error('read failed');
    return this.requestSummary;
  }
  async getClientSummary(): Promise<ClientSummaryRow[]> {
    if (this.fail.failRead) throw new Error('read failed');
    return this.clientSummary;
  }
}

function buildRequest(headers: Record<string, string | string[]> = {}): Request {
  return { headers, method: 'GET', route: { path: '/api/v1/test' } } as unknown as Request;
}

function buildResponse(
  statusCode = 200,
  locals: Record<string, unknown> = { statsStart: process.hrtime.bigint() },
): Response {
  return { statusCode, locals } as unknown as Response;
}

const USER_AGENTS = {
  chromeWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36',
  firefoxLinux: 'Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0',
  edgeWindows: 'Mozilla/5.0 (Windows NT 10.0) Chrome/155.0 Safari/537.36 Edg/155.0',
  edgeAndroid: 'Mozilla/5.0 (Linux; Android 14) Chrome/155.0 Mobile Safari/537.36 EdgA/155.0',
  edgeIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605 EdgiOS/155.0 Mobile/15E148',
  firefoxIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605 FxiOS/130.0 Mobile/15E148',
  chromeIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605 CriOS/155.0 Mobile/15E148',
  safariMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605 Version/17.0 Safari/605.1.15',
  unknownBrowser: 'Mozilla/5.0 (compatible; SomeOldBrowser/1.0)',
  curl: 'curl/8.5.0',
  iPad: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)',
  chromeOs: 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0)',
};

const RAP_LP_VERSION = '2.1.0';
const LOCALE = 'sv';
const t = translator(LOCALE);

describe('StatisticsService', () => {
  /**
   * Statistics should be disabled by default
   * Preconditions: env RAP_LP_STATISTICS_ENABLED is not set
   */
  it('is disabled by default', () => {
    const isEnabledInEnv = StatisticsService.isStatisticsEnabled();

    expect(isEnabledInEnv).toBe(false);
  });

  /**
   * A failed init disables statistics
   * Preconditions: store.init() throws
   */
  it('stays disabled when store.init() fails, without throwing', async () => {
    const store = new InMemoryStatisticsStore({ failInit: true });
    const service = new StatisticsService(store, RAP_LP_VERSION);

    await expect(service.start()).resolves.toBeUndefined();
    service.recordRequest(buildRequest(), buildResponse());
    const summary = await service.getRequestsSummary();
    const clientsSummary = await service.getClientsSummary();

    expect(store.requestEntries).toHaveLength(0);
    expect(summary.enabled).toEqual(false);
    expect(clientsSummary.enabled).toBe(false);
  });

  /**
   * stop() closes the store and disables statistics
   * Preconditions: start() has succeeded
   */
  it('closes the store and stops recording after stop()', async () => {
    const store = new InMemoryStatisticsStore();
    const service = new StatisticsService(store, RAP_LP_VERSION);
    const validationResult = {
      result: [{ id: 'r1', severity: 'ERROR' }],
      report: [],
    } as unknown as ValidationResponseDto;

    await service.start();
    await service.stop();
    service.recordRequest(buildRequest(), buildResponse());
    service.recordValidationResult(validationResult, LOCALE);

    expect(store.requestEntries).toHaveLength(0);
    expect(store.ruleEntries).toHaveLength(0);
  });

  /**
   * stop() does not throw when store.close() fails
   */
  it('does not throw when store.close() fails', async () => {
    const store = new InMemoryStatisticsStore({ failClose: true });
    const service = new StatisticsService(store, RAP_LP_VERSION);

    await service.start();

    await expect(service.stop()).resolves.toBeUndefined();
  });

  /**
   * Statistics are not available before start()
   * Preconditions: start() has not been called
   */
  it('is disabled before start() has been called', async () => {
    const store = new InMemoryStatisticsStore();
    const service = new StatisticsService(store, RAP_LP_VERSION);
    const validationResult = {
      result: [{ id: 'r1', severity: 'ERROR' }],
      report: [],
    } as unknown as ValidationResponseDto;

    // should not be returned, start() has not been called
    store.ruleSummary = [{ ruleId: 'r1', outcome: 'violation', severity: 'error', count: 3 }];
    service.recordRequest(buildRequest(), buildResponse());
    service.recordValidationResult(validationResult, LOCALE);
    const statsSummary = await service.getRuleSummary();

    expect(store.ruleEntries).toHaveLength(0);
    expect(store.requestEntries).toHaveLength(0);
    expect(statsSummary.validations).toBe(0);
    expect(statsSummary.totalViolations).toBe(0);
    expect(statsSummary.byRule).toHaveLength(0);
  });

  /**
   * recordValidationResult lowercases severity and sets a shared timestamp
   * Preconditions: start() has succeeded
   */
  it('lowercases severity and uses one timestamp for all rules', async () => {
    const store = new InMemoryStatisticsStore();
    const service = new StatisticsService(store, RAP_LP_VERSION);
    const validationResult = {
      result: [
        { id: 'r1', severity: 'ERROR' },
        { id: 'r2', severity: 'WARNING' },
      ],
      report: [
        {
          rules: [
            { id: 'r1', status: t('common.ruleStatus.notOk') },
            { id: 'r2', status: t('common.ruleStatus.notOk') },
          ],
        },
      ],
    } as unknown as ValidationResponseDto;

    await service.start();
    service.recordValidationResult(validationResult, LOCALE);

    const [entries] = store.ruleEntries;
    expect(entries.map((e) => e.severity)).toEqual(['error', 'warning']);
    expect(new Set(entries.map((e) => e.createdAt)).size).toBe(1);
    expect(entries.map((e) => e.ruleId)).toEqual(['r1', 'r2']);
    expect(entries[0]).toMatchObject({ ruleId: 'r1', rapLpVersion: RAP_LP_VERSION });
  });

  /**
   * An empty rule list should not reach the store
   */
  it('does not call the store for an empty rule list', async () => {
    const store = new InMemoryStatisticsStore();
    const service = new StatisticsService(store, RAP_LP_VERSION);
    const validationResult = {
      result: [],
      report: [],
    } as unknown as ValidationResponseDto;

    await service.start();
    service.recordValidationResult(validationResult, LOCALE);

    expect(store.ruleEntries).toHaveLength(0);
  });

  /**
   * All rows from one recordValidationResult call share a validationId, different calls get different ones
   */
  it('uses one validationId per call and a new one for the next call', async () => {
    const store = new InMemoryStatisticsStore();
    const service = new StatisticsService(store, RAP_LP_VERSION);
    const validationResult = {
      result: [
        { id: 'r1', severity: 'ERROR' },
        { id: 'r2', severity: 'WARNING' },
      ],
      report: [
        {
          rules: [
            { id: 'r1', status: t('common.ruleStatus.notOk') },
            { id: 'r2', status: t('common.ruleStatus.notOk') },
          ],
        },
      ],
    } as unknown as ValidationResponseDto;

    await service.start();
    service.recordValidationResult(validationResult, LOCALE);
    service.recordValidationResult(validationResult, LOCALE);

    const [[a, b], [c, d]] = store.ruleEntries.map((call) => call.map((entry) => entry.validationId));

    expect(a).toBe(b); // call 1: same validationId
    expect(c).toBe(d); // call 2: same validationId
    expect(c).not.toBe(a); // call 1 and 2: different validationIds
  });

  /**
   * Several violations of the same rule are summed into one row
   * Preconditions: DOK.18 is violated three times in one validation
   */
  it('sums several violations of the same rule into one row', async () => {
    const store = new InMemoryStatisticsStore();
    const service = new StatisticsService(store, RAP_LP_VERSION);
    const validationResult = {
      result: [
        { id: 'DOK.18', severity: 'ERROR' },
        { id: 'DOK.18', severity: 'ERROR' },
        { id: 'DOK.18', severity: 'ERROR' },
      ],
      report: [{ rules: [{ id: 'DOK.18', status: t('common.ruleStatus.notOk') }] }],
    } as unknown as ValidationResponseDto;

    await service.start();
    service.recordValidationResult(validationResult, LOCALE);

    const [entries] = store.ruleEntries;
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ ruleId: 'DOK.18', outcome: 'violation', severity: 'error', count: 3 });
  });

  /**
   * Passed rules in the report become one row each, rules with other status than OK are skipped
   * Preconditions: start() has succeeded
   */
  it('records passed rules from the report and skips other statuses', async () => {
    const store = new InMemoryStatisticsStore();
    const service = new StatisticsService(store, RAP_LP_VERSION);
    const validationResult = {
      result: [],
      report: [
        {
          rules: [
            { id: 'AME.01', status: t('common.ruleStatus.ok') },
            { id: 'AME.02', status: t('common.ruleStatus.ok') },
          ],
        },
        { rules: [{ id: 'DOK.01', status: t('common.ruleStatus.notApplicable') }] },
      ],
    } as unknown as ValidationResponseDto;

    await service.start();
    service.recordValidationResult(validationResult, LOCALE);

    const [entries] = store.ruleEntries;
    expect(entries.map((e) => e.ruleId)).toEqual(['AME.01', 'AME.02']); // DOK.01 (N/A) is skipped
    expect(entries.map((e) => e.outcome)).toEqual(['ok', 'ok']);
    expect(entries.map((e) => e.severity)).toEqual(['none', 'none']);
    expect(entries.map((e) => e.count)).toEqual([1, 1]);
  });

  /**
   * Rule statuses are recognized in the locale of the request
   * Preconditions: the report is created in English
   */
  it('recognizes rule statuses in the locale of the request', async () => {
    const store = new InMemoryStatisticsStore();
    const service = new StatisticsService(store, RAP_LP_VERSION);
    const en = translator('en');
    const validationResult = {
      result: [],
      report: [{ rules: [{ id: 'AME.01', status: en('common.ruleStatus.notOk') }] }],
    } as unknown as ValidationResponseDto;

    await service.start();
    service.recordValidationResult(validationResult, 'en');

    const [entries] = store.ruleEntries;
    expect(store.ruleEntries).toHaveLength(1);
    expect(entries.map((e) => e.outcome)).toEqual(['violation']);
  });

  /**
   * recordRequest builds the correct RequestEntry
   * Preconditions: UserAgent Chrome on Windows
   */
  it('builds a RequestEntry with parsed browser and os', async () => {
    const store = new InMemoryStatisticsStore();
    const service = new StatisticsService(store, RAP_LP_VERSION);

    await service.start();
    const req = buildRequest({
      'user-agent': USER_AGENTS.chromeWindows,
    });
    service.recordRequest(req, buildResponse(304));

    const [entry] = store.requestEntries;
    expect(entry).toMatchObject({
      method: 'GET',
      route: '/api/v1/test',
      statusCode: 304,
      browserFamily: 'chrome',
      osFamily: 'windows',
    });
  });

  /**
   * Without a user-agent, the client is classified as non_browser and the OS as other
   * Preconditions: no headers
   */
  it('classifies a missing user-agent as non_browser with os other', async () => {
    const store = new InMemoryStatisticsStore();
    const service = new StatisticsService(store, RAP_LP_VERSION);
    await service.start();

    service.recordRequest(buildRequest({}), buildResponse());

    const [entry] = store.requestEntries;
    expect(entry.browserFamily).toBe('non_browser');
    expect(entry.osFamily).toBe('other');
  });

  /**
   * getRuleSummary sums rule validations from the store's rows
   */
  it('computes totals from the store summary', async () => {
    const store = new InMemoryStatisticsStore();
    store.ruleSummary = [
      { ruleId: 'r1', outcome: 'violation', severity: 'error', count: 3 },
      { ruleId: 'r2', outcome: 'violation', severity: 'warn', count: 2 },
      { ruleId: 'r1', outcome: 'ok', severity: 'none', count: 10 },
    ];
    store.validations = 4;

    const service = new StatisticsService(store, RAP_LP_VERSION);
    await service.start();

    await expect(service.getRuleSummary()).resolves.toEqual({
      enabled: true,
      range: {},
      validations: 4,
      totalViolations: 5,
      totalOk: 10,
      byRule: store.ruleSummary,
    });
  });

  /**
   * getRequestsSummary sums totalRequests and echoes the range
   */
  it('computes totalRequests for requests and echoes the range', async () => {
    const store = new InMemoryStatisticsStore();
    store.requestSummary = [
      { route: '/a', method: 'GET', count: 5, avgDurationMs: 5, maxDurationMs: 9, errorCount: 0 },
    ];
    const range = { from: '2026-10-01T00:00:00.000Z' };
    const service = new StatisticsService(store, RAP_LP_VERSION);
    await service.start();

    await expect(service.getRequestsSummary(range)).resolves.toEqual({
      enabled: true,
      range,
      totalRequests: 5,
      byRoute: store.requestSummary,
    });
  });

  /**
   * getClientsSummary sums totalRequests and echoes the range
   */
  it('computes totalRequests for clients and echoes the range', async () => {
    const store = new InMemoryStatisticsStore();
    store.clientSummary = [
      { browserFamily: 'chrome', osFamily: 'windows', count: 4 },
      { browserFamily: 'non_browser', osFamily: 'other', count: 1 },
    ];
    const service = new StatisticsService(store, RAP_LP_VERSION);
    await service.start();
    const range = { to: '2026-11-01T00:00:00.000Z' };

    await expect(service.getClientsSummary(range)).resolves.toEqual({
      enabled: true,
      range,
      totalRequests: 5,
      byClient: store.clientSummary,
    });
  });

  /**
   * Both summaries return empty lists with enabled true when reading fails
   */
  it('returns empty summaries when the store read fails', async () => {
    const store = new InMemoryStatisticsStore({ failRead: true });
    const service = new StatisticsService(store, RAP_LP_VERSION);
    await service.start();

    await expect(service.getRuleSummary()).resolves.toEqual({
      enabled: true,
      range: {},
      validations: 0,
      totalViolations: 0,
      totalOk: 0,
      byRule: [],
    });
    await expect(service.getRequestsSummary()).resolves.toEqual({
      enabled: true,
      range: {},
      totalRequests: 0,
      byRoute: [],
    });
    await expect(service.getClientsSummary()).resolves.toEqual({
      enabled: true,
      range: {},
      totalRequests: 0,
      byClient: [],
    });
  });

  /**
   * parseBrowser and parseOs: every branch
   */
  it.each([
    [USER_AGENTS.edgeWindows, 'edge', 'windows'],
    [USER_AGENTS.edgeAndroid, 'edge', 'android'],
    [USER_AGENTS.edgeIos, 'edge', 'ios'],
    [USER_AGENTS.firefoxLinux, 'firefox', 'linux'],
    [USER_AGENTS.firefoxIos, 'firefox', 'ios'],
    [USER_AGENTS.chromeWindows, 'chrome', 'windows'],
    [USER_AGENTS.chromeIos, 'chrome', 'ios'],
    [USER_AGENTS.safariMac, 'safari', 'macos'],
    [USER_AGENTS.unknownBrowser, 'other', 'other'],
    [USER_AGENTS.curl, 'non_browser', 'other'],
    [USER_AGENTS.iPad, 'other', 'ios'],
    [USER_AGENTS.chromeOs, 'other', 'linux'],
  ])('%s -> browser %s, os %s', async (userAgent, browser, os) => {
    const entry = await recordWithHeaders({ 'user-agent': userAgent });

    expect(entry.browserFamily).toBe(browser);
    expect(entry.osFamily).toBe(os);
  });
});

async function recordWithHeaders(headers: Record<string, string | string[]>) {
  const store = new InMemoryStatisticsStore();
  const service = new StatisticsService(store, RAP_LP_VERSION);
  await service.start();
  service.recordRequest(buildRequest(headers), buildResponse());
  return store.requestEntries[0];
}
