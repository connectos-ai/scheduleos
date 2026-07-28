# Repository Settings Approval Checklist

## Status

Current result: `FAIL`.

ScheduleOS has a review-only repository settings readiness packet. Public repository settings are not configured or approved until the evidence below is attached, reviewed, and accepted on the intended public repository.

No public release, repository launch approval, tag, package publication, hosted deployment, or announcement may rely on repository settings until this checklist changes to `PASS`.

## Verified Local Foundations

Current local evidence covers:

- Repository readiness docs name the preferred target `scheduleos-ai/scheduleos` and block publication until release gates pass.
- Repository settings readiness packet foundation requires explicit branch protection, required status checks, security advisory settings, default branch and merge policy, maintainer access review, Dependabot alerts, secret scanning push protection, release/package permissions, repository metadata, public issue/discussion settings, and second-operator evidence labels.
- Public remote CI approval checklist requires repository settings readiness before remote CI can be accepted.
- Public repository launch approval checklist requires repository settings proof before repository launch can be accepted.
- Security policy contact approval checklist separately tracks monitored contact and advisory workflow evidence.

These foundations do not create repositories, initialize git, add remotes, mutate repository settings, mutate branch protection, configure advisories, change maintainer access, mark settings configured, push, tag, publish, or announce ScheduleOS.

## Required Evidence Before PASS

Attach current evidence for every item:

- Target repository proof confirming settings evidence applies to the approved public repository and release-candidate branch.
- Branch protection proof confirming protected default branch, required pull request/review policy, force-push restrictions, deletion restrictions, and administrator expectations.
- Required status checks proof confirming the release gate workflow, dependency audit, docs link check, release safety scan, license check, PostgreSQL CI where required, and security-relevant checks are required before merge or release.
- Security advisory settings proof confirming private vulnerability reporting or equivalent advisory intake is enabled and aligned with `SECURITY.md`.
- Default branch and merge policy proof confirming branch name, squash/merge/rebase policy, stale review handling, and release branch expectations.
- Maintainer access review proof confirming least-privilege access, backup maintainers, no unreviewed broad access, and no personal/private fixture data in public docs.
- Dependabot or vulnerability alert proof confirming dependency alerts are enabled or an accepted alternative is documented.
- Secret scanning and push protection proof confirming available secret scanning protections are enabled or an accepted alternative is documented.
- Release and package permission proof confirming packages, releases, tags, deployments, and workflow dispatch permissions are restricted until release approval.
- Repository metadata proof confirming public description, topics, homepage, license display, README, security policy, issue templates, and visibility match approved launch material.
- Public issue/discussion settings proof confirming blank issues are disabled, private-data/security reports are routed away from public issues, and issue templates require fictional/sanitized data.
- Log, artifact, and workflow retention proof confirming review evidence remains available without exposing secrets or private data.
- Clean public history, public remote CI, security contact, final security/privacy/licensing/dependency audit, and final release-gate evidence remain aligned with the same release candidate.
- Second operator approves repository settings evidence packet.

## Required Commands

Run before changing checklist `PASS`:

```bash
npm run check
npm audit --omit=dev --audit-level=high
npm run release:safety
npm run license:check
find . -maxdepth 2 -name .git -type d -print
```

The no-`.git` check must return no output until intentional clean public repository history is prepared.

## Review-Only Packet

Use this command to prepare evidence labels only:

```bash
npm run repository:settings-readiness-packet -- --environment release-demo --target-repository scheduleos-ai/scheduleos --settings-profile public-open-source-hardening-demo --branch-policy required-checks-main-demo --branch-protection-settings branch-protection-settings-demo --required-status-checks required-status-checks-demo --security-advisory-settings security-advisory-settings-demo --default-branch-merge-policy default-branch-merge-policy-demo --maintainer-access-review maintainer-access-review-demo --dependabot-alerts dependabot-alerts-demo --secret-scanning-push-protection secret-scanning-push-protection-demo --release-package-permissions release-package-permissions-demo --repository-metadata repository-metadata-demo --public-issue-discussion-settings public-issue-discussion-settings-demo --second-operator second-operator-repository-settings-review-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --json
```

This packet does not create repositories, initialize git, add remotes, mutate repository settings, mutate branch protection, configure advisories, change maintainer access, mark repository settings configured, push, tag, publish, or announce ScheduleOS.

## Current Remaining Risk

High. Repository settings remain unproven until the public repository exists after release approval, branch protection and required checks are configured, advisory/security settings and maintainer access are reviewed, issue intake remains privacy-safe, release/package permissions are restricted, and second-operator approval is recorded.

## Release Rule

Do not rely on repository settings for public release until this checklist changes from `FAIL` to `PASS` with current public-repository evidence.
