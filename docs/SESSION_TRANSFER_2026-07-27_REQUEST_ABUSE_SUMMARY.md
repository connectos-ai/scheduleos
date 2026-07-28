# ScheduleOS Session Transfer - Request Abuse Summary

## Date

2026-07-27

## Current Status

- Release status remains `FAIL`.
- ScheduleOS still has no `.git` directory and should not be initialized, published, pushed, tagged, deployed publicly, or announced.
- This session strengthened local/self-host rate-limit and abuse-monitoring evidence only.

## Files Changed

- `src/api.ts`
- `src/api.test.ts`
- `src/repositories.ts`
- `src/repositories.test.ts`
- `src/sqlite.ts`
- `src/postgres-repositories.ts`
- `src/postgres-repositories.test.ts`
- `docs/release-audit/REQUEST_ABUSE_SUMMARY_20260727.md`
- `docs/current-state-audit-addendum-20260721.md`
- `docs/security/production-rate-limit-approval-checklist.md`
- `docs/security/threat-model.md`
- `docs/public-release-checklist.md`
- `docs/SESSION_TRANSFER_2026-07-27_REQUEST_ABUSE_SUMMARY.md`

## What Was Added

Added local/self-host `GET /api/request-abuse/summary` for persisted authenticated request throttles.

The endpoint reports active scoped request-throttle windows, saturated windows, request counts, retry timing, truncated SHA-256 key fingerprints, and local `REVIEW_REQUIRED` status when persisted throttling is configured and a saturated window exists.

It does not expose raw bearer tokens, session cookies, client IP addresses, request paths, request bodies, task titles, calendar titles, or provider identifiers.

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

## Remaining Rate-Limit Blockers

Keep the production distributed rate-limit and abuse-monitoring gate unchecked until there is real current evidence for edge/gateway policy proof, distributed throttle store proof, trusted proxy deployment proof, provider quota governance, hosted alert routing and dashboards, broader abuse analytics, remote CI proof, rollback proof, final audits, and second-operator approval.
