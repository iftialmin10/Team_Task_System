import { Router, type RequestHandler } from 'express';
import { createWorkItemSchema, idParamsSchema, updateStatusSchema, updateWorkItemSchema, workItemQuerySchema } from '@team-task-system/contracts';
import type { WorkItemsApi } from '../types.js';

const run = (handler: RequestHandler) => handler;

export function createWorkItemRouter(service: WorkItemsApi) {
  const router = Router();
  router.get('/', run(async (request, response) => {
    const query = workItemQuerySchema.parse(request.query);
    response.json(await service.list(query));
  }));
  router.get('/:id', run(async (request, response) => {
    const { id } = idParamsSchema.parse(request.params);
    response.json({ data: await service.get(id) });
  }));
  router.post('/', run(async (request, response) => {
    const input = createWorkItemSchema.parse(request.body);
    response.status(201).json({ data: await service.create(input) });
  }));
  router.patch('/:id/status', run(async (request, response) => {
    const { id } = idParamsSchema.parse(request.params);
    const { status } = updateStatusSchema.parse(request.body);
    response.json({ data: await service.updateStatus(id, status) });
  }));
  router.patch('/:id', run(async (request, response) => {
    const { id } = idParamsSchema.parse(request.params);
    const input = updateWorkItemSchema.parse(request.body);
    response.json({ data: await service.update(id, input) });
  }));
  return router;
}
