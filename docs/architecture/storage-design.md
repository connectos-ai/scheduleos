# Storage Design

## Status

Draft production storage design. ADR-002 records the accepted direction.

## Current Implementation

Current local code has:

- In-memory API store by default.
- Optional JSON-backed local persistence when `createApiServer({ storagePath })` is used.
- Repository ports for tasks, calendar events, working hours, schedule plans, time blocks, audit events, idempotency, and integration state, backed by the current API store.
- Repository-level tests proving tenant/workspace/user scope enforcement for tasks, schedule plans, time blocks, working hours, audit events, idempotency, and integration state.
- API task, schedule-plan, plan-reporting, and time-block status paths routed through repository methods where the current route contracts carry enough scope.
- Tests proving tasks, working hours, schedule plans, and block states survive restart.

This is foundation evidence, not release-ready production storage.

## Storage Modes

| Mode | Purpose | Release status |
| --- | --- | --- |
| In-memory | Fast tests and throwaway local runs. | Development only. |
| JSON file | Local proof, demos, simple development persistence. | Not production. |
| SQLite | Single-user and small self-host deployments. | Planned. |
| PostgreSQL | Multi-user/team production deployments. | Initial schema migration implemented; live adapter planned. |

## Repository Boundary

Application use cases should depend on repository ports, not concrete storage.

Initial ports:

- `TaskRepository`
- `CalendarEventRepository`
- `WorkingHoursRepository`
- `SchedulePlanRepository`
- `TimeBlockRepository`
- `AuditEventRepository`
- `IdempotencyRepository`
- `IntegrationStateRepository`

Each repository method must require one of:

- authenticated tenant/workspace/user scope
- service/system scope for internal migrations and maintenance

No repository method should accept raw unscoped identifiers alone for user data.

## Core Tables

Minimum durable model:

- `tenants`
- `workspaces`
- `users`
- `memberships`
- `auth_sessions`
- `auth_password_reset_tokens`
- `auth_login_attempt_windows`
- `tasks`
- `calendar_events`
- `working_hours`
- `working_hour_breaks`
- `schedule_plans`
- `time_blocks`
- `capacity_warnings`
- `scheduling_explanations`
- `audit_events`
- `idempotency_keys`
- `integration_states`

Local JSON-backed, SQLite, and PostgreSQL storage now include an auth model foundation for auth users, workspace memberships, and session hashes. The local API can issue and revoke persisted bearer sessions for already-authenticated scoped principals backed by active users and memberships. See [Auth Model](../security/auth-model.md). Full production identity lifecycle remains incomplete.

Future adapter tables:

- `provider_connections`
- `provider_calendar_mappings`
- `provider_task_mappings`
- `sync_cursors`
- `webhook_deliveries`

Token material must not be stored directly in ScheduleOS unless a release-reviewed encrypted token store exists. Prefer token references owned by a connector layer.

## Scope Rules

All user-owned rows should carry:

- `tenant_id`
- `workspace_id` when workspace-scoped
- `user_id` when user-specific
- `created_at`
- `updated_at`
- `version`

Calendar events may be tenant/user scoped without workspace in the current local model. Production schema should decide whether to add workspace ownership or isolate calendars under user/workspace memberships.

Repository queries must include tenant predicates. Workspace and user predicates must be included whenever the table carries those fields.

## Transactions

These operations require transactions:

- Create schedule plan and all generated blocks/warnings/explanations.
- Accept or reject a plan.
- Lock, unlock, complete, or miss a block.
- Replan from an existing plan.
- Import batch of tasks or calendar events.
- Export accepted blocks and record sync state.

Replanning should write a new plan revision or explicit schedule revision record before old state is hidden. A user must be able to understand what changed.

## Migrations

Production release requires:

- Versioned migration files.
- Reversible or documented irreversible migrations.
- Seed fixtures using fictional data only.
- Migration smoke test from empty database.
- Migration smoke test from previous schema version.
- Explicit indexes for scope, deadlines, time ranges, plan IDs, external IDs, and idempotency keys.

Migration artifacts are part of release audit and must be scanned for private data.

## Backup And Restore

Self-host backup and restore guidance is now split across:

- [SQLite Storage Operations](../operations/sqlite-storage.md)
- [PostgreSQL Migrations](../operations/postgresql-migrations.md)
- [Backup And Restore Runbook](../operations/backup-restore-runbook.md)

The runbook foundation includes:

- SQLite backup helper documented command path.
- PostgreSQL backup and restore commands.
- JSON proof-store export caveat.
- Restore validation checklist.
- Warning that backups contain sensitive task and calendar data.

## Deletion And Export

Before public release, ScheduleOS must support:

- user data export
- workspace export
- workspace deletion
- provider connection revocation
- calendar sync state reset
- deletion audit event

Exports must preserve enough structure for migration but must not include secrets, raw OAuth tokens, or private connector internals.


Current tenant/workspace/user storage-boundary verification matrix lives in [Tenant Isolation Verification](../security/tenant-isolation-verification.md).
## Current Gaps

- Repository interfaces implemented for the current local store.
- Repository APIs are still synchronous local-store contracts; database adapter contracts may need async variants before SQLite/PostgreSQL land.
- SQLite adapter, first migration, backup helper, scoped workspace export helper, scoped workspace deletion helper, and SQLite operations guide are implemented; restore helper and smoke coverage exist; CLI wrapper, concurrency hardening, and broader adapter coverage remain incomplete.
- PostgreSQL schema migration, migration runner, `pg` client adapter, guarded live PostgreSQL spec, GitHub Actions service-test workflow, and async repository adapter slices for all current ports exist; passing live PostgreSQL service proof and remote CI evidence are not complete.
- SQLite and PostgreSQL first migrations exist; rollback strategy and previous-version smoke tests remain incomplete.
- Repository-level authorization tests exist for current local-store, SQLite, and fake-client PostgreSQL adapter slices, including current storage-boundary tenant isolation verification; remote CI and broader live PostgreSQL authorization evidence remain incomplete.
- Backup, encrypted backup, restore, export, deletion, SQLite retention cleanup, and PostgreSQL retention cleanup helpers exist with smoke coverage; retention cleanup includes expired/revoked auth-session hash and expired/used password-reset-token hash plus credential-attempt-window pruning. SQLite CLI wrapper foundation, local exact-confirmation helper for destructive restore/delete/cleanup commands, retention policy duration foundation, and the production backup/restore runbook foundation exist; hosted retention cleanup and full production operator approval workflow remain incomplete.
- Export/deletion flows are not implemented.

The JSON store can continue supporting local API tests while these gaps are closed.
