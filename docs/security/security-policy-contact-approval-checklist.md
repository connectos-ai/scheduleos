# Security Policy Contact Approval Checklist

## Status

Current result: `FAIL`.

ScheduleOS has a pre-release `SECURITY.md` policy draft and a review-only security policy contact readiness packet. The public security policy contact is not configured until the evidence below is attached, reviewed, and accepted.

No public release, repository creation, tag, package publication, hosted deployment, security audit `PASS`, or release announcement may rely on the security policy contact until this checklist changes to `PASS`.

## Verified Local Foundations

Current local evidence covers:

- Root `SECURITY.md` documents pre-release unsupported status and states the public vulnerability contact is not configured yet.
- Root `SECURITY.md` routes security reports away from public issues until a monitored path exists.
- Root `SECURITY.md` lists allowed future contact patterns without committing personal email addresses, private workspace URLs, or unmonitored placeholders.
- Public issue-template intake disables blank issues and routes security/private-data reports away from public issues.
- Local security policy contact checker verifies `SECURITY.md` still says the public vulnerability contact is not configured, routes security reports away from public issues, forbids fictional/personal/private/unmonitored contact placeholders, contains no email-shaped contact address, and leaves the public release checklist item unchecked.
- Security policy contact readiness packet foundation requires explicit contact channel, responsible party, disclosure workflow, advisory settings, response SLA, escalation path, private report sanitization, remote CI security workflow, and second-operator evidence labels.
- Final security audit approval checklist requires security policy contact proof before security audit `PASS`.

These foundations do not configure a public security contact, mutate `SECURITY.md`, configure repository security advisories, configure private vulnerability reporting, edit repository settings, mark security audit `PASS`, create a public repository, publish packages, or announce ScheduleOS.

## Required Evidence Before PASS

Attach current evidence for every item:

- Monitored contact-channel proof confirming the chosen reporting path is controlled by maintainers, monitored, tested, documented, and safe for public disclosure.
- Responsible-party proof confirming primary and backup maintainers or responsible reviewers are assigned outside public fixture data.
- Vulnerability disclosure workflow proof covering intake, triage, severity review, embargo handling, coordinated disclosure, remediation tracking, and reporter updates.
- Repository advisory settings proof confirming private vulnerability reporting or equivalent advisory intake is configured on the intended public repository after all release gates allow repository setup.
- Response SLA proof confirming acknowledgement, triage, update, and disclosure expectations are realistic and documented.
- Escalation-path proof confirming urgent reports can reach responsible maintainers without publishing private contact details or private workspace URLs.
- Private report sanitization proof confirming reporter data, exploit details, private URLs, tokens, logs, customer data, and calendar/task data stay out of public issues, fixtures, docs, release notes, screenshots, and CI artifacts.
- Remote CI security workflow proof confirming security-relevant checks run on the release candidate and logs/artifacts are sanitized.
- `SECURITY.md` final review proof confirming public wording names the approved channel without fictional email addresses, private URLs, or unmonitored placeholders.
- Public issue-template final review proof confirming public issue intake still directs private/security data away from public issues.
- Security, privacy, licensing, dependency, clean-history, remote-CI, repository-settings, and final release-gate evidence remain aligned with the same release candidate.
- Second operator approves the security policy contact evidence packet.

## Required Commands

Run before changing checklist `PASS`:

```bash
npm run check
npm audit --omit=dev --audit-level=high
npm run release:safety
find . -maxdepth 2 -name .git -type d -print
```

The no-`.git` check must return no output until intentional clean public repository history is prepared.

## Review-Only Packet

Use this command to prepare evidence labels only:

```bash
npm run security:policy-contact-readiness-packet -- --environment release-demo --contact-channel security-contact-form-demo --responsible-party maintainer-security-reviewer-demo --disclosure-workflow vulnerability-disclosure-workflow-demo --advisory-settings repository-advisory-settings-demo --response-sla security-response-sla-demo --escalation-path security-escalation-path-demo --private-report-sanitization private-report-sanitization-demo --remote-ci-security-workflow remote-ci-security-workflow-demo --second-operator second-operator-security-contact-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --json
```

This packet does not configure security contacts, edit repository settings, create a public repository, mutate `SECURITY.md`, mark security audit `PASS`, publish packages, or announce ScheduleOS.

## Current Remaining Risk

High. Security policy contact configuration remains unproven until a real monitored reporting path, responsible maintainer coverage, disclosure workflow, repository advisory settings, response SLA, escalation path, private report sanitization process, remote CI security proof, final `SECURITY.md` update, and second-operator approval are complete.

## Release Rule

Do not mark "Security policy contact configured" complete until this checklist changes from `FAIL` to `PASS` with current release-candidate and public-repository evidence.
