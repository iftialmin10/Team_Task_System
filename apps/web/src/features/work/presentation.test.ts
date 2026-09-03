import { describe, expect, it } from 'vitest';
import { getDuePresentation } from './presentation';

const now = new Date('2026-09-03T08:00:00.000Z');

describe('due presentation', () => {
  it('labels overdue and due-today work explicitly', () => {
    expect(getDuePresentation({ dueDate: '2026-09-01', status: 'READY' }, now).label).toBe('Overdue by 2 days');
    expect(getDuePresentation({ dueDate: '2026-09-03', status: 'IN_PROGRESS' }, now).label).toBe('Due today');
  });

  it('does not call completed work overdue', () => {
    expect(getDuePresentation({ dueDate: '2026-09-01', status: 'DONE' }, now)).toEqual({ label: 'Sep 1, 2026', tone: 'muted' });
    expect(getDuePresentation({ dueDate: null, status: 'BACKLOG' }, now).label).toBe('No due date');
  });
});

