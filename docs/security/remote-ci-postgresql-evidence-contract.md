# Remote CI PostgreSQL Evidence Contract

Remote CI PostgreSQL approval is tracked in `docs/security/remote-ci-postgresql-approval-checklist.md`. This document defines the local evidence contract used to review that gate.

This document does not create a remote repository, edit hosted CI settings, mutate databases, store connection secrets, approve remote CI PostgreSQL proof, mark audits `PASS`, publish packages, or announce ScheduleOS.

## Status

Current result: `FAIL`.

ScheduleOS now has a local remote CI PostgreSQL evidence validator in `src/remote-ci-postgresql-evidence-contract.ts` with tests in `src/remote-ci-postgresql-evidence-contract.test.ts`. It validates evidence shape only.

## Contract Purpose

Successful remote CI PostgreSQL proof must show that a real public-repository workflow can provision a disposable PostgreSQL service, apply migrations from a clean database, run guarded live repository tests, protect tenant boundaries, expose failures, retain safe review artifacts, and keep secrets out of logs.

The validator checks:

- GitHub Actions provider, public repository workflow run, workflow-file review, bounded job timeout, read-only permissions, concurrency cancellation, and step-summary proof.
- PostgreSQL version recording, disposable service container, health check, network isolation, scoped database user, and CI-secret connection URL injection.
- Clean database migration apply, migration version-order proof, live repository tests, tenant-isolation regression, auth repository coverage, retention cleanup coverage, and `npm run test:postgres:live`.
- Failure visibility for migration, connection, repository test, and tenant-isolation failures.
- Job log retention and artifact retention.
- Service readiness, migration apply, live-test, and stuck-job timeout/cancellation evidence.
- Rerun, workflow rollback, and service-version rollback procedures.
- Log sanitization excluding raw database URLs, passwords, tokens, private hostnames, private paths, customer data, calendar/task data, and private compatible leadership system material.
- Remote CI PostgreSQL proof acceptance, final audits, operator review, and second-operator review.

## Required Command

Remote CI PostgreSQL evidence must prove the live-service job runs:

```bash
npm run test:postgres:live
```

## Privacy Boundary

Evidence must not include raw database URLs, database passwords, tokens, private hostnames, private machine paths, customer data, calendar data, task data, private compatible leadership system material, or real provider payloads.

Use privacy-safe demo identifiers such as:

```text
ci_demo
tenant_demo
workspace_demo
user_jordan
postgres_service_demo
postgres_live_run_demo
remote_ci_postgres_artifact_demo
second_operator_postgres_review_demo
```

## Verification

Focused verification:

```bash
npm run build
node --test dist/remote-ci-postgresql-evidence-contract.test.js
```

Full verification:

```bash
npm run check
npm audit --omit=dev --audit-level=high
find . -maxdepth 2 -name .git -type d -print
```

## Release Boundary

This contract is a local foundation. ScheduleOS release status remains `FAIL` until a real public-repository remote CI workflow run proves PostgreSQL service startup, clean migration apply, live repository tests, tenant isolation, sanitized logs, retained artifacts, failure visibility, rerun/rollback procedure, final audits, and second-operator review.
