import { Express } from 'express';
import { register } from '../metrics.js';

export const registerHealthRoutes = (app: Express) => {
  app.get('/health/live', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
};
