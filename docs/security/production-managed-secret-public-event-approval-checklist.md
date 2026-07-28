# Production Managed Secret And Public Event Worker Approval Checklist

## Status

Current result: `FAIL`.

ScheduleOS has local/self-host managed-secret resolver boundaries, public-event webhook subscription foundations, delivery attempt records, retry/dead-letter foundations, and review-only hosted delivery readiness packets. Production managed secret storage, durable hosted public-event workers, hosted retry execution, hosted observability, alert routing, and operator approval are not approved for public release until the evidence below is attached, reviewed, and accepted.

No public repository, hosted deployment, tag, package publication, or release announcement may rely on hosted public-event delivery until this checklist changes to `PASS`.

## Verified Local Foundations

Current local evidence covers:

- Content-minimized public event catalog and read model.
- Webhook subscription metadata without returning raw target URLs or signing secrets.
- Local/self-host configured delivery target references.
- Managed-secret resolver boundary with tenant, workspace, and purpose checks before provider lookup.
- Sanitized `MANAGED_SECRET_RESOLUTION_CHECKED` audit rows for resolved, unavailable, provider-unavailable, provider-error, and scope-rejected outcomes.
- Local delivery attempts, retryable failure metadata, bounded dry-run delivery, retry-due execution, exhausted delivery visibility, dead-letter review, dead-letter queue visibility, and local alert-threshold summaries.
- Public-event delivery operator runbook and receiver runbook foundations.
- `public-events:hosted-delivery-readiness-packet` review-only evidence labels for managed-secret provider, runtime identity, rotation/revocation drill, worker topology, retry queue, dead-letter queue, hosted dashboard, alert routing, replay boundary, rate-limit header key, incident drill, remote CI, rollback, and second operator.
- Hosted public-event delivery contract validator exists at `src/hosted-public-event-delivery-contract.ts` with tests for managed-secret custody, scoped secret refs, runtime identity, least-privilege worker topology, durable retry/dead-letter queues, idempotent delivery, replay protection, observability, alert classes, incident drills, rollback, second-operator review, and privacy-minimized evidence.

These foundations do not approve production hosted workers or managed secret storage.

## Required Evidence Before PASS

Attach current evidence for every item:

- Managed secret provider selected for hosted delivery targets and signing secrets.
- Runtime identity and least-privilege access policy reviewed for secret read paths.
- Tenant/workspace/purpose scoping reviewed for all secret refs.
- Secret rotation drill completed without exposing raw target URLs, signing secrets, raw secret refs, provider tokens, callback URLs, or private payloads.
- Emergency revocation drill completed and documented with operator approval.
- Durable subscription worker topology reviewed for concurrency, idempotency, retries, timeouts, shutdown, and backpressure.
- Durable hosted retry queue selected, persisted, monitored, and rollback-tested.
- Durable dead-letter queue selected, persisted, reviewed, and operator-drilled.
- Hosted delivery dashboard or equivalent operator view reviewed for delivery health without raw secrets or private event bodies.
- Hosted alert routing reviewed for failed attempts, retryable failures, exhausted subscriptions, never-delivered subscriptions, dead-letter backlog, replay anomalies, and managed-secret provider failures.
- Replay boundary and idempotency controls reviewed for duplicate delivery prevention.
- Rate-limit header key or delivery throttle policy reviewed for receiver protection.
- Incident drill completed for network failure, receiver failure, signature mismatch, replay, managed-secret outage, queue backlog, privacy anomaly, and cross-scope attempt.
- Privacy review confirms hosted delivery evidence is content-minimized.
- Rollback procedure reviewed for worker disablement, queue pause, subscription pause, secret revocation, and replay prevention.
- Remote CI proof exists for hosted delivery packet coverage, public-event delivery foundations, retry/dead-letter behavior, managed-secret resolver scope checks, and release safety.
- Security, privacy, and licensing audits are still `PASS` after hosted delivery evidence is attached.
- Second operator approves the final managed-secret and hosted-worker evidence packet.

## Required Commands

Run these before changing this checklist to `PASS`:

```bash
npm run check
npm audit --omit=dev --audit-level=high
find . -maxdepth 2 -name .git -type d -print
```

The no-`.git` check must return no output until the intentional clean public repository history is prepared.

## Review-Only Packet

Use this command to prepare evidence labels only:

```bash
npm run public-events:hosted-delivery-readiness-packet -- --environment production-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --secret-provider managed-secret-provider-review-demo --runtime-identity runtime-identity-review-demo --rotation-drill rotation-revocation-drill-demo --worker-topology durable-worker-topology-demo --retry-queue durable-retry-queue-demo --dead-letter-queue durable-dead-letter-queue-demo --hosted-dashboard hosted-dashboard-demo --alert-routing hosted-alert-routing-demo --replay-boundary replay-boundary-demo --rate-limit-header-key receiver-rate-limit-header-demo --incident-drill hosted-delivery-incident-drill-demo --remote-ci remote-ci-hosted-delivery-demo --rollback-plan hosted-delivery-rollback-plan-demo --second-operator second-operator-hosted-delivery-demo --json
```

This packet does not configure managed secrets, schedule hosted delivery workers, mutate queues, send alerts, replay deliveries, mark audits `PASS`, create remotes, publish packages, or announce ScheduleOS.

## Current Remaining Risk

High. Local/self-host public-event delivery is useful foundation work, but hosted production delivery remains unproven until managed secret storage, runtime identity, durable workers, retry/dead-letter queues, observability, alert routing, incident response, rollback, remote CI, final audits, and second-operator review are complete.

## Release Rule

Do not mark "Production managed secret storage and durable hosted public-event workers/observability" complete until this checklist changes from `FAIL` to `PASS` with current release-candidate evidence.
