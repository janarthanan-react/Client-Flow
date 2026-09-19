import http from 'http';
import { createApp } from './app';
import { config } from './config';
import { logger } from './lib/logger';
import { connectPrisma } from './lib/prisma';
import { connectRedis } from './lib/redis';
import { initSocket } from './lib/socket';

async function bootstrap() {
  const app = createApp();
  const server = http.createServer(app);

  // Initialize Socket.IO
  initSocket(server);

  // Connect to Database
  await connectPrisma();

  // Connect to Redis (graceful if offline)
  await connectRedis();

  server.listen(config.port, () => {
    logger.info(`=======================================================`);
    logger.info(`🚀 ClientFlow API Server running in [${config.nodeEnv}] mode`);
    logger.info(`🌐 HTTP Port: http://localhost:${config.port}`);
    logger.info(`📚 Swagger Docs: http://localhost:${config.port}/api/docs`);
    logger.info(`❤️  Health Check: http://localhost:${config.port}/health`);
    logger.info(`⚡ Socket.IO initialized for real-time CRM updates`);
    logger.info(`=======================================================`);
  });

  // Graceful shutdown
  const gracefulShutdown = (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      logger.info('Server stopped.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
