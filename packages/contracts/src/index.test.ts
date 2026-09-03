import { describe, expect, it } from 'vitest';
import { createWorkItemSchema, updateStatusSchema, updateWorkItemSchema, workItemQuerySchema } from './index.js';

describe('shared contracts', () => {
  it('applies documented list defaults', () => {
    expect(workItemQuerySchema.parse({})).toEqual({ sort: 'dueDate', order: 'asc', page: 1, pageSize: 25 });
  });
  it('coerces pagination and rejects unbounded page sizes', () => {
    expect(workItemQuerySchema.parse({ page: '2', pageSize: '50' }).page).toBe(2);
    expect(workItemQuerySchema.safeParse({ pageSize: '500' }).success).toBe(false);
  });
  it('trims titles and restricts status values', () => {
    expect(createWorkItemSchema.parse({ title: '  Ship it  ' }).title).toBe('Ship it');
    expect(updateStatusSchema.safeParse({ status: 'BLOCKED' }).success).toBe(false);
  });
  it('accepts partial edits but rejects empty edits', () => {
    expect(updateWorkItemSchema.parse({ priority: 'HIGH' })).toEqual({ priority: 'HIGH' });
    expect(updateWorkItemSchema.safeParse({}).success).toBe(false);
  });
});
