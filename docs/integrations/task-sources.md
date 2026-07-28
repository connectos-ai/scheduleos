# Task Sources

Production provider lifecycle approval is tracked in `docs/security/production-provider-lifecycle-approval-checklist.md`. This document describes task-source foundations only.


## Status

Draft task-source model with tested generic webhook, JSON import, and CSV import local API foundations.

## Initial Sources

- Manual task creation.
- Local API.
- Generic webhook local API foundation.
- JSON task import local API foundation.
- CSV task import local API foundation.
- Local JSON task import preview/confirmation UI foundation.
- Local CSV task import preview/confirmation UI foundation.
- ICS calendar-derived commitments.
- OwnerOps adapter.
- Mock task provider.

Later optional sources:

- Todoist.
- Google Tasks.
- Microsoft To Do.
- GitHub Issues.
- Linear.
- Asana.
- ClickUp.
- Trello.
- Microsoft Planner.
- Slack-derived work.
- Email-derived work.
- ConnectOS task capabilities.

## Source Rules

- Imported tasks are untrusted data.
- Source IDs must be preserved.
- Duplicate imports should be idempotent.
- Missing duration keeps work unscheduled until an estimate is supplied.
- Missing deadline must not be invented silently.
- Source priority maps to ScheduleOS priority through documented rules.
- Source status maps to scheduling eligibility.
- Instruction-like task text must remain inert task data.

## Generic Webhook

Implemented foundation:

- `POST /api/task-sources/webhook`
- Validates provider-neutral webhook task payload.
- Preserves `sourceSystem`, `externalId`, `sourceReference`, and `sourceUrl`.
- Uses stable task id derived from source system and external id for idempotent upsert.
- Returns `createdCount` and `updatedCount`.
- Verifies `x-scheduleos-signature: sha256=...` HMAC when `webhookSecrets[sourceSystem]` is configured.
- Supports a single configured secret or an ordered rotation list such as `webhookSecrets[sourceSystem] = ["current", "previous"]`.
- Rejects blank configured secrets and empty rotation lists when the API server starts.
- Requires `x-scheduleos-timestamp` and `x-scheduleos-event-id` for signed webhooks.
- Signs `timestamp.rawBody` so the timestamp is bound to the payload.
- Rejects signed webhooks outside the configured replay window.
- Supports source-specific replay windows through `webhookReplayWindows[sourceSystem]`.
- Rejects reused signed event ids through scoped idempotency records.
- Records integration audit event without storing provider secrets.
- Keeps missing-duration tasks unscheduled with `confidence: "UNKNOWN"` until duration is supplied.

Request fields:

- Required: `tenantId`, `workspaceId`, `userId`, `sourceSystem`, `externalId`, `title`.
- Optional: `durationMinutes`, `deadline`, `earliestStart`, `latestFinish`, `priority`, `sourceReference`, `sourceUrl`, `projectId`, `tags`.

Provider replay policy, secret rotation posture, and mapping rules are documented in [Webhook Provider Policy](webhook-provider-policy.md). Operator rotation and emergency revocation steps are documented in [Webhook Secret Lifecycle Runbook](../operations/webhook-secret-lifecycle-runbook.md).

Required before public release:

- Hosted webhook secret lifecycle enforcement beyond the local/self-host runbook foundation.
- Provider-specific adapters, provider-specific rotation runbooks, and production operator alerts.
- Production provider-specific replay retention guidance after real provider adapters land.
- Full public API documentation examples.

## JSON Import

Implemented foundation:

- `POST /api/task-sources/json/import`
- Accepts provider-neutral task batches.
- Preserves `sourceSystem`, row `externalId`, `sourceReference`, and `sourceUrl`.
- Uses stable task id derived from source system and external id for idempotent upsert.
- Returns imported `data`, row-level `errors`, `createdCount`, and `updatedCount`.
- Imports valid rows when other rows fail validation.
- Records integration audit events for imported rows.
- Supports `dryRun: true` preview returning parsed tasks and row errors without persisting tasks or writing audit events.
- Keeps missing-duration tasks unscheduled with `confidence: "UNKNOWN"` until duration is supplied.

Example request:

```json
{
  "tenantId": "tenant_demo",
  "workspaceId": "workspace_demo",
  "userId": "user_jordan",
  "sourceSystem": "JSON_IMPORT",
  "tasks": [
    {
      "externalId": "task_demo_json_1",
      "title": "Prepare sermon outline",
      "durationMinutes": 60,
      "deadline": "2026-07-24T17:00:00.000Z",
      "priority": "HIGH",
      "sourceReference": "row_1",
      "tags": ["teaching"]
    }
  ]
}
```

Example response:

```json
{
  "data": [
    {
      "id": "json_JSON_IMPORT_task_demo_json_1",
      "sourceSystem": "JSON_IMPORT",
      "externalId": "task_demo_json_1",
      "title": "Prepare sermon outline"
    }
  ],
  "errors": [],
  "createdCount": 1,
  "updatedCount": 0
}
```

Dry-run preview response:

```json
{
  "dryRun": true,
  "data": [
    {
      "id": "json_JSON_IMPORT_task_demo_json_1",
      "sourceSystem": "JSON_IMPORT",
      "externalId": "task_demo_json_1",
      "title": "Prepare sermon outline"
    }
  ],
  "errors": [],
  "createdCount": 0,
  "updatedCount": 0
}
```

