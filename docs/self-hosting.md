# Self-Hosting ScheduleOS

## Status

Draft guide. ScheduleOS is not ready for production self-hosting yet.

## What Works Today

- Local TypeScript build and tests.
- Dependency-free local API foundation.
- In-memory default state for development.
- Optional JSON-backed local persistence.
- SQLite migration foundation.
- PostgreSQL schema, migration runner, and guarded live test path.

## Minimum Local Run

```bash
npm install
npm run check
npm run dev
```

Open `http://127.0.0.1:8787/app` after the server prints the local URL.

## Local API Mode

The current local API is a foundation for development and tests. It is not a hardened production service.

Recommended local environment shape:

```bash
SCHEDULEOS_HOST=127.0.0.1
SCHEDULEOS_PORT=8787
SCHEDULEOS_API_KEY=dev_scheduleos_change_me
SCHEDULEOS_API_ROLE=EDITOR
SCHEDULEOS_TENANT_ID=tenant_demo
SCHEDULEOS_WORKSPACE_ID=workspace_demo
SCHEDULEOS_USER_ID=user_jordan
SCHEDULEOS_AUTH_SESSION_COOKIE=false
SCHEDULEOS_AUTH_SESSION_COOKIE_SECURE=false
SCHEDULEOS_STORAGE_PATH=.local/scheduleos.dev.json
```

Do not expose the local API publicly.

`npm run dev` builds ScheduleOS and starts the local app/API server. After a build already exists, `npm start` runs `dist/server.js` directly. By default, the server binds to `127.0.0.1:8787`. `SCHEDULEOS_API_ROLE` defaults to `EDITOR`; set it intentionally to `OWNER` only for trusted local bootstrap/admin work.

Optional session-cookie transport is disabled by default. When `SCHEDULEOS_AUTH_SESSION_COOKIE=true`, session creation can set an `HttpOnly`, `SameSite=Lax`, `Path=/` cookie and cookie-authenticated write requests must include the returned `x-scheduleos-csrf-token`. `DELETE /api/auth/session` revokes the current bearer or cookie session and clears the configured browser session cookie. Set `SCHEDULEOS_AUTH_SESSION_COOKIE_SECURE=true` only behind TLS or a trusted TLS-terminating proxy.

## Local Planning App

The local API serves a dependency-free planning app shell at `/app` and `/`. It supports the standalone ScheduleOS loop: set workspace scope, save working hours, add/edit/delete fixed busy events, review and confirm ICS fixed-event imports, add/edit/delete tasks, preview and confirm CSV or JSON task imports, create a day or week plan, replan after changes, review unscheduled warnings and grounded plan explanations, accept or reject the plan, export accepted blocks as ICS, drag scheduled blocks to another visible slot or move them with keyboard-accessible earlier/later buttons, and mark blocks locked, done, or missed through the existing time-block API.

If static API-key auth is enabled, enter the local API key in the app header before making API changes. The page shell itself does not include private data.

## PostgreSQL

Build before running migrations:

```bash
npm run build
```

Dry-run migration:

```bash
npm run db:postgres:migrate
```

Apply migration:

```bash
SCHEDULEOS_POSTGRES_URL=postgres://user:password@localhost:5432/scheduleos npm run db:postgres:migrate:apply
```

Guarded local PostgreSQL test:

```bash
npm run test:postgres:docker
npm run postgres:test:down
```

The live test refuses destructive setup unless the database name includes `scheduleos_test`.

## Webhook Secrets

Signed generic webhooks use `webhookSecrets[sourceSystem]`. A source may have a single secret or a short rotation list:

```ts
createApiServer({
  webhookSecrets: {
    GENERIC_WEBHOOK: ["current_secret", "previous_secret"]
  },
  webhookReplayWindows: {
    GENERIC_WEBHOOK: 5 * 60 * 1000
  }
});
```

Rules:

- Each configured source must include at least one non-empty secret.
- Blank strings and empty rotation lists are rejected when the API server starts.
- Rotation lists are for overlap windows only; remove old secrets after the provider has moved to the current secret.
- Signed webhooks still require timestamp, event id, and valid `sha256` HMAC headers.
- Use `webhookReplayWindows[sourceSystem]` for source-specific replay windows; values must be positive.

This is local rotation-overlap support, not full production secret lifecycle management.

## Import Throttle Policy

ScheduleOS can throttle imported rows for webhook, JSON, CSV, and ICS imports. The local API accepts a global `importThrottle` policy plus optional source-specific overrides:

```ts
createApiServer({
  importThrottle: {
    windowMs: 60_000,
    maxRows: 500,
 enforceProviderPolicies: true,
    sourcePolicies: {
      GENERIC_WEBHOOK: { windowMs: 60_000, maxRows: 100 },
      JSON_IMPORT_RESTRICTED: { windowMs: 60_000, maxRows: 25 }
    }
  }
});
```

