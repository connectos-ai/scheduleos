# Scheduling Constraints

## Status

Draft constraint catalog.

## Purpose

This document names constraints before implementation so solver behavior is testable and explainable.

## Hard Constraints

Hard constraints must not be violated in a valid schedule.

| Code | Rule |
| --- | --- |
| `NO_FIXED_EVENT_OVERLAP` | Work blocks cannot overlap fixed busy events. |
| `WITHIN_ALLOWED_HOURS` | Work blocks must fit allowed working/availability windows. |
| `BREAK_WINDOW_PROTECTED` | Work blocks cannot overlap configured recurring break windows. |
| `AFTER_EARLIEST_START` | Work cannot start before task earliest start. |
| `BEFORE_HARD_DEADLINE` | Work must finish before a hard deadline if task is scheduled. |
| `DEPENDENCY_ORDER` | Dependent work must follow required order. |
| `NOT_BLOCKED` | Blocked tasks cannot be scheduled. |
| `NOT_WAITING` | Waiting tasks cannot be scheduled when waiting blocks work. |
| `SCHEDULING_ELIGIBLE` | Ineligible tasks cannot be scheduled. |
| `AVAILABLE_CALENDAR` | Work cannot be placed on unavailable calendars. |
| `LOCKED_BLOCK_PRESERVED` | Locked blocks cannot move. |
| `NO_USER_DOUBLE_BOOKING` | A user cannot be assigned simultaneous work. |
| `MIN_BLOCK_DURATION` | Blocks must meet minimum duration. |
| `MAX_REMAINING_DURATION` | Total scheduled minutes cannot exceed remaining duration. |
| `SPLIT_ALLOWED` | Non-splittable tasks cannot be split. |
| `TENANT_SCOPE` | Tasks/events/blocks must stay in correct tenant/workspace/user scope. |

## Soft Constraints

Soft constraints affect score and explanations.

| Code | Preference |
| --- | --- |
| `MEET_DEADLINES` | Prefer completing work before deadlines with margin. |
| `PRIORITY_EARLIER` | Prefer high-priority tasks earlier. |
| `SCHEDULE_STABILITY` | Prefer preserving accepted blocks. |
| `MINIMIZE_MOVEMENT` | Prefer fewer moved blocks on replan. |
| `PREFERRED_WORKING_HOURS` | Prefer configured working hours. |
| `PREFERRED_DAYPART` | Prefer task daypart preferences. |
| `FOCUS_BLOCKS` | Prefer longer blocks for deep work. |
| `FEWER_CONTEXT_SWITCHES` | Prefer grouping similar work. |
| `REASONABLE_BREAKS` | Prefer breaks between demanding blocks. |
| `LUNCH_PROTECTION` | Prefer preserving non-hard personal boundary patterns when not configured as break windows. |
| `REDUCED_FRAGMENTATION` | Prefer fewer tiny fragments. |
| `BALANCED_WORKLOAD` | Prefer balanced daily load. |
| `COMPLETE_STARTED_WORK` | Prefer finishing started work. |
| `HIGH_ENERGY_MATCH` | Prefer high-energy work in high-energy windows. |
| `OVERLOAD_AVOIDANCE` | Prefer not overfilling days. |

## Future Constraints

Documented but not initial release requirements:

- Travel optimization.
- Location-dependent work.
- Team dependency scheduling.
- Shared resources.
- Meeting-cost optimization.
- Dynamic energy prediction.
- Historical completion-rate learning.
- Weather-aware scheduling.
- Commute-aware planning.
- Multi-person flexible meetings.

## Constraint Outcomes

Each plan should record constraint outcomes:

```text
ConstraintOutcome
- constraintCode
- severity
- result
- taskId
- blockId
- message
- data
```

Results:

```text
SATISFIED
VIOLATED
RELAXED
NOT_APPLICABLE
```

## Explanation Mapping

Constraint outcomes should map to user-facing explanations.

Examples:

- `NO_FIXED_EVENT_OVERLAP`: "I avoided 2:00-3:00 because a fixed event blocks that time."
- `LOCKED_BLOCK_PRESERVED`: "I kept proposal writing in place because you locked it."
- `MEET_DEADLINES`: "I placed the tax review before the Friday deadline."
- `OVERLOAD_AVOIDANCE`: "I left this unscheduled because the week is already over capacity."

## Testing Standard

Each hard constraint must have:

- A passing feasible-case test.
- A failing/infeasible-case test.
- An explanation or capacity-warning test when it blocks scheduling.

Each initial soft constraint must have:

- A scoring preference test.
- A regression test that proves hard constraints still win.
