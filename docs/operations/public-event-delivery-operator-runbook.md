# Public Event Delivery Operator Runbook

Production managed-secret and hosted public-event worker approval is tracked in `docs/security/production-managed-secret-public-event-approval-checklist.md`. This runbook describes local/self-host delivery operations and production evidence expectations; it does not approve hosted delivery.


## Status

Local/self-host public-event delivery operator runbook foundation accepted 2026-07-23.

Production subscription delivery workers, persistent retry execution, managed secret storage, hosted delivery operations, hosted observability, alert routing, production incident drills, and durable dead-letter queues remain release blockers.

## Purpose

ScheduleOS currently provides local/self-host foundations for:

- Public event catalog: `GET /api/events/catalog`
- Public event read model: `GET /api/events?tenantId=...&workspaceId=...&userId=...`
- Explicit signed delivery: `POST /api/events/webhook-deliveries`
- Delivery-attempt observability: `GET /api/events/webhook-deliveries?tenantId=...&workspaceId=...&userId=...`
- Delivery-health summary: `GET /api/events/webhook-deliveries/summary?tenantId=...&workspaceId=...&userId=...`
- Retry-due execution foundation: `POST /api/events/webhook-deliveries/retry-due`
- Exhausted-delivery visibility: `GET /api/events/webhook-deliveries/exhausted?tenantId=...&workspaceId=...&userId=...&maxAttempts=<n>`
- Dead-letter review evidence: `POST /api/events/webhook-deliveries/dead-letter` and `GET /api/events/webhook-deliveries/dead-letter?tenantId=...&workspaceId=...&userId=...`
- Dead-letter queue visibility: `GET /api/events/webhook-deliveries/dead-letter/queue?tenantId=...&workspaceId=...&userId=...&maxAttempts=<n>`
- Subscription metadata: `POST /api/events/webhook-subscriptions` and `GET /api/events/webhook-subscriptions?tenantId=...&workspaceId=...&userId=...`
- Subscription pause/resume metadata: `POST /api/events/webhook-subscriptions/status`
- Subscription health: `GET /api/events/webhook-subscriptions/health?tenantId=...&workspaceId=...&userId=...&maxAttempts=<n>`
- Worker-style subscription delivery: `POST /api/events/webhook-subscriptions/deliver-ready`

These foundations help self-hosted operators review delivery state. They are not enough for production delivery.

Production delivery must also prove:

- Durable delivery workers.
- Durable retry queues.
- Durable dead-letter queues.
- Managed target URL and signing-secret storage.
- Hosted delivery dashboards.
- Alert routing.
- Production incident drills.
- Final security, privacy, licensing, and release approval.

## Subscription Operations

Subscription metadata is not enough for production delivery. Operators must maintain private delivery configuration associated with each subscription.

For production subscription delivery, operators need:

- Subscription ID.
- Tenant, workspace, and user scope.
- Event type filters.
- Source-system filter, if any.
- Target URL stored in managed configuration or secret storage.
- Signing secret stored in managed secret storage.
- Secret version or key ID.
- Enabled or disabled status.
- Last successful delivery timestamp.
- Last failed delivery timestamp and error code.
- Retry state and next retry timestamp.
- Owner or operator who approved subscription.

Raw target URLs and signing secrets must not appear in public read models, general application logs, issue reports, exported workspace data, or support transcripts.

## Worker Runbook

Current local/self-host `deliver-ready` execution can preview selected work with `dryRun: true` and bounded `maxSubscriptions` and `maxEvents`. Use those controls for first runs, receiver verification, incident recovery, and replay-like operations.

Dry-runs do not send network deliveries or record delivery attempts. They return content-minimized counts showing matched and processed event totals by subscription.

Before enabling a delivery worker:

1. Confirm production authentication, authorization, request throttling, durable storage, and retention settings are enabled.
2. Confirm scoped subscription metadata contains no raw target URL or secret.
3. Confirm target URLs and signing secrets resolve through managed secret/config storage.
4. Confirm the receiver follows `docs/operations/public-event-webhook-receiver-runbook.md`.
5. Send a fictional test event through the worker.
6. Confirm the receiver verifies signatures and stores replay keys.
7. Confirm delivery-attempt evidence appears in the operator view without private payloads.
8. Confirm retryable failure responses produce retry state.
9. Confirm local/self-host retry execution through `POST /api/events/webhook-deliveries/retry-due` records the next attempt number without returning webhook secrets or raw target URLs.
10. Confirm non-retryable failures do not loop.
11. Confirm alerts route to the operator.

Do not enable worker delivery for a customer scope until all checks above pass.

