# Calendar UI Browser Smoke - 2026-07-22

## Status

Local browser smoke passed in system Chrome. This is release evidence for the local standalone app foundation, not final production UI approval.

## Environment

- App URL: `http://127.0.0.1:8797/app`
- Browser: system Google Chrome through Playwright-compatible automation
- Desktop viewport: `1280x900`
- Mobile viewport: `390x844`
- Auth mode: local unauthenticated demo scope
- Scope: `tenant_demo`, `workspace_demo`, `user_jordan`

## Covered Flow

1. Open standalone app shell.
2. Save default working hours.
3. Add a local task with duration, priority, and deadline.
4. Create a day plan.
5. Verify a draggable scheduled time block renders.
6. Drag the time block onto a calendar slot.
7. Verify the drag status live region reports the moved block.
8. Accept the plan.
9. Preview accepted-plan calendar write-back.
10. Verify clean conflict preview.
11. Acknowledge the latest clean preview.
12. Verify write-back is ready.
13. Load the app in a mobile viewport and verify the calendar grid and drag-status region are visible.

## Observed Result

- Console errors: none.
- Calendar grid rendered with stable `data-testid="calendar-grid"` hook.
- Drop targets rendered with `data-testid="calendar-slot"` and `role="gridcell"`.
- Time blocks rendered with `data-testid="time-block"`, `draggable="true"`, `tabindex="0"`, and `role="button"`.
- Drag/drop updated the live drag status: `Block moved to Wed, Jul 22 11:00 drop target.`
- Conflict preview showed: `Preview clear. Accepted blocks are ready for write-back.`
- Review acknowledgement showed: `Review acknowledged. Write-back is ready.`
- Mobile viewport showed the calendar grid and drag-status region.

## Release Boundary

This smoke does not close the full production calendar UI hardening gate. Remaining work still includes broader manual accessibility review, browser matrix coverage beyond local Chrome, conflict-preview edge cases with real provider adapters, responsive polish review across more device widths, and final product-owner visual approval.
