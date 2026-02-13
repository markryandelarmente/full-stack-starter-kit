import { createClient } from '@repo/auth/client';
import { validateClientEnv } from '../../env';

// Validate and get client environment variables
const env = validateClientEnv(import.meta.env);
const baseURL = `${env.VITE_API_URL}/auth`;

// Initialize auth client with validated environment variable
export const authClient = createClient(baseURL);

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
