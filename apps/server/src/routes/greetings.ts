import type { ApiError, Greeting } from "@bedrock/types";
import { toTitleCase } from "@bedrock/utils";
import { Hono } from "hono";

const maxNameLength = 40;

export const greetingsRoutes = new Hono().get("/:name", (c) => {
  const name = toTitleCase(c.req.param("name"));

  if (name.length === 0 || name.length > maxNameLength) {
    const error: ApiError = { error: `Name must be 1 to ${maxNameLength} characters.` };
    return c.json(error, 400);
  }

  const greeting: Greeting = {
    message: `Hello, ${name}!`,
    createdAt: new Date().toISOString(),
  };

  return c.json(greeting, 200);
});
