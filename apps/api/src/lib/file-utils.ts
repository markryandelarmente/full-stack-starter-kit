import { randomUUID } from 'crypto';

/**
 * Utility functions for file operations
 */

/**
 * Generate a unique S3 key for a file
 * Format: {uuid}/{sanitized-filename}
 */
export function generateFileKey(originalName: string): string {
  const uuid = randomUUID();
  const sanitized = sanitizeFilename(originalName);
  const timestamp = Date.now();
  return `${timestamp}/${uuid}/${sanitized}`;
}

/**
 * Sanitize filename to remove unsafe characters
 */
function sanitizeFilename(filename: string): string {
  // Remove path separators and other unsafe characters
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Validate file MIME type against allowed types
 */
export function validateFileType(mimeType: string, allowedTypes?: string[]): boolean {
  if (!allowedTypes || allowedTypes.length === 0) {
    return true; // No restrictions
  }

  return allowedTypes.includes(mimeType);
}

/**
 * Format bytes to human-readable size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Extract file extension from filename
 */
export function extractFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot + 1).toLowerCase();
}

/**
 * Get MIME type from file extension
 */
export function getMimeTypeFromExtension(extension: string): string {
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
    csv: 'text/csv',
    json: 'application/json',
  };

  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}
