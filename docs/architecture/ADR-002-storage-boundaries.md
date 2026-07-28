# ADR-002: Define Storage Boundaries And Database Direction

## Status

Accepted direction for the next implementation phase.

## Date

2026-07-21

## Context

ScheduleOS now has an in-memory API store and optional JSON-backed local persistence. That proves standalone restart behavior, but it is not enough for a release candidate.

ScheduleOS storage must support:

- Standalone single-user self-hosting.
- Future multi-user/team mode.
- Tenant, workspace, and user isolation.
- Schedule plans, time blocks, task state, calendar availability, warnings, and explanations.
- Replanning around accepted, locked, completed, and missed blocks.
- Future calendar/task adapters without sharing provider tokens across boundaries.
- Migration, backup, restore, export, deletion, and audit requirements.

The public project must not depend on compatible leadership system, OwnerOps, ConnectOS, external calendars, paid AI, or a hosted database service.

## Decision

Use repository ports as the application boundary and support two durable adapters:

1. SQLite for local single-user and small self-host deployments.
2. PostgreSQL for production multi-user and team deployments.

Keep the current JSON store only as a development/test proof. It must not be treated as the production storage layer.

All storage adapters must implement the same repository contracts:

- `TaskRepository`
- `CalendarEventRepository`
- `WorkingHoursRepository`
- `SchedulePlanRepository`
- `TimeBlockRepository`
- `AuditEventRepository`
- `IdempotencyRepository`
- `IntegrationStateRepository`

Every repository method must receive an authenticated scope or system scope explicitly. Repository implementations must enforce tenant/workspace/user predicates instead of relying only on API route checks.

## Alternatives Considered

### JSON File Only

Pros:

- Zero dependency.
- Easy to inspect.
- Good for tests and local proof.

Cons:

- Weak concurrency.
- No query integrity.
- No migrations beyond ad hoc transforms.
- Poor fit for multi-user isolation and audit requirements.

Rejected as production storage. Kept for local proof and tests.

### SQLite Only

Pros:

- Excellent local self-host story.
- Transactional.
- Easy backup.
- No server process.

Cons:

- Not ideal for multi-user/team concurrent writes.
- Harder to operate as shared production service.

Accepted for local/small self-host adapter, not final production-only choice.

### PostgreSQL Only

Pros:

- Strong production fit.
- Mature migrations, transactions, indexes, JSON support.
- Good fit for multi-tenant APIs and audit trails.

Cons:

- Requires database server.
- Heavier first-run experience for solo local users.

Accepted as production multi-user adapter, but not the only supported self-host path.

### Embedded Key-Value Store

Pros:

- Simple persistence for small installs.

Cons:

- Poor relational fit for tasks, plans, blocks, scopes, and audit data.
- More custom query and migration logic.

Rejected.

## Consequences

- The API layer must move from direct mutable store access toward application services backed by repository interfaces.
- Tests should run against the current in-memory/JSON store first, then expand to SQLite adapter tests.
- PostgreSQL schema and migrations must be designed before public release.
- Public docs must explain which storage modes are supported and which are experimental.
- Tenant authorization cannot live only at HTTP boundaries; storage adapters must enforce scoped access too.
- Release audits must inspect migration files, seed data, backups, exports, and generated database artifacts.

## Verification Evidence

- Repository-level tenant/workspace/user isolation tests now cover current in-memory/JSON-backed repositories, SQLite repositories, PostgreSQL repository slices, and local API cross-scope paths.
- SQLite tests cover cross-scope access for every current durable repository surface plus scoped workspace export and deletion.
- PostgreSQL fake-client tests cover scoped SQL shape and cross-scope rejections for current repository surfaces.
- Guarded live PostgreSQL proof path exists for disposable databases named `scheduleos_test`.
- Verification matrix lives in [Tenant Isolation Verification](../security/tenant-isolation-verification.md).

## Open Follow-Up

- Choose migration tooling after first SQLite schema lands.
- Decide whether PostgreSQL adapter should implemented directly through lightweight query builder.
- Define backup, restore, export, deletion, audit-log retention commands.
- Expand live PostgreSQL authorization coverage after the production auth, roles, memberships, and session model lands.
