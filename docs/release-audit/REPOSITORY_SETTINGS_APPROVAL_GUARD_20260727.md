# Repository Settings Approval Guard

Date: 2026-07-27

## Result

Added a local guard that keeps repository settings approval in `FAIL` status until real public-repository evidence is attached, reviewed, and accepted.

## Scope

- Verifies `docs/release/repository-settings-approval-checklist.md` remains `FAIL`.
- Verifies public repository creation remains unchecked in `docs/public-release-checklist.md`.
- Verifies no local `.git` directory exists before repository settings approval.
- Verifies release-use prohibitions remain explicit for public release, repository launch approval, tags, package publication, hosted deployment, and announcements.
- Verifies required settings evidence remains listed for target repository proof, branch protection, required status checks, security advisory settings, default branch merge policy, maintainer access, dependency alerts, secret scanning push protection, release/package permissions, repository metadata, public issue/discussion settings, log/artifact/workflow retention, and second-operator review.
- Verifies public remote CI and public repository launch checklists still depend on repository settings proof.
- Verifies repository readiness, settings readiness packet, package wiring, and CLI tests remain present.

## Boundary

This is not repository settings approval.

The guard does not create repositories, initialize git, add remotes, mutate repository settings, mutate branch protection, configure advisories, change maintainer access, mark settings configured, push, tag, publish, deploy hosting, change final release status, or announce ScheduleOS.

ScheduleOS release status remains `FAIL`.
