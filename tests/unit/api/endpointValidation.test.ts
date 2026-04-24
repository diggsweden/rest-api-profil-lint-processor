// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

/**
* CONTRACT TESTS for /api/v1/validation/validatespec
* - NOTE:
* - The router is FULLY mocked
* - No real imports is to validateUtil / Spectral
* - This only tests HTTP + JSON contracts
 */

import request from 'supertest';
import express from 'express';

/**
 * Mocked router – interprets base64 + strict
 */
jest.mock('../../../src/routes/validate.js', () => ({
  registerValidationRoutes: (app: any) => {
    app.post('/api/v1/validation/validatespec', (req, res) => {
      const { spec, strict } = req.body;

      let raw = '';
      try {
        raw = Buffer.from(spec, 'base64').toString('utf8');
      } catch {
        return res.status(400).json({
          type: 'about:blank',
          title: 'Specification parse error',
          status: 400,
          kind: 'spec-parse',
        });
      }

      // Parser error (broken YAML)
      if (raw.includes(':::')) {
        return res.status(400).json({
          type: 'about:blank',
          title: 'Specification parse error',
          status: 400,
          detail: 'Unexpected token',
          kind: 'spec-parse',
          line: 3,
          column: 5,
        });
      }

      // Strict validation (missing info.version)
      if (strict && raw.includes('info:') && !raw.includes('version:')) {
        return res.status(400).json({
          type: 'about:blank',
          title: 'Specification validation failed',
          status: 400,
          kind: 'spec-validation',
          issues: [
            {
              type: 'Semantic',
              path: 'info',
              message: 'Missing required property version',
              line: 2,
            },
          ],
        });
      }
    const invalidPathsScalar =
      /paths:\s*\n\s*\/\s*(\n|$)/m.test(raw);
      
      // Violation (synthetic)
      if (invalidPathsScalar) {
        if (strict) {
          return res.status(400).json({
            type: 'about:blank',
            title: 'Rule validation failed',
            status: 400,
            kind: 'rule-validation',
            payload: {
              result: [{ id: 'FOR.02', område: 'Förutsättningar', allvarlighetsgrad: 'ERROR' }],
              report: [{"Notering":"Ej Godkända regler - RAP-LP","regler":[{"id":"FOR.02","område":"Förutsättningar","status":"EJ OK"}]}],
            },
          });
        }

        // strict=false 
        return res.status(200).json({
          ok: true,
          payload: {
              report: [{"Notering":"Godkända regler - RAP-LP","regler":[{"id":"FOR.02","område":"Förutsättningar","status":"OK"}]}],
          },
        });
      }

      // Fully ok
      return res.status(200).json({
        ok: true,
        payload: {
          result: [],
          report: [{ summary: 'All rules passed' }],
        },
      });
    });
  },
}));

//Import routes
import { registerValidationRoutes } from '../../../src/routes/validate.js';

describe('POST /api/v1/validation/validatespec – contract check', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    registerValidationRoutes(app);
  });

  const encode = (s: string) => Buffer.from(s).toString('base64');

  it('200 - valid spec, no rule violations', async () => {
    const yaml = `
openapi: 3.0.0
info:
  version: 1.0.0
  title: ok
paths: {}
`;
    const res = await request(app)
      .post('/api/v1/validation/validatespec')
      .send({ spec: encode(yaml), strict: true });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('400 – spec-parse error', async () => {
    //Broken yaml
    const yaml = `openapi: ::: broken`;
    const res = await request(app)
      .post('/api/v1/validation/validatespec')
      .send({ spec: encode(yaml), strict: true });

    expect(res.status).toBe(400);
    expect(res.body.kind).toBe('spec-parse');
  });

  it('400 – strict validation error', async () => {
    //No version in YAML
    const yaml = `
openapi: 3.0.0
info:
  title: missing version
paths: {}
`;
    const res = await request(app)
      .post('/api/v1/validation/validatespec')
      .send({ spec: encode(yaml), strict: true });

    expect(res.status).toBe(400);
    expect(res.body.kind).toBe('spec-validation');
    expect(res.body.issues[0].path).toBe('info');
  });

  it('400 – rule validation error', async () => {
    const yaml = `
openapi: 3.0.0
info:
  version: 1.0.0
paths:
  /
`;
    const res = await request(app)
      .post('/api/v1/validation/validatespec')
      .send({ spec: encode(yaml), strict: true });

    expect(res.status).toBe(400);
    expect(res.body.kind).toBe('rule-validation');
  });

  it('200 – strict=false tillåter regelbrott', async () => {
    const yaml = `
openapi: 3.0.0
info:
  version: 1.0.0
paths:
  /
`;
    const res = await request(app)
      .post('/api/v1/validation/validatespec')
      .send({ spec: encode(yaml), strict: false });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

