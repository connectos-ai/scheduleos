# Calendar Providers

Production provider lifecycle approval is tracked in `docs/security/production-provider-lifecycle-approval-checklist.md`. This document describes provider model foundations only.


## Status

Draft provider model with tested ICS import/export, local API, sync checkpoint, provider revocation, local write-back protection, local write-back conflict preview, and server-side conflict blocking foundations.

## Initial Providers

- Local manual calendar.
- Manual fixed events.
- ICS import/export module local API foundation.
- Local app ICS fixed-event review/import interface foundation.
- Mock calendar provider.

Later providers:

- Google Calendar.
- Microsoft Outlook Calendar.
- ConnectOS calendar capability.

## Provider Requirements

Calendar providers must handle:

- Rate limits.
- Retries.
- Idempotency.
- Duplicate events.
- Webhook replay.
- Out-of-order changes.
- Deleted events.
- Recurrence changes.
- Timezone changes.
- Conflict resolution.
- Read-only calendars.
- Write permissions.
- Token expiration.
- Connection revocation.

## Privacy Requirements

- Prefer busy/free where possible.
- Redact private titles.
- Avoid storing descriptions unless necessary.
- Do not send full private calendar details to AI by default.
- Never log provider tokens.

## ICS Foundation

Monthly time-window `BYSETPOS` rules with an IANA `TZID` preserve local wall-clock time across daylight saving changes in the local ICS foundation.

Yearly time-window `BYSETPOS` rules with an IANA `TZID` preserve local wall-clock time across daylight saving status dates in the local ICS foundation.

Yearly recurrence time-window expansion with `BYHOUR`/`BYMINUTE`/`BYSECOND` is included in the local ICS foundation. Yearly `BYMONTH`/`BYMONTHDAY` time-window rules with an IANA `TZID` preserve local wall-clock time across daylight saving status dates.

Monthly recurrence time-window expansion with `BYHOUR`/`BYMINUTE`/`BYSECOND` is included in the local ICS foundation. Monthly `BYMONTHDAY` time-window rules with an IANA `TZID` preserve local wall-clock time across daylight saving changes.

Weekly recurrence time-window expansion with `BYHOUR`/`BYMINUTE`/`BYSECOND` is included in the local ICS foundation. Weekly `BYDAY` time-window rules and weekly time-window `BYSETPOS` rules with an IANA `TZID` preserve local wall-clock time across daylight saving changes.

Daily recurrence time-window expansion with `BYHOUR`/`BYMINUTE`/`BYSECOND` is included in the local ICS foundation. Daily time-window `BYSETPOS` rules with an IANA `TZID` preserve local wall-clock time across daylight saving changes.

Implemented foundation:

