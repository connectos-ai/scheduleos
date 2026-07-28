# Production ICS Approval Guard

## Date

2026-07-27

## Scope

Added a local guard that keeps the release-grade ICS workflow gate honest while ScheduleOS remains in release-prep `FAIL` status.

## Files Changed

- `scripts/check-production-ics-approval.mjs`
- `package.json`
- `docs/release-audit/PRODUCTION_ICS_APPROVAL_GUARD_20260727.md`
- `docs/SESSION_TRANSFER_2026-07-27_SCHEDULEOS_RELEASE_PREP_QUICK.md`

## Evidence Preserved

The guard verifies:

- `docs/security/production-ics-approval-checklist.md` still has `Current result: FAIL`.
- The public release checklist keeps `Release-grade ICS workflow` unchecked.
- The production ICS approval checklist still prohibits relying on production ICS sync for public repository creation, hosted deployment, tagging, package publication, or release announcement.
- Required evidence remains listed: provider-shaped fixtures, recurrence/timezone/DST proof, import preview, export privacy redaction, write-back conflict preview, provider-neutral contract review, large calendar fixture, browser workflow, remote CI, rollback, final audits, and second-operator approval.
- The production ICS evidence contract documentation, source, and tests remain present.
- Local provider fixture idempotency evidence remains local-only and does not approve release-grade ICS workflow.

## Non-Approval Caveat

This is not release-grade ICS approval. It does not connect real providers, import real calendars, write calendar data, prove provider write-back, prove remote CI, approve rollback, pass final audits, approve operator review, create a public remote, publish packages, or change release status.

## Release Rule

Keep `Release-grade ICS workflow` unchecked until the production ICS approval checklist changes from `FAIL` to `PASS` with current release-candidate evidence and second-operator review.
