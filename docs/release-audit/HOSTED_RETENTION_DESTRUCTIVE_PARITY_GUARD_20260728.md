# Hosted Retention Destructive-Operation Parity Guard

Date: 2026-07-28

## Result

Added a local hosted retention destructive-operation parity guard while ScheduleOS remains in release-prep `FAIL` status.

## Scope

- Verifies no local `.git` directory exists.
- Verifies the hosted retention cleanup approval checklist remains `FAIL`.
- Verifies the public release checklist keeps `Hosted retention cleanup production destructive-operation approvals` unchecked.
- Verifies hosted cleanup PASS evidence still requires hosted dry-run evidence, hosted scheduler controls, production operator visibility, rollback plan, audit-retention proof, remote CI proof, final security/privacy/licensing audit alignment, and second-operator review.
- Verifies retention policy and operator runbook keep review-only packet boundaries, external approval evidence storage, backup/export proof, legal/support review, rollback, second-operator review, and exact confirmation language.
- Verifies destructive approval helper and tests keep exact confirmation for scoped timed cleanup, restore overwrite, and refusal behavior.
- Verifies package wiring keeps this guard in `npm run check` after hosted retention approval and before rate-limit approval.

## Boundary

This is not hosted retention destructive-operation approval. The guard does not mark hosted retention cleanup production destructive-operation approvals complete; approve cleanup apply; schedule hosted cleanup; delete records; create external approval records; mark security, privacy, or licensing audits `PASS`; create remotes; initialize git; publish packages; deploy hosting; or announce ScheduleOS. ScheduleOS release status remains `FAIL`.
