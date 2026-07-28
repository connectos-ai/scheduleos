# Hosted Public-Event Delivery Contract

Production managed-secret and public-event worker approval is tracked in `docs/security/production-managed-secret-public-event-approval-checklist.md`. This document defines the local hosted public-event delivery evidence contract for release review.

This document does not configure managed secrets, start hosted workers, create queues, send alerts, create a remote repository, publish packages, or change release status.

## Status

Current result: `FAIL`.

ScheduleOS now has a local hosted public-event delivery evidence validator in `src/hosted-public-event-delivery-contract.ts` with tests in `src/hosted-public-event-delivery-contract.test.ts`. It proves the review shape only.

## Contract Purpose

Hosted public-event delivery evidence must prove production operators can safely resolve managed secret references, run durable delivery workers, retry failed webhook delivery, route exhausted events to a dead-letter queue, observe delivery health, respond to incidents, and protect private delivery material.

## Required Evidence Areas

- Managed secret provider selection.
- Managed secret refs only, no raw secret storage.
- Tenant, workspace, and purpose scoped secret resolution.
- Secret rotation and emergency revocation drills.
- Runtime identity with least-privilege permissions.
- Worker topology safe for horizontal scaling.
- Idempotent delivery and replay protection.
- Receiver rate-limit header policy.
- Durable retry queue and durable dead-letter queue.
- Retry backoff, max-attempt, pause/resume, and backlog-drain procedures.
- Hosted dashboard covering delivery health, retry queue, dead-letter queue, and managed-secret health.
- Alerts for failed attempts, retryable failures, exhausted subscriptions, never-delivered subscriptions, dead-letter backlog, managed-secret failures, replay anomalies, receiver rate-limit spikes, and queue backlog.
- Incident drills for network failure, receiver failure, signature mismatch, managed-secret outage, queue backlog, privacy anomaly, rollback, and second-operator review.
- Privacy-minimized evidence without raw target URLs, signing secrets, raw secret refs, private event bodies, or raw payloads.

## Fictional Evidence Values

Use fictional values such as:

```text
production_demo
tenant_demo
workspace_demo
user_jordan
managed_secret_provider_demo
runtime_identity_demo
durable_retry_queue_demo
durable_dead_letter_queue_demo
hosted_delivery_dashboard_demo
```

## Verification

Focused verification:

```bash
npm run build
node --test dist/hosted-public-event-delivery-contract.test.js
```

Full verification:

```bash
npm run check
npm audit --omit=dev --audit-level=high
find . -maxdepth 2 -name .git -type d -print
```

## Release Boundary

This contract is a local foundation. ScheduleOS release status remains `FAIL` until production managed secret storage, durable hosted public-event workers, hosted retry execution, hosted observability, alert routing, incident response, remote CI, final audits, and second-operator approval are complete.
