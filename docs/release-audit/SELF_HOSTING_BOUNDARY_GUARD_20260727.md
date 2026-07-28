# Self-Hosting Boundary Guard

Date: 2026-07-27

## Result

Added a local guard that preserves ScheduleOS local/self-host instructions and production caveats while the project remains in release-prep `FAIL` status.

## Scope

- Verifies `docs/self-hosting.md` keeps minimum local run steps, local-only bind guidance, storage configuration, cookie-session caveats, local planning app workflow, and production gaps.
- Verifies `docs/deployment.md` keeps pre-release deployment status, no production web app/hosted artifact claim, release check commands, deployment readiness packet caveat, and pre-production safeguards.
- Verifies `README.md` still presents ScheduleOS as early local implementation with release gate `FAIL`, local `/app` URL, and no hosted-service/subscription requirement.
- Verifies production startup guard tests remain present for public bind, auth, throttling, durable storage, persisted throttling, and secure session cookie behavior.
- Verifies standalone web app tests remain present for responsive layout, browser-verifiable drag/conflict hooks, and provider CSV review.
- Verifies the public release checklist keeps the standalone production web app blocker unchecked.

## Boundary

This is not production self-hosting approval.

The guard does not prove production deployment, configure hosting, create container images, create remotes, initialize git, publish packages, approve browser matrices, mark production web app proof complete, mark final audits `PASS`, change release status, or announce ScheduleOS.

ScheduleOS release status remains `FAIL`.
