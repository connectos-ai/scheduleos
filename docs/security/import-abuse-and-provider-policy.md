# Import Abuse And Provider Policy

## Status

Local/self-hosted foundation implemented. Production distributed throttling, dashboards, alerting, verified proxy deployment policy, and provider-specific quota operations remain release blockers.

## Local Controls

ScheduleOS currently has three local abuse-control layers:

- `rateLimit.windowMs` and `rateLimit.maxRequests` limit API requests per process by default. Local/self-host servers can configure them with `SCHEDULEOS_RATE_LIMIT_WINDOW_MS` and `SCHEDULEOS_RATE_LIMIT_MAX_REQUESTS`; invalid values are rejected at startup.
- `rateLimit.persisted` can be enabled with `SCHEDULEOS_RATE_LIMIT_PERSISTED=true` to store authenticated request throttle windows in the configured ScheduleOS store. Persisted request throttles are scoped by tenant, workspace, and user, and store a SHA-256 key hash instead of raw bearer tokens, cookie values, or client IPs. Unauthenticated requests continue to use process-local buckets.
- `importThrottle.windowMs` and `importThrottle.maxRows` limit imported rows by tenant, workspace, user, source system, and operation.
- `importThrottle.sourcePolicies` allows per-source overrides for known providers and bridges.
- `importThrottle.enforceProviderPolicies` can opt local/self-host deployments into built-in provider policy catalog enforcement without manually copying every source policy.
- `importAbuseAlerts.deniedEvents` and `importAbuseAlerts.deniedRows` can configure local/self-host summary thresholds. When met, `GET /api/import-abuse/summary` returns `alert.status: "REVIEW_REQUIRED"` with content-minimized trigger metadata.

The response includes `alert.enabled`, `alert.status`, `alert.thresholds`, and `alert.triggers` when local/self-host thresholds are configured. `REVIEW_REQUIRED` is an operator signal only; it does not send hosted alerts or replace production abuse analytics.

Denied imports return `429 RATE_LIMITED` and append a scoped `IMPORT_THROTTLE_DENIED` audit event. The audit event records source system, operation, attempted row count, configured row limit, configured window, and retry timing. It must not copy imported row payload content.

## Abuse Summary API

`GET /api/import-abuse/summary` returns a scoped summary derived from audit events.

Required query parameters:

- `tenantId`
- `workspaceId`
- `userId`

Optional filters:

- `sourceSystem`
- `since`
- `until`

The response includes source-level allowed import counts, denied import counts, denied rows, retry timing, and operation policy evidence. This is an operator visibility foundation, not a production analytics dashboard.

Example:

```text
GET /api/import-abuse/summary?tenantId=tenant_demo&workspaceId=workspace_demo&userId=user_jordan&sourceSystem=JSON_IMPORT
```

## Provider Import Policy Catalog API

`GET /api/import-policies` returns the local/self-hosted provider import policy catalog.

The response includes:

- `data`: provider policy records with source system, operation, recommended policy, risk level, and notes.
- `sourcePolicies`: a copyable `importThrottle.sourcePolicies` shape for local API configuration.
- `releaseBoundary`: explicit reminder that production distributed throttling, hosted abuse analytics, and provider-specific operational enforcement remain release blockers.

Operators can filter the catalog by source system:

```text
GET /api/import-policies?sourceSystem=GITHUB_ISSUES_CSV
```

The catalog is guidance for local and self-hosted deployments. It does not replace production distributed rate limiting, verified proxy deployment policy, provider quota monitoring, hosted alerting, or abuse dashboards.

## Local Alert Thresholds

Standalone local/self-host servers can enable summary alert thresholds with:

```text
SCHEDULEOS_IMPORT_ABUSE_ALERT_DENIED_EVENTS=3
SCHEDULEOS_IMPORT_ABUSE_ALERT_DENIED_ROWS=25
```

Thresholds must be positive integers. The summary evaluates the currently requested audit-event window, including optional `since`, `until`, and `sourceSystem` filters.

## Suggested Source Policies

These examples are starting points for local self-hosted deployments. Operators should tune them to their data volume, provider behavior, and infrastructure.

| Source System | Operation | Suggested Local Policy | Notes |
| --- | --- | --- | --- |
| `GENERIC_WEBHOOK` | `WEBHOOK_TASK_IMPORT` | 100 rows / 5 minutes | Good default for signed low-volume webhooks. |
| `JSON_IMPORT` | `JSON_TASK_IMPORT` | 500 rows / 15 minutes | Manual/import batch default. |
| `CSV_IMPORT` | `CSV_TASK_IMPORT` | 500 rows / 15 minutes | Manual/import batch default. |
| `ICS_CALENDAR_IMPORT` | `ICS_CALENDAR_IMPORT` | 1000 rows / 15 minutes | Calendar imports can legitimately include more rows. |
| `TODOIST_CSV` | `CSV_TASK_IMPORT` | 500 rows / 15 minutes | Provider-template import source. |
| `LINEAR_CSV` | `CSV_TASK_IMPORT` | 1000 rows / 15 minutes | Issue exports can be larger. |
| `ASANA_CSV` | `CSV_TASK_IMPORT` | 1000 rows / 15 minutes | Project exports can be larger. |
| `CLICKUP_CSV` | `CSV_TASK_IMPORT` | 1000 rows / 15 minutes | Workspace exports can be larger. |
| `GITHUB_ISSUES_CSV` | `CSV_TASK_IMPORT` | 1000 rows / 15 minutes | Repository issue exports can be larger. |
| `OWNEROPS` | `OWNEROPS_TASK_IMPORT` | 500 rows / 5 minutes | Owned-work bridge should be steady and idempotent. |
| `CONNECTOS_CALENDAR_IMPORT` | `CONNECTOS_CALENDAR_IMPORT` | 1000 rows / 10 minutes | Calendar bridge imports may include recurring synced provider events. |

## Provider Policy Rules

- Unknown sources use the global import throttle policy.
- Known high-volume sources should have explicit `sourcePolicies` entries or `importThrottle.enforceProviderPolicies` enabled when the built-in catalog policy is sufficient.
- Provider-template CSV rows are still untrusted input even when the template ID is known.
- Source policy names must stay provider-neutral and must not create hidden private leadership-only behavior.
- Dry-run previews remain subject to request-size controls; persisted throttling applies to import execution paths.
- Denial audit metadata should stay content-minimized.

## Production Gaps

Before public production deployment, ScheduleOS still needs:

- Distributed rate limit storage shared across API instances.
- Production proxy deployment verification for client identity rate-limit keys.
- Provider-specific quota policy defaults and override guidance.
- Operator dashboards and alert thresholds for repeated denials.
- Runbooks for suspicious sources, replay bursts, payload spikes, and provider sync loops.
- Remote CI deployment evidence covering production configuration.
