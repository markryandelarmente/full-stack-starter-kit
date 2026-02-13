import { prisma } from '@repo/db';
import { getS3Client } from '../lib/s3';
import { HeadBucketCommand } from '@aws-sdk/client-s3';
import { validateServerEnv } from '../env';

const env = validateServerEnv();

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version?: string;
  uptime: number;
  checks: {
    database: ComponentHealth;
    s3: ComponentHealth;
    // Add more checks as needed (redis, s3, etc.)
  };
}

interface ComponentHealth {
  status: 'healthy' | 'unhealthy';
  latency?: number;
  message?: string;
}

export async function checkDatabase(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Database connection failed',
    };
  }
}

export async function checkS3(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    await getS3Client().send(new HeadBucketCommand({ Bucket: env.S3_BUCKET_NAME }));
    return {
      status: 'healthy',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'S3 connection failed',
    };
  }
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const database = await checkDatabase();
  const s3 = await checkS3();

  // Aggregate overall status
  const allChecks = [database, s3];
  const hasUnhealthy = allChecks.some((c) => c.status === 'unhealthy');

  return {
    status: hasUnhealthy ? 'unhealthy' : 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    uptime: process.uptime(),
    checks: {
      database,
      s3,
    },
  };
}
