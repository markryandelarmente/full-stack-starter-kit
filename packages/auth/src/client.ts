import { createAuthClient } from 'better-auth/react';

export function createClient(baseURL: string = 'http://localhost:3001') {
  return createAuthClient({ baseURL });
}

// Default client - consumers should initialize with proper URL in their app
export const authClient = createClient();

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
