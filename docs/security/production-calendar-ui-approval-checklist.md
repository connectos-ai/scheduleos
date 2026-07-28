# Production Calendar UI Approval Checklist

## Status

Current result: `FAIL`.

ScheduleOS has local calendar UI foundations and a review-only calendar UI production readiness packet. The production calendar UI is not approved for public release until the evidence below is attached, reviewed, and accepted.

No public repository, hosted deployment, tag, package publication, or release announcement may rely on the production calendar UI until this checklist changes to `PASS`.

## Verified Local Foundations

Current local evidence covers:

- Local daily and weekly calendar views in the standalone app shell.
- Local manual time-block drag/drop and keyboard movement controls.
- Local fixed-event entry/list UI foundation.
- Local plan accept/reject and accepted-block ICS export UI foundation.
- Local accepted-plan write-back safety foundation that previews conflicts, blocks conflicted writes server-side, and requires review acknowledgement before write-back readiness.
- Local browser-verifiable calendar hooks for grid, slots, draggable blocks, keyboard focus, and drag-status live region.
- Local Chrome browser smoke evidence in `docs/release-audit/CALENDAR_UI_BROWSER_SMOKE_20260722.md` covering desktop render, mobile render, drag/drop movement, clean conflict preview, review acknowledgement, and write-back-ready state.
- `calendar-ui:production-readiness-packet` review-only evidence labels for calendar UI production review.

These foundations do not approve production browser support, real provider conflict workflows, accessibility compliance, responsive polish, visual regression baselines, product-owner visual approval, remote CI, rollback readiness, or second-operator release approval.

## Required Evidence Before PASS

Attach current evidence for every item:

- Browser matrix covers at least current Chrome, Firefox, Safari, and a mobile viewport or device for the release target.
- Interactive conflict-preview workflow covers clean writes, conflicted writes, read-only calendars, stale previews, rejected acknowledgements, accepted acknowledgements, and server-side refusal of conflicted writes.
- Write-back acknowledgement proof shows users can distinguish previewed, acknowledged, ready, written, failed, and blocked states.
- Keyboard navigation proof covers calendar grid traversal, block movement, focus visibility, disabled/locked block behavior, and recovery from invalid moves.
- Screen-reader semantics proof covers grid, gridcell, draggable block controls, status/live-region updates, labels, warnings, and error summaries.
- Accessibility audit covers focus order, labels, live regions, color contrast, reduced-motion expectations, error states, and no keyboard traps.
- Responsive polish review covers mobile, tablet/narrow desktop, and wide desktop layouts without overlapping text, hidden controls, or broken calendar grids.
- Visual regression baseline is captured from the release candidate and reviewed for major UI states.
- Product-owner visual approval covers the calendar grid, task list, fixed events, warnings, explanations, conflict preview, acknowledgement, accepted blocks, empty states, loading states, and error states.
- Remote CI proof exists for calendar UI readiness packet tests, app render hooks, release safety, docs links, and license checks.
- Rollback plan reviewed for UI deployment, static assets, app-shell cache, API compatibility, and operator communication.
- Security, privacy, and licensing audits remain `PASS` after attaching calendar UI evidence.
- Second operator approves the final production calendar UI evidence packet.

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
npm run calendar-ui:production-readiness-packet -- --environment production-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --browser-matrix chrome-firefox-safari-demo --conflict-workflow calendar-conflict-workflow-demo --write-back-acknowledgement write-back-acknowledgement-demo --accessibility-audit keyboard-screenreader-audit-demo --responsive-polish responsive-polish-screenshots-demo --visual-regression visual-regression-baseline-demo --product-owner-approval product-owner-approval-demo --remote-ci remote-ci-calendar-ui-demo --rollback-plan calendar-ui-rollback-plan-demo --second-operator second-operator-calendar-ui-review-demo --json
```

This packet does not approve production UI, mutate schedules or calendar events, replace browser/accessibility evidence, grant product-owner approval, create a public remote, mark audits `PASS`, publish packages, or announce ScheduleOS.

## Local Accessibility Contract Evidence

Current local evidence also includes a static accessibility contract test for the standalone app shell. It verifies app language and viewport metadata, named main/planning/calendar landmarks, labelled calendar view toggle group, polite status/live regions, labelled calendar grid, focusable grid slots, focusable draggable blocks, described write-back controls, and keyboard-reachable earlier/later block movement buttons. This does not replace the required production accessibility audit, browser matrix, responsive polish review, visual regression baseline, product-owner approval, remote CI proof, rollback proof, or second-operator approval.

## Local Responsive Contract Evidence

Current local evidence also includes static responsive layout contract test for standalone app shell. It verifies desktop two-column workspace layout, scrollable main/calendar surface, wrapping toolbars/actions, wide week-grid and day-grid minimum widths, tablet one-column workspace fallback, tablet calendar minimum width, mobile stacked header, two-column form, auth form, and session alignment rules. This does not replace release-candidate responsive screenshots, device/browser review, visual regression baseline, product-owner approval, remote CI proof, rollback proof, or second-operator approval.

## Current Remaining Risk

High. The local calendar UI foundation is useful, but production calendar UI release remains unproven until real browser matrix, interactive conflict workflow, accessibility, responsive, visual regression, product-owner, remote CI, rollback, audit, and second-operator evidence are reviewed together.

## Release Rule

Do not mark "Production calendar UI hardening" complete until this checklist changes from `FAIL` to `PASS` with current release-candidate evidence.

## Evidence Contract Foundation

Local production calendar UI evidence contract foundation exists at `docs/security/production-calendar-ui-evidence-contract.md`. It validates browser matrix coverage, safe conflict-preview and write-back workflows, accessibility proof, responsive polish proof, visual regression proof, product-owner approval, remote CI, rollback, final audits, and second-operator review without approving production calendar UI hardening.
