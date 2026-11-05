// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import request from 'supertest';
import type { Server } from 'node:http';
import { startServer } from '../../src/api-mode.js';
import { jest } from '@jest/globals';

describe('API locale integration', () => {
  let server: Server;
  const originalPort = process.env.RAP_LP_PORT;

  let errorSpy: jest.SpiedFunction<typeof console.error>;
  let logSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
    logSpy.mockRestore();
  });

  beforeAll(async () => {
    process.env.RAP_LP_PORT = '0';
    server = await startServer({});
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
    

    if (originalPort === undefined) {
      delete process.env.RAP_LP_PORT;
    } else {
      process.env.RAP_LP_PORT = originalPort;
    }
  });
  

  it('localizes API validation errors and sends Vary', async () => {
    const en = await request(server)
      .post('/api/v1/validation/validatespec')
      .set('Accept-Language', 'en')
      .send({});

    const unsupported = await request(server)
      .post('/api/v1/validation/validatespec')
      .set('Accept-Language', 'de')
      .send({});

    const missing = await request(server)
      .post('/api/v1/validation/validatespec')
      .send({});

    expect(en.body).toMatchObject({
      title: 'Invalid request',
      detail: 'Required field missing: spec',
    });

    expect(unsupported.body).toMatchObject({
      title: 'Ogiltig begäran',
      detail: 'Obligatoriskt fält saknas: spec',
    });

    expect(missing.body).toMatchObject({
      title: 'Ogiltig begäran',
      detail: 'Obligatoriskt fält saknas: spec',
    });

    expect(en.headers.vary).toContain('Accept-Language');
  });

  it('does not duplicate DOK.15 in localized API reports', async () => {
    // Minimal OpenAPI-specifikation utan operationer som matchar given
    const spec = ['openapi: 3.0.3', 'info:', '  title: DOK.15 regression test', '  version: 1.0.0', 'paths: {}'].join(
      '\n',
    );

    const encodedSpec = Buffer.from(spec).toString('base64');

    const validate = async (language: string) => {
      const response = await request(server)
        .post('/api/v1/validation/validatespec')
        .set('Accept-Language', language)
        .send({
          spec: encodedSpec,
          strict: false,
        });

      expect(response.status).toBe(400);
      expect(response.body.payload?.report).toBeDefined();

      const rules = response.body.payload?.report?.flatMap((group: { rules: any[] }) => group.rules) ?? [];

      return {
        dok15: rules.filter((rule: { id: string }) => rule.id === 'DOK.15'),
        total: rules.length,
      };
    };

    const sv = await validate('sv');
    const en = await validate('en');

    expect(sv.dok15).toHaveLength(1);
    expect(en.dok15).toHaveLength(1);

    expect(en.total).toBe(sv.total);

    expect(sv.dok15[0].area).toBe('Dokumentation');
    expect(en.dok15[0].area).toBe('Dokumentation');

    expect(sv.dok15[0].status).toBe('N/A');
    expect(en.dok15[0].status).toBe('N/A');
  });
});