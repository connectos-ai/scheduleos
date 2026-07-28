# Production ICS Evidence Contract

Production ICS workflow approval is tracked in `docs/security/production-ics-approval-checklist.md`. This document defines the local release-grade ICS evidence contract for review.

This document does not connect to a real provider, import real calendars, write calendar data, create a remote repository, publish packages, or change release status.

## Status

Current result: `FAIL`.

ScheduleOS now has a local production ICS evidence validator in `src/production-ics-evidence-contract.ts` with tests in `src/production-ics-evidence-contract.test.ts`. It proves the review shape only.

## Contract Purpose

Release-grade ICS evidence must prove that ScheduleOS can safely import, preview, confirm, export, write back, reimport, and recover provider-shaped ICS workflows without duplicating events, leaking private titles, breaking recurrence rules, or bypassing operator review.

## Required Evidence Areas

- Sanitized provider fixtures for Google Calendar, Microsoft Outlook, Apple iCloud, and generic ICS export shapes.
- Large calendar fixture and private-title fixture review.
- Daily, weekly, monthly, yearly, timezone, DST, `EXDATE`, `RDATE`, `RDATE;VALUE=PERIOD`, moved/cancelled `RECURRENCE-ID`, all-day, and date-only `UNTIL` recurrence proof.
- Range-bounded recurrence expansion and performance-limit review.
- Import preview before mutation and explicit import confirmation.
- Accepted-plan export and private title redaction.
- Provider-neutral ICS integration contract.
- Idempotent reimport, checkpoint replay, duplicate prevention, deleted occurrence handling, and out-of-order change review.
- Writable calendar proof, read-only refusal, busy conflict preview, server-side conflict refusal, locked block preservation, and write-back disablement procedure.
- Browser workflow, accessibility, responsive, remote CI, rollback, operator approval, second-operator review, and final security/privacy/licensing audit proof.

## Fictional Evidence Values

Use fictional values such as:

```text
production_demo
tenant_demo
workspace_demo
user_jordan
google_outlook_icloud_fixture_demo
large_calendar_fixture_demo
ics_browser_workflow_demo
ics_rollback_plan_demo
second_operator_ics_review_demo
```

## Verification

Focused verification:

```bash
npm run build
node --test dist/production-ics-evidence-contract.test.js
```

Full verification:

```bash
npm run check
npm audit --omit=dev --audit-level=high
find . -maxdepth 2 -name .git -type d -print
```

## Release Boundary

This contract is a local foundation. ScheduleOS release status remains `FAIL` until release-grade ICS provider fixtures, production import/export workflow, sync-state idempotency, provider write-back proof, remote CI, final audits, rollback, and operator approval are complete.
