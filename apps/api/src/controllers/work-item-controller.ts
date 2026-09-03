import type { RequestHandler } from 'express';
import {
  createWorkItemSchema,
  idParamsSchema,
  updateStatusSchema,
  updateWorkItemSchema,
  workItemQuerySchema,
} from '@team-task-system/contracts';
import type { WorkItemsApi } from '../types.js';

export class WorkItemController {
  constructor(private readonly service: WorkItemsApi) {}

  list: RequestHandler = async (request, response) => {
    response.json(await this.service.list(workItemQuerySchema.parse(request.query)));
  };

  get: RequestHandler = async (request, response) => {
    const { id } = idParamsSchema.parse(request.params);
    response.json({ data: await this.service.get(id) });
  };

  create: RequestHandler = async (request, response) => {
    response.status(201).json({ data: await this.service.create(createWorkItemSchema.parse(request.body)) });
  };

  update: RequestHandler = async (request, response) => {
    const { id } = idParamsSchema.parse(request.params);
    response.json({ data: await this.service.update(id, updateWorkItemSchema.parse(request.body)) });
  };

  updateStatus: RequestHandler = async (request, response) => {
    const { id } = idParamsSchema.parse(request.params);
    const { status } = updateStatusSchema.parse(request.body);
    response.json({ data: await this.service.updateStatus(id, status) });
  };
}
