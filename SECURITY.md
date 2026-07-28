# Security Policy

## Current Status

ScheduleOS is in local pre-release development. The public release security gate is currently `FAIL` until the audits in `docs/security/public-release-security-audit.md`, `docs/security/public-release-security-audit-addendum-20260721.md`, `docs/security/privacy-audit.md`, and `docs/security/licensing-audit.md` pass.

Do not treat this policy as a configured public vulnerability contact yet. The release checklist item "Security policy contact configured" remains incomplete until a real monitored channel, repository security settings, remote CI security workflow proof, and second-operator review exist.

## Supported Versions

No public version is supported yet.

| Version | Supported |
| --- | --- |
| pre-release local workspace | No public support commitment |

After the first public release, update this table with the supported release line and the expected security update policy.

## Reporting Security Issues

Until a public repository security contact is configured, do not disclose suspected vulnerabilities publicly and do not open public issues for security reports. Record findings through the private maintainer process for this workspace and update `docs/security/public-release-security-audit.md` with sanitized evidence.

Before ScheduleOS is made public, maintainers must choose and verify one monitored reporting path:

- GitHub private vulnerability reporting for the public repository.
- A dedicated security contact channel controlled by the maintainers.
- A documented advisory intake process with a responsible maintainer and escalation path.

The chosen reporting path must be monitored, tested, and documented here before public release. Do not add fictional email addresses, personal contact details, private workspace URLs, or unmonitored placeholder channels.

## Expected Response

These targets are release-readiness expectations, not an active public SLA:

- Acknowledge valid private security reports within 5 business days after the monitored channel is configured.
- Triage severity, affected versions, exploitability, and workaround options before public disclosure.
- Keep reporters updated when investigation or remediation requires more time.
- Coordinate disclosure through the configured advisory workflow.
- Redact secrets, tenant IDs, calendar data, task titles, provider identifiers, and private environment details from any public advisory.

## Security Expectations

- Never commit secrets, tokens, cookies, private keys, OAuth credentials, database passwords, local `.env` files, private webhook URLs, or provider callback URLs.
- Never commit real customer, church, client, staff, calendar, Slack, email, personal, or workspace data.
- Use fictional demo IDs and sample content only.
- Treat imported calendar, task, message, webhook, CSV, ICS, and AI input as untrusted.
- Enforce tenant, workspace, user, membership, and role checks server-side.
- Keep provider tokens isolated from scheduling data and encrypted before production use.
- Redact secrets and sensitive content from logs, audit records, examples, errors, screenshots, exports, and release evidence.
- Require dry-run evidence, exact destructive confirmation, backup/restore smoke proof, legal/support review, two-operator review, and rollback proof before destructive production operations.

## Required Release Checks

Before any public release:

```bash
npm run check
npm audit --omit=dev --audit-level=high
find . -maxdepth 2 -name .git -type d -print
```

Run the documented release audit process covering dependency scanning, secret scanning, personal-data scanning, git-history review, license review, generated files, sample data, documentation, remote CI, and public repository security settings.

The security audit may only change from `FAIL` to `PASS` after the final security audit packet, privacy audit, licensing audit, dependency audit, remote CI proof, security contact configuration, and second-operator review all pass.
