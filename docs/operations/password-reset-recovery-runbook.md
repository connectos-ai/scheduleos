# Password Reset And Recovery Runbook

## Status

Local/self-host foundation. Production reset delivery, identity-provider recovery, distributed abuse controls, helpdesk workflow tooling, browser verification, and final security review remain release blockers.

## Current Local Foundation

ScheduleOS has a local password reset token foundation:

- `POST /api/auth/password-reset-requests` always returns generic `202` status wording.
- Eligible scoped users receive a one-time reset token record.
- Stored reset records contain `tokenHash`, never the raw token.
- Raw tokens are returned only when `auth.passwordReset.returnTokenForLocalDevelopment` is explicitly enabled.
- Default reset-token expiration is 30 minutes and is capped at 24 hours.
- `POST /api/auth/password-reset` marks the token used, stores a fresh `scrypt` credential hash, revokes active sessions in scope, and appends `AUTH_PASSWORD_RESET_COMPLETED`.
- Retention cleanup prunes expired or used reset token hashes.

This local foundation is intended for development and self-host bootstrap operations. It is not a production email, SMS, identity-provider, or helpdesk recovery system.

## Local Self-Host Procedure

Use this only when operating a trusted local/self-host deployment.

1. Confirm the requester using an out-of-band method appropriate for the deployment.
2. Call `POST /api/auth/password-reset-requests` with fictional or local-only IDs in examples, such as `tenant_demo`, `workspace_demo`, and `user_jordan`.
3. Use `auth.passwordReset.returnTokenForLocalDevelopment` only in a private local environment.
4. Deliver the raw token out of band; never store it in tickets, chat history, logs, screenshots, or public docs.
5. Call `POST /api/auth/password-reset` with the reset token and new password.
6. Confirm old sessions are revoked.
7. Review scoped audit events for `AUTH_PASSWORD_RESET_REQUESTED` and `AUTH_PASSWORD_RESET_COMPLETED`.

## Production Delivery Requirements

Before public production deployment, reset delivery must be implemented by a trusted delivery layer outside the current local token-return flow.

Production delivery must:

- Keep `auth.passwordReset.returnTokenForLocalDevelopment` disabled.
- Deliver reset links or codes through a verified provider or identity provider.
- Avoid returning raw reset tokens through public API responses.
- Avoid writing reset tokens to logs, analytics, alerts, support tickets, screenshots, or webhook payloads.
- Use short-lived, single-use tokens.
- Preserve generic request responses so attackers cannot enumerate accounts.
- Rate-limit reset requests by tenant, workspace, user, client identity, and delivery destination where available.
- Emit content-minimized audit events.
- Provide operator visibility for repeated attempts, suspicious sources, bounced deliveries, and recovery failures.

## Helpdesk Recovery Requirements

If ScheduleOS supports operator-assisted recovery, the helpdesk process must require:

- Identity verification before any credential reset.
- Dual control or elevated-action approval for owner/admin recovery.
- No password collection from the user.
- Fresh credential setting through reset or privileged credential-reset flow only.
- Session revocation after successful recovery.
- Audit review of who approved, who performed, who was targeted, and what scope was affected.
- A path to escalate suspected account takeover.

## Identity Provider Boundary

If a deployment uses an identity provider, the identity provider should own primary recovery whenever possible. ScheduleOS should treat local credentials as disabled or secondary for that deployment, document the boundary, and avoid parallel recovery flows that conflict with identity-provider policy.

## Abuse Controls

Production recovery still needs:

- Distributed attempt tracking shared across API instances.
- Trusted proxy/client identity handling.
- Tenant/workspace/user scoped backoff.
- Destination-based throttles where delivery addresses are available.
- Alerts for repeated reset requests, repeated failures, and operator-assisted recovery.
- Retention cleanup for expired/used token hashes and stale attempt windows.

## Verification Checklist

Before public production release, verify:

- Reset request responses remain generic.
- Raw tokens are not returned in production configuration.
- Reset token hashes are stored, not raw tokens.
- Reset completion revokes active sessions.
- Owner/admin recovery follows elevated approval policy.
- Delivery provider logs and analytics do not contain token material.
- Abuse controls work across more than one API instance.
- Browser reset flow passes accessibility and responsive checks.
- Audit events are scoped and content-minimized.

## Production Gaps

This runbook documents the required policy boundary but does not complete production recovery. Remaining blockers:

- Production reset-token delivery integration.
- Identity-provider recovery integration.
- Distributed abuse controls and operator visibility.
- Helpdesk workflow tooling and approval UX.
- Browser-verified reset/recovery experience.
- Final security review of recovery paths, logs, alerts, and audit metadata.
