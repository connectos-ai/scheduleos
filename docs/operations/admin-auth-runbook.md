# Admin Auth Runbook

Production auth approval is tracked in `docs/security/production-auth-approval-checklist.md`. This runbook describes local/self-host foundations only.


## Status

Local/self-host foundation. Production admin operations remain a release blocker until browser verification, operator approval workflow, identity-provider integration, hosted cleanup, audit review, and recovery procedures are complete.

## Local Owner/Admin Flow

ScheduleOS supports a local owner/admin management foundation through the API and the standalone app at `/app`.

Current local controls:

- Authenticated `OWNER` or `ADMIN` principals can create or update auth users in their tenant.
- Authenticated `OWNER` or `ADMIN` principals can create or update workspace memberships in their workspace.
- Only an `OWNER` principal can grant `OWNER` or `ADMIN` roles.
- Only an `OWNER` principal can reset credentials for `OWNER` or `ADMIN` targets.
- User responses omit credential hashes.
- Credential reset writes a fresh `scrypt` hash, revokes target sessions, and appends an audit event without plaintext password metadata.
- The standalone app keeps browser auth state in memory and sends CSRF headers when cookie sessions are enabled.

## Local App Tasks

1. Log in as an owner or admin.
2. Open `Owner/Admin`.
3. Save the target user with tenant, user ID, display name, email-shaped placeholder, and status.
4. Save the target membership with tenant, workspace, user ID, role, and status.
5. Use credential reset only when the operator has verified the target identity out of band.
6. Review audit events after admin changes.

Use fictional demo IDs in examples, such as `tenant_demo`, `workspace_demo`, `user_jordan`, and `user_taylor`. Avoid real personal data in fixtures, screenshots, logs, and public documentation.

## Production Gaps

Before public production deployment, ScheduleOS still needs:

- Browser-verified admin flows with accessibility and responsive checks.
- Operator approval workflow for elevated role grants and credential resets.
- Identity-provider integration guidance and recovery delegation.
- Helpdesk/recovery runbook with identity verification steps.
- Hosted session cleanup and audit review workflow.
- Remote CI authorization proof for persisted production storage.
- Final security review of admin workflow, logs, and audit metadata.
