import { app } from './app.js';
import { env } from './config/env.js';
import { disconnectPrisma } from './lib/prisma.js';

const server = app.listen(env.PORT, () => {
  console.log(`HanLearn API listening on http://localhost:${env.PORT}`);
});

async function shutdown() {
  server.close();
  await disconnectPrisma();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
