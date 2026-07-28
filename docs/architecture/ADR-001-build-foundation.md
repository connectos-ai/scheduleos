# ADR-001: Build ScheduleOS As A Clean Independent Repository

## Status

Accepted direction for initial implementation planning.

## Date

2026-07-21

## Context

ScheduleOS must become a standalone open-source intelligent task scheduling and calendar optimization system. It must work without compatible leadership system, OwnerOps, ConnectOS, external calendars, external task managers, paid AI, or a commercial subscription.

The first current-state audit found no existing standalone ScheduleOS project. It found adjacent/reference work:

- FluidCalendar local checkout with unverified scheduling foundation.
- ConnectOS as a verified optional connector reference.
- OwnerOps public candidate as a tested optional work/task reference.
- compatible leadership system private architecture docs defining the three-pillar relationship.
- TimeBack AI as adjacent time-reclaim language, not a scheduler.

The open-source scheduler audit found no single project that satisfies ScheduleOS requirements across standalone product, deterministic optimization, replanning, capacity honesty, multi-tenancy, privacy/security, public APIs/events, and composability.

## Decision

Use **Strategy C: Build clean ScheduleOS repository using audited components and references.**

ScheduleOS will be built as an independent project with:

- Its own domain model.
- Its own storage model.
- Its own public APIs and events.
- A solver abstraction from the beginning.
- A deterministic optimization layer as the authoritative scheduler.
- Optional AI understanding/explanation layers that never bypass validation.
- Optional OwnerOps, ConnectOS, and compatible leadership system adapters through public interfaces.

Initial solver direction:

- Treat Timefold Solver for Java/Kotlin as the primary optimization engine candidate.
- Treat Google OR-Tools as the alternate solver and benchmark candidate.
- Do not use Timefold Solver Python as the primary engine because the repository is archived and its README says Python is significantly slower than Java/Kotlin.
- Do not use an LLM as the authoritative scheduling engine.

Initial product/reference direction:

- Use FluidCalendar, Plazen, and Super Productivity as product/UX references.
- Use Zero Calendar as an AI-native calendar reference.
- Use KiraPilot and DeyWeaver only as AI productivity references/cautionary comparisons.
- Do not copy code from any project until licensing and attribution gates pass.

## Alternatives Considered

### Strategy A: Adopt An Existing Project

Rejected.

No audited project currently covers the full ScheduleOS scope:

- FluidCalendar is closest product match, but its README warns it is active development, buggy, incomplete, and not production-ready.
- Plazen is archived and small.
- Zero Calendar is AI/calendar-oriented and service-dependent.
- Super Productivity is mature but is a task/timeboxing app, not a scheduling optimization engine.
- KiraPilot and DeyWeaver are AI productivity references, not mature solver foundations.

### Strategy B: Properly Fork An Existing Project

Rejected for now.

A fork may preserve attribution and history correctly, but it would also inherit architecture, product scope, dependencies, and release posture that do not match ScheduleOS. FluidCalendar remains the strongest future fork candidate if deeper source audit proves it is healthier than current evidence suggests, but current evidence does not justify a fork.

### Strategy C: Build Clean Independent ScheduleOS

Accepted.

This gives ScheduleOS the best chance to:

- Remain standalone.
- Avoid private history.
- Avoid private compatible leadership system/OwnerOps/ConnectOS coupling.
- Use a mature solver deliberately.
- Create clean public APIs/events.
- Implement privacy-by-design calendar handling.
- Keep future integrations optional and replaceable.

## Licensing Implications

Preferred ScheduleOS license remains Apache-2.0 if compatible with final dependencies and reused components.

Current license evidence:

- FluidCalendar: MIT.
- Plazen: MIT.
- Zero Calendar: MIT.
- Super Productivity: MIT.
- KiraPilot: MIT.
- DeyWeaver: MIT.
- Timefold Solver: Apache-2.0.
- Timefold Solver Python: Apache-2.0.
- Google OR-Tools: Apache-2.0.

No source code is approved for copying by this ADR. Any copied source, modified third-party code, assets, docs, fixtures, fonts, or examples require `docs/security/licensing-audit.md` before publication.

## Technical Tradeoffs

Benefits:

- Clean boundaries from the start.
- Easier public sanitization.
- Easier to keep compatible leadership system private.
- Easier to create provider-neutral contracts.
- Solver choice can be benchmarked behind an abstraction.
- Avoids inheriting product complexity unrelated to ScheduleOS.

Costs:

- More initial implementation work.
- Must build UI, API, storage, solver integration, tests, and docs from scratch.
- Timefold JVM integration may add deployment complexity if main app is TypeScript.
- OR-Tools may require more custom modeling and explanation work.
- Requires disciplined scope control to avoid rebuilding full project management, CRM, or connector systems.

## Migration Risks

- If FluidCalendar later proves much stronger than expected, a clean ScheduleOS build may duplicate useful work.
- If Timefold integration is too heavy, ScheduleOS may need to switch primary solver to OR-Tools or another engine.
- If a TypeScript app plus JVM solver service is too complex for self-hosters, a simpler solver MVP may be needed before the production solver.
- If public adapters for OwnerOps/ConnectOS are immature, ScheduleOS must still ship standalone without them.

## Consequences

- Implementation should not begin by copying a project.
- Next architecture docs must define domain boundaries, task/calendar contracts, solver design, integration model, privacy model, and event contracts.
- Build should start with a minimal deterministic scheduling vertical slice, then add solver-backed optimization once the model is proven.
- Public release remains blocked until functionality, tests, security, privacy, licensing, git-history, documentation, and CI gates pass.
