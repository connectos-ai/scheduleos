# Provider Lifecycle Runbook Contract

Production provider lifecycle approval is tracked in `docs/security/production-provider-lifecycle-approval-checklist.md`. This contract defines the minimum sections every provider-specific runbook must include before ScheduleOS can claim production-grade provider lifecycle support.

This document does not approve any provider, mutate provider credentials, enable hosted alerts, write calendar data, create remotes, publish packages, or change release status.

## Status

Current result: `FAIL`.

ScheduleOS has local/self-host provider lifecycle foundations and review-only readiness packets. Provider-specific production runbooks remain required before release approval.

## Required Provider Runbook Sections

Every provider-specific runbook in release scope must include these sections:

- Provider setup.
- Permissions and scopes.
- Managed-secret custody.
- Rotation drill.
- Emergency revocation drill.
- Write-back safety.
- Sync checkpoint recovery.
- Hosted operator alerts.
- Incident response.
- Rollback.
- Privacy minimization.
- Support escalation.
- Sanitized evidence examples.

## Provider Setup

Document the provider environment, connection type, supported capabilities, unsupported capabilities, tenant/workspace scope, operator prerequisites, and non-production demo setup path. Use fictional IDs only.

## Permissions And Scopes

List each provider permission or scope requested, why it is needed, whether it is read-only or write-capable, and which ScheduleOS workflow uses it. The runbook must document the least-privilege review and note any optional scopes separately.

## Managed-Secret Custody

Document where provider client secrets, refresh tokens, webhook signing secrets, and delivery target secrets live. Public ScheduleOS records may store only opaque references, hashes, versions, key IDs, provider class names, and capability status. Raw secrets must stay in the managed secret provider.

## Rotation Drill

Document the normal rotation path: create a new version, activate it, run a fictional verification sync or webhook delivery, confirm sanitized audit evidence, disable the previous version after the overlap window, and record operator plus reviewer approval.

## Emergency Revocation Drill

Document the emergency path: disable the provider connection or subscription, revoke the affected secret version, verify ScheduleOS cannot resolve revoked credentials, clear or quarantine unsafe sync checkpoints, stop write-back attempts, review alerts, and record incident evidence outside workspace cleanup paths.

## Write-Back Safety

Document which writes the provider supports, how ScheduleOS previews conflicts, how locked blocks are preserved, how duplicate writes are prevented, how provider errors map to safe local states, and how operators disable writes without disabling read-only sync.

## Sync Checkpoint Recovery

Document how cursors, sync tokens, etags, or provider checkpoints are stored, reset, and replayed. Include stale checkpoint handling, revoked provider handling, duplicate prevention, and safe full-resync behavior.

## Hosted Operator Alerts

Document hosted alerts for token failure, webhook signature failure, replay attempts, provider quota exhaustion, write-back conflict spikes, revocation failure, sync drift, and managed-secret resolver failures. Include alert owner, severity, destination label, and expected response time.

## Incident Response

Document provider-specific incident classes, first actions, evidence to preserve, customer-facing support boundary, privacy review trigger, security review trigger, and escalation owner. Evidence must use sanitized identifiers and avoid raw provider payloads.

## Rollback

Document how to disable provider writes, disable webhook delivery, pause sync, revoke credentials, restore from backups, replay safe events, and verify no raw secrets or private provider payloads entered logs, exports, or support bundles.

## Privacy Minimization

Document data fields imported from the provider, fields intentionally not stored, redaction behavior for task titles, calendar titles, attendees, locations, descriptions, raw row payloads, provider responses, provider account IDs, and support evidence.

## Support Escalation

Document support tiers, what support may inspect, what support must not inspect, how to request operator review, how to escalate suspected secret exposure, and how to record second-operator approval.

## Sanitized Evidence Examples

Include fictional evidence labels and safe examples only, such as:

```text
tenant_demo
workspace_demo
user_jordan
provider_connection_demo
secret_ref_hash_demo
rotation_drill_demo
revocation_drill_demo
write_back_safety_demo
hosted_alert_routing_demo
```

Do not include email-shaped strings, real account IDs, raw provider identifiers, raw tokens, raw webhook secrets, raw URLs, private task titles, private calendar titles, attendee names, locations, descriptions, raw rows, or raw provider responses.

## Release Boundary

This contract is local/review-only evidence. ScheduleOS release status remains `FAIL` until provider-specific runbooks, provider-specific adapters, hosted alerts, managed-secret storage, remote CI, final audits, and second-operator approval are all current and accepted.
