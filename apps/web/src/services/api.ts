import {
  workItemListResponseSchema,
  workItemSchema,
  type CreateWorkItemInput,
  type UpdateWorkItemInput,
  type User,
  type WorkItem,
  type WorkItemListResponse,
  type WorkItemQuery,
  type WorkStatus,
} from '@team-task-system/contracts';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

async function requestJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, options);
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    throw new Error(body?.error?.message ?? (response.status >= 500 ? 'The server could not complete this request.' : 'The request could not be completed.'));
  }
  return response.json() as Promise<T>;
}

export async function getHealth(): Promise<{ status: string }> {
  return requestJson('/health');
}

export async function getUsers(signal?: AbortSignal): Promise<User[]> {
  const response = await requestJson<{ data: User[] }>('/users', signal ? { signal } : {});
  return response.data;
}

export async function getWorkItems(query: WorkItemQuery, signal?: AbortSignal): Promise<WorkItemListResponse> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  const response = await requestJson<unknown>(`/work-items?${params}`, signal ? { signal } : {});
  return workItemListResponseSchema.parse(response);
}

async function mutateWorkItem(path: string, method: 'POST' | 'PATCH', input: unknown): Promise<WorkItem> {
  const response = await requestJson<{ data: unknown }>(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return workItemSchema.parse(response.data);
}

export async function getWorkItem(id: string, signal?: AbortSignal): Promise<WorkItem> {
  const response = await requestJson<{ data: unknown }>(`/work-items/${encodeURIComponent(id)}`, signal ? { signal } : {});
  return workItemSchema.parse(response.data);
}

export function createWorkItem(input: CreateWorkItemInput) {
  return mutateWorkItem('/work-items', 'POST', input);
}

export function updateWorkItem(id: string, input: UpdateWorkItemInput) {
  return mutateWorkItem(`/work-items/${encodeURIComponent(id)}`, 'PATCH', input);
}

export function updateWorkItemStatus(id: string, status: WorkStatus) {
  return mutateWorkItem(`/work-items/${encodeURIComponent(id)}/status`, 'PATCH', { status });
}
