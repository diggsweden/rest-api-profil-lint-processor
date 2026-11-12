// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { Express, Request } from 'express';
import type { StatisticsService } from '../statistics/StatisticsService.js';

export const registerStatisticsRoutes = (app: Express, statistics?: StatisticsService) => {
  app.get('/api/v1/statistics/rules', async (req, res, next) => {
    try {
      const range = { from: dateParam(req, 'from'), to: dateParam(req, 'to') };
      const onlyViolations = req.query.onlyViolations === 'true';
      res.json(
        statistics
          ? await statistics.getRuleSummary(range, onlyViolations)
          : { enabled: false, range: {}, validations: 0, totalViolations: 0, totalOk: 0, byRule: [] },
      );
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/v1/statistics/requests', async (req, res, next) => {
    try {
      const range = { from: dateParam(req, 'from'), to: dateParam(req, 'to') };
      res.json(
        statistics
          ? await statistics.getRequestsSummary(range)
          : { enabled: false, range: {}, totalRequests: 0, byRoute: [] },
      );
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/v1/statistics/clients', async (req, res, next) => {
    try {
      const range = { from: dateParam(req, 'from'), to: dateParam(req, 'to') };
      res.json(
        statistics
          ? await statistics.getClientsSummary(range)
          : { enabled: false, range: {}, totalRequests: 0, byClient: [] },
      );
    } catch (err) {
      next(err);
    }
  });
};

// Reads ?from=...&to=... as ISO 8601 (UTC). Undefined when missing or invalid.
function dateParam(req: Request, key: 'from' | 'to'): string | undefined {
  const raw = req.query[key];
  return typeof raw === 'string' && !Number.isNaN(Date.parse(raw)) ? new Date(raw).toISOString() : undefined;
}
