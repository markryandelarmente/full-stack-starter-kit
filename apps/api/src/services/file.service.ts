import { fileRepository } from '../repositories';
import type { File } from '@repo/shared/types';
import { ApiError } from '../lib/errors';
import { uploadFileToS3, deleteFileFromS3, getPresignedUrl } from '../lib/s3';
import { generateFileKey } from '../lib/file-utils';
import { validateServerEnv } from '../env';
import type { Prisma } from '@repo/db';
import { logger } from '../lib/logger';
export interface UploadFileOptions {
  entityType?: string;
  entityId?: string;
  uploadedById?: string;
  metadata?: Record<string, unknown>;
  isPrivate?: boolean;
}

export interface UploadFileInput {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

/**
 * Upload a single file to S3 and create database record
 * @param file File to upload
 * @param options Upload options
 * @returns Uploaded file
 */
export async function uploadFile(
  file: UploadFileInput,
  options: UploadFileOptions = {}
): Promise<File> {
  const env = validateServerEnv();
  const { entityType, entityId, uploadedById, metadata, isPrivate = false } = options;

  // Generate unique key for S3
  const key = generateFileKey(file.originalname);
  const bucket = env.S3_BUCKET_NAME;

  try {
    // Upload to S3 with the isPrivate flag from options
    const url = await uploadFileToS3(bucket, key, file.buffer, file.mimetype, isPrivate);

    // Create database record with the isPrivate value from options
    return await fileRepository.create({
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      bucket,
      key,
      url,
      isPrivate, // Use the isPrivate value from options
      entityType: entityType || null,
      entityId: entityId || null,
      uploadedBy: uploadedById ? { connect: { id: uploadedById } } : undefined,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : {},
    });
  } catch (error) {
    throw ApiError.uploadFailed('Failed to upload file', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Upload multiple files
 * @param files Files to upload
 * @param options Upload options
 * @returns Uploaded files
 */
export async function uploadFiles(
  files: UploadFileInput[],
  options: UploadFileOptions = {}
): Promise<File[]> {
  return Promise.all(files.map((file) => uploadFile(file, options)));
}

/**
 * Get file by ID
 * @param id File ID
 * @returns File
 */
export async function getFileById(id: string): Promise<File> {
  const file = await fileRepository.findById(id);
  if (!file) {
    throw ApiError.fileNotFound('File not found');
  }
  return file;
}

/**
 * Get presigned URL for file access
 * For public files, returns the direct URL. For private files, generates a presigned URL.
 * @param id File ID
 * @param expiresIn Expiration time in seconds (default: 1 hour)
 * @returns File record with URL (direct for public, presigned for private)
 */
export async function getFilePresignedUrl(id: string, expiresIn = 3600): Promise<File> {
  const file = await getFileById(id);

  // If file is public, return the existing URL (no presigned URL needed)
  if (!file.isPrivate) {
    return file;
  }

  // For private files, generate presigned URL
  const presignedUrl = await getPresignedUrl(file.bucket, file.key, expiresIn);

  return {
    ...file,
    url: presignedUrl,
  };
}

/**
 * Delete file from S3 and database
 * @param id File ID
 * @returns void
 */
export async function deleteFile(id: string): Promise<void> {
  const file = await getFileById(id); // Verify exists

  try {
    // Delete from S3
    await deleteFileFromS3(file.bucket, file.key);

    // Delete from database
    await fileRepository.deleteById(id);
  } catch (error) {
    throw ApiError.deleteFailed('Failed to delete file', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Delete all files for an entity
 * @param entityType Entity type
 * @param entityId Entity ID
 * @returns void
 */
export async function deleteFilesByEntity(entityType: string, entityId: string): Promise<void> {
  const files = await fileRepository.findByEntity(entityType, entityId);

  // Delete all files from S3 and database
  await Promise.all(
    files.map(async (file) => {
      try {
        await deleteFileFromS3(file.bucket, file.key);
      } catch (error) {
        logger.error({ fileId: file.id, error }, 'Failed to delete file from S3');
      }
    })
  );

  // Delete all records from database
  await fileRepository.deleteByEntity(entityType, entityId);
}

/**
 * Update file metadata
 * @param id File ID
 * @param metadata Metadata
 * @returns File
 */
export async function updateFileMetadata(
  id: string,
  metadata: Record<string, unknown>
): Promise<File> {
  await getFileById(id); // Verify exists
  return fileRepository.update(id, {
    metadata: metadata ? (metadata as Prisma.InputJsonValue) : {},
  });
}
