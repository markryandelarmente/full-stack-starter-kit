import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const idSchema = z.string().cuid();

export const searchSchema = z.object({
  query: z.string().min(1).max(100).optional(),
  ...paginationSchema.shape,
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
