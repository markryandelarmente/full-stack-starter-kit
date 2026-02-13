import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ApiError } from '../lib/errors';
import { logger } from '../lib/logger';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  logger.error(
    {
      err,
      errorName: err.name,
      errorMessage: err.message,
      stack: err.stack,
      method: req.method,
      path: req.path,
      statusCode: err instanceof ApiError ? err.statusCode : 500,
    },
    'Request error'
  );

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'A database error occurred',
      },
    });
    return;
  }

  // Handle validation errors from Zod
  if (err.name === 'ZodError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err,
      },
    });
    return;
  }

  // Handle multer errors
  if (err instanceof multer.MulterError) {
    const multerError = err;
    if (multerError.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'File size exceeds maximum allowed size',
        },
      });
      return;
    }
    if (multerError.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Too many files uploaded',
        },
      });
      return;
    }
    res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: `Upload error: ${multerError.message}`,
      },
    });
    return;
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    },
  });
}
