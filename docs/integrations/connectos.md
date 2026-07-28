# ConnectOS Integration

## Status

Draft optional integration contract.

## Rule

ConnectOS is optional. ScheduleOS must work when ConnectOS is disconnected.

ConnectOS provides provider access. ScheduleOS provides scheduling interpretation.

## Responsibility Split

ConnectOS owns:

- Provider authentication.
- OAuth flows.
- Token lifecycle.
- Provider capabilities.
- Connection health.
- External provider actions.

ScheduleOS owns:

- Scheduling rules.
- Optimization.
- Scheduling state.
- Calendar-placement decisions.
- Replanning.
- Capacity warnings.
- Scheduling explanations.

## Capability Ports

ConnectOS-backed adapters should implement the same ScheduleOS ports as direct providers.

```text
CalendarSource
- listCalendars
- listEvents
- watchEvents
- getAvailability

CalendarDestination
- createEvent
- updateEvent
- deleteEvent

TaskSource
- listTasks
- getTask
- watchTasks

DirectorySource
- listUsers
- resolveUser
```

## Token Boundary

ScheduleOS should not receive raw provider tokens from ConnectOS.

Allowed:

- connection reference.
- capability reference.
- provider health.
- scoped action result.

Forbidden:

- access token in ScheduleOS logs.
- refresh token in ScheduleOS storage.
- cross-project token sharing.

## Current Local API Foundation

The current local API includes a mock public ConnectOS calendar import endpoint:

```text
POST /api/integrations/connectos/calendar-events/import
```

Example request:

```json
{
  "tenantId": "tenant_demo",
  "workspaceId": "workspace_demo",
  "userId": "user_jordan",
  "connectionId": "connectos_connection_demo",
  "capabilityRef": "capability_calendar_read_demo",
  "calendarId": "calendar_connectos",
  "events": [
    {
      "externalId": "connectos_event_private",
      "title": "Private partner call",
      "start": "2026-07-22T09:00:00.000Z",
      "end": "2026-07-22T10:30:00.000Z",
      "timezone": "UTC",
      "status": "CONFIRMED",
      "busyStatus": "BUSY",
      "privacyLevel": "PRIVATE"
    }
  ]
}
```

Current behavior:

- Maps ConnectOS calendar rows to provider-neutral `CalendarEvent` records with `sourceSystem` set to `CONNECTOS`.
- Uses stable event ids shaped like `connectos_<connectionId>_<externalId>`.
- Accepts `connectionId` and optional `capabilityRef` references, not raw provider credentials.
- Rejects obvious provider credential fields such as `accessToken`, `refreshToken`, `idToken`, `token`, `apiKey`, and `clientSecret`.
- Redacts non-public event titles to `Busy`.
- Imports fixed, locked, non-movable busy events that constrain ScheduleOS planning.
- Supports idempotent upserts and `dryRun: true` preview.

This is a mock public contract foundation. It is not a production ConnectOS connector, OAuth runtime, provider sync engine, revocation handler, or calendar write-back adapter.

## Failure Modes

ScheduleOS must handle:

- Connection revoked.
- Token expired.
- Provider rate-limited.
- Provider returns duplicate events.
- Provider webhook replay.
- Provider sends out-of-order updates.
- Calendar becomes read-only.
- Write permission missing.

## Current Test Evidence

- Mock ConnectOS calendar events import into ScheduleOS.
- Private event titles are redacted and provider credential fields are rejected.
- Duplicate ConnectOS calendar event import is idempotent.
- Imported ConnectOS busy events constrain ScheduleOS planning.
- ConnectOS disconnected mode still allows manual ScheduleOS tasks.
- Combined OwnerOps plus ConnectOS end-to-end flow imports busy time and owned work, creates a plan, accepts it, completes a block, and reads scoped audit evidence.
- Mock ConnectOS task import, provider revocation write-back prevention, and calendar write-back permission checks remain production adapter gaps.


End-to-end mock adapter evidence: [Mock Adapter End-To-End Verification](mock-adapter-end-to-end-verification.md).
