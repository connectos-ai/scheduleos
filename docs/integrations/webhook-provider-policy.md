# Webhook Provider Policy

Production provider lifecycle approval is tracked in `docs/security/production-provider-lifecycle-approval-checklist.md`. This policy documents local/self-host webhook foundations only.


## Status

Local/self-host foundation accepted as of 2026-07-22. Production provider lifecycle management, provider-specific adapters, hosted alerting, and production secret storage remain release blockers.

This document covers the current provider replay policy, webhook secret rotation posture, and provider task-field mapping for the generic webhook task-source foundation.

## Current Endpoint

```text
POST /api/task-sources/webhook
```

The current implementation accepts provider-neutral task payloads. It does not require Slack, Gmail, Google Calendar, Microsoft, OwnerOps, ConnectOS, compatible leadership system, a paid AI model, or any hosted provider.

## Provider-Neutral Payload

Required fields:

- `tenantId`
- `workspaceId`
- `userId`
- `sourceSystem`
- `externalId`
- `title`

Optional scheduling fields:

- `durationMinutes`
- `deadline`
- `earliestStart`
- `latestFinish`
- `priority`
- `sourceReference`
- `sourceUrl`
- `projectId`
- `tags`

Rules:

- `sourceSystem` names the sending system adapter, such as `GENERIC_WEBHOOK`, `OWNEROPS`, `CONNECTOS_TASKS`, `TODOIST_WEBHOOK`, `LINEAR_WEBHOOK`, `ASANA_WEBHOOK`, `CLICKUP_WEBHOOK`, or `GITHUB_ISSUES_WEBHOOK`.
- `externalId` must be stable within the source system.
- ScheduleOS derives stable task identity from `sourceSystem` plus `externalId` so repeated delivery updates the same task instead of creating duplicates.
- Missing duration keeps task unscheduled with unknown confidence until a real estimate is supplied.
- Missing deadline is not invented.
- Task title and description-like provider text remain inert user data.

## Signature Policy

When `webhookSecrets[sourceSystem]` is configured, incoming webhook requests must include:

- `x-scheduleos-signature`
- `x-scheduleos-timestamp`
- `x-scheduleos-event-id`

Signature header format:

```text
x-scheduleos-signature: sha256=<hex-hmac>
```

The signed message is:

```text
<x-scheduleos-timestamp>.<raw-request-body>
```

HMAC algorithm is SHA-256. Signature comparison is constant-time. Unsigned mode is only acceptable for local development or trusted internal test harnesses. Production deployments must configure a secret for every webhook `sourceSystem`.

## Secret Rotation Policy

The current foundation supports either one secret or an ordered rotation list:

```ts
webhookSecrets: {
  GENERIC_WEBHOOK: ["current_secret_value", "previous_secret_value"]
}
```

Rules:

- Blank configured secrets are rejected at API startup.
- Empty rotation lists are rejected at API startup.
- Current and previous secrets may both verify during a planned overlap window.
- Unknown secrets are rejected with `INVALID_WEBHOOK_SIGNATURE`.
- Secrets must live in deployment secret storage, not source code, fixtures, docs, logs, or exports.
- Operators should follow [Webhook Secret Lifecycle Runbook](../operations/webhook-secret-lifecycle-runbook.md) for planned rotation and emergency revocation.

Production release still requires managed secret storage integration, provider-specific overlap duration guidance, hosted alert routing, emergency revocation verification, and audit trail for rotation events.

## Replay Policy

Signed webhooks must include timestamp and unique event id.

Current controls:

- Missing signed replay headers are rejected.
- Stale timestamps are rejected.
- Reused event ids are rejected.
- Source-specific replay windows can be configured.
- Invalid replay-window policies are rejected at API startup.
- Event ids are reserved through the idempotency repository with an expiry timestamp.

Default policy:

- Use global `webhookReplayWindowMs` when no source-specific policy exists.
- Use `webhookReplayWindows[sourceSystem]` source-specific override when configured.
- Treat replay windows as short acceptance windows, not long-term deduplication records.

