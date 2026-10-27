// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { Express } from 'express';
import type { StatisticsService } from '../statistics/StatisticsService.js';

export const registerStatsRoutes = (app: Express, statistics?: StatisticsService) => {
  app.get('/api/v1/stats', async (req, res, next) => {
    try {
      res.json(statistics ? await statistics.getStatsSummary() : { enabled: false, total: 0, byRule: [] });
    } catch (err) {
      next(err);
    }
  });
};