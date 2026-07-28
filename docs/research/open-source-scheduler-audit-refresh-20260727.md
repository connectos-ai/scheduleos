# Open-Source Scheduler Foundation Audit Refresh

Date: 2026-07-27

## Status

This is a source refresh for `docs/research/open-source-scheduler-audit.md`.

It does not approve code copying, dependency adoption, forking, publication, or a public release. The foundation audit gate remains `PARTIAL PASS` until deeper source, CI, dependency, security, attribution, and solver prototype work is complete.

## Refreshed Source Signals

Official source pages reviewed on 2026-07-27:

| Project | Source | Refresh signal | ScheduleOS impact |
| --- | --- | --- | --- |
| FluidCalendar | `https://github.com/dotnetfactory/fluid-calendar` | Repository still presents FluidCalendar as an open-source Motion-like intelligent task scheduling/calendar project under MIT and still warns it is actively developed with bugs/incomplete features. | Keep as product/UX reference only. Do not adopt wholesale. |
| Plazen | `https://github.com/plazen/plazen.org` and `https://github.com/plazen` | Repository/organization remains archived/read-only. | Keep as small-product planning reference only. Do not choose as foundation. |
| Zero Calendar | `https://github.com/x1xhlol/zero-calendar` | Repository still presents Zero Calendar as an open-source AI-native calendar under MIT. | Keep as AI/calendar interaction reference only. Do not treat as standalone scheduling optimizer foundation. |
| Super Productivity | `https://github.com/super-productivity/super-productivity` and `https://super-productivity.com/` | Project remains an MIT open-source todo/timeboxing/time-tracking app with offline/privacy-first positioning and recent release activity. | Keep as mature task/timeboxing UX reference. Do not treat as solver core. |
| KiraPilot | `https://github.com/vietanhdev/kirapilot-app` | Repository still presents KiraPilot as cross-platform task/time-tracking/AI assistance under MIT with WIP warning. | Keep as local AI productivity reference only. |
| Timefold Solver | `https://github.com/TimefoldAI/timefold-solver` and `https://docs.timefold.ai/timefold-solver/latest/frequently-asked-questions` | Project remains Apache-2.0 open-source Java/Kotlin solver with commercial enterprise edition separate. | Keep as primary mature solver candidate behind a service/adapter boundary. |
| Timefold Solver Python | `https://github.com/TimefoldAI/timefold-solver-python` | Repository remains archived/read-only. | Do not choose as primary solver. Historical reference only. |
| Google OR-Tools | `https://github.com/google/or-tools` and `https://developers.google.com/optimization/support/release_notes` | Project remains Apache-2.0 optimization toolkit; release notes are actively maintained. | Keep as strong alternate solver/benchmark behind `OptimizationEngine` boundary. |

## Preserved Decision

The 2026-07-21 audit recommendation still stands:

- Do not adopt any audited project wholesale.
- Build ScheduleOS as a clean, independent repository.
- Treat FluidCalendar, Plazen, Zero Calendar, Super Productivity, and KiraPilot as references only.
- Treat Timefold Solver Java/Kotlin as the primary mature optimization engine candidate.
- Treat Google OR-Tools as the alternate solver/benchmark candidate.
- Keep Timefold Solver Python out of the primary path because it is archived.

## Required Remaining Work

Before any solver or product foundation ADR can move from reference strategy to implementation adoption, ScheduleOS still needs:

- Source-tree inspection for any project used beyond conceptual reference.
- Dependency health and vulnerability review.
- License and attribution review for every copied, linked, or derived artifact.
- CI/test review for any adopted dependency or adapter.
- A tiny Timefold ScheduleOS task-to-timeblock prototype.
- A tiny OR-Tools CP-SAT benchmark for the same fixture.
- Solver ergonomics, performance, explanation, and deployment comparison.
- Final security, privacy, licensing, and dependency audit alignment.

## Release Boundary

This refresh does not approve dependencies, copy source, create remotes, initialize git, publish packages, mark final audits `PASS`, change release status, or announce ScheduleOS.

ScheduleOS release status remains `FAIL`.
