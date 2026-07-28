# Remote CI PostgreSQL Approval Checklist

## Status

Current result: `FAIL`.

ScheduleOS has local Docker PostgreSQL proof, a guarded live PostgreSQL spec, and a review-only remote CI PostgreSQL readiness packet. Successful remote CI PostgreSQL proof is not approved for public release until the evidence below is attached, reviewed, and accepted.

No public repository, hosted deployment, tag, package publication, or release announcement may rely on remote CI PostgreSQL proof until this checklist changes to `PASS`.

## Verified Local Foundations

Current local evidence covers:

- PostgreSQL schema migration runner.
- PostgreSQL migration disk loading and version-order behavior.
- PostgreSQL repositories for tasks, calendar events, working hours, schedule plans, time blocks, audit events, import throttles, request throttles, auth, integration state, and retention cleanup.
- Tenant/workspace/user scope checks across PostgreSQL repositories.
- PostgreSQL migration tests for required production tables, tenant-scope indexes, JSONB payloads, and provider-secret exclusion from integration state.
- Guarded live PostgreSQL spec.
- Successful local Docker PostgreSQL proof.
- `.github/workflows/ci.yml` includes a future public `postgres-live` GitHub Actions job using a disposable `postgres:16-alpine` service, bounded timeout, `SCHEDULEOS_TEST_POSTGRES_URL`, `npm run test:postgres:live`, and a step-summary proof note.
- Remote CI PostgreSQL readiness packet foundation.

These foundations do not prove a hosted remote CI workflow runs successfully, provisions PostgreSQL safely, applies migrations from a clean database, runs live repository tests, redacts connection secrets, preserves artifacts, exposes failures, or has second-operator approval.

## Evidence Contract Foundation

ScheduleOS now includes a local evidence-contract validator for the future remote CI PostgreSQL proof:

- Contract: `src/remote-ci-postgresql-evidence-contract.ts`.
- Tests: `src/remote-ci-postgresql-evidence-contract.test.ts`.
- Documentation: `docs/security/remote-ci-postgresql-evidence-contract.md`.

The contract requires evidence for public GitHub Actions workflow proof, workflow review, bounded permissions/timeouts, disposable PostgreSQL service setup, clean migration apply, live repository tests, tenant isolation regression coverage, auth and retention coverage, failure visibility, log and artifact retention, retry/timeout/rollback procedures, log sanitization, final security/privacy/licensing audit status, operator review, and second-operator review.

This foundation validates evidence shape only. It does not create a remote repository, dispatch hosted CI, provision a remote PostgreSQL service, store CI secrets, mark this checklist `PASS`, or complete the successful remote CI PostgreSQL proof gate.

## Required Evidence Before PASS

Attach current evidence for every item:

- Remote CI workflow proof from the intended public repository CI provider.
- PostgreSQL service container proof showing version, health check, network isolation, scoped database/user, startup wait, and teardown behavior.
- Migration apply proof from a clean remote CI PostgreSQL database.
- Live PostgreSQL repository test proof against the remote CI service database.
- Tenant isolation regression proof in remote CI.
- Connection secret redaction proof for CI logs, artifacts, environment dumps, failed command output, and test diagnostics.
- Artifact retention proof covering test output, logs, summaries, failure screenshots if any, and retention duration.
- CI failure visibility proof covering failed migration, failed connection, failed repository test, and failed tenant-isolation regression cases.
- Retry and timeout policy proof covering service readiness, migration apply, live tests, and stuck job cancellation.
- Rollback or rerun procedure proof for failed migrations, bad workflow edits, broken service versions, and flaky CI.
- Remote CI log sanitization review confirming no raw database URLs, passwords, tokens, private hostnames, private paths, customer data, calendar data, task data, or private compatible leadership system material.
- Security, privacy, and licensing audits remain `PASS` after attaching remote CI PostgreSQL evidence.
- Second operator approves the final remote CI PostgreSQL evidence packet.

## Required Commands

Run before changing this checklist to `PASS`:

```bash
npm run check
npm audit --omit=dev --audit-level=high
find . -maxdepth 2 -name .git -type d -print
```

The no-`.git` check must return no output until intentional clean public repository history is prepared.

## Review-Only Packet

Use this command to prepare evidence labels only:

```bash
npm run remote-ci:postgres-readiness-packet -- --environment ci-demo --ci-provider github-actions-demo --postgres-service postgres-service-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --json
```

This packet does not create a remote, edit hosted CI settings, mutate databases, store connection secrets, mark remote CI PostgreSQL proof complete, mark audits `PASS`, publish packages, or announce ScheduleOS.

## Current Remaining Risk

High. Local PostgreSQL coverage is meaningful, but successful remote CI PostgreSQL proof remains unverified until a real public-repository workflow run applies migrations and live repository tests against a remote CI PostgreSQL service with sanitized logs, retained artifacts, failure visibility, rerun/rollback procedure, final audits, and second-operator review.

## Release Rule

Do not mark "Successful remote CI PostgreSQL proof" complete until this checklist changes from `FAIL` to `PASS` with current release-candidate evidence.
