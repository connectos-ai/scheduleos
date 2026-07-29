# ScheduleOS

Open-source intelligent task scheduling and calendar optimization.

## Status

ScheduleOS is a public open-source baseline for local and self-hosted task scheduling.

Current public repository gate: `PASS`.

The public repository is launched at `connectos-ai/scheduleos`, with GitHub Actions covering build, tests, release safety checks, production dependency audit, and live PostgreSQL service tests. Production deployment remains operator-owned: review the deployment, security, privacy, and provider-integration checklists before exposing an instance to real users or real calendar/provider data.

- `npm run auth:production-readiness-packet -- ...` emits a review-only production auth readiness packet that requires explicit identity-provider, session-store, authorization matrix, role/membership, session lifecycle, reset-token lifecycle, lockout/pruning, cookie transport, startup guard, migration-plan, rollback-drill, remote CI, rollback, and second-operator labels. It does not approve production auth or mutate auth state.
- `npm run auth:authorization-matrix-packet -- ...` emits review-only authorization matrix rows required by the production auth packet for owner, admin, editor, viewer, disabled-user, inactive-membership, cross-scope, private-calendar, revoked-session, and expired-session evidence. It does not approve production auth or mutate auth state.
- `npm run rate-limit:production-readiness-packet -- ...` emits a review-only production rate-limit readiness packet that requires explicit edge/gateway policy, distributed throttle storage, provider quota policy, trusted proxy proof, hosted alert-routing, hosted dashboard, abuse-analytics, remote CI, and rollback labels. It does not enable production throttling or mutate quota policy.

- `npm run providers:lifecycle-readiness-packet -- ...` emits review-only provider lifecycle readiness packet requiring explicit managed-secret custody, rotation/revocation drills, write-back safety, hosted alert routing, provider runbook, remote CI, rollback, and second-operator labels. It does not enforce production provider lifecycle or mutate provider connections.

- `npm run calendar-ui:production-readiness-packet -- ...` emits review-only calendar UI production readiness packet requiring explicit browser matrix, conflict-preview workflow, write-back acknowledgement, accessibility audit, responsive polish, visual regression, product-owner approval, remote CI, rollback, and second-operator labels. It does not approve production UI or mutate schedule/calendar data.

- `npm run web-app:production-readiness-packet -- ...` emits review-only standalone web app production readiness packet production build, authenticated write flows, security headers, CSRF/cookie transport, throttles, durable storage, cache policy, health checks, browser matrix, accessibility audit, responsive polish, visual regression, operator review, remote CI, rollback, and second-operator evidence. It does not approve production deployment or configure hosting.

- `npm run deployment:production-readiness-packet -- ...` emits review-only production deployment readiness packet requiring explicit TLS termination, reverse proxy headers, security headers, startup guards, health checks, durable storage, secure cookie/CSRF transport, trusted proxy/throttle, static asset cache, log redaction, backup/rollback, remote CI deployment smoke, operator-review, and second-operator labels. It does not approve production deployment, configure hosting, mutate DNS, write secrets, start services, create remotes, publish packages, or announce ScheduleOS.

- `npm run ics:production-readiness-packet -- ...` emits a review-only ICS production readiness packet that requires explicit recurrence regression, timezone/DST, sync-state idempotency, import preview UX, export privacy redaction, write-back conflict preview, provider-neutral contract, provider fixture, large calendar fixture, browser workflow, remote CI, rollback, and second-operator labels. It does not approve production calendar sync or write calendar data.

- `npm run provider-csv:production-readiness-packet -- ...` emits a review-only provider CSV production readiness packet that requires explicit real-provider export fixture, download/upload workflow, provider-specific confirmation UX, quota governance, abuse analytics, large fixture, formula-injection regression, field-mapping privacy, browser workflow, remote CI, rollback, and second-operator labels. It does not approve production imports or mutate provider quota policy.

- `npm run release:generated-artifact-review-packet -- ...` emits review-only generated artifact review packet for dist output, fixtures/templates/samples, screenshots/exports/backups/logs, local path/private URL absence, provider identifier minimization, license/NOTICE triggers, first-commit staging alignment, and operator-review evidence. It does not approve, rewrite, delete, publish, or mutate artifacts or release gates.

## Public Event Foundations

- `GET /api/events/catalog` exposes the public `ScheduleOSEvent` envelope and v1 event type catalog.
- `GET /api/events?tenantId=...&workspaceId=...&userId=...` exposes a scoped local/self-host read model that maps known audit evidence to content-minimized `ScheduleOSEvent` envelopes for task imports, schedule lifecycle, and block lifecycle events, with optional `type` and `sourceSystem` filters.
- `POST /api/events/webhook-deliveries` provides a local/self-host explicit signed delivery foundation for scoped public events.
- `GET /api/events/webhook-deliveries?tenantId=...&workspaceId=...&userId=...` exposes scoped local/self-host delivery-attempt observability and retry metadata without returning webhook secrets or raw target URLs.
- `GET /api/events/webhook-deliveries/summary?tenantId=...&workspaceId=...&userId=...` exposes scoped local/self-host delivery health totals, optional `REVIEW_REQUIRED` threshold status, and per-target-hash summaries without returning webhook secrets or raw target URLs.
- `POST /api/events/webhook-deliveries/retry-due` provides local/self-host retry execution for due failed retryable delivery attempts, recording the next attempt without returning webhook secrets or raw target URLs.
- `GET /api/events/webhook-deliveries/exhausted?tenantId=...&workspaceId=...&userId=...` exposes scoped local/self-host exhausted delivery candidates with event IDs, target hashes, attempt numbers, statuses, and reasons without returning webhook secrets or raw target URLs.
- `POST /api/events/webhook-deliveries/dead-letter` and `GET /api/events/webhook-deliveries/dead-letter?tenantId=...&workspaceId=...&userId=...` record and list scoped local/self-host dead-letter review decisions for exhausted delivery candidates without replaying, deleting, or returning webhook secrets or raw target URLs.
- `GET /api/events/webhook-deliveries/dead-letter/queue?tenantId=...&workspaceId=...&userId=...` exposes scoped local/self-host dead-letter queue visibility by combining exhausted candidates with latest review status and optional `REVIEW_REQUIRED` threshold status without returning webhook secrets or raw target URLs.
- `POST /api/events/webhook-subscriptions` and `GET /api/events/webhook-subscriptions?tenantId=...&workspaceId=...&userId=...` provide local/self-host subscription metadata registration/listing without returning webhook secrets or raw target URLs.
- `POST /api/events/webhook-subscriptions/status` provides local/self-host subscription pause/resume status control without returning webhook secrets or raw target URLs.
- `GET /api/events/webhook-subscriptions/health?tenantId=...&workspaceId=...&userId=...` exposes scoped local/self-host subscription health totals, optional `REVIEW_REQUIRED` threshold status, and per-subscription rows for enabled, disabled, failing, exhausted, and never-delivered subscriptions without returning webhook secrets or raw target URLs.
- `POST /api/events/webhook-subscriptions/deliver` provides local/self-host subscription delivery execution by verifying caller-provided target URL and secret against stored hashes before sending matching scoped public events.
- Local/self-host managed-secret resolver audit-evidence foundation records content-minimized `MANAGED_SECRET_RESOLUTION_CHECKED` audit rows for resolved, unavailable, provider-unavailable, provider-error, and scope-rejected delivery target URL/signing-secret refs without raw target URLs, signing secrets, or raw secret refs.
- `POST /api/events/webhook-subscriptions/deliver-ready` provides local/self-host worker-style delivery for enabled scoped subscriptions with configured delivery-target references, optional `dryRun`, `maxSubscriptions`, and `maxEvents` operator controls.
- `npm run public-events:delivery-operator-packet -- ...` emits a bounded dry-run operator packet for future public-event subscription delivery worker invocations without including raw target URLs or secrets.
- `npm run public-events:dead-letter-queue-packet -- ...` emits a review-only dead-letter queue packet for scoped local/self-host operator review without including raw target URLs or signing secrets.
- Configured delivery-target references let local/self-host workers register and deliver subscriptions without sending raw webhook target URLs or secrets in subscription or delivery request bodies.
- Receiver verification and replay-store guidance: `docs/operations/public-event-webhook-receiver-runbook.md`.
- Public event delivery operator runbook: `docs/operations/public-event-delivery-operator-runbook.md`.
- Production subscription delivery workers, durable hosted retry workers, hosted delivery operations, and hosted observability remain release blockers.

