import {
  DUE_FILTERS,
  PRIORITIES,
  SORT_FIELDS,
  WORK_STATUSES,
  type Priority,
  type WorkItemQuery,
  type WorkStatus,
} from '@team-task-system/contracts';

export type BrowseState = WorkItemQuery;

export const DEFAULT_BROWSE_STATE: BrowseState = {
  sort: 'dueDate',
  order: 'asc',
  page: 1,
  pageSize: 25,
};

const statusFromUrl = new Map(WORK_STATUSES.map((value) => [value.toLowerCase(), value]));
const priorityFromUrl = new Map(PRIORITIES.map((value) => [value.toLowerCase(), value]));

function positiveInteger(value: string | null, fallback: number) {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return parsed > 0 ? parsed : fallback;
}

export function parseBrowseState(params: URLSearchParams): BrowseState {
  const search = params.get('search')?.trim().slice(0, 120) || undefined;
  const owner = params.get('owner')?.trim().slice(0, 64) || undefined;
  const rawStatus = params.get('status')?.toLowerCase();
  const rawPriority = params.get('priority')?.toLowerCase();
  const rawDue = params.get('due');
  const rawSort = params.get('sort');
  const rawOrder = params.get('order');
  const pageSize = positiveInteger(params.get('pageSize'), 25);

  return {
    ...(search ? { search } : {}),
    ...(owner ? { owner } : {}),
    ...(rawStatus && statusFromUrl.has(rawStatus) ? { status: statusFromUrl.get(rawStatus) as WorkStatus } : {}),
    ...(rawPriority && priorityFromUrl.has(rawPriority) ? { priority: priorityFromUrl.get(rawPriority) as Priority } : {}),
    ...(rawDue && DUE_FILTERS.includes(rawDue as (typeof DUE_FILTERS)[number]) ? { due: rawDue as BrowseState['due'] } : {}),
    sort: rawSort && SORT_FIELDS.includes(rawSort as (typeof SORT_FIELDS)[number]) ? rawSort as BrowseState['sort'] : 'dueDate',
    order: rawOrder === 'desc' ? 'desc' : 'asc',
    page: positiveInteger(params.get('page'), 1),
    pageSize: pageSize === 50 ? 50 : 25,
  };
}

export function serializeBrowseState(state: BrowseState) {
  const params = new URLSearchParams();
  if (state.search) params.set('search', state.search);
  if (state.owner) params.set('owner', state.owner);
  if (state.status) params.set('status', state.status.toLowerCase());
  if (state.priority) params.set('priority', state.priority.toLowerCase());
  if (state.due) params.set('due', state.due);
  if (state.sort !== 'dueDate') params.set('sort', state.sort);
  if (state.order !== 'asc') params.set('order', state.order);
  if (state.page !== 1) params.set('page', String(state.page));
  if (state.pageSize !== 25) params.set('pageSize', String(state.pageSize));
  return params;
}

export function updateBrowseState(state: BrowseState, changes: Partial<BrowseState>, resetPage = false): BrowseState {
  return { ...state, ...changes, ...(resetPage ? { page: 1 } : {}) };
}

