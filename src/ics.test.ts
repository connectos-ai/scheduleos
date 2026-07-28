import test from "node:test";
import assert from "node:assert/strict";
import type { CalendarEvent, SchedulingTask, TimeBlock } from "./domain.js";
import {
  exportCalendarEventsToIcs,
  exportScheduleBlocksToIcs,
  parseIcsCalendarEvents
} from "./ics.js";

test("imports VEVENT entries into provider-neutral calendar events", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_focus",
      "SUMMARY:Focus block",
      "DTSTART:20260722T130000Z",
      "DTEND:20260722T140000Z",
      "STATUS:TENTATIVE",
      "TRANSP:OPAQUE",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:event_demo_personal_day",
      "SUMMARY:Personal boundary",
      "DTSTART;VALUE=DATE:20260723",
      "DTEND;VALUE=DATE:20260724",
      "TRANSP:TRANSPARENT",
      "CLASS:PRIVATE",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    }
  );

  assert.deepEqual(events, [
    {
      id: "ics_event_demo_focus",
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo",
      title: "Focus block",
      start: "2026-07-22T13:00:00.000Z",
      end: "2026-07-22T14:00:00.000Z",
      timezone: "UTC",
      allDay: false,
      status: "TENTATIVE",
      busyStatus: "BUSY",
      movable: false,
      locked: true,
      privacyLevel: "UNKNOWN",
      version: 1,
      sourceSystem: "ICS",
      externalId: "event_demo_focus"
    },
    {
      id: "ics_event_demo_personal_day",
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo",
      title: "Personal boundary",
      start: "2026-07-23T00:00:00.000Z",
      end: "2026-07-24T00:00:00.000Z",
      timezone: "UTC",
      allDay: true,
      status: "CONFIRMED",
      busyStatus: "FREE",
      movable: false,
      locked: true,
      privacyLevel: "PRIVATE",
      version: 1,
      sourceSystem: "ICS",
      externalId: "event_demo_personal_day"
    }
  ]);
});

test("imports VEVENT entries with DTSTART and DURATION", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_duration_focus",
      "SUMMARY:Duration focus block",
      "DTSTART:20260722T130000Z",
      "DURATION:PT1H30M",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    }
  );

  assert.equal(events.length, 1);
  const [event] = events;
  assert.ok(event);
  assert.equal(event.start, "2026-07-22T13:00:00.000Z");
  assert.equal(event.end, "2026-07-22T14:30:00.000Z");
});

test("applies RECURRENCE-ID exception VEVENT entries to recurring imports", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_recurring_review",
      "SUMMARY:Recurring review",
      "DTSTART:20260722T130000Z",
      "DTEND:20260722T133000Z",
      "RRULE:FREQ=DAILY;COUNT=3",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:event_demo_recurring_review",
      "RECURRENCE-ID:20260723T130000Z",
      "SUMMARY:Moved recurring review",
      "DTSTART:20260723T150000Z",
      "DTEND:20260723T154500Z",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-07-22T00:00:00.000Z",
      recurrenceRangeEnd: "2026-07-26T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({
      externalId: event.externalId,
      title: event.title,
      start: event.start,
      end: event.end
    })),
    [
      {
        externalId: "event_demo_recurring_review:20260722T130000Z",
        title: "Recurring review",
        start: "2026-07-22T13:00:00.000Z",
        end: "2026-07-22T13:30:00.000Z"
      },
      {
        externalId: "event_demo_recurring_review:20260723T130000Z",
        title: "Moved recurring review",
        start: "2026-07-23T15:00:00.000Z",
        end: "2026-07-23T15:45:00.000Z"
      },
      {
        externalId: "event_demo_recurring_review:20260724T130000Z",
        title: "Recurring review",
        start: "2026-07-24T13:00:00.000Z",
        end: "2026-07-24T13:30:00.000Z"
      }
    ]
  );
});

test("applies all-day RECURRENCE-ID moved exceptions to recurring imports", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_all_day_recurring_planning",
      "SUMMARY:Planning retreat",
      "DTSTART;VALUE=DATE:20260721",
      "DTEND;VALUE=DATE:20260722",
      "RRULE:FREQ=DAILY;COUNT=3",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:event_demo_all_day_recurring_planning",
      "RECURRENCE-ID;VALUE=DATE:20260722",
      "SUMMARY:Moved planning retreat",
      "DTSTART;VALUE=DATE:20260724",
      "DTEND;VALUE=DATE:20260725",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-07-20T00:00:00.000Z",
      recurrenceRangeEnd: "2026-07-26T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({
      externalId: event.externalId,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay
    })),
    [
      {
        externalId: "event_demo_all_day_recurring_planning:20260721T000000Z",
        title: "Planning retreat",
        start: "2026-07-21T00:00:00.000Z",
        end: "2026-07-22T00:00:00.000Z",
        allDay: true
      },
      {
        externalId: "event_demo_all_day_recurring_planning:20260722T000000Z",
        title: "Moved planning retreat",
        start: "2026-07-24T00:00:00.000Z",
        end: "2026-07-25T00:00:00.000Z",
        allDay: true
      },
      {
        externalId: "event_demo_all_day_recurring_planning:20260723T000000Z",
        title: "Planning retreat",
        start: "2026-07-23T00:00:00.000Z",
        end: "2026-07-24T00:00:00.000Z",
        allDay: true
      }
    ]
  );
});

test("applies IANA TZID RECURRENCE-ID moved exceptions across DST", () => {
const events = parseIcsCalendarEvents(
[
"BEGIN:VCALENDAR",
"VERSION:2.0",
"BEGIN:VEVENT",
"UID:event_demo_new_york_dst_exception",
"SUMMARY:New York recurring review",
"DTSTART;TZID=America/New_York:20260307T090000",
"DTEND;TZID=America/New_York:20260307T093000",
"RRULE:FREQ=DAILY;COUNT=3",
"END:VEVENT",
"BEGIN:VEVENT",
"UID:event_demo_new_york_dst_exception",
"RECURRENCE-ID;TZID=America/New_York:20260308T090000",
"SUMMARY:Moved New York recurring review",
"DTSTART;TZID=America/New_York:20260308T110000",
"DTEND;TZID=America/New_York:20260308T114500",
"END:VEVENT",
"END:VCALENDAR"
].join("\r\n"),
{
tenantId: "tenant_demo",
workspaceId: "workspace_demo",
userId: "user_jordan",
calendarId: "calendar_demo"
},
{
recurrenceRangeStart: "2026-03-07T00:00:00.000Z",
recurrenceRangeEnd: "2026-03-11T00:00:00.000Z"
}
);

assert.deepEqual(
events.map((event) => ({
externalId: event.externalId,
title: event.title,
start: event.start,
end: event.end,
timezone: event.timezone
})),
[
{
externalId: "event_demo_new_york_dst_exception:20260307T140000Z",
title: "New York recurring review",
start: "2026-03-07T14:00:00.000Z",
end: "2026-03-07T14:30:00.000Z",
timezone: "America/New_York"
},
{
externalId: "event_demo_new_york_dst_exception:20260308T130000Z",
title: "Moved New York recurring review",
start: "2026-03-08T15:00:00.000Z",
end: "2026-03-08T15:45:00.000Z",
timezone: "America/New_York"
},
{
externalId: "event_demo_new_york_dst_exception:20260309T130000Z",
title: "New York recurring review",
start: "2026-03-09T13:00:00.000Z",
end: "2026-03-09T13:30:00.000Z",
timezone: "America/New_York"
}
]
);
});

test("omits CANCELLED RECURRENCE-ID exception VEVENT entries recurring imports", () => {
const events = parseIcsCalendarEvents(
[
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_cancelled_review",
      "SUMMARY:Recurring review",
      "DTSTART:20260722T130000Z",
      "DTEND:20260722T133000Z",
      "RRULE:FREQ=DAILY;COUNT=3",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:event_demo_cancelled_review",
      "RECURRENCE-ID:20260723T130000Z",
      "SUMMARY:Cancelled recurring review",
      "DTSTART:20260723T130000Z",
      "DTEND:20260723T133000Z",
      "STATUS:CANCELLED",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-07-22T00:00:00.000Z",
      recurrenceRangeEnd: "2026-07-26T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({
      externalId: event.externalId,
      title: event.title,
      start: event.start,
      end: event.end
    })),
    [
      {
        externalId: "event_demo_cancelled_review:20260722T130000Z",
        title: "Recurring review",
        start: "2026-07-22T13:00:00.000Z",
        end: "2026-07-22T13:30:00.000Z"
      },
      {
        externalId: "event_demo_cancelled_review:20260724T130000Z",
        title: "Recurring review",
        start: "2026-07-24T13:00:00.000Z",
        end: "2026-07-24T13:30:00.000Z"
      }
    ]
  );
});

