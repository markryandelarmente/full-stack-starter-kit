import { type Router as RouterType, Router } from 'express';
import { fileController } from '../controllers';
import { requireAuth } from '../middleware/auth';
import { createUploadMiddleware } from '../middleware/upload';
import { validate } from '../lib/validate';
import { fileMetadataSchema } from '@repo/shared/validators';

export const filesRouter: RouterType = Router();

// POST /api/files - Single file upload
filesRouter.post(
  '/',
  requireAuth,
  createUploadMiddleware({ maxFiles: 1, fieldName: 'file' }),
  fileController.uploadSingle
);

// POST /api/files/multiple - Multiple file upload
filesRouter.post(
  '/multiple',
  requireAuth,
  createUploadMiddleware({ maxFiles: 10, fieldName: 'files' }),
  fileController.uploadMultiple
);

// GET /api/files/:id/presigned - Get presigned URL for private file
filesRouter.get('/:id/presigned', requireAuth, fileController.getPresignedUrl);

// GET /api/files/:id - Get file by ID
filesRouter.get('/:id', requireAuth, fileController.getById);

// DELETE /api/files/:id - Delete file
filesRouter.delete('/:id', requireAuth, fileController.deleteById);

// PATCH /api/files/:id/metadata - Update file metadata
filesRouter.patch(
  '/:id/metadata',
  requireAuth,
  validate(fileMetadataSchema, 'body'),
  fileController.updateMetadata
);
