import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { User, ApiError } from '@repo/shared';
import type { UpdateUserInput } from '@repo/shared/validators';
import { userQueryKeys } from './users-keys';

/**
 * Update current user profile
 */
export function useUpdateCurrentUser(
  options?: Omit<UseMutationOptions<User, ApiError, UpdateUserInput>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateUserInput): Promise<User> => {
      const result = await apiClient.patch<User>('/users/me', data);
      if (!result.success) {
        throw result.error;
      }
      return result.data!;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(userQueryKeys.me(), updatedUser);
      queryClient.invalidateQueries({ queryKey: userQueryKeys.users() });
    },
    ...options,
  });
}

/**
 * Delete a user by ID
 */
export function useDeleteUser(
  options?: Omit<UseMutationOptions<void, ApiError, string>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const result = await apiClient.delete<void>(`/users/${id}`);
      if (!result.success) {
        throw result.error;
      }
    },
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: userQueryKeys.user(deletedId) });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.users() });
    },
    ...options,
  });
}
