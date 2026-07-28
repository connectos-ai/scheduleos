# Provider Quota Policy Contract

Production rate-limit and abuse-monitoring approval is tracked in `docs/security/production-rate-limit-approval-checklist.md`. This document defines the local provider quota policy contract foundation for release review.

This document does not enable production throttling, configure a distributed store, mutate provider quota policy, configure hosted alerts, create dashboards, create remotes, publish packages, or change release status.

## Status

Current result: `FAIL`.

ScheduleOS now has a local provider quota policy validator in `src/provider-quota-policy.ts` with tests in `src/provider-quota-policy.test.ts`. It is evidence for quota-policy review shape only.

## Contract Purpose

Provider quota policy must prove that provider traffic can be governed per tenant, workspace, user, provider, and operation before production release. The policy must separate read-only sync, imports, webhooks, exports, and write-back traffic so one noisy lane cannot hide or starve another.

The validator checks:

- Distributed quota store requirement.
- Tenant/workspace/user/provider/operation quota keys.
- Positive limits for import, export, sync, webhook, and write-back operations.
- Burst limits no higher than window limits.
- Retry-after guidance on every quota denial.
- Separate enforcement lanes for read-only sync, write-back, webhooks, and imports.
- Idempotency-aware enforcement.
- Exponential backoff.
- Provider retry-after handling.
- Hosted alert classes.
- Privacy-minimized quota evidence.

## Required Operations

Provider quota policies must define limits for:

- `IMPORT`
- `EXPORT`
- `SYNC`
- `WEBHOOK`
- `WRITE_BACK`

## Required Alert Classes

Provider quota policies must document hosted alert handling for:

- `QUOTA_EXHAUSTION`
- `DENIED_REQUEST_SPIKE`
- `RETRY_AFTER_SPIKE`
- `SYNC_LOOP`
- `WRITE_BACK_CONFLICT_SPIKE`
- `CROSS_SCOPE_ATTEMPT`
- `PROVIDER_ERROR_SPIKE`

These are review requirements only until hosted alert routing and dashboards are implemented and approved.

## Privacy Boundary

Provider quota evidence must use hashed quota keys and exclude:

- Raw bearer tokens.
- Raw session cookies.
- Raw provider account IDs.
- Raw provider payloads.
- Private task titles.
- Private calendar titles.
- Attendees.
- Locations.
- Descriptions.

Use fictional labels such as:

```text
tenant_demo
workspace_demo
user_jordan
provider_quota_policy_demo
quota_key_hash_demo
quota_denial_summary_demo
hosted_alert_routing_demo
```

## Verification

Focused verification:

```bash
npm run build
node --test dist/provider-quota-policy.test.js
```

Full verification:

```bash
npm run check
npm audit --omit=dev --audit-level=high
find . -maxdepth 2 -name .git -type d -print
```

## Release Boundary

This contract is a local foundation. ScheduleOS release status remains `FAIL` until production distributed rate limiting, provider-specific quota enforcement, hosted alert delivery, hosted dashboards, abuse analytics, remote CI, final audits, and second-operator approval are complete.
