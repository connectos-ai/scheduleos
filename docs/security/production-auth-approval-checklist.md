# Production Auth Approval Checklist

## Status

Current result: `FAIL`.

ScheduleOS has local/self-host auth foundations, durable storage implementations, and review-only auth readiness packets. Production persisted auth, roles, memberships, and session model are not approved for public release until the evidence below is attached, reviewed, and accepted.

No public repository, hosted deployment, tag, package publication, or release announcement may rely on production auth until this checklist changes to `PASS`.

## Verified Local Foundations

Current local evidence covers:

- Scoped auth users, workspace memberships, roles, sessions, and password reset token records.
- JSON, SQLite, and PostgreSQL auth repository foundations.
- Stored session token hashes and reset token hashes instead of raw token storage.
- Local credential login using versioned `scrypt` hashes.
- Durable scoped credential-attempt backoff.
- Session revocation, expired-session denial, disabled-user denial, inactive-membership denial, and generic credential failure responses.
- Current-user password rotation and scoped session revocation.
- Password reset token one-time use, expired-token denial, generic request response, and same-tenant/workspace/user scoped token consumption denial for wrong user or wrong workspace local API paths.
- Local owner/admin user, membership, and credential reset controls.
- Optional hardened cookie transport with `HttpOnly`, `SameSite`, configurable `Secure`, and CSRF headers for cookie-authenticated writes.
- Startup guards for unsafe production reset-token return, default API key, default static API-key scope, public bind without auth, public bind without durable storage, public bind without persisted throttles, and insecure production session-cookie configuration.
- `auth:authorization-matrix-packet` review-only evidence rows for owner, admin, editor, viewer, disabled user, inactive membership, cross-scope, private-calendar, revoked-session, and expired-session behavior.
- `auth:production-readiness-packet` review-only evidence labels for production auth review.
- Production auth evidence contract validator exists at `src/production-auth-evidence-contract.ts` with tests for identity/recovery review, durable hashed session storage, authorization matrix scope boundaries, reset-token lifecycle, cookie/CSRF transport, lockout/retention review, startup guards, migration/rollback, remote CI, browser flows, final audits, and second-operator review.

These foundations do not approve production auth.

## Required Evidence Before PASS

Attach current evidence for every item:

- Identity provider or local credential strategy approved for the release target.
- Durable production session store selected, migrated, backed up, monitored, and rollback-tested.
- Authorization matrix reviewed across owner, admin, editor, viewer, disabled user, inactive membership, cross-tenant, cross-workspace, cross-user, private-calendar, revoked-session, and expired-session scenarios.
- Role and membership lifecycle reviewed for creation, update, disablement, elevation, demotion, owner transfer, and admin recovery.
- Session lifecycle reviewed for issuance, token hashing, expiration, last-seen updates, revocation, logout, disabled-user denial, membership-denial, and audit events.
- Password reset lifecycle reviewed for request genericity, token hashing, TTL, one-time use, session revocation, recovery delivery, operator/helpdesk policy, abuse handling, and public UX.
- Lockout, backoff, pruning, retention cleanup, and operator visibility reviewed for production deployment shape.
- Cookie and CSRF transport reviewed behind the intended TLS/proxy/header configuration.
- Production startup guards verified in the intended deployment environment.
- Migration plan reviewed for zero-downtime or maintenance-window behavior.
- Rollback drill reviewed for auth tables, sessions, memberships, and credential/reset-token records.
- Remote CI proof exists for auth tests, PostgreSQL repository behavior, migration behavior, and authorization matrix coverage.
- Browser verification exists for login, logout, password reset, owner/admin user management, membership management, credential reset, accessibility, and responsive behavior.
- Security, privacy, and licensing audits are still `PASS` after auth evidence is attached.
- Second operator approves the final production auth evidence packet.

## Required Commands

Run these before changing this checklist to `PASS`:

```bash
npm run check
npm audit --omit=dev --audit-level=high
find . -maxdepth 2 -name .git -type d -print
```

The no-`.git` check must return no output until the intentional clean public repository history is prepared.

## Review-Only Packets

Use these commands to prepare evidence labels only:

```bash
npm run auth:authorization-matrix-packet -- --matrix owner-admin-editor-viewer-cross-scope-demo --environment production-demo --backend postgres --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --json

npm run auth:production-readiness-packet -- --environment production-demo --backend postgres --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --identity-provider identity-provider-review-demo --session-store postgres-auth-session-store-demo --authorization-matrix authorization-matrix-review-demo --role-membership-proof role-membership-review-demo --session-lifecycle session-lifecycle-review-demo --reset-token-lifecycle reset-token-lifecycle-review-demo --lockout-pruning lockout-pruning-review-demo --cookie-transport cookie-csrf-transport-review-demo --startup-guard production-startup-guard-review-demo --migration-plan auth-migration-plan-review-demo --rollback-drill auth-rollback-drill-review-demo --remote-ci remote-ci-auth-review-demo --rollback-plan auth-rollback-plan-review-demo --second-operator second-operator-auth-review-demo --json
```

These packets do not approve production auth, create sessions, mutate users, run migrations, configure identity providers, change cookie policy, mark audits `PASS`, create remotes, publish packages, or announce ScheduleOS.

## Current Remaining Risk

High. Local and self-host auth foundations are meaningful, but production auth approval remains unproven until final deployment-specific identity, storage, cookie/CSRF, reset, lockout, migration, rollback, browser, remote CI, audit, and second-operator evidence are reviewed together.

## Release Rule

Do not mark "Production persisted auth, roles, memberships, and session model approved for public release" complete until this checklist changes from `FAIL` to `PASS` with current release-candidate evidence.
