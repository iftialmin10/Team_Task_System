import { Router } from 'express';
import type { WorkItemsApi } from '../types.js';
import { WorkItemController } from '../controllers/work-item-controller.js';

export function createWorkItemRouter(service: WorkItemsApi) {
  const router = Router();
  const controller = new WorkItemController(service);
  router.get('/', controller.list);
  router.get('/:id', controller.get);
  router.post('/', controller.create);
  router.patch('/:id/status', controller.updateStatus);
  router.patch('/:id', controller.update);
  return router;
}
