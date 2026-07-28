# Final Security Audit Evidence Contract

Final security audit approval is tracked in `docs/security/final-security-audit-approval-checklist.md`.

This document defines the local evidence contract used to review that gate. It does not mark the security audit `PASS`, approve production deployment, configure security contacts, mutate release gates, create remotes, publish packages, or announce ScheduleOS.

## Status

Current result: `FAIL`.

ScheduleOS now has a local final security audit evidence validator in `src/final-security-audit-evidence-contract.ts` with tests in `src/final-security-audit-evidence-contract.test.ts`. It validates evidence shape only.

## Contract Purpose

The final security audit proof must show that the release candidate has current dependency, scan, auth, abuse, provider-secret, deployment, remote CI, repository, disclosure, and second-operator evidence before the security audit can change from `FAIL` to `PASS`.

The validator checks:

- Dependency and supply-chain proof including dependency audit final pass, lockfile review, license alignment, and registry-secret absence.
- Release scans including release safety, secret scan, personal/private data scan, fixture/example scan, private compatible leadership system material absence, and private machine path absence.
- Auth and access proof including production auth approval, role/membership matrix, reset-token lifecycle, session cookie/CSRF transport, and owner/admin flows.
- Abuse and provider-security proof including production rate-limit approval, distributed throttle proof, provider quota review, managed-secret lifecycle approval, provider rotation/revocation review, and hosted alerts.
- Deployment and operations proof including TLS/proxy headers, security headers, durable storage, backup/rollback, log redaction, and incident response.
- Remote CI and repository proof including remote CI, PostgreSQL proof acceptance, dependency audit CI proof, log sanitization, artifact retention, branch protection, and repository settings.
- Disclosure and final review proof including configured security contact, advisory workflow, response SLA, escalation path, private-report sanitization, final source review, privacy audit pass, licensing audit pass, and second-operator review.

## Privacy Boundary

Evidence must not include secrets, raw provider tokens, registry tokens, customer data, calendar data, task data, private compatible leadership system material, private prompts, or private machine paths.

Use privacy-safe demo identifiers such as:

```text
release_candidate_demo
security_audit_demo
secret_scan_demo
production_auth_demo
remote_ci_security_demo
second_operator_security_review_demo
```

## Verification

Focused verification:

```bash
npm run build
node --test dist/final-security-audit-evidence-contract.test.js
```

Full verification:

```bash
npm run check
npm audit --omit=dev --audit-level=high
find . -maxdepth 2 -name .git -type d -print
```

## Release Boundary

This contract is a local foundation. ScheduleOS release status remains `FAIL` until final security audit evidence proves dependency audit final pass, all scans, production auth, production abuse controls, provider managed-secret lifecycle, deployment security, remote CI, repository safety, security contact workflow, final source review, final privacy/licensing alignment, and second-operator review.
