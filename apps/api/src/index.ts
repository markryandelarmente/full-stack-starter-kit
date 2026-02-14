import { createApp } from './app';
import { initLogger, logger } from './lib/logger';
import { validateServerEnv } from './env';

// Validate server environment variables
const env = validateServerEnv();

initLogger(env);

const app = await createApp(env.BETTER_AUTH_URL);

// Start server
app.listen(env.PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${env.PORT}`);
  logger.info(`📚 API routes available at http://localhost:${env.PORT}/api`);
});
