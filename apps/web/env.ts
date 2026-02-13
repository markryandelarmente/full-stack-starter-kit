import { z } from 'zod';

// ==========================================
// Client Environment Schema (Web)
// ==========================================

export const clientEnvSchema = z.object({
  VITE_API_URL: z.string().url(),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * Validate client environment variables (for Web)
 * @param env - Environment object (typically import.meta.env in Vite)
 * @throws Error if validation fails
 */
export function validateClientEnv(env: Record<string, unknown> = {}): ClientEnv {
  const result = clientEnvSchema.safeParse(env);

  if (!result.success) {
    console.error('❌ Invalid client environment variables:');
    console.error(result.error.flatten().fieldErrors);
    throw new Error('Invalid client environment variables');
  }

  return result.data;
}