import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fileService from '../../services/file.service';
import { fileRepository } from '../../repositories';
import { uploadFileToS3, deleteFileFromS3 } from '../../lib/s3';
import { createFileFixture, createFileBuffer } from '../fixtures';
import { ApiError } from '../../lib/errors';

// Mock S3 functions
vi.mock('../../lib/s3', () => ({
  uploadFileToS3: vi.fn(),
  deleteFileFromS3: vi.fn(),
  ensureBucketExists: vi.fn(),
  getFileUrl: vi.fn(),
  getPresignedUrl: vi.fn(),
}));

// Mock file repository - match the namespace export structure
vi.mock('../../repositories', () => ({
  fileRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    findByEntity: vi.fn(),
    deleteById: vi.fn(),
    deleteByEntity: vi.fn(),
    countByEntity: vi.fn(),
    update: vi.fn(),
  },
}));

describe('Unit Test for fileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadFile', () => {
    describe('Success Scenario', () => {
      it('uploads file to S3 and creates database record', async () => {
        const fileBuffer = createFileBuffer(1024);
        const fileInput = {
          buffer: fileBuffer,
          originalname: 'test.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
        };

        const mockFileRecord = createFileFixture({
          originalName: 'test.jpg',
          mimeType: 'image/jpeg',
          size: 1024,
        });

        vi.mocked(uploadFileToS3).mockResolvedValue('http://localhost:9000/uploads/test.jpg');
        vi.mocked(fileRepository.create).mockResolvedValue(mockFileRecord);

        const result = await fileService.uploadFile(fileInput, {
          entityType: 'User',
          entityId: 'user-123',
          uploadedById: 'user-123',
        });

        expect(uploadFileToS3).toHaveBeenCalledTimes(1);
        const uploadCall = vi.mocked(uploadFileToS3).mock.calls[0]!;
        expect(uploadCall[0]).toBe('uploads');
        expect(uploadCall[1]).toMatch(/test\.jpg$/);
        expect(uploadCall[2]).toBe(fileBuffer);
        expect(uploadCall[3]).toBe('image/jpeg');
        expect(uploadCall[4]).toBe(false);
        expect(fileRepository.create).toHaveBeenCalled();
        expect(result).toEqual(mockFileRecord);
      });
    });

    describe('Error Scenario', () => {
      it('throws UPLOAD_FAILED when S3 upload fails', async () => {
        const fileInput = {
          buffer: createFileBuffer(),
          originalname: 'test.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
        };

        vi.mocked(uploadFileToS3).mockRejectedValue(new Error('S3 upload failed'));

        await expect(fileService.uploadFile(fileInput)).rejects.toThrow(ApiError);
        await expect(fileService.uploadFile(fileInput)).rejects.toThrow('Failed to upload file');
      });
    });
  });

  describe('uploadFiles', () => {
    describe('Success Scenario', () => {
      it('uploads multiple files', async () => {
        const files = [
          {
            buffer: createFileBuffer(1024),
            originalname: 'test1.jpg',
            mimetype: 'image/jpeg',
            size: 1024,
          },
          {
            buffer: createFileBuffer(2048),
            originalname: 'test2.png',
            mimetype: 'image/png',
            size: 2048,
          },
        ];

        const mockFileRecords = files.map((file) =>
          createFileFixture({
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
          })
        );

        vi.mocked(uploadFileToS3).mockResolvedValue('http://localhost:9000/uploads/test.jpg');
        vi.mocked(fileRepository.create)
          .mockResolvedValueOnce(mockFileRecords[0]!)
          .mockResolvedValueOnce(mockFileRecords[1]!);

        const result = await fileService.uploadFiles(files);

        expect(result).toHaveLength(2);
        expect(uploadFileToS3).toHaveBeenCalledTimes(2);
        expect(fileRepository.create).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('getFileById', () => {
    describe('Success Scenario', () => {
      it('returns file when file exists', async () => {
        const mockFile = createFileFixture();
        vi.mocked(fileRepository.findById).mockResolvedValue(mockFile);

        const result = await fileService.getFileById(mockFile.id);

        expect(result).toEqual(mockFile);
      });
    });

    describe('Error Scenario', () => {
      it('throws FILE_NOT_FOUND when file does not exist', async () => {
        vi.mocked(fileRepository.findById).mockResolvedValue(null);

        await expect(fileService.getFileById('non-existent-id')).rejects.toThrow(ApiError);
        await expect(fileService.getFileById('non-existent-id')).rejects.toThrow('File not found');
      });
    });
  });

  describe('deleteFile', () => {
    describe('Success Scenario', () => {
      it('deletes file from S3 and database', async () => {
        const mockFile = createFileFixture();
        vi.mocked(fileRepository.findById).mockResolvedValue(mockFile);
        vi.mocked(deleteFileFromS3).mockResolvedValue();
        vi.mocked(fileRepository.deleteById).mockResolvedValue(mockFile);

        await fileService.deleteFile(mockFile.id);

        expect(deleteFileFromS3).toHaveBeenCalledWith(mockFile.bucket, mockFile.key);
        expect(fileRepository.deleteById).toHaveBeenCalledWith(mockFile.id);
      });
    });

    describe('Error Scenario', () => {
      it('throws FILE_NOT_FOUND when file does not exist', async () => {
        vi.mocked(fileRepository.findById).mockResolvedValue(null);

        await expect(fileService.deleteFile('non-existent-id')).rejects.toThrow('File not found');
      });

      it('throws DELETE_FAILED when S3 deletion fails', async () => {
        const mockFile = createFileFixture();
        vi.mocked(fileRepository.findById).mockResolvedValue(mockFile);
        vi.mocked(deleteFileFromS3).mockRejectedValue(new Error('S3 delete failed'));

        await expect(fileService.deleteFile(mockFile.id)).rejects.toThrow(ApiError);
        await expect(fileService.deleteFile(mockFile.id)).rejects.toThrow('Failed to delete file');
      });
    });
  });

  describe('updateFileMetadata', () => {
    describe('Success Scenario', () => {
      it('updates file metadata', async () => {
        const mockFile = createFileFixture();
        const updatedFile = { ...mockFile, metadata: { custom: 'value' } };

        vi.mocked(fileRepository.findById).mockResolvedValue(mockFile);
        vi.mocked(fileRepository.update).mockResolvedValue(updatedFile);

        const result = await fileService.updateFileMetadata(mockFile.id, { custom: 'value' });

        expect(fileRepository.update).toHaveBeenCalledWith(mockFile.id, {
          metadata: { custom: 'value' },
        });
        expect(result).toEqual(updatedFile);
      });
    });

    describe('Error Scenario', () => {
      it('throws FILE_NOT_FOUND when file does not exist', async () => {
        vi.mocked(fileRepository.findById).mockResolvedValue(null);

        await expect(fileService.updateFileMetadata('non-existent-id', {})).rejects.toThrow(
          'File not found'
        );
      });
    });
  });
});
