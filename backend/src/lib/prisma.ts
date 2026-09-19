import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export async function connectPrisma() {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully via Prisma');
    return true;
  } catch (error: any) {
    logger.error('Failed to connect to Database via Prisma:', { message: error.message });
    return false;
  }
}
