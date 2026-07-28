# Open-Source Scheduler Foundation Audit

Date: 2026-07-21

## Scope

This audit evaluates open-source projects that may inform ScheduleOS. It does not approve code copying, forking, or publication. All direct code reuse still requires deeper license, dependency, security, and attribution review.

Primary sources used:

- GitHub repository pages and GitHub REST API metadata.
- Project README files from official repositories.
- Official project/product pages where relevant.

## Executive Recommendation

No audited project should be adopted wholesale as ScheduleOS.

Recommended strategy: **Strategy C: build a clean ScheduleOS repository using audited components and references.**

Recommended foundation split:

- Product/UX references: FluidCalendar, Plazen, Super Productivity.
- Calendar/AI-native reference: Zero Calendar.
- Local AI productivity reference: KiraPilot.
- Primary optimization engine candidate: Timefold Solver for Java/Kotlin.
- Alternate solver/benchmark candidate: Google OR-Tools.
- Not recommended as primary foundation: Timefold Solver Python, Plazen, DeyWeaver.

Reason: no single project currently satisfies the ScheduleOS goal across standalone task/calendar product, deterministic constraint optimization, replanning, capacity honesty, multi-tenancy, privacy/security, public APIs/events, OwnerOps/ConnectOS/compatible leadership system composability, tests, and public release readiness.

## Comparison Matrix

| Project | URL | License | Activity snapshot | Main stack | Best use for ScheduleOS | Direct adoption verdict |
| --- | --- | --- | --- | --- | --- | --- |
| FluidCalendar | https://github.com/dotnetfactory/fluid-calendar | MIT | 977 stars, pushed 2026-07-02, latest release v1.4.0 on 2025-04-24, README warns active development and very buggy | TypeScript, Next.js-style app | Motion-like UX, calendar/task concepts, auto-scheduling UI references | Do not adopt wholesale; inspect as reference. |
| Plazen | https://github.com/plazen/plazen | MIT | 2 stars, archived, pushed 2026-03-14, latest release v1.14.1 on 2026-02-09 | TypeScript | Simple automatic day-planner concepts | Do not adopt; archived and small. |
| Zero Calendar | https://github.com/x1xhlol/zero-calendar | MIT | 360 stars, pushed 2026-04-26, no GitHub latest release found | TypeScript, Next.js, Convex, Better Auth, OpenRouter, Resend | AI-native calendar UX, Google Calendar sync, conflict/free-time ideas | Do not adopt as core; useful calendar/AI reference. |
| Super Productivity | https://github.com/super-productivity/super-productivity | MIT | 20,786 stars, pushed 2026-07-21, latest release v18.15.1 on 2026-07-17 | TypeScript/Angular/Electron-style ecosystem | Mature task/timeboxing/time-tracking UX, offline/local-first habits, import integrations | Do not adopt; excellent reference but not ScheduleOS solver core. |
| KiraPilot | https://github.com/vietanhdev/kirapilot-app | MIT | 18 stars, pushed 2025-09-14, latest release v0.0.54 on 2025-09-14, README says WIP | TypeScript/Rust desktop-style app | Local AI productivity assistant patterns | Do not adopt; WIP and low activity. |
| Timefold Solver | https://github.com/TimefoldAI/timefold-solver | Apache-2.0 | 1,721 stars, pushed 2026-07-20, latest release v2.3.0 on 2026-07-10 | Java/Kotlin solver | Primary optimization engine candidate | Use behind solver abstraction if architecture accepts JVM service. |
| Timefold Solver Python | https://github.com/TimefoldAI/timefold-solver-python | Apache-2.0 | 57 stars, archived, pushed 2025-07-11, latest release v1.12.0-beta on 2024-07-09 | Java/Python bridge | Historical reference only | Do not choose; archived and README says slower than Java/Kotlin. |
| Google OR-Tools | https://github.com/google/or-tools | Apache-2.0 | 13,799 stars, pushed 2026-07-21, latest release v9.15 on 2026-01-12 | C++ with Python/Java/C# bindings | Solver alternative/benchmark, CP-SAT modeling | Strong alternate; potentially more modeling burden than Timefold. |
| DeyWeaver | https://github.com/Deyweaver/DeyWeaver | MIT | 360 stars, pushed 2026-06-30, latest release v1.3.7 on 2026-06-30, README says project under maintenance/out of resources | TypeScript, Google Gemini/Genkit | Additional AI planner reference only | Do not adopt; AI-first and not mature solver foundation. |