test("omits all-day CANCELLED RECURRENCE-ID exception VEVENT entries recurring imports", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_all_day_cancelled_planning",
      "SUMMARY:Planning retreat",
      "DTSTART;VALUE=DATE:20260721",
      "DTEND;VALUE=DATE:20260722",
      "RRULE:FREQ=DAILY;COUNT=3",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:event_demo_all_day_cancelled_planning",
      "RECURRENCE-ID;VALUE=DATE:20260722",
      "SUMMARY:Cancelled planning retreat",
      "DTSTART;VALUE=DATE:20260722",
      "DTEND;VALUE=DATE:20260723",
      "STATUS:CANCELLED",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-07-20T00:00:00.000Z",
      recurrenceRangeEnd: "2026-07-26T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({
      externalId: event.externalId,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay
    })),
    [
      {
        externalId: "event_demo_all_day_cancelled_planning:20260721T000000Z",
        title: "Planning retreat",
        start: "2026-07-21T00:00:00.000Z",
        end: "2026-07-22T00:00:00.000Z",
        allDay: true
      },
      {
        externalId: "event_demo_all_day_cancelled_planning:20260723T000000Z",
        title: "Planning retreat",
        start: "2026-07-23T00:00:00.000Z",
        end: "2026-07-24T00:00:00.000Z",
        allDay: true
      }
    ]
  );
});

test("expands daily recurring VEVENT entries inside the requested range", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_daily_standup",
      "SUMMARY:Daily standup",
      "DTSTART:20260722T130000Z",
      "DTEND:20260722T133000Z",
      "RRULE:FREQ=DAILY;COUNT=4",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-07-23T00:00:00.000Z",
      recurrenceRangeEnd: "2026-07-25T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({
      id: event.id,
      externalId: event.externalId,
      start: event.start,
      end: event.end
    })),
    [
      {
        id: "ics_event_demo_daily_standup_20260723T130000Z",
        externalId: "event_demo_daily_standup:20260723T130000Z",
        start: "2026-07-23T13:00:00.000Z",
        end: "2026-07-23T13:30:00.000Z"
      },
      {
        id: "ics_event_demo_daily_standup_20260724T130000Z",
        externalId: "event_demo_daily_standup:20260724T130000Z",
        start: "2026-07-24T13:00:00.000Z",
        end: "2026-07-24T13:30:00.000Z"
      }
    ]
  );
});

test("expands daily recurring VEVENT entries with BYHOUR BYMINUTE times", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_daily_time_windows",
      "SUMMARY:Daily focus windows",
      "DTSTART:20260722T093000Z",
      "DTEND:20260722T100000Z",
      "RRULE:FREQ=DAILY;BYHOUR=9,13;BYMINUTE=30;COUNT=4",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-07-22T00:00:00.000Z",
      recurrenceRangeEnd: "2026-07-24T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({ start: event.start, end: event.end })),
    [
      {
        start: "2026-07-22T09:30:00.000Z",
        end: "2026-07-22T10:00:00.000Z"
      },
      {
        start: "2026-07-22T13:30:00.000Z",
        end: "2026-07-22T14:00:00.000Z"
      },
      {
        start: "2026-07-23T09:30:00.000Z",
        end: "2026-07-23T10:00:00.000Z"
      },
      {
        start: "2026-07-23T13:30:00.000Z",
        end: "2026-07-23T14:00:00.000Z"
      }
    ]
  );
});

test("expands daily recurring VEVENT entries with BYHOUR and BYSETPOS", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_daily_last_window",
      "SUMMARY:Daily last focus window",
      "DTSTART:20260722T093000Z",
      "DTEND:20260722T100000Z",
      "RRULE:FREQ=DAILY;BYHOUR=9,13;BYMINUTE=30;BYSETPOS=-1;COUNT=3",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-07-22T00:00:00.000Z",
      recurrenceRangeEnd: "2026-07-25T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => event.start),
    [
      "2026-07-22T13:30:00.000Z",
      "2026-07-23T13:30:00.000Z",
      "2026-07-24T13:30:00.000Z"
    ]
  );
});

test("keeps daily BYHOUR BYSETPOS recurring VEVENT entries with IANA TZID on local wall time across DST", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_new_york_daily_last_window",
      "SUMMARY:New York daily last focus window",
      "DTSTART;TZID=America/New_York:20250308T093000",
      "DTEND;TZID=America/New_York:20250308T100000",
      "RRULE:FREQ=DAILY;BYHOUR=9,13;BYMINUTE=30;BYSETPOS=-1;COUNT=3",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2025-03-08T00:00:00.000Z",
      recurrenceRangeEnd: "2025-03-11T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({
      start: event.start,
      end: event.end,
      timezone: event.timezone
    })),
    [
      {
        start: "2025-03-08T18:30:00.000Z",
        end: "2025-03-08T19:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2025-03-09T17:30:00.000Z",
        end: "2025-03-09T18:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2025-03-10T17:30:00.000Z",
        end: "2025-03-10T18:00:00.000Z",
        timezone: "America/New_York"
      }
    ]
  );
});

test("expands daily recurring VEVENT entries with BYSECOND times", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_daily_second_windows",
      "SUMMARY:Daily second windows",
      "DTSTART:20260722T093000Z",
      "DTEND:20260722T093010Z",
      "RRULE:FREQ=DAILY;BYHOUR=9;BYMINUTE=30;BYSECOND=0,30;COUNT=4",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-07-22T00:00:00.000Z",
      recurrenceRangeEnd: "2026-07-24T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({ start: event.start, end: event.end })),
    [
      {
        start: "2026-07-22T09:30:00.000Z",
        end: "2026-07-22T09:30:10.000Z"
      },
      {
        start: "2026-07-22T09:30:30.000Z",
        end: "2026-07-22T09:30:40.000Z"
      },
      {
        start: "2026-07-23T09:30:00.000Z",
        end: "2026-07-23T09:30:10.000Z"
      },
      {
        start: "2026-07-23T09:30:30.000Z",
        end: "2026-07-23T09:30:40.000Z"
      }
    ]
  );
});

test("expands daily recurring VEVENT entries with BYDAY weekday filters", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_daily_weekdays",
      "SUMMARY:Daily weekday rhythm",
      "DTSTART:20260722T130000Z",
      "DTEND:20260722T133000Z",
      "RRULE:FREQ=DAILY;BYDAY=MO,WE,FR;COUNT=4",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-07-22T00:00:00.000Z",
      recurrenceRangeEnd: "2026-08-01T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => event.start),
    [
      "2026-07-22T13:00:00.000Z",
      "2026-07-24T13:00:00.000Z",
      "2026-07-27T13:00:00.000Z",
      "2026-07-29T13:00:00.000Z"
    ]
  );
});

test("expands monthly recurring VEVENT entries inside requested range", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_monthly_board_review",
      "SUMMARY:Monthly board review",
      "DTSTART:20260731T150000Z",
      "DTEND:20260731T160000Z",
      "RRULE:FREQ=MONTHLY;COUNT=3",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-07-01T00:00:00.000Z",
      recurrenceRangeEnd: "2026-10-01T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({
      externalId: event.externalId,
      start: event.start,
      end: event.end
    })),
    [
      {
        externalId: "event_demo_monthly_board_review:20260731T150000Z",
        start: "2026-07-31T15:00:00.000Z",
        end: "2026-07-31T16:00:00.000Z"
      },
      {
        externalId: "event_demo_monthly_board_review:20260831T150000Z",
        start: "2026-08-31T15:00:00.000Z",
        end: "2026-08-31T16:00:00.000Z"
      },
      {
        externalId: "event_demo_monthly_board_review:20260930T150000Z",
        start: "2026-09-30T15:00:00.000Z",
        end: "2026-09-30T16:00:00.000Z"
      }
    ]
  );
});

test("expands monthly recurring VEVENT entries with time windows", () => {
  const events = parseIcsCalendarEvents(
 [
 "BEGIN:VCALENDAR",
 "VERSION:2.0",
 "BEGIN:VEVENT",
 "UID:event_demo_monthly_time_windows",
 "SUMMARY:Monthly focus windows",
 "DTSTART:20260715T093000Z",
 "DTEND:20260715T100000Z",
 "RRULE:FREQ=MONTHLY;BYMONTHDAY=15;BYHOUR=9,13;BYMINUTE=30;BYSECOND=0;COUNT=4",
 "END:VEVENT",
 "END:VCALENDAR"
 ].join("\r\n"),
 {
 tenantId: "tenant_demo",
 workspaceId: "workspace_demo",
 userId: "user_jordan",
 calendarId: "calendar_demo"
 },
 {
 recurrenceRangeStart: "2026-07-01T00:00:00.000Z",
 recurrenceRangeEnd: "2026-09-01T00:00:00.000Z"
 }
 );

 assert.deepEqual(
 events.map((event) => ({ start: event.start, end: event.end })),
 [
 {
 start: "2026-07-15T09:30:00.000Z",
 end: "2026-07-15T10:00:00.000Z"
 },
 {
 start: "2026-07-15T13:30:00.000Z",
 end: "2026-07-15T14:00:00.000Z"
 },
 {
 start: "2026-08-15T09:30:00.000Z",
 end: "2026-08-15T10:00:00.000Z"
 },
 {
 start: "2026-08-15T13:30:00.000Z",
 end: "2026-08-15T14:00:00.000Z"
 }
 ]
  );
});

test("keeps monthly BYMONTHDAY BYHOUR BYSETPOS recurring VEVENT entries with IANA TZID on local wall time across DST", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_new_york_monthly_last_window",
      "SUMMARY:New York monthly last focus window",
      "DTSTART;TZID=America/New_York:20250101T093000",
      "DTEND;TZID=America/New_York:20250101T100000",
      "RRULE:FREQ=MONTHLY;BYMONTHDAY=1,15;BYHOUR=9,13;BYMINUTE=30;BYSETPOS=-1;COUNT=4",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2025-01-01T00:00:00.000Z",
      recurrenceRangeEnd: "2025-05-01T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({
      start: event.start,
      end: event.end,
      timezone: event.timezone
    })),
    [
      {
        start: "2025-01-15T18:30:00.000Z",
        end: "2025-01-15T19:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2025-02-15T18:30:00.000Z",
        end: "2025-02-15T19:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2025-03-15T17:30:00.000Z",
        end: "2025-03-15T18:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2025-04-15T17:30:00.000Z",
        end: "2025-04-15T18:00:00.000Z",
        timezone: "America/New_York"
      }
    ]
  );
});

