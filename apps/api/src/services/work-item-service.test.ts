import { describe, expect, it } from 'vitest';
import type { WorkItemQuery } from '@team-task-system/contracts';
import { workItemQueryHelpers } from './work-item-service.js';

const defaults: WorkItemQuery = { sort: 'dueDate', order: 'asc', page: 1, pageSize: 25 };

describe('database query composition', () => {
  it('searches relational owner names and titles', () => {
    expect(workItemQueryHelpers.buildWhere({ ...defaults, search: 'onboarding' })).toEqual({
      OR: [
        { title: { contains: 'onboarding', mode: 'insensitive' } },
        { owner: { name: { contains: 'onboarding', mode: 'insensitive' } } },
      ],
    });
  });
  it('uses Asia/Dhaka calendar boundaries and excludes done overdue work', () => {
    const where = workItemQueryHelpers.buildWhere({ ...defaults, due: 'overdue' }, new Date('2026-09-02T20:00:00.000Z'));
    expect(where).toEqual({ dueDate: { lt: new Date('2026-09-03T00:00:00.000Z') }, status: { not: 'DONE' } });
  });
  it('puts missing due dates last and adds stable tie-breakers', () => {
    expect(workItemQueryHelpers.buildOrderBy(defaults)).toEqual([
      { dueDate: { sort: 'asc', nulls: 'last' } }, { createdAt: 'desc' }, { id: 'asc' },
    ]);
  });
});