## What ScheduleOS Is

ScheduleOS turns tasks into a realistic plan. It is for people and teams who need to answer:

```text
Given my tasks, calendar commitments, priorities, deadlines, availability, and preferences,
what should I work on, and when should I do it?
```

The basic standalone promise is:

1. Add tasks.
2. Estimate duration.
3. Add deadlines.
4. Configure working hours.
5. Add fixed commitments.
6. Generate a schedule.
7. See what fits, what does not fit, and why.

## Independence

ScheduleOS must work without:

- compatible leadership system.
- OwnerOps.
- ConnectOS.
- Slack, Gmail, Google Calendar, or Microsoft 365.
- An external task manager.
- A paid AI model.
- A hosted service.
- A commercial subscription.

Optional integrations should make ScheduleOS more useful, but the standalone product must remain complete enough to plan a day locally.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:8787/app`. Use `SCHEDULEOS_HOST`, `SCHEDULEOS_PORT`, `SCHEDULEOS_STORAGE_PATH`, optional `SCHEDULEOS_API_KEY`, optional `SCHEDULEOS_API_ROLE`, optional `SCHEDULEOS_AUTH_SESSION_COOKIE`, and optional `SCHEDULEOS_AUTH_SESSION_COOKIE_SECURE` environment variables to configure the local self-hosted server. `SCHEDULEOS_API_ROLE` defaults to `EDITOR`; use `OWNER` only for trusted local bootstrap/admin work. Cookie session transport is off by default; when enabled, ScheduleOS issues an `HttpOnly`, `SameSite=Lax`, path-scoped session cookie and requires the returned CSRF token on cookie-authenticated write requests. `DELETE /api/auth/session` revokes the current bearer or cookie session and clears the configured browser session cookie.

## What Works Today

- Provider-neutral TypeScript domain contracts.
- Deterministic scheduling engine foundation.
- Dependency-free local HTTP API foundation.
- Local task create, list, read, update, and delete API foundation with tenant/workspace/user scope enforcement.
- In-memory development state.
- Optional JSON-backed local persistence.
- SQLite migration foundation.
- PostgreSQL schema, migration runner, pooled `pg` client adapter, and repository adapter slices.
- Fixed busy event avoidance.
- Working-hour placement.
- Daylight-saving standard-time working-hour conversion.
- Recurring break-window protection.
- Priority ordering.
- Finish-before-start dependency ordering within a plan request.
- Preferred daypart placement where constraints allow.
- Splittable and non-splittable task handling.
- Locked block preservation during replanning.
- Blocked, ineligible, and wrong-scope tasks remain unscheduled.
- Partial completion schedules remaining duration only.
- Deadline risk and capacity-warning output.
- Grounded explanation records.
- Structured validation errors.
- Optional static API-key scope, read/write role checks, and owner/admin auth-management foundations for the local API.
- Local durable auth model foundation for users, workspace memberships, session hashes, and password reset token hashes in JSON-backed, SQLite, and PostgreSQL storage plus local API scrypt credential-login, local app login/logout, local app password reset request/confirm, local app owner/admin management controls, durable scoped credential-login backoff, current-user password rotation, owner/admin credential reset, bearer-session, and optional hardened cookie-session issuance/revocation.
- Local/self-host membership privilege-boundary foundation: `OWNER` and `ADMIN` principals can create ordinary memberships, while only `OWNER` principals can grant `OWNER` or `ADMIN` roles.
- Local/self-host auth-management lower-role denial foundation: `EDITOR` and `VIEWER` principals receive `FORBIDDEN` for auth-user creation and workspace-membership creation.
- Local/self-host auth-management cross-scope denial foundation: owner/admin principals receive `FORBIDDEN` when auth-user or workspace-membership management targets another tenant or workspace.
- Local/self-host auth-management read/list denial foundation: `EDITOR` and `VIEWER` principals cannot read auth users or list memberships, and owner/admin principals cannot read/list another tenant's auth records.
- Configurable local API request-body size cap with structured `413` errors.
- Configurable local API rate-limit foundation with env wiring, startup validation, structured `429` errors, process-local default buckets, opt-in trusted proxy client IP header, and opt-in persisted authenticated request throttles using hashed scoped keys.
- Local app/API security-header foundation with `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and app-shell `Content-Security-Policy`.
- Configurable persisted import-row throttle foundation for webhook, JSON, CSV, and ICS imports with per-source overrides.
- Import throttle denial audit-event foundation with scoped, content-minimized metadata for abuse visibility.
- Scoped local `GET /api/audit-events` foundation for reading audit events without cross-user leakage, with optional `action`, `resourceType`, and metadata `sourceSystem` filters.
- Public `GET /api/events/catalog` event-contract foundation with `ScheduleOSEvent` envelope fields, v1 event types, content-minimized privacy posture, and production webhook delivery boundary.
- Scoped local `GET /api/events` read-model foundation returns content-minimized task, schedule, block, warning, ScheduleOS calendar, and ConnectOS calendar public events without copying task titles, private calendar titles, row payloads, or provider tokens.
- Local/self-host `POST /api/events/webhook-deliveries` signed public-event delivery foundation with per-event HMAC signatures, event/delivery/timestamp headers, HTTPS-required non-local targets, and no copied private task/calendar content.
- Local/self-host `GET /api/events/webhook-deliveries` delivery-attempt observability foundation returns scoped status, event ID, delivery ID, event type, HTTP status, error code, retryable flag, attempt number, next retry timestamp, and target URL hash without returning webhook secrets or raw target URLs.
- Local/self-host `GET /api/events/webhook-deliveries/summary` delivery-health summary foundation returns scoped delivery totals, failed/retryable counts, target count, optional configured `REVIEW_REQUIRED` alert status, and per-target URL hash summaries without returning webhook secrets or raw target URLs.
- Local/self-host `POST /api/events/webhook-deliveries/retry-due` retry execution foundation retries due failed retryable delivery attempts, increments attempt numbers, records the retry attempt, and returns content-minimized attempt views without webhook secrets or raw target URLs.
- Local/self-host `POST /api/events/webhook-deliveries/dead-letter` and `GET /api/events/webhook-deliveries/dead-letter` dead-letter review evidence foundation records scoped decisions for exhausted delivery candidates and returns content-minimized review rows without replaying, deleting, or returning webhook secrets or raw target URLs.
- Local/self-host `GET /api/events/webhook-deliveries/dead-letter/queue` dead-letter queue visibility foundation combines exhausted delivery candidates with latest review status, optional configured `REVIEW_REQUIRED` alert status, and content-minimized queue rows without webhook secrets or raw target URLs.
- Local/self-host public-event dead-letter queue alert-threshold foundation can report `REVIEW_REQUIRED` when configured unreviewed queue item count thresholds are met.
- Local/self-host `npm run public-events:dead-letter-queue-packet -- ...` dead-letter queue operator packet foundation prepares review-only scoped queue evidence, review steps, and production boundary flags without raw target URLs or signing secrets.
- Local/self-host `POST /api/events/webhook-subscriptions/deliver` subscription delivery execution foundation verifies caller-provided target URL and secret against registered subscription hashes, delivers matching scoped event types, records attempts, and returns content-minimized attempt views without webhook secrets or raw target URLs.
- Local/self-host configured delivery-target reference foundation lets `POST /api/events/webhook-subscriptions` accept a configured target reference and lets `POST /api/events/webhook-subscriptions/deliver` resolve it server-side, storing and returning only target, secret, and target-reference hashes.
- Local/self-host managed-secret resolver audit-evidence foundation records content-minimized `MANAGED_SECRET_RESOLUTION_CHECKED` audit rows for resolved, unavailable, provider-unavailable, provider-error, and scope-rejected delivery target URL/signing-secret refs without raw target URLs, signing secrets, or raw secret refs.
- Local/self-host `POST /api/events/webhook-subscriptions/deliver-ready` worker-style subscription delivery foundation scans enabled scoped subscriptions with configured target references, supports optional `dryRun`, `maxSubscriptions`, and `maxEvents` bounded operator controls, delivers matching public events, records attempts, and returns content-minimized grouped results without webhook secrets, raw target URLs, or raw target references.
- Local/self-host `GET /api/events/webhook-subscriptions/health` subscription-health observability foundation returns scoped totals, optional configured `REVIEW_REQUIRED` alert status, and content-minimized per-subscription rows for enabled, disabled, healthy, failing, exhausted, and never-delivered subscriptions without webhook secrets or raw target URLs.
- Scoped local `GET /api/import-abuse/summary` foundation for source-level import denial and allowed-import visibility.
- Local/self-host import-abuse alert-threshold foundation: `GET /api/import-abuse/summary` can report `REVIEW_REQUIRED` when configured denied-event or denied-row thresholds are met.
- Local/self-host `GET /api/import-policies` provider import policy catalog foundation returning recommended policies and copyable `importThrottle.sourcePolicies` output, plus opt-in `importThrottle.enforceProviderPolicies` catalog enforcement.
- Schedule plan creation, list/read, acceptance, rejection, and replanning.
- Plan-scoped reads for warnings, risks, unscheduled tasks, and explanations.
- Local accepted-plan calendar write-back foundation with explicit read-only calendar rejection, no-write conflict preview, and server-side conflict blocking before local writes.
- Time-block move/resize foundation plus lock, unlock, complete, and missed state changes.
- Dependency-free standalone planning app shell at `/app` with task entry/edit/delete, CSV/JSON task preview/import confirmation, fixed-event entry/edit/delete, ICS fixed-event review/import, working-hours setup, day/week plan views, warning and grounded explanation review, plan/replan, plan accept/reject, accepted-block ICS export, local accepted-plan write-back controls that require a clean matching conflict preview and explicit review acknowledgement with described status before write-back, manual time-block drag/drop or keyboard move controls, and block lock/done/missed controls using existing local APIs.
- Guarded live PostgreSQL spec plus local Docker PostgreSQL proof.
- Dependency-free documentation link check for project Markdown files.
- Generic webhook task ingestion local API foundation with source-id idempotency, optional timestamp-bound HMAC verification, current/previous secret rotation-list support, source-specific replay windows, signed event-id replay protection, audit event, and missing-duration unscheduled handling.
- JSON task import local API foundation with batch import, dry-run preview, source-id idempotency, row-level errors, audit event, and missing-duration unscheduled handling.
- CSV task import local API foundation with dry-run preview, quoted-field parsing, source-id idempotency, row-level errors, audit event, and formula-like text kept inert.
- Provider-specific CSV template API/import foundation for Todoist, Linear, Asana, ClickUp, Trello, Microsoft Planner, and GitHub Issues exports without requiring any provider connection.
- ICS daily `BYHOUR`/`BYMINUTE`/`BYSECOND` and daily time-window `BYSETPOS` IANA `TZID` recurrence wall-clock preservation foundation across daylight saving changes.
- ICS weekly `BYDAY` plus `BYHOUR`/`BYMINUTE`/`BYSECOND` and weekly time-window `BYSETPOS` IANA `TZID` recurrence wall-clock preservation foundation across daylight saving changes.
- ICS monthly `BYMONTHDAY` plus `BYHOUR`/`BYMINUTE`/`BYSECOND` and monthly time-window `BYSETPOS` IANA `TZID` recurrence wall-clock preservation foundation across daylight saving changes.
- ICS yearly `BYMONTH`/`BYMONTHDAY` plus `BYHOUR`/`BYMINUTE`/`BYSECOND` IANA `TZID` recurrence wall-clock preservation foundation across daylight saving status dates.
- ICS yearly `BYMONTH`/`BYMONTHDAY` plus `BYHOUR`/`BYMINUTE` and time-window `BYSETPOS` IANA `TZID` recurrence wall-clock preservation foundation across daylight saving status dates.
- ICS weekly `BYDAY` IANA `TZID` recurrence wall-clock preservation foundation across daylight saving changes.
- ICS weekly `BYDAY` plus `BYMONTH` IANA `TZID` recurrence wall-clock preservation foundation across daylight saving changes.
- ICS monthly ordinal `BYDAY` IANA `TZID` recurrence wall-clock preservation foundation across daylight saving changes.
- ICS monthly plain `BYDAY` IANA `TZID` recurrence wall-clock preservation foundation across daylight saving changes.
- ICS yearly `BYMONTH` ordinal `BYDAY` IANA `TZID` recurrence wall-clock preservation foundation across daylight saving status changes.
- ICS yearly `BYMONTH` plain `BYDAY` IANA `TZID` recurrence wall-clock preservation foundation across daylight saving changes.
- ICS yearly `BYYEARDAY` IANA `TZID` recurrence wall-clock preservation foundation across daylight saving changes.
- ICS yearly `BYWEEKNO` IANA `TZID` recurrence wall-clock preservation foundation across daylight saving changes.
- Local CSV import template selector, multi-row sample-loading, and provider-aware confirmation UI foundation backed by the provider-template catalog.
- Mock OwnerOps public task import foundation through `POST /api/integrations/ownerops/tasks/import`, including owned-work mapping, blocked/waiting/completed work kept unscheduled, idempotent updates, and audit events.
- Mock ConnectOS public calendar import foundation through `POST /api/integrations/connectos/calendar-events/import`, using connection/capability references instead of provider tokens, private-title redaction, idempotent upserts, and fixed busy events that constrain scheduling.
- Public schedule-guidance foundation through `POST /api/schedule-guidance/apply`, allowing compatible leadership system or any compatible leadership app to send scoped priority, daypart, owner-only, and tag hints without bypassing blocked or scheduling-eligibility rules.
- Dependency-free ICS import/export module and local API foundation for VEVENT UTC, fixed-event IANA `TZID`, daily/weekly/monthly/yearly, monthly `BYMONTHDAY`, yearly `BYMONTH`, and yearly `BYMONTH`/`BYMONTHDAY` IANA `TZID` recurrence wall-clock preservation across daylight saving changes, `DTSTART` plus `DURATION`, all-day calendar events, basic daily/weekly/monthly/yearly recurrence expansion including daily/weekly/monthly/yearly `BYHOUR`/`BYMINUTE`/`BYSECOND`, daily/weekly `BYDAY`, weekly `BYDAY` plus `BYMONTH`, daily/monthly `BYMONTHDAY`, monthly/yearly ordinal `BYDAY`, daily/weekly/monthly/yearly `BYSETPOS`, yearly `BYMONTH`, yearly `BYYEARDAY`, yearly `BYWEEKNO`, `EXDATE`, date-only `EXDATE`, `RDATE`, and `RDATE;VALUE=PERIOD`, `RECURRENCE-ID` moved/edited exception substitution and cancelled-instance omission, local API cancelled-occurrence re-import deletion counts plus content-minimized `calendar.event_changed` evidence for deleted occurrences, inclusive date-only `UNTIL`, scoped re-import upsert counts, and accepted schedule-block export.

