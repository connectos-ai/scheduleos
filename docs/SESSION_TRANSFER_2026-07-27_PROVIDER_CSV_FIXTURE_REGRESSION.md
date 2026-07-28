# ScheduleOS Session Transfer - Provider CSV Fixture Regression

## Date

2026-07-27

## Current Status

- Release status remains `FAIL`.
- ScheduleOS still has no `.git` directory and should not be initialized, published, pushed, tagged, deployed publicly, or announced.
- This session strengthened local provider CSV evidence only.

## Files Changed

- `src/provider-csv-fixtures.test.ts`
- `docs/release-audit/PROVIDER_CSV_EXPORT_FIXTURE_REGRESSION_20260727.md`
- `docs/current-state-audit-addendum-20260721.md`
- `docs/security/production-provider-csv-approval-checklist.md`
- `docs/SESSION_TRANSFER_2026-07-27_PROVIDER_CSV_FIXTURE_REGRESSION.md`

## What Was Added

Added a local regression test that dry-runs fictional provider export-shaped CSV fixtures for:

- Todoist
- Linear
- Asana
- ClickUp
- Trello
- Microsoft Planner
- GitHub Issues

The test verifies provider source-system mapping, title, priority, duration, project/list/bucket/repository, tags, source URL mapping, and confirms `dryRun: true` does not persist tasks.

## Verification Needed After Any Further Change

Run:

```bash
npm run check
npm audit --omit=dev --audit-level=high
find . -maxdepth 2 -name .git -type d -print
node - <<'NODE'
const fs = require('fs');
const text = fs.readFileSync('docs/public-release-checklist.md', 'utf8');
const malformed = text
  .split('\n')
  .map((line, index) => ({ line, index: index + 1 }))
  .filter(({ line }) => /^- \[[ x]\]/.test(line) && !/^- \[[ x]\] /.test(line));
const checked = (text.match(/^- \[x\] /gm) || []).length;
const unchecked = (text.match(/^- \[ \] /gm) || []).length;
console.log(JSON.stringify({ malformed, checked, unchecked }, null, 2));
NODE
```

## Remaining Provider CSV Blockers

Keep the production provider CSV gate unchecked until there is real current evidence for:

- Real-provider export fixture review beyond fictional local fixtures.
- Production download/upload workflow proof.
- Provider quota governance.
- Hosted abuse analytics.
- Production browser workflow proof.
- Remote CI proof.
- Rollback proof.
- Final security, privacy, licensing, dependency approvals.
- Second-operator approval.
