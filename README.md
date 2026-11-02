# bedrock

The foundation for every web app I build.

pnpm workspaces + Turborepo, a SolidJS 2 client with `yosegi-solid`, a Hono API on Node with Postgres, Vitest, Biome, Lefthook, commitlint and Docker Compose.

```
apps/
  web/        solid 2 + @solidjs/router + vite + yosegi-solid  (Dockerfile)
  server/     hono on node + postgres.js + vitest               (Dockerfile)
shared/
  types/      @bedrock/types
  utils/      @bedrock/utils
  ui/         @bedrock/ui  (shared solid components)
infra/
  postgres.yml       postgres service, included by docker-compose.yml
  postgres-seed.sql  schema + mock data
docker-compose.yml
.github/
  workflows/ci.yml   lint, typecheck, build, test and docker images on every PR and push to main
  actions/setup/     shared node + pnpm install, for CI now and CD later
```

## Getting started

Requires Node 26, pnpm 11 and Docker.

```sh
pnpm install                                   # also installs the git hooks
cp apps/server/.env.example apps/server/.env
pnpm db:up                                     # postgres on :5432, seeded with mock users
pnpm dev                                       # web on http://localhost:5173, api on http://localhost:3000
```

| Command                          | What it does                                   |
| -------------------------------- | ---------------------------------------------- |
| `pnpm build`                     | Build every app                                |
| `pnpm typecheck`                 | Type-check every package                       |
| `pnpm test`                      | Run the tests (server tests need `pnpm db:up`) |
| `pnpm check` / `pnpm check:fix`  | Biome format + lint                            |
| `pnpm db:down` / `pnpm db:reset` | Stop postgres / wipe it and re-seed            |
| `docker compose up --build`      | Run everything in containers (web on :8080)    |

## Conventions

The conventions live in [.claude/CLAUDE.md](.claude/CLAUDE.md): kebab-case file names, yosegi-solid for UI, typed Hono RPC calls, repositories for database access, and lowercase commits such as `feature(web): add settings page`.
