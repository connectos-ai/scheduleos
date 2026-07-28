# Provider Lifecycle Runbook Contract Audit

## Date

2026-07-27

## Scope

Added local/review-only evidence for the provider lifecycle gate by defining the minimum provider-specific runbook contract and wiring a checker into the main verification path.

## Files Changed

- `docs/operations/provider-lifecycle-runbook-contract.md`
- `scripts/check-provider-lifecycle-runbook-contract.mjs`
- `package.json`
- `src/cli.ts`
- `src/cli.test.ts`
- `docs/public-release-checklist.md`
- `docs/security/production-provider-lifecycle-approval-checklist.md`
- `docs/release-audit/PROVIDER_LIFECYCLE_RUNBOOK_CONTRACT_20260727.md`

## Evidence Added

- Provider lifecycle readiness packets now emit `requiredProviderRunbookSections`.
- CLI tests assert the required sections are present and that review steps require section verification.
- `npm run providers:lifecycle-runbook-contract:check` verifies the contract document keeps all required headings and avoids unsafe sample evidence such as email-shaped strings, raw token assignments, raw webhook secret assignments, and raw URLs.
- A demo calendar provider lifecycle runbook template exists at `docs/operations/providers/demo-calendar-provider-runbook.md` and is validated by the checker as local/review-only provider-runbook evidence.
- `npm run check` now runs the provider lifecycle runbook contract checker.

## Verification

- `npm run check` passed, including documentation link check across 105 Markdown files, release safety scan across 161 files, provider lifecycle runbook contract check across 16 contract headings and 1 provider runbook, and license check across 162 release text files.
- `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities.
- `find . -maxdepth 2 -name .git -type d -print` returned no output.
- Checklist integrity returned `malformed: []`, `checked: 185`, `unchecked: 18`.

## Release Boundary

This is not production provider lifecycle approval. It does not implement provider-specific adapters, configure hosted alerts, store production secrets, rotate credentials, revoke provider access, write provider calendar data, prove remote CI, or change final release status.

Release remains `FAIL`.
