// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2
import type { Request, Response } from 'express';
import { StatisticsService } from '../../src/statistics/StatisticsService.js';
import type { StatisticsStore } from '../../src/statistics/StatisticsStore.js';
import type { RequestEntry, RuleStatEntry, RuleStatRow } from '../../src/statistics/statisticsTypes.js';
import { expect, describe, it  } from '@jest/globals';

/** In-memory store used to test the service without a database. */
class InMemoryStatisticsStore  implements StatisticsStore {
  initCalls = 0;
  closeCalls = 0;
  ruleEntries: RuleStatEntry[][] = [];
  requestEntries: RequestEntry[] = [];
  summary: RuleStatRow[] = [];

  constructor(private readonly fail: { init?: boolean; close?: boolean } = {}) {}

  async init(): Promise<void> {
    this.initCalls++;
    if (this.fail.init) throw new Error('init failed');
  }
  async close(): Promise<void> {
    this.closeCalls++;
    if (this.fail.close) throw new Error('close failed');
  }
  async recordRuleStats(entries: RuleStatEntry[]): Promise<void> {
    this.ruleEntries.push(entries);
  }
  async recordRequest(entry: RequestEntry): Promise<void> {
    this.requestEntries.push(entry);
  }
  async getRuleSummary(): Promise<RuleStatRow[]> {
    return this.summary;
  }
}

function buildRequest(headers: Record<string, string | string[]> = {}, ip = '10.0.0.1'): Request {
  return { headers, method: 'GET', route: { path: '/api/v1/test' }, ip } as unknown as Request;
}

function buildResponse(statusCode = 200, locals: Record<string, unknown> = { statsStart: process.hrtime.bigint() }): Response {
  return { statusCode, locals } as unknown as Response;
}

const versions = { restApiProfilVersion: '1.0.0', rapLpVersion: '2.0.0' };

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

