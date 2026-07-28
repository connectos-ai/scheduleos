# OwnerOps Integration

## Status

Draft optional integration contract.

## Rule

OwnerOps is optional. ScheduleOS must work when OwnerOps is disconnected.

ScheduleOS must not import private OwnerOps internals. It may integrate through public APIs, SDKs, webhooks, or event contracts.

## Responsibility Split

OwnerOps owns:

- Task identity.
- Desired outcome.
- Assignee.
- Collaborators.
- Project.
- Priority.
- Deadline.
- Estimated duration when known.
- Operational status.
- Blocked or waiting state.
- Dependencies.
- Owner-decision status.
- Source communication.
- Completion state.

ScheduleOS owns:

- Scheduling eligibility.
- Proposed time blocks.
- Confirmed time blocks.
- Unscheduled state.
- Deadline risk.
- Capacity warning.
- Plan revision.
- Scheduling explanation.
- Completion-time data when appropriate.

## Inbound Mapping

OwnerOps task data becomes `SchedulingTask`.

Required minimum:

- sourceSystem = `OWNEROPS`
- externalId
- sourceReference
- tenantId/workspaceId mapping
- ownerId mapping
- title
- desiredOutcome
- priority
- estimatedDurationMinutes when known
- deadline when known
- blocked/waiting
- dependencies
- schedulingEligible

Missing duration or deadline should not be invented silently.

## Current Local API Foundation

The current local API includes a mock public OwnerOps import endpoint:

```text
POST /api/integrations/ownerops/tasks/import
```

Example request:

```json
{
  "tenantId": "tenant_demo",
  "workspaceId": "workspace_demo",
  "userId": "user_jordan",
  "tasks": [
    {
      "externalId": "ownerops_task_focus",
      "title": "Draft leadership update",
      "desiredOutcome": "Clear update ready for review",
      "assigneeId": "user_jordan",
      "priority": "HIGH",
      "estimatedDurationMinutes": 60,
      "deadline": "2026-07-22T17:00:00.000Z",
      "blocked": false,
      "waiting": false,
      "dependencies": ["ownerops_task_context"]
    }
  ]
}
```

Current behavior:

- Maps imported rows to `SchedulingTask` records with `sourceSystem` set to `OWNEROPS`.
- Uses stable task ids shaped like `ownerops_OWNEROPS_<externalId>`.
- Preserves desired outcome, dependencies, project id, source reference, source URL, tags, owner/assignee mapping, priority, deadline, and estimated duration when provided.
- Keeps blocked, waiting, completed, and missing-duration work unscheduled instead of inventing a feasible plan.
- Supports idempotent updates by `externalId`.
- Records `TASK_CREATED_FROM_OWNEROPS` and `TASK_UPDATED_FROM_OWNEROPS` audit events.
- Supports `dryRun: true` preview without persisting tasks or audit events.

This is a mock public contract foundation. It is not a production OwnerOps connector, webhook subscription manager, or private OwnerOps runtime.

## Outbound Mapping

ScheduleOS may return:

- task scheduled.
- task unscheduled.
- deadline at risk.
- capacity exceeded.
- proposed block.
- accepted block.
- block completed.
- block missed.
- suggested delegate/delay/shorten/stop option.

## Events

OwnerOps to ScheduleOS:

```text
ownerops.task.created
ownerops.task.updated
ownerops.task.blocked
ownerops.task.unblocked
ownerops.task.completed
ownerops.owner_decision.requested
ownerops.owner_decision.resolved
```

ScheduleOS to OwnerOps:

```text
task.scheduled
task.unscheduled
task.deadline_at_risk
block.completed
block.missed
schedule.capacity_exceeded
schedule.replanned
```

## Current Test Evidence

- Mock OwnerOps tasks import into ScheduleOS.
- Blocked, waiting, and completed OwnerOps work remains unscheduled.
- Duplicate OwnerOps task import is idempotent.
- OwnerOps disconnected mode still allows manual ScheduleOS tasks.
- Combined OwnerOps plus ConnectOS end-to-end flow imports owned work, imports busy time, creates a plan, accepts it, completes a block, and reads scoped audit evidence.
- Deadline-risk outbound delivery to OwnerOps remains a production adapter gap.


End-to-end mock adapter evidence: [Mock Adapter End-To-End Verification](mock-adapter-end-to-end-verification.md).
