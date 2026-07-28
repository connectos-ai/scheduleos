# Hosted Public-Event Approval Guard

## Date

2026-07-27

## Scope

Added a local guard that keeps the production managed-secret and hosted public-event worker gate honest while ScheduleOS remains in release-prep `FAIL` status.

## Files Changed

- `scripts/check-hosted-public-event-approval.mjs`
- `package.json`
- `docs/public-release-checklist.md`
- `docs/release-audit/HOSTED_PUBLIC_EVENT_APPROVAL_GUARD_20260727.md`
- `docs/SESSION_TRANSFER_2026-07-27_SCHEDULEOS_RELEASE_PREP_QUICK.md`

## Evidence Preserved

The guard verifies:

- `docs/security/production-managed-secret-public-event-approval-checklist.md` still has `Current result: FAIL`.
- The public release checklist keeps `Production managed secret storage and durable hosted public-event workers/observability` unchecked.
- The hosted delivery checklist still prohibits relying on hosted public-event delivery for public repository creation, hosted deployment, tagging, package publication, or release announcement.
- Required evidence remains listed: managed-secret provider, runtime identity, rotation/revocation drill, worker topology, retry queue, dead-letter queue, hosted dashboard, alert routing, replay boundary, incident drill, remote CI, rollback, final audits, and second-operator approval.
- The hosted public-event delivery contract documentation, source, and tests remain present.
- Existing hosted public-event delivery contract audit remains explicit that the evidence is local/review-only.

## Non-Approval Caveat

This is not production hosted public-event worker approval. It does not configure managed secrets, start hosted workers, create queues, send alerts, replay deliveries, prove remote CI, approve rollback, pass final audits, approve operator review, create a public remote, publish packages, or change release status.

## Release Rule

Keep `Production managed secret storage and durable hosted public-event workers/observability` unchecked until the production managed-secret public-event approval checklist changes from `FAIL` to `PASS` with current release-candidate evidence and second-operator review.
