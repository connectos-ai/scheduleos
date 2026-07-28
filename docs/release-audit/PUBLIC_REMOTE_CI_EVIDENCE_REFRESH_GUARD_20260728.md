# Public Remote CI Evidence Refresh Guard

Date: 2026-07-28

## Result

Added a local public remote CI evidence refresh guard while ScheduleOS remains in release-prep `FAIL` status.

## Scope

- Verifies no local `.git` directory exists.
- Verifies the future GitHub Actions workflow keeps manual dispatch, pull request and main-branch push triggers, read-only contents permission, concurrency cancellation, Node 22 npm install, `npm run check`, production dependency audit, production dependency tree evidence, and step-summary review notes.
- Verifies the PostgreSQL live-service job keeps the disposable PostgreSQL service, health check, test database URL, `npm run test:postgres:live`, and non-approval review note.
- Rejects CI workflow drift toward `pull_request_target`, write permissions, publish, release, tag, push, deployment-token, package, page, or upload-artifact behavior.
- Verifies workflow validator and tests keep required evidence hooks and forbidden release-mutation coverage.
- Verifies the public remote CI approval checklist remains `FAIL`, keeps release-use prohibitions, and still requires workflow run proof, dependency audit, no-`.git` proof, release safety, docs links, license check, PostgreSQL proof, log sanitization, artifact retention, branch protection, repository settings, failure visibility, rerun/rollback, and second-operator evidence.
- Verifies repository settings, repository launch, clean-history, dependency audit, and remote PostgreSQL approval checklists keep public remote CI dependencies visible.
- Verifies package wiring keeps `ci:workflow`, public remote CI approval guard, public remote CI evidence refresh guard, and review-only public remote CI readiness packet available.

## Boundary

This is not public remote CI approval. The guard does not create repositories, initialize git, add remotes, dispatch hosted workflows, upload artifacts, store CI secrets, mutate branch protection, configure repository settings, verify public remote CI, mark PostgreSQL remote proof complete, push, tag, publish packages, deploy hosting, mark release gates `PASS`, or announce ScheduleOS. ScheduleOS release status remains `FAIL`.