- Parse `VEVENT` entries into provider-neutral `CalendarEvent` records.
- Preserve event `UID` as `externalId`.
- Import UTC date-time events and fixed-event IANA `TZID` local times.
- Preserve daily, daily `BYHOUR`/`BYMINUTE`/`BYSECOND`, simple weekly, weekly `BYDAY`, weekly `BYDAY` plus `BYHOUR`/`BYMINUTE`/`BYSECOND`, weekly `BYDAY` plus `BYMONTH`, monthly, monthly `BYMONTHDAY` plus `BYHOUR`/`BYMINUTE`/`BYSECOND`, monthly plain `BYDAY`, monthly ordinal `BYDAY`, yearly, yearly `BYMONTH`/`BYMONTHDAY` plus `BYHOUR`/`BYMINUTE`/`BYSECOND`, monthly `BYMONTHDAY`, yearly `BYMONTH`, yearly `BYMONTH` plain `BYDAY`, yearly `BYMONTH` ordinal `BYDAY`, yearly `BYMONTH`/`BYMONTHDAY`, yearly `BYYEARDAY`, yearly `BYWEEKNO` recurring IANA `TZID` wall-clock times across daylight saving changes.
- Import events with `DTSTART` plus `DURATION` instead of `DTEND`.
- Import all-day events.
- Expand basic `RRULE:FREQ=DAILY|WEEKLY|MONTHLY|YEARLY` events, including daily/weekly/monthly/yearly `BYHOUR`/`BYMINUTE`/`BYSECOND`, daily/weekly `BYDAY`, weekly `BYDAY` plus `BYMONTH`, daily/monthly `BYMONTHDAY`, monthly/yearly ordinal `BYDAY`, daily/weekly/monthly/yearly `BYSETPOS`, yearly `BYMONTH`, yearly `BYYEARDAY`, yearly `BYWEEKNO`, `EXDATE` exclusions, date-only `EXDATE;VALUE=DATE` day exclusions, `RDATE` additions, `RDATE;VALUE=PERIOD` explicit periods, `RECURRENCE-ID` moved/edited exception substitution and cancelled-instance omission, local API deletion of previously imported cancelled occurrences, and inclusive date-only `UNTIL=YYYYMMDD` bounds for all-day and timed recurrences inside an explicit recurrence range.
- Emit content-minimized `calendar.event_changed` evidence when cancelled `RECURRENCE-ID` re-import deletes an actual stored occurrence, without copying the cancelled ICS summary.
- Map `STATUS`, `TRANSP`, and `CLASS` to ScheduleOS status, busy/free, and privacy fields.
- Store imported ICS events through the local API.
- Re-import the same ICS `UID` through scoped local API upsert and return `createdCount` / `updatedCount`.
- Record provider sync checkpoints through scoped idempotency keys so duplicate provider events do not advance cursors twice.
- Reject sync checkpoints after a provider integration is revoked until the provider is reconnected.
- Mark provider integration state as `DISCONNECTED` through an idempotent local revocation endpoint.
- Reject accepted-plan write-back when the requested calendar is marked read-only.
- Write accepted or locked ScheduleOS plan blocks into the local calendar-event store when the requested calendar is writable.
- Export scoped local API calendar events as escaped ICS text.
- Export accepted and locked ScheduleOS time blocks as escaped ICS calendar events.
- Redact `PRIVATE`, `CONFIDENTIAL`, and `BUSY_ONLY` calendar event titles by default on ICS export.
- Include ScheduleOS tenant, user, and calendar metadata extension fields on export.

Current local API routes:

- `POST /api/calendar-events/ics/import`
- `POST /api/sync/checkpoints`
- `POST /api/integrations/revoke`
- `POST /api/schedule-plans/{planId}/calendar-writeback/preview`
- `POST /api/schedule-plans/{planId}/calendar-writeback`
- `GET /api/calendar-events/ics/export?tenantId=...&userId=...&calendarId=...`
- `GET /api/schedule-plans/{planId}/ics/export?calendarId=...`

`POST /api/sync/checkpoints` accepts `tenantId`, `workspaceId`, `userId`, `sourceSystem`, `externalAccountId`, `providerEventId`, `syncCursor`, and `observedAt`. The first delivery records an `IntegrationState` cursor and audit event. Exact duplicate deliveries return the saved state with `idempotent: true`. Reusing the same `providerEventId` with different content is rejected as `SYNC_REPLAY_CONFLICT`.

`POST /api/integrations/revoke` accepts `tenantId`, `workspaceId`, `userId`, `sourceSystem`, `externalAccountId`, `providerEventId`, `revokedAt`, and optional `reason`. The first delivery clears sync cursor state, marks the integration `DISCONNECTED`, and appends an `INTEGRATION_REVOKED` audit event. Exact duplicate deliveries return the saved state with `idempotent: true`. Reusing the same revocation event ID with different content is rejected as `INTEGRATION_REPLAY_CONFLICT`.

`POST /api/schedule-plans/{planId}/calendar-writeback/preview` accepts `tenantId`, `workspaceId`, `userId`, `calendarId`, `readOnly`. It returns overlap details between accepted or locked plan blocks and existing busy local calendar events without writing any new events. Private, confidential, or busy-only conflict titles are redacted to `Busy`.