## What Does Not Work Yet

- Production-grade web app hardening beyond the local security-header foundation.
- Production daily and weekly calendar views.
- Production manual drag/drop calendar UI.
- Production-ready public API.
- Production-grade provider CSV import workflow beyond API local template-selector and fictional built-in fixture validation foundations, including download/upload polish, broader real-provider export fixture sets, provider-specific import confirmation polish, provider quota enforcement, and hosted abuse analytics.
- Production-grade calendar provider write-back to Google, Microsoft, or other external calendars, including remote conflict handling.
- Production authentication UX, self-service password reset/recovery policy, production distributed lockout/backoff policy, identity-provider integration, persisted admin workflow UX, and hosted session cleanup.
- Production distributed rate limiting, provider-specific quota enforcement, hosted alert delivery/dashboards beyond local summary thresholds, abuse analytics.
- Production storage hardening.
- Successful remote CI PostgreSQL proof.
- Verified remote CI run.
- Release-grade ICS workflow with broader recurrence support, production sync UX, and production sync-state idempotency.
- Real calendar or task-source provider adapters.
- OwnerOps and ConnectOS end-to-end adapters.
- Timefold or OR-Tools solver prototype.
- Complete security, privacy, licensing, and git-history release audits.

## How Scheduling Works

ScheduleOS uses three distinct intelligence layers:

