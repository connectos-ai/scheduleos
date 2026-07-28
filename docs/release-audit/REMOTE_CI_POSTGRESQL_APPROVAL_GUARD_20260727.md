# Remote CI PostgreSQL Approval Guard

## Date

2026-07-27

## Scope

Added a local guard that keeps the remote CI PostgreSQL proof gate honest while ScheduleOS remains in release-prep `FAIL` status.

## Files Changed

- `scripts/check-remote-ci-postgresql-approval.mjs`
- `package.json`
- `docs/public-release-checklist.md`
- `docs/release-audit/REMOTE_CI_POSTGRESQL_APPROVAL_GUARD_20260727.md`
- `docs/SESSION_TRANSFER_2026-07-27_SCHEDULEOS_RELEASE_PREP_QUICK.md`

## Evidence Preserved

The guard verifies:

- `docs/security/remote-ci-postgresql-approval-checklist.md` still has `Current result: FAIL`.
- The public release checklist keeps `Successful remote CI PostgreSQL proof` unchecked.
- The remote CI PostgreSQL approval checklist still prohibits relying on remote CI PostgreSQL proof for public repository creation, hosted deployment, tagging, package publication, or release announcement.
- The remote CI PostgreSQL evidence contract still covers workflow proof, disposable PostgreSQL service proof, migrations and live tests, failure visibility, retry/timeout/rollback, sanitization, and operations review.
- The contract still requires public repository run evidence, disposable service evidence, clean migration apply evidence, tenant isolation regression, log/artifact retention, database secret redaction, private compatible leadership system-material exclusion, and second-operator review.
- `.github/workflows/ci.yml` still contains the future PostgreSQL live-test foundation using `postgres:16-alpine`, `SCHEDULEOS_TEST_POSTGRES_URL`, and `npm run test:postgres:live`.
- The evidence contract documentation and tests remain present.

## Non-Approval Caveat

This is not remote CI PostgreSQL approval. It does not create a public repository, dispatch a hosted workflow, provision a remote CI PostgreSQL service, store CI secrets, mutate databases, prove public remote CI, or change release status.

## Release Rule

Keep `Successful remote CI PostgreSQL proof` unchecked until the remote CI PostgreSQL approval checklist changes from `FAIL` to `PASS` with current release-candidate hosted CI evidence and second-operator review.
