import { z } from 'zod';

// ==========================================
// Server Environment Schema (API)
// ==========================================

export const serverEnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Auth
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),

  // Server
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // S3 Storage
  S3_ENDPOINT: z.string().default('localhost:9000'),
  S3_ACCESS_KEY: z.string().default('minioadmin'),
  S3_SECRET_KEY: z.string().default('minioadmin'),
  S3_BUCKET_NAME: z.string().default('uploads'),
  S3_USE_SSL: z.coerce.boolean().default(false),
  MAX_FILE_SIZE: z.coerce.number().default(10485760), // 10MB in bytes

  // Redis (optional: when set, rate limiter uses Redis; when unset, in-memory store)
  REDIS_URL: z.string().url().optional(),

  // Rate limit (optional tuning)
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX: z.coerce.number().default(100),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validate server environment variables (for API)
 * @throws Error if validation fails
 */
export function validateServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid server environment variables:');
    console.error(result.error.flatten().fieldErrors);
    throw new Error('Invalid server environment variables');
  }

  return result.data;
}
