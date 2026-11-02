# bedrock

The template every new web app starts from: a pnpm + Turborepo monorepo with a SolidJS client and a Hono API.

## Stack

- **pnpm workspaces** (`apps/*`, `shared/*`) and **Turborepo** for tasks (`build`, `dev`, `typecheck`, `test`).
- **apps/web**: SolidJS 2 (RC), `@solidjs/router` 2 (next), Vite with `@solidjs/vite-plugin`, and `yosegi-solid` for all UI.
- **apps/server**: Hono on Node via `@hono/node-server`; `tsx watch` in dev, bundled with `tsdown` for production. Postgres through `postgres` (postgres.js), tests with Vitest.
- **shared/types** (`@bedrock/types`), **shared/utils** (`@bedrock/utils`) and **shared/ui** (`@bedrock/ui`, Solid components): internal TypeScript-source packages, no build step.
- **Biome** for formatting and linting, **Lefthook** for git hooks, **commitlint** for commit messages.
- **Docker Compose**: `docker-compose.yml` runs the apps and includes one file per third-party service from `infra/` (`infra/postgres.yml`).

## Commands

Run from the repo root:

| Command                         | What it does                                                                                          |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `pnpm db:up`                    | Starts Postgres from `infra/postgres.yml` on :5432 and waits until it's healthy                       |
| `pnpm db:down`                  | Stops Postgres and keeps its data                                                                     |
| `pnpm db:reset`                 | Deletes the Postgres volume and starts again, re-running `infra/postgres-seed.sql`                    |
| `pnpm dev`                      | Server on :3000, web on :5173 (proxies `/api` to the server). Needs `pnpm db:up`                      |
| `pnpm build`                    | Builds every app                                                                                      |
| `pnpm typecheck`                | `tsc --noEmit` in every package                                                                       |
| `pnpm test`                     | Vitest in every package that has tests. Server tests hit the real Postgres, so run `pnpm db:up` first |
| `pnpm check` / `pnpm check:fix` | Biome format + lint + import sorting, read-only / with fixes                                          |
| `docker compose up --build`     | Postgres, server on :3000, web on :8080                                                               |

Before `pnpm dev` or `pnpm test` the first time, copy `apps/server/.env.example` to `apps/server/.env`.

Run `pnpm check:fix`, `pnpm typecheck` and `pnpm test` before saying a change is done.

## Naming: lowercase kebab-case everywhere

- **Every file and folder name is lowercase kebab-case**: `api-client.ts`, `root-layout.tsx`, `home-page.module.css`, `shared/utils`. Never `PascalCase.tsx`, `camelCase.ts` or `snake_case`. Dot-separated parts follow the same rule (`vite.config.ts`, `tsconfig.node.json`).
- The only exceptions are `README.md`, `LICENSE`, `CLAUDE.md` and `Dockerfile`.
- Enforced by Biome's `useFilenamingConvention` and by `scripts/check-file-names.ts` in the pre-commit hook.
- Components and types are still PascalCase _identifiers_ in code (`export function RootLayout`); only the file names are kebab-case.

## Styling: dashes

- CSS class names and custom properties are kebab-case: `.app-header`, `.stat-label`, `--app-sidebar-width`. No camelCase or BEM underscores.
- Component styles live in a sibling CSS module (`root-layout.module.css`). Read the classes with bracket access: `styles["app-header"]`.
- Use yosegi tokens (`var(--yosegi-space-400)`, `var(--yosegi-text-body)`, `var(--yosegi-color-fg-muted)`) instead of raw values.
- For conditional classes use Solid's array/object form, `class={[styles.card, { [styles["is-active"]]: active() }]}`, not string concatenation.

## UI: yosegi-solid first

- Build UI from `yosegi-solid` components (`Button`, `TextField`, `Select`, `Dialog`, `Toast`, `ErrorState`, `NotFound`, …) before writing custom ones.
- `yosegi-solid/styles.css` is imported once in `apps/web/src/index.tsx`; `<Toaster />` lives in the root layout, so call `toast(...)` anywhere.
- Reusable components live in `shared/ui` and are imported from `@bedrock/ui`. Only app-specific layouts and pages stay in `apps/web`.
- For data tables, use `DataTable` from `@bedrock/ui`, not yosegi's `Table` directly. The whole table, search bar and page controls included, has one fixed height in every state: loading, empty, filtered and full. Rows scroll inside it under a sticky heading, so nothing below it moves.
  - `height` sets that size: `height="50vh"` or `height={600}`. Without it, the table fits one page of rows at its `pageSize` (10 by default).
  - There's no `maxHeight` or `style`.
  - Don't wrap it in `<Loading>`: while `data` is loading, it shows an empty table at the same size that says "Loading …".
- Theme it by overriding `--yosegi-*` custom properties in CSS, not by forking components.
- Its API reference is in `node_modules/yosegi-solid/README.md` and the `.d.ts` files under `node_modules/yosegi-solid/dist/source/components/`.

## SolidJS 2 (not 1.x, not React)

Solid 2 is a release candidate and differs a lot from 1.x. Before writing Solid code, read `node_modules/solid-js/skills/solid-2.0-cheatsheet/SKILL.md` (in `apps/web`). The points people get wrong most:

- Imports: `render` comes from `@solidjs/web`; stores are in `solid-js`; `jsxImportSource` is `@solidjs/web`.
- `Suspense` → `Loading`, `ErrorBoundary` → `Errored`, `onMount` → `onSettled`, `createResource` → `createMemo(() => fetchX())`.
- `createEffect(compute, apply)` always takes two functions.
- No signal writes inside memos or component bodies; write in event handlers or `onSettled`.
- Pass values, not accessors, as props (`<X value={count()} />`), and never destructure props.

