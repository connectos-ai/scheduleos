# Public Release Smoke Loop Audit

## Date

2026-07-27

## Scope

Added a local API smoke test that exercises the fictional public release-candidate loop from the original ScheduleOS goal.

## Evidence Added

- Fictional standalone user configures working hours and a fixed private/busy commitment.
- Fictional user creates manual tasks with durations, deadlines, priorities, and an over-capacity task.
- Mock OwnerOps imports one task through the public adapter contract.
- ScheduleOS generates a plan, reports unscheduled work, returns capacity evidence, and exposes deadline-risk evidence.
- User accepts a plan, locks a block, imports a private ConnectOS calendar hold, replans around it, and preserves the locked block.
- User completes one block, replans remaining work, and exports the plan through ICS.
- ConnectOS private event title remains outside the exported ScheduleOS plan ICS.

## Files Changed

- `src/api.test.ts`
- `docs/release-audit/PUBLIC_RELEASE_SMOKE_LOOP_20260727.md`
- `docs/public-release-checklist.md`
- `docs/current-state-audit-addendum-20260721.md`
- `docs/SESSION_TRANSFER_2026-07-27_PUBLIC_RELEASE_SMOKE_LOOP.md`
- `docs/SESSION_TRANSFER_2026-07-27_SCHEDULEOS_RELEASE_PREP_QUICK.md`

## Verification Evidence

- Focused verification passed: `npm run build && node --test dist/api.test.js` passed 182 API tests.
- `npm run check` passed after documentation updates; `npm test` passed 813 tests.
- `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities.
- `find . -maxdepth 2 -name .git -type d -print` returned no output.
- Checklist integrity returned `malformed: []`, `checked: 200`, `unchecked: 18`.
- Full check coverage included docs link check over 150 Markdown files, release safety scan over 234 files, and license check over 18 package-lock licenses, 235 release text files, and 13 fixture/template/example-like files.

## Release Boundary

This is local release-candidate smoke evidence only. It does not approve production deployment, production browser matrix, real provider synchronization, final audits, clean public history, public repository creation, publishing, tagging, or announcement. Release remains `FAIL`.
