# Implementation Plan

## Status

Draft plan with early local implementation underway. A TypeScript domain/API/scheduler foundation now exists, including optional JSON-backed local storage, but it is not release-complete.

## Build Rule

Build ScheduleOS as a clean independent workspace. Do not copy private history. Do not publish. Do not add remote. Do not import private compatible leadership system, OwnerOps, or ConnectOS code.

## Phase 1: Repository Skeleton

Create a local-only implementation skeleton:

```text
apps/
  api/
  web/
  worker/
packages/
  domain/
  application/
  solver/
  storage/
  integrations/
  security/
  examples/
docs/
```

Initial tech choice should optimize for:

- Easy local run.
- Strong tests.
- Type-safe domain contracts.
- Future web/API split.
- Solver-service abstraction.
- Self-hosting path.

Recommended first implementation stack:

- TypeScript for app/API/domain.
- Node test runner or Vitest for fast tests.
- JSON local proof now exists; ADR-002 chooses repository ports with SQLite for local/small self-host and PostgreSQL for production multi-user deployments.
- No external AI dependency.
- No external calendar dependency.
- Deterministic baseline solver first.

## Phase 2: Pure Domain Package

Implement:

- `SchedulingTask`.
- `CalendarEvent`.
- `WorkingHours`.
- `AvailabilityWindow`.
- `TimeBlock`.
- `SchedulePlan`.
- `CapacityWarning`.
- `SchedulingExplanation`.
- Validation.
- Tenant/workspace/user scope helpers.

Tests:

- Task validation.
- Duration validation.
- Deadline validation.
- Calendar privacy redaction.
- Tenant scope.

## Phase 3: Deterministic Baseline Scheduler

Implement a minimal deterministic engine behind `OptimizationEngine`.

Must support:

- Working hours.
- Fixed busy events.
- Priority.
- Deadlines.
- Earliest start.
- Splittable tasks.
- Non-splittable tasks.
- Locked blocks.
- Basic capacity warnings.
- Grounded explanations.

Tests:

- Feasible schedule.
- Fixed-event collision avoided.
- Outside-hours avoided.
- Non-splittable task preserved.
- Splittable task split.
- Locked block preserved.
- Impossible schedule reported honestly.

## Phase 4: Application Use Cases

Implement:

- Submit task.
- Create fixed event.
- Update working hours.
- Create schedule.
- Accept plan.
- Lock block.
- Complete block.
- Replan schedule.
- Get capacity.
- Get explanations.

Tests:

- Manual task to scheduled block.
- Lock block then replan.
- Complete block then replan remaining duration.
- Add new meeting then replan.

## Phase 5: Local API

Implement REST endpoints from `docs/architecture/integration-model.md`.

Minimum:

- Tasks.
- Calendar events.
- Working hours.
- Schedule plan creation.
- Plan accept/reject.
- Block lock/unlock/complete/missed.
- Capacity.
- Explanations.

Tests:

- API validation.
- Authorization placeholders.
- Idempotency on imports.
- Structured error shape.

## Phase 6: Import/Export And Mock Integrations

Implement:

- CSV import foundation. Implemented locally with provider-neutral batch import, quoted-field parsing, and row-level errors.
- JSON import foundation. Implemented locally with provider-neutral batch import and row-level errors.
- ICS import.
- ICS export.
- Mock OwnerOps task source.
- Mock ConnectOS calendar source.
- Generic webhook.

Tests:

- CSV task import foundation. Implemented for batch import, idempotent updates, row-level errors, missing duration, quoted fields, and inert formula-like text.
- JSON task import foundation. Implemented for batch import, idempotent updates, row-level errors, missing duration, and inert text.
- ICS fixed event import.
- ICS accepted schedule export.
- Mock OwnerOps import.
- Mock ConnectOS calendar import.
- Disconnected-mode still works.

## Phase 6: Storage Hardening

Implemented foundation:

- Repository ports for local, SQLite, and future PostgreSQL adapters.
- SQLite durable storage, migration, backup, restore, scoped export, and scoped deletion helpers.
- PostgreSQL initial schema migration.
- PostgreSQL dependency-free migration runner contract with fake-client tests.
- PostgreSQL safe dry-run admin command through `npm run db:postgres:migrate` and opt-in apply command through `npm run db:postgres:migrate:apply`.
- PostgreSQL `pg` pool adapter selected and wired behind `PostgresQueryClient`.
- PostgreSQL async task, calendar event, working-hours, schedule-plan, time-block, audit-event, idempotency, and integration-state repository adapter slices with fake-client scope tests.
- Guarded live PostgreSQL spec and Docker Compose test database definition.
- GitHub Actions CI workflow with default build/test/audit job and PostgreSQL service test job.

Remaining work:

- Run live PostgreSQL service tests successfully in local Docker and remote CI.
- Capture remote CI status evidence after repository publication.
- SQLite concurrency and busy-timeout hardening.
- Production backup/restore guidance for PostgreSQL.

## Phase 7: Solver Prototypes

Prototype:

- Timefold Solver adapter for task-to-timeblock assignment.
- OR-Tools adapter for the same fixture.

Compare:

- Modeling complexity.
- Solve quality.
- Schedule stability.
- Explanation data.
- Runtime/deployment complexity.
- Self-hosting burden.

Record outcome in a future ADR.

## Phase 8: Web UI

Build the standalone owner/user experience:

- Task inbox.
- Task editor.
- Fixed event editor.
- Working hours settings.
- Daily plan.
- Weekly plan.
- Unscheduled queue.
- Capacity warnings.
- Explanation drawer.
- Replan summary.

Labels should stay simple:

- Plan my day.
- Replan.
- Keep this time.
- Move this.
- Split task.
- Could not fit.
- Deadline at risk.
- Protect focus time.

## Phase 9: Security And Release Gates

Before any public release:

- Unit tests pass.
- Solver tests pass.
- Integration tests pass.
- Security tests pass.
- E2E smoke test passes.
- Dependency audit passes or documented exceptions approved.
- Licensing audit passes.
- Secret scan passes.
- Personal-information scan passes.
- Git-history scan passes.
- Clean checkout build passes.
- README quickstart works.
- Public release checklist passes.

## First Vertical Slice Definition

The first implementation slice is complete only when a fictional local user can:

1. Configure working hours.
2. Add fixed events.
3. Add tasks with duration, deadline, and priority.
4. Generate a feasible schedule.
5. See unscheduled work when capacity is insufficient.
6. Lock a block.
7. Add a new meeting.
8. Replan without moving the locked block.
9. See what changed and why.
10. Complete a block and replan remaining work.

No AI or external integration is required for this slice.
