import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { filesRouter } from '../../routes/files';
import { errorHandler } from '../../middleware/error-handler';
import { createTestUser, prisma } from '../helpers';
import { createFileBuffer } from '../fixtures';
import { uploadFileToS3, deleteFileFromS3, getPresignedUrl } from '../../lib/s3';

// Mock S3 functions
vi.mock('../../lib/s3', () => ({
  uploadFileToS3: vi.fn(),
  deleteFileFromS3: vi.fn(),
  ensureBucketExists: vi.fn(),
  getFileUrl: vi.fn(),
  getPresignedUrl: vi.fn(),
  getS3Client: vi.fn(),
}));

// Mock auth middleware for testing
const mockUserId = 'user-123';

vi.mock('../../middleware/auth', () => ({
  requireAuth: vi.fn((req, _res, next) => {
    req.user = {
      id: mockUserId,
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: true,
    };
    next();
  }),
  optionalAuth: vi.fn((_req, _res, next) => next()),
}));

// Create test app
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/files', filesRouter);
  app.use(errorHandler);
  return app;
}

describe('Integration Test for files API routes', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
    // Mock S3 upload to return a URL
    vi.mocked(uploadFileToS3).mockResolvedValue('http://localhost:9000/uploads/test.jpg');
    vi.mocked(deleteFileFromS3).mockResolvedValue();
    vi.mocked(getPresignedUrl).mockResolvedValue('http://localhost:9000/uploads/presigned-url');
  });

  describe('POST /api/files', () => {
    describe('Success Scenario', () => {
      it('uploads single file successfully', async () => {
        const user = await createTestUser({ id: mockUserId });
        const fileBuffer = createFileBuffer(1024);

        const response = await request(app)
          .post('/api/files')
          .attach('file', fileBuffer, 'test.jpg')
          .field('entityType', 'User')
          .field('entityId', user.id);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          originalName: 'test.jpg',
          entityType: 'User',
          entityId: user.id,
          uploadedById: user.id,
        });
        expect(uploadFileToS3).toHaveBeenCalled();
      });

      it('uploads file with metadata', async () => {
        await createTestUser({ id: mockUserId });
        const fileBuffer = createFileBuffer(1024);
        const metadata = JSON.stringify({ description: 'Test file' });

        const response = await request(app)
          .post('/api/files')
          .attach('file', fileBuffer, 'test.jpg')
          .field('metadata', metadata);

        expect(response.status).toBe(200);
        expect(response.body.data.metadata).toBeDefined();
      });
    });

    describe('Error Scenario', () => {
      it('returns 400 when no file provided', async () => {
        const response = await request(app).post('/api/files');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('BAD_REQUEST');
      });

      it('returns error when file size exceeds limit', async () => {
        // This would be handled by multer, but we can test the error response
        const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

        const response = await request(app)
          .post('/api/files')
          .attach('file', largeBuffer, 'large.jpg');

        // Multer will reject this before it reaches our controller
        expect(response.status).toBeGreaterThanOrEqual(400);
      });
    });
  });

  describe('POST /api/files/multiple', () => {
    describe('Success Scenario', () => {
      it('uploads multiple files successfully', async () => {
        const user = await createTestUser({ id: mockUserId });
        const file1 = createFileBuffer(1024);
        const file2 = createFileBuffer(2048);

        const response = await request(app)
          .post('/api/files/multiple')
          .attach('files', file1, 'test1.jpg')
          .attach('files', file2, 'test2.png')
          .field('entityType', 'User')
          .field('entityId', user.id);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(2);
        expect(uploadFileToS3).toHaveBeenCalledTimes(2);
      });
    });

    describe('Error Scenario', () => {
      it('returns 400 when no files provided', async () => {
        const response = await request(app).post('/api/files/multiple');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('GET /api/files/:id', () => {
    describe('Success Scenario', () => {
      it('returns file by id', async () => {
        // Create user first to satisfy foreign key constraint
        await createTestUser({ id: mockUserId });

        const file = await prisma.file.create({
          data: {
            originalName: 'test.jpg',
            mimeType: 'image/jpeg',
            size: 1024,
            bucket: 'uploads',
            key: 'test-key',
            url: 'http://localhost:9000/uploads/test-key',
            uploadedById: mockUserId,
          },
        });

        const response = await request(app).get(`/api/files/${file.id}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(file.id);
        expect(response.body.data.originalName).toBe('test.jpg');
      });
    });

    describe('Error Scenario', () => {
      it('returns 404 when file not found', async () => {
        const response = await request(app).get('/api/files/non-existent-id');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('FILE_NOT_FOUND');
      });
    });
  });

  describe('GET /api/files/:id/presigned', () => {
    describe('Success Scenario', () => {
      it('returns presigned URL for private file', async () => {
        await createTestUser({ id: mockUserId });

        const file = await prisma.file.create({
          data: {
            originalName: 'private.jpg',
            mimeType: 'image/jpeg',
            size: 1024,
            bucket: 'uploads',
            key: 'private-key',
            url: 'http://localhost:9000/uploads/private-key',
            isPrivate: true,
            uploadedById: mockUserId,
          },
        });

        const response = await request(app).get(`/api/files/${file.id}/presigned`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(file.id);
        expect(response.body.data.isPrivate).toBe(true);
        expect(response.body.data.url).toBe('http://localhost:9000/uploads/presigned-url');
        expect(getPresignedUrl).toHaveBeenCalledWith('uploads', 'private-key', 3600);
      });

      it('returns regular URL for public file', async () => {
        await createTestUser({ id: mockUserId });

        const file = await prisma.file.create({
          data: {
            originalName: 'public.jpg',
            mimeType: 'image/jpeg',
            size: 1024,
            bucket: 'uploads',
            key: 'public-key',
            url: 'http://localhost:9000/uploads/public-key',
            isPrivate: false,
            uploadedById: mockUserId,
          },
        });

        // Clear mocks to get accurate call count
        vi.clearAllMocks();

        const response = await request(app).get(`/api/files/${file.id}/presigned`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(file.id);
        expect(response.body.data.isPrivate).toBe(false);
        expect(response.body.data.url).toBe('http://localhost:9000/uploads/public-key');
        // Should not call getPresignedUrl for public files
        expect(getPresignedUrl).toHaveBeenCalledTimes(0);
      });

      it('accepts custom expiresIn query parameter', async () => {
        await createTestUser({ id: mockUserId });

        const file = await prisma.file.create({
          data: {
            originalName: 'private.jpg',
            mimeType: 'image/jpeg',
            size: 1024,
            bucket: 'uploads',
            key: 'private-key',
            url: 'http://localhost:9000/uploads/private-key',
            isPrivate: true,
            uploadedById: mockUserId,
          },
        });

        const response = await request(app).get(`/api/files/${file.id}/presigned?expiresIn=7200`);

        expect(response.status).toBe(200);
        expect(getPresignedUrl).toHaveBeenCalledWith('uploads', 'private-key', 7200);
      });
    });

    describe('Error Scenario', () => {
      it('returns 404 when file not found', async () => {
        const response = await request(app).get('/api/files/non-existent-id/presigned');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('FILE_NOT_FOUND');
      });
    });
  });

  describe('DELETE /api/files/:id', () => {
    describe('Success Scenario', () => {
      it('deletes file successfully', async () => {
        // Create user first to satisfy foreign key constraint
        await createTestUser({ id: mockUserId });

        const file = await prisma.file.create({
          data: {
            originalName: 'test.jpg',
            mimeType: 'image/jpeg',
            size: 1024,
            bucket: 'uploads',
            key: 'test-key',
            url: 'http://localhost:9000/uploads/test-key',
            uploadedById: mockUserId,
          },
        });

        const response = await request(app).delete(`/api/files/${file.id}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(deleteFileFromS3).toHaveBeenCalledWith('uploads', 'test-key');

        // Verify deleted from database
        const dbFile = await prisma.file.findUnique({ where: { id: file.id } });
        expect(dbFile).toBeNull();
      });
    });

    describe('Error Scenario', () => {
      it('returns 404 when file not found', async () => {
        const response = await request(app).delete('/api/files/non-existent-id');

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe('FILE_NOT_FOUND');
      });
    });
  });

  describe('PATCH /api/files/:id/metadata', () => {
    describe('Success Scenario', () => {
      it('updates file metadata', async () => {
        // Create user first to satisfy foreign key constraint
        await createTestUser({ id: mockUserId });

        const file = await prisma.file.create({
          data: {
            originalName: 'test.jpg',
            mimeType: 'image/jpeg',
            size: 1024,
            bucket: 'uploads',
            key: 'test-key',
            url: 'http://localhost:9000/uploads/test-key',
            uploadedById: mockUserId,
            metadata: {},
          },
        });

        const response = await request(app)
          .patch(`/api/files/${file.id}/metadata`)
          .send({ metadata: { description: 'Updated description' } });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.metadata).toEqual({ description: 'Updated description' });
      });
    });

    describe('Error Scenario', () => {
      it('returns 404 when file not found', async () => {
        const response = await request(app)
          .patch('/api/files/non-existent-id/metadata')
          .send({ metadata: {} });

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe('FILE_NOT_FOUND');
      });
    });
  });
});