test("expands yearly recurring VEVENT entries inside requested range", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_yearly_review",
      "SUMMARY:Yearly review",
      "DTSTART:20240229T150000Z",
      "DTEND:20240229T160000Z",
      "RRULE:FREQ=YEARLY;COUNT=3",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2024-01-01T00:00:00.000Z",
      recurrenceRangeEnd: "2027-01-01T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => event.start),
    [
      "2024-02-29T15:00:00.000Z",
      "2025-02-28T15:00:00.000Z",
      "2026-02-28T15:00:00.000Z"
    ]
  );
});

test("expands yearly recurring VEVENT entries with time windows", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_yearly_time_windows",
      "SUMMARY:Yearly focus windows",
      "DTSTART:20260715T093000Z",
      "DTEND:20260715T100000Z",
      "RRULE:FREQ=YEARLY;BYMONTH=7;BYMONTHDAY=15;BYHOUR=9,13;BYMINUTE=30;BYSECOND=0;COUNT=4",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-01-01T00:00:00.000Z",
      recurrenceRangeEnd: "2028-01-01T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({ start: event.start, end: event.end })),
    [
      {
        start: "2026-07-15T09:30:00.000Z",
        end: "2026-07-15T10:00:00.000Z"
      },
      {
        start: "2026-07-15T13:30:00.000Z",
        end: "2026-07-15T14:00:00.000Z"
      },
      {
        start: "2027-07-15T09:30:00.000Z",
        end: "2027-07-15T10:00:00.000Z"
      },
      {
        start: "2027-07-15T13:30:00.000Z",
        end: "2027-07-15T14:00:00.000Z"
      }
    ]
  );
});

test("expands yearly recurring VEVENT entries with time windows and BYSETPOS", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_yearly_last_window",
      "SUMMARY:Yearly last focus window",
      "DTSTART:20260715T093000Z",
      "DTEND:20260715T100000Z",
      "RRULE:FREQ=YEARLY;BYMONTH=7;BYMONTHDAY=15;BYHOUR=9,13;BYMINUTE=30;BYSECOND=0;BYSETPOS=-1;COUNT=2",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-01-01T00:00:00.000Z",
      recurrenceRangeEnd: "2028-01-01T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => event.start),
    ["2026-07-15T13:30:00.000Z", "2027-07-15T13:30:00.000Z"]
  );
});

test("expands yearly recurring VEVENT entries with BYWEEKNO", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_yearly_week_number",
      "SUMMARY:Yearly week-number planning",
      "DTSTART:20260105T150000Z",
      "DTEND:20260105T160000Z",
      "RRULE:FREQ=YEARLY;BYWEEKNO=2;BYDAY=MO;WKST=MO;COUNT=3",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-01-01T00:00:00.000Z",
      recurrenceRangeEnd: "2029-01-01T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => event.start),
    [
      "2026-01-05T15:00:00.000Z",
      "2027-01-11T15:00:00.000Z",
      "2028-01-10T15:00:00.000Z"
    ]
  );
});

test("rejects invalid recurring VEVENT BYWEEKNO zero", () => {
  assert.throws(
    () =>
      parseIcsCalendarEvents(
        [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "BEGIN:VEVENT",
          "UID:event_demo_invalid_week_number",
          "SUMMARY:Invalid week number",
          "DTSTART:20260105T150000Z",
          "DTEND:20260105T160000Z",
          "RRULE:FREQ=YEARLY;BYWEEKNO=0",
          "END:VEVENT",
          "END:VCALENDAR"
        ].join("\r\n"),
        {
          tenantId: "tenant_demo",
          workspaceId: "workspace_demo",
          userId: "user_jordan",
          calendarId: "calendar_demo"
        },
        {
          recurrenceRangeStart: "2026-01-01T00:00:00.000Z",
          recurrenceRangeEnd: "2029-01-01T00:00:00.000Z"
        }
      ),
    /Invalid ICS RRULE BYWEEKNO: 0/
  );
});

test("expands monthly recurring VEVENT entries with BYMONTHDAY", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_monthday_cashflow",
      "SUMMARY:Cashflow review",
      "DTSTART:20260715T150000Z",
      "DTEND:20260715T153000Z",
      "RRULE:FREQ=MONTHLY;BYMONTHDAY=15,30;COUNT=5",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-07-01T00:00:00.000Z",
      recurrenceRangeEnd: "2026-10-01T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => event.start),
    [
      "2026-07-15T15:00:00.000Z",
      "2026-07-30T15:00:00.000Z",
      "2026-08-15T15:00:00.000Z",
      "2026-08-30T15:00:00.000Z",
      "2026-09-15T15:00:00.000Z"
    ]
  );
});

test("expands daily recurring VEVENT entries with sparse BYMONTHDAY filters beyond one year", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_daily_monthday_filter",
      "SUMMARY:Daily monthday filter",
      "DTSTART:20260701T150000Z",
      "DTEND:20260701T153000Z",
      "RRULE:FREQ=DAILY;BYMONTHDAY=31;COUNT=8",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-07-01T00:00:00.000Z",
      recurrenceRangeEnd: "2027-09-20T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => event.start),
    [
      "2026-07-31T15:00:00.000Z",
      "2026-08-31T15:00:00.000Z",
      "2026-10-31T15:00:00.000Z",
      "2026-12-31T15:00:00.000Z",
      "2027-01-31T15:00:00.000Z",
      "2027-03-31T15:00:00.000Z",
      "2027-05-31T15:00:00.000Z",
      "2027-07-31T15:00:00.000Z"
    ]
  );
});

test("expands monthly recurring VEVENT entries with negative BYMONTHDAY", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_month_end_close",
      "SUMMARY:Month-end close",
      "DTSTART:20260731T150000Z",
      "DTEND:20260731T153000Z",
      "RRULE:FREQ=MONTHLY;BYMONTHDAY=-1;COUNT=3",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-07-01T00:00:00.000Z",
      recurrenceRangeEnd: "2026-10-01T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => event.start),
    [
      "2026-07-31T15:00:00.000Z",
      "2026-08-31T15:00:00.000Z",
      "2026-09-30T15:00:00.000Z"
    ]
  );
});

test("rejects invalid recurring VEVENT BYMONTHDAY zero", () => {
  assert.throws(
    () =>
      parseIcsCalendarEvents(
        [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "BEGIN:VEVENT",
          "UID:event_demo_invalid_monthday",
          "SUMMARY:Invalid monthday",
          "DTSTART:20260731T150000Z",
          "DTEND:20260731T153000Z",
          "RRULE:FREQ=MONTHLY;BYMONTHDAY=0",
          "END:VEVENT",
          "END:VCALENDAR"
        ].join("\r\n"),
        {
          tenantId: "tenant_demo",
          workspaceId: "workspace_demo",
          userId: "user_jordan",
          calendarId: "calendar_demo"
        },
        {
          recurrenceRangeStart: "2026-07-01T00:00:00.000Z",
          recurrenceRangeEnd: "2026-10-01T00:00:00.000Z"
        }
      ),
    /Invalid ICS RRULE BYMONTHDAY: 0/
  );
});

test("expands monthly recurring VEVENT entries with ordinal BYDAY", () => {
 const events = parseIcsCalendarEvents(
 [
 "BEGIN:VCALENDAR",
 "VERSION:2.0",
 "BEGIN:VEVENT",
 "UID:event_demo_first_monday",
 "SUMMARY:First Monday planning",
 "DTSTART:20260706T150000Z",
 "DTEND:20260706T153000Z",
 "RRULE:FREQ=MONTHLY;BYDAY=1MO;COUNT=3",
 "END:VEVENT",
 "END:VCALENDAR"
 ].join("\r\n"),
 {
 tenantId: "tenant_demo",
 workspaceId: "workspace_demo",
 userId: "user_jordan",
 calendarId: "calendar_demo"
 },
 {
 recurrenceRangeStart: "2026-07-01T00:00:00.000Z",
 recurrenceRangeEnd: "2026-10-01T00:00:00.000Z"
 }
 );

 assert.deepEqual(
 events.map((event) => event.start),
 [
 "2026-07-06T15:00:00.000Z",
 "2026-08-03T15:00:00.000Z",
 "2026-09-07T15:00:00.000Z"
 ]
 );
});

test("expands monthly recurring VEVENT entries with negative ordinal BYDAY", () => {
 const events = parseIcsCalendarEvents(
 [
 "BEGIN:VCALENDAR",
 "VERSION:2.0",
 "BEGIN:VEVENT",
 "UID:event_demo_last_friday",
 "SUMMARY:Last Friday review",
 "DTSTART:20260731T180000Z",
 "DTEND:20260731T190000Z",
 "RRULE:FREQ=MONTHLY;BYDAY=-1FR;COUNT=2",
 "END:VEVENT",
 "END:VCALENDAR"
 ].join("\r\n"),
 {
 tenantId: "tenant_demo",
 workspaceId: "workspace_demo",
 userId: "user_jordan",
 calendarId: "calendar_demo"
 },
 {
 recurrenceRangeStart: "2026-07-01T00:00:00.000Z",
 recurrenceRangeEnd: "2026-09-01T00:00:00.000Z"
 }
 );

 assert.deepEqual(
 events.map((event) => event.start),
 ["2026-07-31T18:00:00.000Z", "2026-08-28T18:00:00.000Z"]
 );
});

