# Production Auth Approval Guard

## Date

2026-07-27

## Scope

Added a local guard that keeps the production auth approval gate honest while ScheduleOS remains in release-prep `FAIL` status.

## Files Changed

- `scripts/check-production-auth-approval.mjs`
- `package.json`
- `docs/release-audit/PRODUCTION_AUTH_APPROVAL_GUARD_20260727.md`
- `docs/SESSION_TRANSFER_2026-07-27_SCHEDULEOS_RELEASE_PREP_QUICK.md`

## Evidence Preserved

The guard verifies:

- `docs/security/production-auth-approval-checklist.md` still has `Current result: FAIL`.
- The public release checklist keeps `Production persisted auth, roles, memberships, session model approved for public release` unchecked.
- The auth approval checklist still prohibits relying on production auth for public repository creation, hosted deployment, tagging, package publication, or release announcement.
- The production auth evidence contract still covers identity, durable session storage, authorization, reset tokens, transport, lockout/retention, operations, browser flows, and final approval.
- The authorization evidence matrix still includes owner, admin, editor, viewer, disabled user, inactive membership, cross-tenant, cross-workspace, and cross-user scenarios.
- The evidence contract documentation and tests remain present.

## Non-Approval Caveat

This is not production auth approval. It does not configure an identity provider, create sessions, run auth migrations, prove hosted cookie/CSRF behavior, prove remote CI, create a public repository, or change release status.

## Release Rule

Keep the production auth blocker unchecked until the production auth approval checklist changes from `FAIL` to `PASS` with current release-candidate evidence and second-operator review.
