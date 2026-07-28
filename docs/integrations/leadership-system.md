# compatible leadership system Integration

## Status

Draft public example contract.

## Rule

compatible leadership system is optional. ScheduleOS must work when compatible leadership system is disconnected.

compatible leadership system may use ScheduleOS through the same public interfaces available to other applications. There must be no hidden private leadership-only API.

## Three-Pillar Context

compatible leadership system may act as a private leadership brain over three independent infrastructure pillars:

```text
ConnectOS = external signals, provider capabilities, approved actions
OwnerOps = owned work, blockers, delegation state, approval needs
ScheduleOS = time, capacity, schedule plans, deadline risk, replanning
compatible leadership system = leadership judgment across signals, work, and time
```

ScheduleOS owns only the time-capacity portion of the model. It may accept leadership-context hints from compatible leadership system the same way it would accept context from any compatible leadership app, then return grounded scheduling evidence through public APIs, events, SDKs, or webhooks.

compatible leadership system may combine ScheduleOS outputs with ConnectOS and OwnerOps outputs, but ScheduleOS must not depend on that composition. A standalone user should still be able to create tasks, define availability, generate a plan, review conflicts, accept blocks, and replan without compatible leadership system, ConnectOS, or OwnerOps connected.

## Architecture Relationship

```text
ConnectOS -> signal reality, provider capabilities, safe external actions
OwnerOps   -> ownership reality, blockers, delegation, approvals
ScheduleOS -> time reality, capacity, plans, conflicts

compatible leadership system -> leadership judgment across realities
```

ScheduleOS helps compatible leadership system become a stronger leadership brain by returning facts about time: what fits, what does not fit, what repeatedly misses, what is at deadline risk, and what must move before an owner can make a credible promise.

ScheduleOS must not receive or store private compatible leadership system reasoning, Business DNA internals, customer memory, or proprietary leadership scoring models.

## compatible leadership system Three-Lane Architecture

When ScheduleOS is used with compatible leadership system, it should be one of three independent lanes feeding a private leadership brain:

```text
ConnectOS lane  -> external signals, provider capability, approved actions
OwnerOps lane   -> owned work, blockers, delegation, approvals, outcomes
ScheduleOS lane -> time capacity, plans, conflicts, deadline risk, replanning

compatible leadership system Leadership Brain -> owner judgment, approval, learning, owner UX
```

ScheduleOS should only own the time-capacity lane. It may receive public scheduling guidance from compatible leadership system or any compatible leadership system, and it may return public schedule evidence. It should not know how compatible leadership system ranks leadership leverage internally, stores Business DNA, writes owner-facing recommendations, or decides commercial product experience.

compatible leadership system becomes stronger when ScheduleOS evidence is compared with the other two lanes:

```text
ConnectOS says what changed.
OwnerOps says what work exists and who owns it.
ScheduleOS says whether that work fits real time.
compatible leadership system decides the smallest useful owner question or action.
```

This comparison lets compatible leadership system recommend credible leadership moves such as protecting time, delegating work, delaying a commitment, shrinking scope, stopping low-leverage work, or approving an external action. ScheduleOS supplies evidence for those moves, not the private leadership judgment itself.

## Three Realities Into One Decision

compatible leadership system should compare the three pillar realities before preparing durable recommendations:

| Reality | Pillar | What compatible leadership system Learns | Owner Decision It Can Improve |
| --- | --- | --- | --- |
| Signal reality | ConnectOS | What changed externally and what can safely be done. | Whether to prepare, approve, retry, or stop an external action. |
| Ownership reality | OwnerOps | What work exists, who owns it, what is blocked, and what needs judgment. | Whether to own, delegate, delay, unblock, or change priority. |
| Time reality | ScheduleOS | What fits real capacity, what is at risk, and what must move. | Whether to protect time, shrink work, split work, defer, or reject a plan. |

compatible leadership system becomes stronger when it learns from reviewed outcomes across all three realities. A single unreviewed ScheduleOS event is evidence, not durable leadership memory.