test("expands monthly recurring VEVENT entries with BYDAY and BYSETPOS", () => {
 const events = parseIcsCalendarEvents(
 [
 "BEGIN:VCALENDAR",
 "VERSION:2.0",
 "BEGIN:VEVENT",
 "UID:event_demo_last_weekday",
 "SUMMARY:Last weekday review",
 "DTSTART:20260701T170000Z",
 "DTEND:20260731T173000Z",
 "RRULE:FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1;COUNT=3",
 "END:VEVENT",
 "END:VCALENDAR"
 ].join("\r\n"),
 {
 tenantId: "tenant_demo",
 workspaceId: "workspace_demo",
 userId: "user_jordan",
 calendarId: "calendar_demo"
 },
 {
 recurrenceRangeStart: "2026-07-01T00:00:00.000Z",
 recurrenceRangeEnd: "2026-10-01T00:00:00.000Z"
 }
 );

 assert.deepEqual(
 events.map((event) => event.start),
 [
 "2026-07-31T17:00:00.000Z",
 "2026-08-31T17:00:00.000Z",
 "2026-09-30T17:00:00.000Z"
 ]
 );
});

test("rejects invalid recurring VEVENT BYSETPOS", () => {
 assert.throws(
 () =>
 parseIcsCalendarEvents(
 [
 "BEGIN:VCALENDAR",
 "VERSION:2.0",
 "BEGIN:VEVENT",
 "UID:event_demo_invalid_bysetpos",
 "SUMMARY:Invalid recurrence",
 "DTSTART:20260701T170000Z",
 "DTEND:20260701T173000Z",
 "RRULE:FREQ=MONTHLY;BYDAY=MO;BYSETPOS=0",
 "END:VEVENT",
 "END:VCALENDAR"
 ].join("\r\n"),
 {
 tenantId: "tenant_demo",
 workspaceId: "workspace_demo",
 userId: "user_jordan",
 calendarId: "calendar_demo"
 },
 {
 recurrenceRangeStart: "2026-07-01T00:00:00.000Z",
 recurrenceRangeEnd: "2026-10-01T00:00:00.000Z"
 }
 ),
 /Invalid ICS RRULE BYSETPOS: 0/
 );
});

test("expands yearly recurring VEVENT entries with BYMONTH", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_march_retreat",
      "SUMMARY:March retreat",
      "DTSTART:20260110T140000Z",
      "DTEND:20260110T160000Z",
      "RRULE:FREQ=YEARLY;BYMONTH=3;COUNT=3",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-01-01T00:00:00.000Z",
      recurrenceRangeEnd: "2029-01-01T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => event.start),
    [
      "2026-03-10T14:00:00.000Z",
      "2027-03-10T14:00:00.000Z",
      "2028-03-10T14:00:00.000Z"
    ]
  );
});

test("expands yearly recurring VEVENT entries with BYMONTH and ordinal BYDAY", () => {
 const events = parseIcsCalendarEvents(
 [
 "BEGIN:VCALENDAR",
 "VERSION:2.0",
 "BEGIN:VEVENT",
 "UID:event_demo_first_monday_march",
 "SUMMARY:First Monday March review",
 "DTSTART:20260302T150000Z",
 "DTEND:20260302T160000Z",
 "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=1MO;COUNT=2",
 "END:VEVENT",
 "END:VCALENDAR"
 ].join("\r\n"),
 {
 tenantId: "tenant_demo",
 workspaceId: "workspace_demo",
 userId: "user_jordan",
 calendarId: "calendar_demo"
 },
 {
 recurrenceRangeStart: "2026-01-01T00:00:00.000Z",
 recurrenceRangeEnd: "2028-01-01T00:00:00.000Z"
 }
 );

 assert.deepEqual(
 events.map((event) => event.start),
 ["2026-03-02T15:00:00.000Z", "2027-03-01T15:00:00.000Z"]
 );
});

test("expands yearly recurring VEVENT entries with BYMONTH BYDAY and BYSETPOS", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_last_march_weekday",
      "SUMMARY:Last March weekday review",
      "DTSTART:20260301T150000Z",
      "DTEND:20260301T160000Z",
      "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1;COUNT=2",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-01-01T00:00:00.000Z",
      recurrenceRangeEnd: "2028-01-01T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => event.start),
    ["2026-03-31T15:00:00.000Z", "2027-03-31T15:00:00.000Z"]
  );
});

test("applies yearly BYSETPOS across the full yearly candidate set", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_last_quarter_weekday",
      "SUMMARY:Last quarter weekday review",
      "DTSTART:20260101T150000Z",
      "DTEND:20260101T160000Z",
      "RRULE:FREQ=YEARLY;BYMONTH=3,6,9,12;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1;COUNT=2",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-01-01T00:00:00.000Z",
      recurrenceRangeEnd: "2028-01-01T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => event.start),
    ["2026-12-31T15:00:00.000Z", "2027-12-31T15:00:00.000Z"]
  );
});

test("expands yearly recurring VEVENT entries with BYYEARDAY", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_year_day_review",
      "SUMMARY:Year-day review",
      "DTSTART:20260101T150000Z",
      "DTEND:20260101T160000Z",
      "RRULE:FREQ=YEARLY;BYYEARDAY=100,-1;COUNT=4",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-01-01T00:00:00.000Z",
      recurrenceRangeEnd: "2028-01-01T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => event.start),
    [
      "2026-04-10T15:00:00.000Z",
      "2026-12-31T15:00:00.000Z",
      "2027-04-10T15:00:00.000Z",
      "2027-12-31T15:00:00.000Z"
    ]
  );
});

test("intersects yearly BYYEARDAY entries with BYMONTH", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_year_day_march",
      "SUMMARY:Year-day March review",
      "DTSTART:20260101T150000Z",
      "DTEND:20260101T160000Z",
      "RRULE:FREQ=YEARLY;BYYEARDAY=60,91;BYMONTH=3;COUNT=2",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-01-01T00:00:00.000Z",
      recurrenceRangeEnd: "2028-01-01T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => event.start),
    ["2026-03-01T15:00:00.000Z", "2027-03-01T15:00:00.000Z"]
  );
});

test("rejects invalid recurring VEVENT BYYEARDAY zero", () => {
  assert.throws(
    () =>
      parseIcsCalendarEvents(
        [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "BEGIN:VEVENT",
          "UID:event_demo_invalid_yearday",
          "SUMMARY:Invalid yearday",
          "DTSTART:20260101T150000Z",
          "DTEND:20260101T160000Z",
          "RRULE:FREQ=YEARLY;BYYEARDAY=0",
          "END:VEVENT",
          "END:VCALENDAR"
        ].join("\r\n"),
        {
          tenantId: "tenant_demo",
          workspaceId: "workspace_demo",
          userId: "user_jordan",
          calendarId: "calendar_demo"
        },
        {
          recurrenceRangeStart: "2026-01-01T00:00:00.000Z",
          recurrenceRangeEnd: "2028-01-01T00:00:00.000Z"
        }
      ),
    /Invalid ICS RRULE BYYEARDAY: 0/
  );
});

test("expands weekly recurring VEVENT entries with interval and until", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",

      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_weekly_review",
      "SUMMARY:Weekly review",
      "DTSTART:20260722T150000Z",
      "DTEND:20260722T160000Z",
      "RRULE:FREQ=WEEKLY;INTERVAL=2;UNTIL=20260819T235959Z",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-07-29T00:00:00.000Z",
      recurrenceRangeEnd: "2026-08-20T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => event.start),
    ["2026-08-05T15:00:00.000Z", "2026-08-19T15:00:00.000Z"]
  );
});

test("expands weekly recurring VEVENT entries across BYDAY weekdays", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_weekly_team_rhythm",
      "SUMMARY:Team rhythm",
      "DTSTART:20260720T140000Z",
      "DTEND:20260720T150000Z",
      "RRULE:FREQ=WEEKLY;BYDAY=MO,WE;COUNT=4",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-07-20T00:00:00.000Z",
      recurrenceRangeEnd: "2026-08-01T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => event.start),
    [
      "2026-07-20T14:00:00.000Z",
      "2026-07-22T14:00:00.000Z",
      "2026-07-27T14:00:00.000Z",
      "2026-07-29T14:00:00.000Z"
    ]
  );
});

test("expands weekly recurring VEVENT entries with BYDAY and BYSETPOS", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_weekly_last_candidate",
      "SUMMARY:Weekly last candidate",
      "DTSTART:20260720T140000Z",
      "DTEND:20260720T150000Z",
      "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;BYSETPOS=-1;COUNT=3",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-07-20T00:00:00.000Z",
      recurrenceRangeEnd: "2026-08-10T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => event.start),
    [
      "2026-07-24T14:00:00.000Z",
      "2026-07-31T14:00:00.000Z",
      "2026-08-07T14:00:00.000Z"
    ]
  );
});

