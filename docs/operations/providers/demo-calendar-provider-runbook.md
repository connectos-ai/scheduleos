# Demo Calendar Provider Lifecycle Runbook

This runbook is a fictional provider-specific template for release review. It proves the provider lifecycle runbook contract can be applied to a concrete provider class without using real provider credentials, real accounts, real calendar content, or production write-back.

## Status

Current result: `FAIL`.

This demo runbook is local/review-only evidence. It does not approve production calendar-provider support, configure hosted alerts, store secrets, rotate credentials, revoke provider access, write calendar data, create remotes, publish packages, or change release status.

## Provider Setup

Provider class: `demo_calendar_provider`.

Supported local/review-only capabilities:

- Import fixed busy events from sanitized provider fixtures.
- Export accepted ScheduleOS blocks as provider-neutral write-back candidates.
- Validate sync checkpoint handling with fictional cursors.
- Validate disconnect and revoked-provider behavior.

Unsupported in this demo runbook:

- Production OAuth.
- Hosted provider webhooks.
- Production calendar write-back.
- Real account sync.
- Real provider quota mutation.

Required setup evidence labels:

```text
tenant_demo
workspace_demo
user_jordan
provider_connection_demo
calendar_fixture_demo
```

## Permissions And Scopes

Minimum provider permission classes for a real calendar provider must be reviewed before release:

- Calendar read metadata: required to discover calendars and busy/free capability.
- Calendar read events: required to import fixed commitments and detect conflicts.
- Calendar write events: optional, required only when write-back is enabled.
- Webhook subscription management: optional, required only when hosted provider webhooks are enabled.

Least-privilege rule: read-only sync must work without write scopes. Write scopes must be separable so operators can disable write-back while preserving read-only import.

## Managed-Secret Custody

Raw provider credentials must live only in the approved managed-secret provider. ScheduleOS public records may store:

- Provider class.
- Connection status.
- Capability flags.
- Secret reference hash.
- Secret version or key ID.
- Last sanitized sync status.

ScheduleOS public records must not store raw client secrets, refresh tokens, access tokens, webhook signing secrets, raw account IDs, raw event payloads, attendees, locations, descriptions, or private calendar titles.

Fictional custody labels:

```text
managed_secret_provider_demo
secret_ref_hash_demo
provider_key_version_demo
runtime_identity_demo
```

## Rotation Drill

Normal rotation rehearsal:

1. Create a new secret version in managed storage.
2. Update the provider connection metadata to point at the new version label.
3. Run a fictional read-only sync verification against sanitized fixture evidence.
4. Run a fictional write-back preview without provider mutation.
5. Confirm logs and audit rows show only hashes, key IDs, status, and capability labels.
6. Disable the previous version after the approved overlap window.
7. Record operator and second-operator evidence labels.

Required evidence labels:

```text
rotation_drill_demo
rotation_overlap_window_demo
rotation_second_operator_demo
```

## Emergency Revocation Drill

Emergency revocation rehearsal:

1. Mark the provider connection `DISCONNECTED`.
2. Disable write-back for the provider connection.
3. Revoke the active secret version in managed storage.
4. Verify revoked credentials cannot resolve.
5. Reject new sync checkpoints for the revoked provider.
6. Clear or quarantine unsafe cursors.
7. Preserve incident notes outside workspace cleanup paths.
8. Confirm sanitized audit rows contain no raw provider payloads.

Required evidence labels:

```text
revocation_drill_demo
revoked_secret_resolution_denied_demo
revoked_provider_checkpoint_denied_demo
```

## Write-Back Safety

Write-back must stay disabled until explicit production approval. When write-back is approved later, the provider adapter must prove:

- Accepted or locked ScheduleOS blocks are the only write candidates.
- Conflict preview runs before any provider mutation.
- Review acknowledgement is required before write-back readiness.
- Duplicate prevention uses stable idempotency keys.
- Locked blocks are preserved during replanning.
- Provider errors map to local `FAILED` or review-required states.
- Operators can disable writes while leaving read-only sync enabled.

