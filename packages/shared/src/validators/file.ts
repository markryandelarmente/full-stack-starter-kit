import { z } from 'zod';

/**
 * Schema for file metadata updates
 */
export const fileMetadataSchema = z.object({
  metadata: z.record(z.unknown()).optional(),
});

export type FileMetadataInput = z.infer<typeof fileMetadataSchema>;

/**
 * Schema for upload file request (optional metadata)
 */
export const uploadFileSchema = z.object({
  entityType: z.string().min(1).optional(),
  entityId: z.string().min(1).optional(),
  metadata: z.record(z.unknown()).optional(),
  isPrivate: z.coerce.boolean().optional(),
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;
