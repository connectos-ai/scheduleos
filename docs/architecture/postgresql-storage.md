# PostgreSQL Storage

## Status

Draft production storage foundation. The first schema migration, dependency-free migration runner, safe admin command foundation, pooled `pg` client adapter, guarded live PostgreSQL spec, async repository adapter slices for all current repository ports, and local Docker PostgreSQL live proof exist.

## Purpose

PostgreSQL is planned production multi-user/team storage mode for ScheduleOS. SQLite remains the local/small self-host path. JSON remains a development proof store only.

## Implemented Foundation

The initial migration lives at:

```text
migrations/postgres/001_initial.sql
```

It defines:

- Tenants.
- Workspaces.
- Users.
- Memberships.
- Tasks.
- Calendar events.
- Working hours.
- Schedule plans.
- Time blocks.
- Audit events.
- Idempotency keys.
- Integration states.

The migration uses:

- Tenant/workspace/user scoped primary keys for user-owned records.
- Membership foreign keys for scoped user data.
- `JSONB` payload columns for public domain object snapshots.
- Explicit indexes for task scope/status, task deadlines, calendar event ranges, schedule plan ranges, time block plans/times, audit resources, idempotency keys, and integration source state.
- No provider token columns.

The migration runner foundation lives at:

```text
src/postgres.ts
```

It provides:

- `loadPostgresMigrations()` to load numbered SQL files from `migrations/postgres`.
- `runPostgresMigrations()` to create `schema_migrations`, read applied versions, apply missing migrations in version order, and skip previously applied versions.
- A small `PostgresQueryClient` interface plus a `pg` pool adapter in `src/postgres-client.ts`.
- Transaction wrapping for each migration with rollback on failure.
- An admin command foundation in `src/cli.ts`; the packaged `npm run db:postgres:migrate` script performs a dry run, while `npm run db:postgres:migrate:apply` applies migrations when `SCHEDULEOS_POSTGRES_URL` is configured.
- Async repository adapter slices in `src/postgres-repositories.ts` for tasks, calendar events, working hours, schedule plans, time blocks, audit events, idempotency, and integration state; fake-client tests prove scoped behavior.

Current default tests use a fake PostgreSQL client. They prove migration ordering, skip behavior, transaction order, rollback behavior, duplicate-version rejection, disk loading, `pg` command-result normalization, and repository behavior without requiring a local PostgreSQL service. `src/postgres-live.spec.ts` provides an opt-in service proof for Docker or any disposable database named with `scheduleos_test`.

The local Docker proof passed on 2026-07-22:

```bash
npm run test:postgres:docker
npm run postgres:test:down
```

The proof starts PostgreSQL 16, waits for health, builds the TypeScript package, runs migrations against `scheduleos_test`, exercises the PostgreSQL repository slice, and then tears down the disposable volume.

## Scope Enforcement

Repository methods must continue receiving explicit actor scope. PostgreSQL queries must include tenant predicates, workspace predicates, and user predicates whenever a table carries those fields. Application code must not query raw unscoped IDs for user-owned data.

## Token Boundary

The schema intentionally does not store OAuth access tokens, refresh tokens, client secrets, cookies, or private connector internals. Provider token storage requires a separate reviewed encrypted token store or external connector boundary.

## Adapter Plan

The PostgreSQL adapter should:

1. Implement the same repository ports as the local store and SQLite adapter.
2. Use parameterized SQL only.
3. Return `RepositoryForbiddenError` when a user actor requests an existing record outside scope.
4. Return `RepositoryNotFoundError` only when the record does not exist.
5. Wrap schedule plan writes, block writes, workspace deletion, and imports in transactions.
6. Reuse `runPostgresMigrations()` during startup, installation, or explicit admin migration commands.
7. Add live migration smoke tests against an empty PostgreSQL database before the public release gate can pass.

## Current Gaps

- Guarded live PostgreSQL service spec has passed locally through Docker, but remote CI proof is still unavailable because no public repository exists.
- No PostgreSQL backup/restore guide exists.
- PostgreSQL CI service test is configured in `.github/workflows/ci.yml`, but no remote CI result exists yet.
- No previous-version live migration smoke test exists.
- No previous-version live migration smoke test exists.