`POST /api/schedule-plans/{planId}/calendar-writeback` accepts `tenantId`, `workspaceId`, `userId`, `calendarId`, `readOnly`. `readOnly: true` rejects with `CALENDAR_READ_ONLY`. `readOnly: false` writes accepted or locked blocks from an accepted plan into local `CalendarEvent` records with `sourceSystem: "SCHEDULEOS_WRITEBACK"` and stable plan/block IDs only when no blocking busy-event conflicts exist. If conflicts exist, it rejects with `CALENDAR_WRITEBACK_CONFLICT` and returns the same redacted conflict detail shape as preview without writing events. The local app disables write-back until the accepted plan has a clean conflict preview for the same calendar ID and user acknowledges review; preview, acknowledgement, and write-back controls reference a local status region for assistive technologies. This is a local/self-host foundation, not production Google or Microsoft write-back.

Recurring ICS import can include optional `recurrenceRangeStart` and `recurrenceRangeEnd` ISO timestamps. When both are present, ScheduleOS expands basic daily, weekly, monthly, and yearly `RRULE` events that overlap the requested range. Daily and weekly rules may include `BYDAY`, such as `BYDAY=MO,WE`; weekly rules may also combine `BYDAY` with `BYMONTH`, such as `BYDAY=MO,WE;BYMONTH=2`. Daily and monthly rules may include `BYMONTHDAY` day lists, such as `BYMONTHDAY=1,15`. Yearly rules may include `BYMONTH`, such as `BYMONTH=3`, and `BYYEARDAY`, such as `BYYEARDAY=100,-1`. Recurring imports also honor `EXDATE` exclusions for skipped occurrences, date-only `EXDATE;VALUE=DATE` day exclusions for timed recurrences, `RDATE` additions for explicit extra occurrences, `RDATE;VALUE=PERIOD` values with either `start/end` or `start/duration` period syntax, and inclusive date-only `UNTIL=YYYYMMDD` bounds for all-day and timed recurrences. Monthly rules may also include ordinal `BYDAY` values such as `BYDAY=1MO` and `BYDAY=-1FR`.

Still required before release:

- Broader recurrence support beyond the current local daily/weekly/monthly/yearly `RRULE` foundation, including current `BYHOUR`/`BYMINUTE`/`BYSECOND`, daily/weekly `BYDAY`, weekly `BYDAY` plus `BYMONTH`, daily/monthly `BYMONTHDAY`, monthly/yearly ordinal `BYDAY`, daily/weekly/monthly/yearly `BYSETPOS`, yearly `BYMONTH`, yearly `BYYEARDAY`, yearly `BYWEEKNO`, `EXDATE`, `RDATE`, `RDATE;VALUE=PERIOD`, and inclusive date-only `UNTIL` expansion.
- Production sync-state idempotency beyond local scoped UID upsert and local/self-host sync checkpoint idempotency.
- Production provider revocation lifecycle beyond local/self-host revocation endpoint foundation.
- Production provider write-back lifecycle beyond local/self-host read-only protection, local no-write conflict preview, and local calendar-event write-back foundation.
- Production import/export interface.

## Tests Required

