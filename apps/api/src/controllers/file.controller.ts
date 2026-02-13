import type { Request, Response } from 'express';
import { fileService } from '../services';
import type { UploadFileOptions } from '../services/file.service';
import { ApiError } from '../lib/errors';

// Multer file type
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

// Extend Express Request to include file(s)
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      file?: MulterFile;
      files?: MulterFile[];
    }
  }
}

/**
 * Upload a single file
 */
export async function uploadSingle(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'No file provided' },
    });
  }

  const { entityType, entityId, metadata, isPrivate } = req.body;
  const uploadedById = req.user?.id;

  // Parse metadata if it's a string, otherwise use as-is
  let parsedMetadata: Record<string, unknown> | undefined;
  if (metadata) {
    if (typeof metadata === 'string') {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch {
        parsedMetadata = undefined;
      }
    } else {
      parsedMetadata = metadata;
    }
  }

  // Parse isPrivate (can be string "true"/"false" from form-data or boolean)
  const parsedIsPrivate = typeof isPrivate === 'string' ? isPrivate === 'true' : Boolean(isPrivate);

  const options: UploadFileOptions = {
    entityType: entityType || undefined,
    entityId: entityId || undefined,
    uploadedById,
    metadata: parsedMetadata,
    isPrivate: parsedIsPrivate,
  };

  const file = await fileService.uploadFile(
    {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    },
    options
  );

  res.json({ success: true, data: file });
}

/**
 * Upload multiple files
 */
export async function uploadMultiple(req: Request, res: Response) {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'No files provided' },
    });
  }

  const { entityType, entityId, metadata, isPrivate } = req.body;
  const uploadedById = req.user?.id;

  // Parse metadata if it's a string, otherwise use as-is
  let parsedMetadata: Record<string, unknown> | undefined;
  if (metadata) {
    if (typeof metadata === 'string') {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch {
        parsedMetadata = undefined;
      }
    } else {
      parsedMetadata = metadata;
    }
  }

  // Parse isPrivate (can be string "true"/"false" from form-data or boolean)
  const parsedIsPrivate = typeof isPrivate === 'string' ? isPrivate === 'true' : Boolean(isPrivate);

  const options: UploadFileOptions = {
    entityType: entityType || undefined,
    entityId: entityId || undefined,
    uploadedById,
    metadata: parsedMetadata,
    isPrivate: parsedIsPrivate,
  };

  const files = await fileService.uploadFiles(
    req.files.map((file) => ({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    })),
    options
  );

  res.json({ success: true, data: files });
}

/**
 * Get file by ID
 * Returns the file record with a presigned URL (all files are private)
 */
export async function getById(req: Request<{ id: string }>, res: Response) {
  // All files are private - always return presigned URL
  const fileWithPresignedUrl = await fileService.getFilePresignedUrl(req.params.id, 3600);

  res.json({ success: true, data: fileWithPresignedUrl });
}

/**
 * Get presigned URL for private file
 */
export async function getPresignedUrl(
  req: Request<{ id: string }, unknown, unknown, { expiresIn?: string }>,
  res: Response
) {
  const expiresIn = req.query.expiresIn ? parseInt(req.query.expiresIn, 10) : 3600;
  const file = await fileService.getFilePresignedUrl(req.params.id, expiresIn);
  res.json({ success: true, data: file });
}

/**
 * Delete file by ID
 * Only the user who uploaded the file can delete it
 */
export async function deleteById(req: Request<{ id: string }>, res: Response) {
  const file = await fileService.getFileById(req.params.id);
  const currentUserId = req.user?.id;

  // Check if user is the uploader
  if (!file.uploadedById || file.uploadedById !== currentUserId) {
    throw ApiError.forbidden('You can only delete files that you uploaded');
  }

  await fileService.deleteFile(req.params.id);
  res.json({ success: true, data: null });
}

/**
 * Update file metadata
 * Only the user who uploaded the file can update its metadata
 */
export async function updateMetadata(req: Request<{ id: string }>, res: Response) {
  const file = await fileService.getFileById(req.params.id);
  const currentUserId = req.user?.id;

  // Check if user is the uploader
  if (!file.uploadedById || file.uploadedById !== currentUserId) {
    throw ApiError.forbidden('You can only update metadata for files that you uploaded');
  }

  const { metadata } = req.body;
  const updatedFile = await fileService.updateFileMetadata(req.params.id, metadata);
  res.json({ success: true, data: updatedFile });
}