test("keeps weekly BYDAY BYHOUR BYSETPOS recurring VEVENT entries with IANA TZID on local wall time across DST", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_new_york_weekly_last_window",
      "SUMMARY:New York weekly last focus window",
      "DTSTART;TZID=America/New_York:20250303T093000",
      "DTEND;TZID=America/New_York:20250303T100000",
      "RRULE:FREQ=WEEKLY;BYDAY=MO,WE;BYHOUR=9,13;BYMINUTE=30;BYSETPOS=-1;COUNT=2",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2025-03-03T00:00:00.000Z",
      recurrenceRangeEnd: "2025-03-17T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({
      start: event.start,
      end: event.end,
      timezone: event.timezone
    })),
    [
      {
        start: "2025-03-05T18:30:00.000Z",
        end: "2025-03-05T19:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2025-03-12T17:30:00.000Z",
        end: "2025-03-12T18:00:00.000Z",
        timezone: "America/New_York"
      }
    ]
  );
});

test("expands weekly recurring VEVENT entries with BYDAY time windows", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_weekly_time_windows",
      "SUMMARY:Weekly focus windows",
      "DTSTART:20260720T093000Z",
      "DTEND:20260720T100000Z",
      "RRULE:FREQ=WEEKLY;BYDAY=MO;BYHOUR=9,13;BYMINUTE=30;BYSECOND=0;COUNT=4",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-07-20T00:00:00.000Z",
      recurrenceRangeEnd: "2026-08-04T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({ start: event.start, end: event.end })),
    [
      {
        start: "2026-07-20T09:30:00.000Z",
        end: "2026-07-20T10:00:00.000Z"
      },
      {
        start: "2026-07-20T13:30:00.000Z",
        end: "2026-07-20T14:00:00.000Z"
      },
      {
        start: "2026-07-27T09:30:00.000Z",
        end: "2026-07-27T10:00:00.000Z"
      },
      {
        start: "2026-07-27T13:30:00.000Z",
        end: "2026-07-27T14:00:00.000Z"
      }
    ]
  );
});

test("expands weekly recurring VEVENT entries with BYDAY and BYMONTH filters", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_weekly_february_rhythm",
      "SUMMARY:February rhythm",
      "DTSTART:20260105T140000Z",
      "DTEND:20260105T150000Z",
      "RRULE:FREQ=WEEKLY;BYDAY=MO,WE;BYMONTH=2;COUNT=4",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-01-01T00:00:00.000Z",
      recurrenceRangeEnd: "2026-03-01T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => event.start),
    [
      "2026-02-02T14:00:00.000Z",
      "2026-02-04T14:00:00.000Z",
      "2026-02-09T14:00:00.000Z",
      "2026-02-11T14:00:00.000Z"
    ]
  );
});

test("expands weekly recurring VEVENT entries with WKST interval boundaries", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_weekly_sunday_start",
      "SUMMARY:Sunday-start weekly rhythm",
      "DTSTART:20260705T140000Z",
      "DTEND:20260705T150000Z",
      "RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO;WKST=SU;COUNT=3",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-07-01T00:00:00.000Z",
      recurrenceRangeEnd: "2026-08-20T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => event.start),
    [
      "2026-07-06T14:00:00.000Z",
      "2026-07-20T14:00:00.000Z",
      "2026-08-03T14:00:00.000Z"
    ]
  );
});

test("excludes recurring VEVENT occurrences listed in EXDATE", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_daily_prayer",
      "SUMMARY:Daily prayer",
      "DTSTART:20260722T120000Z",
      "DTEND:20260722T123000Z",
      "RRULE:FREQ=DAILY;COUNT=4",
      "EXDATE:20260723T120000Z",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-07-22T00:00:00.000Z",
      recurrenceRangeEnd: "2026-07-27T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => event.start),
    [
      "2026-07-22T12:00:00.000Z",
      "2026-07-24T12:00:00.000Z",
      "2026-07-25T12:00:00.000Z"
    ]
  );
});

test("excludes timed recurring VEVENT occurrence dates listed in date-only EXDATE", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_date_excluded",
      "SUMMARY:Daily planning",
      "DTSTART:20260722T160000Z",
      "DTEND:20260722T170000Z",
      "RRULE:FREQ=DAILY;COUNT=3",
      "EXDATE;VALUE=DATE:20260723",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-07-22T00:00:00.000Z",
      recurrenceRangeEnd: "2026-07-26T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({ start: event.start, end: event.end })),
    [
      {
        start: "2026-07-22T16:00:00.000Z",
        end: "2026-07-22T17:00:00.000Z"
      },
      {
        start: "2026-07-24T16:00:00.000Z",
        end: "2026-07-24T17:00:00.000Z"
      }
    ]
  );
});

test("adds recurring VEVENT occurrences listed in RDATE", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_monthly_leadership",
      "SUMMARY:Leadership check-in",
      "DTSTART:20260722T160000Z",
      "DTEND:20260722T170000Z",
      "RRULE:FREQ=WEEKLY;COUNT=1",
      "RDATE:20260729T160000Z,20260805T160000Z",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-07-22T00:00:00.000Z",
      recurrenceRangeEnd: "2026-08-06T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => event.start),
    [
      "2026-07-22T16:00:00.000Z",
      "2026-07-29T16:00:00.000Z",
      "2026-08-05T16:00:00.000Z"
    ]
  );
});

test("expands VEVENT entries with RDATE and no RRULE", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_special_services",
      "SUMMARY:Special service",
      "DTSTART:20260722T160000Z",
      "DTEND:20260722T170000Z",
      "RDATE:20260729T160000Z,20260805T160000Z",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-07-22T00:00:00.000Z",
      recurrenceRangeEnd: "2026-08-06T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({
      externalId: event.externalId,
      start: event.start,
      end: event.end
    })),
    [
      {
        externalId: "event_demo_special_services:20260722T160000Z",
        start: "2026-07-22T16:00:00.000Z",
        end: "2026-07-22T17:00:00.000Z"
      },
      {
        externalId: "event_demo_special_services:20260729T160000Z",
        start: "2026-07-29T16:00:00.000Z",
        end: "2026-07-29T17:00:00.000Z"
      },
      {
        externalId: "event_demo_special_services:20260805T160000Z",
        start: "2026-08-05T16:00:00.000Z",
        end: "2026-08-05T17:00:00.000Z"
      }
    ]
  );
});

test("exports provider-neutral calendar events as escaped ICS", () => {
  const event: CalendarEvent = {
    id: "event_demo_review",
    tenantId: "tenant_demo",
    workspaceId: "workspace_demo",
    userId: "user_jordan",
    calendarId: "calendar_demo",
    title: "Review proposal, notes",
    start: "2026-07-22T15:00:00.000Z",
    end: "2026-07-22T16:30:00.000Z",
    timezone: "UTC",
    allDay: false,
    status: "CONFIRMED",
    busyStatus: "BUSY",
    movable: false,
    locked: true,
    privacyLevel: "PUBLIC",
    version: 3,
    sourceSystem: "LOCAL"
  };

  const ics = exportCalendarEventsToIcs([event], {
    productId: "-//ScheduleOS//Demo//EN",
    calendarName: "ScheduleOS Demo"
  });

  assert.match(ics, /BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-\/\/ScheduleOS\/\/Demo\/\/EN/);
  assert.match(ics, /X-WR-CALNAME:ScheduleOS Demo/);
  assert.match(ics, /UID:event_demo_review/);
  assert.match(ics, /SUMMARY:Review proposal\\, notes/);
  assert.match(ics, /DTSTART:20260722T150000Z/);
  assert.match(ics, /DTEND:20260722T163000Z/);
  assert.match(ics, /STATUS:CONFIRMED/);
  assert.match(ics, /TRANSP:OPAQUE/);
  assert.match(ics, /CLASS:PUBLIC/);
  assert.match(ics, /X-SCHEDULEOS-TENANT:tenant_demo/);
  assert.match(ics, /END:VCALENDAR\r\n$/);
});

test("redacts private calendar event titles by default", () => {
  const privateEvent: CalendarEvent = {
    id: "event_demo_private",
    tenantId: "tenant_demo",
    workspaceId: "workspace_demo",
    userId: "user_jordan",
    calendarId: "calendar_demo",
    title: "Private counseling appointment",
    start: "2026-07-22T15:00:00.000Z",
    end: "2026-07-22T16:00:00.000Z",
    timezone: "UTC",
    allDay: false,
    status: "CONFIRMED",
    busyStatus: "BUSY",
    movable: false,
    locked: true,
    privacyLevel: "PRIVATE",
    version: 1
  };

  const ics = exportCalendarEventsToIcs([privateEvent]);

  assert.match(ics, /SUMMARY:Busy/);
  assert.doesNotMatch(ics, /Private counseling appointment/);
  assert.match(ics, /CLASS:PRIVATE/);
});

