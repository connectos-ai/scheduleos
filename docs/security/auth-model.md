# Auth Model

Production auth approval is tracked in `docs/security/production-auth-approval-checklist.md`. That checklist remains `FAIL` until final release-candidate identity, session-store, authorization, cookie/CSRF, reset-token, lockout, migration, rollback, browser, remote CI, audit, and second-operator evidence are attached.


## Status

Local repository, SQLite persistence, PostgreSQL repository, local API session lifecycle, optional hardened session-cookie transport foundation, local credential login, local standalone app credential login/logout foundation, local standalone app password reset request/confirm foundation, local standalone app owner/admin management foundation, durable scoped credential-login backoff, current-user password rotation, durable local password-reset token foundation, owner/admin credential reset foundation, local owner/admin user-membership management, local password-reset token same-scope consumption denial for wrong user or wrong workspace, and local retention cleanup for expired/revoked session hashes, expired/used password reset token hashes, and stale credential-attempt windows are implemented.

Production authentication UX, identity provider integration, production reset-token delivery/recovery policy, production distributed lockout/backoff policy, and live production authorization coverage remain release blockers.

The production auth readiness packet requires `--authorization-matrix`, `--migration-plan`, and `--rollback-drill` evidence labels so production release review must attach explicit owner, admin, editor, viewer, disabled-user, inactive-membership, cross-tenant, cross-workspace, cross-user, revoked-session, expired-session, auth migration, and auth rollback proof before the production auth blocker can be considered for closure. `auth:authorization-matrix-packet` generates the review-only row list for that evidence label without approving production auth or mutating auth state.

## Current Records

ScheduleOS defines durable auth records:

- `AuthUser`: tenant-scoped user identity with email, display name, status, optional credential hash.
- `WorkspaceMembership`: tenant/workspace/user role membership status. Durable roles are `OWNER`, `ADMIN`, `EDITOR`, `MEMBER`, and `VIEWER`; `MEMBER` remains a compatibility role and maps to editor-level write access for session authorization.
- `AuthSession`: tenant/workspace/user session record with session token hash, expiration, last-seen timestamp, optional revocation timestamp.
- `AuthPasswordResetToken`: tenant/workspace/user one-time reset token record with token hash, expiration, and optional use timestamp.

Credential and session fields must store hashes or references only. Do not store plaintext passwords, raw bearer tokens, OAuth tokens, raw password reset tokens, or session secrets.

## Repository Foundation

`repositories.auth` supports:

- Upsert/read auth users.
- Upsert/read/list workspace memberships.
- Upsert/read/list/revoke auth sessions.
- Upsert/read/list/mark-used password reset tokens.
- Read/upsert/clear scoped login-attempt windows.
- System-actor seeding setup migrations.
- User-actor tenant/workspace/user scope checks.

Local JSON-backed storage persists auth users, memberships, sessions, and password reset tokens. SQLite and PostgreSQL repositories persist users, memberships, sessions, and password reset tokens for self-hosted deployments. Reset token records store hashes only and are consumed through the same scoped auth repository path used by the API.

## Local API Session Foundation

`POST /api/auth/login` verifies an active auth user's versioned `scrypt` credential hash and issues the same persisted session shape. It applies durable scoped credential-attempt backoff with `AUTH_ATTEMPT_LIMITED` after repeated failed credential attempts for the same tenant/workspace/user key. A successful login clears the persisted scoped failure window.

The standalone app served at `/app` now includes a local credential login/logout surface wired to `POST /api/auth/login` and `DELETE /api/auth/session`. Browser session state is kept in memory only. When hardened session cookies are enabled, the app relies on the `HttpOnly` cookie and sends the returned CSRF token on unsafe requests; it does not persist bearer or session tokens in `localStorage` or `sessionStorage`.

`POST /api/auth/sessions` lets an already-authenticated scoped API-key principal issue a persisted session for the same active auth user and active workspace membership. `DELETE /api/auth/sessions/{sessionId}` revokes a session for the same scoped principal. `DELETE /api/auth/session` revokes the current bearer or cookie session and clears the configured session cookie when cookie transport is enabled.

