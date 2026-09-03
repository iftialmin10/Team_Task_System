import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createWorkItemRouter } from './routes/work-items.js';
import { errorHandler, notFound } from './middleware/error-handler.js';
import { WorkItemService } from './services/work-item-service.js';
import { UserService } from './services/user-service.js';
import type { HealthApi, UsersApi, WorkItemsApi } from './types.js';
import type { PrismaClient } from './generated/prisma/client.js';

type Dependencies = { prisma?: PrismaClient; workItems?: WorkItemsApi; users?: UsersApi; health?: HealthApi; corsOrigin?: string };

export function createApp(dependencies: Dependencies) {
  const app = express();
  if ((!dependencies.workItems || !dependencies.users) && !dependencies.prisma) {
    throw new Error('createApp requires Prisma or explicit service dependencies');
  }
  const workItems = dependencies.workItems ?? new WorkItemService(dependencies.prisma!);
  const users = dependencies.users ?? new UserService(dependencies.prisma!);
  const health = dependencies.health ?? (dependencies.prisma
    ? { check: async () => { await dependencies.prisma!.$queryRaw`SELECT 1`; } }
    : { check: async () => undefined });
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: dependencies.corsOrigin ?? process.env.CORS_ORIGIN ?? 'http://localhost:5173' }));
  app.use(express.json({ limit: '32kb' }));
  app.get('/api/health', async (_request, response) => {
    try {
      await health.check();
      response.json({ status: 'ok', database: 'connected' });
    } catch {
      response.status(503).json({ status: 'unavailable', database: 'disconnected' });
    }
  });
  app.use('/api/work-items', createWorkItemRouter(workItems));
  app.get('/api/users', async (_request, response) => response.json({ data: await users.list() }));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