## Three-Pillar Connection Architecture

compatible leadership system should compose all three pillars through public contracts:

```text
+----------------+     +----------------+     +----------------+
| ConnectOS      |     | OwnerOps       |     | ScheduleOS     |
| signals/actions|     | work/ownership |     | time/capacity  |
+-------+--------+     +-------+--------+     +-------+--------+
        |                      |                      |
        +----------- public events and APIs ----------+
                               |
                               v
                    +------------------------+
                    | compatible leadership system Leadership Brain|
                    | judgment, approval,    |
                    | learning, owner UX     |
                    +-----------+------------+
                                |
        +---------- public guidance/commands ----------+
        |                      |                       |
        v                      v                       v
ConnectOS approved   OwnerOps priority       ScheduleOS plan acceptance
actions and safety   and delegation          and scheduling hints
policy               guidance
```

ScheduleOS is the time-reality lane in this architecture. ConnectOS can tell compatible leadership system what happened externally, OwnerOps can tell compatible leadership system what work exists and who owns it, and ScheduleOS can tell compatible leadership system whether that work fits real capacity. compatible leadership system then turns those three realities into the smallest useful owner decision: approve, delegate, delay, shrink, stop, protect time, or execute an approved action.

## Public Integration Surfaces

ScheduleOS should expose integration surfaces compatible leadership system or any compatible leadership system can use.

| Surface | Direction | Purpose |
| --- | --- | --- |
| `ScheduleEvidence` events | ScheduleOS to consumer | Capacity warnings, proposed blocks, missed blocks, deadline risk, replan pressure, explanations. |
| Schedule plan APIs | Consumer to ScheduleOS | Request planning, review plan state, accept/reject/lock/complete/miss blocks. |
| Scheduling hints | Consumer to ScheduleOS | Strategic priority, owner-only classification, protected windows, milestone importance. |
| Export feeds and webhooks | ScheduleOS to consumer | Provider-neutral calendar blocks, accepted work blocks, warnings, risks, outcomes. |

compatible leadership system may correlate ScheduleOS evidence with ConnectOS signals and OwnerOps work, but ScheduleOS remains source of truth only for scheduling inputs, constraints, plans, and time-capacity explanations.

ScheduleOS should not call private compatible leadership system services, read private compatible leadership system databases, or depend on a compatible leadership system-specific deployment path.

## Public Contract Map

compatible leadership system can compose the three pillars through a consistent set of contracts. ScheduleOS participates only in scheduling contracts.

| Contract | Primary Pillar | Direction | Purpose |
| --- | --- | --- | --- |
| `SignalObserved` | ConnectOS | Pillar to consumer | Reports provider event, connection change, sync health, or prepared-action result. |
| `ActionRequest` | ConnectOS | Consumer to pillar | Requests preview, approval-aware execution, retry, or safe stop. |
| `WorkIdentified` | OwnerOps | Pillar to consumer | Reports canonical work, owner, blocker, approval need, delegation state, or outcome. |
| `WorkGuidance` | OwnerOps | Consumer to pillar | Sends priority interpretation, delegation recommendation, owner-only decision, or milestone alignment. |
| `ScheduleEvidence` | ScheduleOS | Pillar to consumer | Reports capacity, proposed blocks, missed work, deadline risk, constraint pressure, or replan explanation. |
| `ScheduleGuidance` | ScheduleOS | Consumer to pillar | Sends strategic priority hints, protected leadership windows, accepted/rejected plan choices, or move/shrink/split/delegate/stop guidance. |

These names are public-contract placeholders until formal API schemas are accepted. They must remain provider-neutral and usable by applications other than compatible leadership system.

## Leadership Brain Strengthening Loop

When compatible leadership system uses ScheduleOS alongside ConnectOS and OwnerOps, the loop should be:

1. ConnectOS reports a signal or external action result.
2. OwnerOps turns a relevant signal into owned work, a blocker, an approval, or an outcome.
3. ScheduleOS tests whether eligible work fits real time and returns schedule evidence.
4. compatible leadership system compares signal, ownership, and time evidence against leadership context.
5. The owner approves, changes, delegates, delays, stops, or executes.
6. Reviewed outcomes flow back through public events or commands where each pillar owns its domain.

This loop makes compatible leadership system stronger because it learns from reviewed outcomes. It should not learn durable leadership memory from a single unreviewed ScheduleOS signal.

## Example Evidence Envelope

ScheduleOS evidence should be understandable without private compatible leadership system fields.

```json
{
  "tenantId": "tenant_demo",
  "workspaceId": "workspace_demo",
  "userId": "user_jordan",
  "sourcePillar": "SCHEDULEOS",
  "sourceObjectId": "task_demo_proposal_review",
  "observedAt": "2026-07-21T14:30:00.000Z",
  "evidenceType": "DEADLINE_RISK",
  "confidence": "HIGH",
  "summary": "Proposal review no longer fits today without moving another block.",
  "recommendedOwnerQuestion": "Move internal review, delegate prep, or delay proposal review?",
  "provenance": {
    "contract": "ScheduleEvidence",
    "sourceSystem": "scheduleos_demo"
  },
  "reviewStatus": "UNREVIEWED"
}
```

## What compatible leadership system May Send

compatible leadership system may enrich scheduling requests with public scheduling hints:

- Strategic priority.
- Owner-only classification.
- Preferred dayparts.
- Portable tags such as milestone labels.
- Source reference and reason metadata.

These values are hints and constraints that ScheduleOS must validate. They do not bypass scheduling policy, working hours, locked calendar commitments, owner boundaries, or feasibility checks.

## Example Enrichment

```json
{
  "tenantId": "tenant_demo",
  "workspaceId": "workspace_demo",
  "userId": "user_jordan",
  "sourceSystem": "LEADERSHIP_APP",
  "guidance": [
    {
      "taskId": "task_demo_proposal",
      "strategicPriority": "HIGH",
      "ownerOnly": true,
      "preferredDayparts": ["MORNING"],
      "tags": ["milestone_demo"],
      "reason": "Owner review unlocks proposal decision."
    }
  ]
}
```

Send this public `ScheduleGuidance` shape to `POST /api/schedule-guidance/apply`. The endpoint updates normal ScheduleOS task fields only: priority, preferred dayparts, and tags. `ownerOnly` is represented as an `owner-only` tag so the hint remains portable. Guidance cannot unblock a task, make waiting work eligible, override locked calendar commitments, or bypass feasibility checks.

compatible leadership system is an example consumer, not a privileged caller. Any compatible leadership app may send the same request with its own `sourceSystem`.

## What ScheduleOS May Return

ScheduleOS may provide:

- Planned work.
- Unscheduled work.
- Deadline risk.
- Capacity utilization.
- Focus-time availability.
- Owner-task load.
- Schedule fragmentation.
- Workload category.
- Time by project.
- Missed blocks.
- Replan frequency.
- Constraint pressure.
- Delegation candidates.
- Stop or delay candidates.

Delegation, stop, and delay candidates must be grounded in ScheduleOS data. ScheduleOS may say work does not fit or repeatedly misses; the leadership system decides whether that means delegate, delay, stop, or change priority.

## Private Logic Boundary

Public ScheduleOS docs, examples, fixtures, and tests must not include:

- compatible leadership system Leadership Brain prompts.
- Business DNA private logic.
- Customer data.
- Owner-specific memory.
- compatible leadership system internal scoring models.

ScheduleOS may include fictional example payloads showing how any leadership app could enrich scheduling context.

## Tests Required

- ScheduleOS works without compatible leadership system.
- compatible leadership system-style enrichment cannot override hard constraints.
- compatible leadership system-style enrichment uses public APIs.
- Private compatible leadership system strings do not appear in public fixtures.
- Delegation, stop, and delay candidates are grounded in ScheduleOS data.
