# Replanning

## Status

Draft replanning model.

## Purpose

Replanning updates a schedule when reality changes without needlessly moving everything.

ScheduleOS must show:

- What changed.
- Why it changed.
- What stayed protected.
- Which task or event caused the replan.
- What can no longer fit.

## Triggers

```text
TASK_CREATED
TASK_DURATION_CHANGED
TASK_DEADLINE_CHANGED
TASK_PRIORITY_CHANGED
TASK_COMPLETED
TASK_PARTIALLY_COMPLETED
TASK_BLOCKED
TASK_UNBLOCKED
DEPENDENCY_COMPLETED
CALENDAR_EVENT_CREATED
CALENDAR_EVENT_UPDATED
CALENDAR_EVENT_CANCELLED
WORKING_HOURS_CHANGED
BLOCK_LOCKED
BLOCK_UNLOCKED
BLOCK_MISSED
USER_REJECTED_PLAN
OWNEROPS_STATUS_CHANGED
PROVIDER_SYNC_COMPLETED
```

## Replan Scope

User controls:

- Replan today.
- Replan this week.
- Replan custom range.
- Keep accepted work stable.
- Ask before moving accepted work.
- Never move locked blocks.

## Stability Policy

Rules:

- Locked blocks never move.
- Completed blocks never move.
- Historical missed blocks remain facts.
- Accepted future blocks receive movement penalty.
- Proposed blocks may move with lower penalty.
- Blocks directly affected by the trigger may move with lower penalty.

## Revision Record

```text
ScheduleRevision
- id
- previousPlanId
- nextPlanId
- trigger
- triggerSource
- movedBlocks
- preservedBlocks
- newBlocks
- removedBlocks
- unscheduledTasks
- capacityWarnings
- explanationIds
- createdAt
```

## User-Facing Change Summary

Every replan should produce a short summary:

```text
New client meeting added Wednesday 10:00-11:00.
I kept your locked proposal block.
I moved invoice review from Wednesday afternoon to Thursday morning.
One low-priority task no longer fits this week.
```

## Non-Goals

- Do not continuously churn the calendar for tiny score improvements.
- Do not silently move accepted work when user policy requires approval.
- Do not write external calendar changes until the user or authorized caller accepts the revision.
