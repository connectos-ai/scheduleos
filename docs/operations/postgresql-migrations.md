# PostgreSQL Migrations

## Status

Draft operational foundation. The migration runner, admin command foundation, `pg` client adapter, async repository adapter slices, and GitHub Actions PostgreSQL service job are implemented and tested locally where possible. A guarded live PostgreSQL spec now exists, but it still must pass in local Docker and remote CI before public release.

## Implemented Runner

PostgreSQL migration support lives in:

```text
src/postgres.ts
```

The runner:

- Loads numbered SQL files from `migrations/postgres`.
- Creates `schema_migrations` if it does not exist.
- Reads already-applied migration versions.
- Applies missing migrations in version order.
- Skips versions already recorded.
- Wraps each migration in `BEGIN` / `COMMIT`.
- Runs `ROLLBACK` if a migration fails.
- Rejects duplicate or invalid migration versions.

## Admin Command

The admin command foundation lives in:

```text
src/cli.ts
```

The safe packaged command is:

```bash
npm run db:postgres:migrate
```

It runs:

```bash
node dist/cli.js postgres:migrate --dry-run
```

To apply migrations, build the project, set `SCHEDULEOS_POSTGRES_URL`, and run:

```bash
npm run build
SCHEDULEOS_POSTGRES_URL=postgres://user:password@localhost:5432/scheduleos npm run db:postgres:migrate:apply
```

The CLI also accepts an injected `PostgresQueryClient`; tests prove both the injected fake-client path and the env-created `pg` client path without requiring a local PostgreSQL service.

Supported command options:

- `--dry-run` lists migration files without applying them.
- `--json` emits JSON output.
- `--migrations-dir <path>` loads migrations from a custom directory.

## Repository Adapter Slices

The async repository adapter slices live in:

```text
src/postgres-repositories.ts
```

They currently provide scoped async repositories for tasks, calendar events, working hours, schedule plans, time blocks, audit events, idempotency, and integration state over `PostgresQueryClient`. Fake-client tests prove parameterized SQL shape, JSONB payload handling, scoped reads/writes, transaction behavior, cross-scope rejection, missing-row behavior, and system actor access.

## Live PostgreSQL Test Path

The guarded live test spec lives in:

```text
src/postgres-live.spec.ts
```

It resets only databases whose URL path includes `scheduleos_test`, runs PostgreSQL migrations, seeds a fictional tenant/workspace/user membership, and exercises all current PostgreSQL repository adapters against the live database.

Use Docker:

```bash
npm run test:postgres:docker
npm run postgres:test:down
```

Or provide your own disposable test database:

```bash
npm run build
SCHEDULEOS_TEST_POSTGRES_URL=postgres://user:password@localhost:5432/scheduleos_test npm run test:postgres:live
```

## Client Contract

The runner and repository adapters accept any client implementing:

```ts
interface PostgresQueryClient {
  query(
    sql: string,
    params?: readonly unknown[]
  ): Promise<{
    rows: Array<Record<string, unknown>>;
    rowCount?: number;
  }>;
}
```

ScheduleOS includes a `pg` pool adapter in `src/postgres-client.ts`. It delegates single parameterized queries to the pool and pins transaction queries to one checked-out client until `COMMIT` or `ROLLBACK`.

## Current Verification

`npm run check` verifies:

- Migration SQL contains required production tables.
- Migration SQL uses scoped indexes and `JSONB` payloads.
- Migration SQL does not define provider secret columns.
- Migration files load from disk in version order.
- Missing migrations apply transactionally.
- Already-applied migrations are skipped.
- Failed migrations roll back.
- Duplicate versions are rejected.
- CLI dry-runs without a database client.
- CLI applies migrations with an injected client.
- CLI refuses live apply without configured client.
- CLI supports JSON output and custom migration directories.
- `pg` client adapter delegates parameterized queries.
- `pg` client adapter pins transaction queries to a checked-out client.
- `pg` client adapter closes pools.

The live PostgreSQL spec is intentionally separate from `npm run check` and requires Docker or `SCHEDULEOS_TEST_POSTGRES_URL`.

## Release Gaps

Before public release, ScheduleOS still needs:

- Live PostgreSQL service test passing in local Docker and remote CI.
- Remote CI status evidence once the repository exists and GitHub Actions can run.
- Empty-database and previous-version migration smoke tests.
- Provider-specific managed-database snapshot guidance.

PostgreSQL backup and restore command guidance now lives in [Backup And Restore Runbook](backup-restore-runbook.md).
