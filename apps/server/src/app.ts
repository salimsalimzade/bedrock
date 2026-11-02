import type { ApiError } from "@bedrock/types";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { greetingsRoutes } from "./routes/greetings";
import { healthRoutes } from "./routes/health";

// Routes must stay chained so AppType carries them to the typed client in apps/web.
export function createApp() {
  return new Hono()
    .basePath("/api")
    .use(logger())
    .route("/health", healthRoutes)
    .route("/greetings", greetingsRoutes)
    .notFound((c) => c.json<ApiError>({ error: "Not found" }, 404))
    .onError((error, c) => {
      console.error(error);
      return c.json<ApiError>({ error: "Internal server error" }, 500);
    });
}

export type AppType = ReturnType<typeof createApp>;
