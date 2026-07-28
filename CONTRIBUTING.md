# Contributing to ScheduleOS

ScheduleOS is being prepared as a standalone open-source scheduling system. It is not ready for public release yet, but contributions should already follow public-project standards.

## Project Principles

- ScheduleOS must work without compatible leadership system, OwnerOps, ConnectOS, paid AI, hosted services, or external calendars.
- Integrations must use public APIs, events, SDKs, or documented extension points.
- Do not add private compatible leadership system, OwnerOps, ConnectOS, customer, church, client, calendar, Slack, email, or personal data.
- Use fictional demo data only, such as `tenant_demo`, `workspace_demo`, `user_jordan`, and `task_demo_proposal`.
- Keep scheduling decisions grounded in deterministic constraints. An LLM may interpret input or explain results, but it must not be the authoritative scheduler.

## Local Setup

```bash
npm install
npm run check
```

The default check builds TypeScript, runs the local test suite, and validates project Markdown links.

Optional guarded PostgreSQL proof:

```bash
npm run test:postgres:docker
npm run postgres:test:down
```

The live PostgreSQL test refuses destructive setup unless the database name includes `scheduleos_test`.

## Before Opening a Pull Request

Run:

```bash
npm run check
npm audit --omit=dev --audit-level=high
```

For storage, migration, security, privacy, integration, or scheduling-behavior changes, also update the relevant docs under `docs/` and add focused tests.

## Design Expectations

- Prefer provider-neutral contracts over one-off provider fields.
- Keep tenant, workspace, and user boundaries explicit.
- Treat imported task and calendar text as untrusted data.
- Preserve source provenance for imported work and generated schedule evidence.
- Report impossible schedules honestly instead of hiding unscheduled work.
- Keep explanations tied to actual solver inputs, outputs, constraints, and warnings.

## Release Safety

Do not publish, push to a public remote, tag, or announce a release until the public release checklist passes. A clean public repository should be created only after licensing, privacy, secret, git-history, dependency, documentation, and functionality gates are satisfied.
