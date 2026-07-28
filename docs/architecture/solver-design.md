# Solver Design

## Status

Draft solver architecture for the clean ScheduleOS build.

## Decision Summary

ScheduleOS must use deterministic optimization as the authoritative scheduler. LLMs may help understand or explain, but they never decide the final schedule.

The solver is accessed through an `OptimizationEngine` port.

Initial engine path:

1. Minimal deterministic engine for early domain tests and local mode.
2. Timefold Solver Java/Kotlin adapter as primary mature optimization candidate.
3. OR-Tools adapter as benchmark and alternate.

## Solver Boundary

```text
Application Use Case
        |
        v
OptimizationEngine Port
        |
        +-- DeterministicFirstFitEngine
        +-- TimefoldSolverAdapter
        +-- OrToolsSolverAdapter
```

Application code must not import solver-specific classes.

## Optimization Input

```text
OptimizationInput
- tenantId
- workspaceId
- userId
- planRange
- timezone
- tasks
- fixedEvents
- existingBlocks
- workingHours
- availabilityWindows
- preferences
- policies
- objectiveWeights
- replanContext
```

## Optimization Output

```text
OptimizationResult
- planId
- status
- score
- blocks
- unscheduledTasks
- capacityWarnings
- constraintOutcomes
- scheduleRevision
- solverDiagnostics
```

Statuses:

```text
FEASIBLE
FEASIBLE_WITH_WARNINGS
INFEASIBLE
FAILED
TIMED_OUT
```

## Hard Constraints

A valid schedule must not:

- Overlap fixed busy events.
- Schedule outside allowed hours.
- Schedule before earliest start.
- Schedule after hard deadline when avoidable by any feasible placement.
- Violate required task order.
- Schedule blocked work.
- Schedule waiting work when waiting blocks scheduling.
- Schedule ineligible work.
- Place work on unavailable calendars.
- Move locked blocks.
- Assign one person simultaneous work.
- Violate minimum block duration.
- Exceed remaining task duration.
- Split non-splittable tasks.
- Schedule work for the wrong tenant, workspace, user, or owner.

## Soft Constraints

The optimizer should prefer:

- Meeting deadlines.
- Higher-priority work earlier.
- Preserving existing accepted blocks.
- Minimizing unnecessary movement.
- Preferred working hours.
- Preferred dayparts.
- Longer focus blocks.
- Fewer context switches.
- Reasonable breaks.
- Lunch protection.
- Reduced fragmentation.
- Balanced daily workload.
- Completing started work.
- Scheduling dependent work in sequence.
- Avoiding late-day high-energy work when configured.
- Avoiding excessive overload.

## Objective Weights

Initial objective weights should be explicit and versioned.

```text
ObjectiveWeights
- deadlineMissPenalty
- priorityDelayPenalty
- movementPenalty
- fragmentationPenalty
- contextSwitchPenalty
- preferredDaypartReward
- focusBlockReward
- balancedWorkloadReward
- dependencyOrderPenalty
- overloadPenalty
```

Rules:

- Weights are part of the plan version.
- Changing weights creates observable behavior and must be documented.
- User or workspace policy may override weights within safe ranges.

## Replanning Stability

Replanning must not move everything because one thing changed.

Inputs for replanning:

- Previous accepted plan.
- Locked blocks.
- Completed blocks.
- Missed blocks.
- New or changed tasks.
- New or changed calendar events.
- User rejection or move choices.
- Trigger metadata.

Stability rules:

- Locked blocks are hard constraints.
- Completed blocks are historical facts.
- Accepted blocks receive movement penalty.
- Blocks affected by the trigger may move at lower penalty.
- Schedule revision records what moved, what stayed, and why.

## Capacity and Feasibility

ScheduleOS must report overload honestly.

Capacity calculation should include:

- Available minutes in allowed windows.
- Busy minutes from fixed events.
- Protected personal hours.
- Locked work blocks.
- Required minutes for deadline-bound tasks.
- Required minutes for flexible tasks.
- Unscheduled minutes.

Example explanation shape:

```text
You have 11 hours of available work time before Friday, but 17 hours of deadline-bound work.
```

The solver should provide option candidates:

- Delay task.
- Shorten task.
- Split task.
- Delegate task.
- Move meeting.
- Relax preference.
- Extend work window.
- Stop or reject task.

ScheduleOS can suggest options, but user or calling system must approve actions that change external systems.

## Explanations

Explanations are generated from:

- Task metadata.
- Calendar constraints.
- Working hours.
- Availability windows.
- Solver placement.
- Constraint outcomes.
- Capacity warnings.
- Replan trigger.

They must not be generated from vague AI guesses.

Example:

```text
I scheduled proposal writing Tuesday 9:00-10:30 because it is high priority,
requires focus time, and Tuesday morning is the earliest available preferred window
before the Wednesday deadline.
```

Private-calendar example:

```text
I did not schedule this from 2:00-3:00 because a private busy event blocks that time.
```

## Engine Phases

### Phase 1: Deterministic Baseline

Purpose:

- Prove domain model.
- Prove tests.
- Prove standalone local mode.
- Provide fallback when solver service unavailable.

Expected support:

- Fixed event avoidance.
- Working hours.
- Priority ordering.
- Deadlines.
- Basic splitting.
- Locked block preservation.
- Basic capacity warnings.

Limitations:

- Not final Motion/Reclaim-quality optimization.
- May use greedy/first-fit behavior only for initial tests.

### Phase 2: Timefold Solver Adapter

Purpose:

- Mature hard/soft constraint optimization.
- Better schedule quality.
- Replanning stability.
- Explainable score/constraint outcomes.

Open decisions:

- JVM service boundary vs embedded worker.
- Serialization contract.
- Deployment profile for self-hosters.
- Performance limits and timeouts.

### Phase 3: OR-Tools Benchmark Adapter

Purpose:

- Compare solver quality and performance.
- Validate model portability.
- Provide alternate engine if Timefold integration proves too heavy.

## Solver Diagnostics

Diagnostics should include:

- Engine name.
- Engine version.
- Objective weight version.
- Time limit.
- Solve duration.
- Score.
- Constraint summary.
- Timeout flag.
- Infeasible reason.

Diagnostics are developer-facing and must not expose private event contents.

## Test Requirements

Solver tests must cover:

- Feasible schedules.
- Impossible schedules.
- Deadline conflicts.
- Over-capacity weeks.
- Fixed-event collisions.
- Dependency ordering.
- Splittable tasks.
- Non-splittable tasks.
- Preferred dayparts.
- Focus-time protection.
- Lunch and break protection.
- Schedule-stability penalties.
- High-priority placement.
- Locked-block preservation.
- Replanning after new meeting.
- Replanning after task completion.
- Replanning after missed work.

## Non-Goals

- Do not build a general-purpose project-management optimizer.
- Do not optimize all team assignments before single-user scheduling works.
- Do not use AI prompts as solver replacement.
- Do not claim Timefold or OR-Tools support until adapter tests run.
- Do not expose solver jargon in primary user UI.
