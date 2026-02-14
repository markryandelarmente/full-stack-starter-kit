import { createClient, type RedisClientType } from 'redis';
import { validateServerEnv } from '../env';

let clientInstance: RedisClientType | null = null;
let connectPromise: Promise<RedisClientType> | null = null;

/**
 * Returns a shared Redis client when REDIS_URL is set, or null otherwise.
 * Connects lazily on first use. Reuses the same connection for rate limiter and health check.
 */
export async function getRedisClient(): Promise<RedisClientType | null> {
  const env = validateServerEnv();
  if (!env.REDIS_URL) {
    return null;
  }

  if (clientInstance) {
    return clientInstance;
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = (async () => {
    const client = createClient({ url: env.REDIS_URL }) as RedisClientType;
    await client.connect();
    clientInstance = client;
    return client;
  })();

  try {
    return await connectPromise;
  } catch (error) {
    connectPromise = null;
    clientInstance = null;
    throw error;
  }
}
