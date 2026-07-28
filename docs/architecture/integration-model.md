# Integration Model

## Status

Draft public integration model for ScheduleOS.

## Rule

Every integration must use public APIs, events, SDKs, webhooks, or documented adapter ports. There are no hidden private leadership-only, OwnerOps-only, or ConnectOS-only paths.

ScheduleOS must remain useful when every integration is disconnected.

## Independence Matrix

| System | Required By ScheduleOS? | How it may integrate |
| --- | --- | --- |
| compatible leadership system | No | Public API/events leadership-context enrichment and scheduling intelligence. |
| OwnerOps | No | Task source/destination adapter for owned work, blockers, status, delegation state. |
| ConnectOS | No | Calendar/task/directory capability adapter for provider access. |
| Google Calendar | No | Direct calendar adapter or ConnectOS adapter. |
| Microsoft Calendar | No | Direct calendar adapter or ConnectOS adapter. |
| AI provider | No | Optional understanding/explanation adapter. |
| Slack/email/task managers | No | Direct adapter, generic webhook, or ConnectOS. |

## Public API Surface

Initial REST resources should follow stable plural nouns.

```text
GET /api/tasks
POST /api/tasks
GET /api/tasks/:taskId
PATCH /api/tasks/:taskId
DELETE /api/tasks/:taskId

GET /api/calendars
POST /api/calendar-events
GET /api/calendar-events
PATCH /api/calendar-events/:eventId
DELETE /api/calendar-events/:eventId

GET /api/availability
PUT /api/working-hours
PUT /api/preferences

POST /api/schedule-plans
GET /api/schedule-plans
GET /api/schedule-plans/:planId
POST /api/schedule-plans/:planId/accept
POST /api/schedule-plans/:planId/reject
POST /api/schedule-plans/:planId/replan
GET /api/schedule-plans/:planId/explanations

POST /api/time-blocks/:blockId/lock
POST /api/time-blocks/:blockId/unlock
PATCH /api/time-blocks/:blockId
POST /api/time-blocks/:blockId/complete
POST /api/time-blocks/:blockId/missed

GET /api/capacity
GET /api/deadline-risks
GET /api/unscheduled-tasks

POST /api/import/tasks
POST /api/import/calendar
POST /api/integrations/ownerops/tasks/import
POST /api/integrations/connectos/calendar-events/import
GET /api/export/ics
POST /api/webhooks/:sourceKey
GET /api/audit-events
```

Current local API slice implements task and plan-scoped foundations for:

- `POST /api/tasks`
- `GET /api/tasks?tenantId=...&workspaceId=...&userId=...`
- `GET /api/tasks/:taskId?tenantId=...&workspaceId=...&userId=...`
- `PATCH /api/tasks/:taskId`
- `DELETE /api/tasks/:taskId?tenantId=...&workspaceId=...&userId=...`
- `POST /api/calendar-events`
- `GET /api/calendar-events?tenantId=...&workspaceId=...&userId=...`
- `GET /api/calendar-events/:eventId?tenantId=...&workspaceId=...&userId=...`
- `PATCH /api/calendar-events/:eventId`
- `DELETE /api/calendar-events/:eventId?tenantId=...&workspaceId=...&userId=...`
- `POST /api/schedule-plans`
- `GET /api/schedule-plans?tenantId=...&workspaceId=...&userId=...`
- `GET /api/schedule-plans/:planId`
- `POST /api/schedule-plans/:planId/accept`
- `POST /api/schedule-plans/:planId/reject`
- `POST /api/schedule-plans/:planId/replan`
- `GET /api/capacity?planId=...`
- `GET /api/deadline-risks?planId=...`
- `GET /api/unscheduled-tasks?planId=...`
- `GET /api/schedule-plans/:planId/explanations`
- `PATCH /api/time-blocks/:blockId`
- `POST /api/time-blocks/:blockId/lock`
- `POST /api/time-blocks/:blockId/unlock`
- `POST /api/time-blocks/:blockId/complete`
- `POST /api/time-blocks/:blockId/missed`
- `POST /api/integrations/ownerops/tasks/import`
- `POST /api/integrations/connectos/calendar-events/import`
- `GET /api/audit-events?tenantId=...&workspaceId=...&userId=...[&action=...&resourceType=...&sourceSystem=...]`
- `GET /api/events/catalog`

The audit-event endpoint first enforces tenant/workspace/user scope through the repository, then optionally narrows the scoped result by `action`, `resourceType`, and audit metadata `sourceSystem`. These are foundation endpoints, not final production reporting authorization semantics.

