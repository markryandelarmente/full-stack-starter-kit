import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { type ZodError, z } from 'zod';
import { errorHandler } from '../../middleware/error-handler';
import { ApiError } from '../../lib/errors';
import { logger } from '../../lib/logger';

// Mock the logger
vi.mock('../../lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Unit Test for errorHandler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Create mock request
    mockRequest = {
      method: 'GET',
      path: '/test',
    };

    // Create mock response with jest.fn() for methods
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    // Create mock next function
    mockNext = vi.fn();

    // Clear logger mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('ApiError handling', () => {
    it('handles ApiError with status code and details', () => {
      const error = ApiError.badRequest('Invalid input', { field: 'email' });

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid input',
          details: { field: 'email' },
        },
      });
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          err: error,
          errorName: 'ApiError',
          errorMessage: 'Invalid input',
          method: 'GET',
          path: '/test',
          statusCode: 400,
        }),
        'Request error'
      );
    });

    it('handles ApiError without details', () => {
      const error = ApiError.notFound('User not found');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
          details: undefined,
        },
      });
      expect(logger.error).toHaveBeenCalled();
    });

    it('handles ApiError with different status codes', () => {
      const error = ApiError.unauthorized('Unauthorized access');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Unauthorized access',
          details: undefined,
        },
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Prisma error handling', () => {
    it('handles PrismaClientKnownRequestError', () => {
      const error = new Error('Prisma error');
      error.name = 'PrismaClientKnownRequestError';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'A database error occurred',
        },
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('ZodError handling', () => {
    it('handles ZodError with validation details', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });

      let zodError: ZodError | undefined;
      try {
        schema.parse({ email: 'invalid', age: 15 });
      } catch (error) {
        zodError = error as ZodError;
      }

      // Ensure error was caught
      expect(zodError).toBeDefined();
      if (!zodError) return;

      errorHandler(zodError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: zodError,
        },
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('MulterError handling', () => {
    it('handles LIMIT_FILE_SIZE error', () => {
      const error = new multer.MulterError('LIMIT_FILE_SIZE');
      error.message = 'File too large';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'File size exceeds maximum allowed size',
        },
      });
      expect(logger.error).toHaveBeenCalled();
    });

    it('handles LIMIT_FILE_COUNT error', () => {
      const error = new multer.MulterError('LIMIT_FILE_COUNT');
      error.message = 'Too many files';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Too many files uploaded',
        },
      });
      expect(logger.error).toHaveBeenCalled();
    });

    it('handles other MulterError types', () => {
      const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
      error.message = 'Unexpected file field';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Upload error: Unexpected file field',
        },
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Default error handling', () => {
    it('handles generic errors in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Something went wrong');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Something went wrong',
        },
      });
      expect(logger.error).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('handles generic errors in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Sensitive error details');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      });
      expect(logger.error).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('handles errors without message in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error();
      error.message = '';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      });
      expect(logger.error).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error priority handling', () => {
    it('prioritizes ApiError over other error types', () => {
      const error = ApiError.badRequest('Custom error');
      // Make it look like it could be a Prisma error too
      error.name = 'PrismaClientKnownRequestError';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Should use ApiError handling, not Prisma handling
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Custom error',
          details: undefined,
        },
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
