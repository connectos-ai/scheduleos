# Privacy Audit

## Status

Current result: `FAIL`.

Reason: ScheduleOS has strong local privacy foundations and release-safety scanning, but the final public release candidate has not yet completed privacy review, remote CI proof, clean public history review, generated-artifact review, screenshot/log/export review, or second-operator approval.

No public repository, tag, package publication, hosted release, or announcement is allowed until this audit changes to `PASS`.

## Current Privacy Posture

ScheduleOS is designed as a standalone, self-hostable scheduling system. It must not require compatible leadership system, OwnerOps, ConnectOS, Slack, Gmail, Google Calendar, Microsoft 365, paid AI, hosted services, external task managers, or commercial subscriptions.

Current local foundations support privacy by:

- Using fictional demo identifiers and examples in public docs, fixtures, templates, issue templates, and readiness packets.
- Redacting private task and calendar titles from public event evidence where supported.
- Keeping provider tokens out of scheduling records and integration state foundations.
- Storing scoped tenant, workspace, user, and source provenance so data boundaries can be reviewed.
- Rejecting cross-scope reads and writes in local, SQLite, and PostgreSQL repository tests.
- Scanning release text for private-looking fixture, generated artifact, copied-source, and release-safety risks through `npm run check`.

These foundations are not a final privacy approval.

## Privacy Surfaces To Review

Before publication, reviewers must inspect every public release surface:

- Source code, migrations, scripts, configuration, and package metadata.
- README, docs, runbooks, architecture notes, audit records, issue templates, pull request template, GitHub workflow files, and release checklist.
- Fixtures, examples, templates, sample requests, sample responses, CLI packet examples, and generated artifacts.
- Logs, screenshots, exports, backups, local databases, source maps, coverage outputs, and bundled assets if any are added.
- Calendar imports and exports, ICS fixtures, CSV fixtures, provider sync metadata, public events, webhook delivery records, audit events, auth/session records, reset-token records, and retention cleanup evidence.
- Repository history once a clean public history is prepared.

## Required Before PASS

- `npm run check` passes on the final release candidate.
- `npm audit --omit=dev --audit-level=high` reports no high-severity production vulnerabilities.
- `npm run license:check` passes on the final release candidate.
- Release safety scan passes with the final set of source, docs, GitHub templates, examples, fixtures, and generated artifacts.
- Clean public history is prepared and reviewed for private paths, machine names, raw hostnames, raw provider identifiers, tokens, credentials, customer data, calendar data, task data, and private compatible leadership system material.
- Public issue templates and `SECURITY.md` route private data and security reports away from public issues.
- Screenshots, logs, exports, backups, databases, and generated artifacts are either absent from release or sanitized.
- Calendar title, attendee, location, description, task title, task description, source metadata, provider identifier, tenant ID, workspace ID, and user ID examples are fictional or minimized.
- AI input/output boundaries are reviewed so public examples do not contain private prompts, owner data, customer data, or private compatible leadership system logic.
- Retention, export, deletion, provider revocation, and destructive-operation approval flows are reviewed for privacy-safe evidence and rollback handling.
- Remote CI proof exists for the final release gates.
- A second operator reviews and approves the final privacy audit evidence.

## Automated Local Evidence

Run these commands before changing this audit to `PASS`:

```bash
npm run check
npm audit --omit=dev --audit-level=high
find . -maxdepth 2 -name .git -type d -print
```

The no-`.git` check must return no output until the intentional clean public repository history is prepared.

## Review-Only Packet

`privacy:final-audit-readiness-packet` emits review-only evidence requirements for final release safety scan, fixture/sample-data sanitization, generated artifact sanitization, logs/screenshots/exports/backups review, provider identifier and tenant/workspace/user ID review, local path/machine-name/private-URL review, private compatible leadership system prompt/customer-data boundary, calendar minimization, task minimization, AI data redaction boundary, retention/export/deletion/provider-revocation proof, and second-operator review.

The packet does not mark this audit `PASS`, approve publication, create remotes, push, tag, publish packages, configure repository settings, or announce ScheduleOS.

## Current Remaining Risk

High. ScheduleOS is a strong local privacy foundation, but public release privacy remains unproven until the final release candidate, generated artifacts, clean public history, remote CI, issue intake, security policy contact, and second-operator evidence are reviewed together.

## Release Rule

Do not publish ScheduleOS until this audit is changed from `FAIL` to `PASS` with current evidence from the final release candidate.
