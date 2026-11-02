import { testClient } from "hono/testing";
import { afterAll, describe, expect, it } from "vitest";
import { createApp } from "../app";
import { createDatabase } from "../db/client";
import { createUsersRepository } from "../db/users-repository";

// Integration test: runs against the real postgres from infra/postgres.yml (pnpm db:up).
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Run pnpm db:up and copy apps/server/.env.example to .env.",
  );
}

const db = createDatabase(databaseUrl);
const client = testClient(createApp({ users: createUsersRepository(db) }));

afterAll(() => db.end());

describe("GET /api/users", () => {
  it("returns the seeded users in id order", async () => {
    const response = await client.api.users.$get();
    expect(response.status).toBe(200);

    const users = await response.json();
    expect(users.length).toBeGreaterThanOrEqual(50);
    expect(users.map((user) => user.id)).toEqual(
      [...users.map((user) => user.id)].sort((a, b) => a - b),
    );
    expect(users[0]).toMatchObject({
      name: "Ada Lovelace",
      email: "ada.lovelace@example.com",
      role: "admin",
    });
  });

  it("returns createdAt as an ISO timestamp", async () => {
    const [user] = await (await client.api.users.$get()).json();
    expect(user?.createdAt).toBe(new Date(user?.createdAt ?? "").toISOString());
  });
});

describe("GET /api/users/:id", () => {
  it("returns one user", async () => {
    const response = await client.api.users[":id"].$get({ param: { id: "2" } });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: 2, name: "Grace Hopper" });
  });

  it("returns 404 for a user that doesn't exist", async () => {
    const response = await client.api.users[":id"].$get({ param: { id: "999999" } });
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "User not found." });
  });

  it("returns 400 for an id that isn't a positive integer", async () => {
    const response = await client.api.users[":id"].$get({ param: { id: "abc" } });
    expect(response.status).toBe(400);
  });
});
