import { http, HttpResponse } from 'msw';
import { createWorkItemSchema, updateStatusSchema, updateWorkItemSchema, workItemQuerySchema } from '@team-task-system/contracts';
import { initialMockWorkItems, mockUsers } from './data';

let workItems = structuredClone(initialMockWorkItems);
const api = '*/api';
const error = (status: number, message: string) => HttpResponse.json({ error: { code: status === 404 ? 'NOT_FOUND' : 'VALIDATION_ERROR', message } }, { status });

export const handlers = [
  http.get(`${api}/health`, () => HttpResponse.json({ status: 'ok' })),
  http.get(`${api}/users`, () => HttpResponse.json({ data: mockUsers })),
  http.get(`${api}/work-items`, ({ request }) => {
    const raw = Object.fromEntries(new URL(request.url).searchParams);
    const parsed = workItemQuerySchema.safeParse(raw);
    if (!parsed.success) return error(400, 'Request validation failed');
    const query = parsed.data;
    let data = workItems.filter((item) => {
      const term = query.search?.toLowerCase();
      const todayParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
      const todayPart = (type: Intl.DateTimeFormatPartTypes) => todayParts.find((part) => part.type === type)?.value ?? '';
      const today = `${todayPart('year')}-${todayPart('month')}-${todayPart('day')}`;
      const dueDate = item.dueDate?.slice(0, 10);
      const dueMatches = !query.due
        || (query.due === 'none' && !dueDate)
        || (query.due === 'today' && dueDate === today)
        || (query.due === 'upcoming' && Boolean(dueDate && dueDate > today))
        || (query.due === 'overdue' && Boolean(dueDate && dueDate < today && item.status !== 'DONE'));
      return (!term || item.title.toLowerCase().includes(term) || item.owner?.name.toLowerCase().includes(term))
        && (!query.owner || (query.owner === 'unassigned' ? item.ownerId === null : item.ownerId === query.owner))
        && (!query.status || item.status === query.status)
        && (!query.priority || item.priority === query.priority)
        && dueMatches;
    });
    const direction = query.order === 'asc' ? 1 : -1;
    data = data.sort((a, b) => {
      const first = query.sort === 'owner' ? a.owner?.name ?? '\uffff'
        : query.sort === 'dueDate' ? a.dueDate ?? '\uffff'
        : String(a[query.sort]);
      const second = query.sort === 'owner' ? b.owner?.name ?? '\uffff'
        : query.sort === 'dueDate' ? b.dueDate ?? '\uffff'
        : String(b[query.sort]);
      return first.localeCompare(second) * direction || b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id);
    });
    const totalItems = data.length;
    const start = (query.page - 1) * query.pageSize;
    return HttpResponse.json({ data: data.slice(start, start + query.pageSize), pagination: { page: query.page, pageSize: query.pageSize, totalItems, totalPages: Math.ceil(totalItems / query.pageSize) } });
  }),
  http.get(`${api}/work-items/:id`, ({ params }) => {
    const item = workItems.find(({ id }) => id === params.id);
    return item ? HttpResponse.json({ data: item }) : error(404, 'Work item not found');
  }),
  http.post(`${api}/work-items`, async ({ request }) => {
    const parsed = createWorkItemSchema.safeParse(await request.json());
    if (!parsed.success) return error(400, 'Request validation failed');
    const owner = mockUsers.find(({ id }) => id === parsed.data.ownerId) ?? null;
    const now = new Date().toISOString();
    const item = { id: `mock_${Date.now()}`, title: parsed.data.title, description: parsed.data.description ?? null, status: 'BACKLOG' as const, priority: parsed.data.priority ?? 'NORMAL' as const, ownerId: owner?.id ?? null, owner: owner ? { id: owner.id, name: owner.name, email: owner.email } : null, dueDate: parsed.data.dueDate ?? null, createdAt: now, updatedAt: now };
    workItems.unshift(item);
    return HttpResponse.json({ data: item }, { status: 201 });
  }),
  http.patch(`${api}/work-items/:id/status`, async ({ params, request }) => {
    const parsed = updateStatusSchema.safeParse(await request.json());
    const index = workItems.findIndex(({ id }) => id === params.id);
    if (!parsed.success) return error(400, 'Request validation failed');
    if (index < 0) return error(404, 'Work item not found');
    workItems[index] = { ...workItems[index]!, status: parsed.data.status, updatedAt: new Date().toISOString() };
    return HttpResponse.json({ data: workItems[index] });
  }),
  http.patch(`${api}/work-items/:id`, async ({ params, request }) => {
    const parsed = updateWorkItemSchema.safeParse(await request.json());
    const index = workItems.findIndex(({ id }) => id === params.id);
    if (!parsed.success) return error(400, 'Request validation failed');
    if (index < 0) return error(404, 'Work item not found');
    const current = workItems[index]!;
    const owner = parsed.data.ownerId === undefined ? current.owner : mockUsers.find(({ id }) => id === parsed.data.ownerId) ?? null;
    workItems[index] = {
      ...current,
      title: parsed.data.title ?? current.title,
      description: parsed.data.description !== undefined ? parsed.data.description : current.description,
      status: parsed.data.status ?? current.status,
      priority: parsed.data.priority ?? current.priority,
      dueDate: parsed.data.dueDate !== undefined ? parsed.data.dueDate : current.dueDate,
      ownerId: owner?.id ?? null,
      owner: owner ? { id: owner.id, name: owner.name, email: owner.email } : null,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({ data: workItems[index] });
  }),
];

export function resetMockData() { workItems = structuredClone(initialMockWorkItems); }
