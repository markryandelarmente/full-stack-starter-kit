/**
 * Prisma-based type definitions
 * These types are automatically generated from Prisma schema
 * and will reflect any changes made to the schema after running `pnpm db:generate`
 */

import type { Prisma } from '@repo/db';

// ==========================================
// File Types with Relations
// ==========================================

export type File = Prisma.FileGetPayload<object>;

/**
 * File with specific relations (flexible)
 */
export type FileWith<T extends Prisma.FileInclude> = Prisma.FileGetPayload<{
  include: T;
}>;
