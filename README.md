# bedrock

The foundation for every web app I build.

pnpm workspaces + Turborepo, a SolidJS 2 client with `yosegi-solid`, a Hono API on Node, Vitest, Biome, Lefthook, commitlint and Docker Compose.

```
apps/
  web/        solid 2 + @solidjs/router + vite + yosegi-solid  (Dockerfile)
  server/     hono on node + vitest                             (Dockerfile)
shared/
  types/      @bedrock/types
  utils/      @bedrock/utils
  ui/         @bedrock/ui  (shared solid components)
infra/        third-party services (postgres, redis, kafka, …), one compose file each; empty for now
docker-compose.yml
.github/
  workflows/ci.yml   lint, typecheck and build on every PR and push to main
```

## Getting started

Requires Node 26 and pnpm 11. Docker is optional, for `docker compose up` and the services in [infra/](#infra).

```sh
pnpm install                                   # also installs the git hooks
cp apps/server/.env.example apps/server/.env
pnpm dev                                       # web on http://localhost:5173, api on http://localhost:3000
```

| Command                         | What it does                                |
| ------------------------------- | ------------------------------------------- |
| `pnpm build`                    | Build every app                             |
| `pnpm typecheck`                | Type-check every package                    |
| `pnpm test`                     | Run the tests                               |
| `pnpm check` / `pnpm check:fix` | Biome format + lint                         |
| `docker compose up --build`     | Run everything in containers (web on :8080) |

## Infra

`infra/` holds the third-party services the apps depend on: databases, caches, queues. Postgres, Redis and Kafka are typical examples. It's empty until an app needs one.

Each service gets one Docker Compose file, `infra/<service>.yml`, with:

- the service, its pinned image and its port on `localhost`
- a named volume, so data survives restarts
- a healthcheck, so `--wait` and `depends_on` know when it's ready

For example, `infra/redis.yml`:

```yaml
services:
  redis:
    image: redis:8.10-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10
    restart: unless-stopped

volumes:
  redis-data:
```

### Adding a service

1. Create `infra/<service>.yml` as above.
2. List it under `include:` in the root `docker-compose.yml`.
3. In `docker-compose.yml`, add it to the server's `depends_on` (with `condition: service_healthy`) and its connection URL to the server's `environment`, using the service name as the host: `redis://redis:6379`.
4. Add the same variable to `apps/server/.env.example` with `localhost` as the host, for `pnpm dev`: `REDIS_URL=redis://localhost:6379`.
5. Optionally add a root script to start it alone for local dev: `"redis:up": "docker compose up --detach --wait redis"`.

Read the connection URL from `process.env` in `apps/server/src/index.ts` only, and pass the client into `createApp`. Routes never import it directly; see [CLAUDE.md](.claude/CLAUDE.md).

## Conventions

The conventions live in [.claude/CLAUDE.md](.claude/CLAUDE.md): kebab-case file names, yosegi-solid for UI, typed Hono RPC calls, repositories for database access, and lowercase commits such as `feature(web): add settings page`.
