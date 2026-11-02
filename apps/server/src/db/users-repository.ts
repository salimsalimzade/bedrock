import type { User, UserRole } from "@bedrock/types";
import type { UsersRepository } from "../routes/users";
import type { Database } from "./client";

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

const toUser = (row: UserRow): User => ({ ...row, createdAt: row.createdAt.toISOString() });

export function createUsersRepository(db: Database): UsersRepository {
  return {
    async list() {
      const rows = await db<UserRow[]>`
        select id, name, email, role, created_at from users order by id
      `;
      return rows.map(toUser);
    },

    async findById(id) {
      const [row] = await db<UserRow[]>`
        select id, name, email, role, created_at from users where id = ${id}
      `;
      return row && toUser(row);
    },
  };
}
