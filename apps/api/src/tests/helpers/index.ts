export * from './db';

import { vi } from 'vitest';

interface MockRequest {
  params: Record<string, string>;
  query: Record<string, string>;
  body: Record<string, unknown>;
  headers: Record<string, string>;
  user?: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
  };
}

export function createMockRequest(overrides: Partial<MockRequest> = {}): MockRequest {
  return {
    params: {},
    query: {},
    body: {},
    headers: {},
    user: undefined,
    ...overrides,
  };
}

export function createMockResponse() {
  const res: Record<string, unknown> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res;
}

export function createAuthenticatedRequest(userId: string, overrides: Partial<MockRequest> = {}): MockRequest {
  return createMockRequest({
    user: {
      id: userId,
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: true,
    },
    ...overrides,
  });
}
