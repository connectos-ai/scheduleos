# Public Repository Launch Approval Checklist

## Status

Current result: `FAIL`.

ScheduleOS has repository readiness documentation and a review-only repository launch readiness packet. The public repository is not approved for creation until the evidence below is attached, reviewed, and accepted.

No public repository, remote, push, tag, package publication, hosted deployment, or release announcement may be created from this checklist until it changes to `PASS`.

## Verified Local Foundations

Current local evidence covers:

- Preferred target remains `scheduleos-ai/scheduleos` in `docs/release/repository-readiness.md`.
- Repository readiness docs record GitHub name, naming-collision, trademark-risk, and no-`.git` strategy foundations.
- Public repository creation remains blocked until all release gates pass.
- Clean public history approval checklist exists and remains `FAIL` until release-candidate evidence is accepted.
- Public remote CI approval checklist exists and remains `FAIL` until real public workflow evidence is accepted.
- Security policy contact approval checklist exists and remains `FAIL` until a monitored public reporting path and advisory workflow are accepted.
- Repository settings readiness packet foundation exists for branch protection, required checks, security advisories, default branch and merge policy, maintainer access, dependency alerts, secret scanning, release/package permissions, metadata, issue/discussion settings, and second-operator evidence.
- Repository launch readiness packet foundation emits review-only evidence without creating a public repository, initializing git, adding remotes, pushing commits, tagging releases, configuring security contacts, publishing packages, or announcing ScheduleOS.

These foundations do not approve repository creation, create an organization, create a repository, initialize git, add a remote, push a commit, configure repository settings, publish packages, tag a release, deploy, or announce ScheduleOS.

## Required Evidence Before PASS

Attach current evidence for every item:

- Final release gate proof showing functionality, storage, documentation, security, privacy, licensing, dependency, remote CI, clean history, security contact, repository settings, source review, generated artifact review, and second-operator release approval have all passed on the same release candidate.
- Clean public history `PASS` proof confirming the approved initial public commit source tree is free of private history, secrets, real customer data, private compatible leadership system material, generated runtime output, local databases, logs, backups, and unapproved artifacts.
- Privacy and secret scan proof covering source, docs, fixtures, examples, templates, issue templates, package metadata, generated artifacts, screenshots, exports, backups, logs, and CI artifacts.
- Licensing audit `PASS` proof covering final license check, dependency licenses, reused-material inventory, NOTICE review, Apache-2.0 consistency, and second-operator approval.
- Security audit `PASS` proof covering final security audit, production auth/session approval, rate-limit/abuse proof, provider managed-secret lifecycle, deployment review, remote CI, security contact, final source review, and second-operator approval.
- Privacy audit `PASS` proof covering generated artifacts, provider identifiers, local path/private URL review, private compatible leadership system boundary, calendar/task minimization, AI redaction, retention/export/deletion/revocation, and second-operator approval.
- Security policy contact `PASS` proof confirming monitored contact channel, advisory workflow, response SLA, escalation path, private-report sanitization, final `SECURITY.md`, and second-operator approval.
- Public remote CI `PASS` proof confirming a real remote workflow run and required checks passed on the approved release candidate.
- Repository settings proof confirming branch protection, required status checks, advisories/private vulnerability reporting, default branch and merge policy, maintainer access, dependency alerts, secret scanning, release/package permissions, metadata, issue/discussion settings, and second-operator approval are ready.
- Name-collision review proof confirming `scheduleos-ai/scheduleos` remains acceptable or an approved naming decision supersedes it.
- Trademark-risk review proof confirming the naming decision is accepted for public launch or legal review requirements are documented and satisfied.
- First-commit staging proof confirming included/excluded files match the approved manifest before initial public commit.
- Owner approval and second-operator repository-launch approval proof.

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
npm run repository:launch-readiness-packet -- --environment release-demo --target scheduleos-ai/scheduleos --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --history-plan clean-initial-history-demo --final-release-gate final-release-gate-pass-demo --clean-public-history clean-public-history-demo --privacy-secret-scan privacy-secret-scan-demo --license-audit-pass license-audit-pass-demo --security-audit-pass security-audit-pass-demo --security-policy-contact security-policy-contact-demo --remote-ci-pass remote-ci-pass-demo --name-collision-review name-collision-review-demo --trademark-review trademark-review-demo --first-commit-staging first-commit-staging-demo --repository-settings repository-settings-demo --second-operator second-operator-repository-launch-review-demo --json
```

This packet does not create a public repository, initialize git, add remotes, push commits, tag releases, configure security contacts, publish packages, or announce ScheduleOS.

## Current Remaining Risk

High. Public repository creation remains blocked until every final release gate passes on the same approved release candidate, clean public history is prepared, public remote CI passes, security contact and repository settings are configured, naming and trademark reviews are accepted, first-commit staging is approved, and owner plus second-operator release approval are recorded.

## Release Rule

Do not mark "Public repository created only after all gates pass" complete until this checklist changes from `FAIL` to `PASS` and the repository is created only from the approved release-candidate tree after all required evidence is accepted.
