# Production Calendar UI Approval Guard

## Date

2026-07-27

## Scope

Added a local guard that keeps the production calendar UI hardening gate honest while ScheduleOS remains in release-prep `FAIL` status.

## Files Changed

- `scripts/check-production-calendar-ui-approval.mjs`
- `package.json`
- `docs/release-audit/PRODUCTION_CALENDAR_UI_APPROVAL_GUARD_20260727.md`
- `docs/SESSION_TRANSFER_2026-07-27_SCHEDULEOS_RELEASE_PREP_QUICK.md`

## Evidence Preserved

The guard verifies:

- `docs/security/production-calendar-ui-approval-checklist.md` still has `Current result: FAIL`.
- The public release checklist keeps `Production calendar UI hardening` unchecked.
- The production calendar UI approval checklist still prohibits relying on production calendar UI proof for public repository creation, hosted deployment, tagging, package publication, or release announcement.
- Required evidence remains listed: browser matrix, interactive conflict-preview workflow, responsive polish, visual regression, product-owner approval, remote CI, rollback, final audits, and second-operator approval.
- The production calendar UI evidence contract documentation, source, and tests remain present.
- The evidence contract still requires Chrome, Firefox, Safari, mobile WebKit, conflict workflow scenarios, accessibility proof, responsive proof, visual states, and second-operator review.
- Local Chrome smoke evidence remains local-only support and still includes desktop render, mobile render, drag/drop, conflict preview, and review acknowledgement.

## Non-Approval Caveat

This is not production calendar UI approval. It does not run a production browser matrix, approve accessibility, approve responsive polish, capture release-candidate visual baselines, grant product-owner approval, prove remote CI, approve rollback, deploy ScheduleOS, create a public remote, publish packages, or change release status.

## Release Rule

Keep `Production calendar UI hardening` unchecked until the production calendar UI approval checklist changes from `FAIL` to `PASS` with current release-candidate evidence and second-operator review.
