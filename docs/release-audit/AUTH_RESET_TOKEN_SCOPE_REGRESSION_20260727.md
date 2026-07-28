# Auth Reset Token Scope Regression - 2026-07-27

## Status

Local/self-host evidence only. Release remains `FAIL`.

## Scope

Added regression coverage for password-reset token consumption scope. A token requested for one tenant/workspace/user must not be spendable by a different workspace or user, even when the raw local-development reset token is known.

## Evidence Added

- `src/api.test.ts`: `local API password reset token cannot be used across user or workspace scope`.
- Wrong-workspace reset confirmation returns `401 INVALID_RESET_TOKEN`.
- Wrong-user reset confirmation returns `401 INVALID_RESET_TOKEN`.
- Invalid cross-scope attempts do not consume the original token.
- Correct same-scope reset still completes once.
- Login with the new same-scope credential succeeds after reset.

## Verification

Focused verification before this audit packet:

```text
npm run build && node --test dist/api.test.js
```

Observed result:

- 181 API tests passed.

Full required verification after this evidence update:

- `npm run check` passed 740 tests, documentation link check across 95 Markdown files, release safety scan across 149 files, and license check.
- `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities.
- `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Checklist integrity reported `malformed: []`, `checked: 180`, `unchecked: 18`.

## Boundary

This does not approve production auth. Still required before the auth gate can pass:

- Production identity-provider or local credential strategy approval.
- Production reset-token delivery and recovery UX.
- Distributed abuse controls and operator/helpdesk workflow.
- Remote CI auth proof.
- Browser verification.
- Final security, privacy, licensing, and second-operator approval.
