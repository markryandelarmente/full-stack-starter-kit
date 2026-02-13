import multer from 'multer';
import type { Request, Response, NextFunction } from 'express';
import { validateServerEnv } from '../env';
import { ApiError } from '../lib/errors';
import { validateFileType } from '../lib/file-utils';

export interface UploadOptions {
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  maxFiles?: number;
  fieldName?: string;
}

/**
 * Create configurable multer middleware for file uploads
 */
export function createUploadMiddleware(
  options: UploadOptions = {}
): (req: Request, res: Response, next: NextFunction) => void {
  const env = validateServerEnv();
  const {
    maxFileSize = env.MAX_FILE_SIZE,
    allowedMimeTypes,
    maxFiles = 1,
    fieldName = maxFiles === 1 ? 'file' : 'files',
  } = options;

  // Configure storage (memory storage for small files)
  const storage = multer.memoryStorage();

  // File filter
  const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Validate file type if restrictions are set
    if (allowedMimeTypes && allowedMimeTypes.length > 0) {
      if (!validateFileType(file.mimetype, allowedMimeTypes)) {
        return cb(
          ApiError.invalidFileType(
            `File type ${file.mimetype} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`
          )
        );
      }
    }

    cb(null, true);
  };

  // Create multer instance
  const upload = multer({
    storage,
    limits: {
      fileSize: maxFileSize,
      files: maxFiles,
    },
    fileFilter,
  });

  // Return appropriate middleware based on maxFiles
  if (maxFiles === 1) {
    return upload.single(fieldName);
  } else {
    return upload.array(fieldName, maxFiles);
  }
}

/**
 * Middleware to handle multer errors
 */
export function handleUploadError(err: Error, _req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(ApiError.fileTooLarge('File size exceeds maximum allowed size'));
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(ApiError.badRequest('Too many files uploaded'));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(ApiError.badRequest('Unexpected file field'));
    }
    return next(ApiError.badRequest(`Upload error: ${err.message}`));
  }

  if (err instanceof ApiError) {
    return next(err);
  }

  return next(ApiError.uploadFailed('File upload failed', { error: err.message }));
}