Recommended production starting point:

| Provider Type | Example Source System | Replay Window |
| --- | --- | --- |
| Internal trusted webhook adapter | `GENERIC_WEBHOOK` | 5 minutes |
| ConnectOS task bridge | `CONNECTOS_TASKS` | 5 minutes |
| OwnerOps task bridge | `OWNEROPS` | 5 minutes |
| Third-party webhook proxy | `TODOIST_WEBHOOK`, `LINEAR_WEBHOOK`, `ASANA_WEBHOOK`, `CLICKUP_WEBHOOK`, `GITHUB_ISSUES_WEBHOOK` | 5 minutes unless provider documentation requires a tighter value |
| Batch replay/recovery job | `RECOVERY_IMPORT` | Prefer JSON/CSV dry-run import instead of relaxing webhook replay policy |

Production release still requires provider-specific replay retention guidance after real provider integrations land.

## Provider Field Mapping

Provider-specific adapters should map only real provider data into ScheduleOS fields.

| ScheduleOS Field | Meaning | Mapping Rule |
| --- | --- | --- |
| `sourceSystem` | Sending adapter/system. | Required. Use a stable provider-specific value. |
| `externalId` | Provider object id. | Required. Must be stable and unique inside `sourceSystem`. |
| `title` | User-visible work title. | Required. Treat provider text as inert data. |
| `durationMinutes` | Scheduling estimate. | Optional. Leave unset when the provider lacks a real estimate. |
| `deadline` | Due or deadline timestamp. | Optional. Map only real provider due/deadline values. |
| `earliestStart` | Earliest eligible scheduling time. | Optional. |
| `latestFinish` | Latest eligible finish time. | Optional. |
| `priority` | `URGENT`, `HIGH`, `MEDIUM`, or `LOW`. | Normalize provider priority through documented adapter rules. |
| `sourceReference` | Human-readable source key. | Optional ticket number, row id, task key, provider reference. |
| `sourceUrl` | Provider object URL. | Optional. Use HTTPS production URLs. |
| `projectId` | Provider project, list, repository, or team. | Optional. |
| `tags` | Labels or categories. | Optional string array. |

Provider-specific adapters should document lossy mappings. For example, if a provider has no duration field, the adapter must leave `durationMinutes` unset instead of inventing a value.

## Current Provider Template Mappings

CSV template mappings exist for:

- `todoist`
- `linear`
- `asana`
- `clickup`
- `trello`
- `microsoft_planner`
- `github_issues`

These templates are local CSV import mappings, not direct provider webhook integrations. They are useful references for future provider webhook adapters because they already define canonical field aliases, source systems, sample headers, and source URL handling.

## Abuse And Rate-Limit Policy

Webhook imports share the local import throttle foundation:

- Configurable global import throttle.
- Optional source-specific throttle policies.
- Denied imports produce minimized audit metadata.
- Row payload content is not copied into throttle-denial audit events.

Production release still requires distributed rate limiting, provider-specific quotas, abuse analytics, and operational dashboards.

## Public API Boundary

Do not add hidden private leadership-only webhook behavior. Any compatible leadership system, OwnerOps, ConnectOS, or third-party integration must use the same public endpoint, signature policy, replay policy, and provider-neutral mapping rules available to other developers.

## Current Test Evidence

Current local tests cover:

- Valid signed webhook accepted.
- Invalid signature rejected.
- Current and previous rotation secrets accepted.
- Unknown secret rejected.
- Blank configured secrets and empty rotation lists rejected at startup.
- Missing signed replay headers rejected.
- Stale timestamp rejected.
- Reused event id rejected.
- Source-specific replay window behavior.
- Missing duration remains unscheduled.
- Malicious task text remains inert data.

## Release Boundary

This document and the lifecycle runbook complete the current provider replay-policy, mapping, and secret lifecycle runbook foundation. Public production release still requires production secret lifecycle enforcement, provider-specific adapters, provider-specific replay retention guidance, distributed rate limiting, abuse analytics, hosted operator alerting, and production runbook verification.
