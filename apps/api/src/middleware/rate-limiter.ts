import type { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { validateServerEnv } from '../env';
import { getRedisClient } from '../lib/redis';
import { ApiError } from '../lib/errors';

/**
 * Creates the rate limiter middleware. When REDIS_URL is set, uses Redis store;
 * otherwise uses in-memory store. Must be awaited before use.
 */
export async function createRateLimiter(): Promise<RequestHandler> {
  const env = validateServerEnv();
  const windowMs = env.RATE_LIMIT_WINDOW_MS;
  const max = env.RATE_LIMIT_MAX;

  const baseOptions = {
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Parameters<RequestHandler>[0]) =>
      req.ip ?? (req.socket?.remoteAddress as string) ?? 'unknown',
    handler: (
      _req: Parameters<RequestHandler>[0],
      _res: Parameters<RequestHandler>[1],
      next: Parameters<RequestHandler>[2]
    ) => {
      next(ApiError.tooManyRequests());
    },
  };

  const redisClient = await getRedisClient();
  if (redisClient) {
    return rateLimit({
      ...baseOptions,
      store: new RedisStore({
        sendCommand: (...args: string[]) => redisClient.sendCommand(args),
      }),
    });
  }

  return rateLimit(baseOptions);
}
