# Threat Model

Production rate-limit and abuse-monitoring approval is tracked in `docs/security/production-rate-limit-approval-checklist.md`. That checklist remains `FAIL` until final release-candidate edge/gateway, distributed throttle store, provider quota, trusted proxy, hosted alerting, dashboard, abuse analytics, rollback, remote CI, audit, and second-operator evidence are attached.


## Status

Draft threat model. No implementation has been audited yet.

## Assets

ScheduleOS protects:

- Calendar availability.
- Calendar event titles and descriptions.
- Task titles and descriptions.
- Deadlines and priorities.
- User identity.
- Workspace membership.
- Provider connection references.
- OAuth tokens or token references.
- Schedule plans and time blocks.
- Audit logs.
- AI prompts and model outputs.
- Webhook secrets.
- Public-event delivery target URLs and signing secrets.

## Trust Boundaries

```text
Browser / API client
  -> API boundary
  -> application use cases
  -> storage
  -> solver adapter
  -> provider adapters
  -> external providers
```

External/untrusted inputs:

- API requests.
- Webhooks.
- Imported CSV/JSON/ICS.
- Calendar titles/descriptions.
- Email or Slack-derived tasks.
- OwnerOps payloads.
- ConnectOS capability responses.
- AI model outputs.
- Environment variables.

## Threats

### Cross-Tenant Access

Current storage-boundary verification evidence is documented in [Tenant Isolation Verification](tenant-isolation-verification.md). Production persisted auth, roles, memberships, and sessions remain release blockers.

Risk: user reads or changes another tenant's schedule, tasks, calendar events, or provider connections.

Controls:

- Server-side membership checks.
- Tenant-scoped queries.
- Authorization tests.
- Never trust tenant/workspace IDs from clients.

Current foundation: local API can be configured with static API keys mapped to one tenant/workspace/user scope and an optional `OWNER`, `ADMIN`, `EDITOR`, or `VIEWER` role. Requests outside that scope return `403`, missing or invalid bearer tokens return `401`, and `VIEWER` keys cannot use write methods. A scoped static API-key principal can issue and revoke a persisted bearer session for the same active auth user and active workspace membership. Session records store token hashes only, session use re-checks active user and membership status, and revoked or expired sessions are rejected. The standalone app has a local credential login/logout surface that keeps browser auth state in memory, supports cookie-session CSRF headers when enabled, and does not use localStorage/sessionStorage auth-token storage. Local owner/admin management APIs and app controls can create redacted auth users and workspace memberships; only owners can grant owner or admin roles. The local operator workflow is documented in [Admin Auth Runbook](../operations/admin-auth-runbook.md). Local retention cleanup prunes expired or revoked session hashes, expired or used password reset token hashes, and stale credential-attempt windows after retention. Production login UX browser verification/accessibility/deployment packaging, admin workflow UX/runbooks, hosted cleanup, remote CI authorization proof, and identity-provider integration remain required before public deployment.

2026-07-22 update: optional browser cookie transport now sets an `HttpOnly`, `SameSite=Lax`, `Path=/` session cookie, supports configurable `Secure`, and requires the returned CSRF token on cookie-authenticated unsafe methods. This narrows the cookie/CSRF gap to a local foundation, but production login/logout UX, credential lifecycle, identity-provider integration, admin workflow UX/runbooks, hosted cleanup, and remote CI authorization proof remain release blockers.

Current-session logout also clears the configured browser session cookie when cookie transport is enabled.

Local credential login now verifies versioned `scrypt` credential hashes for active users and returns generic invalid-credential responses for wrong passwords or missing users.

2026-07-22 update: current-user password rotation now requires bearer-session or cookie-session authentication, verifies current password, stores only a fresh versioned `scrypt` credential hash with a new random salt, revokes active sessions in scope, and appends an `AUTH_CREDENTIAL_ROTATED` audit event without plaintext password metadata. Password reset token records now persist hash-only records through JSON-backed, SQLite, and PostgreSQL auth repositories. The local/self-host password reset recovery procedure and production boundary are documented in [Password Reset And Recovery Runbook](../operations/password-reset-recovery-runbook.md). Production reset-token delivery integration, recovery UX, distributed abuse controls, identity-provider recovery integration, and production login UX remain release blockers.

