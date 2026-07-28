# ScheduleOS Current-State Audit

Date: 2026-07-21

## Verdict

ScheduleOS now exists as an early local standalone TypeScript package, but not as a release-candidate application or public git repository. The workspace contains useful adjacent projects and scheduling references plus a new local ScheduleOS implementation with domain contracts, deterministic scheduling, dependency-free HTTP API, tests, and architecture/security/product documentation.

The correct next direction is to build a clean independent ScheduleOS workspace after research and ADR approval. Do not fork, copy, publish, push, tag, or make a repository public until the research, licensing, security, privacy, git-history, functionality, and test gates in the goal pass.

## Current Local Implementation Evidence

As of 2026-07-21, the local ScheduleOS workspace contains:

- TypeScript package and build configuration.
- Provider-neutral task, calendar, working-hours, schedule-plan, time-block, warning, and explanation domain contracts.
- Deterministic scheduler for fixed busy event avoidance, timezone-aware working-hour placement, daylight-saving and standard-time conversion, recurring break-window protection, priority ordering, finish-before-start dependency ordering, preferred daypart placement, splitting, locked-block preservation, blocked/ineligible filtering, partial completion, deadline risk, capacity warnings, and grounded explanations.
- Dependency-free local HTTP API with in-memory state by default and optional JSON-backed local storage for task, calendar-event, working-hours, and schedule-plan state.
- API endpoints currently verified for health, task create/list/read/update/delete, calendar-event create/list/read/update/delete, working-hours update with break windows, schedule-plan creation/list/read, schedule-plan acceptance, schedule-plan rejection, schedule-plan replanning, plan-scoped capacity/deadline-risk/unscheduled-task/explanation reads, static API-key tenant-scope and read/write role enforcement, local request-body size cap rejection, and time-block lock/unlock/complete/missed transitions.
- Repository ports now exist for tasks, calendar events, working hours, schedule plans, time blocks, audit events, idempotency, and integration state over the current local store and initial SQLite adapter. Repository tests prove tenant/workspace/user scope enforcement across current storage adapters, including calendar-event get/list/delete boundaries.
- API task, schedule-plan creation, plan reporting, and time-block state routes now use repository methods where the current route contracts carry full scope.
- `npm run check` passes locally: TypeScript build plus 155 Node tests, 155 passing, 0 failing.
- `npm audit --omit=dev --audit-level=high` passes locally with 0 vulnerabilities.
- `npm run test:postgres:live` safely skips without `SCHEDULEOS_TEST_POSTGRES_URL`. 2026-07-22 update: `npm run test:postgres:docker` passed locally after Docker Desktop was started, proving migrations and repository behavior against disposable PostgreSQL 16 `scheduleos_test`.
- `.github/workflows/ci.yml` defines GitHub Actions jobs for default build/test/audit and PostgreSQL live service tests. YAML parsing passed locally, but the workflow has not run remotely because this workspace is not a published git repository.

This evidence improves the foundation but does not change the public release status. Release gate remains fail.

## Inspected Locations

| Path | Classification | Evidence |
| --- | --- | --- |
| Local ScheduleOS workspace | Early local standalone ScheduleOS workspace | TypeScript build and 38 tests pass locally. No git repository initialized. Not a release candidate. |
| Local FluidCalendar checkout | Scheduling prototype/reference | Contains untracked `docs/ARCHITECTURE.md`, `docs/MVP_SPEC.md`, and `src/foundation/`. Tests cannot run because dependencies are missing. |
| Local ConnectOS reference workspace | ConnectOS reference | `pnpm release:check` passed locally: 34 test files, 126 tests. Docs describe neutral connector infrastructure and release blockers. |
| `Local public-safe OwnerOps candidate` | Public-safe OwnerOps candidate | `npm test` passed 6 tests. `npm run check` passed and public release audit passed. Docs still mark full release gate incomplete. |
| `Local private OwnerOps source workspace` | Private OwnerOps source workspace | Private monorepo with significant dirty worktree and private context. Must not be imported directly into ScheduleOS. |
| `Local private compatible leadership system product/docs workspace` | Private compatible leadership system product/docs | Contains updated three-pillar architecture doc linking compatible leadership system, ConnectOS, OwnerOps, and ScheduleOS. |
| `Local adjacent Flow/time-reclaim diagnostic workspace` | Adjacent Flow/time-reclaim diagnostic | `npm run smoke` and `npm run typecheck` passed. It is not a scheduler or core ScheduleOS foundation. |

