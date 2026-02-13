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

beforeEach(async () => {
  // Truncate all tables in one command (CASCADE handles foreign keys)
  // Include files table to clean up file records between tests
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE files, users, sessions, accounts, verifications RESTART IDENTITY CASCADE`
  );
});
