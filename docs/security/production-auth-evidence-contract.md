# Production Auth Evidence Contract

Production auth approval is tracked in `docs/security/production-auth-approval-checklist.md`. This document defines the local production auth evidence contract for release review.

This document does not configure an identity provider, create users, issue sessions, run migrations, change cookie policy, create a remote repository, publish packages, or change release status.

## Status

Current result: `FAIL`.

ScheduleOS now has a local production auth evidence validator in `src/production-auth-evidence-contract.ts` with tests in `src/production-auth-evidence-contract.test.ts`. It proves the review shape only.

## Contract Purpose

Production auth evidence must prove that the release-candidate auth model is safe across identity, durable sessions, role and membership enforcement, reset-token lifecycle, cookie/CSRF transport, lockout/backoff, migrations, rollback, browser verification, final audits, and second-operator approval.

## Required Evidence Areas

- Production identity provider or explicitly approved credential strategy.
- Recovery delivery and operator/helpdesk policy.
- Durable session store with token hashes only.
- Session expiration, revocation, disabled-user denial, inactive-membership denial, and last-seen/audit behavior.
- Authorization matrix for owner, admin, editor, viewer, disabled user, inactive membership, cross-tenant, cross-workspace, and cross-user cases.
- Tenant, workspace, user, private-calendar, owner-only elevation, demotion, and owner-transfer boundaries.
- Password reset token hashing, TTL, one-time use, same-scope consumption, generic request response, session revocation, and abuse throttling.
- Cookie transport with `HttpOnly`, `SameSite`, production `Secure`, CSRF on cookie-authenticated writes, no browser token storage, and TLS/proxy/header review.
- Durable credential backoff, reset request throttling, retention cleanup, and operator visibility.
- Startup guards, migration plan, rollback drill, remote CI proof, browser flows, security/privacy/licensing audit pass, and second-operator approval.

## Fictional Evidence Values

Use fictional values such as:

```text
production_demo
tenant_demo
workspace_demo
user_jordan
identity_provider_review_demo
postgres_auth_session_store_demo
authorization_matrix_review_demo
cookie_csrf_transport_review_demo
second_operator_auth_review_demo
```

## Verification

Focused verification:

```bash
npm run build
node --test dist/production-auth-evidence-contract.test.js
```

Full verification:

```bash
npm run check
npm audit --omit=dev --audit-level=high
find . -maxdepth 2 -name .git -type d -print
```

## Release Boundary

This contract is a local foundation. ScheduleOS release status remains `FAIL` until production persisted auth, roles, memberships, session model, identity provider/recovery, browser UX, remote CI, final audits, and second-operator approval are complete.
