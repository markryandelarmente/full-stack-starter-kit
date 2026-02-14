export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message: string, details?: Record<string, unknown>) {
    return new ApiError('BAD_REQUEST', message, 400, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError('UNAUTHORIZED', message, 401);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError('FORBIDDEN', message, 403);
  }

  static notFound(message = 'Not found') {
    return new ApiError('NOT_FOUND', message, 404);
  }

  static conflict(message: string, details?: Record<string, unknown>) {
    return new ApiError('CONFLICT', message, 409, details);
  }

  static tooManyRequests(message = 'Too many requests') {
    return new ApiError('TOO_MANY_REQUESTS', message, 429);
  }

  static internal(message = 'Internal server error') {
    return new ApiError('INTERNAL_ERROR', message, 500);
  }

  // File-specific errors
  static fileTooLarge(message = 'File size exceeds maximum allowed size') {
    return new ApiError('FILE_TOO_LARGE', message, 400);
  }

  static invalidFileType(message = 'File type is not allowed') {
    return new ApiError('INVALID_FILE_TYPE', message, 400);
  }

  static uploadFailed(message = 'File upload failed', details?: Record<string, unknown>) {
    return new ApiError('UPLOAD_FAILED', message, 500, details);
  }

  static fileNotFound(message = 'File not found') {
    return new ApiError('FILE_NOT_FOUND', message, 404);
  }

  static deleteFailed(message = 'File deletion failed', details?: Record<string, unknown>) {
    return new ApiError('DELETE_FAILED', message, 500, details);
  }
}