- Understanding layer: converts manual, imported, webhook, or optional AI input into structured scheduling data.
- Optimization layer: creates the actual schedule using deterministic constraints and solver outputs.
- Explanation layer: explains outcomes using recorded inputs, constraints, warnings, and plan results.

An LLM must not be the authoritative scheduler.

## AI

AI is optional. ScheduleOS must remain useful with deterministic local scheduling and no paid AI provider.

Future AI adapters may help interpret messy task input or explain schedule outcomes, but all critical fields must be validated and all explanations must be grounded in actual schedule evidence.

## Calendars And Task Sources

Daily, weekly, monthly, and yearly ICS recurrence can now expand `BYHOUR`/`BYMINUTE`/`BYSECOND` time windows, such as `RRULE:FREQ=YEARLY;BYMONTH=7;BYMONTHDAY=15;BYHOUR=9,13;BYMINUTE=30;BYSECOND=0;COUNT=4`, inside the requested recurrence range.

Current implementation supports local fixed events and local tasks through the API foundation. It also includes tested ICS import/export module and local API routes for calendar events and accepted schedule blocks. Local ICS import supports fixed-event IANA `TZID` conversion plus `DTSTART` with `DTEND` or `DURATION`, can expand basic `RRULE:FREQ=DAILY|WEEKLY|MONTHLY|YEARLY` entries, including daily/weekly `BYDAY`, weekly `BYDAY` plus `BYMONTH` filters, daily and monthly `BYMONTHDAY`, monthly/yearly ordinal `BYDAY` such as `1MO` and `-1FR`, daily/weekly/monthly/yearly `BYSETPOS`, yearly `BYMONTH`, yearly `BYYEARDAY`, yearly `BYWEEKNO`, `EXDATE` exclusions, date-only `EXDATE;VALUE=DATE` day exclusions, and `RDATE` additions and `RECURRENCE-ID` moved/edited exception substitution and cancelled-instance omission inside a requested recurrence range, inclusive date-only `UNTIL=YYYYMMDD` on all-day and timed recurrences, and uses scoped upsert semantics so re-importing the same UID updates existing events, removes locally stored cancelled recurrence occurrences, returns created/updated/deleted counts, and emits content-minimized `calendar.event_changed` public-event evidence for actual deleted occurrences without copying cancelled private summaries. Local/self-host sync checkpoints can also record provider cursors idempotently through scoped provider event IDs, and local/self-host provider revocation can disconnect integration state without storing provider tokens. This is not yet a full release-grade ICS workflow.

Current local ICS API routes:

- `POST /api/calendar-events/ics/import`
- `GET /api/calendar-events/ics/export?tenantId=...&workspaceId=...&userId=...&calendarId=...`
- `GET /api/schedule-plans/{planId}/ics/export?calendarId=...`
- `POST /api/sync/checkpoints`
- `POST /api/integrations/revoke`

Current provider-neutral source foundations:

- Manual tasks.
- ICS import/export.
- Generic webhook ingestion.
- JSON task import.
- CSV import.

Planned provider-neutral sources:

- OwnerOps adapter.
- ConnectOS adapter.
- Mock providers for tests and demos.

Direct Google Calendar, Microsoft Outlook Calendar, Todoist, Linear, Asana, ClickUp, Trello, Microsoft Planner, GitHub Issues, Slack, or email-derived adapters should be added only when security, privacy, sync, retry, and revocation handling are production-ready.

## Replanning

The current foundation supports replanning around locked, completed, and missed blocks. The target release must also replan after task changes, fixed-event changes, new meetings, changed working hours, user rejection, and provider updates.

ScheduleOS should show what moved, what stayed locked, what could not fit, and which deadlines are at risk.

## Privacy

ScheduleOS should minimize private calendar and task data. It usually needs time boundaries, availability, source provenance, and scheduling constraints more than full private meeting content.

Public fixtures must use fictional data only, such as `tenant_demo`, `workspace_demo`, `user_jordan`, `task_demo_proposal`, Riverstone Creative, Northstar Services, or Harbor Community.

## Run Locally

```bash
npm install
npm run check
```

`npm run check` builds TypeScript, runs the local test suite, and validates project Markdown links.

## SQLite Operations

Build before using local SQLite operations commands:

```bash
npm run build
```

Backup:

```bash
npm run db:sqlite:backup -- --database data/scheduleos.db --backup backups/scheduleos.db
```

Encrypted backup:

```bash
export SCHEDULEOS_BACKUP_KEY="use-a-long-random-secret-from-your-password-manager"
npm run db:sqlite:backup -- --database data/scheduleos.db --backup backups/scheduleos.enc.json --encrypt-key-env SCHEDULEOS_BACKUP_KEY
```

Restore validation:

```bash
npm run db:sqlite:restore -- --backup backups/scheduleos.db --restore restore/scheduleos.db --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan
```

Restore overwrite requires exact confirmation:

```bash
npm run db:sqlite:restore -- --backup backups/scheduleos.db --restore restore/scheduleos.db --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --overwrite --confirm tenant_demo/workspace_demo/user_jordan/overwrite/restore/scheduleos.db
```

Encrypted restore validation:

```bash
export SCHEDULEOS_BACKUP_KEY="use-the-same-long-random-secret"
npm run db:sqlite:restore -- --backup backups/scheduleos.enc.json --restore restore/scheduleos.db --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --decrypt-key-env SCHEDULEOS_BACKUP_KEY
```

Scoped export:

```bash
npm run db:sqlite:export -- --database data/scheduleos.db --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --output exports/workspace.json
```

Scoped delete requires exact confirmation:

```bash
npm run db:sqlite:delete-workspace -- --database data/scheduleos.db --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --confirm tenant_demo/workspace_demo/user_jordan
```

Retention policy inspection:

```bash
npm run retention:policy -- --as-of 2026-07-22T12:00:00.000Z
npm run retention:policy -- --as-of 2026-07-22T12:00:00.000Z --json
```

Retention operator approval packet, non-destructive:

```bash
npm run retention:operator-packet -- --backend sqlite --database data/scheduleos.db --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-22T12:00:00.000Z --json
```

The packet prints the dry-run command, exact apply command, required confirmation token, and second-operator review steps. Follow [Retention Operator Runbook](docs/operations/retention-operator-runbook.md) before applying cleanup.