- [x] ICS import fixed UTC event.
- [x] ICS import fixed-event IANA `TZID` local time conversion.
- [x] ICS import event with `DTSTART` plus `DURATION`.
- [x] ICS import all-day event.
- [x] ICS import basic daily recurrence in requested range.
- [x] ICS import daily recurrence with `BYDAY` weekday filters.
- [x] ICS import basic weekly recurrence with interval and until.
- [x] ICS import basic weekly recurrence with `BYDAY`.
- [x] ICS import weekly `BYDAY` plus `BYMONTH` recurrence filters.
- [x] ICS import daily/monthly recurrence with `BYMONTHDAY`, including sparse daily filters beyond one year.
- [x] ICS import monthly ordinal `BYDAY` recurrence foundation such as `1MO` and `-1FR`.
- [x] ICS import monthly `BYSETPOS` recurrence foundation such as last weekday of month.
- [x] ICS import yearly `BYSETPOS` recurrence foundation such as last weekday of a month in a yearly rule and last selected weekday across multiple yearly candidate months.
- [x] ICS import daily `BYSETPOS` recurrence foundation last time-window candidate per daily candidate set.
- [x] ICS import weekly `BYSETPOS` recurrence foundation last selected weekday per weekly candidate set.
- [x] ICS import basic yearly recurrence with `BYMONTH`.
- [x] ICS import yearly time-window `BYSETPOS` recurrence foundation last selected time-window candidate per yearly candidate set.
- [x] ICS import yearly `BYYEARDAY` recurrence foundation with positive and negative day-of-year values.
- [x] ICS import basic monthly recurrence in requested range.
- [x] ICS import basic yearly recurrence in requested range.
- [x] ICS import recurring event `EXDATE` exclusions.
- [x] ICS import timed recurring event date-only `EXDATE;VALUE=DATE` day exclusions.
- [x] ICS import recurring event `RDATE` additions.
- [x] ICS import recurring event `RDATE;VALUE=PERIOD` explicit periods.
- [x] ICS import all-day and timed recurring event inclusive date-only `UNTIL=YYYYMMDD` bounds.
- [x] ICS export escaped event.
- [x] Local API ICS import/export route.
- [x] Local app ICS fixed-event review/import controls.
- [x] Local API ICS fixed-event IANA `TZID` import route.
- [x] Local API ICS `DTSTART` plus `DURATION` import route.
- [x] Local API ICS recurring import route.
- [x] Local API ICS daily `BYDAY` recurring import route.
- [x] Local API ICS daily `BYMONTHDAY` recurring import route.
- [x] Local API ICS weekly `BYDAY` recurring import route.
- [x] Local API ICS weekly `BYDAY` plus `BYMONTH` recurring import route.
- [x] Local API ICS yearly `BYYEARDAY` recurring import route.
- [x] Local API ICS recurring `EXDATE` exclusion route.
- [x] Local API ICS timed recurrence date-only `EXDATE` exclusion route.
- [x] Local API ICS recurring `RDATE` addition route.
- [x] Local API ICS `RDATE;VALUE=PERIOD` addition route.
- [x] Local API ICS all-day and timed recurrence date-only `UNTIL` routes.
- [x] Local API provider sync checkpoint idempotency route.
- [x] Local API provider revocation route.
- [x] ICS export accepted schedule block.
- [x] Private event stays redacted.
- [x] Re-import same ICS without duplicates in local API scoped upsert foundation.
- [x] Read-only calendar rejects write-back.
- [x] Writable local calendar accepts accepted-plan block write-back.
- [x] Local accepted-plan write-back preview reports busy-event conflicts without persisting events.
- [x] Local accepted-plan write-back rejects busy-event conflicts before persisting events.
- [x] Local app write-back requires a clean matching conflict preview and explicit review acknowledgement before enabling write-back.

## Time-Window Recurrence Foundation

Weekly recurring ICS import now supports `BYHOUR`/`BYMINUTE`/`BYSECOND` time windows such as `RRULE:FREQ=WEEKLY;BYDAY=MO;BYHOUR=9,13;BYMINUTE=30;BYSECOND=0;COUNT=4`. Weekly `BYDAY` time-window rules and weekly time-window `BYSETPOS` rules with an IANA `TZID` preserve local wall-clock time across daylight saving changes. This is local parser and local API coverage only; release-grade ICS workflow remains blocked by production sync UX and production sync-state idempotency work.

Daily recurring ICS import now supports `BYHOUR`/`BYMINUTE`/`BYSECOND` time windows such as `RRULE:FREQ=DAILY;BYHOUR=9;BYMINUTE=30;BYSECOND=0,30;COUNT=4`. Daily time-window `BYSETPOS` rules with an IANA `TZID` preserve local wall-clock time across daylight saving changes. This is local parser and local API coverage only; release-grade ICS workflow remains blocked by production sync UX and production sync-state idempotency work.

## WKST Recurrence Foundation

Weekly recurring ICS import now supports `WKST` week-start handling for interval `BYDAY` rules. This is local parser and local API coverage only; release-grade ICS workflow remains blocked by production sync UX and production sync-state idempotency work.
