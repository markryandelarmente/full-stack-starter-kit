import { beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { prisma } from '@repo/db';
import { validateServerEnv } from '../env';
import { initLogger } from '../lib/logger';

// Re-export prisma for test helpers
export { prisma };

// Suppress console output during tests (ApiError logs come from error handler)
beforeAll(async () => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});

  // Initialize logger for tests (will use silent level)
  const env = validateServerEnv();
  initLogger(env);

  // Connect to test database
  await prisma.$connect();
});

afterAll(async () => {
  // Restore console.error
  vi.restoreAllMocks();

  // Disconnect from test database
  await prisma.$disconnect();
});

function isMissingRelationError(err: unknown): boolean {
  const prismaError = err as { code?: string; meta?: { code?: string } };
  return prismaError?.code === 'P2010' && prismaError?.meta?.code === '42P01';
}

beforeEach(async () => {
  // Truncate all tables (CASCADE handles foreign keys). If some tables don't exist
  // (test DB not pushed or empty), try auth-only truncate; if that also fails, skip.
  try {
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE files, users, sessions, accounts, verifications RESTART IDENTITY CASCADE`
    );
  } catch (err: unknown) {
    if (!isMissingRelationError(err)) throw err;
    try {
      await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE users, sessions, accounts, verifications RESTART IDENTITY CASCADE`
      );
    } catch (fallbackErr: unknown) {
      if (!isMissingRelationError(fallbackErr)) throw fallbackErr;
      // No tables exist (e.g. test DB schema not pushed); skip truncate
    }
  }
});
