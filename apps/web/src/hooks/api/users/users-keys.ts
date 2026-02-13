import type { PaginationParams } from '@repo/shared';

const BASE_KEY = 'users';

export const userQueryKeys = {
  users:(params?: PaginationParams) => [BASE_KEY, params] as const,
  user: (id: string) => [BASE_KEY, id] as const,
  me: () => [BASE_KEY, 'me'] as const,
} as const;

export type UserQueryKeys = typeof userQueryKeys;
