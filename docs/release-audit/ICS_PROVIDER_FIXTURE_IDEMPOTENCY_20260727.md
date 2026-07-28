# ICS Provider Fixture Idempotency Regression - 2026-07-27

## Status

Local evidence only. Release remains `FAIL`.

## Scope

Added sanitized provider-shaped ICS fixture coverage for:

- Google Calendar-style recurring timed event with IANA `TZID`, `RRULE`, `EXDATE`, `SEQUENCE`, and provider metadata.
- Outlook-style all-day private event with `CLASS`, `TRANSP`, and provider extension metadata.
- iCloud-style timed event with IANA `TZID`, `RDATE`, and descriptive metadata.

All fixtures are fictional and contain demo identifiers only.

## Evidence Added

`src/ics-provider-fixtures.test.ts` verifies that `/api/calendar-events/ics/import`:

- Imports each sanitized provider-shaped fixture into provider-neutral `CalendarEvent` records.
- Preserves expected event titles, start times, source system, and calendar IDs.
- Expands recurrence and `RDATE` occurrences inside the requested range.
- Excludes the `EXDATE` occurrence from the Google-style recurring event.
- Reimports the same fixture set idempotently: second import returns zero created events and updates the existing events instead of duplicating them.
- Leaves the scoped calendar-event list at the expected count after repeated imports.

## Verification

`npm run check` passed after adding the regression.

Observed result:

- 736 tests passed.
- GitHub Actions CI workflow validation passed.
- Documentation link check passed 89 Markdown files.
- Release safety scan passed 143 files.
- License check passed 18 package-lock licenses, 144 release text files, and 11 fixture/template/example-like files.

## Boundary

This does not approve release-grade ICS workflow.

Still required before the ICS gate can pass:

- Real provider fixture execution and review beyond sanitized local fixtures.
- Production import/export browser workflow proof.
- Production sync-state idempotency proof against durable hosted storage.
- Provider write-back proof.
- Remote CI proof.
- Rollback proof.
- Final security, privacy, licensing, and dependency approvals.
- Operator and second-operator approval.
