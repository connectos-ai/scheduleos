# Clean Public History Approval Guard

## Date

2026-07-27

## Scope

Added a local guard that keeps the clean public history approval gate honest while ScheduleOS remains in release-prep `FAIL` status.

## Files Changed

- `scripts/check-clean-public-history-approval.mjs`
- `package.json`
- `docs/public-release-checklist.md`
- `docs/release-audit/CLEAN_PUBLIC_HISTORY_APPROVAL_GUARD_20260727.md`
- `docs/SESSION_TRANSFER_2026-07-27_SCHEDULEOS_RELEASE_PREP_QUICK.md`

## Evidence Preserved

The guard verifies:

- `docs/release/clean-public-history-approval-checklist.md` still has `Current result: FAIL`.
- The public release checklist keeps `Clean public history prepared` unchecked.
- The clean public history approval checklist still prohibits relying on clean history for git initialization, public repository creation, remote creation, pushing, tagging, package publication, hosted deployment, or release announcement.
- Required evidence items remain listed: no-`.git` proof, first commit staging manifest, generated artifact review, fixture/sample sanitization, license/NOTICE readiness, repository naming, remote CI plan, and second-operator approval.
- The first commit staging manifest keeps required include and exclude entries.
- The first commit staging manifest guard keeps include/exclude, top-level tree, no-`.git`, and public blocker checks.
- `.gitignore` keeps public-history exclusions.
- The clean-history readiness packet and first-commit manifest guard scripts remain wired.

## Non-Approval Caveat

This is not clean public history approval. It does not initialize git, stage files, create a first commit, create a public repository, add remotes, push, tag, publish packages, deploy, announce, or change release status.

## Release Rule

Keep `Clean public history prepared` unchecked until the clean public history approval checklist changes from `FAIL` to `PASS` with current release-candidate evidence, no premature repository mutation, and second-operator review.