Row-level error example:

```json
{
  "data": [],
  "errors": [
    {
      "index": 1,
      "code": "VALIDATION_ERROR",
      "message": "title is required."
    }
  ],
  "createdCount": 0,
  "updatedCount": 0
}
```

## CSV Import

Implemented foundation:

- `POST /api/task-sources/csv/import`
- `GET /api/task-sources/csv/templates`
- Accepts CSV text inside a JSON request wrapper.
- Requires `externalId` and `title` headers.
- Supports `durationMinutes`, `deadline`, `earliestStart`, `latestFinish`, `priority`, `sourceReference`, `sourceUrl`, `projectId`, and `tags` headers.
- Supports optional `templateId` for provider-specific CSV header mapping.
- Current provider template catalog: `todoist`, `linear`, `asana`, `clickup`, `trello`, `microsoft_planner`, `github_issues`.
- Template imports map provider headers into canonical ScheduleOS task fields without making any provider required.
- Unknown templates are rejected with structured validation errors.
- The local app CSV import panel can load the template catalog, fill a selected sample CSV, preview mapped rows, and import with `templateId`.
- Provider templates include fictional multi-row sample CSV fixtures and `sampleRowCount` metadata for local preview/import verification.
- Provider template samples can be downloaded from `GET /api/task-sources/csv/templates/{templateId}/sample`; the local app exposes a download button for selected templates.
- The local app import confirmation names the selected provider template/source and previewed row count before applying import.
- Preserves `sourceSystem`, row `externalId`, `sourceReference`, and `sourceUrl`.
- Uses stable task id derived from source system and external id for idempotent upsert.
- Returns imported `data`, row-level `errors`, `createdCount`, and `updatedCount`.
- Imports valid rows when other rows fail validation.
- Records integration audit events for imported rows.
- Supports `dryRun: true` preview returning parsed tasks and row errors without persisting tasks or writing audit events.
- Keeps missing-duration tasks unscheduled with `confidence: "UNKNOWN"` until duration is supplied.
- Treats formula-like text as inert task data.

Example request:

```json
{
  "tenantId": "tenant_demo",
  "workspaceId": "workspace_demo",
  "userId": "user_jordan",
  "sourceSystem": "CSV_IMPORT",
  "csv": "externalId,title,durationMinutes,deadline,priority,sourceReference,tags\ntask_demo_csv_1,Prepare volunteer plan,45,2026-07-24T17:00:00.000Z,HIGH,row_1,volunteers|planning"
}
```

Tags may be separated with `|` or `;` inside the `tags` field.

Provider-template list response:

```json
{
  "data": [
    {
      "id": "todoist",
      "displayName": "Todoist CSV",
      "sourceSystem": "TODOIST_CSV",
      "requiredHeaders": ["Task ID", "Content"]
    }
  ]
}
```

Provider-template import request:

```json
{
  "tenantId": "tenant_demo",
  "workspaceId": "workspace_demo",
  "userId": "user_jordan",
  "templateId": "todoist",
  "csv": "Task ID,Content,Due Date,Priority,Duration Minutes,Project,Labels,URL\ntodoist_demo_1,Prepare launch checklist,2026-07-24T17:00:00.000Z,p1,45,Launch,ops|planning,https://todoist.example/tasks/todoist_demo_1"
}
```

Required before public release:

- Download/upload UI.
- Production upload polish beyond the local template selector, sample-loading, sample download, fictional four-row sample fixtures, provider-aware confirmation foundations, and built-in sample dry-run validation.
- Broader real-provider fixture set for common task-manager exports.
- Provider-specific import policy and abuse analytics coverage.
- Provider-specific import confirmation polish beyond the local generic JSON/CSV preview/import foundation.

Local import throttling, suggested source policies, and the scoped abuse summary API are documented in [Import Abuse And Provider Policy](../security/import-abuse-and-provider-policy.md).

## Tests

- [x] Generic webhook import creates tasks.
- [x] Generic webhook duplicate import updates existing task.
- [x] Generic webhook invalid signature rejected when configured.
- [x] Generic webhook valid signature accepted when configured.
- [x] Generic webhook current or previous rotation secret accepted when configured.
- [x] Generic webhook missing signed replay headers rejected when configured.
- [x] Generic webhook stale signed timestamp rejected when configured.
- [x] Generic webhook reused signed event id rejected when configured.
- [x] Generic webhook missing duration remains unscheduled.
- [x] Generic webhook malicious task text remains inert data.
- [x] JSON import creates task batches.
- [x] JSON import duplicate source IDs update existing tasks.
- [x] JSON import dry-run preview returns parsed tasks and row errors without persisting.
- [x] JSON import invalid rows return row-level errors.
- [x] JSON import missing duration remains unscheduled.
- [x] JSON import malicious task text remains inert data.
- [x] CSV import creates task batches.
- [x] CSV import duplicate source IDs update existing tasks.
- [x] CSV import dry-run preview returns parsed tasks and row errors without persisting.
- [x] CSV import invalid rows return row-level errors.
- [x] CSV import missing duration remains unscheduled.
- [x] CSV import formula-like text remains inert data.