test("exports accepted schedule blocks as calendar events", () => {
  const blocks: TimeBlock[] = [
    {
      id: "block_demo_accepted",
      taskId: "task_demo_proposal",
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      start: "2026-07-22T15:00:00.000Z",
      end: "2026-07-22T16:30:00.000Z",
      status: "ACCEPTED",
      locked: false
    },
    {
      id: "block_demo_locked",
      taskId: "task_demo_focus",
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      start: "2026-07-22T17:00:00.000Z",
      end: "2026-07-22T18:00:00.000Z",
      status: "LOCKED",
      locked: true
    },
    {
      id: "block_demo_proposed",
      taskId: "task_demo_draft",
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      start: "2026-07-22T19:00:00.000Z",
      end: "2026-07-22T20:00:00.000Z",
      status: "PROPOSED",
      locked: false
    }
  ];

  const tasks: SchedulingTask[] = [
    task("task_demo_proposal", "Review proposal"),
    task("task_demo_focus", "Protect focus time"),
    task("task_demo_draft", "Draft unsent note")
  ];

  const ics = exportScheduleBlocksToIcs(blocks, tasks, {
    calendarId: "calendar_scheduleos",
    calendarName: "ScheduleOS Plan",
    productId: "-//ScheduleOS//Plan Export//EN"
  });

  assert.match(ics, /UID:block_demo_accepted/);
  assert.match(ics, /SUMMARY:Review proposal/);
  assert.match(ics, /UID:block_demo_locked/);
  assert.match(ics, /SUMMARY:Protect focus time/);
  assert.doesNotMatch(ics, /Draft unsent note/);
  assert.match(ics, /X-SCHEDULEOS-CALENDAR:calendar_scheduleos/);
});

const task = (id: string, title: string): SchedulingTask => ({
id,
tenantId: "tenant_demo",
workspaceId: "workspace_demo",
userId: "user_jordan",
  ownerId: "user_jordan",
  title,
  priority: "MEDIUM",
  estimatedDurationMinutes: 60,
  remainingDurationMinutes: 60,
  schedulingMode: "DEADLINE_DRIVEN",
  splittable: false,
  schedulingEligible: true,
  blocked: false,
  waiting: false,
  confidence: "CONFIRMED",
createdAt: "2026-07-21T12:00:00.000Z",
updatedAt: "2026-07-21T12:00:00.000Z"
});

test("expands VEVENT entries with RDATE PERIOD values", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_period_retreat",
      "SUMMARY:Retreat planning",
      "DTSTART:20260722T160000Z",
      "DTEND:20260722T170000Z",
      "RDATE;VALUE=PERIOD:20260729T160000Z/20260729T183000Z,20260805T160000Z/PT2H",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-07-22T00:00:00.000Z",
      recurrenceRangeEnd: "2026-08-06T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({
      externalId: event.externalId,
      start: event.start,
      end: event.end
    })),
    [
      {
        externalId: "event_demo_period_retreat:20260722T160000Z",
        start: "2026-07-22T16:00:00.000Z",
        end: "2026-07-22T17:00:00.000Z"
      },
      {
        externalId: "event_demo_period_retreat:20260729T160000Z",
        start: "2026-07-29T16:00:00.000Z",
        end: "2026-07-29T18:30:00.000Z"
      },
      {
        externalId: "event_demo_period_retreat:20260805T160000Z",
        start: "2026-08-05T16:00:00.000Z",
        end: "2026-08-05T18:00:00.000Z"
      }
    ]
  );
});

test("expands all-day recurring VEVENT entries with date-only UNTIL", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_until_date",
      "SUMMARY:Daily boundary",
      "DTSTART;VALUE=DATE:20260722",
      "DTEND;VALUE=DATE:20260723",
      "RRULE:FREQ=DAILY;UNTIL=20260724",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-07-22T00:00:00.000Z",
      recurrenceRangeEnd: "2026-07-26T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({ start: event.start, end: event.end, allDay: event.allDay })),
    [
      {
        start: "2026-07-22T00:00:00.000Z",
        end: "2026-07-23T00:00:00.000Z",
        allDay: true
      },
      {
        start: "2026-07-23T00:00:00.000Z",
        end: "2026-07-24T00:00:00.000Z",
        allDay: true
      },
      {
        start: "2026-07-24T00:00:00.000Z",
        end: "2026-07-25T00:00:00.000Z",
        allDay: true
      }
    ]
  );
});

test("expands timed recurring VEVENT entries through date-only UNTIL day", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_timed_until_date",
      "SUMMARY:Daily leadership block",
      "DTSTART:20260722T160000Z",
      "DTEND:20260722T170000Z",
      "RRULE:FREQ=DAILY;UNTIL=20260724",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-07-22T00:00:00.000Z",
      recurrenceRangeEnd: "2026-07-26T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({ start: event.start, end: event.end })),
    [
      {
        start: "2026-07-22T16:00:00.000Z",
        end: "2026-07-22T17:00:00.000Z"
      },
      {
        start: "2026-07-23T16:00:00.000Z",
        end: "2026-07-23T17:00:00.000Z"
      },
      {
        start: "2026-07-24T16:00:00.000Z",
        end: "2026-07-24T17:00:00.000Z"
      }
    ]
  );
});

test("imports fixed VEVENT entries with IANA TZID local times", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_new_york_focus",
      "SUMMARY:New York focus block",
      "DTSTART;TZID=America/New_York:20260722T090000",
      "DTEND;TZID=America/New_York:20260722T100000",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    }
  );

  assert.deepEqual(
    events.map((event) => ({
      start: event.start,
      end: event.end,
      timezone: event.timezone
    })),
    [
      {
        start: "2026-07-22T13:00:00.000Z",
        end: "2026-07-22T14:00:00.000Z",
        timezone: "America/New_York"
      }
    ]
  );
});

test("keeps recurring VEVENT entries with IANA TZID on the same local wall time across DST", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_new_york_daily_focus",
      "SUMMARY:New York daily focus",
      "DTSTART;TZID=America/New_York:20260307T090000",
      "DTEND;TZID=America/New_York:20260307T100000",
      "RRULE:FREQ=DAILY;COUNT=3",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-03-07T00:00:00.000Z",
      recurrenceRangeEnd: "2026-03-10T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({
      start: event.start,
      end: event.end,
      timezone: event.timezone
    })),
    [
      {
        start: "2026-03-07T14:00:00.000Z",
        end: "2026-03-07T15:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-03-08T13:00:00.000Z",
        end: "2026-03-08T14:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-03-09T13:00:00.000Z",
        end: "2026-03-09T14:00:00.000Z",
        timezone: "America/New_York"
      }
    ]
  );
});

test("keeps daily time-window VEVENT entries with IANA TZID on local wall time across DST", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_new_york_daily_time_window_focus",
      "SUMMARY:New York daily time-window focus",
      "DTSTART;TZID=America/New_York:20260307T090000",
      "DTEND;TZID=America/New_York:20260307T100000",
      "RRULE:FREQ=DAILY;BYHOUR=9;BYMINUTE=30;BYSECOND=0;COUNT=3",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-03-07T00:00:00.000Z",
      recurrenceRangeEnd: "2026-03-10T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({
      start: event.start,
      end: event.end,
      timezone: event.timezone
    })),
    [
      {
        start: "2026-03-07T14:30:00.000Z",
        end: "2026-03-07T15:30:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-03-08T13:30:00.000Z",
        end: "2026-03-08T14:30:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-03-09T13:30:00.000Z",
        end: "2026-03-09T14:30:00.000Z",
        timezone: "America/New_York"
      }
    ]
  );
});

test("keeps weekly time-window VEVENT entries with IANA TZID on local wall time across DST", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_new_york_weekly_time_window_focus",
      "SUMMARY:New York weekly time-window focus",
      "DTSTART;TZID=America/New_York:20260302T090000",
      "DTEND;TZID=America/New_York:20260302T100000",
      "RRULE:FREQ=WEEKLY;BYDAY=MO,WE;BYHOUR=9;BYMINUTE=30;BYSECOND=0;COUNT=4",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-03-01T00:00:00.000Z",
      recurrenceRangeEnd: "2026-03-12T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({
      start: event.start,
      end: event.end,
      timezone: event.timezone
    })),
    [
      {
        start: "2026-03-02T14:30:00.000Z",
        end: "2026-03-02T15:30:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-03-04T14:30:00.000Z",
        end: "2026-03-04T15:30:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-03-09T13:30:00.000Z",
        end: "2026-03-09T14:30:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-03-11T13:30:00.000Z",
        end: "2026-03-11T14:30:00.000Z",
        timezone: "America/New_York"
      }
    ]
  );
});

test("keeps monthly time-window VEVENT entries with IANA TZID on local wall time across DST", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_new_york_monthly_time_window_focus",
      "SUMMARY:New York monthly time-window focus",
      "DTSTART;TZID=America/New_York:20260301T090000",
      "DTEND;TZID=America/New_York:20260301T100000",
      "RRULE:FREQ=MONTHLY;BYMONTHDAY=1,15;BYHOUR=9;BYMINUTE=30;BYSECOND=0;COUNT=4",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-03-01T00:00:00.000Z",
      recurrenceRangeEnd: "2026-04-16T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({
      start: event.start,
      end: event.end,
      timezone: event.timezone
    })),
    [
      {
        start: "2026-03-01T14:30:00.000Z",
        end: "2026-03-01T15:30:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-03-15T13:30:00.000Z",
        end: "2026-03-15T14:30:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-04-01T13:30:00.000Z",
        end: "2026-04-01T14:30:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-04-15T13:30:00.000Z",
        end: "2026-04-15T14:30:00.000Z",
        timezone: "America/New_York"
      }
    ]
  );
});

test("keeps weekly recurring VEVENT entries with IANA TZID on the same local wall time across DST", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_new_york_weekly_focus",
      "SUMMARY:New York weekly focus",
      "DTSTART;TZID=America/New_York:20260301T090000",
      "DTEND;TZID=America/New_York:20260301T100000",
      "RRULE:FREQ=WEEKLY;COUNT=3",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-03-01T00:00:00.000Z",
      recurrenceRangeEnd: "2026-03-16T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({
      start: event.start,
      end: event.end,
      timezone: event.timezone
    })),
    [
      {
        start: "2026-03-01T14:00:00.000Z",
        end: "2026-03-01T15:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-03-08T13:00:00.000Z",
        end: "2026-03-08T14:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-03-15T13:00:00.000Z",
        end: "2026-03-15T14:00:00.000Z",
        timezone: "America/New_York"
      }
    ]
  );
});

