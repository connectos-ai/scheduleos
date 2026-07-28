# Production ICS Workflow Approval Checklist

## Status

Current result: `FAIL`.

ScheduleOS has local ICS import/export foundations and a review-only ICS production readiness packet. The release-grade ICS workflow is not approved for public release until the evidence below is attached, reviewed, and accepted.

No public repository, hosted deployment, tag, package publication, or release announcement may rely on production ICS sync until this checklist changes to `PASS`.

## Verified Local Foundations

Current local evidence covers:

- Provider-neutral ICS import/export module foundation for calendar events.
- Local app fixed-event ICS review/import interface foundation.
- Accepted-plan ICS export UI foundation.
- IANA `TZID` local time conversion foundation for imported fixed events.
- Local sanitized provider-shaped ICS fixture idempotency regression covers Google Calendar-style `RRULE`/`EXDATE`, Outlook-style all-day private events, and iCloud-style `RDATE` imports, then reimports them without duplicate event creation. Evidence: `docs/release-audit/ICS_PROVIDER_FIXTURE_IDEMPOTENCY_20260727.md`.
- Daily, weekly, monthly, and yearly recurrence expansion foundations.
- `BYHOUR`, `BYMINUTE`, `BYSECOND`, `BYDAY`, `BYMONTH`, `BYMONTHDAY`, ordinal `BYDAY`, `BYSETPOS`, `BYYEARDAY`, `BYWEEKNO`, `EXDATE`, date-only `EXDATE`, `RDATE`, `RDATE;VALUE=PERIOD`, and inclusive date-only `UNTIL` local coverage.
- Moved and cancelled timed/all-day recurring exception foundations for `RECURRENCE-ID` cases.
- Local accepted-plan calendar write-back foundation rejects read-only calendars, previews busy-event conflicts, blocks conflicted writes server-side, and writes only clear accepted/locked blocks to the writable local calendar-event store.
- Local browser smoke evidence covering ICS fixed-event app flow indirectly through standalone app shell calendar conflict preview.
- `ics:production-readiness-packet` review-only evidence labels for production ICS release review.

These foundations do not approve production calendar sync, real provider fixture coverage, provider write-back, production import/export UX, durable sync-state idempotency, browser workflow approval, remote CI, rollback readiness, or operator release approval.

## Required Evidence Before PASS

Attach current evidence for every item:

- Production ICS evidence contract validator exists at `src/production-ics-evidence-contract.ts` with tests for provider fixture coverage, recurrence coverage, import/export workflow safety, sync-state idempotency, write-back safety, browser proof, remote CI, rollback, operator approvals, and final audits.
- Recurrence regression suite covers release-candidate ICS parser/exporter across daily, weekly, monthly, yearly, exception, timezone, date-only, and set-position cases.
- Timezone/DST proof covers IANA `TZID`, floating times where supported, UTC times, all-day events, date-only `UNTIL`, DST boundary days, and imported/exported consistency.
- Sync-state idempotency proof covers repeated import, provider UID stability, moved recurring exceptions, cancellation handling, deleted occurrence handling, checkpoint replay, and no duplicate fixed-event creation.
- Import preview UX proof confirms production users can review event count, calendars affected, recurring expansion count, skipped/cancelled events, privacy labels, and mutation boundary before import.
- Export privacy redaction proof confirms private calendar/task titles are minimized or redacted where required.
- Write-back conflict preview proof covers clean writes, conflicted writes, read-only calendars, stale previews, acknowledgement behavior, and server-side refusal of conflicted writes.
- Provider-neutral contract review confirms external calendars can integrate without compatible leadership system, OwnerOps, ConnectOS, paid AI, hosted service, or subscription requirements.
- Provider fixture suite includes real export shapes, documented sanitized fixtures, and target providers in release scope.
- Large calendar fixture proof covers realistic recurring calendars, long ranges, many exceptions, all-day events, and performance limits.
- Browser workflow proof covers import preview, confirmation, export, write-back preview, acknowledgement, error states, accessibility, and responsive behavior.
- Remote CI proof exists for ICS tests, production readiness packet tests, docs links, release safety, and license checks.
- Rollback plan reviewed sync checkpoint repair, imported event cleanup, exported file rollback expectations, provider write-back disablement, and operator communication.
- Security, privacy, and licensing audits remain `PASS` after attaching ICS evidence.
- Second operator approves final production ICS workflow evidence packet.

## Required Commands

Run before changing checklist to `PASS`:

```bash
npm run check
npm audit --omit=dev --audit-level=high
find . -maxdepth 2 -name .git -type d -print
```

The no-`.git` check must return no output until intentional clean public repository history is prepared.

## Review-Only Packet

Use this command to prepare evidence labels only:

```bash
npm run ics:production-readiness-packet -- --environment production-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --recurrence-suite rrule-regression-demo --timezone-dst-proof timezone-dst-regression-demo --sync-idempotency checkpoint-replay-demo --import-preview-ux import-preview-ux-demo --export-privacy-redaction export-privacy-redaction-demo --write-back-conflict-preview write-back-conflict-preview-demo --provider-neutral-contract provider-neutral-ics-contract-demo --provider-fixture-suite google-outlook-icloud-fixture-demo --large-calendar-fixture large-calendar-fixture-demo --browser-workflow import-preview-export-writeback-demo --remote-ci remote-ci-ics-demo --rollback-plan ics-rollback-plan-demo --second-operator second-operator-ics-review-demo --json
```

This packet does not approve production calendar sync, write calendar data, mutate provider state, create a public remote, mark audits `PASS`, publish packages, or announce ScheduleOS.

## Current Remaining Risk

High. The local ICS foundation is broad and useful, but release-grade ICS remains unproven until real provider fixture execution, production import/export workflow, sync-state idempotency, provider write-back proof, browser workflow, remote CI, rollback, final audits, and second-operator review are complete.

## Release Rule

Do not mark "Release-grade ICS workflow" complete until this checklist changes from `FAIL` to `PASS` with current release-candidate evidence.
