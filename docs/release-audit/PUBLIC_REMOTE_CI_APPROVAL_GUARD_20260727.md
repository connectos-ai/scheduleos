# Public Remote CI Approval Guard

## Date

2026-07-27

## Scope

Added a local guard that keeps the public remote CI approval gate honest while ScheduleOS remains in release-prep `FAIL` status.

## Files Changed

- `scripts/check-public-remote-ci-approval.mjs`
- `package.json`
- `docs/public-release-checklist.md`
- `docs/release-audit/PUBLIC_REMOTE_CI_APPROVAL_GUARD_20260727.md`
- `docs/SESSION_TRANSFER_2026-07-27_SCHEDULEOS_RELEASE_PREP_QUICK.md`

## Evidence Preserved

The guard verifies:

- `docs/release/public-remote-ci-approval-checklist.md` still has `Current result: FAIL`.
- The public release checklist keeps `CI run verified on public remote` unchecked.
- The public remote CI approval checklist still prohibits relying on public remote CI for release, tagging, package publication, hosted deployment, or release announcement.
- Required evidence items remain listed: workflow run proof, production dependency audit, no-`.git` proof, release safety, docs link check, license check, PostgreSQL remote CI, log sanitization, artifact retention, branch protection, repository settings, failure visibility/rerun/rollback, and second-operator approval.
- The future GitHub Actions workflow keeps manual dispatch, pull request, read-only permissions, concurrency cancellation, `npm run check`, production dependency audit, dependency tree evidence, step-summary evidence, PostgreSQL live-service job, and live PostgreSQL tests.
- The CI workflow validator still checks required evidence hooks and forbidden release-mutation patterns.
- The public remote CI readiness packet script remains available.

## Non-Approval Caveat

This is not public remote CI approval. It does not create a public repository, initialize git, add remotes, dispatch hosted workflows, store CI secrets, mutate branch protection, verify public remote CI, push, tag, publish packages, or change release status.

## Release Rule

Keep `CI run verified on public remote` unchecked until the public remote CI approval checklist changes from `FAIL` to `PASS` with current public-repository evidence, clean public history approval, repository settings approval, and second-operator review.
