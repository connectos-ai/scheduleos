# Session Transfer - Auth Reset Scope Regression - 2026-07-27

## Current State

ScheduleOS remains a standalone local project with no `.git` directory. Release status remains `FAIL`; do not publish, push, tag, create remotes, initialize git, deploy publicly, or mark release complete.

## Completed This Session

- Added local API regression coverage for password-reset token scope.
- Verified a reset token requested for `tenant_demo` / `workspace_demo` / `user_jordan` is rejected for `workspace_other` and `user_other`.
- Verified those rejected attempts do not consume the token, and the correct same-scope reset still works once.
- Added release-audit evidence at `docs/release-audit/AUTH_RESET_TOKEN_SCOPE_REGRESSION_20260727.md`.
- Updated auth model, production auth checklist, public release checklist, and current-state addendum.

## Verification

- `npm run build && node --test dist/api.test.js` passed 181 API tests.
- `npm run check` passed 740 tests, documentation link check across 95 Markdown files, release safety scan across 149 files, and license check.
- `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities.
- `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Checklist integrity reported `malformed: []`, `checked: 180`, `unchecked: 18`.

## Release Posture

Release remains `FAIL`; production auth remains unchecked.

## Best Next Step

Continue strengthening the production auth gate without marking it complete. Good candidates: cookie/CSRF browser-path negatives, password-reset recovery runbook abuse visibility, or auth migration/rollback review-only packet coverage.
