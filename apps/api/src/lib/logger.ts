import pino from 'pino';
import type { ServerEnv } from '../env';

/**
 * Create a Pino logger instance
 * @param env - Server environment variables
 * @returns Configured Pino logger
 */
export function createLogger(env: ServerEnv) {
  const isDevelopment = env.NODE_ENV === 'development';
  const isTest = env.NODE_ENV === 'test';

  if (isTest) {
    return pino({
      level: 'silent',
    });
  }

  if (isDevelopment) {
    return pino({
      level: env.LOG_LEVEL || 'debug',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          singleLine: true,
        },
      },
    });
  }

  return pino({
    level: env.LOG_LEVEL || 'info',
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}

/**
 * Logger instance - initialized in index.ts
 * Use this throughout the application
 */
export let logger: ReturnType<typeof createLogger>;

/**
 * Initialize the logger
 * Call this once at application startup
 */
export function initLogger(env: ServerEnv): void {
  logger = createLogger(env);
}
