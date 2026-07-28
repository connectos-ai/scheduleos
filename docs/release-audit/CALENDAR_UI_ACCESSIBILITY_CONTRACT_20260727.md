# Calendar UI Accessibility Contract - 2026-07-27

## Status

Local/static evidence only. Release remains `FAIL`.

## Scope

Added a regression test around the standalone calendar app shell accessibility hooks. This protects the local foundation from accidental loss while production calendar UI approval remains open.

## Evidence Added

- `src/web-app.test.ts`: `standalone web app keeps calendar accessibility hooks wired`.
- Verifies `<html lang="en">` and mobile viewport metadata.
- Verifies named app landmarks for main content, planning controls, and calendar plan.
- Verifies the calendar view toggle group is labelled and exposes `aria-pressed` state.
- Verifies polite live regions for global status, drag status, and write-back status.
- Verifies the calendar grid is labelled.
- Verifies generated calendar slots are focusable `gridcell` elements.
- Verifies generated time blocks are focusable draggable button-role elements with move labels.
- Verifies write-back controls are described by help and status text.
- Verifies earlier/later movement controls remain keyboard-reachable buttons.

## Verification

Focused verification before this audit packet:

```text
npm run build && node --test dist/web-app.test.js
```

Observed result:

- 8 web-app tests passed.

Full required verification after this evidence update:

- `npm run check` passed 741 tests, documentation link check across 99 Markdown files, release safety scan across 154 files, security policy contact check, and license check.
- `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities.
- `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Checklist integrity reported `malformed: []`, `checked: 182`, `unchecked: 18`.

## Boundary

This does not approve production calendar UI hardening. Still required before the calendar UI gate can pass:

- Browser matrix covering release-target browsers and mobile/device targets.
- Interactive conflict-preview workflow proof beyond static hooks.
- Manual or automated accessibility audit against the release candidate.
- Responsive polish review across mobile, tablet/narrow desktop, and wide desktop.
- Visual regression baseline.
- Product-owner visual approval.
- Remote CI proof.
- Rollback plan and second-operator approval.