2026-07-22 update: durable scoped credential-login backoff now returns `AUTH_ATTEMPT_LIMITED` after repeated failed attempts for the same tenant/workspace/user key and clears the persisted window after a successful login. JSON-backed, SQLite, and PostgreSQL storage persist the backoff window across restarts; this is still not a complete horizontally coordinated production lockout/backoff policy with operator visibility.

2026-07-22 update: local owner/admin credential reset now lets authenticated owners/admins reset member/viewer credentials in the same workspace, requires owner authority for owner/admin targets, stores only fresh versioned `scrypt` hashes, revokes target sessions, and appends `AUTH_CREDENTIAL_RESET` without plaintext password metadata. This is an administrative recovery foundation, not a complete self-service reset/recovery policy.

### Calendar Privacy Leakage

Risk: private event titles, attendees, locations, or descriptions leak to other users, logs, webhooks, exports, or AI providers.

Controls:

- Busy/free minimization.
- Private event redaction.
- Log redaction.
- AI data minimization.
- Team capacity aggregation.

### Token Exposure

Risk: OAuth tokens or credentials appear in logs, exports, database dumps, fixtures, or client responses.

Controls:

- Token encryption or delegated token vault.
- Token references rather than raw tokens.
- Secret redaction.
- No tokens in logs.
- Provider revocation.

### Prompt Injection

Risk: imported task, email, Slack, calendar, or document text instructs the AI to ignore rules, reveal secrets, or execute actions.

Controls:

- Treat imported text as untrusted content.
- Treat provider-specific CSV template rows as untrusted content even when the template id is known.
- Use allowlisted provider CSV template mappings only; reject unknown template ids instead of guessing mappings.
- Delimit source content.
- Schema-validate AI output.
- Allowlist actions.
- Deterministic scheduling validation after AI output.
- No model access to credentials.

### Webhook Forgery And Replay

Risk: attacker submits fake or replayed tasks/events.

Controls:

- Timestamp-bound signature verification where configured.
- Signed timestamp freshness window.
- Signed event-id idempotency keys.
- Source allowlists.
- Audit events.

Current foundation: generic webhook task imports support HMAC SHA-256 signatures, current/previous secret rotation lists, startup rejection for blank secrets and empty rotation lists, timestamp-bound raw-body signing, global and source-specific replay windows, reused event-id rejection through scoped idempotency records, and minimized import audit events. Provider replay policy, secret rotation posture, and provider mapping rules are documented in [Webhook Provider Policy](../integrations/webhook-provider-policy.md). Production provider lifecycle management, operator alerts, and provider-specific adapter runbooks remain required before public deployment.

Local/self-host operator rotation and emergency revocation steps are documented in [Webhook Secret Lifecycle Runbook](../operations/webhook-secret-lifecycle-runbook.md). Production managed-secret storage requirements are documented in [Managed Secret Storage Runbook](../operations/managed-secret-storage-runbook.md). The local/self-host managed-secret resolver boundary records sanitized `MANAGED_SECRET_RESOLUTION_CHECKED` audit rows with purpose, secret-ref hash, and outcome for resolved and rejected public-event delivery refs without raw target URLs, signing secrets, or raw secret refs. Production provider lifecycle enforcement, managed secret storage implementation, hosted operator alerts, and provider-specific adapter runbooks remain required before public deployment.

### Resource Exhaustion

Risk: attacker sends oversized API, webhook, or import payloads to consume memory or CPU.

Controls:

- Configurable API request-body size cap.
- Structured `413 REQUEST_BODY_TOO_LARGE` response.
- Configurable process-local API rate limit with opt-in persisted authenticated request throttle windows.
- Explicit opt-in trusted proxy client IP header for local/self-host rate-limit keys.
- Configurable persisted scoped import-row throttle for webhook, JSON, CSV, and ICS imports with per-source overrides.
- Opt-in built-in provider import policy catalog enforcement for local/self-host import throttles.
- Provider-template CSV imports share CSV request-size, row-validation, row-throttle, and content-inertness controls.
- Scoped import throttle denial audit events with content-minimized metadata.
- Scoped local import-abuse summary through `GET /api/import-abuse/summary`, with source, time-window, allowed-import, denied-import, denied-row, and retry-timing summaries.
- Local/self-host import-abuse summary alert thresholds can report `REVIEW_REQUIRED` when configured denied-event or denied-row thresholds are met.
- Local/self-host public-event delivery summary alert thresholds can report `REVIEW_REQUIRED` when configured failed-attempt or retryable-failed-attempt thresholds are met.
- Local/self-host public-event dead-letter queue alert thresholds can report `REVIEW_REQUIRED` when configured unreviewed item thresholds are met.
- Scoped local audit-event reads through `GET /api/audit-events`, with optional `action`, `resourceType`, and metadata `sourceSystem` filters.
- Structured `429 RATE_LIMITED` response.
- Provider-specific policies before production deployment.

Current foundation: local API supports `rateLimit.windowMs` and `rateLimit.maxRequests`, with local/self-host standalone server env wiring through `SCHEDULEOS_RATE_LIMIT_WINDOW_MS` and `SCHEDULEOS_RATE_LIMIT_MAX_REQUESTS`. Invalid rate-limit values are rejected at startup. Request buckets are in-memory per process by default and keyed by bearer token when present, otherwise by client IP. `SCHEDULEOS_RATE_LIMIT_TRUSTED_PROXY_HEADER` can opt local/self-host deployments into using `x-forwarded-for` or `x-real-ip` for unauthenticated client IP keys only behind a trusted proxy that strips spoofed forwarding headers. `SCHEDULEOS_RATE_LIMIT_PERSISTED=true` enables authenticated request throttle windows stored by tenant/workspace/user with SHA-256 key hashes rather than raw bearer tokens, cookie values, or client IPs; unauthenticated requests still use process-local buckets. Local API also supports `importThrottle.windowMs`, `importThrottle.maxRows`, and optional `importThrottle.sourcePolicies` overrides, persisted by tenant/workspace/user/source/operation when storage is configured. Invalid global or source-specific import throttle policies are rejected when the API server starts. `importThrottle.enforceProviderPolicies` can apply built-in catalog policies before falling back to the global policy for unknown sources. Denied import rows append scoped `IMPORT_THROTTLE_DENIED` audit events with source, operation, attempted row count, limit, window, and retry timing, without copied row payload content. Scoped audit events can be read through local `GET /api/audit-events` with tenant/workspace/user authorization checks and optional `action`, `resourceType`, and metadata `sourceSystem` filters. `importAbuseAlerts.deniedEvents` and `importAbuseAlerts.deniedRows`, also available through standalone env vars, add summary-only `REVIEW_REQUIRED` signals without sending hosted alerts. `publicEventDeliveryAlerts.failedAttempts` and `publicEventDeliveryAlerts.retryableFailedAttempts`, also available through standalone env vars, add summary-only delivery-health `REVIEW_REQUIRED` signals without sending hosted alerts. `publicEventDeadLetterQueueAlerts.unreviewedItems`, also available through `SCHEDULEOS_PUBLIC_EVENT_DEAD_LETTER_QUEUE_ALERT_UNREVIEWED_ITEMS`, adds summary-only dead-letter queue `REVIEW_REQUIRED` signals without sending hosted alerts. `publicEventSubscriptionHealthAlerts.failingSubscriptions`, `publicEventSubscriptionHealthAlerts.exhaustedSubscriptions`, and `publicEventSubscriptionHealthAlerts.neverDeliveredSubscriptions`, also available through standalone env vars, add summary-only subscription-health `REVIEW_REQUIRED` signals without sending hosted alerts. These are useful local and self-hosted foundation tests, but still not sufficient for horizontally scaled production deployment, production proxy deployment verification, provider quota enforcement, hosted abuse analytics, hosted delivery dashboards, alert routing, or full distributed throttling.