## Retry Policy

Production retry execution must be durable and bounded.

Recommended starting policy:

| Condition | Retry? | Initial Delay | Notes |
| --- | --- | --- | --- |
| Network failure | Yes | 5 minutes | Receiver may be temporarily unreachable. |
| `408` | Yes | 5 minutes | Receiver timed out. |
| `429` | Yes | Use `Retry-After` when trusted, otherwise 5 minutes | Receiver throttled. |
| `5xx` | Yes | 5 minutes | Receiver/server temporary failure. |
| `400` | No | None | Payload contract error needs operator review. |
| `401` or `403` | No automatic retry after first failure | None | Signature, secret, or authorization problem. |
| `404` | No by default | None | Usually target configuration problem. |
| Other `4xx` | No by default | None | Treat as receiver configuration contract problem. |

Retry execution requirements:

- Use exponential backoff with jitter after the first retry.
- Cap total attempts.
- Cap total retry age.
- Keep per-subscription and per-tenant rate limits.
- Preserve event ordering only when required by receiver contract.
- Surface exhausted attempts as operator action items.
- Avoid retry storms after receiver recovery.

Local/self-host exhausted delivery visibility uses `GET /api/events/webhook-deliveries/exhausted` with optional `maxAttempts`. The response is content-minimized: event IDs, target URL hashes, attempt numbers, statuses, timestamps, and exhaustion reasons only.

Local/self-host dead-letter review evidence uses `POST /api/events/webhook-deliveries/dead-letter` and `GET /api/events/webhook-deliveries/dead-letter` to record and list scoped operator decisions for exhausted candidates without replaying, deleting, or exposing raw target details.

Local/self-host dead-letter queue visibility uses `GET /api/events/webhook-deliveries/dead-letter/queue` to combine exhausted candidates with latest review status so operators can distinguish unreviewed and reviewed candidates without exposing raw target details. When configured, the same endpoint can return optional `REVIEW_REQUIRED` threshold status for unreviewed queue item counts.

Local/self-host dead-letter queue packet generation can use:

`npm run public-events:dead-letter-queue-packet -- --tenant-id <id> --workspace-id <id> --user-id <id> --as-of <iso-date> [--max-attempts <n>] [--type <event-type>] [--status <UNREVIEWED|REVIEWED>] [--json]`

The packet is review-only. It prepares scoped request metadata, queue-review command evidence, review steps, and production boundary flags. It must not include raw target URLs, signing secrets, raw event bodies, private task titles, private calendar titles, provider tokens, or provider row payloads. It does not approve replay, deletion, or production recovery completion.

Operators must keep dead-letter notes sanitized. Do not include raw target URLs, signing secrets, raw event bodies, private task titles, private calendar titles, provider tokens, or provider row payloads.

Current local retry metadata records first-attempt retry hints only. It is not a persistent production retry queue.

## Observability

Current local/self-host delivery summary reports scoped total attempts, delivered attempts, failed attempts, retryable failed attempts, target count, latest target status, latest attempt timestamp, next retry timestamp when available, optional configured `REVIEW_REQUIRED` threshold status, and target URL hashes only.

Current local/self-host dead-letter queue reports scoped queue counts, reviewed counts, unreviewed counts, exhausted candidate rows, latest review state, optional configured `REVIEW_REQUIRED` threshold status for unreviewed items, and target URL hashes only.

Current local/self-host subscription health reports scoped subscription totals, optional configured `REVIEW_REQUIRED` threshold status, and content-minimized per-subscription rows for enabled, disabled, healthy, failing, exhausted, and never-delivered subscriptions using target URL hashes only.

These views are useful for operator review, but they are not hosted dashboards, alerting systems, or durable worker monitors.

The local/self-host operator packet command emits dry-run-first worker invocation evidence: scope, `asOf`, optional event type/source filters, bounded `maxSubscriptions` and `maxEvents`, exact dry-run request payload, review steps, and production boundary flags.

The packet intentionally cannot approve live delivery and must not contain raw target URLs, signing secrets, or raw secret refs.

Hosted delivery observability must answer:

- Which subscriptions are enabled?
- Which subscriptions have never delivered successfully?
- Which subscriptions are failing now?
- Which event types fail most often?
- Which tenants or workspaces have rising failure rates?
- Which targets are throttling?
- Which retries are exhausted?
- Which deliveries are delayed beyond policy?
- Which receivers have stale timestamp or replay failures?

Minimum metrics:

- Delivery attempts by status.
- Retryable failures by error class.
- Non-retryable failures by error class.
- Retry queue depth.
- Oldest retry age.
- Delivery latency.
- Signature/auth failure count.
- Throttle count.
- Exhausted delivery count.
- Subscription disabled count.

