// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

/**
* CONTRACT TESTS for /api/v1/validation/url
* - NOTE:
* - The router is FULLY mocked
* - No real imports is to validateUtil / Spectral
* - This only tests HTTP + JSON contracts
 */

import request from 'supertest';
import express from 'express';

/**
 * Mockad router för /url endpoint
 */
jest.mock('../../../src/routes/urlValidation.js', () => ({
  registerUrlValidationRoutes: (app: any) => {
    app.post('/api/v1/validation/url', (req, res) => {
      const { url, strict } = req.body;

      // Saknad URL
      if (!url) {
        return res.status(400).json({
          type: 'about:blank',
          title: 'Invalid Request',
          status: 400,
          detail: 'Required field missing: url',
        });
      }

      // Ogiltig URL / SSRF simulering
      if (url.includes('forbidden')) {
        return res.status(400).json({
          type: 'about:blank',
          title: 'Invalid Request',
          status: 400,
          detail: 'The requested address did not meet the allowed URL pattern. Please contact your administrator if you believe this is a mistake.',
        });
      }

      //Fetch-fel
      if (url.includes('unreachable')) {
        return res.status(400).json({
          type: 'about:blank',
          title: 'Invalid Request',
          status: 400,
          detail: 'The requested URL could not be fetched. Redirects are not allowed.',
        });
      }

      // HTTP-fel - t
      if (url.includes('404')) {
        return res.status(400).json({
          type: 'about:blank',
          title: 'Invalid Request',
          status: 400,
          detail: 'The requested URL returned HTTP 404.',
        });
      }

      // Strict validation error
      if (url.includes('bad-spec')) {
        return res.status(400).json({
          type: 'https://raplp.digg.se/problems/semantic-validation',
          title: 'Rule validation failed',
          status: 400,
          kind: 'spec-validation',
          stage: 'strict',
          format: 'yaml',
          issues: [
            {
              type: 'Structural',
              message: 'Missing required property version',
              line: 2,
            },
          ],
          snippet: 'line 2: missing version',
        });
      }

      // Rule violation
      if (url.includes('rule-error')) {
        if (strict !== false) {
          return res.status(400).json({
            type: 'https://raplp.digg.se/problems/rule-validation',
            title: 'Rule validation failed',
            status: 400,
            kind: 'rule-validation',
            stage: 'rule-engine',
            format: 'yaml',
            payload: {
              result: [{ ruleId: 'FOR.02', severity: 'ERROR' }],
              report: [{ summary: 'Rule violation' }],
            },
          });
        }

        // strict=false → tillåt
        return res.status(200).json({
          ok: true,
          stage: 'rule-engine',
          format: 'yaml',
          payload: {
            result: [{ ruleId: 'FOR.02', severity: 'ERROR' }],
            report: [{ summary: 'Rules evaluated' }],
          },
        });
      }

      // OK
      return res.status(200).json({
        ok: true,
        stage: 'rule-engine',
        format: 'yaml',
        payload: {
          result: [],
          report: [{ summary: 'All rules passed' }],
        },
      });
    });
  },
}));

import { registerUrlValidationRoutes } from '../../../src/routes/urlValidation.js';

describe('POST /api/v1/validation/url – kontrakt', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    registerUrlValidationRoutes(app);
  });

  it('400 - Missing url', async () => {
    const res = await request(app)
      .post('/api/v1/validation/url')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.detail).toContain('url');
  });

  it('400 - Invalid URL (regex/SSRF)', async () => {
    const res = await request(app)
      .post('/api/v1/validation/url')
      .send({ url: 'http://forbidden.com' });

    expect(res.status).toBe(400);
  });

  it('400 - fetch error', async () => {
    const res = await request(app)
      .post('/api/v1/validation/url')
      .send({ url: 'http://unreachable.com' });

    expect(res.status).toBe(400);
  });

  it('400 - HTTP error', async () => {
    const res = await request(app)
      .post('/api/v1/validation/url')
      .send({ url: 'http://example.com/404' });

    expect(res.status).toBe(400);
  });

  it('400 - strict validation error', async () => {
    const res = await request(app)
      .post('/api/v1/validation/url')
      .send({ url: 'http://example.com/bad-spec', strict: true });

    expect(res.status).toBe(400);
    expect(res.body.kind).toBe('spec-validation');
  });

  it('400 - rule validation error', async () => {
    const res = await request(app)
      .post('/api/v1/validation/url')
      .send({ url: 'http://example.com/rule-error', strict: true });

    expect(res.status).toBe(400);
    expect(res.body.kind).toBe('rule-validation');
  });

  it('200 - strict=false allow rule violations', async () => {
    const res = await request(app)
      .post('/api/v1/validation/url')
      .send({ url: 'http://example.com/rule-error', strict: false });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('200 - full OK', async () => {
    const res = await request(app)
      .post('/api/v1/validation/url')
      .send({ url: 'http://example.com/good' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
