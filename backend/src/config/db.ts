/**
 * Database client singleton
 * Provides Prisma client instance for database operations
 */

import { PrismaClient } from '@prisma/client';
import { env } from './env';

/**
 * Singleton Prisma client instance
 */
let prisma: PrismaClient;

/**
 * Get or create Prisma client instance
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    // Check if DATABASE_URL is configured
    if (!env.databaseUrl) {
      console.warn(
        '⚠️  DATABASE_URL not configured in environment. Database operations will fail.'
      );
      console.warn('   Please set DATABASE_URL in your .env file.');
      console.warn('   For SQLite: DATABASE_URL="file:./dev.db"');
      console.warn(
        '   For PostgreSQL: DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public"'
      );
    }

    prisma = new PrismaClient({
      log: env.nodeEnv === 'development' ? ['query', 'warn', 'error'] : ['error'],
    });

    // Graceful shutdown
    process.on('beforeExit', async () => {
      await prisma.$disconnect();
    });
  }

  return prisma;
}

/**
 * Export singleton instance
 */
export const db = getPrismaClient();
