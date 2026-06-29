// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { Express } from 'express';
import { getStatsSummary } from '../util/statsDb.js';

export const registerStatsRoutes = (app: Express) => {
  app.get('/api/v1/stats', (req, res) => {
    res.json(getStatsSummary());
  });
};
