# Hosted Retention Approval Guard

## Date

2026-07-27

## Scope

Added a local guard that keeps the hosted retention cleanup destructive-operation approval gate honest while ScheduleOS remains in release-prep `FAIL` status.

## Files Changed

- `scripts/check-hosted-retention-approval.mjs`
- `package.json`
- `docs/public-release-checklist.md`
- `docs/release-audit/HOSTED_RETENTION_APPROVAL_GUARD_20260727.md`
- `docs/SESSION_TRANSFER_2026-07-27_SCHEDULEOS_RELEASE_PREP_QUICK.md`

## Evidence Preserved

The guard verifies:

- `docs/security/production-hosted-retention-cleanup-approval-checklist.md` still has `Current result: FAIL`.
- The public release checklist keeps `Hosted retention cleanup production destructive-operation approvals` unchecked.
- The hosted retention cleanup approval checklist still prohibits relying on hosted retention cleanup for public repository creation, hosted deployment, tagging, package publication, or release announcement.
- Required evidence items remain listed: hosted dry-run evidence, hosted scheduler controls, operator visibility, external approval record, legal/support review, backup proof, restore proof, rollback plan, audit-retention proof, remote CI proof, and second-operator approval.
- The retention operator runbook keeps review-only hosted cleanup packet guidance and `applyAllowedByPacket` false boundary.
- The retention policy keeps the hosted cleanup and destructive-operation approval release boundary.
- The destructive approval helper and tests keep exact-confirmation behavior.

## Non-Approval Caveat

This is not hosted retention cleanup approval. It does not schedule hosted cleanup jobs, apply retention cleanup, delete records, create external approval records, prove backup/restore evidence, prove remote CI, approve destructive operations, or change release status.

## Release Rule

Keep `Hosted retention cleanup production destructive-operation approvals` unchecked until the hosted retention cleanup approval checklist changes from `FAIL` to `PASS` with current release-candidate evidence and second-operator review.
