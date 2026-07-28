# Public Event Webhook Receiver Runbook

## Status

Local/self-host receiver verification and replay-store guidance foundation accepted 2026-07-23.

Production subscription delivery workers, persistent retry execution, hosted delivery operations, hosted observability, alert routing, and provider-specific receiver certification remain release blockers.

## Purpose

ScheduleOS can deliver content-minimized public events to a caller-provided webhook target through:

```text
POST /api/events/webhook-deliveries
```

Receivers must verify every signed delivery, reject stale or tampered requests, store replay keys before processing side effects, and treat duplicate delivery as a normal idempotency case.

This runbook is for applications receiving ScheduleOS public events. It is not a subscription-management design and does not make hosted delivery production-ready.

## Delivery Headers

Every signed public-event delivery includes:

| Header | Meaning |
| --- | --- |
| `scheduleos-event-id` | Stable public event ID for the delivered event envelope. |
| `scheduleos-delivery-id` | Unique delivery attempt ID for this outbound attempt. |
| `scheduleos-timestamp` | Delivery timestamp used in signature verification and freshness checks. |
| `scheduleos-signature` | HMAC-SHA256 signature over timestamp, delivery ID, event ID, and raw JSON body. |

Receiver rules:

- Reject requests missing any required header.
- Treat header names case-insensitively as HTTP headers, but normalize to the canonical names above in logs and documentation.
- Do not trust event type, tenant, workspace, user, or subject data until the signature and timestamp are verified.
- Do not log raw request bodies before verification.

## Signature Verification

The current ScheduleOS local/self-host delivery foundation signs this base string:

```text
<scheduleos-timestamp>.<scheduleos-delivery-id>.<scheduleos-event-id>.<raw-json-body>
```

The signature is HMAC-SHA256 using the shared webhook secret for the receiving endpoint.

Verification steps:

1. Read the raw request body bytes exactly as received.
2. Read `scheduleos-timestamp`, `scheduleos-delivery-id`, `scheduleos-event-id`, and `scheduleos-signature`.
3. Build the signature base string using the timestamp, delivery ID, event ID, and raw JSON body.
4. Compute HMAC-SHA256 with the receiver endpoint secret.
5. Compare signatures using constant-time comparison.
6. Reject invalid signatures before parsing event business fields or performing side effects.

The receiver may parse JSON after basic body-size limits are enforced, but it must not trust parsed event content until the signature passes.

## Timestamp Tolerance

Receivers should reject stale delivery timestamps. Recommended default:

```text
5 minutes
```

Receiver behavior:

- Reject timestamps older than the configured tolerance.
- Reject timestamps too far in the future.
- Use a monotonic or trusted server clock for freshness decisions.
- Alert when many stale but correctly signed deliveries appear, because that may indicate delayed queues, clock drift, or replay attempts.

Tighten the tolerance only after the receiver, sender, and queueing path have verified clock synchronization. Do not loosen the tolerance to support batch recovery; use a separate replay or backfill workflow instead.

## Replay Store

Receivers must store replay keys before applying side effects. The store should be durable across receiver restarts and shared across receiver instances.

Recommended replay keys:

| Key | Required? | Use |
| --- | --- | --- |
| `scheduleos-delivery-id` | Yes | Detects the same delivery attempt being replayed. |
| `scheduleos-event-id` | Recommended | Supports event-level idempotency when ScheduleOS retries or a receiver wants one side effect per event. |
| `event.idempotencyKey` | Optional | Useful when the receiver already has an idempotency layer keyed by source event semantics. |

Recommended retention:

```text
At least 30 days for delivery IDs.
At least 30 days for event IDs when receiver side effects are not naturally idempotent.
Longer retention when legal, financial, billing, external action, or destructive side effects are triggered.
```

Replay records should store only operational metadata:

- Delivery ID hash or exact delivery ID.
- Event ID hash or exact event ID.
- Tenant/workspace/user scope.
- Event type.
- First-seen timestamp.
- Processing status.
- Minimal error code if processing failed.

