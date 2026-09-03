import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().url().refine((value) => value.startsWith('postgresql://') || value.startsWith('postgres://'), 'DATABASE_URL must be a PostgreSQL URL'),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().max(20).default(10),
  DATABASE_CONNECT_TIMEOUT_MS: z.coerce.number().int().positive().max(60_000).default(10_000),
  DATABASE_IDLE_TIMEOUT_MS: z.coerce.number().int().positive().max(300_000).default(30_000),
});

export function getConfig(env: NodeJS.ProcessEnv = process.env) {
  return envSchema.parse(env);
}
