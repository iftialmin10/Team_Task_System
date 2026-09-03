import type { PrismaClient } from '../generated/prisma/client.js';

export class UserService {
  constructor(private readonly db: PrismaClient) {}

  list() {
    return this.db.user.findMany({ orderBy: [{ name: 'asc' }, { id: 'asc' }] });
  }
}
