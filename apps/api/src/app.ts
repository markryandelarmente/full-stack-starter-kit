import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { auth, toNodeHandler } from '@repo/auth';
import { apiRouter } from './routes';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { createRateLimiter } from './middleware/rate-limiter';
import { getHealthStatus } from './services/health.service';

export async function createApp(corsOrigin?: string): Promise<express.Application> {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigin ?? '*',
      credentials: true,
    })
  );

  // Request logging
  app.use(requestLogger);

  // Rate limiting (Redis when REDIS_URL set, in-memory otherwise)
  const rateLimiter = await createRateLimiter();
  app.use(rateLimiter);

  // Health check
  app.get('/health', async (_req, res) => {
    const health = await getHealthStatus();
    res.json(health);
  });

  // Auth routes - handle all /api/auth/* routes
  app.all('/api/auth/*splat', toNodeHandler(auth));

  // Body parsing middleware
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // API routes
  app.use('/api', apiRouter);

  // Error handling
  app.use(errorHandler);

  return app;
}