## Existing ScheduleOS Work

Before this audit folder was created, searches of local workspace roots for directories named `scheduleos` returned no existing standalone ScheduleOS project.

The current ScheduleOS state is:

- Documentation goal: present in the pasted autonomous goal.
- compatible leadership system architecture references: present and updated.
- Scheduling prototype/reference: present in FluidCalendar foundation.
- Standalone local package: present in early TypeScript form.
- Deterministic scheduling engine: present as local foundation with dependency ordering, preferred daypart placement, recurring break-window protection, and timezone/DST working-hour conversion, not mature optimization solver.
- Public API/events: partial local HTTP API present with optional JSON-backed local persistence; complete public API and event contracts not implemented.
- Public documentation set: partial architecture/product/security/integration docs present.
- Public release audits: incomplete and failing.
- Public repository: not created.

## Existing Scheduling-Related Code

### FluidCalendar Foundation

Path:

```text
Local FluidCalendar checkout outside this ScheduleOS workspace.
```

Observed files:

- `src/foundation/tasks/types.ts`
- `src/foundation/calendar/types.ts`
- `src/foundation/scheduling/types.ts`
- `src/foundation/scheduling/preferences.ts`
- `src/foundation/scheduling/scheduler.ts`
- `src/foundation/scheduling/deterministicScheduler.ts`
- `src/foundation/adapters/prisma.ts`
- `src/foundation/scheduling/__tests__/deterministicScheduler.test.ts`
- `src/foundation/adapters/__tests__/prisma.test.ts`
- `docs/ARCHITECTURE.md`
- `docs/MVP_SPEC.md`

Verified facts:

- `package.json` name is `fluid-calendar`.
- License in `package.json` is `MIT`.
- The local `src/foundation` folder is untracked.
- `node_modules` is missing.
- `npm run type-check -- --pretty false` failed because `tsc` was not found.
- `npm run test:unit -- src/foundation/scheduling/__tests__/deterministicScheduler.test.ts --runInBand` failed because `jest` was not found.
- `npm run test:unit -- src/foundation/adapters/__tests__/prisma.test.ts --runInBand` failed because `jest` was not found.

Partial implementation:

- A first-fit deterministic scheduler concept exists.
- Basic foundation task fields exist: id, title, duration, deadline, priority, status, earliestStart.
- Basic calendar busy-block integration exists.
- Basic preferences include timezone and work hours.
- Tests describe priority ordering, busy event avoidance, and adapter mapping.

Limitations:

- Not verified by tests in current checkout.
- Not a standalone ScheduleOS product.
- Does not implement the goal's required provider-neutral task contract.
- Does not implement the full calendar model.
- Does not implement Timefold, OR-Tools, or another mature optimization solver.
- Does not prove locked blocks, replanning, capacity warnings, explanations, multi-tenancy, authorization, security tests, or public API/events.
- Current local foundation should be treated as reference material only until dependencies are installed and tests pass.

## Existing compatible leadership system Architecture Documentation

Path:

```text
Local private compatible leadership system product/docs workspace
```

Canonical architecture doc:

```text
docs/DOBOTH_THREE_PILLAR_ARCHITECTURE.md
```

Updated/verified content:

- compatible leadership system is the private leadership intelligence and commercial orchestration layer.
- ConnectOS is connection infrastructure.
- OwnerOps is work, triage, task, delegation, and operating state.
- ScheduleOS is time, capacity, planning, scheduling optimization, and replanning.
- Primary questions are documented:
  - ConnectOS: what can the system securely connect to and do?
  - OwnerOps: what work exists, who owns it, and what requires leadership?
  - ScheduleOS: when should work happen, and what realistically fits?
  - compatible leadership system: what should the leader focus on, approve, delegate, delay, or stop?
- Complete operating loop is documented.
- Boundaries document public APIs/events/SDKs, no hidden privileged integration path, no circular dependency, no shared production database, and no cross-project token sharing.

Discoverability links found:

- `docs/CONSTITUTION.md`
- `docs/DOBOTH_FLYWHEEL_AND_ECOSYSTEM.md`
- `docs/ECOSYSTEM_PROJECT_AUDIT_20260720.md`

Remaining compatible leadership system doc concern:

- The compatible leadership system docs are private product docs and should not be copied into a public ScheduleOS repository except as neutral public integration documentation written from scratch.

