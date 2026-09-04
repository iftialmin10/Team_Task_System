import { describe, expect, it } from 'vitest';
import { getConfig } from './config.js';

const required = { DATABASE_URL: 'postgresql://user:password@example.neon.tech/app?sslmode=require' };

describe('production configuration', () => {
  it('applies conservative pool and timeout defaults', () => {
    expect(getConfig(required)).toMatchObject({
      DATABASE_POOL_MAX: 10,
      DATABASE_CONNECT_TIMEOUT_MS: 10_000,
      DATABASE_IDLE_TIMEOUT_MS: 30_000,
    });
  });

  it('rejects non-PostgreSQL URLs and oversized pools', () => {
    expect(() => getConfig({ DATABASE_URL: 'https://example.com' })).toThrow();
    expect(() => getConfig({ ...required, DATABASE_POOL_MAX: '100' })).toThrow();
  });

  it('accepts a regular Neon URL in production', () => {
    const config = getConfig({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://user:password@ep-example.us-east-1.aws.neon.tech/app?sslmode=require',
    });
    expect(config.NODE_ENV).toBe('production');
  });

  it('rejects a non-Neon production URL', () => {
    expect(() => getConfig({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://user:password@example.com/app?sslmode=require',
    })).toThrow();
  });
});