Hosted retention cleanup approval packet, review-only:
```bash
npm run retention:hosted-cleanup-packet -- --environment production-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-22T12:00:00.000Z --window-start 2026-07-23T02:00:00.000Z --window-end 2026-07-23T03:00:00.000Z --dry-run-evidence retention-dry-run-digest-demo --backup-evidence retention-backup-validation-demo --approval-record external-approval-record-demo --legal-support-review legal-support-review-demo --rollback-plan hosted-retention-rollback-demo --second-operator second-operator-retention-cleanup-demo --json
```
The hosted packet records required dry-run evidence, backup evidence, legal/support review, second-operator approval, and a maintenance window. It does not schedule, approve, apply, or delete records.
Destructive approval readiness packet, review-only:
```bash
npm run retention:destructive-approval-readiness-packet -- --environment production-demo --operation hosted-retention-cleanup --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --approval-policy two-operator-approval-demo --dry-run-diff retention-dry-run-diff-demo --fresh-backup fresh-backup-proof-demo --restore-smoke restore-smoke-proof-demo --exact-confirmation exact-confirmation-proof-demo --two-operator-approval two-operator-approval-proof-demo --legal-support-approval legal-support-approval-proof-demo --scope-proof tenant-workspace-user-scope-proof-demo --maintenance-window maintenance-window-proof-demo --rollback-procedure rollback-procedure-proof-demo --audit-retention audit-retention-proof-demo --hosted-scheduler-disablement hosted-scheduler-disablement-proof-demo --remote-ci remote-ci-proof-demo --json
```
destructive approval packet records required dry-run diff, fresh backup, restore smoke, exact confirmation, two-operator approval, legal/support approval, scope proof, maintenance window, rollback, audit retention, hosted scheduler disablement, and remote CI evidence. It does not approve destructive operations, schedule hosted cleanup jobs, apply retention cleanup, delete records, create external approval records, or rotate backup keys.

Production auth readiness packet, review-only:
```bash
npm run auth:production-readiness-packet -- --environment production-demo --backend postgres --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --identity-provider local-credential-demo --session-store postgres-auth-sessions --authorization-matrix owner-admin-editor-viewer-cross-scope-demo --role-membership-proof role-membership-proof-demo --session-lifecycle session-lifecycle-demo --reset-token-lifecycle reset-token-lifecycle-demo --lockout-pruning lockout-pruning-demo --cookie-transport secure-cookie-transport-demo --startup-guard production-auth-startup-guard-demo --migration-plan postgres-auth-migration-demo --rollback-drill postgres-auth-rollback-drill-demo --remote-ci remote-ci-auth-demo --rollback-plan auth-rollback-plan-demo --second-operator second-operator-auth-review-demo --json
```
auth packet records required identity-provider, session-store, migration-plan, role/membership, authorization matrix, session lifecycle, password-reset-token hash lifecycle, lockout, pruning, production cookie, startup guard, rollback-drill, remote CI, rollback plan, and second-operator evidence. It does not approve production auth, create sessions, rotate credentials, run migrations, or mutate users.

Authorization matrix packet, review-only:
```bash
npm run auth:authorization-matrix-packet -- --matrix owner-admin-editor-viewer-cross-scope-demo --environment production-demo --backend postgres --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --json
```
authorization matrix packet lists expected allow/deny proof rows for owner, admin, editor, viewer, disabled-user, inactive-membership, cross-tenant, cross-workspace, cross-user private-calendar, revoked-session, and expired-session authorization review. each row includes `evidenceReferences` pointing to in-repository test evidence. it does not approve production auth, create sessions, rotate credentials, or mutate users.

Production rate-limit readiness packet, review-only:
```bash
npm run rate-limit:production-readiness-packet -- --environment production-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --edge-layer gateway-demo --store redis-demo --provider-quota-policy provider-quota-policy-demo --trusted-proxy-proof trusted-proxy-proof-demo --hosted-alert-routing hosted-alert-routing-demo --hosted-dashboard hosted-dashboard-demo --abuse-analytics abuse-analytics-export-demo --remote-ci remote-ci-rate-limit-demo --rollback-plan rate-limit-rollback-plan-demo --second-operator second-operator-rate-limit-review-demo --json
```
rate-limit packet records required edge/gateway, distributed store, provider quota policy, trusted proxy proof, hosted alert-routing label, hosted dashboard label, abuse-analytics label, remote CI label, rollback plan, and second-operator evidence. It does not enable production distributed throttling, mutate quota policies, configure alerts, or export analytics.

Calendar UI production readiness packet, review-only:
```bash
npm run calendar-ui:production-readiness-packet -- --environment production-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --browser-matrix chrome-firefox-safari-demo --conflict-workflow calendar-conflict-workflow-demo --write-back-acknowledgement write-back-acknowledgement-demo --accessibility-audit keyboard-screenreader-audit-demo --responsive-polish responsive-polish-screenshots-demo --visual-regression visual-regression-baseline-demo --product-owner-approval product-owner-approval-demo --remote-ci remote-ci-calendar-ui-demo --rollback-plan calendar-ui-rollback-plan-demo --second-operator second-operator-calendar-ui-review-demo --json
```
calendar UI packet records required explicit browser matrix, conflict-preview workflow, write-back acknowledgement, accessibility audit, responsive polish, visual regression, product-owner approval, remote CI, and rollback labels alongside mobile responsive, keyboard navigation, screen-reader semantics, and second-operator evidence. It does not approve production UI, mutate schedules or calendar events, replace browser/accessibility evidence, or provide product-owner approval.

Standalone web app production readiness packet, review-only:
```bash
npm run web-app:production-readiness-packet -- --environment production-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --deployment-target self-host-container-demo --production-build production-build-artifact-demo --authenticated-write-flow authenticated-write-flow-demo --security-headers security-header-deployment-demo --csrf-cookie-transport csrf-cookie-transport-demo --throttle-policy request-import-throttle-demo --durable-storage durable-storage-demo --cache-policy static-cache-policy-demo --health-startup-guard health-startup-guard-demo --browser-matrix desktop-mobile-browser-demo --accessibility-audit axe-keyboard-screenreader-demo --responsive-polish responsive-polish-demo --visual-regression visual-regression-demo --operator-review operator-review-demo --remote-ci remote-ci-webapp-demo --rollback-plan webapp-rollback-plan-demo --second-operator second-operator-webapp-review-demo --json
```
web app packet records required production build artifact, authenticated write-flow, security header, CSRF/cookie transport, request/import throttle, durable storage, static asset cache, health check/startup guard, browser matrix label, accessibility audit label, responsive polish, visual regression, operator review, remote CI, rollback, and second-operator evidence. It does not approve production deployment, mutate application state, configure hosting, create public remote, or replace production evidence.

Production deployment readiness packet, review-only:

```bash
npm run deployment:production-readiness-packet -- --environment production-demo --deployment-topology reverse-proxy-container-demo --tls-termination tls-termination-demo --reverse-proxy-headers reverse-proxy-headers-demo --security-headers deployment-security-headers-demo --startup-guards deployment-startup-guards-demo --health-checks deployment-health-checks-demo --durable-storage deployment-durable-storage-demo --cookie-csrf-transport cookie-csrf-transport-demo --trusted-proxy-throttle trusted-proxy-throttle-demo --static-asset-cache static-asset-cache-demo --log-redaction deployment-log-redaction-demo --backup-rollback backup-rollback-demo --remote-ci-deployment-smoke remote-ci-deployment-smoke-demo --operator-review deployment-operator-review-demo --second-operator second-operator-deployment-review-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --json
```

deployment packet records required TLS termination, reverse proxy header, security header, startup guard, health check, durable storage, secure cookie/CSRF transport, trusted proxy/throttle, static asset cache, log redaction, backup/rollback, remote CI deployment smoke, and second-operator evidence labels. It does not approve production deployment, configure hosting, mutate DNS, write secrets, start services, create public remote, publish packages, or announce ScheduleOS.

