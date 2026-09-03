import type { Prisma, PrismaClient } from '../generated/prisma/client.js';
import type { CreateWorkItemInput, UpdateWorkItemInput, WorkItemQuery, WorkStatus } from '@team-task-system/contracts';
import { HttpError } from '../errors.js';

const ownerSelect = { id: true, name: true, email: true } as const;
const includeOwner = { owner: { select: ownerSelect } } as const;

function todayInDhaka(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return new Date(`${get('year')}-${get('month')}-${get('day')}T00:00:00.000Z`);
}

function addDays(date: Date, count: number) {
  return new Date(date.getTime() + count * 86_400_000);
}

function buildWhere(query: WorkItemQuery, now?: Date): Prisma.WorkItemWhereInput {
  const where: Prisma.WorkItemWhereInput = {};
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { owner: { name: { contains: query.search, mode: 'insensitive' } } },
    ];
  }
  if (query.owner) where.ownerId = query.owner === 'unassigned' ? null : query.owner;
  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;
  if (query.due) {
    const today = todayInDhaka(now);
    const tomorrow = addDays(today, 1);
    if (query.due === 'none') where.dueDate = null;
    if (query.due === 'today') where.dueDate = { gte: today, lt: tomorrow };
    if (query.due === 'upcoming') where.dueDate = { gte: tomorrow };
    if (query.due === 'overdue') {
      where.dueDate = { lt: today };
      if (query.status === 'DONE') where.AND = [{ status: 'DONE' }, { status: { not: 'DONE' } }];
      else where.status = query.status ?? { not: 'DONE' };
    }
  }
  return where;
}

function buildOrderBy(query: WorkItemQuery): Prisma.WorkItemOrderByWithRelationInput[] {
  const direction = query.order;
  let primary: Prisma.WorkItemOrderByWithRelationInput;
  if (query.sort === 'owner') primary = { owner: { name: direction } };
  else if (query.sort === 'dueDate') primary = { dueDate: { sort: direction, nulls: 'last' } };
  else primary = { [query.sort]: direction };
  return [primary, { createdAt: 'desc' }, { id: 'asc' }];
}

function dateOnly(value: string | null | undefined) {
  return value == null ? null : new Date(`${value}T00:00:00.000Z`);
}

export class WorkItemService {
  constructor(private readonly db: PrismaClient) {}

  async list(query: WorkItemQuery) {
    const where = buildWhere(query);
    const [data, totalItems] = await this.db.$transaction([
      this.db.workItem.findMany({ where, orderBy: buildOrderBy(query), skip: (query.page - 1) * query.pageSize, take: query.pageSize, include: includeOwner }),
      this.db.workItem.count({ where }),
    ]);
    return { data, pagination: { page: query.page, pageSize: query.pageSize, totalItems, totalPages: Math.ceil(totalItems / query.pageSize) } };
  }

  async get(id: string) {
    const item = await this.db.workItem.findUnique({ where: { id }, include: includeOwner });
    if (!item) throw new HttpError(404, 'Work item not found');
    return item;
  }

  async create(input: CreateWorkItemInput) {
    return this.db.workItem.create({
      data: {
        title: input.title,
        ...(input.description !== undefined ? { description: input.description || null } : {}),
        ...(input.ownerId !== undefined ? { ownerId: input.ownerId } : {}),
        ...(input.dueDate !== undefined ? { dueDate: dateOnly(input.dueDate) } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
      },
      include: includeOwner,
    });
  }

  async update(id: string, input: UpdateWorkItemInput) {
    return this.db.workItem.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description || null } : {}),
        ...(input.ownerId !== undefined ? { ownerId: input.ownerId } : {}),
        ...(input.dueDate !== undefined ? { dueDate: dateOnly(input.dueDate) } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
      include: includeOwner,
    });
  }

  async updateStatus(id: string, status: WorkStatus) {
    return this.db.workItem.update({ where: { id }, data: { status }, include: includeOwner });
  }
}

export const workItemQueryHelpers = { buildWhere, buildOrderBy, todayInDhaka };
