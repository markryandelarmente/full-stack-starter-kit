import type { Request, Response, NextFunction } from 'express';
import { type ZodSchema, ZodError } from 'zod';
import { ApiError } from './errors';

type ValidationTarget = 'body' | 'query' | 'params';

// Extend Express Request to include validated data
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      validated?: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
    }
  }
}

export function validate<T>(
  schema: ZodSchema<T>,
  target: ValidationTarget = 'body'
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req[target]);
      
      // Store validated data in req.validated (Express 5 makes req.query read-only)
      req.validated = req.validated || {};
      req.validated[target] = data;
      
      // For body and params, we can still assign directly
      if (target === 'body') {
        req.body = data;
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new ApiError('VALIDATION_ERROR', 'Validation failed', 400, {
            errors: error.flatten().fieldErrors,
          })
        );
      } else {
        next(error);
      }
    }
  };
}
