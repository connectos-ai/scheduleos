import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { createApiServer } from "./api.js";

type RequestResult = {
  status: number;
  body: any;
};

const request = async (
  baseUrl: string,
  method: string,
  path: string,
  body?: unknown
): Promise<RequestResult> => {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.headers = { "content-type": "application/json" };
    init.body = JSON.stringify(body);
  }
  const response = await fetch(`${baseUrl}${path}`, init);
  return {
    status: response.status,
    body: await response.json()
  };
};

const providerIcsFixtures = [
  {
    name: "google_workspace_sanitized",
    calendarId: "calendar_google_demo",
    expectedCount: 2,
    expectedTitles: ["Google fixture focus series", "Google fixture focus series"],
    expectedStarts: ["2026-07-20T13:00:00.000Z", "2026-08-03T13:00:00.000Z"],
    ics: [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//ScheduleOS Fixture//Google Calendar Sanitized//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:google_fixture_focus_series",
      "SUMMARY:Google fixture focus series",
      "DTSTART;TZID=America/New_York:20260720T090000",
      "DTEND;TZID=America/New_York:20260720T100000",
      "RRULE:FREQ=WEEKLY;COUNT=3;BYDAY=MO",
      "EXDATE;TZID=America/New_York:20260727T090000",
      "TRANSP:OPAQUE",
      "SEQUENCE:2",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n")
  },
  {
    name: "outlook_sanitized",
    calendarId: "calendar_outlook_demo",
    expectedCount: 1,
    expectedTitles: ["Outlook fixture private day"],
    expectedStarts: ["2026-07-28T00:00:00.000Z"],
    ics: [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//ScheduleOS Fixture//Outlook Sanitized//EN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:outlook_fixture_private_day",
      "SUMMARY:Outlook fixture private day",
      "DTSTART;VALUE=DATE:20260728",
      "DTEND;VALUE=DATE:20260729",
      "CLASS:PRIVATE",
      "TRANSP:TRANSPARENT",
      "STATUS:CONFIRMED",
      "X-MICROSOFT-CDO-BUSYSTATUS:FREE",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n")
  },
  {
    name: "icloud_sanitized",
    calendarId: "calendar_icloud_demo",
    expectedCount: 3,
    expectedTitles: [
      "iCloud fixture planning block",
      "iCloud fixture planning block",
      "iCloud fixture planning block"
    ],
    expectedStarts: [
      "2026-07-21T20:00:00.000Z",
      "2026-07-22T20:00:00.000Z",
      "2026-07-23T20:00:00.000Z"
    ],
    ics: [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//ScheduleOS Fixture//iCloud Sanitized//EN",
      "BEGIN:VEVENT",
      "UID:icloud_fixture_planning_block",
      "SUMMARY:iCloud fixture planning block",
      "DESCRIPTION:Sanitized provider export fixture for ScheduleOS ICS review.",
      "DTSTART;TZID=America/Los_Angeles:20260721T130000",
      "DTEND;TZID=America/Los_Angeles:20260721T140000",
      "RDATE;TZID=America/Los_Angeles:20260722T130000,20260723T130000",
      "TRANSP:OPAQUE",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n")
  }
];

test("local API imports and reimports sanitized provider-shaped ICS fixtures idempotently", async () => {
  const server = createApiServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.equal(typeof address, "object");
  assert.notEqual(address, null);
  const baseUrl = `http://127.0.0.1:${(address as AddressInfo).port}`;

  try {
    let expectedTotal = 0;

    for (const fixture of providerIcsFixtures) {
      const importBody = {
        tenantId: "tenant_demo",
        workspaceId: "workspace_demo",
        userId: "user_jordan",
        calendarId: fixture.calendarId,
        recurrenceRangeStart: "2026-07-01T00:00:00.000Z",
        recurrenceRangeEnd: "2026-08-15T00:00:00.000Z",
        ics: fixture.ics
      };

      const imported = await request(
        baseUrl,
        "POST",
        "/api/calendar-events/ics/import",
        importBody
      );
      assert.equal(imported.status, 201, `${fixture.name} should import`);
      assert.equal(imported.body.data.length, fixture.expectedCount);
      assert.equal(imported.body.createdCount, fixture.expectedCount);
      assert.equal(imported.body.updatedCount, 0);
      assert.equal(imported.body.deletedCount, 0);
      assert.deepEqual(
        imported.body.data.map((event: { title: string }) => event.title),
        fixture.expectedTitles
      );
      assert.deepEqual(
        imported.body.data.map((event: { start: string }) => event.start),
        fixture.expectedStarts
      );
      assert.ok(
        imported.body.data.every(
          (event: { sourceSystem: string; calendarId: string }) =>
            event.sourceSystem === "ICS" && event.calendarId === fixture.calendarId
        )
      );

      const reimported = await request(
        baseUrl,
        "POST",
        "/api/calendar-events/ics/import",
        importBody
      );
      assert.equal(reimported.status, 201, `${fixture.name} should reimport`);
      assert.equal(reimported.body.data.length, fixture.expectedCount);
      assert.equal(reimported.body.createdCount, 0);
      assert.equal(reimported.body.updatedCount, fixture.expectedCount);
      assert.equal(reimported.body.deletedCount, 0);

      expectedTotal += fixture.expectedCount;
      const listed = await request(
        baseUrl,
        "GET",
        "/api/calendar-events?tenantId=tenant_demo&workspaceId=workspace_demo&userId=user_jordan"
      );
      assert.equal(listed.status, 200);
      assert.equal(listed.body.data.length, expectedTotal);
    }
  } finally {
    server.close();
    await once(server, "close");
  }
});