Error responses use one shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid scheduling task.",
    "details": {}
  }
}
```

HTTP status mapping:

- 400: malformed request.
- 401: not authenticated.
- 403: authenticated but not authorized.
- 404: resource not found.
- 409: conflict, duplicate, or version mismatch.
- 422: semantically invalid data.
- 429: rate limited.
- 500: server error with no internal details.

## Events

All public events must be:

- Versioned.
- Tenant-scoped.
- Workspace-scoped where applicable.
- Idempotent.
- Timestamped.
- Minimal on private content.
- Safe for webhook delivery.

Event envelope:

```text
ScheduleOSEvent
- id
- type
- version
- tenantId
- workspaceId
- userId
- occurredAt
- idempotencyKey
- source
- subject
- data
```

Current local event-contract foundation: `GET /api/events/catalog` returns the public `ScheduleOSEvent` envelope fields, v1 event type catalog, content-minimized privacy posture, idempotency requirement, and delivery boundary.

Current local event read-model foundation: `GET /api/events?tenantId=...&workspaceId=...&userId=...` returns scoped, content-minimized `ScheduleOSEvent` envelopes derived from known audit evidence. It currently exposes task import evidence as `task.imported`, supports optional `type` and `sourceSystem` filters, hashes public event IDs and idempotency keys, and excludes raw task titles, descriptions, and row payloads.

Current local/self-host explicit delivery foundation: `POST /api/events/webhook-deliveries` sends the same scoped, content-minimized `ScheduleOSEvent` envelopes to a caller-provided webhook target. Each delivery includes `scheduleos-event-id`, `scheduleos-delivery-id`, `scheduleos-timestamp`, and `scheduleos-signature` headers. The signature is HMAC-SHA256 over timestamp, delivery ID, event ID, and JSON body. Non-local targets must use HTTPS.

Current local/self-host delivery-attempt observability foundation: `GET /api/events/webhook-deliveries?tenantId=...&workspaceId=...&userId=...` returns scoped delivery attempt records from content-minimized audit evidence. It exposes delivery ID, event ID, event type, delivery status, HTTP status, error code, retryable flag, attempt number, next retry timestamp when applicable, occurred-at timestamp, and target URL hash. `GET /api/events/webhook-deliveries/summary?tenantId=...&workspaceId=...&userId=...` returns scoped delivery totals, failed and retryable-failed counts, target count, optional configured `REVIEW_REQUIRED` alert status, and per-target URL hash summaries for local/self-host operator review. These endpoints do not return webhook secrets, signatures, raw target URLs, private task text, or private calendar titles.

Current local retry foundation: failed network deliveries and failed `408`, `429`, or `5xx` HTTP responses are marked retryable with `attemptNumber: 1` and an initial `nextRetryAt` five minutes later. `POST /api/events/webhook-deliveries/retry-due` retries due failed retryable attempts for the caller-provided target and secret, records the next attempt number, and returns content-minimized attempt views without webhook secrets or raw target URLs. This is local/self-host retry execution only; it is not yet a managed production subscription worker or hosted retry service.

Current local/self-host subscription foundation: `POST /api/events/webhook-subscriptions` registers scoped public-event webhook subscription metadata and `GET /api/events/webhook-subscriptions?tenantId=...&workspaceId=...&userId=...` lists scoped subscription records. Responses expose subscription ID, event type filters, source-system filter, status, timestamps, target URL hash, secret hash, and optional configured delivery-target reference hash. `POST /api/events/webhook-subscriptions/deliver` can verify caller-provided target URL and secret against stored hashes, or resolve a configured delivery-target reference server-side, before sending matching scoped public events and recording delivery attempts. Configured delivery targets can use local raw process config for self-host mode or `targetUrlSecretRef` plus `signingSecretRef` resolved through `ApiServerOptions.managedSecrets`; secret refs are checked against tenant, workspace, and purpose scope before any provider lookup. `POST /api/events/webhook-subscriptions/deliver-ready` scans enabled scoped subscriptions with configured delivery-target references and delivers matching public events as a local/self-host worker-style foundation. It supports optional `dryRun`, `maxSubscriptions`, and `maxEvents` request fields so operators can preview and bound one invocation before network delivery. These local/self-host foundations do not return webhook secrets, raw target URLs, raw delivery-target references, or raw secret refs. The production managed-secret storage contract is documented in `docs/operations/managed-secret-storage-runbook.md`. Production provider selection, runtime identity policy, rotation and revocation proof, durable subscription workers, hosted operations, and hosted observability remain release blockers.

Receiver verification and replay-store guidance is documented in `docs/operations/public-event-webhook-receiver-runbook.md`. Public-event delivery operator guidance is documented in `docs/operations/public-event-delivery-operator-runbook.md`.

Production subscription delivery workers, persistent retry queues, hosted delivery operations, and hosted delivery observability remain release blockers.

The current public event read model also maps schedule lifecycle evidence to `schedule.created`, `schedule.accepted`, `schedule.rejected`, and `schedule.replanned`, and block lifecycle evidence to `block.locked`, `block.unlocked`, `block.completed`, and `block.missed`, without exposing task titles, descriptions, or row payloads.

Capacity warning evidence maps to `schedule.capacity_exceeded`, and deadline-risk warning evidence maps to `task.deadline_at_risk`. These warning events expose warning code, task ID where applicable, and available/required minute counts, but not task titles, warning messages, calendar titles, or row payload content.

ScheduleOS local calendar create/update/delete evidence and ConnectOS calendar import evidence map to `calendar.event_imported` and `calendar.event_changed`, exposing event ID, external ID, calendar ID, connection reference when applicable, start/end, status, busy status, and privacy level without exposing private calendar titles or provider tokens. Local ICS re-import of a cancelled `RECURRENCE-ID` occurrence emits `calendar.event_changed` for actual deleted occurrences with `status: "CANCELLED"` and a content-minimized title.

Initial event types:

```text
task.imported
task.scheduling_requested
task.scheduled
task.unscheduled
task.deadline_at_risk
task.completed

