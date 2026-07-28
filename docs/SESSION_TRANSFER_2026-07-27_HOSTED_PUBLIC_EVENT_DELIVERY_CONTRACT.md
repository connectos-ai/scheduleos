# Session Transfer: Hosted Public-Event Delivery Contract

## Date

2026-07-27

## Current State

ScheduleOS hosted public-event delivery release prep now has a local evidence contract validator and tests.

## Files Changed

- `src/hosted-public-event-delivery-contract.ts`
- `src/hosted-public-event-delivery-contract.test.ts`
- `docs/security/hosted-public-event-delivery-contract.md`
- `docs/security/production-managed-secret-public-event-approval-checklist.md`
- `docs/public-release-checklist.md`
- `docs/release-audit/HOSTED_PUBLIC_EVENT_DELIVERY_CONTRACT_20260727.md`
- `docs/SESSION_TRANSFER_2026-07-27_HOSTED_PUBLIC_EVENT_DELIVERY_CONTRACT.md`

## What Changed

- Added hosted public-event delivery evidence validator.
- Added tests for complete hosted delivery evidence.
- Added tests rejecting unsafe managed-secret custody, non-durable worker runtime, missing queue durability, missing observability/alerts, missing incident drills, and unsafe raw delivery evidence.
- Documented hosted delivery contract release boundary.

## Status

Release remains `FAIL`.

The production managed-secret and hosted public-event worker gate remains unchecked. It still needs real managed secret storage, durable hosted workers, retry/dead-letter queues, hosted observability, alert routing, incident response, remote CI, final audits, and second-operator approval.

## Latest Verification

- Focused verification `npm run build && node --test dist/hosted-public-event-delivery-contract.test.js` passed 5 tests on 2026-07-27.
- `npm run check` passed on 2026-07-27.
- Documentation link check passed 117 Markdown files.
- Release safety scan passed 181 files.
- License check passed 18 package-lock licenses, 182 release text files, 13 fixture/template/example-like files, with assets, copied-source markers, and NOTICE triggers clean.
- `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities on 2026-07-27.
- `find . -maxdepth 2 -name .git -type d -print` returned no output on 2026-07-27.
- Checklist integrity returned `malformed: []`, `checked: 189`, `unchecked: 18` on 2026-07-27.

## Verification Commands

Run from the ScheduleOS repository root:

```bash
npm run check
npm audit --omit=dev --audit-level=high
find . -maxdepth 2 -name .git -type d -print
node -e "const fs=require('fs'); const text=fs.readFileSync('docs/public-release-checklist.md','utf8'); const malformed=text.split(/\n/).map((line,index)=>({line,index:index+1})).filter(({line})=>/^- \[[^ x]\]/i.test(line)); const checked=(text.match(/- \[x\]/g)||[]).length; const unchecked=(text.match(/- \[ \]/g)||[]).length; console.log(JSON.stringify({malformed,checked,unchecked},null,2));"
```
