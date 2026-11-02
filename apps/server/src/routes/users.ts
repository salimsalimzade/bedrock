import type { ApiError, User } from "@bedrock/types";
import { Hono } from "hono";

/** What the routes need from storage; apps/server/src/db/users-repository.ts implements it with Postgres. */
export interface UsersRepository {
  list(): Promise<User[]>;
  findById(id: number): Promise<User | undefined>;
}

export function createUsersRoutes(users: UsersRepository) {
  return new Hono()
    .get("/", async (c) => c.json(await users.list(), 200))
    .get("/:id", async (c) => {
      const id = Number(c.req.param("id"));

      if (!Number.isInteger(id) || id < 1) {
        return c.json<ApiError>({ error: "User id must be a positive integer." }, 400);
      }

      const user = await users.findById(id);

      if (!user) {
        return c.json<ApiError>({ error: "User not found." }, 404);
      }

      return c.json(user, 200);
    });
}