Current controls:

- Raw session tokens are returned only at creation time.
- Stored session records contain `sessionTokenHash`, not raw tokens.
- Local credential login supports `scrypt$N$r$p$keyLength$salt$hash`.
- Session use re-checks active user and active workspace membership.
- Sessions for disabled users or suspended workspace memberships are denied directly at protected API routes with generic `UNAUTHENTICATED` responses.
- Revoked and expired bearer sessions are denied directly at protected API routes with generic `UNAUTHENTICATED` responses.
- Credential login returns the same generic `INVALID_CREDENTIALS` response for disabled users, suspended memberships, missing users, and wrong passwords, and does not create sessions for those denied principals.
- Failed credential attempts are locally backoff-limited by tenant/workspace/user without disclosing whether the user exists.
- Password rotation and reset store only fresh versioned `scrypt` credential hashes and never return `credentialHash`.
- Session create, session revoke, credential rotation, password reset request, password reset completion, and credential reset events append scoped audit records.
- Local JSON-backed, SQLite, and PostgreSQL retention cleanup include expired/revoked session hash and expired/used password reset token hash retention.

## Local Password Reset Token Foundation

`POST /api/auth/password-reset-requests` accepts `tenantId`, `workspaceId`, and `userId`. It always returns `202` with generic status wording so callers cannot confirm whether an account exists. When the scoped active user and active workspace membership exist, ScheduleOS creates a one-time reset token record with:

- Random high-entropy raw token returned only when `auth.passwordReset.returnTokenForLocalDevelopment` is explicitly enabled.
- Stored `tokenHash`, not the raw reset token.
- Persisted through JSON-backed, SQLite, or PostgreSQL auth repositories.
- Default 30-minute expiration, configurable with `auth.passwordReset.ttlMs` and capped at 24 hours.
- `AUTH_PASSWORD_RESET_REQUESTED` audit event without token material.

`POST /api/auth/password-reset` accepts `tenantId`, `workspaceId`, `userId`, `resetToken`, and `newPassword`. It verifies an unused, unexpired token hash in the same scope, writes a fresh `scrypt` credential hash, marks the token used, revokes active sessions in scope, and appends `AUTH_PASSWORD_RESET_COMPLETED`.

Current controls:

- Reset confirmation returns `INVALID_RESET_TOKEN` for expired, reused, wrong-scope, or missing tokens.
- Reset request remains generic for missing users.
- Raw reset token return is opt-in for local development/self-host bootstrap only.
- Invalid reset-token TTL configuration is rejected at startup.

The standalone app served at `/app` includes local password reset request and confirmation controls wired to the reset-token endpoints. Request wording stays generic. A raw reset token is displayed only when the API explicitly returns one for local development/self-host bootstrap mode.

This local reset-token and app-UX foundation does not yet provide production email/SMS delivery, identity-provider recovery, abuse analytics, helpdesk workflow, or production recovery UX.

## Local Owner/Admin Management Foundation

The local standalone app exposes owner/admin controls for saving users, assigning workspace memberships, and resetting credentials. The local operator workflow is documented in [Admin Auth Runbook](../operations/admin-auth-runbook.md).

Auth-user management endpoint creates and updates tenant-scoped auth users. Auth-user read endpoint returns redacted user records. Workspace-membership management endpoint creates and updates memberships. Membership list endpoint returns a user's memberships.

Current controls:

- Management APIs require authenticated `OWNER` or `ADMIN` principals.
- `EDITOR` and `VIEWER` principals receive `FORBIDDEN` for auth-user creation and workspace-membership creation.
- Membership management is limited to the authenticated principal's tenant/workspace.
- Auth-user and workspace-membership management return `FORBIDDEN` when an owner/admin principal targets a different tenant or workspace.
- Auth-user reads and membership lists also require `OWNER` or `ADMIN`, and return `FORBIDDEN` for lower-role or cross-tenant reads.
- Only `OWNER` principals can grant `OWNER` or `ADMIN` membership roles; `ADMIN` principals can create ordinary `EDITOR` or compatibility `MEMBER` memberships but receive `FORBIDDEN` when attempting to grant `OWNER` or `ADMIN`.
- Only `OWNER` principals can reset another `OWNER` or `ADMIN` credential.
- User responses omit `credentialHash`.
- Writes append scoped audit events.

