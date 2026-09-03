import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { prisma } from './db.js';
import { createWorkItemRouter } from './routes/work-items.js';
import { errorHandler, notFound } from './middleware/error-handler.js';
import { WorkItemService } from './services/work-item-service.js';
import { UserService } from './services/user-service.js';
import type { UsersApi, WorkItemsApi } from './types.js';

type Dependencies = { workItems?: WorkItemsApi; users?: UsersApi; corsOrigin?: string };

export function createApp(dependencies: Dependencies = {}) {
  const app = express();
  const workItems = dependencies.workItems ?? new WorkItemService(prisma);
  const users = dependencies.users ?? new UserService(prisma);
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: dependencies.corsOrigin ?? process.env.CORS_ORIGIN ?? 'http://localhost:5173' }));
  app.use(express.json({ limit: '32kb' }));
  app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));
  app.use('/api/work-items', createWorkItemRouter(workItems));
  app.get('/api/users', async (_request, response) => response.json({ data: await users.list() }));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
