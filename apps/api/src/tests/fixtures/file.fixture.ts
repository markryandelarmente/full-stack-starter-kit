import { faker } from '@faker-js/faker';
import type { File } from '@repo/shared/types';

/**
 * Create a random file fixture with optional overrides
 * @param overrides File overrides
 * @returns File
 */
export function createFileFixture(overrides: Partial<File> = {}): File {
  const timestamp = Date.now();
  const uuid = faker.string.uuid();
  const filename = faker.system.fileName();
  const extension = filename.split('.').pop() || 'txt';
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    png: 'image/png',
    pdf: 'application/pdf',
    txt: 'text/plain',
  };

  return {
    id: faker.string.uuid(),
    originalName: filename,
    mimeType: mimeTypes[extension] || 'application/octet-stream',
    size: faker.number.int({ min: 1000, max: 10000000 }),
    bucket: 'uploads',
    key: `${timestamp}/${uuid}/${filename}`,
    url: `http://localhost:9000/uploads/${timestamp}/${uuid}/${filename}`,
    isPrivate: false,
    entityType: faker.helpers.arrayElement(['User', 'Post', 'Product', null]),
    entityId: faker.string.uuid(),
    uploadedById: faker.string.uuid(),
    metadata: {},
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

/**
 * Create multiple file fixtures
 * @param count Number of files to create
 * @returns Files
 */
export function createFileListFixture(count = 2): File[] {
  return Array.from({ length: count }, () => createFileFixture());
}

/**
 * Create a file buffer for testing
 * @param size File size
 * @returns File buffer
 */
export function createFileBuffer(size = 1024): Buffer {
  return Buffer.alloc(size, 'a');
}