The router is `@solidjs/router` 2: routes are config objects passed to `createRouter` in `apps/web/src/router.ts`, links are plain `<a href={paths.foo}>`, and active links get `aria-current="page"`. Its README is in `node_modules/@solidjs/router/README.md`.

## Server and API calls

- Routes live in `apps/server/src/routes/<name>.ts` as sub-apps, mounted in `apps/server/src/app.ts` under `/api`.
- **Chain every route** (`new Hono().get(...).post(...)`, `.route(...)`) so `AppType` keeps its types; separate `app.get(...)` statements produce an untyped client.
- The web app calls the server only through the typed client in `apps/web/src/lib/api-client.ts` (`hc<AppType>`). Add one small function per endpoint there and use `parseResponse`. Never call `fetch("/api/...")` directly.
- Error responses use the shared `ApiError` shape (`{ error: string }`); `getErrorMessage` turns them into readable text.
- Keep `apps/server/src/app.ts` and its routes free of Node-only code; the web app typechecks them. Node specifics (`process.env`, `serve`, the database pool) belong in `apps/server/src/index.ts`.

## Database

- Postgres runs from `infra/postgres.yml`. Its schema and mock data are in `infra/postgres-seed.sql`, which runs only on an empty volume, so after editing it run `pnpm db:reset`.
- `apps/server/src/db/client.ts` creates the postgres.js pool, which returns columns in camelCase (`created_at` → `createdAt`). Write SQL with tagged templates (`` db`select … where id = ${id}` ``), never string concatenation.
- Routes never import the database. Each route declares the interface it needs (`UsersRepository` in `routes/users.ts`), `db/<name>-repository.ts` implements it with SQL, and `index.ts` passes it into `createApp(deps)`. That keeps postgres out of the web app's type graph and lets tests pass in whatever they need.
- Convert rows to the shared types before returning them, e.g. `Date` → ISO string.

## Tests

- Vitest; tests sit next to the code as `<name>.test.ts`.
- Call routes through Hono's typed `testClient(createApp(deps))`, not raw URLs.
- Server tests are integration tests against the real Postgres (`pnpm db:up`) and only read the seed data. A test that writes data must clean up after itself.
- `vitest.config.ts` loads `apps/server/.env`, the same file `pnpm dev` uses.

## Shared packages

- Types used on both sides go in `shared/types`, and pure helpers in `shared/utils`. One concept per file, re-exported from `src/index.ts`. Both must run in the browser and in Node: no DOM and no Node APIs.
- `shared/ui` is browser-only Solid code. Put each component in its own folder: `src/<name>/<name>.tsx`, plus `src/<name>/<name>.module.css` if it needs styles. Export it from `src/index.ts`.
  - Build components on yosegi-solid and style them with yosegi tokens.
  - Keep them free of app concerns: no API client, router or app state. Pass data in as props, e.g. `LoadError` takes a `description` string, and the page turns the error into text with `getErrorMessage`.
  - `solid-js`, `@solidjs/web` and `yosegi-solid` are peer dependencies pinned to the same versions as `apps/web`, so there is one copy of Solid. Update them in both places together.
- A new shared package goes in `shared/<name>` with the name `@bedrock/<name>` and `"exports": { ".": "./src/index.ts" }`.

## Docker

```
apps/web/Dockerfile
apps/server/Dockerfile
infra/postgres.yml        one compose file per third-party service
infra/postgres-seed.sql
docker-compose.yml        the apps + include: [infra/*.yml]
```

- Each app's `Dockerfile` sits next to it and is built from the repo root with `turbo prune`.
- To add a third-party service (redis, rabbitmq, …), create `infra/<service>.yml` with the service, its volume and a healthcheck. List it under `include:` in `docker-compose.yml`, add it to the server's `depends_on` and `environment`, and add a matching `.env.example` entry for local dev.
- A new app needs its own `Dockerfile`, a service in `docker-compose.yml`, a workspace under `apps/`, and an entry in the `docker` job's `matrix.app` in `.github/workflows/ci.yml`.

## CI

`.github/workflows/ci.yml` runs on pull requests and pushes to `main`:

- **check**: `biome ci`, `pnpm typecheck` and `pnpm build`. Commit messages and file names are checked only locally, by the Lefthook hooks.
- **test**: `pnpm db:up`, copies `.env.example` to `.env`, then `pnpm test`.
- **docker**: builds each app's image without pushing it.

Every job installs through the composite action in `.github/actions/setup`, and future workflows should use it too. There's no CD yet. It will go in `.github/workflows/deploy.yml`, which calls `ci.yml` (it has a `workflow_call` trigger) before deploying. The comment at the top of `ci.yml` covers the details.

## Commits

Lefthook runs the hooks:

- **pre-commit** checks staged file names and runs `biome check --write` on staged files. Fixes are re-staged automatically, and anything Biome can't fix blocks the commit.
- **commit-msg** runs commitlint.
- **pre-push** runs `biome ci` and `pnpm typecheck`. It doesn't run tests, because they need Postgres running.

Commit messages are `type(scope): subject`, **all lowercase**, with the type one of `feature`, `bugfix`, `refactor`, `chore` or `docs`. The scope is optional and kebab-case:

```
feature(web): add settings page
bugfix(server): return 404 for unknown greetings
refactor(shared): move date helpers into utils
chore: bump hono
docs(readme): explain docker setup
```
