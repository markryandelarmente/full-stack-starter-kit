import { prisma } from '@repo/db';
import { getS3Client, ensureBucketExists } from '../lib/s3';
import { getRedisClient } from '../lib/redis';
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
    redis: ComponentHealth;
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

function getS3ErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const err = error as Error & { name?: string; Code?: string };
    const code = err.Code ?? (err.name !== 'Error' ? err.name : undefined);
    if (code && code !== 'Unknown') return code;
    if (err.message && err.message !== 'Unknown') return err.message;
    return 'S3 connection failed (check endpoint and credentials)';
  }
  return 'S3 connection failed';
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
    const message = getS3ErrorMessage(error);
    const isBucketMissing = message === 'NotFound' || message === 'NoSuchBucket';
    if (isBucketMissing) {
      try {
        await ensureBucketExists(env.S3_BUCKET_NAME);
        return {
          status: 'healthy',
          latency: Date.now() - start,
        };
      } catch (createError) {
        return {
          status: 'unhealthy',
          message: getS3ErrorMessage(createError),
        };
      }
    }
    return {
      status: 'unhealthy',
      message,
    };
  }
}

export async function checkRedis(): Promise<ComponentHealth> {
  if (!env.REDIS_URL) {
    return {
      status: 'healthy',
      message: 'Redis not configured (using in-memory rate limit)',
    };
  }
  const start = Date.now();
  try {
    const client = await getRedisClient();
    if (!client) {
      return {
        status: 'healthy',
        message: 'Redis not configured (using in-memory rate limit)',
      };
    }
    await client.ping();
    return {
      status: 'healthy',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Redis connection failed',
    };
  }
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const database = await checkDatabase();
  const s3 = await checkS3();
  const redis = await checkRedis();

  // Aggregate overall status
  const allChecks = [database, s3, redis];
  const hasUnhealthy = allChecks.some((c) => c.status === 'unhealthy');

  return {
    status: hasUnhealthy ? 'unhealthy' : 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    uptime: process.uptime(),
    checks: {
      database,
      s3,
      redis,
    },
  };
}