ICS production readiness packet, review-only:
```bash
npm run ics:production-readiness-packet -- --environment production-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --recurrence-suite rrule-regression-demo --timezone-dst-proof timezone-dst-regression-demo --sync-idempotency checkpoint-replay-demo --import-preview-ux import-preview-ux-demo --export-privacy-redaction export-privacy-redaction-demo --write-back-conflict-preview write-back-conflict-preview-demo --provider-neutral-contract provider-neutral-ics-contract-demo --provider-fixture-suite google-outlook-icloud-fixture-demo --large-calendar-fixture large-calendar-fixture-demo --browser-workflow import-preview-export-writeback-demo --remote-ci remote-ci-ics-demo --rollback-plan ics-rollback-plan-demo --second-operator second-operator-ics-review-demo --json
```
ICS packet records required recurrence regression, timezone/DST, sync-state idempotency, import preview UX, export privacy redaction, write-back conflict preview, provider-neutral ICS contract, provider fixture suite, large calendar fixture, browser import/export workflow, remote CI, rollback plan, and second-operator evidence. It does not approve production calendar sync, write calendar data, mutate provider state, or replace production evidence.

Provider CSV production readiness packet, review-only:
```bash
npm run provider-csv:production-readiness-packet -- --environment production-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --fixture-suite real-provider-export-demo --download-upload-workflow provider-csv-download-upload-demo --confirmation-ux provider-csv-confirmation-ux-demo --provider-policy quota-abuse-policy-demo --browser-workflow provider-csv-browser-workflow-demo --abuse-analytics provider-csv-abuse-analytics-demo --large-fixture-suite large-provider-csv-fixture-demo --formula-injection-regression formula-injection-regression-demo --field-mapping-privacy field-mapping-privacy-demo --remote-ci remote-ci-provider-csv-demo --rollback-plan provider-csv-rollback-plan-demo --second-operator second-operator-provider-csv-review-demo --json
```
provider CSV packet records required real-provider export fixtures, download/upload workflow, provider-specific confirmation UX, quota governance label, abuse analytics label, large CSV fixtures, formula-injection regression, field-mapping privacy, browser workflow label, remote CI label, rollback plan, and second-operator evidence. It does not approve production imports, import rows, mutate provider quota policy, export analytics, or configure alerts.

Public-event hosted delivery readiness packet, review-only:
```bash
npm run public-events:hosted-delivery-readiness-packet -- --environment production-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --secret-provider managed-secret-provider-demo --runtime-identity runtime-identity-demo --rotation-drill secret-rotation-revocation-demo --worker-topology durable-worker-topology-demo --retry-queue hosted-retry-queue-demo --dead-letter-queue hosted-dead-letter-queue-demo --hosted-dashboard hosted-delivery-dashboard-demo --alert-routing hosted-alert-routing-demo --replay-boundary replay-boundary-demo --rate-limit-header-key rate-limit-header-key-demo --incident-drill hosted-delivery-incident-drill-demo --remote-ci remote-ci-hosted-delivery-demo --rollback-plan hosted-delivery-rollback-plan-demo --second-operator second-operator-hosted-delivery-review-demo --json
```
public-event hosted delivery packet records required managed-secret provider selection, runtime identity, secret rotation/revocation drill, durable subscription workers, durable hosted retry queue, hosted dead-letter queue, hosted dashboard label, alert-routing label, replay-boundary label, request rate-limit header-key proof, incident drill, remote CI label, rollback plan, and second-operator evidence. It does not approve hosted delivery, configure managed secret providers, mutate workers, mutate secrets, mutate subscriptions, replay events, or configure hosted alerts.

Remote CI PostgreSQL readiness packet, review-only:
```bash
npm run remote-ci:postgres-readiness-packet -- --environment ci-demo --ci-provider github-actions-demo --postgres-service postgres-service-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --json
```
remote CI PostgreSQL packet records required workflow, PostgreSQL service container, migration apply, live repository tests, tenant isolation regression, connection secret redaction, artifact retention, failure visibility, retry timeout policy, rollback/rerun, log sanitization, and second-operator evidence. It does not create a remote, edit hosted CI settings, mutate databases, store connection secrets, or approve remote CI proof.

Public remote CI readiness packet, review-only:

```bash
npm run remote-ci:public-readiness-packet -- --environment release-demo --ci-provider github-actions-demo --workflow-suite release-gates-workflow-demo --target-repository scheduleos-ai/scheduleos --workflow-run public-workflow-run-demo --check-run npm-check-run-demo --production-dependency-audit production-dependency-audit-demo --no-git-directory no-git-directory-proof-demo --release-safety-scan release-safety-scan-demo --docs-link-check docs-link-check-demo --license-check license-check-demo --log-sanitization log-sanitization-demo --artifact-retention artifact-retention-demo --branch-protection-review branch-protection-review-demo --repository-settings-readiness repository-settings-readiness-demo --second-operator second-operator-remote-ci-review-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --json
```

public remote CI packet requires explicit public remote workflow run, `npm run check`, production dependency audit, no-.git-directory proof, release safety, documentation link check, license check, log sanitization, artifact retention, branch protection or required-checks review, public repository settings readiness, and second-operator evidence labels. It does not create repositories, initialize git, add remotes, dispatch workflows, store CI secrets, mutate branch protection, mark public remote CI verified, change release gates, push, tag, publish, or announce ScheduleOS.

Clean public history readiness packet, review-only:

```bash
npm run repository:clean-history-readiness-packet -- --environment release-demo --history-scope public-initial-history-demo --source-root scheduleos-local-tree-demo --no-git-directory no-git-directory-proof-demo --release-safety-scan release-safety-scan-demo --first-commit-staging-manifest first-commit-staging-manifest-demo --generated-artifact-review generated-artifact-review-demo --fixture-sanitization fixture-sanitization-demo --license-notice-readiness license-notice-readiness-demo --repository-naming repository-naming-demo --remote-ci-plan remote-ci-plan-demo --second-operator second-operator-clean-history-review-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --json
```

clean history packet records required no-.git-directory, release safety scan, first commit staging manifest, generated artifact review, fixture/sample sanitization, license/notice readiness, repository naming, remote CI plan, and second-operator evidence. The staging manifest lives at `docs/release/first-commit-staging-manifest.md`. It does not initialize git, create repositories, add remotes, push commits, tag releases, mutate package files, mark clean history prepared, publish packages, or announce ScheduleOS.

Generated artifact review packet, review-only:

```bash
npm run release:generated-artifact-review-packet -- --environment release-demo --artifact-scope release-candidate-generated-artifacts-demo --manifest first-commit-staging-manifest-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --json
```

generated artifact packet records required manifest, dist build output, fixture/template/sample output, screenshots/exports/backups/logs, local path/private URL absence, provider identifier minimization, license/NOTICE trigger, first-commit staging alignment, local evidence commands, second-operator evidence. It does not approve generated artifacts, rewrite or delete artifacts, mutate release gates, initialize git, create remotes, push commits, tag releases, publish packages, or announce ScheduleOS.