block.created
block.moved
block.locked
block.unlocked
block.completed
block.missed

schedule.created
schedule.accepted
schedule.rejected
schedule.replanned
schedule.capacity_exceeded
schedule.constraint_violated

calendar.event_imported
calendar.event_changed
calendar.sync_failed

integration.connected
integration.disconnected
integration.sync_completed
integration.sync_failed
```

## Three-Pillar Contract Model

ScheduleOS can participate in a larger leadership system without depending on it.

```text
ConnectOS  -> signals, provider capabilities, safe external actions
OwnerOps   -> owned work, blockers, delegation state, approval needs
ScheduleOS -> time, capacity, schedule plans, deadline risk, replanning

compatible leadership system or any compatible leadership app may consume those public signals,
compare them, and send public guidance back to the pillar that owns the domain.
```

Public pillar contracts should stay provider-neutral:

| Contract | Primary Pillar | Direction | Purpose |
| --- | --- | --- | --- |
| `SignalObserved` | ConnectOS | Pillar to consumer | Reports provider events, connection changes, sync health, or prepared-action results. |
| `ActionRequest` | ConnectOS | Consumer to pillar | Requests preview, approval-aware execution, retry, or safe stop. |
| `WorkIdentified` | OwnerOps | Pillar to consumer | Reports canonical work, owner, blocker, approval need, delegation state, or outcome. |
| `WorkGuidance` | OwnerOps | Consumer to pillar | Sends priority interpretation, delegation recommendation, owner-only decision, or milestone alignment. |
| `ScheduleEvidence` | ScheduleOS | Pillar to consumer | Reports capacity, proposed blocks, missed work, deadline risk, constraint pressure, or replan explanation. |
| `ScheduleGuidance` | ScheduleOS | Consumer to pillar | Sends scoped priority, preferred daypart, owner-only, and tag hints through `POST /api/schedule-guidance/apply` without bypassing scheduling eligibility or blocked-state rules. |

ScheduleOS owns only the scheduling contracts. compatible leadership system is one possible consumer, not a privileged runtime.

### Leadership Brain Composition

ScheduleOS may strengthen a leadership application by contributing time reality to a three-lane composition model:

```text
ConnectOS lane  -> signal reality, provider capability, approved actions
OwnerOps lane   -> ownership reality, blockers, delegation, approvals
ScheduleOS lane -> time reality, capacity, plans, conflicts, replanning

