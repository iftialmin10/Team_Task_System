import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from './generated/prisma/client.js';
import type { getConfig } from './config.js';

type AppConfig = ReturnType<typeof getConfig>;
type Database = { prisma: PrismaClient; pool: Pool };

export function createDatabase(config: AppConfig): Database {
  const pool = new Pool({
    connectionString: config.DATABASE_URL,
    max: config.DATABASE_POOL_MAX,
    connectionTimeoutMillis: config.DATABASE_CONNECT_TIMEOUT_MS,
    idleTimeoutMillis: config.DATABASE_IDLE_TIMEOUT_MS,
    allowExitOnIdle: config.NODE_ENV !== 'production',
    enableChannelBinding: true,
  });
  return { prisma: new PrismaClient({ adapter: new PrismaPg(pool) }), pool };
}

export async function closeDatabase(database: Database) {
  await database.prisma.$disconnect();
  await database.pool.end();
}