describe('StatisticsService', () => {
  /**
   * isStatisticsEnabled is disabled by default
   * Preconditions: RAP_LP_STATISTICS_ENABLED is not set
   */
  it('returns a boolean from isStatisticsEnabled', () => {
    const isEnabledInEnv = StatisticsService.isStatisticsEnabled();

    expect(isEnabledInEnv).toBe(false);
    expect(typeof isEnabledInEnv).toBe('boolean');
  });

  /**
   * A failed init disables statistics
   * Preconditions: store.init() throws
   */
  it('stays disabled when store.init() fails, without throwing', async () => {
    const store = new InMemoryStatisticsStore({ init: true });
    const service = new StatisticsService(store);

    await expect(service.start()).resolves.toBeUndefined();
    service.recordRequest(buildRequest(), buildResponse());

    expect(store.requestEntries).toHaveLength(0);
  });

  /**
   * stop() closes the store and disables statistics
   * Preconditions: start() has succeeded
   */
  it('closes the store and stops recording after stop()', async () => {
    const store = new InMemoryStatisticsStore();
    const service = new StatisticsService(store);
    await service.start();

    await service.stop();
    service.recordRequest(buildRequest(), buildResponse());
    service.recordRuleStats([{ ruleId: 'r1', severity: 'error' }], versions);

    expect(store.closeCalls).toBe(1);
    expect(store.requestEntries).toHaveLength(0);
    expect(store.ruleEntries).toHaveLength(0);
  });

  /**
   * Statistics are not available before start()
   * Preconditions: start() has not been called
   */
  it('StatisticsService is disabled before start() has been called', async () => {
    const store = new InMemoryStatisticsStore();
    const service = new StatisticsService(store);
    // should not be retuned, start() have'not been called.
    store.summary = [{ ruleId: 'r1', severity: 'error', count: 3 }];

    service.recordRequest(buildRequest(), buildResponse());
    service.recordRuleStats([{ ruleId: 'r1', severity: 'error' }], versions);
    const statsSummary = await service.getStatsSummary();

    expect(store.ruleEntries).toHaveLength(0);
    expect(store.requestEntries).toHaveLength(0);
    expect(statsSummary.total).toBe(0);
    expect(statsSummary.byRule).toHaveLength(0);
  });

  /**
   * recordRuleStats lowercases severity and sets a shared timestamp
   * Preconditions: start() has succeeded
   */
  it('lowercases severity and uses one timestamp for all rules', async () => {
    const store = new InMemoryStatisticsStore();
    const service = new StatisticsService(store);
    await service.start();

    service.recordRuleStats(
      [
        { ruleId: 'r1', severity: 'ERROR' },
        { ruleId: 'r2', severity: 'Warn' },
      ],
      versions,
    );
    await Promise.resolve();

    const [entries] = store.ruleEntries;
    expect(entries.map((e) => e.severity)).toEqual(['error', 'warn']);
    expect(new Set(entries.map((e) => e.createdAt)).size).toBe(1);
    expect(entries[0]).toMatchObject({ ruleId: 'r1', ...versions });
  });

  /**
   * An empty rule list should not reach the store
   */
  it('does not call the store for an empty rule list', async () => {
    const store = new InMemoryStatisticsStore();
    const service = new StatisticsService(store);
    await service.start();

    service.recordRuleStats([], versions);

    expect(store.ruleEntries).toHaveLength(0);
  });

  /**
   * recordRequest builds the correct RequestEntry
   * Preconditions: Chrome on Windows, X-Forwarded-For set
   */
  it('builds a RequestEntry with parsed browser, os and a visitor hash', async () => {
    const store = new InMemoryStatisticsStore();
    const service = new StatisticsService(store);
    await service.start();

    const req = buildRequest({
      'user-agent': USER_AGENTS.chromeWindows,
      'x-forwarded-for': '203.0.113.7, 10.1.2.3',
    });
    service.recordRequest(req, buildResponse(304));
    await Promise.resolve();

    const [entry] = store.requestEntries;
    expect(entry).toMatchObject({
      method: 'GET',
      route: '/api/v1/test',
      statusCode: 304,
      browserFamily: 'chrome',
      osFamily: 'windows',
    });
    expect(entry.visitorHash).toMatch(/^[0-9a-f]{32}$/);
  });

  /**
   * Visitor hash is stable for the same client
   * Preconditions: same first IP in X-Forwarded-For and same user-agent
   */
  it('gives the same hash for the same client', async () => {
    const store = new InMemoryStatisticsStore();
    const service = new StatisticsService(store);
    await service.start();
    const ua = { 'user-agent': USER_AGENTS.chromeWindows };

    service.recordRequest(buildRequest({ ...ua, 'x-forwarded-for': '203.0.113.7' }), buildResponse());
    service.recordRequest(buildRequest({ ...ua, 'x-forwarded-for': '203.0.113.7, 10.9.9.9' }), buildResponse());
    await Promise.resolve();

    const [first, second] = store.requestEntries.map((e) => e.visitorHash);
    expect(first).not.toBeNull();
    expect(first).toBe(second);
  });

  /**
   * Visitor hash differs between clients
   * Preconditions: different IPs in X-Forwarded-For, same user-agent
   */
  it('gives different hashes for different clients', async () => {
    const store = new InMemoryStatisticsStore();
    const service = new StatisticsService(store);
    await service.start();
    const ua = { 'user-agent': USER_AGENTS.firefoxLinux };

    service.recordRequest(buildRequest({ ...ua, 'x-forwarded-for': '203.0.113.7' }), buildResponse());
    service.recordRequest(buildRequest({ ...ua, 'x-forwarded-for': '198.51.100.9' }), buildResponse());
    await Promise.resolve();

    const [first, second] = store.requestEntries.map((e) => e.visitorHash);
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(first).not.toBe(second);
  });

  /**
   * Without X-Forwarded-For, req.ip is used for the visitor hash
   * Preconditions: no X-Forwarded-For, different req.ip, same user-agent
   */
  it('falls back to req.ip when X-Forwarded-For is missing', async () => {
    const store = new InMemoryStatisticsStore();
    const service = new StatisticsService(store);
    await service.start();
    const ua = { 'user-agent': USER_AGENTS.firefoxLinux };

    service.recordRequest(buildRequest(ua, '192.0.2.1'), buildResponse());
    service.recordRequest(buildRequest(ua, '192.0.2.2'), buildResponse());
    await Promise.resolve();

    const [first, second] = store.requestEntries.map((e) => e.visitorHash);
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(first).not.toBe(second);
  });

  /**
   * Without a user-agent, the client is classified as non_browser and the OS as other
   * Preconditions: no headers at all
   */
  it('classifies a missing user-agent as non_browser with os other', async () => {
    const store = new InMemoryStatisticsStore();
    const service = new StatisticsService(store);
    await service.start();

    service.recordRequest(buildRequest({}, '192.0.2.1'), buildResponse());
    await Promise.resolve();

    const [entry] = store.requestEntries;
    expect(entry.browserFamily).toBe('non_browser');
    expect(entry.osFamily).toBe('other');
  });

  /**
   * getStatsSummary sums the total from the store's rows
   */
  it('computes total from the store summary', async () => {
    const store = new InMemoryStatisticsStore();
    store.summary = [
      { ruleId: 'r1', severity: 'error', count: 3 },
      { ruleId: 'r2', severity: 'warn', count: 2 },
    ];
    const service = new StatisticsService(store);
    await service.start();

    await expect(service.getStatsSummary()).resolves.toEqual({
      enabled: true,
      total: 5,
      byRule: store.summary,
    });
  });

  async function recordWithHeaders(headers: Record<string, string | string[]>, ip = '10.0.0.1') {
    const store = new InMemoryStatisticsStore();
    const service = new StatisticsService(store);
    await service.start();
    service.recordRequest(buildRequest(headers, ip), buildResponse());
    await Promise.resolve();
    return store.requestEntries[0];
  }

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

  /**
   * clientAddress: a header given as an array gives the same hash as a string
   */
  it('uses the first address when X-Forwarded-For is an array of headers', async () => {
    const fromArray = await recordWithHeaders({
      'user-agent': USER_AGENTS.firefoxLinux,
      'x-forwarded-for': ['203.0.113.7', '10.9.9.9'],
    });
    const fromString = await recordWithHeaders({
      'user-agent': USER_AGENTS.firefoxLinux,
      'x-forwarded-for': '203.0.113.7',
    });

    expect(fromArray.visitorHash).not.toBeNull();
    expect(fromArray.visitorHash).toBe(fromString.visitorHash);
  });

  /**
   * clientAddress: an empty header falls back to req.ip
   */
  it('falls back to req.ip when X-Forwarded-For is an empty string', async () => {
    const emptyHeader = await recordWithHeaders(
      { 'user-agent': USER_AGENTS.firefoxLinux, 'x-forwarded-for': '' },
      '192.0.2.1',
    );
    const withoutHeader = await recordWithHeaders({ 'user-agent': USER_AGENTS.firefoxLinux }, '192.0.2.1');

    expect(emptyHeader.visitorHash).toBe(withoutHeader.visitorHash);
  });
});