This foundation does not replace the static API-key bootstrap path or provide complete production account recovery. Credential-attempt backoff is durable for JSON-backed, SQLite, and PostgreSQL self-hosted storage, but is not a complete horizontally coordinated production lockout/backoff policy with operator visibility. Local password reset tokens prepare a production recovery layer while keeping deployment operators responsible for trusted delivery, recovery policy, and identity-provider integration.

2026-07-22 production cookie guard: standalone startup rejects `NODE_ENV=production` when cookie auth is enabled without `SCHEDULEOS_AUTH_SESSION_COOKIE_SECURE=true`. This narrows the proxy/TLS cookie transport risk to a local/self-host foundation, but production login/logout UX, credential lifecycle, identity-provider integration, admin workflow UX/runbooks, hosted cleanup, and remote CI authorization proof remain release blockers.

2026-07-22 production static API-key guard: standalone startup rejects `NODE_ENV=production` when `SCHEDULEOS_API_KEY=dev_scheduleos_change_me`. This narrows accidental example-secret deployment risk for local/static bootstrap path, but static API keys are still not a complete production identity, rotation, revocation, or audit workflow.

2026-07-22 production static API-key scope guard: standalone startup rejects `NODE_ENV=production` static API-key auth when tenant, workspace, or user scope IDs are omitted or left as `.env.example` demo values. This narrows accidental demo-scope production auth risk, but static API keys are still not complete production identity, membership, rotation, revocation, or audit workflow.
2026-07-22 production public-bind auth guard: standalone startup rejects `NODE_ENV=production` with public bind hosts such as `0.0.0.0` unless `SCHEDULEOS_API_KEY` or `SCHEDULEOS_AUTH_SESSION_COOKIE=true` is configured. This narrows unauthenticated self-host exposure risk, but production identity-provider integration, hosted policy enforcement, and live authorization proof remain release blockers.

2026-07-22 production public-bind throttling guard: standalone startup rejects `NODE_ENV=production` with public bind hosts such as `0.0.0.0` or `::` unless request throttling is configured. This narrows unauthenticated and authenticated public self-host abuse exposure, but does not replace distributed production rate limiting, provider quota enforcement, hosted alerting, or abuse analytics.

2026-07-22 production public-bind durable-storage guard: standalone startup rejects `NODE_ENV=production` with public bind hosts such as `0.0.0.0` or `::` unless `SCHEDULEOS_STORAGE_PATH` is configured. This narrows accidental in-memory public self-host deployments, but production persisted auth, hosted backup/retention operations, live database proof, and remote CI remain release blockers.

2026-07-22 production public-bind persisted-throttling guard: standalone startup rejects `NODE_ENV=production` with public bind hosts such as `0.0.0.0` or `::` unless `SCHEDULEOS_RATE_LIMIT_PERSISTED=true` is configured. This narrows restart-bypass risk for public self-host request throttles, but it does not replace distributed production rate limiting, provider quota enforcement, hosted alerting, or abuse analytics.
2026-07-22 production password-reset guard: standalone startup rejects `NODE_ENV=production` when `SCHEDULEOS_AUTH_PASSWORD_RESET_RETURN_TOKEN=true`, keeping raw reset-token return as a private local-development/self-host bootstrap helper only.

## Production Gaps

Before public production deployment, ScheduleOS still needs:

- Production reset delivery integration, abuse controls, operator/helpdesk tooling, and identity-provider recovery beyond the local reset-token and runbook foundations.
- Production distributed lockout/backoff policy and operator visibility.
- Production login/logout user experience browser verification, accessibility pass, and deployment packaging beyond the local standalone app foundation.
- Live PostgreSQL authorization coverage in remote CI/public deployment.
- Identity-provider integration guidance.
- Production-grade admin membership workflow UX and operational runbook.
- Production scheduled session cleanup hosted operator review workflow.
