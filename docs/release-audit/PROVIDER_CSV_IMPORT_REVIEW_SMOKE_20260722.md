# Provider CSV Import Review Smoke - 2026-07-22

## Status

Local browser smoke passed in system Chrome. This is evidence for the local provider CSV import review foundation, not final production provider import approval.

## Environment

- App URL: `http://127.0.0.1:8798/app`
- Browser: system Google Chrome through Playwright-compatible automation
- Viewport: `1280x900`
- Scope: `tenant_demo`, `workspace_demo`, `user_jordan`

## Covered Flow

1. Open standalone app shell.
2. Load provider CSV templates.
3. Select `Todoist CSV`.
4. Load template sample rows.
5. Preview CSV rows.
6. Verify provider policy card renders source, risk, suggested local throttle policy, and notes.
7. Verify import button stays disabled before explicit review.
8. Check `I reviewed the preview rows and provider policy`.
9. Verify import button enables.
10. Import previewed provider CSV rows.
11. Verify imported tasks render in the task list.
12. Verify review checkbox resets after import.

## Observed Result

- Console errors: none.
- Template options included `Generic CSV`, `Todoist CSV`, `Linear Issues CSV`, and `Asana Tasks CSV`.
- Policy card rendered:
  - Source: `TODOIST_CSV`
  - Risk: `MEDIUM`
  - Suggested: `500 rows / 15 min`
  - Note: `Provider-template CSV import source.`
- Preview rendered two rows with zero errors.
- Import button was disabled before review and enabled after review acknowledgement.
- Import completed with status `CSV imported. Use Replan to schedule imported tasks.`
- Review checkbox was cleared after import.

## Release Boundary

This smoke does not close the production-grade provider CSV import workflow gate. Remaining work still includes larger real-provider fixture sets, provider-specific quota enforcement, hosted alerting, abuse analytics, browser matrix coverage, upload/download production polish, and final product-owner approval.