## Candidate Notes

### FluidCalendar

Repository: https://github.com/dotnetfactory/fluid-calendar

License: MIT.

Current activity:

- GitHub API: 977 stars, 66 forks, 45 open issues.
- Last push: 2026-07-02.
- Latest release: v1.4.0, published 2025-04-24.
- Primary language: TypeScript.

README claims:

- Open-source alternative to Motion.
- Intelligent task scheduling and calendar management.
- Calendar integration.
- Smart time slot management.
- Self-hosting/privacy positioning.
- Explicit warning: active development, very buggy, incomplete features, not recommended for production use.

Local workspace findings:

- Local FluidCalendar checkout exists outside this ScheduleOS workspace.
- Untracked `src/foundation` scheduling prototype exists.
- `node_modules` missing; `tsc` and `jest` unavailable; local tests cannot run.

ScheduleOS relevance:

- Best direct UX/product reference.
- Potentially useful domain separation reference.
- Not acceptable as production foundation without deeper code audit, dependency install, test run, and license/attribution review.

Verdict: reference first, do not adopt wholesale.

### Plazen

Repository: https://github.com/plazen/plazen

License: MIT.

Current activity:

- GitHub API: 2 stars, 2 forks, 8 open issues.
- Archived: true.
- Last push: 2026-03-14.
- Latest release: v1.14.1, published 2026-02-09.
- Primary language: TypeScript.

README claims:

- Modern open-source task manager.
- Automatically finds a spot in daily timetable.
- Supports pinned time-sensitive appointments.
- Imports from Google Calendar/iCal.
- Uses Supabase Auth and encrypted task/settings storage.

ScheduleOS relevance:

- Good simple day-planning reference.
- Useful as a small-product comparison.

Risks:

- Archived.
- Very small community footprint.
- Not a mature optimization engine.
- Supabase dependency conflicts with ScheduleOS independence unless made optional.

Verdict: do not adopt; use only as feature/UX reference.

### Zero Calendar

Repository: https://github.com/x1xhlol/zero-calendar

License: MIT.

Current activity:

- GitHub API: 360 stars, 91 forks, 3 open issues.
- Last push: 2026-04-26.
- No latest GitHub release found.
- Primary language: TypeScript.

README claims:

- AI-powered scheduling and natural-language event creation.
- Google Calendar sync with webhook updates.
- Invite emails through Resend.
- Calendar analytics, conflict detection, free-time discovery.
- Uses Next.js 16, React 19, Bun, Convex, Better Auth, OpenRouter AI SDK, Resend.

ScheduleOS relevance:

- Useful reference for AI-native calendar interactions and sync architecture.
- Useful for privacy-conscious AI calendar framing.

Risks:

- Requires cloud/service stack pieces for normal operation.
- AI provider dependency appears central.
- No evidence of Motion/Reclaim-style task optimizer.

Verdict: reference calendar/AI surfaces, not core foundation.

### Super Productivity

Repository: https://github.com/super-productivity/super-productivity

License: MIT.

Current activity:

- GitHub API: 20,786 stars, 1,875 forks, 1,371 open issues.
- Last push: 2026-07-21.
- Latest release: v18.15.1, published 2026-07-17.
- Primary language: TypeScript.

README/site claims:

- Advanced todo list with timeboxing and time tracking.
- Imports tasks from calendar, Jira, GitHub, and others.
- Offline/private/no-account positioning.
- Built-in focus/deep-work tooling.

ScheduleOS relevance:

- Strongest mature task/timeboxing UX reference.
- Useful for local-first expectations, import/export, work logging, focus mode, and task ergonomics.

Risks:

