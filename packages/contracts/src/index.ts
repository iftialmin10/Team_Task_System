import { z } from 'zod';

export const WORK_STATUSES = ['BACKLOG', 'READY', 'IN_PROGRESS', 'DONE'] as const;
export const PRIORITIES = ['NORMAL', 'HIGH', 'URGENT'] as const;
export const DUE_FILTERS = ['overdue', 'today', 'upcoming', 'none'] as const;
export const SORT_FIELDS = ['dueDate', 'title', 'owner', 'status', 'priority', 'createdAt', 'updatedAt'] as const;

export const workStatusSchema = z.enum(WORK_STATUSES);
export const prioritySchema = z.enum(PRIORITIES);
export const nullableIdSchema = z.string().trim().min(1).max(64).nullable();
export const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

const blankToUndefined = (value: unknown) => value === '' || value === null ? undefined : value;

export const workItemQuerySchema = z.object({
  search: z.preprocess(blankToUndefined, z.string().trim().max(120).optional()),
  owner: z.preprocess(blankToUndefined, z.string().trim().min(1).max(64).optional()),
  status: z.preprocess(blankToUndefined, workStatusSchema.optional()),
  priority: z.preprocess(blankToUndefined, prioritySchema.optional()),
  due: z.preprocess(blankToUndefined, z.enum(DUE_FILTERS).optional()),
  sort: z.preprocess(blankToUndefined, z.enum(SORT_FIELDS).default('dueDate')),
  order: z.preprocess(blankToUndefined, z.enum(['asc', 'desc']).default('asc')),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().refine((value) => value === 25 || value === 50, 'pageSize must be 25 or 50').default(25),
}).strict();

const workItemFields = {
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(5000).nullable().optional(),
  ownerId: nullableIdSchema.optional(),
  dueDate: dateOnlySchema.nullable().optional(),
  priority: prioritySchema.optional(),
};

export const createWorkItemSchema = z.object(workItemFields).strict();
export const updateWorkItemSchema = z.object({ ...workItemFields, title: workItemFields.title.optional(), status: workStatusSchema.optional() })
  .strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required');
export const updateStatusSchema = z.object({ status: workStatusSchema }).strict();
export const idParamsSchema = z.object({ id: z.string().trim().min(1).max(64) }).strict();

export const userSchema = z.object({
  id: z.string(), name: z.string(), email: z.string().email(),
  createdAt: z.string().datetime(), updatedAt: z.string().datetime(),
});
export const workItemSchema = z.object({
  id: z.string(), title: z.string(), description: z.string().nullable(),
  status: workStatusSchema, priority: prioritySchema, ownerId: z.string().nullable(),
  owner: userSchema.pick({ id: true, name: true, email: true }).nullable(),
  dueDate: z.string().nullable(), createdAt: z.string().datetime(), updatedAt: z.string().datetime(),
});
export const paginationSchema = z.object({ page: z.number(), pageSize: z.number(), totalItems: z.number(), totalPages: z.number() });
export const workItemListResponseSchema = z.object({ data: z.array(workItemSchema), pagination: paginationSchema });

export type WorkStatus = z.infer<typeof workStatusSchema>;
export type Priority = z.infer<typeof prioritySchema>;
export type WorkItemQuery = z.infer<typeof workItemQuerySchema>;
export type CreateWorkItemInput = z.infer<typeof createWorkItemSchema>;
export type UpdateWorkItemInput = z.infer<typeof updateWorkItemSchema>;
export type WorkItem = z.infer<typeof workItemSchema>;
export type User = z.infer<typeof userSchema>;
export type WorkItemListResponse = z.infer<typeof workItemListResponseSchema>;
