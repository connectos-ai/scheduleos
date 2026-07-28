# Production Web App Approval Guard

## Date

2026-07-27

## Scope

Added a local guard that keeps the standalone production web app approval gate honest while ScheduleOS remains in release-prep `FAIL` status.

## Files Changed

- `scripts/check-production-web-app-approval.mjs`
- `package.json`
- `docs/public-release-checklist.md`
- `docs/release-audit/PRODUCTION_WEB_APP_APPROVAL_GUARD_20260727.md`
- `docs/SESSION_TRANSFER_2026-07-27_SCHEDULEOS_RELEASE_PREP_QUICK.md`

## Evidence Preserved

The guard verifies:

- `docs/security/production-web-app-approval-checklist.md` still has `Current result: FAIL`.
- The public release checklist keeps `Standalone production web app beyond local foundations` unchecked.
- The production web app approval checklist still prohibits relying on production web app proof for public repository creation, hosted deployment, tagging, package publication, or release announcement.
- Required evidence items remain listed: production build artifact, deployment target, authenticated write-flow, cookie/CSRF transport, request throttle, durable storage, browser matrix, accessibility audit, responsive polish, visual regression, operator review, remote CI proof, rollback plan, and second-operator approval.
- The production web app evidence contract still covers deployment, authenticated writes, platform security, storage/operations, browser quality, required browsers, and second-operator review.
- The evidence contract documentation and tests remain present.
- Local Chrome smoke evidence remains local-only support and still includes desktop render, mobile render, conflict preview, and review acknowledgement.

## Non-Approval Caveat

This is not production web app approval. It does not deploy ScheduleOS, configure hosting, create remotes, run a production browser matrix, approve accessibility or visual regression, prove remote CI, approve rollback, publish packages, or change release status.

## Release Rule

Keep `Standalone production web app beyond local foundations` unchecked until the production web app approval checklist changes from `FAIL` to `PASS` with current release-candidate evidence and second-operator review.
