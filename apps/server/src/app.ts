import type { ApiError } from "@bedrock/types";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { greetingsRoutes } from "./routes/greetings";
import { healthRoutes } from "./routes/health";
import { createUsersRoutes, type UsersRepository } from "./routes/users";

/** Everything the routes need from the outside world. index.ts wires in Postgres; tests can too. */
export interface AppDependencies {
  users: UsersRepository;
}

// Routes must stay chained so AppType carries them to the typed client in apps/web.
export function createApp(deps: AppDependencies) {
  return new Hono()
    .basePath("/api")
    .use(logger())
    .route("/health", healthRoutes)
    .route("/greetings", greetingsRoutes)
    .route("/users", createUsersRoutes(deps.users))
    .notFound((c) => c.json<ApiError>({ error: "Not found" }, 404))
    .onError((error, c) => {
      console.error(error);
      return c.json<ApiError>({ error: "Internal server error" }, 500);
    });
}

export type AppType = ReturnType<typeof createApp>;