### Duplicate Calendar Writes

Risk: repeated sync/export creates duplicate calendar blocks.

Controls:

- Stable external IDs.
- Idempotency keys.
- Sync state.
- Conflict detection.
2026-07-27 local request-abuse visibility foundation: `GET /api/request-abuse/summary` reports scoped persisted request-throttle windows, saturated-window counts, retry timing, and truncated SHA-256 key fingerprints without raw bearer tokens, session cookies, client IPs, request paths, request bodies, task titles, calendar titles, or provider identifiers. This improves local/self-host operator review, but does not replace distributed production throttling, hosted alerting, hosted dashboards, or production abuse analytics.

- Integration tests.

### Unsafe Replanning

Risk: system moves accepted/locked work unexpectedly or writes external calendar changes without approval.

Controls:

- Locked block hard constraint.
- Schedule-stability penalties.
- Approval policy before external writes.
- Change summary.
- Revision audit trail.

### Dependency And Supply Chain Risk

Risk: vulnerable dependency, compromised action, or copied third-party code introduces security/licensing issues.

Controls:

- Dependency scanning.
- Pinned CI actions.
- License audit.
- Secret scanning.
- Clean public history.

### Browser Security Header Gap

Risk: browser clients render imported or app-shell content with weaker default protections, allowing MIME sniffing, framing, referrer leakage, or overly broad script/network execution.

Controls:

- `X-Content-Type-Options: nosniff` on local API and app responses.
- `X-Frame-Options: DENY` on local API and app responses.
- `Referrer-Policy: no-referrer` on local API and app responses.
- App-shell `Content-Security-Policy` limiting default, script, style, connect, image, base URI, frame ancestors, and form action behavior.
- Production reverse-proxy/TLS header review before public deployment.

## Required Security Tests

- Cross-tenant calendar access denied.
- Cross-user task access denied.
- Read-only API key write denied.
- Unauthorized schedule change denied.
- Invalid webhook signature rejected.
- Current and previous webhook rotation secrets accepted during configured overlap.
- Blank webhook secrets and empty rotation lists rejected at startup.
- Missing signed webhook replay headers rejected.
- Stale signed webhook timestamp rejected.
- Source-specific webhook replay window enforced and invalid policy rejected.
- Reused signed webhook event id rejected.
- Oversized API request body rejected.
- Expired OAuth state rejected.
- Tampered task identifiers rejected.
- Prompt injection does not affect policy.
- External schedule guidance cannot unblock work or bypass scheduling eligibility.
- Malicious calendar text remains data.
- Secrets redacted from logs.
- Private event title not leaked.
- API JSON responses include baseline security headers.
- App shell includes baseline security headers and CSP.
- Unsafe URL rejected.
- Dependency vulnerabilities reviewed.

## Current Gate

```text
Security implementation gate: FAIL
Reason: local/self-host security foundations exist for static API-key authorization, local persisted session issuance/revocation, local credential login, local standalone app login/logout, local standalone app password reset request/confirm foundation, durable credential-attempt backoff, password rotation, local owner/admin membership management, local owner/admin app controls and runbook foundation, session-hash, password-reset-token-hash, and credential-attempt-window retention cleanup, webhook signature/replay protection, request-size caps, local rate limiting, import throttling, security headers, private-title redaction, and storage-boundary tenant isolation. Production password reset/recovery delivery, abuse controls, operator/helpdesk workflow, production login UX browser verification/accessibility/deployment packaging, production admin workflow UX/runbooks beyond local app/runbook foundation, provider lifecycle controls, distributed rate limiting, hosted retention enforcement, and final release audit remain incomplete.
```
