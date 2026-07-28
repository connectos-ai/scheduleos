# Domain Boundaries

## Status

Draft contract for the clean ScheduleOS build.

## Boundary Rule

The scheduling domain must not depend on task providers, calendar providers, AI providers, compatible leadership system, OwnerOps, ConnectOS, web frameworks, database clients, or solver-specific classes.

Provider data enters through ports and becomes provider-neutral domain models before scheduling decisions happen.

## Layers

```text
Domain
  Pure entities, value objects, invariants, policies.

Application
  Use cases, authorization checks, transactions, orchestration.

Ports
  Interfaces for storage, solvers, calendars, task sources, events, AI, notifications.

Adapters
  Local app, REST API, ICS, OwnerOps, ConnectOS, mock providers, direct providers.
```

## Domain Objects

### SchedulingTask

Minimum provider-neutral contract:

```text
SchedulingTask
- id
- externalId
- sourceSystem
- sourceReference
- sourceUrl
- tenantId
- workspaceId
- userId
- ownerId
- title
- description
- desiredOutcome
- projectId
- priority
- estimatedDurationMinutes
- remainingDurationMinutes
- deadline
- earliestStart
- latestFinish
- fixedStart
- fixedEnd
- schedulingMode
- splittable
- minimumBlockMinutes
- maximumBlockMinutes
- preferredBlockMinutes
- preferredDays
- preferredDayparts
- energyRequirement
- locationRequirement
- dependencies
- blocked
- waiting
- schedulingEligible
- recurrence
- tags
- confidence
- version
- createdAt
- updatedAt
```

### Scheduling Modes

```text
FLEXIBLE
FIXED
DEADLINE_DRIVEN
HABIT
ROUTINE
MEETING
REMINDER
DO_NOT_SCHEDULE
MANUALLY_SCHEDULED
```

Rules:

- `FIXED` tasks require fixed start and end.
- `DO_NOT_SCHEDULE` tasks are retained but excluded from optimization.
- `MANUALLY_SCHEDULED` tasks are treated as locked unless explicitly unlocked.
- `DEADLINE_DRIVEN` tasks require a deadline.
- `HABIT` and `ROUTINE` tasks require recurrence or routine policy.
- Missing duration is allowed at ingestion time but blocks automatic scheduling until estimated or defaulted with visible confidence.

### CalendarEvent

Minimum provider-neutral contract:

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

Privacy rules:

- A private event may be stored with a redacted title.
- A private event may still block availability.
- Explanations should say "private event" unless the user has permission and detail is needed.
- Attendees and location are optional and should be minimized.

### AvailabilityWindow

Represents when work may be scheduled for a user.

Fields:

- tenantId.
- workspaceId.
- userId.
- start.
- end.
- timezone.
- source.
- reason.
- priority.

Sources may include working hours, personal hours, temporary availability, team policy, or imported provider availability.

### WorkingHours

Represents recurring allowed work windows.

Fields:

- userId.
- timezone.
- daysOfWeek.
- startTime.
- endTime.
- breakWindows.
- effectiveStart.
- effectiveEnd.

`breakWindows` represent recurring protected windows inside allowed work hours, such as lunch or personal reset time. The deterministic scheduler treats configured break windows as unavailable time.

### TimeBlock

Represents planned or accepted work.

Fields:

- id.
- taskId.
- planId.
- tenantId.
- workspaceId.
- userId.
- start.
- end.
- timezone.
- status.
- locked.
- source.
- calendarEventId.
- createdAt.
- updatedAt.

Statuses:

```text
PROPOSED
ACCEPTED
LOCKED
COMPLETED
MISSED
MOVED
CANCELLED
```

### SchedulePlan

Represents an optimized plan over a time range.

Fields:

- id.
- tenantId.
- workspaceId.
- userId.
- rangeStart.
- rangeEnd.
- timezone.
- status.
- score.
- blocks.
- unscheduledTasks.
- capacityWarnings.
- constraintOutcomes.
- createdAt.
- updatedAt.

Statuses:

```text
DRAFT
PROPOSED
ACCEPTED
REJECTED
SUPERSEDED
FAILED
```

### ScheduleRevision

