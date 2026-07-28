# ScheduleOS Roadmap

## Status

Draft roadmap. Items here are not release promises.

## Release Candidate Priorities

- Standalone task inbox and local calendar experience.
- Daily and weekly plan views.
- Automatic planning and replanning from task, calendar, and lock changes.
- Honest unscheduled-work, deadline-risk, and capacity reporting.
- Grounded scheduling explanations.
- ICS import and export.
- Generic task-source and calendar-source APIs.
- JSON task import.
- CSV task import.
- Mock OwnerOps and ConnectOS adapters.
- Public compatible leadership system-style leadership enrichment example that uses the same public contract as any other app.
- Production auth, membership, role, and tenant-isolation model.
- Live PostgreSQL proof in local Docker and CI.
- Security, privacy, licensing, dependency, and git-history release audits.

## Solver Roadmap

- Keep the current deterministic engine as a small, testable baseline.
- Prototype Timefold Solver behind the optimization engine port.
- Prototype Google OR-Tools as an alternative benchmark.
- Document solver comparison and final selection in an ADR.
- Add schedule-stability, focus-time, fragmentation, and workload-balance scoring.

## Integration Roadmap

- Production CSV import UI, provider-specific templates, and user-facing confirmation flow built on dry-run preview.
- ICS import/export.
- Production hardening for generic webhook task ingestion.
- OwnerOps adapter.
- ConnectOS capability adapter.
- Google Calendar and Microsoft Outlook Calendar only after token, sync, privacy, retry, and revocation handling are production-ready.

## Product Roadmap

- Simple first-run setup.
- Working-hours and personal-boundary editor.
- Unscheduled queue.
- Lock, move, split, complete, and miss block workflows.
- Capacity forecast.
- Replanning summary.
- Persona demos for solo user, busy owner, pastor or creative leader, small-team manager, calendar-heavy professional, local-first user, and ConnectOS user.

## Future Ideas

- Team capacity planning.
- Shared workload balancing.
- Flexible meeting scheduling.
- Historical completion-rate learning.
- Local AI understanding layer.
- Optional AI explanation coaching.
- Mobile-native apps.
- Marketplace-style adapters.
