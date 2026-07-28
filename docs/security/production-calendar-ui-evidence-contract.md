# Production Calendar UI Evidence Contract

Production calendar UI approval is tracked in `docs/security/production-calendar-ui-approval-checklist.md`. This document defines the local evidence contract used to review that gate.

This document does not approve production UI, mutate schedules or calendar events, replace browser/accessibility evidence, grant product-owner approval, create remotes, publish packages, or change release status.

## Status

Current result: `FAIL`.

ScheduleOS now has a local production calendar UI evidence validator in `src/production-calendar-ui-evidence-contract.ts` with tests in `src/production-calendar-ui-evidence-contract.test.ts`. It validates evidence shape only.

## Contract Purpose

Production calendar UI hardening must prove that the release-candidate calendar experience works across the release browser matrix, handles conflict-preview and write-back decisions safely, remains accessible and responsive, has visual regression coverage, and has real operator approval evidence.

The validator checks:

- Browser matrix across Chrome, Firefox, Safari, and mobile WebKit.
- Desktop, tablet, and mobile viewport proof.
- Release target browser versions and absence of critical console errors.
- Conflict workflow proof for clean writes, busy conflicts, read-only calendars, stale previews, rejected and accepted acknowledgements, server-side refusal, and no keyboard traps.
- Preview-before-write, acknowledgement, server-side refusal, locked-block preservation, and error-recovery review.
- Accessibility audit, keyboard navigation, screen-reader semantics, focus order, live regions, color contrast, reduced motion, and no keyboard traps.
- Responsive review across mobile, tablet, narrow desktop, and wide desktop without overlapping text, hidden controls, or unstable calendar grids.
- Visual regression states covering empty, loading, error, task list, fixed events, warnings, explanations, conflict preview, accepted blocks, and write-back-ready states.
- Product-owner approval, remote CI, rollback, static asset cache review, API compatibility review, operator communication, final audits, and second-operator review.

## Required Browsers

Production calendar UI evidence must cover:

- `CHROME`
- `FIREFOX`
- `SAFARI`
- `MOBILE_WEBKIT`

## Required Conflict Scenarios

Production calendar UI conflict workflow evidence must cover:

- `CLEAN_WRITE`
- `BUSY_CONFLICT`
- `READ_ONLY_CALENDAR`
- `STALE_PREVIEW`
- `ACKNOWLEDGEMENT_REJECTED`
- `ACKNOWLEDGEMENT_ACCEPTED`
- `SERVER_SIDE_REFUSAL`
- `NO_KEYBOARD_TRAP`

## Required Visual States

Visual regression evidence must cover:

- `EMPTY_STATE`
- `LOADING_STATE`
- `ERROR_STATE`
- `TASK_LIST`
- `FIXED_EVENTS`
- `WARNINGS`
- `EXPLANATIONS`
- `CONFLICT_PREVIEW`
- `ACCEPTED_BLOCKS`
- `WRITE_BACK_READY`

## Privacy Boundary

Evidence must not include private task titles, private calendar titles, raw provider payloads, raw browser storage, session cookies, bearer tokens, real account identifiers, local paths, or unreleased customer data.

Use privacy-safe demo identifiers such as:

```text
tenant_demo
workspace_demo
user_jordan
calendar_ui_browser_matrix_demo
calendar_ui_conflict_workflow_demo
calendar_ui_visual_baseline_demo
product_owner_calendar_ui_review_demo
second_operator_calendar_ui_review_demo
```

## Verification

Focused verification:

```bash
npm run build
node --test dist/production-calendar-ui-evidence-contract.test.js
```

Full verification:

```bash
npm run check
npm audit --omit=dev --audit-level=high
find . -maxdepth 2 -name .git -type d -print
```

## Release Boundary

This contract is a local foundation. ScheduleOS release status remains `FAIL` until production calendar UI hardening has real browser matrix evidence, interactive conflict workflow proof, accessibility pass, responsive polish review, visual regression baseline, product-owner visual approval, remote CI proof, rollback proof, final audits, and second-operator review.
