# Calendar Model

## Status

Draft provider-neutral calendar model.

## Purpose

`CalendarEvent` represents time that affects availability. ScheduleOS does not need full private calendar details to schedule safely.

## Canonical Fields

```text
CalendarEvent
- id
- externalId
- sourceSystem
- calendarId
- tenantId
- userId
- title
- start
- end
- timezone
- allDay
- status
- busyStatus
- movable
- locked
- privacyLevel
- travelBeforeMinutes
- travelAfterMinutes
- bufferBeforeMinutes
- bufferAfterMinutes
- recurrence
- attendees
- location
- version
```

## Status

```text
CONFIRMED
TENTATIVE
CANCELLED
```

Cancelled events do not block scheduling unless retained for audit/history.

## Busy Status

```text
BUSY
FREE
OUT_OF_OFFICE
TENTATIVE_BUSY
UNKNOWN
```

Rules:

- `BUSY`, `OUT_OF_OFFICE`, and `TENTATIVE_BUSY` block scheduling by default.
- `FREE` does not block scheduling.
- `UNKNOWN` is treated according to workspace policy; safest default is busy for imported external events.

## Privacy Level

```text
PUBLIC
PRIVATE
CONFIDENTIAL
BUSY_ONLY
UNKNOWN
```

Privacy rules:

- Store private event title as `Private event` unless the source/user explicitly permits detail.
- Explanations may reference private time boundaries without exposing title.
- Attendees and location should be omitted for private/busy-only events unless required and authorized.
- AI providers should not receive full private event descriptions by default.

## Movable And Locked

- `movable=false` means the event is a fixed commitment.
- `locked=true` means ScheduleOS may not move the block.
- Imported external meetings are locked by default unless the provider marks them movable and the user authorizes write-back.
- Accepted ScheduleOS work blocks may become calendar events and may be movable unless user locks them.

## Buffers And Travel

Effective busy time is:

```text
start - travelBeforeMinutes - bufferBeforeMinutes
to
end + bufferAfterMinutes + travelAfterMinutes
```

The visible event may remain unchanged while the availability engine protects buffered time.

## Recurrence

Recurrence support must handle:

- Recurring events.
- Changed single instances.
- Cancelled single instances.
- Timezone and daylight-saving transitions.

Current foundation: working-hours timezone conversion is tested for daylight-saving and standard-time offsets. Calendar recurrence expansion across timezone transitions remains future work.

Initial implementation may expand recurrence into occurrences inside a planning range while preserving source recurrence metadata.

## Multiple Calendars

ScheduleOS supports:

- Local calendars.
- Read-only imported calendars.
- Writable calendars.
- Work and personal calendars.
- Multiple calendars per user.

Rules:

- Do not write to read-only calendars.
- Do not silently create duplicate schedule blocks.
- User chooses which calendar receives ScheduleOS blocks.
- Availability may aggregate multiple calendars without storing all descriptions.

## Example

```json
{
  "id": "event_demo_private_1",
  "externalId": "ics_uid_123",
  "sourceSystem": "ICS",
  "calendarId": "calendar_work",
  "tenantId": "tenant_demo",
  "userId": "user_jordan",
  "title": "Private event",
  "start": "2026-07-22T18:00:00.000Z",
  "end": "2026-07-22T19:00:00.000Z",
  "timezone": "America/New_York",
  "allDay": false,
  "status": "CONFIRMED",
  "busyStatus": "BUSY",
  "movable": false,
  "locked": true,
  "privacyLevel": "BUSY_ONLY",
  "bufferBeforeMinutes": 10,
  "bufferAfterMinutes": 10,
  "version": 1
}
```

## Non-Goals

- Do not build a full calendar provider replacement.
- Do not store private descriptions by default.
- Do not expose one user's private event details to another user in team mode.