## Current Repository Boundaries

ScheduleOS must be a clean independent project.

Current boundaries:

- compatible leadership system is private and owns leadership intelligence, Business DNA, approvals, owner-facing language, and product relationship.
- ConnectOS is optional connector infrastructure and should be used through public provider/capability/action contracts.
- OwnerOps is optional work ownership infrastructure and should be used through public APIs/events/adapters.
- ScheduleOS must own time, capacity, optimization, replanning, schedule plans, time blocks, capacity warnings, and scheduling explanations.

Boundary rules for future ScheduleOS:

- No compatible leadership system private code.
- No private OwnerOps internals.
- No private ConnectOS internals.
- No shared production database.
- No cross-project token sharing.
- No hidden private leadership-only APIs.
- No public repository history copied from private monorepos.
- Public integrations must work through documented APIs, SDKs, webhooks, and events available to other developers.

## Reusable Components

### Strongly reusable as design references

- FluidCalendar foundation domain separation: task/calendar/scheduling/adapters.
- FluidCalendar calendar/task UI concepts.
- ConnectOS provider/capability/action boundary.
- ConnectOS release hygiene and public documentation structure.
- OwnerOps public candidate's dependency-free API style and adapter boundary.
- OwnerOps public task ownership and owner-decision concepts.
- TimeBack AI language around reclaimed time and mental burden, if rewritten neutrally.
- compatible leadership system three-pillar architecture model, rewritten as neutral public integration guidance.

### Potentially reusable after license/security review

- MIT-licensed FluidCalendar concepts or code snippets, only after full dependency, source, and attribution review.
- Apache-2.0 OwnerOps public candidate contracts, if intentionally shared and attributed.
- ConnectOS adapter concepts, if exposed through a public stable interface.

### Not reusable as-is

- Private OwnerOps source workspace under `Roth Biz`.
- compatible leadership system private leadership brain code, prompts, Business DNA, customer language, or memory.
- Real customer, church, staff, Slack, calendar, email, or machine details.
- FluidCalendar git history unless a proper fork/attribution strategy is selected.
- Any local `.env`, logs, database files, screenshots, or generated outputs containing private data.

## Private Dependencies

Known private or sensitive dependencies/contexts:

- `Local private OwnerOps source workspace` is a private monorepo with real/private context.
- compatible leadership system is private commercial product work.
- Local machine paths must not appear in public ScheduleOS docs.
- ConnectOS is currently private package name `connect-any-inbox` and docs say public v1.0 is blocked by owner release decisions.
- OwnerOps public candidate has no remote configured and is not a full release candidate.

## Open-Source Candidates Already Identified

The pasted planning material identifies these candidates for the required research phase:

| Candidate | Current audit status |
| --- | --- |
| FluidCalendar | Local checkout found and inspected. MIT license in package metadata. Untracked foundation exists but tests cannot run because dependencies are missing. |
| Plazen | Identified by planning notes only. Not yet inspected in this goal. |
| Zero Calendar | Identified by planning notes only. Not yet inspected in this goal. |
| Super Productivity | Identified by planning notes only. Not yet inspected in this goal. |
| KiraPilot | Identified by planning notes only. Not yet inspected in this goal. |
| Timefold Solver | Identified by planning notes as likely solver. Not yet inspected in this goal. |
| Timefold Solver Python | Identified by planning notes only. Not yet inspected in this goal. |
| Google OR-Tools | Identified by planning notes as alternative solver. Not yet inspected in this goal. |

Do not choose a foundation until `docs/research/open-source-scheduler-audit.md` is completed using official repositories and current evidence.

## Missing Functionality

ScheduleOS is missing all release-candidate functionality required by the goal:

- Standalone task inbox.
- Projects/lists.
- Task create/edit UI.
- Local calendar.
- Working hours.
- Personal hours.
- Availability rules.
- Daily and weekly calendar views.
- Unscheduled queue.
- Automatic planning.
- Manual drag/drop production calendar UI.
- Locked blocks.
- Task completion and partial completion.
- Replanning.
- Search and filters.
- Import/export.
- Provider-neutral task contract.
- Provider-neutral calendar model.
- Public REST API.
- Event model.
- Webhooks.
- OwnerOps adapter.
- ConnectOS adapter.
- compatible leadership system public example contract.
- ICS import/export.
- Multi-user/team model.
- Multi-tenancy and authorization.
- Secure auth/session model.
- Token encryption for providers.
- Prompt-injection defenses.
- Privacy controls.
- Solver abstraction.
- Mature optimization engine.
- Capacity and feasibility reporting.
- Grounded explanations.
- Documentation tree.
- CI/CD.
- Public release security audit.
- Licensing audit.
- Git-history safety audit.
- Clean public repository.

