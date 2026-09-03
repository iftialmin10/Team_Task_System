import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { getConfig } from './config.js';
import { closeDatabase, createDatabase } from './db.js';

dotenv.config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true });
const config = getConfig();
const database = createDatabase(config);
const server = createApp({ prisma: database.prisma, corsOrigin: config.CORS_ORIGIN }).listen(config.PORT, () => {
  console.log(`API listening on http://localhost:${config.PORT}`);
});

let shuttingDown = false;
const shutdown = () => {
  if (shuttingDown) return;
  shuttingDown = true;
  server.close(async () => {
    await closeDatabase(database);
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