Represents a change from one plan to another.

Fields:

- id.
- previousPlanId.
- nextPlanId.
- trigger.
- movedBlocks.
- preservedBlocks.
- unscheduledTasks.
- capacityWarnings.
- explanationIds.
- createdAt.

### ConstraintOutcome

Records why scheduling succeeded or failed.

Fields:

- id.
- planId.
- taskId.
- constraintCode.
- severity.
- result.
- message.
- data.

Severity:

```text
HARD
SOFT
INFO
```

Result:

```text
SATISFIED
VIOLATED
RELAXED
NOT_APPLICABLE
```

### CapacityWarning

Records realistic overload and feasibility information.

Fields:

- id.
- planId.
- tenantId.
- workspaceId.
- userId.
- rangeStart.
- rangeEnd.
- availableMinutes.
- requiredMinutes.
- unscheduledMinutes.
- deadlineRiskTaskIds.
- recommendationCodes.
- createdAt.

## Application Use Cases

- `SubmitTask`
- `ImportTask`
- `UpdateTask`
- `RemoveTask`
- `CreateFixedEvent`
- `ImportCalendarEvents`
- `UpdateWorkingHours`
- `UpdateAvailability`
- `UpdatePreferences`
- `CreateSchedule`
- `ReplanSchedule`
- `AcceptPlan`
- `RejectPlan`
- `LockBlock`
- `UnlockBlock`
- `MoveBlock`
- `CompleteBlock`
- `ReportMissedBlock`
- `ExplainPlan`
- `DetectCapacityRisk`
- `SynchronizeCalendar`
- `ExportSchedule`
- `GenerateDailyPlan`
- `GenerateWeeklyPlan`

## Ports

### TaskSource

```text
listTasks(context, cursor)
getTask(context, externalId)
watchTasks(context)
```

### TaskDestination

```text
updateTaskSchedule(context, taskId, scheduleState)
updateTaskCompletion(context, taskId, completionState)
```

### CalendarSource

```text
listCalendars(context)
listEvents(context, range)
getAvailability(context, range)
watchEvents(context)
```

### CalendarDestination

```text
createEvent(context, event)
updateEvent(context, eventId, patch)
deleteEvent(context, eventId)
```

### OptimizationEngine

```text
createPlan(input)
replan(input)
explain(planId, scope)
```

### Storage

```text
withTransaction(callback)
tasks
calendarEvents
workingHours
preferences
schedulePlans
timeBlocks
capacityWarnings
constraintOutcomes
auditEvents
```

### EventPublisher

```text
publish(event)
publishBatch(events)
```

### AIProvider

```text
understandTask(input)
explainSchedule(input)
```

AIProvider is optional and must never bypass deterministic validation.

## Adapter Boundaries

Initial adapters:

- Local manual tasks.
- Local manual fixed events.
- CSV import.
- JSON import.
- ICS import/export.
- Mock task provider.
- Mock calendar provider.
- Generic REST/webhook.
- OwnerOps adapter.
- ConnectOS adapter.
- compatible leadership system public example contract.

Later direct adapters:

- Google Calendar.
- Microsoft Outlook Calendar.
- Todoist.
- Google Tasks.
- Microsoft To Do.
- GitHub Issues.
- Linear.
- Asana.
- ClickUp.

Do not add dozens of shallow integrations before the provider-neutral contracts are stable.

## Multi-Tenant Boundary

Every domain object that can affect a schedule must carry tenant/workspace/user scope where applicable.

Rules:

- Never trust tenant, workspace, user, task, calendar, or event identifiers supplied by a client without server-side authorization.
- Do not schedule work onto a calendar unless the user is authorized and mapped.
- Team capacity views show minimum necessary detail.
- One user may not see another user's private calendar details without permission.

## Invariants

- No fixed busy event overlap.
- No locked block movement unless explicitly unlocked.
- No blocked or ineligible task scheduled.
- No task scheduled outside allowed availability.
- No task scheduled for wrong tenant, workspace, user, or owner.
- No total block duration exceeds remaining task duration.
- No block is shorter than minimum block duration.
- No non-splittable task is split.
- No unvalidated imported source field becomes a critical constraint silently.
