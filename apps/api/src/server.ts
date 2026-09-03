import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { getConfig } from './config.js';

dotenv.config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true });
const config = getConfig();
const server = createApp({ corsOrigin: config.CORS_ORIGIN }).listen(config.PORT, () => {
  console.log(`API listening on http://localhost:${config.PORT}`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
