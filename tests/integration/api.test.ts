// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import request from 'supertest';
import { readFileSync } from 'node:fs';
import type { Server } from 'node:http';
import path from 'node:path';
import { startServer } from '../../src/api-mode.js';

describe('API Test', () => {
  let server: Server;
  const originalPort = process.env.RAP_LP_PORT;

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

 it('returns a validation report for a valid OpenAPI specification', async () => {
   const data = readFileSync(path.resolve('tests/testdata/valid-api.yaml'));

   const response = await request(server)
     .post('/api/v1/validation/validatespec')
     .send({
       spec: data.toString('base64'),
       categories: [],
       strict: true,
     });

   expect(response.status).toBe(200);

   const report = response.body.payload?.report;

   expect(Array.isArray(report)).toBe(true);

   const rules = report.flatMap((group: { rules: unknown[] }) => group.rules);

   expect(rules).toHaveLength(55);
   const ruleIds = rules.map((rule: { id: string }) => rule.id);
   expect(ruleIds).toContain('DOK.15');
   expect(ruleIds).toContain('SPA.02');
   expect(ruleIds).toContain('UFN.01');
 });

  it('returns 400 for an invalid OpenAPI specification', async () => {
    const data = readFileSync(path.resolve('apis/dok-api.yaml'));

    const response = await request(server)
      .post('/api/v1/validation/validatespec')
      .send({
        spec: data.toString('base64'),
        categories: [],
      });

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      status: 400,
      kind: 'spec-validation',
      stage: 'strict',
    });

    expect(response.body.issues.length).toBeGreaterThan(0);
  });
});