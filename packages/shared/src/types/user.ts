/**
 * Prisma-based type definitions
 * These types are automatically generated from Prisma schema
 * and will reflect any changes made to the schema after running `pnpm db:generate`
 */

import type { Prisma } from '@repo/db';

// ==========================================
// Base Types (from Prisma models)
// ==========================================

/**
 * Base User type - matches Prisma User model exactly
 * Use this when you don't need relations
 */
export type User = Prisma.UserGetPayload<object>;

/**
 * User with sessions relation
 */
export type UserWithSessions = Prisma.UserGetPayload<{
  include: {
    sessions: true;
  };
}>;

/**
 * User with specific relations (flexible)
 * Usage: UserWith<{ uploadedFiles: true, sessions: true }>
 */
export type UserWith<T extends Prisma.UserInclude> = Prisma.UserGetPayload<{
  include: T;
}>;
