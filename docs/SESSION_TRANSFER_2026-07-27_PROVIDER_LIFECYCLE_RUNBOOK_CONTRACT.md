# Session Transfer: Provider Lifecycle Runbook Contract

## Date

2026-07-27

## Current State

ScheduleOS provider lifecycle release prep now has a local/review-only provider-specific runbook contract and an automated checker wired into `npm run check`.

## Files Changed

- `docs/operations/provider-lifecycle-runbook-contract.md`
- `docs/operations/providers/demo-calendar-provider-runbook.md`
- `scripts/check-provider-lifecycle-runbook-contract.mjs`
- `package.json`
- `src/cli.ts`
- `src/cli.test.ts`
- `docs/public-release-checklist.md`
- `docs/security/production-provider-lifecycle-approval-checklist.md`
- `docs/release-audit/PROVIDER_LIFECYCLE_RUNBOOK_CONTRACT_20260727.md`
- `docs/SESSION_TRANSFER_2026-07-27_PROVIDER_LIFECYCLE_RUNBOOK_CONTRACT.md`

## What Changed

- Provider lifecycle readiness packets now expose required provider runbook sections.
- CLI tests protect that packet contract.
- A provider lifecycle runbook contract document now names required sections for setup, permissions, managed-secret custody, rotation, revocation, write-back safety, sync recovery, hosted alerts, incident response, rollback, privacy, support escalation, and sanitized evidence.
- Demo calendar provider lifecycle runbook template gives one concrete fictional provider-specific runbook shape.
- Main verification now checks that the contract document and provider runbooks keep required headings and avoid unsafe sample evidence.

## Status

Release remains `FAIL`.

The production provider lifecycle gate remains unchecked. It still needs real provider-specific adapters, hosted operator alerts, managed-secret storage proof, provider-specific rotation/revocation/write-back runbooks, remote CI, final audits, and second-operator approval.

## Verified This Session

- `npm run check` passed, including documentation link check across 105 Markdown files, release safety scan across 161 files, provider lifecycle runbook contract check across 16 contract headings and 1 provider runbook, and license check across 162 release text files.
- `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities.
- `find . -maxdepth 2 -name .git -type d -print` returned no output.
- Checklist integrity returned `malformed: []`, `checked: 185`, `unchecked: 18`.

## Reverification Commands

Run from the ScheduleOS repository root:

```bash
npm run check
npm audit --omit=dev --audit-level=high
find . -maxdepth 2 -name .git -type d -print
node -e "const fs=require('fs'); const text=fs.readFileSync('docs/public-release-checklist.md','utf8'); const malformed=text.split(/\n/).map((line,index)=>({line,index:index+1})).filter(({line})=>/^- \[[^ x]\]/i.test(line)); const checked=(text.match(/- \[x\]/g)||[]).length; const unchecked=(text.match(/- \[ \]/g)||[]).length; console.log(JSON.stringify({malformed,checked,unchecked},null,2));"
```
