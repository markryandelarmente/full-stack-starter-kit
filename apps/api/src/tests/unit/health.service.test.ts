import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as healthService from '../../services/health.service';

// Mock dependencies
vi.mock('@repo/db', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

vi.mock('../../lib/s3', () => ({
  getS3Client: vi.fn(() => ({
    send: vi.fn(),
  })),
}));

// Import mocked modules
import { prisma } from '@repo/db';
import { getS3Client } from '../../lib/s3';

describe('Unit Test for healthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkDatabase', () => {
    describe('Success Scenario', () => {
      it('returns healthy status when database is connected', async () => {
        vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);

        const result = await healthService.checkDatabase();

        expect(result.status).toBe('healthy');
        expect(result.latency).toBeDefined();
        expect(typeof result.latency).toBe('number');
        expect(result.message).toBeUndefined();
      });

      it('returns latency in milliseconds', async () => {
        vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);

        const result = await healthService.checkDatabase();

        expect(result.latency).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Error Scenario', () => {
      it('returns unhealthy status when database connection fails', async () => {
        vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('Connection refused'));

        const result = await healthService.checkDatabase();

        expect(result.status).toBe('unhealthy');
        expect(result.message).toBe('Connection refused');
        expect(result.latency).toBeUndefined();
      });

      it('returns generic message for non-Error exceptions', async () => {
        vi.mocked(prisma.$queryRaw).mockRejectedValue('Unknown error');

        const result = await healthService.checkDatabase();

        expect(result.status).toBe('unhealthy');
        expect(result.message).toBe('Database connection failed');
      });
    });
  });

  describe('checkS3', () => {
    describe('Success Scenario', () => {
      it('returns healthy status when S3 is accessible', async () => {
        const mockSend = vi.fn().mockResolvedValue({});
        vi.mocked(getS3Client).mockReturnValue({ send: mockSend } as never);

        const result = await healthService.checkS3();

        expect(result.status).toBe('healthy');
        expect(result.latency).toBeDefined();
        expect(typeof result.latency).toBe('number');
        expect(result.message).toBeUndefined();
      });

      it('returns latency in milliseconds', async () => {
        const mockSend = vi.fn().mockResolvedValue({});
        vi.mocked(getS3Client).mockReturnValue({ send: mockSend } as never);

        const result = await healthService.checkS3();

        expect(result.latency).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Error Scenario', () => {
      it('returns unhealthy status when S3 connection fails', async () => {
        const mockSend = vi.fn().mockRejectedValue(new Error('Bucket not found'));
        vi.mocked(getS3Client).mockReturnValue({ send: mockSend } as never);

        const result = await healthService.checkS3();

        expect(result.status).toBe('unhealthy');
        expect(result.message).toBe('Bucket not found');
        expect(result.latency).toBeUndefined();
      });

      it('returns generic message for non-Error exceptions', async () => {
        const mockSend = vi.fn().mockRejectedValue('Network timeout');
        vi.mocked(getS3Client).mockReturnValue({ send: mockSend } as never);

        const result = await healthService.checkS3();

        expect(result.status).toBe('unhealthy');
        expect(result.message).toBe('S3 connection failed');
      });
    });
  });

  describe('getHealthStatus', () => {
    describe('Success Scenario', () => {
      it('returns healthy status when all checks pass', async () => {
        vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);
        const mockSend = vi.fn().mockResolvedValue({});
        vi.mocked(getS3Client).mockReturnValue({ send: mockSend } as never);

        const result = await healthService.getHealthStatus();

        expect(result.status).toBe('healthy');
        expect(result.checks.database.status).toBe('healthy');
        expect(result.checks.s3.status).toBe('healthy');
      });

      it('includes timestamp in ISO format', async () => {
        vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);
        const mockSend = vi.fn().mockResolvedValue({});
        vi.mocked(getS3Client).mockReturnValue({ send: mockSend } as never);

        const result = await healthService.getHealthStatus();

        expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      });

      it('includes uptime as a number', async () => {
        vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);
        const mockSend = vi.fn().mockResolvedValue({});
        vi.mocked(getS3Client).mockReturnValue({ send: mockSend } as never);

        const result = await healthService.getHealthStatus();

        expect(typeof result.uptime).toBe('number');
        expect(result.uptime).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Error Scenario', () => {
      it('returns unhealthy status when database check fails', async () => {
        vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('DB error'));
        const mockSend = vi.fn().mockResolvedValue({});
        vi.mocked(getS3Client).mockReturnValue({ send: mockSend } as never);

        const result = await healthService.getHealthStatus();

        expect(result.status).toBe('unhealthy');
        expect(result.checks.database.status).toBe('unhealthy');
        expect(result.checks.s3.status).toBe('healthy');
      });

      it('returns unhealthy status when S3 check fails', async () => {
        vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);
        const mockSend = vi.fn().mockRejectedValue(new Error('S3 error'));
        vi.mocked(getS3Client).mockReturnValue({ send: mockSend } as never);

        const result = await healthService.getHealthStatus();

        expect(result.status).toBe('unhealthy');
        expect(result.checks.database.status).toBe('healthy');
        expect(result.checks.s3.status).toBe('unhealthy');
      });

      it('returns unhealthy status when all checks fail', async () => {
        vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('DB error'));
        const mockSend = vi.fn().mockRejectedValue(new Error('S3 error'));
        vi.mocked(getS3Client).mockReturnValue({ send: mockSend } as never);

        const result = await healthService.getHealthStatus();

        expect(result.status).toBe('unhealthy');
        expect(result.checks.database.status).toBe('unhealthy');
        expect(result.checks.s3.status).toBe('unhealthy');
      });
    });

    describe('Edge Case Scenario', () => {
      it('returns both check results even when one fails', async () => {
        vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('DB error'));
        const mockSend = vi.fn().mockResolvedValue({});
        vi.mocked(getS3Client).mockReturnValue({ send: mockSend } as never);

        const result = await healthService.getHealthStatus();

        expect(result.checks.database).toBeDefined();
        expect(result.checks.s3).toBeDefined();
        expect(result.checks.database.message).toBe('DB error');
        expect(result.checks.s3.latency).toBeDefined();
      });
    });
  });
});
