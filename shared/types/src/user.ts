export type UserRole = "admin" | "member" | "viewer";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  /** ISO 8601 timestamp of when the user was created. */
  createdAt: string;
}
