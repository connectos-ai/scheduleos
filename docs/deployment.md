# Deployment

## Status

Draft deployment notes. ScheduleOS is pre-release and should not be deployed for production use yet.

## Current Deployment Shape

ScheduleOS currently builds as a TypeScript package with a local API foundation and storage adapters. There is no production web app, hosted service, container image, or release artifact.

## Required Environment

- Node.js 20 or newer.
- npm.
- Optional PostgreSQL for production-directed storage work.

## Build

```bash
npm install
npm run build
npm test
```

The public release gate uses:

```bash
npm run check
npm audit --omit=dev --audit-level=high
```

## Production Deployment Readiness Packet

ScheduleOS includes a review-only production deployment packet for deployment evidence collection:

```bash
npm run deployment:production-readiness-packet -- --environment production-demo --deployment-topology reverse-proxy-container-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --json
```

The packet records required TLS termination, reverse proxy header, security header, startup guard, health check, durable storage, secure cookie/CSRF transport, trusted proxy/throttle, static asset cache, log redaction, backup/rollback, remote CI deployment smoke, and second-operator evidence.

It does not approve production deployment, configure hosting, mutate DNS, write secrets, start services, create a public remote, publish packages, or announce ScheduleOS.

## Database Migrations

Dry-run:

```bash
npm run db:postgres:migrate
```

Apply:

```bash
SCHEDULEOS_POSTGRES_URL=postgres://user:password@host:5432/scheduleos npm run db:postgres:migrate:apply
```

## Pre-Production Checklist

- Use HTTPS at the edge.
- Set strong secrets outside source control.
- Keep `SCHEDULEOS_HOST=127.0.0.1` for local-only deployments; production
  public binds such as `0.0.0.0` require configured authentication.
- Production public binds also require request throttling; set
  `SCHEDULEOS_RATE_LIMIT_MAX_REQUESTS` or `SCHEDULEOS_RATE_LIMIT_WINDOW_MS`.
- Production public binds also require persisted request throttling; set
`SCHEDULEOS_RATE_LIMIT_PERSISTED=true` with durable storage.
- Production public binds also require durable storage; set
  `SCHEDULEOS_STORAGE_PATH` before binding beyond localhost.
- Replace the `.env.example` `SCHEDULEOS_API_KEY` value before production;
  startup rejects the default development key in `NODE_ENV=production`.
- Replace `.env.example` tenant/workspace/user IDs before production static
API-key auth; startup rejects omitted or demo scope IDs.
- Set `SCHEDULEOS_AUTH_SESSION_COOKIE_SECURE=true` whenever `SCHEDULEOS_AUTH_SESSION_COOKIE=true` in `NODE_ENV=production`; startup rejects insecure production cookie sessions.
- Keep `SCHEDULEOS_AUTH_PASSWORD_RESET_RETURN_TOKEN=false` in production; startup rejects raw reset-token return when `NODE_ENV=production`.
- Restrict database network access.
- Use least-privilege database credentials.
- Encrypt provider tokens before direct calendar or task-source adapters are enabled.
- Store logs with redaction.
- Configure backups and restore rehearsal.
- Configure request limits and import throttles for expected tenant/source load.
- Set `SCHEDULEOS_RATE_LIMIT_WINDOW_MS` and `SCHEDULEOS_RATE_LIMIT_MAX_REQUESTS` for local/self-host request throttling when running the standalone server.
- Set `SCHEDULEOS_RATE_LIMIT_PERSISTED=true` only with storage configured when self-hosted authenticated request throttles should survive process restarts; this stores hashed scoped request keys and does not replace production edge/distributed abuse controls.
- Set `SCHEDULEOS_RATE_LIMIT_TRUSTED_PROXY_HEADER=x-forwarded-for` or `x-real-ip` only when ScheduleOS is behind a reverse proxy you control and that proxy strips untrusted inbound forwarding headers before adding its own client IP value.
- Validate `importThrottle.windowMs`, `importThrottle.maxRows`, and every `importThrottle.sourcePolicies` value is positive before startup.
- Review `GET /api/import-policies` local/self-host provider import policy guidance before enabling provider CSV, bridge, or calendar imports.
- Run dependency, license, secret, and privacy scans.
- Verify tenant isolation and authorization tests.

## Current Blockers

Deployment remains blocked by incomplete production auth, incomplete production UI, incomplete release audit, incomplete security/privacy scan, and missing verified live PostgreSQL CI proof.
