import { describe, expect, it } from 'vitest';
import { parseBrowseState, serializeBrowseState } from './query-state';

describe('browse query state', () => {
  it('parses valid URL values and normalizes invalid ones', () => {
    expect(parseBrowseState(new URLSearchParams('search=%20launch%20&status=in_progress&priority=urgent&due=overdue&sort=title&order=desc&page=2&pageSize=50'))).toEqual({
      search: 'launch', status: 'IN_PROGRESS', priority: 'URGENT', due: 'overdue', sort: 'title', order: 'desc', page: 2, pageSize: 50,
    });
    expect(parseBrowseState(new URLSearchParams('status=unknown&sort=nope&page=-3&pageSize=100'))).toEqual({ sort: 'dueDate', order: 'asc', page: 1, pageSize: 25 });
  });

  it('serializes in stable order and omits defaults', () => {
    expect(serializeBrowseState({ search: 'launch', owner: 'unassigned', status: 'IN_PROGRESS', priority: 'URGENT', due: 'today', sort: 'title', order: 'desc', page: 3, pageSize: 50 }).toString())
      .toBe('search=launch&owner=unassigned&status=in_progress&priority=urgent&due=today&sort=title&order=desc&page=3&pageSize=50');
    expect(serializeBrowseState({ sort: 'dueDate', order: 'asc', page: 1, pageSize: 25 }).toString()).toBe('');
  });
});