Required evidence labels:

```text
write_back_preview_demo
write_back_conflict_demo
write_back_disabled_demo
idempotency_key_demo
```

## Sync Checkpoint Recovery

Sync checkpoints must be scoped by tenant, workspace, user, provider class, and connection ID. The runbook must prove:

- Stale cursors trigger a safe full-resync path.
- Conflicting checkpoint replays are rejected.
- Revoked provider connections cannot create new checkpoints.
- Duplicate event imports are idempotent.
- Full resync does not expose private titles or raw provider responses in evidence.

Required evidence labels:

```text
sync_checkpoint_demo
stale_cursor_recovery_demo
checkpoint_replay_denied_demo
full_resync_demo
```

## Hosted Operator Alerts

Hosted alert routing must be reviewed before production approval. Required alert classes:

- Token resolution failure.
- Webhook signature failure.
- Replay attempt.
- Provider quota exhaustion.
- Write-back conflict spike.
- Revocation failure.
- Sync drift.
- Managed-secret resolver failure.

Fictional alert labels:

```text
hosted_alert_routing_demo
provider_quota_alert_demo
sync_drift_alert_demo
revocation_failure_alert_demo
```

## Incident Response

Provider incident response must define first actions for:

- Suspected credential exposure.
- Provider quota exhaustion.
- Unexpected write-back.
- Webhook replay.
- Sync drift.
- Privacy evidence leak.

First actions are disable write-back, pause sync if needed, revoke affected secret version, preserve sanitized audit evidence, notify the approved operator path, and open security/privacy review when provider data exposure is possible.

## Rollback

Rollback must support:

- Disable provider writes.
- Disable webhook intake or delivery.
- Pause provider sync.
- Revoke active provider credentials.
- Restore from approved backup if local state was corrupted.
- Replay safe sanitized events after approval.
- Verify logs, exports, backups, and support bundles contain no raw secrets or private provider payloads.

Required evidence labels:

```text
provider_rollback_demo
write_back_pause_demo
sync_pause_demo
backup_restore_demo
```

## Privacy Minimization

Production provider evidence must not include raw task titles, calendar titles, attendees, locations, descriptions, raw rows, raw provider responses, raw account IDs, raw tokens, raw webhook secrets, or raw URLs.

Allowed evidence fields:

- Tenant/workspace/user demo IDs.
- Provider class.
- Capability status.
- Hashes.
- Secret version or key ID.
- Event count.
- Conflict count.
- Error class.
- Review status.

## Support Escalation

Support may inspect sanitized status, capability flags, error classes, count summaries, and audit event IDs. Support must not inspect raw provider credentials, private event bodies, private task content, private calendar titles, attendee details, locations, descriptions, or raw provider responses.

Escalation path:

1. Support records sanitized issue label.
2. Operator reviews provider status and alert evidence.
3. Security reviewer joins if credential exposure is suspected.
4. Privacy reviewer joins if private provider content may have leaked.
5. Second operator records approval before production lifecycle `PASS`.

## Sanitized Evidence Examples

Safe evidence labels:

```text
tenant_demo
workspace_demo
user_jordan
demo_calendar_provider
provider_connection_demo
secret_ref_hash_demo
rotation_drill_demo
revocation_drill_demo
write_back_safety_demo
sync_checkpoint_demo
hosted_alert_routing_demo
incident_response_demo
rollback_demo
support_escalation_demo
```

Unsafe evidence examples are forbidden: email-shaped strings, real account IDs, raw provider identifiers, raw tokens, raw webhook secrets, raw URLs, private task titles, private calendar titles, attendee names, locations, descriptions, raw rows, and raw provider responses.

## Release Boundary

This runbook is a local/review-only provider lifecycle template. ScheduleOS release status remains `FAIL` until real provider-specific adapters, real provider-specific runbooks, hosted operator alerts, managed-secret storage proof, remote CI, final security/privacy/licensing audits, and second-operator approval are complete.
