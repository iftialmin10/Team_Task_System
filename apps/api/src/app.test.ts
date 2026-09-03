import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app.js';

const item = { id: 'wrk_001', title: 'Test item', description: null, status: 'BACKLOG', priority: 'NORMAL', ownerId: null, owner: null, dueDate: null, createdAt: '2026-09-03T00:00:00.000Z', updatedAt: '2026-09-03T00:00:00.000Z' };

function services() {
  return {
    workItems: {
      list: vi.fn().mockResolvedValue({ data: [item], pagination: { page: 1, pageSize: 25, totalItems: 1, totalPages: 1 } }),
      get: vi.fn().mockResolvedValue(item), create: vi.fn().mockResolvedValue(item), update: vi.fn().mockResolvedValue(item), updateStatus: vi.fn().mockResolvedValue(item),
    },
    users: { list: vi.fn().mockResolvedValue([]) },
  };
}

describe('API contract', () => {
  it('validates and forwards list parameters', async () => {
    const deps = services();
    const response = await request(createApp(deps)).get('/api/work-items?page=2&pageSize=50&status=READY');
    expect(response.status).toBe(200);
    expect(deps.workItems.list).toHaveBeenCalledWith(expect.objectContaining({ page: 2, pageSize: 50, status: 'READY' }));
  });
  it('returns 400 for invalid list parameters', async () => {
    const response = await request(createApp(services())).get('/api/work-items?pageSize=500');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
  it('validates create and status update payloads', async () => {
    const deps = services();
    expect((await request(createApp(deps)).post('/api/work-items').send({ title: '  Ship release  ' })).status).toBe(201);
    expect(deps.workItems.create).toHaveBeenCalledWith({ title: 'Ship release' });
    expect((await request(createApp(deps)).patch('/api/work-items/wrk_001/status').send({ status: 'BLOCKED' })).status).toBe(400);
  });
  it('exposes users, details, update, health, and unknown-route behavior', async () => {
    const app = createApp(services());
    expect((await request(app).get('/api/health')).status).toBe(200);
    expect((await request(app).get('/api/users')).status).toBe(200);
    expect((await request(app).get('/api/work-items/wrk_001')).status).toBe(200);
    expect((await request(app).patch('/api/work-items/wrk_001').send({ priority: 'HIGH' })).status).toBe(200);
    expect((await request(app).get('/missing')).status).toBe(404);
  });
});
