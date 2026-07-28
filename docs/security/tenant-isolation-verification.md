# Tenant Isolation Verification

## Status

Storage-boundary verification foundation complete for the current local, SQLite, and PostgreSQL repository implementations. Public release still remains blocked until production authentication, roles, memberships, sessions, and remote CI evidence are complete.

## Scope

This verification covers tenant, workspace, and user isolation at ScheduleOS storage and API boundaries that exist today:

- Local API authorization and scoped route behavior.
- In-memory/JSON-backed repository implementation.
- SQLite durable repository implementation.
- PostgreSQL async repository adapter slices.
- Guarded live PostgreSQL repository proof path.
- Export, deletion, idempotency, integration-state, audit-event, and import-throttle storage surfaces.

This verification does not claim production identity is complete. Production auth and membership enforcement remain separate release blockers.

## Boundary Rule

Every user-owned storage operation must receive an authenticated scope and enforce it inside the repository implementation. The API layer may reject invalid requests earlier, but repository methods must still reject cross-tenant, cross-workspace, or cross-user access.

Required scoped identifiers:

- `tenantId`
- `workspaceId`
- `userId`

System actors may use repository maintenance paths only where explicitly supported. User actors must match the requested scope.

## Verified Storage Surfaces

| Surface | Required Isolation | Current Evidence |
| --- | --- | --- |
| Tasks | Reads, writes, lists, deletes require matching tenant/workspace/user. | `src/repositories.test.ts`, `src/sqlite.test.ts`, `src/postgres-repositories.test.ts`, `src/api.test.ts`. |
| Calendar events | Reads, schedule lists, writes, deletes require matching tenant/workspace/user. | `src/repositories.test.ts`, `src/sqlite.test.ts`, `src/postgres-repositories.test.ts`, `src/api.test.ts`. |
| Working hours | Reads and writes require matching tenant/workspace/user. | `src/repositories.test.ts`, `src/sqlite.test.ts`, `src/postgres-repositories.test.ts`. |
| Schedule plans | Reads, lists, writes, replacement, accept/reject API paths require matching tenant/workspace/user. | `src/repositories.test.ts`, `src/sqlite.test.ts`, `src/postgres-repositories.test.ts`, `src/api.test.ts`. |
| Time blocks | Reads, moves/resizes, status changes require scope through parent plan/block ownership. | `src/repositories.test.ts`, `src/sqlite.test.ts`, `src/postgres-repositories.test.ts`, `src/api.test.ts`. |
| Audit events | Appends and reads require matching tenant/workspace/user; API rejects cross-scope reads. | `src/repositories.test.ts`, `src/sqlite.test.ts`, `src/postgres-repositories.test.ts`, `src/api.test.ts`. |
| Idempotency records | Reserve/get/complete operations are scoped by tenant/workspace/user and operation key. | `src/repositories.test.ts`, `src/sqlite.test.ts`, `src/postgres-repositories.test.ts`. |
| Integration state | Read/list/upsert operations are scoped and store connection state without provider tokens. | `src/repositories.test.ts`, `src/sqlite.test.ts`, `src/postgres-repositories.test.ts`. |
| Import throttle windows | Throttle records are scoped by tenant/workspace/user/source/operation. | `src/repositories.test.ts`, `src/sqlite.test.ts`, `src/postgres-repositories.test.ts`, `src/api.test.ts`. |
| Workspace export | Export includes only requested tenant/workspace/user data. | `src/sqlite.test.ts`. |
| Workspace deletion | Deletion removes only requested tenant/workspace/user data and preserves unrelated scope. | `src/sqlite.test.ts`. |

## Test Evidence

`npm run check` runs the relevant local suite. As of the 2026-07-22 verification pass, it includes:

- `task repository enforces tenant workspace user scope`
- `calendar event repository enforces tenant workspace user scope`
- `schedule plan repository rejects cross-scope plan access`
- `time block repository rejects cross-scope block updates`
- `audit event repository appends lists scoped events only`
- `idempotency repository reserves scoped operation keys`
- `integration state repository stores scoped sync metadata without tokens`
- `import throttle repository tracks scoped source windows`
- `SQLite repositories enforce tenant workspace user scope`
- `SQLite repositories reject cross-scope access for every durable surface`
- `SQLite workspace export includes only requested scope`
- `SQLite workspace deletion removes only requested scoped data`
- `PostgreSQL task repository rejects cross-scope writes reads`
- `PostgreSQL calendar event repository rejects cross-scope access`
- `PostgreSQL working hours repository rejects cross-scope access`
- `PostgreSQL schedule plan repository rejects cross-scope get`
- `PostgreSQL time block repository rejects cross-scope get`
- `PostgreSQL audit event repository rejects cross-scope access`
- `PostgreSQL idempotency repository rejects cross-scope access`
- `PostgreSQL integration state repository rejects cross-scope access`
- `PostgreSQL import throttle repository rejects cross-scope access`
- `local API prevents cross-scope task updates deletes`
- `local API prevents cross-scope schedule plan reads`
- `local API prevents cross-scope calendar event reads updates deletes`
- `local API lists scoped audit events rejects cross-scope audit reads`
- `local API enforces static API-key tenant scope configured`

The guarded live PostgreSQL proof path is `src/postgres-live.spec.ts`, run with `npm run test:postgres:docker` or `npm run test:postgres:live`. It seeds fictional `tenant_demo`, `workspace_demo`, and `user_jordan` data, then exercises current repository adapters against a disposable database whose name must include `scheduleos_test`.

## Remaining Release Risks

Tenant isolation at current storage boundaries is verified, but public release still needs:

- Production persisted authentication.
- Production roles and memberships.
- Session model.
- Remote CI PostgreSQL proof.
- Broader live PostgreSQL authorization coverage after production membership model lands.
- Operational monitoring for repeated authorization failures.