Repository settings readiness packet, review-only:
```bash
npm run repository:settings-readiness-packet -- --environment release-demo --target-repository scheduleos-ai/scheduleos --settings-profile public-open-source-hardening-demo --branch-policy required-checks-main-demo --branch-protection-settings branch-protection-settings-demo --required-status-checks required-status-checks-demo --security-advisory-settings security-advisory-settings-demo --default-branch-merge-policy default-branch-merge-policy-demo --maintainer-access-review maintainer-access-review-demo --dependabot-alerts dependabot-alerts-demo --secret-scanning-push-protection secret-scanning-push-protection-demo --release-package-permissions release-package-permissions-demo --repository-metadata repository-metadata-demo --public-issue-discussion-settings public-issue-discussion-settings-demo --second-operator second-operator-repository-settings-review-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --json
```
repository settings packet records required branch protection, required status checks, security advisory settings, default branch and merge policy, maintainer access, Dependabot and vulnerability alert settings, secret scanning push-protection review, release/package permission settings, repository metadata, public issue/discussion settings, and second-operator evidence. It does not create repositories, initialize git, add remotes, mutate repository settings, mutate branch protection, configure advisories, change maintainer access, mark repository settings configured, push, tag, publish, or announce ScheduleOS.

Repository launch readiness packet, review-only:
```bash
npm run repository:launch-readiness-packet -- --environment release-demo --target scheduleos-ai/scheduleos --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --history-plan clean-initial-history-demo --final-release-gate final-release-gate-pass-demo --clean-public-history clean-public-history-demo --privacy-secret-scan privacy-secret-scan-demo --license-audit-pass license-audit-pass-demo --security-audit-pass security-audit-pass-demo --security-policy-contact security-policy-contact-demo --remote-ci-pass remote-ci-pass-demo --name-collision-review name-collision-review-demo --trademark-review trademark-review-demo --first-commit-staging first-commit-staging-demo --repository-settings repository-settings-demo --second-operator second-operator-repository-launch-review-demo --json
```
repository launch packet records required final release gate, clean public history, privacy/secret scan, license audit, security audit, security policy contact, remote CI pass, name collision, trademark, first-commit staging, public repository settings, and second-operator evidence. It does not create a public repository, initialize git, add remotes, push commits, tag releases, configure security contacts, publish packages, or announce ScheduleOS.

Security policy contact readiness packet, review-only:

```bash
npm run security:policy-contact-readiness-packet -- --environment release-demo --contact-channel security-contact-form-demo --responsible-party maintainer-security-reviewer-demo --disclosure-workflow vulnerability-disclosure-workflow-demo --advisory-settings repository-advisory-settings-demo --response-sla security-response-sla-demo --escalation-path security-escalation-path-demo --private-report-sanitization private-report-sanitization-demo --remote-ci-security-workflow remote-ci-security-workflow-demo --second-operator second-operator-security-contact-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --json
```

security policy contact packet requires explicit contact-channel, responsible-party, disclosure-workflow, advisory-settings, response-SLA, escalation-path, private-report-sanitization, remote-CI security workflow, and second-operator labels. It records those labels as review-only evidence. It does not configure security contacts, edit repository settings, create public repository, mutate SECURITY.md, mark security audit `PASS`, publish packages, or announce ScheduleOS.

Dependency audit readiness packet, review-only:

```bash
npm run dependency:final-audit-readiness-packet -- --environment release-demo --audit-scope release-candidate-demo --package-manager npm-demo --production-audit production-dependency-audit-demo --lockfile-proof lockfile-reproducibility-demo --installed-tree installed-tree-demo --runtime-inventory runtime-inventory-demo --dev-dependency-exclusion dev-dependency-exclusion-demo --override-review override-review-demo --license-alignment license-alignment-demo --registry-secret-absence registry-secret-absence-demo --remote-ci remote-ci-dependency-audit-demo --second-operator second-operator-dependency-review-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --json
```

dependency audit packet requires explicit production audit, lockfile, installed tree, runtime inventory, dev dependency exclusion, override review, license alignment, registry secret absence, remote CI, and second-operator labels. It records those labels as review-only evidence and lists local evidence commands reviewers should attach: `npm run check`, `npm audit --omit=dev --audit-level=high`, `npm ls --omit=dev --all`, `npm run license:check`, no-`.git` directory proof. It does not install, update, remove, override, publish dependencies, mutate package manifests or lockfiles, configure package registries, mark dependency audit `PASS`, mutate release gates, create remotes, or announce ScheduleOS.

Final security audit readiness packet, review-only:
```bash
npm run security:final-audit-readiness-packet -- --environment release-demo --audit-scope release-candidate-demo --dependency-audit-pass dependency-audit-pass-demo --secret-scan secret-scan-demo --privacy-scan privacy-scan-demo --production-auth production-auth-demo --role-membership role-membership-demo --reset-token-lifecycle reset-token-lifecycle-demo --rate-limit-abuse-monitoring rate-limit-abuse-monitoring-demo --provider-managed-secret-lifecycle provider-managed-secret-lifecycle-demo --deployment-tls-proxy-headers deployment-tls-proxy-headers-demo --remote-ci remote-ci-security-audit-demo --security-policy-contact security-policy-contact-demo --final-source-review final-source-review-demo --second-operator second-operator-security-review-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --json
```
final security audit packet requires explicit dependency audit `PASS`, secret scan, privacy scan, production auth/session, roles/memberships, reset-token lifecycle, rate-limit and abuse-monitoring, provider managed-secret lifecycle, deployment TLS/proxy/header, remote CI, security policy contact, final source review, and second-operator labels. It records those labels as review-only evidence. It does not mark security audit `PASS`, approve production deployment, configure security contacts, mutate release gates, create remotes, publish packages, or announce ScheduleOS.

Final licensing audit readiness packet, review-only:
```bash
npm run licensing:final-audit-readiness-packet -- --environment release-demo --audit-scope release-candidate-demo --final-license-check final-license-check-demo --lockfile-dependency-licenses lockfile-dependency-licenses-demo --installed-dependency-metadata installed-dependency-metadata-demo --copied-source-scan copied-source-scan-demo --fixture-template-example-review fixture-template-example-review-demo --asset-media-font-binary-review asset-media-font-binary-review-demo --documentation-reuse-scan documentation-reuse-scan-demo --reused-material-inventory reused-material-inventory-demo --notice-review notice-review-demo --root-license-consistency root-license-consistency-demo --final-release-candidate-freeze final-release-candidate-freeze-demo --second-operator second-operator-licensing-review-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --json
```
final licensing audit packet records required final license check, lockfile dependency licenses, installed dependency metadata, copied-source scan, fixture/template/example review, asset/media/font/binary review, documentation reuse scan, reused-material inventory, NOTICE review, root Apache-2.0 consistency, final release-candidate freeze, and second-operator evidence. It does not mark licensing audit `PASS`, approve publication, add NOTICE, mutate release gates, create remotes, publish packages, or announce ScheduleOS.

Local licensing evidence commands reviewers should attach: `npm run license:check`, `npm ls --omit=dev --all`, `npm run release:safety`, and the no-`.git` directory proof. These commands are review inputs only; they do not replace reused-material inventory, NOTICE review, final release-candidate freeze, remote CI evidence, or second-operator licensing approval.

Final privacy audit readiness packet, review-only:
```bash
npm run privacy:final-audit-readiness-packet -- --environment release-demo --audit-scope release-candidate-demo --release-safety-scan release-safety-scan-demo --fixture-sanitization fixture-sanitization-demo --generated-artifact-review generated-artifact-review-demo --log-export-backup-review log-export-backup-review-demo --provider-identifier-review provider-identifier-review-demo --local-path-private-url-review local-path-private-url-review-demo --private-leadership-boundary private-leadership-boundary-demo --calendar-task-minimization calendar-task-minimization-demo --ai-redaction-boundary ai-redaction-boundary-demo --retention-export-deletion-revocation retention-export-deletion-revocation-demo --second-operator second-operator-privacy-review-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --json
```
final privacy audit packet requires explicit release safety scan, fixture/sample sanitization, generated artifact review, logs/screenshots/exports/backups review, provider identifier review, local path/private URL review, private compatible leadership system boundary proof, calendar/task minimization proof, AI redaction boundary, retention/export/deletion/provider-revocation, and second-operator evidence labels. It records those labels as review-only evidence. It does not mark privacy audit `PASS`, approve publication, mutate release gates, rewrite generated artifacts, create remotes, publish packages, or announce ScheduleOS.