Minimum logs:

- Delivery ID.
- Event ID.
- Subscription ID.
- Tenant, workspace, and user scope.
- Event type.
- Attempt number.
- Status.
- HTTP status or error code.
- Target URL hash.
- Secret version or key ID, not secret.
- Timestamp.

Do not log raw target URLs, secrets, signatures, raw event bodies, task titles, calendar titles, provider tokens, or provider row payloads.

## Alerts

Production alerting should include:

| Alert | Suggested Trigger | Operator Action |
| --- | --- | --- |
| Subscription failing | Consecutive failures exceed policy. | Review receiver health, target config, secret version. |
| Retry queue aging | Oldest retry exceeds policy. | Check worker health and downstream receiver availability. |
| Signature failures | `401` or `403` spikes. | Rotate or verify secret configuration. |
| Throttling | `429` spike or repeated trusted `Retry-After`. | Reduce send rate or coordinate receiver capacity. |
| Exhausted deliveries | Attempts exceed max retry policy. | Notify owner/operator and decide replay, disable, or drop. |
| Cross-scope anomaly | Any evidence crosses tenant/workspace/user scope. | Treat as security incident and pause delivery workers. |
| Payload privacy anomaly | Private text appears in delivery logs. | Treat as privacy incident and rotate affected logs/access. |

Alerts must include enough metadata for triage without including private event payload content.

## Incident Response

Local/self-host incident rehearsals can use:

`npm run public-events:delivery-incident-drill-packet -- --tenant-id <id> --workspace-id <id> --user-id <id> --as-of <iso-date> --incident-id <id> --failure-class <network|receiver|signature|throttling|contract|privacy|cross-scope|worker> [--type <event-type>] [--source-system <source>] [--max-subscriptions <n>] [--max-events <n>] [--json]`

The drill packet is review-only. It prepares bounded dry-run evidence, pause guidance, evidence-collection steps, privacy boundaries, and replay boundaries. It must not include raw target URLs, signing secrets, raw secret refs, provider tokens, private task titles, private calendar titles, or raw event bodies. It does not approve live delivery, replay, deletion, or secret access.

When delivery failures spike:

1. Pause affected subscription workers if failures may amplify downstream load.
2. Confirm whether failures are network, receiver, signature, throttling, contract, privacy, or cross-scope related.
3. Review delivery attempts by subscription ID, target URL hash, event type, and status.
4. Confirm no private content leaked into logs or responses.
5. For retryable outages, allow retry queue drain after receiver recovery.
6. For non-retryable contract failures, disable affected subscription until fixed.
7. For secret failures, rotate the secret and send a fictional test event.
8. For privacy or cross-scope anomalies, treat as a security incident and preserve evidence outside workspace cleanup paths.
9. Record operator notes, timeline, customer impact, and remediation.

## Disable Or Pause Subscription

Operators must be able to stop delivery without deleting evidence.

Recommended behavior:

- `DISABLED` stops future delivery selection.
- In-flight attempts may finish unless the worker supports cancellation.
- Evidence remains readable for audit.
- Re-enabling subscription should require operator review when the previous state was disabled for security, privacy, or contract failure.

Current local/self-host `POST /api/events/webhook-subscriptions/status` records scoped enabled/disabled metadata and `deliver-ready` skips disabled subscriptions. Production worker pause queues, in-flight attempt draining, hosted approval workflow, and hosted dashboard controls remain release blockers.

## Verification Checklist

Before production release, prove:

- Active subscription delivery workers exist.
- Delivery workers use durable queue storage.
- Target URL and signing secret resolve through managed secret/config storage.
- Raw target URLs and secrets are absent from public APIs, logs, exports, and audit views.
- Retryable responses retry with bounded backoff jitter.
- Non-retryable responses do not loop.
- Disabled subscriptions stop new sends.
- Exhausted retries create operator-visible actions.
- Dead-letter review evidence remains content-minimized.
- Delivery metrics, logs, dashboards, and alerts work in hosted environment.
- Receiver replay-store guidance is verified against a real receiver.
- Privacy scans cover delivery logs and dead-letter evidence.
- Cross-scope isolation is tested for subscription reads, worker selection, delivery attempts, and operator views.

## Release Boundary

This runbook closes the operator-runbook documentation foundation for public-event delivery. It does not complete:

- Production managed secret storage integration.
- Durable production subscription delivery workers.
- Durable hosted retry workers.
- Durable production dead-letter queues.
- Hosted dashboards and alert routing.
- Production incident drills.
- Final public release approval.
