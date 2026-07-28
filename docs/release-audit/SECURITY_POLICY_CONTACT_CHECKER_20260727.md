# Security Policy Contact Checker - 2026-07-27

## Status

Local/pre-release evidence only. Release remains `FAIL`.

## Scope

Added a targeted local checker for the pre-release `SECURITY.md` security-contact posture and wired it into `npm run check`.

## Evidence Added

- `scripts/check-security-policy-contact.mjs` validates that `SECURITY.md` still states the public vulnerability contact is not configured.
- The checker verifies `SECURITY.md` routes security reports away from public issues until a private path exists.
- The checker rejects email-shaped contact addresses in `SECURITY.md`.
- The checker rejects obvious placeholder, local, or private contact wording such as `TBD`, `TODO`, `example.com`, `localhost`, `.local`, or `workspace URL`.
- The checker verifies `docs/security/security-policy-contact-approval-checklist.md` still reports `FAIL`.
- The checker verifies `docs/public-release-checklist.md` still keeps `Security policy contact configured` unchecked.
- `package.json` now includes `security:policy-contact:check` in `npm run check`.

## Verification

Focused verification before this audit packet:

```text
npm run security:policy-contact:check
```

Observed result:

- Security policy contact check passed.

Full required verification after this evidence update:

- `npm run check` passed 740 tests, documentation link check across 97 Markdown files, release safety scan across 152 files, security policy contact check, and license check.
- `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities.
- `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Checklist integrity reported `malformed: []`, `checked: 181`, `unchecked: 18`.

## Boundary

This does not configure a public security contact. Still required before the security-contact gate can pass:

- Real monitored contact-channel proof.
- Responsible maintainer coverage.
- Disclosure workflow and response SLA approval.
- Repository advisory/private reporting settings proof.
- Escalation path proof.
- Private-report sanitization proof.
- Remote CI security workflow proof.
- Final `SECURITY.md` update with approved public wording.
- Second-operator approval.