test("keeps monthly recurring VEVENT entries with IANA TZID on the same local wall time across DST", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_new_york_monthly_focus",
      "SUMMARY:New York monthly focus",
      "DTSTART;TZID=America/New_York:20260115T090000",
      "DTEND;TZID=America/New_York:20260115T100000",
      "RRULE:FREQ=MONTHLY;COUNT=4",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-01-01T00:00:00.000Z",
      recurrenceRangeEnd: "2026-05-01T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({
      start: event.start,
      end: event.end,
      timezone: event.timezone
    })),
    [
      {
        start: "2026-01-15T14:00:00.000Z",
        end: "2026-01-15T15:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-02-15T14:00:00.000Z",
        end: "2026-02-15T15:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-03-15T13:00:00.000Z",
        end: "2026-03-15T14:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-04-15T13:00:00.000Z",
        end: "2026-04-15T14:00:00.000Z",
        timezone: "America/New_York"
      }
    ]
  );
});

test("keeps monthly BYMONTHDAY recurring VEVENT entries with IANA TZID on local wall time across DST", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_new_york_monthly_owner_review",
      "SUMMARY:New York monthly owner review",
      "DTSTART;TZID=America/New_York:20260115T090000",
      "DTEND;TZID=America/New_York:20260115T100000",
      "RRULE:FREQ=MONTHLY;BYMONTHDAY=15;COUNT=4",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-01-01T00:00:00.000Z",
      recurrenceRangeEnd: "2026-05-01T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({
      start: event.start,
      end: event.end,
      timezone: event.timezone
    })),
    [
      {
        start: "2026-01-15T14:00:00.000Z",
        end: "2026-01-15T15:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-02-15T14:00:00.000Z",
        end: "2026-02-15T15:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-03-15T13:00:00.000Z",
        end: "2026-03-15T14:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-04-15T13:00:00.000Z",
        end: "2026-04-15T14:00:00.000Z",
        timezone: "America/New_York"
      }
    ]
  );
});

test("keeps yearly recurring VEVENT entries with IANA TZID on local wall time across DST-status years", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_new_york_yearly_review",
      "SUMMARY:New York yearly review",
      "DTSTART;TZID=America/New_York:20250308T090000",
      "DTEND;TZID=America/New_York:20250308T100000",
      "RRULE:FREQ=YEARLY;COUNT=3",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2025-01-01T00:00:00.000Z",
      recurrenceRangeEnd: "2028-01-01T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({
      start: event.start,
      end: event.end,
      timezone: event.timezone
    })),
    [
      {
        start: "2025-03-08T14:00:00.000Z",
        end: "2025-03-08T15:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-03-08T13:00:00.000Z",
        end: "2026-03-08T14:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2027-03-08T14:00:00.000Z",
        end: "2027-03-08T15:00:00.000Z",
        timezone: "America/New_York"
      }
    ]
  );
});

test("keeps yearly time-window VEVENT entries with IANA TZID on local wall time across DST-status dates", () => {
const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_new_york_yearly_time_window_focus",
      "SUMMARY:New York yearly time-window focus",
      "DTSTART;TZID=America/New_York:20250115T090000",
      "DTEND;TZID=America/New_York:20250115T100000",
      "RRULE:FREQ=YEARLY;BYMONTH=1,7;BYMONTHDAY=15;BYHOUR=9;BYMINUTE=30;BYSECOND=0;COUNT=4",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2025-01-01T00:00:00.000Z",
      recurrenceRangeEnd: "2027-01-01T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({
      start: event.start,
      end: event.end,
      timezone: event.timezone
    })),
    [
      {
        start: "2025-01-15T14:30:00.000Z",
        end: "2025-01-15T15:30:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2025-07-15T13:30:00.000Z",
        end: "2025-07-15T14:30:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-01-15T14:30:00.000Z",
        end: "2026-01-15T15:30:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-07-15T13:30:00.000Z",
        end: "2026-07-15T14:30:00.000Z",
        timezone: "America/New_York"
      }
    ]
);
});

test("keeps yearly BYMONTH BYMONTHDAY BYHOUR BYSETPOS VEVENT entries with IANA TZID on local wall time across DST-status dates", () => {
const events = parseIcsCalendarEvents(
[
"BEGIN:VCALENDAR",
"VERSION:2.0",
"BEGIN:VEVENT",
"UID:event_demo_new_york_yearly_last_time_window_focus",
"SUMMARY:New York yearly last time-window focus",
"DTSTART;TZID=America/New_York:20250115T090000",
"DTEND;TZID=America/New_York:20250115T100000",
"RRULE:FREQ=YEARLY;BYMONTH=1,7;BYMONTHDAY=15;BYHOUR=9,13;BYMINUTE=30;BYSETPOS=-1;COUNT=2",
"END:VEVENT",
"END:VCALENDAR"
].join("\r\n"),
{
tenantId: "tenant_demo",
workspaceId: "workspace_demo",
userId: "user_jordan",
calendarId: "calendar_demo"
},
{
recurrenceRangeStart: "2025-01-01T00:00:00.000Z",
recurrenceRangeEnd: "2027-01-01T00:00:00.000Z"
}
);

assert.deepEqual(
events.map((event) => ({
start: event.start,
end: event.end,
timezone: event.timezone
})),
[
{
start: "2025-07-15T17:30:00.000Z",
end: "2025-07-15T18:30:00.000Z",
timezone: "America/New_York"
},
{
start: "2026-07-15T17:30:00.000Z",
end: "2026-07-15T18:30:00.000Z",
timezone: "America/New_York"
}
]
);
});

test("keeps yearly BYMONTH BYMONTHDAY recurring VEVENT entries with IANA TZID on local wall time across DST-status years", () => {
const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_new_york_yearly_strategy_day",
      "SUMMARY:New York yearly strategy day",
      "DTSTART;TZID=America/New_York:20250308T090000",
      "DTEND;TZID=America/New_York:20250308T100000",
      "RRULE:FREQ=YEARLY;BYMONTH=3;BYMONTHDAY=8;COUNT=3",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2025-01-01T00:00:00.000Z",
      recurrenceRangeEnd: "2028-01-01T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({
      start: event.start,
      end: event.end,
      timezone: event.timezone
    })),
    [
      {
        start: "2025-03-08T14:00:00.000Z",
        end: "2025-03-08T15:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-03-08T13:00:00.000Z",
        end: "2026-03-08T14:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2027-03-08T14:00:00.000Z",
        end: "2027-03-08T15:00:00.000Z",
        timezone: "America/New_York"
      }
    ]
  );
});

test("keeps yearly BYMONTH recurring VEVENT entries with IANA TZID on local wall time across DST-status years", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_new_york_yearly_march_review",
      "SUMMARY:New York yearly March review",
      "DTSTART;TZID=America/New_York:20250308T090000",
      "DTEND;TZID=America/New_York:20250308T100000",
      "RRULE:FREQ=YEARLY;BYMONTH=3;COUNT=3",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2025-01-01T00:00:00.000Z",
      recurrenceRangeEnd: "2028-01-01T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({
      start: event.start,
      end: event.end,
      timezone: event.timezone
    })),
    [
      {
        start: "2025-03-08T14:00:00.000Z",
        end: "2025-03-08T15:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-03-08T13:00:00.000Z",
        end: "2026-03-08T14:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2027-03-08T14:00:00.000Z",
        end: "2027-03-08T15:00:00.000Z",
        timezone: "America/New_York"
      }
    ]
  );
});

test("keeps yearly BYMONTH ordinal BYDAY recurring VEVENT entries with IANA TZID on local wall time across DST-status years", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_new_york_yearly_second_monday_march_review",
      "SUMMARY:New York yearly second Monday March review",
      "DTSTART;TZID=America/New_York:20250310T090000",
      "DTEND;TZID=America/New_York:20250310T100000",
      "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2MO;COUNT=3",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2025-01-01T00:00:00.000Z",
      recurrenceRangeEnd: "2028-01-01T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({
      start: event.start,
      end: event.end,
      timezone: event.timezone
    })),
    [
      {
        start: "2025-03-10T13:00:00.000Z",
        end: "2025-03-10T14:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-03-09T13:00:00.000Z",
        end: "2026-03-09T14:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2027-03-08T14:00:00.000Z",
        end: "2027-03-08T15:00:00.000Z",
        timezone: "America/New_York"
      }
    ]
  );
});

test("keeps yearly BYMONTH plain BYDAY recurring VEVENT entries with IANA TZID on local wall time across DST", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_new_york_yearly_march_mondays_review",
      "SUMMARY:New York yearly March Mondays review",
      "DTSTART;TZID=America/New_York:20250303T090000",
      "DTEND;TZID=America/New_York:20250303T100000",
      "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=MO;COUNT=6",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2025-01-01T00:00:00.000Z",
      recurrenceRangeEnd: "2027-01-01T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({
      start: event.start,
      end: event.end,
      timezone: event.timezone
    })),
    [
      {
        start: "2025-03-03T14:00:00.000Z",
        end: "2025-03-03T15:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2025-03-10T13:00:00.000Z",
        end: "2025-03-10T14:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2025-03-17T13:00:00.000Z",
        end: "2025-03-17T14:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2025-03-24T13:00:00.000Z",
        end: "2025-03-24T14:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2025-03-31T13:00:00.000Z",
        end: "2025-03-31T14:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-03-02T14:00:00.000Z",
        end: "2026-03-02T15:00:00.000Z",
        timezone: "America/New_York"
      }
    ]
  );
});