- Large mature product with different architecture and goals.
- Not a ScheduleOS constraint optimizer.
- Direct adoption would pull in broad app surface outside ScheduleOS scope.

Verdict: excellent reference; do not adopt as ScheduleOS foundation.

### KiraPilot

Repository: https://github.com/vietanhdev/kirapilot-app

License: MIT.

Current activity:

- GitHub API: 18 stars, 4 forks, 1 open issue.
- Last push: 2025-09-14.
- Latest release: v0.0.54, published 2025-09-14.
- Primary language: TypeScript, with Rust present.

README claims:

- Cross-platform productivity app.
- Task management, time tracking, and intelligent AI assistance.
- WIP warning: APIs and data will change a lot.

ScheduleOS relevance:

- Useful for local AI/task assistant patterns.
- Useful for local-first desktop-adjacent thinking.

Risks:

- WIP.
- Low stars and limited activity.
- Does not look like a mature scheduling optimization foundation.

Verdict: reference only.

### Timefold Solver

Repository: https://github.com/TimefoldAI/timefold-solver

License: Apache-2.0.

Current activity:

- GitHub API: 1,721 stars, 216 forks, 98 open issues.
- Last push: 2026-07-20.
- Latest release: v2.3.0, published 2026-07-10.
- Primary language: Java.

Official positioning:

- Open-source Solver AI for Java/Kotlin.
- Optimizes scheduling and routing.
- Use cases include employee rostering, task assignment, maintenance scheduling, school timetabling, job shop scheduling, and other planning problems.
- Official site says Apache License 2.0 and available in Maven Central.

ScheduleOS relevance:

- Best current primary solver candidate.
- Directly fits hard/soft constraint optimization requirements.
- Better match for defensible scheduling than LLM-generated calendars.

Risks:

- JVM service or library integration needed if ScheduleOS main app is TypeScript.
- Requires careful modeling of ScheduleOS-specific entities, constraints, scores, and explanations.
- Need benchmark against OR-Tools for schedule stability and replanning needs.

Verdict: primary optimizer candidate behind an abstraction.

### Timefold Solver Python

Repository: https://github.com/TimefoldAI/timefold-solver-python

License: Apache-2.0.

Current activity:

- GitHub API: 57 stars, 9 forks, 0 open issues.
- Archived: true.
- Last push: 2025-07-11.
- Latest release: v1.12.0-beta, published 2024-07-09.
- Primary languages: Java and Python.

README claims:

- Python interface for Timefold planning problems.
- Supports vehicle routing, employee rostering, maintenance scheduling, task assignment, school timetabling, cloud optimization, conference scheduling, job shop scheduling, bin packing, and more.
- Explicitly says Python is significantly slower than Java/Kotlin Timefold.

ScheduleOS relevance:

- Historical reference for Python ergonomics.

Risks:

- Archived.
- Slower than JVM Timefold.
- Beta latest release.

Verdict: do not choose as primary solver.

### Google OR-Tools

Repository: https://github.com/google/or-tools

License: Apache-2.0.

Current activity:

- GitHub API: 13,799 stars, 2,442 forks, 109 open issues.
- Last push: 2026-07-21.
- Latest release: v9.15, published 2026-01-12.
- Primary language: C++ with Python, Java, C#, and other bindings present.

Official positioning:

- Google's Operations Research tools.
- Open-source suite for combinatorial optimization.
- Includes CP-SAT, linear/mixed-integer solvers, routing, and graph algorithms.
- Official Google Developers page describes it as software libraries/APIs for constraint optimization, linear optimization, flow, and graph algorithms.

ScheduleOS relevance:

- Strong alternate solver and benchmark.
- Apache-2.0 aligns with preferred ScheduleOS license.
- Large community and active repository.

Risks:

- More generic than Timefold; ScheduleOS must model more optimization details directly.
- Explanation and score interpretation may require more custom work.
- Need wrapper abstraction to avoid leaking solver-specific modeling into domain/application layers.

Verdict: strong alternate/benchmark; keep solver abstraction open.

### DeyWeaver

