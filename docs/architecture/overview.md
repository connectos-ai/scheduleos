# ScheduleOS Architecture Overview

## Status

Draft architecture for the clean independent ScheduleOS build.

This document describes the intended system. It is not evidence that the product is implemented.

## Product Promise

ScheduleOS turns tasks into a realistic plan.

It should answer:

```text
Given my tasks, commitments, priorities, deadlines, availability, preferences, and constraints:
what should I work on, and when should I do it?
```

The simplest standalone flow must work without AI or integrations:

1. Add a task.
2. Estimate duration.
3. Add deadline.
4. Configure working hours.
5. Add fixed commitments.
6. Choose "Plan my day."
7. Receive a workable time-blocked plan or an honest capacity warning.

## Architecture Principles

- ScheduleOS works independently.
- AI is optional.
- External calendars are optional.
- External task sources are optional.
- compatible leadership system, OwnerOps, and ConnectOS are optional.
- Deterministic scheduling validation is mandatory.
- The solver owns schedule feasibility; an LLM never does.
- Imported content is untrusted.
- Calendar privacy is protected by default.
- Public interfaces are the only integration path.
- No private compatible leadership system logic belongs in ScheduleOS.

## Top-Level Shape

```text
User / API Client / Adapter
          |
          v
  Application Use Cases
          |
          v
  Domain Model and Policies
          |
          v
  Optimization Engine Port
          |
          v
  Solver Adapter
          |
          v
  Schedule Plan + Explanations + Events
```

## Three Intelligence Layers

### 1. Understanding Layer

Purpose: convert messy input into structured scheduling data.

Inputs may come from:

- Manual task forms.
- CSV or JSON imports.
- ICS imports.
- Generic webhooks.
- OwnerOps.
- ConnectOS.
- Optional AI providers.

Rules:

- AI is optional.
- AI output is never trusted directly.
- All output is schema-validated.
- Critical constraints such as deadlines, duration, owner, tenant, and authorization are never silently invented.
- Untrusted imported descriptions are delimited and treated as source content, not instructions.

### 2. Optimization Layer

Purpose: create the actual schedule.

Rules:

- Uses deterministic constraints, scoring, and feasibility checks.
- Supports hard constraints, soft preferences, weighted objectives, and schedule-stability penalties.
- Reports unscheduled work and capacity warnings honestly.
- Runs behind the `OptimizationEngine` port so Timefold, OR-Tools, or a simple deterministic engine can be swapped.

Initial direction:

- Start with a minimal deterministic engine to prove the domain model and tests.
- Add Timefold Solver Java/Kotlin as the primary mature solver candidate behind a service or worker boundary.
- Keep OR-Tools as alternate/benchmark.

### 3. Explanation Layer

Purpose: explain outcomes using actual solver inputs and results.

It may explain:

- Why a task was scheduled at a time.
- Why a task could not fit.
- Why another task moved.
- Which deadline is at risk.
- Which preference or hard constraint controlled a decision.
- What could be delayed, shortened, delegated, split, or stopped.

Rules:

- Explanations must be grounded in recorded constraints and solver outcomes.
- No fabricated coaching.
- Private calendar content should remain redacted unless the user has permission and the detail is needed.

## Application Layers

```text
apps/
  web/              owner-facing standalone app
  api/              public REST API and webhook receiver
  worker/           background sync, replanning, solver jobs

packages/
  domain/           pure scheduling domain model
  application/      use cases and policies
  solver/           optimization engine port and adapters
  storage/          repositories, migrations, transactions
  integrations/     ICS, OwnerOps, ConnectOS, generic webhook, mock providers
  security/         authz helpers, redaction, audit events
  examples/         fictional fixtures and persona demos
```

## Current Local Storage Foundation

The first local implementation keeps an in-memory API store by default and supports optional JSON-backed persistence when the API server is created with a storage path. This is enough to prove standalone local restart behavior for tasks, working hours, schedule plans, and block states.

This is not the final production storage design. The release candidate still needs repository interfaces, migration strategy, tenant-aware authorization checks at storage boundaries, backup/restore guidance, and a production database decision.

See `docs/architecture/ADR-002-storage-boundaries.md` and `docs/architecture/storage-design.md` for the accepted storage direction.

This layout is a planning target. The implementation may adjust it if tests and maintainability support a better local shape.

## Core Use Cases

- Submit task.
- Import task.
- Update task.
- Create fixed event.
- Import calendar events.
- Update working hours.
- Update preferences.
- Create schedule.
- Replan schedule.
- Accept plan.
- Reject plan.
- Lock block.
- Unlock block.
- Move block.
- Complete block.
- Report missed block.
- Detect capacity risk.
- Explain plan.
- Export ICS.
- Publish events.

## Core Domain Objects

- Tenant.
- Workspace.
- User.
- Membership.
- SchedulingTask.
- CalendarEvent.
- AvailabilityWindow.
- WorkingHours.
- Preference.
- Habit.
- Routine.
- Dependency.
- SchedulePlan.
- TimeBlock.
- ScheduleRevision.
- ConstraintOutcome.
- CapacityWarning.
- SchedulingExplanation.
- ProviderConnection.
- SyncState.
- AuditEvent.

## Data Flow

```text
Task sources + calendar sources
          |
          v
Validated provider-neutral models
          |
          v
Eligibility and policy checks
          |
          v
Optimization request
          |
          v
Schedule plan, unscheduled work, risks, constraint outcomes
          |
          v
User decision: accept, reject, lock, move, complete, or replan
          |
          v
Storage updates + calendar exports/write-back + domain events
```

## Replanning Flow

```text
Trigger
  -> load accepted plan and current source state
  -> preserve locked blocks and accepted stable blocks
  -> identify affected tasks/events
  -> run optimization with schedule-stability penalty
  -> produce revision
  -> explain what moved, what stayed, and why
  -> emit schedule.replanned or schedule.capacity_exceeded
```

Replanning triggers include:

- New task.
- Changed duration.
- Changed deadline.
- Task completion.
- Partial completion.
- Missed block.
- New meeting.
- Cancelled meeting.
- Changed working hours.
- Locked block.
- User rejection.
- OwnerOps status change.
- Task becomes blocked or unblocked.
- Priority change.
- Dependency completion.
- Calendar-provider update.

## Privacy Defaults

- Store least calendar content necessary.
- Prefer busy/free boundaries over full event details.
- Redact private event titles in explanations.
- Do not log calendar descriptions.
- Do not log access tokens.
- Do not send full calendar content to AI providers by default.
- Treat imported task/message/calendar text as untrusted content.
- Keep AI disabled by default in local deterministic mode.

## Release-Honest Current Status

Implemented today:

- Current-state audit.
- Open-source scheduler research audit.
- ADR-001.
- This architecture overview.

Not yet implemented:

- Product app.
- API.
- Storage.
- Solver.
- Replanning.
- Integrations.
- Tests.
- Security/privacy/licensing release gates.
- Public repository.
