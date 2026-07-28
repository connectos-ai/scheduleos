# Final Privacy Audit Evidence Contract

Final privacy audit approval is tracked in `docs/security/final-privacy-audit-approval-checklist.md`.

This document defines the local evidence contract used to review that gate. It does not mark the privacy audit `PASS`, approve publication, mutate release gates, rewrite generated artifacts, create remotes, publish packages, or announce ScheduleOS.

## Status

Current result: `FAIL`.

ScheduleOS now has a local final privacy audit evidence validator in `src/final-privacy-audit-evidence-contract.ts` with tests in `src/final-privacy-audit-evidence-contract.test.ts`. It validates evidence shape only.

## Contract Purpose

The final privacy audit proof must show that the release candidate has current review evidence across public release surfaces, generated artifacts, logs, screenshots, exports, backups, identifiers, private boundaries, calendar/task minimization, AI data boundaries, retention/export/deletion/revocation flows, clean public history, remote CI, security/licensing alignment, repository settings, and second-operator review.

The validator checks:

- Release surface review for source, docs, scripts, GitHub templates, package metadata, generated docs, and release-safety scan pass.
- Artifact sanitization for fixtures, examples, generated artifacts, logs, screenshots, exports, backups, local databases, source maps, and coverage outputs.
- Identifier and private-boundary proof covering provider identifiers, tenant/workspace/user IDs, local paths, machine names, private URLs, private compatible leadership system material, and hidden private leadership-only APIs.
- Calendar/task minimization covering titles, attendees, locations, descriptions, deadlines, source metadata, public event payloads, and provider tokens.
- AI and automation boundaries covering optional AI inputs/outputs, prompts, traces/logs, private owner data, and commercial compatible leadership system scoring logic.
- Rights and lifecycle review covering retention, export, deletion, provider revocation, destructive-operation approval, and rollback.
- Final release alignment covering clean public history, remote CI privacy proof, security audit pass, licensing audit pass, security policy contact, public repository settings, and second-operator review.

## Privacy Boundary

Evidence must not include secrets, raw provider tokens, customer data, calendar data, task data, private compatible leadership system material, private prompts, local databases, private machine paths, or private URLs.

Use privacy-safe demo identifiers such as:

```text
release_candidate_demo
privacy_audit_demo
fixture_sanitization_demo
provider_identifier_review_demo
calendar_task_minimization_demo
second_operator_privacy_review_demo
```

## Verification

Focused verification:

```bash
npm run build
node --test dist/final-privacy-audit-evidence-contract.test.js
```

Full verification:

```bash
npm run check
npm audit --omit=dev --audit-level=high
find . -maxdepth 2 -name .git -type d -print
```

## Release Boundary

This contract is a local foundation. ScheduleOS release status remains `FAIL` until final privacy audit evidence proves final release-candidate privacy scans, generated artifact review, log/screenshot/export/backup/database review, provider identifier review, private compatible leadership system boundary proof, calendar/task minimization, AI redaction boundary, lifecycle review, clean public history, remote CI privacy proof, security/licensing alignment, public repository settings, and second-operator review.
