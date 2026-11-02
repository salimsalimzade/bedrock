import postgres from "postgres";

export type Database = postgres.Sql;

/** One pool per process. Column names come back camelCase: created_at → createdAt. */
export function createDatabase(url: string): Database {
  return postgres(url, { transform: postgres.camel });
}
