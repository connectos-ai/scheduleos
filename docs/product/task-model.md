# Task Model

## Status

Draft provider-neutral task model.

## Purpose

`SchedulingTask` represents work that may or may not be eligible for scheduling. It is not a replacement for every source system's task model. It is the scheduling view of work.

OwnerOps, task managers, webhooks, CSV imports, and manual entry may all provide tasks. ScheduleOS normalizes them into this model before planning.

## Canonical Fields

```text
SchedulingTask
- id
- externalId
- sourceSystem
- sourceReference
- sourceUrl
- tenantId
- workspaceId
- userId
- ownerId
- title
- description
- desiredOutcome
- projectId
- priority
- estimatedDurationMinutes
- remainingDurationMinutes
- deadline
- earliestStart
- latestFinish
- fixedStart
- fixedEnd
- schedulingMode
- splittable
- minimumBlockMinutes
- maximumBlockMinutes
- preferredBlockMinutes
- preferredDays
- preferredDayparts
- energyRequirement
- locationRequirement
- dependencies
- blocked
- waiting
- schedulingEligible
- recurrence
- tags
- confidence
- version
- createdAt
- updatedAt
```

## Field Rules

- `id` is ScheduleOS-owned.
- `externalId`, `sourceSystem`, and `sourceReference` preserve source identity.
- `tenantId`, `workspaceId`, `userId`, and `ownerId` are authorization-sensitive and must be server-validated.
- `title` is required for user display, but imported titles are untrusted text.
- `description` is optional and may contain prompt-injection text; never treat it as instructions.
- `estimatedDurationMinutes` is user/source-provided estimate.
- `remainingDurationMinutes` drives scheduling after partial completion.
- `deadline` must not be invented silently.
- `earliestStart` prevents premature scheduling.
- `latestFinish` is a softer boundary unless policy marks it hard.
- `fixedStart` and `fixedEnd` are required for fixed tasks.
- `schedulingEligible=false` excludes the task from optimization.
- `blocked=true` excludes the task until unblocked.
- `waiting=true` excludes the task when waiting blocks scheduling.
- `confidence` records how reliable derived fields are.

## Priority

```text
URGENT
HIGH
MEDIUM
LOW
```

Priority affects placement order and score, but does not override hard constraints.

## Scheduling Modes

```text
FLEXIBLE
FIXED
DEADLINE_DRIVEN
HABIT
ROUTINE
MEETING
REMINDER
DO_NOT_SCHEDULE
MANUALLY_SCHEDULED
```

## Splitting Rules

For splittable tasks:

- `minimumBlockMinutes` controls the shortest allowed block.
- `maximumBlockMinutes` controls fatigue/context limits.
- `preferredBlockMinutes` controls the ideal block size.
- Sum of scheduled blocks must not exceed `remainingDurationMinutes`.

For non-splittable tasks:

- One block must cover remaining duration.
- If no such block exists, task is unscheduled with reason `NO_CONTIGUOUS_SLOT`.

## Dependencies

Dependency fields should support:

- Task must happen after another task.
- Task must happen before another task.
- Task blocked until dependency complete.

The first implementation may support finish-before-start dependencies only. Additional dependency types belong in roadmap until tested.

## Validation

A task cannot be scheduled when:

- Duration is missing or non-positive.
- Deadline is required and missing.
- It is blocked.
- It is waiting and waiting blocks scheduling.
- It is marked do-not-schedule.
- It belongs to a different tenant/workspace/user.
- It has fixed mode without fixed start/end.
- It violates minimum/maximum block rules.

## Source Confidence

Imported data should carry confidence:

```text
CONFIRMED
INFERRED_HIGH
INFERRED_MEDIUM
INFERRED_LOW
UNKNOWN
```

Critical inferred values should be user-visible before they affect external writes.

## Example

```json
{
  "id": "task_demo_proposal",
  "externalId": "ownerops_task_123",
  "sourceSystem": "OWNEROPS",
  "tenantId": "tenant_demo",
  "workspaceId": "workspace_demo",
  "userId": "user_jordan",
  "ownerId": "user_jordan",
  "title": "Prepare proposal outline",
  "desiredOutcome": "Draft outline ready for review",
  "priority": "HIGH",
  "estimatedDurationMinutes": 120,
  "remainingDurationMinutes": 120,
  "deadline": "2026-07-24T21:00:00.000Z",
  "earliestStart": "2026-07-22T13:00:00.000Z",
  "schedulingMode": "DEADLINE_DRIVEN",
  "splittable": true,
  "minimumBlockMinutes": 45,
  "maximumBlockMinutes": 90,
  "preferredDayparts": ["MORNING"],
  "blocked": false,
  "waiting": false,
  "schedulingEligible": true,
  "confidence": "CONFIRMED",
  "version": 1
}
```

## Non-Goals

- Do not model full CRM history here.
- Do not model full project-management workflows here.
- Do not let ScheduleOS become the authority for task ownership when OwnerOps or another source owns it.