Final release gate readiness packet, review-only:
```bash
npm run release:final-gate-readiness-packet -- --environment release-demo --release-scope public-release-candidate-demo --functionality-gate functionality-gate-pass-demo --storage-gate storage-gate-pass-demo --documentation-gate documentation-gate-pass-demo --security-audit-pass security-audit-pass-demo --licensing-audit-pass licensing-audit-pass-demo --privacy-audit-pass privacy-audit-pass-demo --dependency-audit-final-pass dependency-audit-final-pass-demo --remote-ci-pass remote-ci-pass-demo --clean-history clean-history-proof-demo --security-policy-contact security-policy-contact-demo --repository-settings repository-settings-demo --final-source-review final-source-review-demo --second-operator second-operator-release-approval-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --json
```
final release gate packet requires explicit functionality, storage, documentation, security audit `PASS`, licensing audit `PASS`, privacy audit `PASS`, dependency audit final pass, remote CI pass, clean public history, security contact, public repository settings, final source/generated-artifact review, and second-operator release approval labels. It records those labels as review-only evidence. It does not approve release, create repositories, initialize git, add remotes, push commits, tag releases, publish packages, deploy production, or announce ScheduleOS.

Provider lifecycle readiness packet, review-only:
```bash
npm run providers:lifecycle-readiness-packet -- --environment production-demo --provider google-calendar-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --managed-secret-custody managed-secret-custody-demo --rotation-drill provider-rotation-drill-demo --revocation-drill provider-revocation-drill-demo --write-back-safety write-back-preview-conflict-demo --hosted-alert-routing provider-hosted-alert-routing-demo --provider-runbook google-calendar-runbook-demo --remote-ci remote-ci-provider-lifecycle-demo --rollback-plan provider-lifecycle-rollback-plan-demo --second-operator second-operator-provider-lifecycle-review-demo --json
```
provider lifecycle packet records required adapter contract evidence plus explicit managed-secret custody, rotation drill, emergency revocation drill, write-back safety, hosted alert routing, provider-specific runbook, remote CI, and rollback labels alongside sync checkpoint idempotency, provider quota, and second-operator evidence. It does not enforce production provider lifecycle, rotate/revoke credentials, write calendar data, configure alerts, or mutate provider connections.

SQLite retention cleanup dry-run:

```bash
npm run retention:sqlite-cleanup -- --database data/scheduleos.db --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-22T12:00:00.000Z --json
```

SQLite retention cleanup apply requires exact confirmation:

```bash
npm run retention:sqlite-cleanup -- --database data/scheduleos.db --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-22T12:00:00.000Z --apply --confirm tenant_demo/workspace_demo/user_jordan/2026-07-22T12:00:00.000Z --json
```

PostgreSQL retention cleanup dry-run:

```bash
SCHEDULEOS_POSTGRES_URL=postgres://scheduleos:scheduleos@localhost:55432/scheduleos_test npm run retention:postgres-cleanup -- --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-22T12:00:00.000Z --json
```

PostgreSQL retention cleanup apply requires exact confirmation:

```bash
SCHEDULEOS_POSTGRES_URL=postgres://scheduleos:scheduleos@localhost:55432/scheduleos_test npm run retention:postgres-cleanup -- --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-22T12:00:00.000Z --apply --confirm tenant_demo/workspace_demo/user_jordan/2026-07-22T12:00:00.000Z --json
```

## PostgreSQL

Dry-run migration:

```bash
npm run build
npm run db:postgres:migrate
```

Apply migration to a configured database:

```bash
SCHEDULEOS_POSTGRES_URL=postgres://user:password@localhost:5432/scheduleos npm run db:postgres:migrate:apply
```

Guarded live Docker test:

```bash
npm run test:postgres:docker
npm run postgres:test:down
```

The live test refuses destructive setup unless the database name includes `scheduleos_test`.

## Self-Hosting

See `docs/self-hosting.md`.

Operations guides:

- `docs/operations/sqlite-storage.md`
- `docs/operations/postgresql-migrations.md`
- `docs/operations/backup-restore-runbook.md`

Current self-hosting status: not production-ready.

## Integrations

- OwnerOps: see `docs/integrations/ownerops.md`.
- ConnectOS: see `docs/integrations/connectos.md`.
- compatible leadership system: see `docs/integrations/leadership-system.md`.
- Calendar providers: see `docs/integrations/calendar-providers.md`.
- Task sources: see `docs/integrations/task-sources.md`.
- Webhook provider policy: see `docs/integrations/webhook-provider-policy.md`.
- Managed secret storage operations: see `docs/operations/managed-secret-storage-runbook.md`.
- Public event receiver operations: see `docs/operations/public-event-webhook-receiver-runbook.md`.
- Public event delivery operations: see `docs/operations/public-event-delivery-operator-runbook.md`.
- Import abuse and provider policy: see `docs/security/import-abuse-and-provider-policy.md`.
- Auth model: see `docs/security/auth-model.md`.
- Admin auth operations: see `docs/operations/admin-auth-runbook.md`.
- Password reset and recovery operations: `docs/operations/password-reset-recovery-runbook.md`.

compatible leadership system may consume ScheduleOS only through the same public interfaces available to any other application. There must be no hidden private leadership-only API.

ScheduleOS is the time-capacity pillar in the compatible leadership system architecture. ConnectOS contributes external signals and approved actions, OwnerOps contributes work ownership and delegation state, ScheduleOS contributes capacity, plans, conflict, and deadline-risk evidence, and compatible leadership system combines those realities into owner-facing leadership decisions.

## Architecture Docs

- `docs/architecture/overview.md`
- `docs/architecture/domain-boundaries.md`
- `docs/architecture/solver-design.md`
- `docs/architecture/integration-model.md`
- `docs/architecture/storage-design.md`
- `docs/architecture/ADR-001-build-foundation.md`
- `docs/architecture/ADR-002-storage-boundaries.md`

## Contributing

See `CONTRIBUTING.md`.

Before opening changes:

```bash
npm run check
npm audit --omit=dev --audit-level=high
```

## Release Readiness

Track release status in:

- `docs/current-state-audit.md`
- `docs/current-state-audit-addendum-20260721.md`
- `docs/public-release-checklist.md`
- `docs/release/repository-readiness.md`
- `docs/security/public-release-security-audit.md`
- `docs/security/public-release-security-audit-addendum-20260721.md`
- `docs/security/licensing-audit.md`

ScheduleOS should remain local and unpublished until all gates pass.

## ICS Recurrence Notes

Daily, weekly, monthly, and yearly ICS import now include `BYHOUR`/`BYMINUTE`/`BYSECOND` time-window expansion, alongside existing local recurrence foundations. Daily time-window `BYSETPOS`, weekly time-window `BYSETPOS`, monthly time-window `BYSETPOS`, daily time windows, weekly `BYDAY`, monthly `BYMONTHDAY`, and yearly `BYMONTH`/`BYMONTHDAY` time-window rules with an IANA `TZID` preserve local wall-clock time across daylight saving changes.

Local ICS import now includes weekly `WKST` week-start handling for interval `BYDAY` rules, alongside the existing local recurrence foundations. This is still not a complete release-grade ICS workflow because production sync UX and production sync-state idempotency remain open.

Local ICS import also expands `RDATE`-only VEVENT entries without requiring an `RRULE`, preserving the original event duration for each requested-range additional date. `RDATE;VALUE=PERIOD` entries may use either `start/end` or `start/duration` period values, and ScheduleOS preserves explicit period duration for those additional occurrences. All-day and timed recurring imports also accept inclusive date-only `UNTIL=YYYYMMDD` bounds.