Repository: https://github.com/Deyweaver/DeyWeaver

License: MIT.

Current activity:

- GitHub API: 360 stars, 34 forks, 3 open issues.
- Last push: 2026-06-30.
- Latest release: v1.3.7, published 2026-06-30.
- Primary language: TypeScript.

README claims:

- Free open-source AI task planner that auto-schedules a day.
- Uses Google Gemini/Genkit.
- Project under maintenance and out of resources.
- Features AI-generated schedules, task breakdown, dynamic reallocation, and productivity analytics.

ScheduleOS relevance:

- Extra reference for AI-first planner UX.

Risks:

- AI/provider appears central, conflicting with ScheduleOS independence from paid AI models.
- Not a mature deterministic optimization engine.
- Maintenance warning.

Verdict: do not adopt; at most use as cautionary AI-first comparison.

## Licensing Assessment

Likely compatible references:

- MIT: FluidCalendar, Plazen, Zero Calendar, Super Productivity, KiraPilot, DeyWeaver.
- Apache-2.0: Timefold Solver, Timefold Solver Python, Google OR-Tools.

Preferred ScheduleOS license remains Apache-2.0 if all reused dependencies/components remain compatible.

No source code is approved for copying yet. If direct code reuse occurs later, `docs/security/licensing-audit.md` must record:

- Source repository.
- Version or commit.
- License.
- Copied vs referenced vs linked dependency.
- Modifications.
- Attribution/notice requirements.
- Compatibility approval.

## Security and Privacy Assessment

None of the inspected projects should be assumed secure enough for ScheduleOS release without local audit.

Specific concerns:

- Calendar and task content are sensitive.
- Several projects require OAuth, external AI, email, Convex/Supabase, or other services.
- AI-first projects must be treated as prompt-injection-sensitive.
- Calendar sync/write-back requires duplicate prevention, idempotency, token encryption, revocation, and privacy-minimized event storage.
- ScheduleOS must build its own threat model regardless of reference project choice.

## Production Readiness Assessment

| Project | Production-readiness signal |
| --- | --- |
| FluidCalendar | README says active development, very buggy, incomplete, not recommended for production. |
| Plazen | Archived; not production foundation. |
| Zero Calendar | Active enough as product reference, but no release evidence and service-dependent stack. |
| Super Productivity | Mature app, frequent releases, large community. Production-quality reference for task UX, not solver. |
| KiraPilot | WIP and low activity. |
| Timefold Solver | Active mature solver candidate. |
| Timefold Solver Python | Archived; avoid. |
| Google OR-Tools | Mature active solver candidate. |
| DeyWeaver | Maintenance warning and AI-first design. |

## Final Recommendation

Choose **Strategy C: Build clean ScheduleOS repository using audited references**.

Initial architecture decision should be:

- TypeScript application/API/domain layer.
- Solver abstraction from day one.
- Timefold Solver Java/Kotlin as primary solver candidate, likely as a service boundary or worker.
- OR-Tools as alternate/benchmark solver.
- No LLM as authoritative scheduler.
- Optional AI understanding layer only after deterministic validation.
- FluidCalendar/Super Productivity/Plazen only as UX/product references.
- OwnerOps, ConnectOS, and compatible leadership system only through public adapter contracts.

## Remaining Research Work

Before ADR acceptance:

- Clone or inspect source trees for dependency health and architecture depth.
- Review each repository's tests/CI in detail.
- Check dependency vulnerabilities where practical.
- Inspect FluidCalendar scheduling implementation after installing dependencies.
- Prototype a tiny Timefold model for ScheduleOS task-to-timeblock assignment.
- Prototype a tiny OR-Tools CP-SAT model for the same case.
- Compare solver ergonomics, performance, explanations, and deployment complexity.
- Run a naming/trademark/GitHub availability check for `scheduleos-ai/scheduleos`.

## Current Gate Status

```text
Foundation audit gate: PARTIAL PASS
Reason: official source metadata and high-level README evidence collected; deeper source, CI, dependency, security, and solver prototype audits remain before ADR finalization.
```
