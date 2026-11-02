import type { User } from "@bedrock/types";
import { DataTable, LoadError } from "@bedrock/ui";
import { createMemo, Errored } from "solid-js";
import type { TableColumn } from "yosegi-solid";
import { fetchUsers, getErrorMessage } from "../lib/api-client";
import styles from "./page.module.css";

const columns: TableColumn<User>[] = [
  { key: "name", label: "Name", sortable: true },
  { key: "email", label: "Email" },
  {
    key: "role",
    label: "Role",
    filter: "options",
    options: { admin: "Admin", member: "Member", viewer: "Viewer" },
  },
  {
    key: "createdAt",
    label: "Joined",
    sortable: true,
    searchable: false,
    format: (value: string) => new Date(value).toLocaleDateString(),
  },
];

export default function UsersPage() {
  // Mock data from the users table in infra/postgres-seed.sql.
  const users = createMemo(() => fetchUsers());

  return (
    <section class={styles.page}>
      <h1 class={styles["page-title"]}>Users</h1>
      <p class={styles["page-description"]}>
        Reads <code>GET /api/users</code>, which the server loads from Postgres.
      </p>

      <Errored
        fallback={(error, reset) => (
          <LoadError
            title="Couldn't load users"
            description={getErrorMessage(error())}
            onRetry={reset}
          />
        )}
      >
        {/* DataTable shows its own loading state at its fixed size. */}
        <DataTable
          data={users()}
          columns={columns}
          rowKey={(user) => String(user.id)}
          noun="users"
          height="50vh"
        />
      </Errored>
    </section>
  );
}
