# Production Provider CSV Import Approval Checklist

## Status

Current result: `FAIL`.

ScheduleOS has local provider CSV import foundations and a review-only provider CSV production readiness packet. The production-grade provider CSV import workflow is not approved for public release until the evidence below is attached, reviewed, and accepted.

No public repository, hosted deployment, tag, package publication, or release announcement may rely on production provider CSV imports until this checklist changes to `PASS`.

## Verified Local Foundations

Current local evidence covers:

- Generic CSV task import local API foundation with row-level errors.
- JSON/CSV dry-run preview foundation.
- Local CSV task import preview and confirmation UI foundation.
- Provider-specific CSV template API/import workflow foundation.
- Local provider CSV sample download endpoint and app button foundation.
- Local provider CSV template selector and sample-loading UI foundation.
- Local provider CSV multi-row sample fixture provider-aware import confirmation foundation.
- Fictional built-in sample validation for Todoist, Linear, Asana, ClickUp, Trello, Microsoft Planner, and GitHub Issues samples.
- Local provider CSV in-page review gate showing preview rows, provider policy, risk, suggested local throttle policy, and explicit review before import.
- Local provider CSV confirmation summary renders provider/source mapping, row count, error count, risk, suggested policy, and remaining production evidence caveats before explicit import review.
- Local fictional export-shaped provider fixture regression covers Todoist, Linear, Asana, ClickUp, Trello, Microsoft Planner, and GitHub Issues dry-run previews, including quoted commas, unknown extra columns, alternate documented aliases, tag delimiter variants, mixed priority labels, and no dry-run task mutation. Evidence: `docs/release-audit/PROVIDER_CSV_EXPORT_FIXTURE_REGRESSION_20260727.md`.
- Local provider-specific policy abuse-summary API foundation.
- Local/self-host import-abuse alert threshold foundation returning `REVIEW_REQUIRED`.
- Local/self-host provider import policy catalog API foundation exposing copyable `importThrottle.sourcePolicies` output.
- Browser smoke evidence in `docs/release-audit/PROVIDER_CSV_IMPORT_REVIEW_SMOKE_20260722.md`.
- `provider-csv:production-readiness-packet` review-only evidence labels for production provider CSV release review.

These foundations do not approve production imports, real-provider fixture breadth, provider-specific confirmation polish, provider quota governance, hosted abuse analytics, browser workflow approval, remote CI, rollback readiness, or second-operator release approval.

## Required Evidence Before PASS

Attach current evidence for every item:

- Real-provider export fixture suite covers every provider in release scope using sanitized exports or documented fictional equivalents where real exports cannot be stored.
- Download/upload workflow proof covers template download, user upload, preview, validation errors, confirmation, cancellation, import success, import failure, and retry-safe behavior.
- Provider-specific confirmation UX proof covers source/provider name, field mapping, row counts, skipped rows, risky rows, throttle policy, formula-injection warning, and explicit review before mutation.
- Production provider quota governance proof covers per-provider row limits, import frequency, provider source limits, operator visibility, alert thresholds, and rollback behavior.
- Browser workflow proof covers desktop and mobile import paths, keyboard navigation, screen-reader labels, error summaries, and no hidden destructive import actions.
- Hosted abuse analytics proof covers denied rows, repeated import attempts, suspicious source/provider patterns, oversized files, repeated formula-like rows, and content-minimized operator views.
- Large fixture suite proof covers realistic file sizes, long task titles, unknown columns, empty rows, malformed dates, mixed encodings, duplicate rows, and provider-specific edge cases.
- Formula-injection regression proof confirms spreadsheet-like cell prefixes are treated as inert data and are not emitted as executable spreadsheet formulas.
- Field-mapping privacy proof confirms private task titles, provider identifiers, local paths, uploaded filenames, raw CSV rows, and rejected-row payloads are not leaked into public evidence or logs.
- Remote CI proof exists for provider CSV tests, production readiness packet tests, docs links, release safety, and license checks.
- Rollback plan reviewed for import disabling, imported-row cleanup, throttles, abuse alerts, provider policy mistakes, and operator communication.
- Security, privacy, and licensing audits remain `PASS` after attaching provider CSV evidence.
- Second operator approves the final production provider CSV import evidence packet.

## Required Commands

Run before changing this checklist to `PASS`:

```bash
npm run check
npm audit --omit=dev --audit-level=high
find . -maxdepth 2 -name .git -type d -print
```

The no-`.git` check must return no output until intentional clean public repository history is prepared.

## Review-Only Packet

Use this command to prepare evidence labels only:

```bash
npm run provider-csv:production-readiness-packet -- --environment production-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --fixture-suite real-provider-export-demo --download-upload-workflow provider-csv-download-upload-demo --confirmation-ux provider-csv-confirmation-ux-demo --provider-policy quota-abuse-policy-demo --browser-workflow provider-csv-browser-workflow-demo --abuse-analytics provider-csv-abuse-analytics-demo --large-fixture-suite large-provider-csv-fixture-demo --formula-injection-regression formula-injection-regression-demo --field-mapping-privacy field-mapping-privacy-demo --remote-ci remote-ci-provider-csv-demo --rollback-plan provider-csv-rollback-plan-demo --second-operator second-operator-provider-csv-review-demo --json
```

This packet does not approve production imports, import rows, mutate provider quota policy, export analytics, configure alerts, create a public remote, mark audits `PASS`, publish packages, or announce ScheduleOS.

## Current Remaining Risk

High. The local provider CSV foundation is useful, but production-grade provider CSV import remains unproven until real-provider fixture breadth, production download/upload polish, provider-specific confirmation UX, quota governance, abuse analytics, browser workflow, remote CI, rollback, final audits, and second-operator review are complete.

## Release Rule

Do not mark "Production-grade provider CSV import workflow" complete until this checklist changes from `FAIL` to `PASS` with current release-candidate evidence.

## Evidence Contract Foundation

Local production provider CSV evidence contract foundation exists at `docs/security/production-provider-csv-evidence-contract.md`. It validates provider fixture breadth, download/upload workflow safety, provider-specific confirmation UX, quota governance, hosted abuse analytics, browser proof, privacy proof, rollback, final audits, operator approval, and second-operator review without approving production imports.
