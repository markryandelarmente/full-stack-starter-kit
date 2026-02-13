import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { fileQueryKeys } from './files-keys';
import type { File as FileType, ApiError } from '@repo/shared';
import type { FileMetadataInput } from '@repo/shared/validators';

interface UploadFileParams {
  file: File;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  isPrivate?: boolean;
}

interface UploadMultipleFilesParams {
  files: File[];
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  isPrivate?: boolean;
}

/**
 * Upload a single file
 */
export const uploadFile = async (params: UploadFileParams): Promise<FileType> => {
  const response = await apiClient.post<FileType>('/files', params);
  if (!response.success) {
    throw response.error;
  }
  return response.data!;
};

export function useUploadFile(
  options?: Omit<UseMutationOptions<FileType, ApiError, UploadFileParams>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, entityType, entityId, metadata, isPrivate }: UploadFileParams) => {
      const formData = new FormData();
      formData.append('file', file);

      if (entityType) formData.append('entityType', entityType);
      if (entityId) formData.append('entityId', entityId);
      if (metadata) formData.append('metadata', JSON.stringify(metadata));
      if (isPrivate !== undefined) formData.append('isPrivate', String(isPrivate));

      return uploadFile({ file, entityType, entityId, metadata, isPrivate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileQueryKeys.files() });
    },
    ...options,
  });
}

/**
 * Upload multiple files
 */
export const uploadMultipleFiles = async (params: UploadMultipleFilesParams): Promise<FileType[]> => {
  const response = await apiClient.post<FileType[]>('/files/multiple', params);
  if (!response.success) {
    throw response.error;
  }
  return response.data!;
};
export function useUploadMultipleFiles(
  options?: Omit<UseMutationOptions<FileType[], ApiError, UploadMultipleFilesParams>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      files,
      entityType,
      entityId,
      metadata,
      isPrivate,
    }: UploadMultipleFilesParams) => {
      const formData = new FormData();

      files.forEach((file) => {
        formData.append('files', file);
      });

      if (entityType) formData.append('entityType', entityType);
      if (entityId) formData.append('entityId', entityId);
      if (metadata) formData.append('metadata', JSON.stringify(metadata));
      if (isPrivate !== undefined) formData.append('isPrivate', String(isPrivate));

      return uploadMultipleFiles({ files, entityType, entityId, metadata, isPrivate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileQueryKeys.files() });
    },
    ...options,
  });
}

/**
 * Delete a file by ID
 */
export const deleteFile = async (id: string): Promise<void> => {
  const response = await apiClient.delete<void>(`/files/${id}`);
  if (!response.success) {
    throw response.error;
  }
};

export function useDeleteFile(
  options?: Omit<UseMutationOptions<void, ApiError, string>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      return deleteFile(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileQueryKeys.files() });
    },
    ...options,
  });
}

/**
 * Update file metadata
 */

export const updateFileMetadata = async (id: string, data: FileMetadataInput): Promise<FileType> => {
  const response = await apiClient.patch<FileType>(`/files/${id}/metadata`, data);
  if (!response.success) {
    throw response.error;
  }
  return response.data!;
};

export function useUpdateFileMetadata(
  options?: Omit<
    UseMutationOptions<FileType, ApiError, { id: string; data: FileMetadataInput }>,
    'mutationFn'
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: FileMetadataInput;
    }): Promise<FileType> => {
      return updateFileMetadata(id, data);
    },
    onSuccess: (updatedFile, { id }) => {
      queryClient.setQueryData(fileQueryKeys.file(id), updatedFile);
      queryClient.invalidateQueries({ queryKey: fileQueryKeys.files() });
    },
    ...options,
  });
}