test("keeps yearly BYYEARDAY recurring VEVENT entries with IANA TZID on local wall time across DST-status dates", () => {
 const events = parseIcsCalendarEvents(
 [
 "BEGIN:VCALENDAR",
 "VERSION:2.0",
 "BEGIN:VEVENT",
 "UID:event_demo_new_york_year_day_review",
 "SUMMARY:New York year-day review",
 "DTSTART;TZID=America/New_York:20250101T090000",
 "DTEND;TZID=America/New_York:20250101T100000",
 "RRULE:FREQ=YEARLY;BYYEARDAY=1,100;COUNT=4",
 "END:VEVENT",
 "END:VCALENDAR"
 ].join("\r\n"),
 {
 tenantId: "tenant_demo",
 workspaceId: "workspace_demo",
 userId: "user_jordan",
 calendarId: "calendar_demo"
 },
 {
 recurrenceRangeStart: "2025-01-01T00:00:00.000Z",
 recurrenceRangeEnd: "2027-01-01T00:00:00.000Z"
 }
 );

 assert.deepEqual(
 events.map((event) => ({
 start: event.start,
 end: event.end,
 timezone: event.timezone
 })),
 [
 {
 start: "2025-01-01T14:00:00.000Z",
 end: "2025-01-01T15:00:00.000Z",
 timezone: "America/New_York"
 },
 {
 start: "2025-04-10T13:00:00.000Z",
 end: "2025-04-10T14:00:00.000Z",
 timezone: "America/New_York"
 },
 {
 start: "2026-01-01T14:00:00.000Z",
 end: "2026-01-01T15:00:00.000Z",
 timezone: "America/New_York"
 },
 {
 start: "2026-04-10T13:00:00.000Z",
 end: "2026-04-10T14:00:00.000Z",
 timezone: "America/New_York"
 }
 ]
 );
});

test("keeps yearly BYWEEKNO recurring VEVENT entries with IANA TZID on local wall time across DST", () => {
 const events = parseIcsCalendarEvents(
 [
 "BEGIN:VCALENDAR",
 "VERSION:2.0",
 "BEGIN:VEVENT",
 "UID:event_demo_new_york_yearly_week_number_review",
 "SUMMARY:New York yearly week-number review",
 "DTSTART;TZID=America/New_York:20250303T090000",
 "DTEND;TZID=America/New_York:20250303T100000",
 "RRULE:FREQ=YEARLY;BYWEEKNO=10,11;BYDAY=MO;WKST=MO;COUNT=4",
 "END:VEVENT",
 "END:VCALENDAR"
 ].join("\r\n"),
 {
 tenantId: "tenant_demo",
 workspaceId: "workspace_demo",
 userId: "user_jordan",
 calendarId: "calendar_demo"
 },
 {
 recurrenceRangeStart: "2025-01-01T00:00:00.000Z",
 recurrenceRangeEnd: "2027-01-01T00:00:00.000Z"
 }
 );

 assert.deepEqual(
 events.map((event) => ({
 start: event.start,
 end: event.end,
 timezone: event.timezone
 })),
 [
 {
 start: "2025-03-03T14:00:00.000Z",
 end: "2025-03-03T15:00:00.000Z",
 timezone: "America/New_York"
 },
 {
 start: "2025-03-10T13:00:00.000Z",
 end: "2025-03-10T14:00:00.000Z",
 timezone: "America/New_York"
 },
 {
 start: "2026-03-02T14:00:00.000Z",
 end: "2026-03-02T15:00:00.000Z",
 timezone: "America/New_York"
 },
 {
 start: "2026-03-09T13:00:00.000Z",
 end: "2026-03-09T14:00:00.000Z",
 timezone: "America/New_York"
 }
 ]
 );
});

test("keeps weekly BYDAY BYMONTH recurring VEVENT entries with IANA TZID on local wall time across DST", () => {
 const events = parseIcsCalendarEvents(
 [
 "BEGIN:VCALENDAR",
 "VERSION:2.0",
 "BEGIN:VEVENT",
 "UID:event_demo_new_york_weekly_march_monday_focus",
 "SUMMARY:New York weekly March Monday focus",
 "DTSTART;TZID=America/New_York:20250303T090000",
 "DTEND;TZID=America/New_York:20250303T100000",
 "RRULE:FREQ=WEEKLY;BYDAY=MO;BYMONTH=3;COUNT=4",
 "END:VEVENT",
 "END:VCALENDAR"
 ].join("\r\n"),
 {
 tenantId: "tenant_demo",
 workspaceId: "workspace_demo",
 userId: "user_jordan",
 calendarId: "calendar_demo"
 },
 {
 recurrenceRangeStart: "2025-03-01T00:00:00.000Z",
 recurrenceRangeEnd: "2025-04-01T00:00:00.000Z"
 }
 );

 assert.deepEqual(
 events.map((event) => ({
 start: event.start,
 end: event.end,
 timezone: event.timezone
 })),
 [
 {
 start: "2025-03-03T14:00:00.000Z",
 end: "2025-03-03T15:00:00.000Z",
 timezone: "America/New_York"
 },
 {
 start: "2025-03-10T13:00:00.000Z",
 end: "2025-03-10T14:00:00.000Z",
 timezone: "America/New_York"
 },
 {
 start: "2025-03-17T13:00:00.000Z",
 end: "2025-03-17T14:00:00.000Z",
 timezone: "America/New_York"
 },
 {
 start: "2025-03-24T13:00:00.000Z",
 end: "2025-03-24T14:00:00.000Z",
 timezone: "America/New_York"
 }
 ]
 );
});

test("keeps weekly BYDAY recurring VEVENT entries with IANA TZID on local wall time across DST", () => {
 const events = parseIcsCalendarEvents(
 [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_new_york_weekly_byday_focus",
      "SUMMARY:New York weekly BYDAY focus",
      "DTSTART;TZID=America/New_York:20260302T090000",
      "DTEND;TZID=America/New_York:20260302T100000",
      "RRULE:FREQ=WEEKLY;BYDAY=MO,WE;COUNT=4",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-03-01T00:00:00.000Z",
      recurrenceRangeEnd: "2026-03-12T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({
      start: event.start,
      end: event.end,
      timezone: event.timezone
    })),
    [
      {
        start: "2026-03-02T14:00:00.000Z",
        end: "2026-03-02T15:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-03-04T14:00:00.000Z",
        end: "2026-03-04T15:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-03-09T13:00:00.000Z",
        end: "2026-03-09T14:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-03-11T13:00:00.000Z",
        end: "2026-03-11T14:00:00.000Z",
        timezone: "America/New_York"
      }
    ]
  );
});

test("keeps monthly ordinal BYDAY recurring VEVENT entries with IANA TZID on local wall time across DST", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_new_york_monthly_first_monday_focus",
      "SUMMARY:New York first Monday focus",
      "DTSTART;TZID=America/New_York:20260202T090000",
      "DTEND;TZID=America/New_York:20260202T100000",
      "RRULE:FREQ=MONTHLY;BYDAY=1MO;COUNT=3",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-02-01T00:00:00.000Z",
      recurrenceRangeEnd: "2026-05-01T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({
      start: event.start,
      end: event.end,
      timezone: event.timezone
    })),
    [
      {
        start: "2026-02-02T14:00:00.000Z",
        end: "2026-02-02T15:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-03-02T14:00:00.000Z",
        end: "2026-03-02T15:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-04-06T13:00:00.000Z",
        end: "2026-04-06T14:00:00.000Z",
        timezone: "America/New_York"
      }
    ]
  );
});

test("keeps monthly BYDAY recurring VEVENT entries with IANA TZID on local wall time across DST", () => {
  const events = parseIcsCalendarEvents(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:event_demo_new_york_monthly_monday_focus",
      "SUMMARY:New York monthly Mondays focus",
      "DTSTART;TZID=America/New_York:20260223T090000",
      "DTEND;TZID=America/New_York:20260223T100000",
      "RRULE:FREQ=MONTHLY;BYDAY=MO;COUNT=5",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n"),
    {
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      calendarId: "calendar_demo"
    },
    {
      recurrenceRangeStart: "2026-02-01T00:00:00.000Z",
      recurrenceRangeEnd: "2026-04-01T00:00:00.000Z"
    }
  );

  assert.deepEqual(
    events.map((event) => ({
      start: event.start,
      end: event.end,
      timezone: event.timezone
    })),
    [
      {
        start: "2026-02-23T14:00:00.000Z",
        end: "2026-02-23T15:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-03-02T14:00:00.000Z",
        end: "2026-03-02T15:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-03-09T13:00:00.000Z",
        end: "2026-03-09T14:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-03-16T13:00:00.000Z",
        end: "2026-03-16T14:00:00.000Z",
        timezone: "America/New_York"
      },
      {
        start: "2026-03-23T13:00:00.000Z",
        end: "2026-03-23T14:00:00.000Z",
        timezone: "America/New_York"
      }
    ]
  );
});
