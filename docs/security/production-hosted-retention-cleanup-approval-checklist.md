# Production Hosted Retention Cleanup Approval Checklist

## Status

Current result: `FAIL`.

ScheduleOS has local/self-host retention cleanup foundations and review-only destructive approval packets. Hosted retention cleanup production destructive-operation approvals are not approved for public release until the evidence below is attached, reviewed, and accepted.

No public repository, hosted deployment, tag, package publication, or release announcement may rely on hosted retention cleanup until this checklist changes to `PASS`.

## Verified Local Foundations

Current local evidence covers:

- Retention policy duration foundation.
- Local JSON-backed API retention cleanup dry-run and apply foundation.
- SQLite and PostgreSQL retention cleanup foundations.
- Exact-confirmation helper for destructive SQLite restore, workspace delete, and retention cleanup apply commands.
- Retention cleanup prunes expired/revoked auth-session hashes, expired/used password-reset-token hashes, and stale credential-attempt windows without raw secret output.
- Retention cleanup dry-run reports scoped eligible records without deleting.
- Retention cleanup apply refuses mutation without exact confirmation.
- Owner/admin authorization foundation for local retention cleanup.
- Backup/restore runbook foundation in `docs/operations/backup-restore-runbook.md`.
- Retention operator runbook foundation in `docs/operations/retention-operator-runbook.md`.
- `retention:hosted-cleanup-packet` review-only evidence labels for hosted cleanup approval review.
- `retention:destructive-approval-readiness-packet` review-only evidence labels for destructive operation approval review.

These foundations do not approve hosted scheduled cleanup, destructive production mutation, external approval records, legal/support signoff, backup proof, restore proof, hosted scheduler controls, remote CI, rollback readiness, or second-operator release approval.

## Required Evidence Before PASS

Attach current evidence for every item:

- Hosted dry-run evidence lists scoped eligible records, no mutation, no raw tokens, no raw secrets, no private payloads, and clear before/after counts.
- Backup evidence proves a fresh backup exists for the affected environment, scope, storage backend, and maintenance window.
- Restore evidence proves the fresh backup can be restored or validated before destructive cleanup is approved.
- External approval record documents the exact operation, scope, environment, actor, second operator, legal/support review, maintenance window, rollback plan, and approval timestamp.
- Legal/support review confirms retention policy, customer/support expectations, deletion scope, audit retention, and recovery limitations.
- Exact confirmation proof matches the production operation, scope, and maintenance window.
- Hosted scheduler controls show cleanup jobs can be disabled, paused, resumed, bounded by scope, and prevented from running during rollback.
- Production operator visibility covers dry-run summaries, apply summaries, failed cleanup attempts, partial cleanup, skipped records, and alert routing.
- Rollback plan reviewed for restore path, scheduler disablement, customer/support communication, audit evidence, and post-rollback verification.
- Audit-retention proof confirms cleanup audit evidence survives cleanup without leaking raw secrets or private payloads.
- Remote CI proof exists for retention cleanup tests, destructive approval packet tests, docs links, release safety, and license checks.
- Security, privacy, and licensing audits remain `PASS` after attaching hosted retention cleanup evidence.
- Second operator approves the final hosted retention cleanup destructive-operation evidence packet.

## Required Commands

Run before changing this checklist to `PASS`:

```bash
npm run check
npm audit --omit=dev --audit-level=high
find . -maxdepth 2 -name .git -type d -print
```

The no-`.git` check must return no output until intentional clean public repository history is prepared.

## Review-Only Packets

Use these commands to prepare evidence labels only:

```bash
npm run retention:hosted-cleanup-packet -- --environment production-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --maintenance-window maintenance-window-demo --dry-run-evidence hosted-retention-dry-run-demo --backup-evidence hosted-retention-backup-demo --approval-record hosted-retention-approval-record-demo --legal-support-review legal-support-review-demo --rollback-plan hosted-retention-rollback-demo --second-operator second-operator-hosted-retention-demo --json
```

```bash
npm run retention:destructive-approval-readiness-packet -- --environment production-demo --operation hosted-retention-cleanup --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --approval-policy two-operator-approval-demo --dry-run-diff retention-dry-run-diff-demo --fresh-backup fresh-backup-proof-demo --restore-smoke restore-smoke-proof-demo --exact-confirmation exact-confirmation-proof-demo --two-operator-approval two-operator-approval-proof-demo --legal-support-approval legal-support-approval-proof-demo --scope-proof tenant-workspace-user-scope-proof-demo --maintenance-window maintenance-window-proof-demo --rollback-procedure rollback-procedure-proof-demo --audit-retention audit-retention-proof-demo --hosted-scheduler-disablement hosted-scheduler-disablement-proof-demo --remote-ci remote-ci-proof-demo --json
```

These packets do not approve destructive operations, schedule hosted cleanup jobs, apply retention cleanup, delete records, create external approval records, rotate backup keys, create a public remote, mark audits `PASS`, publish packages, or announce ScheduleOS.

## Current Remaining Risk

High. Local/self-host cleanup foundations are useful, but hosted production cleanup remains unproven until dry-run evidence, fresh backup and restore proof, external approval workflow, legal/support review, hosted scheduler controls, operator visibility, rollback proof, remote CI, final audits, and second-operator review are complete.

## Release Rule

Do not mark "Hosted retention cleanup production destructive-operation approvals" complete until this checklist changes from `FAIL` to `PASS` with current release-candidate evidence.
