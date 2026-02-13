import {
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { fileQueryKeys } from './files-keys';
import type { File as FileType, ApiError } from '@repo/shared';

interface PresignedUrlResponse {
  url: string;
  expiresAt: string;
}

/**
 * Fetch a file by ID
 */
export const fetchFile = async (id: string): Promise<FileType> => {
  const response = await apiClient.get<FileType>(`/files/${id}`);
  if (!response.success) {
    throw response.error;
  }
  return response.data!;
};

export function useFile(
  id: string,
  options?: Omit<UseQueryOptions<FileType, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: fileQueryKeys.file(id),
    queryFn: () => fetchFile(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Get presigned URL for a private file
 */
export const fetchFilePresignedUrl = async (id: string): Promise<PresignedUrlResponse> => {
  const response = await apiClient.get<PresignedUrlResponse>(`/files/${id}/presigned`);
  if (!response.success) {
    throw response.error;
  }
  return response.data!;
};

export function useFilePresignedUrl(
  id: string,
  options?: Omit<UseQueryOptions<PresignedUrlResponse, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: fileQueryKeys.presignedUrl(id),
    queryFn: () => fetchFilePresignedUrl(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
    ...options,
  });
}