Rules:

- `windowMs` and `maxRows` must be positive for the global policy and every `sourcePolicies` entry.
- Invalid global or source-specific policies are rejected when the API server starts.
- Throttle state is scoped by tenant, workspace, user, source system, and import operation.
- JSON and CSV dry-run task imports do not consume throttle rows.
- Known catalog sources use built-in provider policies when `enforceProviderPolicies` is true, unless `sourcePolicies` explicitly overrides that source.
- Unknown sources use the global policy.

This is a local/self-host foundation, not final production abuse protection. Horizontally scaled production still needs distributed throttling, provider-specific quota governance, abuse analytics, and operational alerting.

## Import Abuse Alert Thresholds

Local/self-host operators can configure summary-only alert thresholds in standalone server mode:

```text
SCHEDULEOS_IMPORT_ABUSE_ALERT_DENIED_EVENTS=3
SCHEDULEOS_IMPORT_ABUSE_ALERT_DENIED_ROWS=25
```

When a threshold is met, `GET /api/import-abuse/summary` returns `alert.status: "REVIEW_REQUIRED"` with threshold and trigger metadata. This does not send hosted alerts, create dashboards, or replace production abuse analytics.

## Public Event Delivery Alert Thresholds

Local/self-host operators can configure summary-only delivery-health thresholds in standalone server mode:

```text
SCHEDULEOS_PUBLIC_EVENT_DELIVERY_ALERT_FAILED_ATTEMPTS=3
SCHEDULEOS_PUBLIC_EVENT_DELIVERY_ALERT_RETRYABLE_FAILED_ATTEMPTS=3
```

When a threshold is met, `GET /api/events/webhook-deliveries/summary` returns `alert.status: "REVIEW_REQUIRED"` with threshold and trigger metadata. This does not send hosted alerts, create dashboards, or replace production delivery observability.

## Public Event Subscription Health Alert Thresholds

Local/self-host operators can configure summary-only subscription-health thresholds in standalone server mode:

```text
SCHEDULEOS_PUBLIC_EVENT_SUBSCRIPTION_HEALTH_ALERT_FAILING_SUBSCRIPTIONS=1
SCHEDULEOS_PUBLIC_EVENT_SUBSCRIPTION_HEALTH_ALERT_EXHAUSTED_SUBSCRIPTIONS=1
SCHEDULEOS_PUBLIC_EVENT_SUBSCRIPTION_HEALTH_ALERT_NEVER_DELIVERED_SUBSCRIPTIONS=3
```

When a threshold is met, `GET /api/events/webhook-subscriptions/health` returns `alert.status: "REVIEW_REQUIRED"` threshold trigger metadata. This does not send hosted alerts, create dashboards, replace production subscription delivery observability, or replace durable worker monitoring.

## Public Event Dead-Letter Queue Alert Thresholds

Local/self-host operators can configure summary-only dead-letter queue thresholds in standalone server mode:

```text
SCHEDULEOS_PUBLIC_EVENT_DEAD_LETTER_QUEUE_ALERT_UNREVIEWED_ITEMS=1
```

When threshold met, `GET /api/events/webhook-deliveries/dead-letter/queue` returns `alert.status: "REVIEW_REQUIRED"` with threshold trigger metadata for unreviewed queue item counts. This does not send hosted alerts, create dashboards, replace production dead-letter queues, or replace durable worker monitoring.

## Operations

- SQLite local/small self-host operations: [SQLite Storage Operations](operations/sqlite-storage.md).
- PostgreSQL migration operations: [PostgreSQL Migrations](operations/postgresql-migrations.md).
- Managed secret storage production contract: [Managed Secret Storage Runbook](operations/managed-secret-storage-runbook.md).
- Backup and restore procedure foundation: [Backup And Restore Runbook](operations/backup-restore-runbook.md).

Backups and workspace exports can contain private task, calendar, schedule-plan, audit, and integration-state data. Do not commit them. Encrypt backups before off-host copy.

## Production Gaps

Do not self-host ScheduleOS for real user data until these are complete:

- Production persisted auth, sessions, roles, and membership model.
- Production login/logout UX, credential lifecycle/password hashing policy, identity-provider integration, production admin UX/runbooks, hosted session cleanup, and remote live authorization proof.
- Tenant and workspace authorization at every API and storage boundary.
- Token encryption and provider connection hardening.
- Hosted retention cleanup and destructive-operation approval workflow.
- Operational logging and redaction.
- Production distributed rate limits, request size limits, request throttling, provider quota enforcement, hosted alerts, and abuse analytics.
- Secret scanning and privacy audit.
- Live PostgreSQL proof in CI.
- Release-candidate documentation and support policy.
