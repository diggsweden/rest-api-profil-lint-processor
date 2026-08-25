import { Express } from 'express';
import { register } from '../metrics.js';

export const registerHealthRoutes = (app: Express) => {
  app.get('/health/live', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/health/ready', async (_req, res) => {
    try {
      // Check dependencies here if needed:
      // await db.query("SELECT 1");

      res.status(200).json({ status: 'ready' });
    } catch {
      res.status(503).json({ status: 'not_ready' });
    }
  });

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
};
