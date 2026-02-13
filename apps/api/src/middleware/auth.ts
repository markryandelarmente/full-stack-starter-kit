import type { Request, Response, NextFunction } from 'express';
import { auth } from '@repo/auth';
import { ApiError } from '../lib/errors';

// Extend Express Request type
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        image?: string | null;
        emailVerified: boolean;
      };
      session?: {
        id: string;
        userId: string;
        expiresAt: Date;
      };
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as unknown as Headers,
    });

    if (!session?.user) {
      throw new ApiError('UNAUTHORIZED', 'Authentication required', 401);
    }

    req.user = session.user;
    req.session = session.session;

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(new ApiError('UNAUTHORIZED', 'Authentication required', 401));
    }
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as unknown as Headers,
    });

    if (session?.user) {
      req.user = session.user;
      req.session = session.session;
    }

    next();
  } catch {
    // Continue without auth
    next();
  }
}