Do not store webhook secrets, signatures, raw target URLs, raw event bodies, private task titles, private calendar titles, provider tokens, or full downstream payloads in the replay store.

## Duplicate Handling

Duplicate delivery is expected in any reliable webhook design. Receivers should make duplicate handling quiet, explicit, and observable.

Recommended behavior:

1. Verify signature and timestamp first.
2. Check the replay store for `scheduleos-delivery-id`.
3. If already processed, return `2xx` with no repeated side effect.
4. If event-level idempotency is required, also check `scheduleos-event-id`.
5. If the event was already applied through another delivery attempt, return `2xx` and record duplicate-observed metadata.
6. If a previous attempt is still in progress, return `409` or `202` according to receiver policy and avoid concurrent side effects.

Never use duplicate detection as a reason to expose private event payload content in responses.

## Response Expectations

ScheduleOS records delivery attempt status and retry metadata for failed network deliveries and failed `408`, `429`, or `5xx` responses.

Receiver response guidance:

| Response | Meaning |
| --- | --- |
| `2xx` | Event accepted, already idempotently handled, or intentionally ignored after successful verification. |
| `400` | Malformed request that should not be retried without sender change. |
| `401` or `403` | Signature or authorization failure; receiver should alert. |
| `408` | Receiver timeout; retryable. |
| `409` | Receiver conflict or in-progress duplicate; retry policy depends on receiver design. |
| `429` | Receiver throttled delivery; retryable. |
| `5xx` | Receiver temporary failure; retryable. |

Response bodies must not include webhook secrets, expected signatures, private event content, internal stack traces, provider tokens, or replay-store internals.

## Secret Rotation

Receivers should support planned overlap for current and previous secrets.

Recommended rotation flow:

1. Add new receiver secret in secret manager.
2. Configure receiver to accept both new and previous secret during a short overlap window.
3. Update ScheduleOS delivery configuration to use the new secret.
4. Send a fictional test event.
5. Confirm the receiver verifies the new signature and stores replay keys.
6. Remove the previous secret after the overlap window.
7. Record rotation evidence outside any workspace cleanup path.

Emergency rotation should revoke the exposed secret immediately, pause downstream side effects if needed, and review delivery-attempt evidence for invalid signatures, stale timestamps, replay bursts, and unusual event types.

## Privacy Expectations

ScheduleOS public events are content-minimized, but receivers still need privacy discipline.

Receiver rules:

- Log IDs, event type, scope, status, and hashes instead of raw bodies.
- Avoid storing event `data` unless the receiving product needs it for a documented side effect.
- Do not enrich logs with task titles, calendar titles, provider row payloads, tokens, or raw target URLs.
- Treat `tenantId`, `workspaceId`, and `userId` as scoped identifiers that must not cross customer boundaries.
- Keep replay-store, dead-letter, and alert systems under the same retention and access controls as production application logs.

## Verification Checklist

Before treating a receiver as production-ready:

- Missing required headers are rejected.
- Invalid signatures are rejected.
- Timestamp outside tolerance is rejected.
- Replayed `scheduleos-delivery-id` returns `2xx` without repeating side effects.
- Replayed `scheduleos-event-id` returns `2xx` when event-level idempotency is required.
- Replay store survives receiver restart.
- Replay store is shared across all receiver instances.
- `408`, `429`, and `5xx` responses are observable as retryable failures in ScheduleOS delivery-attempt evidence.
- Response bodies do not leak secrets, signatures, private event data, raw target URLs, provider tokens, or stack traces.
- Logs and alerts contain only minimized operational metadata.
- Secret rotation and emergency revocation have been tested with fictional event IDs.

## Release Boundary

This runbook completes receiver replay-store guidance for the current local/self-host public-event delivery foundation. It does not complete:

- Production public-event subscription registration.
- Persistent retry queue execution.
- Hosted delivery workers.
- Hosted delivery dashboards and alerting.
- Provider-specific receiver certification.
- Public production release approval.
