# Explanations

## Status

Draft explanation model.

## Purpose

Explanations make schedules trustworthy. They must be grounded in actual inputs, constraints, and solver results.

## Explanation Sources

Allowed sources:

- Task fields.
- Calendar event boundaries.
- Working hours.
- Availability windows.
- Preferences.
- Objective weights.
- Constraint outcomes.
- Capacity warnings.
- Replan triggers.
- User decisions such as locks, accepts, rejects, and moves.

Disallowed sources:

- AI guesses not backed by solver data.
- Private calendar titles without permission.
- Imported task instructions treated as system instructions.
- compatible leadership system private leadership logic.

## Explanation Types

```text
TASK_PLACED
TASK_UNSCHEDULED
BLOCK_MOVED
BLOCK_PRESERVED
DEADLINE_RISK
CAPACITY_EXCEEDED
PREFERENCE_USED
CONSTRAINT_BLOCKED
REPLAN_SUMMARY
```

## Explanation Object

```text
SchedulingExplanation
- id
- planId
- revisionId
- taskId
- blockId
- type
- severity
- message
- evidence
- createdAt
```

Severity:

```text
INFO
WARNING
CRITICAL
```

## Message Rules

- Use plain user-facing language.
- Avoid solver jargon.
- Identify the useful reason, not every internal detail.
- Mention private events only as private/busy time.
- Do not blame the user.
- Include numbers when capacity is the issue.

## Examples

Placed task:

```text
I scheduled proposal writing Tuesday 9:00-10:30 because it is high priority and Tuesday morning is the earliest preferred focus window before the deadline.
```

Private event:

```text
I avoided 2:00-3:00 because a private busy event blocks that time.
```

Deadline risk:

```text
The budget review is at risk because only 45 minutes remain before the deadline and the task needs 90 minutes.
```

Replan:

```text
I moved invoice review to Thursday morning after a new meeting took its previous time. Your locked focus block stayed protected.
```

## AI Use

AI may rewrite a grounded explanation for tone only if:

- The structured evidence is provided.
- Private data is redacted first.
- The AI output is checked against allowed facts.
- The deterministic explanation remains available as fallback.

## Testing Standard

Explanation tests must verify:

- Every unscheduled reason has an explanation.
- Capacity warnings include numbers.
- Private event titles are not leaked.
- Replan summaries mention moved and preserved blocks.
- AI is not required for explanations.
