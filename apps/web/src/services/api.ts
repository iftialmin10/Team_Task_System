import { workItemListResponseSchema, type User, type WorkItemListResponse, type WorkItemQuery } from '@team-task-system/contracts';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

async function requestJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, signal ? { signal } : {});
  if (!response.ok) throw new Error(response.status >= 500 ? 'The server could not load this data.' : 'The request could not be completed.');
  return response.json() as Promise<T>;
}

export async function getHealth(): Promise<{ status: string }> {
  return requestJson('/health');
}

export async function getUsers(signal?: AbortSignal): Promise<User[]> {
  const response = await requestJson<{ data: User[] }>('/users', signal);
  return response.data;
}

export async function getWorkItems(query: WorkItemQuery, signal?: AbortSignal): Promise<WorkItemListResponse> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  const response = await requestJson<unknown>(`/work-items?${params}`, signal);
  return workItemListResponseSchema.parse(response);
}
