# Capacity

## Status

Draft capacity and feasibility model.

## Purpose

ScheduleOS must be honest when work cannot fit. It should never make an impossible calendar look complete by hiding overflow.

## Capacity Inputs

- Planning range.
- Working hours.
- Availability windows.
- Fixed busy events.
- Locked work blocks.
- Personal hours.
- Buffers and travel.
- Eligible task remaining duration.
- Deadlines.
- Dependencies.
- Scheduling modes.

## Capacity Metrics

```text
CapacitySummary
- rangeStart
- rangeEnd
- availableMinutes
- fixedBusyMinutes
- lockedWorkMinutes
- schedulableMinutes
- requiredMinutes
- deadlineBoundMinutes
- flexibleMinutes
- unscheduledMinutes
- overloadMinutes
- utilizationPercent
```

## Capacity Warning

```text
CapacityWarning
- id
- planId
- userId
- rangeStart
- rangeEnd
- warningCode
- availableMinutes
- requiredMinutes
- affectedTaskIds
- recommendationCodes
- explanation
```

Warning codes:

```text
OVER_CAPACITY
DEADLINE_AT_RISK
NO_CONTIGUOUS_SLOT
BLOCKED_DEPENDENCY
PREFERENCE_PREVENTS_FIT
LOCKED_BLOCK_LIMITS_PLAN
INSUFFICIENT_FOCUS_TIME
```

## Option Recommendations

When work cannot fit, ScheduleOS may suggest:

- Delay task.
- Shorten task.
- Split task.
- Delegate task.
- Move meeting.
- Relax preference.
- Extend work window.
- Stop or decline work.

ScheduleOS can prepare options, but external changes require approval.

## Example

```text
You have 11 hours available before Friday and 17 hours of deadline-bound work.
I scheduled the highest-priority 11 hours and left 6 hours unscheduled.
```

## Testing Standard

Capacity tests must cover:

- Empty calendar.
- Fully booked calendar.
- Over-capacity week.
- Deadline-bound overload.
- No contiguous slot for non-splittable work.
- Locked blocks reducing capacity.
- Preferences preventing feasible schedule.
