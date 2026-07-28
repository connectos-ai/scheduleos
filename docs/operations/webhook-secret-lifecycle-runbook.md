# Webhook Secret Lifecycle Runbook

## Status

Local/self-host webhook secret lifecycle runbook foundation accepted as of 2026-07-22. Production provider-specific adapters, managed secret storage, automated alert routing, and verified hosted operations remain release blockers.

## Purpose

Signed webhooks let external task sources send work into ScheduleOS without giving ScheduleOS direct custody of provider accounts. Operators must manage webhook secrets as credentials, rotate them deliberately, and revoke them quickly when compromise is suspected.

Production managed-secret storage requirements are defined in [Managed Secret Storage Runbook](managed-secret-storage-runbook.md). This file covers local/self-host source secret lifecycle and operator rotation practices.

This runbook applies to the generic webhook endpoint:

```text
POST /api/task-sources/webhook
```

## Secret Storage Rules

- Store webhook secrets in deployment secret storage, not source code.
- Do not place real secrets in documentation, fixtures, exports, backups, logs, issue reports, or support notes.
- Configure one secret per trusted `sourceSystem` whenever possible.
- Use a rotation list only during a planned overlap window.
- Remove previous secrets after the overlap window ends.
- Reject blank secrets and empty rotation lists at startup.

Example local/self-host configuration shape:

```ts
webhookSecrets: {
  GENERIC_WEBHOOK: ["current_secret_value", "previous_secret_value"]
}
```

## Planned Rotation

1. Generate a new high-entropy secret in the deployment secret manager.
2. Add the new secret first in the configured rotation list.
3. Keep the previous secret second only for the planned overlap window.
4. Restart or reload the ScheduleOS API service using the new configuration.
5. Update the sending provider or bridge to sign with the new secret.
6. Send a signed test event with a fictional `externalId`, such as `task_demo_webhook_rotation_1`.
7. Confirm the event is accepted and idempotent re-delivery is rejected as replay when the same signed event id is reused.
8. Remove the previous secret from ScheduleOS configuration after provider cutover.
9. Record the rotation time, `sourceSystem`, operator, reviewer, and verification result outside any workspace that cleanup could delete.

## Emergency Revocation

If a webhook secret may be exposed:

1. Remove the exposed secret from ScheduleOS configuration.
2. Disable or pause the sending provider if it cannot immediately switch secrets.
3. Deploy/restart ScheduleOS so the exposed secret is no longer accepted.
4. Generate and configure a new secret.
5. Rotate the sending provider to the new secret.
6. Review audit events for unexpected imports, invalid signatures, replay attempts, unusual source systems, and import-throttle denials.
7. Reconcile affected tasks by `sourceSystem`, `externalId`, `sourceReference`, and `sourceUrl`.
8. Record incident notes outside ScheduleOS if workspace cleanup or deletion could remove operational evidence.

## Alert Expectations

Production operations should alert on:

- Repeated `INVALID_WEBHOOK_SIGNATURE` errors for one `sourceSystem`.
- Repeated missing signature, timestamp, or event-id headers when a source requires signing.
- Replayed event ids.
- Stale timestamps beyond the configured replay window.
- Unexpected `sourceSystem` values.
- Sudden import-throttle denials or denied-row spikes.
- Provider cutover failures during a planned rotation window.

Current local/self-host foundations expose minimized audit evidence for imports, throttling, and replay controls. Production release still needs hosted alert routing, dashboards, escalation policy, and provider-specific thresholds.

## Provider-Specific Adapter Boundary

Provider adapters must use the same public webhook contract as any other integration. Do not add hidden private leadership-only webhook behavior. Do not embed provider OAuth tokens in webhook payloads. Do not invent deadlines or durations that the provider did not send.

Provider-specific runbooks should document:

- Provider signing algorithm and header mapping.
- Replay-window requirements from provider documentation.
- Payload field mapping into ScheduleOS.
- Retry behavior.
- Provider disable/revoke steps.
- Expected alert thresholds.
- Known lossy mappings.

## Verification Checklist

Before considering a provider webhook production-ready:

- Invalid signatures are rejected.
- Current and previous rotation secrets are accepted only during overlap.
- Unknown secrets are rejected.
- Missing signed replay headers are rejected.
- Stale timestamps are rejected.
- Reused event ids are rejected.
- Blank configured secrets and empty rotation lists fail startup.
- Payload text remains inert task data.
- Missing duration keeps work unscheduled until a real estimate is supplied.
- Alert and incident-review steps are tested in the target hosted environment.
