# Hosted Abuse Analytics Contract

Production rate-limit and abuse-monitoring approval is tracked in `docs/security/production-rate-limit-approval-checklist.md`. This document defines the local hosted abuse analytics evidence contract for release review.

This document does not configure hosted monitoring, send alerts, create dashboards, create a remote repository, publish packages, or change release status.

## Status

Current result: `FAIL`.

ScheduleOS now has a local hosted abuse analytics evidence validator in `src/hosted-abuse-analytics-contract.ts` with tests in `src/hosted-abuse-analytics-contract.test.ts`. It proves the review shape only.

## Contract Purpose

Hosted abuse analytics evidence must prove production operators can detect abusive or broken traffic across request throttles, imports, provider quotas, public-event delivery, webhook verification, credential attacks, reset-token request spikes, cross-scope attempts, and oversized requests.

The evidence must stay privacy-minimized. It should use scoped summaries and hashed actor keys instead of raw tokens, session cookies, client IPs, webhook targets, private calendar titles, private task titles, raw provider account IDs, or raw payloads.

## Required Signals

- `REQUEST_THROTTLE_SATURATION`
- `IMPORT_THROTTLE_DENIAL`
- `PROVIDER_QUOTA_EXHAUSTION`
- `PUBLIC_EVENT_DELIVERY_FAILURE`
- `PUBLIC_EVENT_SUBSCRIPTION_HEALTH`
- `PUBLIC_EVENT_DEAD_LETTER_BACKLOG`
- `WEBHOOK_SIGNATURE_FAILURE`
- `WEBHOOK_REPLAY_ATTEMPT`
- `CREDENTIAL_FAILURE_SPIKE`
- `PASSWORD_RESET_REQUEST_SPIKE`
- `CROSS_SCOPE_AUTHORIZATION_ATTEMPT`
- `OVERSIZED_REQUEST_REJECTION`

## Required Operator Evidence

- Hosted-only evidence, not local-only summary output.
- Distributed event correlation across runtime instances.
- Tenant, workspace, user, source-system, provider, and operation scope keys.
- Operator overview dashboard.
- Tenant/workspace breakdown.
- Provider/operation breakdown.
- Retry and backoff view.
- Incident export with approval controls.
- Alert destination, escalation path, on-call review, and false-positive review.
- Retention window no longer than 400 days unless a future legal/security review explicitly changes this contract.

## Fictional Evidence Values

Use fictional values such as:

```text
production_demo
tenant_demo
workspace_demo
user_jordan
source_demo
provider_demo
abuse_metric_hash_demo
hosted_alert_route_demo
operator_dashboard_demo
```

## Verification

Focused verification:

```bash
npm run build
node --test dist/hosted-abuse-analytics-contract.test.js
```

Full verification:

```bash
npm run check
npm audit --omit=dev --audit-level=high
find . -maxdepth 2 -name .git -type d -print
```

## Release Boundary

This contract is a local foundation. ScheduleOS release status remains `FAIL` until production distributed rate limiting, provider-specific quota enforcement, hosted alert delivery, hosted dashboards, abuse analytics, remote CI, final audits, and second-operator approval are complete.