## Security Concerns

ScheduleOS will handle sensitive calendar, task, and identity data. The current state has not yet addressed:

- Tenant isolation.
- User authorization.
- Calendar privacy minimization.
- Private event title redaction.
- Token encryption.
- OAuth state validation.
- Webhook signature verification.
- Replay protection.
- Prompt-injection defense for imported tasks/messages/calendar text.
- Secret redaction.
- Log redaction.
- Production distributed rate limiting, throttling, and provider-specific import limits.
- CSRF protection where applicable.
- Audit logging.
- Data deletion/export/revocation controls.
- Dependency scanning.
- Git-history scanning.

Current public-release status must be considered `FAIL` until these controls are designed, implemented, tested, scanned, and documented.

## Licensing Concerns

No code should be copied yet.

Known license facts from inspected package metadata:

- FluidCalendar: `MIT`.
- ConnectOS local package: `MIT`, private package flag currently true.
- OwnerOps public candidate: `Apache-2.0`.

Open licensing questions:

- Whether ScheduleOS should use Apache-2.0 as preferred by the goal.
- Whether any FluidCalendar code will be copied, referenced, or reimplemented.
- Whether solver dependencies such as Timefold or OR-Tools are compatible with the chosen license and distribution model.
- Whether UI libraries, icons, fonts, fixtures, docs, or sample data require notices.
- Whether inherited snippets from any local/private repo contain restricted or private context.

Licensing gate is currently `FAIL / not run`.

## Recommended Extraction and Build Strategy

Recommended strategy at this point:

1. Complete open-source foundation audit using official current sources.
2. Write `docs/research/open-source-scheduler-audit.md`.
3. Choose strategy in `docs/architecture/ADR-001-build-foundation.md`.
4. Likely choose Strategy C: clean ScheduleOS repository using audited references and a solver behind an abstraction.
5. Build from clean sanitized files, not from private git history.
6. Use fictional fixtures only.
7. Keep compatible leadership system, OwnerOps, and ConnectOS as optional public adapters.
8. Treat FluidCalendar as UX/domain reference unless research proves proper fork/adoption is safer.
9. Treat Timefold Solver as expected primary optimizer candidate until research confirms or rejects.
10. Keep OR-Tools as alternate solver/benchmark candidate.

## Public-Release Blockers

Release blockers currently include:

- No ScheduleOS release-candidate product exists.
- Minimal deterministic scheduler and local API implementation/tests exist, but the product is far from release-complete.
- Research audit is draft/partial; deeper source, CI, dependency, security, and solver prototype audits remain.
- ADR-001 has partial validation through the local TypeScript foundation. ADR-002 defines production storage boundaries and database direction, but storage implementation is not complete.
- Draft architecture documentation exists, but implementation has only proven the first small local slice.
- Draft public API/event contracts exist in `docs/architecture/integration-model.md`; a minimal local HTTP API exists but is not production-ready.
- Deterministic baseline scheduler exists. Mature solver selection remains open until Timefold and OR-Tools prototypes are compared.
- Static API-key authentication, scope checks, and read/write role checks exist for local API foundation; production persisted auth/session/membership model not implemented.
- No privacy model implemented.
- No licensing audit.
- No secret scan.
- No personal-information scan.
- No git-history audit.
- No CI.
- No clean public repository.
- No verified GitHub name/trademark check.
- No root open-source docs.
- No self-hosting documentation.
- No release checklist PASS.

## Evidence Commands Run

```text
find <local workspace roots> -maxdepth 4 -type d -iname '*scheduleos*' -print
git status --short
find . -maxdepth 3 -type f ...
npm run type-check -- --pretty false
npm run test:unit -- src/foundation/scheduling/__tests__/deterministicScheduler.test.ts --runInBand
npm run test:unit -- src/foundation/adapters/__tests__/prisma.test.ts --runInBand
pnpm release:check
npm test
npm run check
npm run smoke
npm run typecheck
```

Observed outcomes:

