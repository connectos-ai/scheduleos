# Data Handling

## Status

Draft privacy and data-handling policy.

## Principles

- Store the least calendar content needed.
- Prefer busy/free boundaries over descriptions.
- Make AI optional.
- Do not send full calendar content to AI providers by default.
- Encrypt sensitive stored fields where appropriate.
- Keep tenant/workspace/user data isolated.
- Support export, deletion, and provider revocation.
- Do not commit real data in fixtures.

## Data Categories

| Category | Examples | Default handling |
| --- | --- | --- |
| Identity | user id, email, display name | Store only required fields; tenant scoped. |
| Task data | title, description, deadlines, priority | Store as user data; descriptions treated as untrusted. |
| Imported task-source metadata | provider template id, source system, external id, source URL, project id, tags | Store only needed mapping/provenance fields; treat imported text as untrusted task data. |
| Calendar availability | start/end busy ranges | Preferred over full event details. |
| Calendar event detail | title, attendees, location, description | Minimize; redact private events. |
| Provider connection | provider id, scopes, status | Store connection reference and health. |
| Tokens | OAuth refresh/access tokens | Encrypt or delegate to token vault; never log. |
| Schedule plan | blocks, scores, warnings | Store for user review and replanning. |
| Audit events | action, actor, timestamp | Redact private content and secrets. |
| AI data | prompts, structured output | Optional, minimized, redacted. |

## Calendar Minimization

ScheduleOS usually needs:

- Busy/free status.
- Start and end.
- Timezone.
- Calendar id.
- Privacy level.
- Lock/movable status.
- Buffer/travel time.

ScheduleOS usually does not need:

- Full event description.
- Attendees.
- Meeting links.
- Private title.
- Notes.
- Attachments.

## Retention

Retention duration foundation is defined in [Retention Policy](retention-policy.md). Retention controls should support:

- User data export.
- Workspace deletion.
- Provider connection revocation.
- Calendar sync state reset.
- Audit log retention window.
- AI prompt/output deletion where stored.

Current default durations include 7 days for workspace exports and plaintext backups, 30 days for encrypted backups and idempotency records, 14 days for import throttle windows, 90 days for old sync state and integration metadata, 180 days for schedule plan history, and 365 days for audit events and deleted-workspace operator notes. Active user data remains until explicit deletion.

## Storage Direction

Current local JSON persistence is a development proof, not production storage. ADR-002 selects repository ports with SQLite for local/small self-host deployments and PostgreSQL for production multi-user deployments.

Production storage must enforce tenant/workspace/user predicates at repository boundaries, not only at HTTP routes. Migration files, seed data, backups, exports, and generated database artifacts must be scanned for private data before public release.

Current storage-boundary tenant isolation evidence is tracked in [Tenant Isolation Verification](tenant-isolation-verification.md).

## Logging

Never log:

- OAuth tokens.
- API keys.
- Cookies.
- Session secrets.
- Full private calendar descriptions.
- Full imported email/message bodies by default.

Logs may include:

- Stable internal IDs.
- Event types.
- Timing.
- Constraint codes.
- Redacted source references.
- Error codes.

## Fixtures And Examples

Allowed fictional names:

- Jordan Lee.
- Casey Morgan.
- Riverstone Creative.
- Northstar Services.
- Harbor Community.

Forbidden in public fixtures:

- Real client names.
- Real churches.
- Real businesses.
- Real staff.
- Real emails.
- Real Slack IDs.
- Real calendar IDs.
- Local machine paths.
- Private repository URLs.

## Current Gate

```text
Privacy implementation gate: FAIL
Reason: policy drafted and SQLite export/deletion/retention-duration foundations exist, but destructive retention controls, public API workflows, provider revocation, and production enforcement are incomplete.
```

## Final Privacy Audit Readiness Packet

`privacy:final-audit-readiness-packet` emits review-only final privacy audit evidence requirements for release safety scans, fixture/sample sanitization, generated artifact review, logs/screenshots/exports/backups review, provider identifier review, local path/private URL review, private compatible leadership system/customer-data boundary proof, calendar/task minimization proof, AI redaction boundary, retention/export/deletion/provider-revocation proof, and second-operator review.

It does not mark privacy audit `PASS`, approve publication, mutate release gates, rewrite generated artifacts, create remotes, publish packages, or announce ScheduleOS.
