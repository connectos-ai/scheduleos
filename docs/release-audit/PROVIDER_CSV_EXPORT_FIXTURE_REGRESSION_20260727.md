# Provider CSV Export Fixture Regression - 2026-07-27

## Status

Local evidence only. Release remains `FAIL`.

## Scope

Added a fixture-backed regression test for provider export-shaped CSV dry-run previews across all built-in provider templates:

- Todoist
- Linear
- Asana
- ClickUp
- Trello
- Microsoft Planner
- GitHub Issues

The fixtures are fictional and privacy-safe. They use demo identifiers and `.example` URLs only.

## Evidence Added

`src/provider-csv-fixtures.test.ts` verifies that provider export-shaped CSV files:

- Dry-run successfully through `/api/task-sources/csv/import`.
- Preserve provider-specific `sourceSystem` mapping.
- Map title, priority, estimated duration, project/list/bucket/repository, tags, and source URL fields.
- Tolerate quoted commas, unknown extra columns, empty trailing rows, alternate documented aliases, and mixed provider priority names.
- Do not persist tasks when `dryRun: true`.

## Verification

`npm run check` passed after adding the regression.

Observed result:

- 735 tests passed.
- GitHub Actions CI workflow validation passed.
- Documentation link check passed 87 Markdown files.
- Release safety scan passed 140 files.
- License check passed 18 package-lock licenses, 141 release text files, and 8 fixture/template/example-like files.

## Boundary

This does not approve production provider CSV import.

Still required before the provider CSV gate can pass:

- Real-provider export fixture review beyond fictional local fixtures.
- Production download/upload workflow proof.
- Provider quota governance proof.
- Hosted abuse analytics proof.
- Production browser workflow proof.
- Remote CI proof.
- Rollback proof.
- Final security, privacy, licensing, and dependency approvals.
- Second-operator approval.
