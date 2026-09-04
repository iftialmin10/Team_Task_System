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

  it('accepts both supported secure Neon URL formats in production', () => {
    const verifyFull = getConfig({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://user:password@ep-example-pooler.us-east-1.aws.neon.tech/app?sslmode=verify-full',
    });
    const channelBound = getConfig({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://user:password@ep-example-pooler.us-east-1.aws.neon.tech/app?sslmode=require&channel_binding=require',
    });
    expect(verifyFull.NODE_ENV).toBe('production');
    expect(channelBound.NODE_ENV).toBe('production');
  });

  it('rejects insecure, direct, and non-Neon production URLs', () => {
    expect(() => getConfig({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://user:password@ep-example-pooler.us-east-1.aws.neon.tech/app?sslmode=require',
    })).toThrow();
    expect(() => getConfig({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://user:password@ep-example.us-east-1.aws.neon.tech/app?sslmode=verify-full',
    })).toThrow();
    expect(() => getConfig({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://user:password@example.com/app?sslmode=verify-full',
    })).toThrow();
  });
});