Leadership app -> compares the three realities and prepares owner decisions
```

In a compatible leadership system deployment, compatible leadership system is the private leadership app using this model. In any other deployment, another consumer may use the same contracts. ScheduleOS must behave the same either way.

ScheduleOS should return schedule evidence such as capacity warnings, proposed blocks, missed work, deadline risk, constraint pressure, and replan explanations. A leadership consumer may turn that evidence into recommendations to protect time, delegate, delay, shrink, stop, or approve work. ScheduleOS should not own that final leadership judgment.

The strengthening loop is:

1. ConnectOS or another provider layer reports what changed.
2. OwnerOps or another work layer identifies owned work and blockers.
3. ScheduleOS tests whether eligible work fits real capacity.
4. A leadership app compares signal, ownership, and time evidence.
5. Reviewed owner outcomes flow back through public contracts.

ScheduleOS must not store private leadership prompts, proprietary scoring models, customer memory, or Business DNA. Public examples should use fictional IDs such as `tenant_demo`, `workspace_demo`, and `user_jordan`.

## OwnerOps Adapter

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
- Blocked/waiting state.
- Dependencies.
- Owner-decision status.
- Source communication.
- Completion state.

ScheduleOS returns:

- Scheduling eligibility.
- Proposed time blocks.
- Confirmed time blocks.
- Unscheduled state.
- Deadline risk.
- Capacity warning.
- Plan revision.
- Scheduling explanation.
- Completion-time data when appropriate.

Rules:

- ScheduleOS does not decide who owns work.
- ScheduleOS does not decide whether work is complete.
- ScheduleOS does not import private OwnerOps internals.
- OwnerOps integration must work through public API, SDK, events, or webhooks.

## ConnectOS Adapter

ConnectOS may provide optional access to:

- Google Calendar.
- Microsoft Calendar.
- Google Tasks.
- Microsoft To Do.
- Slack.
- Email.
- Files.
- CRM commitments.
- Other task/calendar providers.

ConnectOS owns:

- Provider authentication.
- OAuth flows.
- Token lifecycle.
- Provider capabilities.
- Connection health.
- External provider actions.

ScheduleOS owns:

- Scheduling interpretation.
- Scheduling rules.
- Optimization.
- Calendar-placement decisions.
- Scheduling state.
- Replanning.

Adapter capability ports:

```text
CalendarSource
- listCalendars
- listEvents
- watchEvents
- getAvailability

CalendarDestination
- createEvent
- updateEvent
- deleteEvent

TaskSource
- listTasks
- getTask
- watchTasks

DirectorySource
- listUsers
- resolveUser
```

Rules:

- ConnectOS is optional.
- Direct providers and ConnectOS providers should implement the same ScheduleOS ports where practical.
- ScheduleOS never receives provider tokens directly from ConnectOS.
- ScheduleOS records only token references or connection references needed for authorized calls.

## compatible leadership system Public Example Contract

compatible leadership system may enrich scheduling requests with:

- Milestone importance.
- Leadership leverage.
- Strategic priority.
- Owner-only classification.
- Return on leadership.
- Current organizational bottleneck.
- Protected leadership windows.
- Learned owner preferences.

ScheduleOS may provide compatible leadership system:

- Planned work.
- Unscheduled work.
- Deadline risk.
- Capacity utilization.
- Focus-time availability.
- Owner-task load.
- Schedule fragmentation.
- Workload by category.
- Time by project.
- Missed blocks.
- Replan frequency.
- Constraint pressure.
- Delegation candidates.
- Stop or delay candidates.

Rules:

- compatible leadership system recommendations must not bypass scheduling validation.
- compatible leadership system must use the same public interfaces other applications can use.
- ScheduleOS must not embed private compatible leadership system Leadership Brain logic.
- ScheduleOS may include fictional example compatible leadership system-style enrichment, but no private prompts, customer data, or Business DNA.

## Generic Webhook

Generic webhook payloads are untrusted.

Required behavior:

- Verify signature where configured.
- Require idempotency key.
- Validate schema.
- Scope tenant/workspace server-side.
- Store source reference.
- Never execute instructions embedded in payload text.
- Emit audit event for accepted/rejected payload.

## ICS Import/Export

ICS import:

- Imports fixed commitments and calendar-derived commitments.
- Treats unknown event titles as private-capable.
- Preserves source UID.
- Handles timezone and recurrence carefully.
- Does not duplicate events on repeated import.

ICS export:

- Exports accepted ScheduleOS blocks.
- Avoids private task descriptions by default.
- Includes stable UID.
- Supports re-export without duplicates.

## Authorization Rules

- API clients cannot choose arbitrary tenant/user IDs.
- Server-side membership controls every read/write.
- Provider connections are scoped to user/workspace.
- Cross-tenant access must be denied before repository reads.
- Static local API keys are development foundations, not production auth.

## Required Contract Tests

- Generic webhook task import.
- OwnerOps task ingestion.
- ConnectOS calendar capability contract.
- Mock OwnerOps and ConnectOS adapter end-to-end flow; see [Mock Adapter End-To-End Verification](../integrations/mock-adapter-end-to-end-verification.md).
- Mock calendar provider.
- Schedule acceptance.
- Replanning after calendar change.
- Duplicate-event prevention.
- Token/reference redaction.
- Provider revocation behavior.
- compatible leadership system-style leadership hints cannot bypass hard scheduling constraints.
- ScheduleOS works with every external pillar disconnected.

## Non-Goals

- Do not build ConnectOS internals.
- Do not build OwnerOps internals.
- Do not build compatible leadership system Leadership Brain.
- Do not build a general marketplace.
- Do not ship direct integrations before mock/generic/ICS paths are reliable.
