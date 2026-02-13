import { vi } from 'vitest';
import type { S3Client } from '@aws-sdk/client-s3';

/**
 * Mock S3 client for testing
 */
export function createMockS3Client() {
  const mockSend = vi.fn();

  const mockClient = {
    send: mockSend,
  } as unknown as S3Client;

  return {
    client: mockClient,
    mockSend,
  };
}

/**
 * Mock S3 functions
 */
export const mockS3Functions = {
  uploadFileToS3: vi.fn(),
  deleteFileFromS3: vi.fn(),
  ensureBucketExists: vi.fn(),
  getFileUrl: vi.fn(),
};