- No existing ScheduleOS directory found before this audit workspace.
- FluidCalendar typecheck and unit tests failed because dependencies are missing (`tsc` and `jest` not found).
- ConnectOS `pnpm release:check` passed with 34 test files and 126 tests.
- OwnerOps public candidate `npm test` passed 6 tests and `npm run check` passed.
- TimeBack AI `npm run smoke` and `npm run typecheck` passed.
- ScheduleOS `npm run check` passed after the first local API slice: TypeScript build passed, 2 API tests passed, and 7 scheduler tests passed.

## Completed Documentation Since Initial Audit

Latest verification update 2026-07-22: ScheduleOS `npm run check` now passes TypeScript build plus 155 Node tests across API, repository, SQLite repository, PostgreSQL migration SQL, PostgreSQL migration runner, PostgreSQL migration CLI, PostgreSQL `pg` client adapter, PostgreSQL async task, calendar event, working-hours, schedule-plan, time-block, audit-event, idempotency, and integration-state repository adapters, backup, restore, workspace export, workspace deletion, and scheduler behavior. `npm audit --omit=dev --audit-level=high` passes with 0 vulnerabilities. The earlier observed-outcome line for the first local API slice is superseded by this result.

- `docs/research/open-source-scheduler-audit.md`
- `docs/architecture/ADR-001-build-foundation.md`
- `docs/architecture/ADR-002-storage-boundaries.md`
- `docs/architecture/postgresql-storage.md`
- `docs/architecture/storage-design.md`
- `docs/architecture/overview.md`
- `docs/architecture/domain-boundaries.md`
- `docs/architecture/solver-design.md`
- `docs/architecture/integration-model.md`
- `docs/product/task-model.md`
- `docs/product/calendar-model.md`
- `docs/product/scheduling-constraints.md`
- `docs/product/replanning.md`
- `docs/product/capacity.md`
- `docs/product/explanations.md`
- `docs/security/threat-model.md`
- `docs/security/data-handling.md`
- `docs/security/ai-safety.md`
- `docs/security/public-release-security-audit.md`
- `docs/integrations/ownerops.md`
- `docs/integrations/connectos.md`
- `docs/integrations/leadership-system.md`
- `docs/integrations/calendar-providers.md`
- `docs/integrations/task-sources.md`
- `docs/operations/sqlite-storage.md`
- `docs/implementation-plan.md`
- `README.md`
- `package.json`
- `tsconfig.json`
- `src/domain.ts`
- `src/api.ts`
- `src/api.test.ts`
- `src/repositories.ts`
- `src/repositories.test.ts`
- `src/sqlite.ts`
- `src/sqlite.test.ts`
- `src/postgres.ts`
- `src/postgres.test.ts`
- `src/postgres-repositories.ts`
- `src/postgres-repositories.test.ts`
- `src/cli.ts`
- `src/cli.test.ts`
- `docs/operations/postgresql-migrations.md`
- `src/node-sqlite.d.ts`
- `src/scheduler.ts`
- `src/scheduler.test.ts`
- `migrations/sqlite/001_initial.sql`
- `migrations/postgres/001_initial.sql`

## Next Required Deliverables

1. Run the guarded live PostgreSQL service spec in remote CI after public repository setup. Local Docker proof passed on 2026-07-22.
2. Continue SQLite concurrency and production-hardening work.
3. Add CI status evidence once the repository exists and GitHub Actions can run.
4. Prototype Timefold and OR-Tools comparison cases before final solver commitment.
5. Create remaining root operations docs: license, contributing, self-hosting, deployment, troubleshooting, roadmap, and public release checklist.
6. Begin licensing and private-data scan docs before any git/public release work.
7. Add production authentication, tenant membership, role model, and authorization design before any multi-user public deployment path.

## Current Gate Status

```text
ScheduleOS release gate: FAIL
Reason: inspection, research, ADRs, draft architecture documentation, minimal deterministic scheduler, complete local-store repository ports, initial SQLite adapter migration, PostgreSQL schema plus migration runner foundation, optional JSON-backed local persistence, static API-key local auth, local HTTP API slice, safe PostgreSQL migration dry-run command, PostgreSQL `pg` client adapter, guarded live PostgreSQL spec, successful local Docker PostgreSQL proof, GitHub Actions CI workflow, and PostgreSQL async repository adapter slices for all current repository ports exist. Production product implementation, production storage hardening, integrations, full tests, security, licensing, privacy, git-history, complete documentation, remote CI evidence, and publication gates are incomplete.
```
