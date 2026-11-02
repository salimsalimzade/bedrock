import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { createDatabase } from "./db/client";
import { createUsersRepository } from "./db/users-repository";

const port = Number(process.env.PORT ?? 3000);
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. Copy apps/server/.env.example to apps/server/.env.");
}

const db = createDatabase(databaseUrl);
const app = createApp({ users: createUsersRepository(db) });

const server = serve({ fetch: app.fetch, port }, (info) => {
  console.log(`server listening on http://localhost:${info.port}`);
});

// Docker sends SIGTERM on stop: finish open requests, then close the pool.
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close(async () => {
      await db.end();
      process.exit(0);
    });
  });
}
