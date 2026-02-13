import type { PaginationParams } from '@repo/shared';

const BASE_KEY = 'files';

export const fileQueryKeys = {
  files: (params?: PaginationParams) => [BASE_KEY, params] as const,
  file: (id: string) => [BASE_KEY, id] as const,
  presignedUrl: (id: string) => [BASE_KEY, id, 'presigned'] as const,
} as const;

export type FileQueryKeys = typeof fileQueryKeys;
