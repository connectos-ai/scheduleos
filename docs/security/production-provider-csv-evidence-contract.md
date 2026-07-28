# Production Provider CSV Evidence Contract

Production provider CSV import approval is tracked in `docs/security/production-provider-csv-approval-checklist.md`. This document defines the local evidence contract used to review that gate.

This document does not approve production imports, import rows, mutate provider quota policy, configure hosted alerts, create remotes, publish packages, or change release status.

## Status

Current result: `FAIL`.

ScheduleOS now has a local production provider CSV evidence validator in `src/production-provider-csv-evidence-contract.ts` with tests in `src/production-provider-csv-evidence-contract.test.ts`. It validates evidence shape only.

## Contract Purpose

Production provider CSV imports must prove that provider-shaped task exports can be downloaded, uploaded, previewed, confirmed, imported, retried, observed, and rolled back without leaking private task data or surprising the operator.

The validator checks:

- Provider fixture breadth across Todoist, Linear, Asana, ClickUp, Trello, Microsoft Planner, and GitHub Issues.
- Sanitized fixture handling and documented fictional fallback policy where real exports cannot be stored.
- Large, duplicate-row, and malformed-row fixture coverage.
- Download/upload workflow proof including template download, upload, dry-run preview, validation errors, confirmation, cancellation, import success, import failure, and retry-safe reimport.
- Provider-specific confirmation UX evidence.
- Provider quota governance and hosted abuse analytics evidence.
- Desktop, mobile, keyboard, screen-reader, and error-summary browser proof.
- Formula-injection regression and field-mapping privacy proof.
- Content-minimized logs and evidence.
- Remote CI, rollback, import disablement, imported-row cleanup, final audits, operator approval, and second-operator review.

## Required Providers

Production provider CSV evidence must cover:

- `TODOIST`
- `LINEAR`
- `ASANA`
- `CLICKUP`
- `TRELLO`
- `MICROSOFT_PLANNER`
- `GITHUB_ISSUES`

## Required Workflow Steps

Production provider CSV evidence must cover:

- `TEMPLATE_DOWNLOAD`
- `USER_UPLOAD`
- `DRY_RUN_PREVIEW`
- `VALIDATION_ERRORS`
- `CONFIRMATION_ACKNOWLEDGEMENT`
- `CANCEL_NO_MUTATION`
- `IMPORT_SUCCESS`
- `IMPORT_FAILURE`
- `RETRY_SAFE_REIMPORT`

## Required Abuse Signals

Hosted abuse analytics evidence must include:

- `DENIED_ROW_SPIKE`
- `REPEATED_IMPORT_ATTEMPTS`
- `OVERSIZED_FILE`
- `FORMULA_LIKE_ROWS`
- `UNKNOWN_PROVIDER_COLUMNS`
- `DUPLICATE_ROW_SPIKE`

## Privacy Boundary

Evidence must not include private task titles, raw CSV rows, uploaded filenames, local paths, provider account identifiers, raw rejected-row payloads, API keys, bearer tokens, session cookies, or private provider data.

Use privacy-safe demo identifiers such as:

```text
tenant_demo
workspace_demo
user_jordan
provider_csv_fixture_suite_demo
provider_csv_workflow_demo
provider_csv_browser_matrix_demo
provider_csv_abuse_analytics_demo
second_operator_provider_csv_review_demo
```

## Verification

Focused verification:

```bash
npm run build
node --test dist/production-provider-csv-evidence-contract.test.js
```

Full verification:

```bash
npm run check
npm audit --omit=dev --audit-level=high
find . -maxdepth 2 -name .git -type d -print
```

## Release Boundary

This contract is a local foundation. ScheduleOS release status remains `FAIL` until production-grade provider CSV import workflow proof, real-provider fixture breadth, production download/upload polish, provider-specific confirmation UX, quota governance, hosted abuse analytics, browser workflow, remote CI, rollback, final audits, and second-operator review are complete.
