import type { CreateWorkItemInput, UpdateWorkItemInput, WorkItemQuery, WorkStatus } from '@team-task-system/contracts';

export interface WorkItemsApi {
  list(query: WorkItemQuery): Promise<unknown>;
  get(id: string): Promise<unknown>;
  create(input: CreateWorkItemInput): Promise<unknown>;
  update(id: string, input: UpdateWorkItemInput): Promise<unknown>;
  updateStatus(id: string, status: WorkStatus): Promise<unknown>;
}

export interface UsersApi { list(): Promise<unknown>; }
