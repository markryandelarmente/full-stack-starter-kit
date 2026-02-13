import {
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { userQueryKeys } from './users-keys';
import type { User, PaginatedResponse, PaginationParams, ApiError } from '@repo/shared';

/**
 * Fetch paginated list of users
 */
export const fetchUsers = async (params?: PaginationParams): Promise<PaginatedResponse<User>> => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
  const query = searchParams.toString();
  const response = await apiClient.get<PaginatedResponse<User>>(`/users${query ? `?${query}` : ''}`);
  if (!response.success) {
    throw response.error;
  }
  return response.data!;
};

export function useUsers(
  params?: PaginationParams,
  options?: Omit<UseQueryOptions<PaginatedResponse<User>, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: userQueryKeys.users(params),
    queryFn: () => fetchUsers(params),
    ...options,
  });
}

/**
 * Fetch current authenticated user
 */
export const fetchCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get<User>('/users/me');
  if (!response.success) {
    throw response.error;
  }
  return response.data!;
};

export function useCurrentUser(
  options?: Omit<UseQueryOptions<User, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: userQueryKeys.me(),
    queryFn: () => fetchCurrentUser(),
    ...options,
  });
}

/**
 * Fetch a specific user by ID
 */
export const fetchUser = async (id: string): Promise<User> => {
  const response = await apiClient.get<User>(`/users/${id}`);
  if (!response.success) {
    throw response.error;
  }
  return response.data!;
};

export function useUser(
  id: string,
  options?: Omit<UseQueryOptions<User, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: userQueryKeys.user(id),
    queryFn: () => fetchUser(id),
    enabled: !!id,
    ...options,
  });
}
