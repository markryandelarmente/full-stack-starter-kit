import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { createRateLimiter } from '../../middleware/rate-limiter';

vi.mock('../../lib/redis', () => ({
  getRedisClient: vi.fn().mockResolvedValue(null),
}));

describe('Unit Test for rate limiter', () => {
  let rateLimiter: (req: Request, res: Response, next: NextFunction) => void;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    const savedMax = process.env.RATE_LIMIT_MAX;
    const savedWindow = process.env.RATE_LIMIT_WINDOW_MS;
    process.env.RATE_LIMIT_MAX = '2';
    process.env.RATE_LIMIT_WINDOW_MS = '60000';

    rateLimiter = await createRateLimiter();

    process.env.RATE_LIMIT_MAX = savedMax;
    process.env.RATE_LIMIT_WINDOW_MS = savedWindow;

    mockRequest = {
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' } as Request['socket'],
      method: 'GET',
      path: '/api/test',
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('when under the limit', () => {
    it('calls next() without error for requests under max', async () => {
      const runMiddleware = () =>
        new Promise<void>((resolve, reject) => {
          const next: NextFunction = (err?: unknown) => {
            if (err) reject(err);
            else resolve();
          };
          rateLimiter(mockRequest as Request, mockResponse as Response, next);
        });

      await runMiddleware();
      await runMiddleware();

      expect(mockResponse.status).not.toHaveBeenCalledWith(429);
    });
  });

  describe('when over the limit', () => {
    it('returns 429 with JSON error body matching API format', async () => {
      const runMiddleware = () =>
        new Promise<void>((resolve, reject) => {
          const next: NextFunction = (err?: unknown) => {
            if (err) reject(err);
            else resolve();
          };
          rateLimiter(mockRequest as Request, mockResponse as Response, next);
        });

      await runMiddleware();
      await runMiddleware();
      await expect(runMiddleware()).rejects.toMatchObject({
        statusCode: 429,
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests',
      });
    });
  });
});
