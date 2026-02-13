import type { ApiResponse, ApiError } from '@repo/shared';
import { validateClientEnv } from '../../env';

const env = validateClientEnv(import.meta.env);
const API_URL = env.VITE_API_URL;

export async function api<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${API_URL}${endpoint}`;
  try {
    const isFormData = options.body instanceof FormData;
    const headers: HeadersInit = isFormData
      ? { ...options.headers }
      : { 'Content-Type': 'application/json', ...options.headers };

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    // Handle non-JSON responses (e.g., network errors, 204 No Content)
    let data: unknown;
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        // If JSON parsing fails, return error
        return {
          success: false,
          error: {
            code: 'PARSE_ERROR',
            message: 'Failed to parse response',
          },
        };
      }
    } else {
      // For non-JSON responses, use response status text
      data = { message: response.statusText || 'Unknown error' };
    }

    if (!response.ok) {
      return {
        success: false,
        error: (data as { error?: ApiError })?.error ?? {
          code: `HTTP_${response.status}`,
          message:
            (data as { message?: string })?.message ||
            response.statusText ||
            'An unexpected error occurred',
        },
      };
    }

    const responseData = data as { success?: boolean; data?: T; error?: ApiError };

    // Validate that the response matches the expected API format
    if (responseData.success === true) {
      if (!('data' in responseData)) {
        return {
          success: false,
          error: {
            code: 'INVALID_RESPONSE',
            message: 'API returned success but no data field',
            details: { received: data },
          },
        };
      }
      return {
        success: true,
        data: responseData.data as T,
      };
    }

    return {
      success: false,
      error: {
        code: 'INVALID_RESPONSE',
        message: 'Response does not match expected API format',
        details: { received: data },
      },
    };
  } catch (error) {
    // Handle network errors, CORS errors, etc.
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error. Please check your connection and try again.',
        },
      };
    }

    // Handle other unexpected errors
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    };
  }
}

export const apiClient = {
  get: <T>(endpoint: string) => api<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown) =>
    api<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(endpoint: string, body?: unknown) =>
    api<T>(endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(endpoint: string, body?: unknown) =>
    api<T>(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(endpoint: string) => api<T>(endpoint, { method: 'DELETE' }),
};
