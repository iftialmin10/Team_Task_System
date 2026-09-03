import type { Priority, WorkItem, WorkStatus } from '@team-task-system/contracts';

export const mockUsers = [
  { id: 'usr_01', name: 'Samira Khan', email: 'samira.khan@example.com', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'usr_02', name: 'Alexandra Montgomery-Jones', email: 'alexandra@example.com', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
];
const statuses: WorkStatus[] = ['BACKLOG', 'READY', 'IN_PROGRESS', 'DONE'];
const priorities: Priority[] = ['NORMAL', 'HIGH', 'URGENT'];

export const initialMockWorkItems: WorkItem[] = Array.from({ length: 360 }, (_, index) => {
  const owner = index % 5 === 0 ? null : mockUsers[index % mockUsers.length]!;
  return {
    id: `mock_${String(index + 1).padStart(3, '0')}`,
    title: index === 0 ? 'Prepare customer onboarding guide with an unusually detailed migration checklist' : `Mock work item ${index + 1}`,
    description: index % 6 === 0 ? null : `Description for mock work item ${index + 1}`,
    status: statuses[index % statuses.length]!, priority: priorities[index % priorities.length]!,
    ownerId: owner?.id ?? null, owner: owner ? { id: owner.id, name: owner.name, email: owner.email } : null,
    dueDate: index % 7 === 0 ? null : `2026-09-${String((index % 28) + 1).padStart(2, '0')}`,
    createdAt: new Date(Date.UTC(2026, 7, 1, index)).toISOString(), updatedAt: new Date(Date.UTC(2026, 8, 1, index)).toISOString(),
  };
});
