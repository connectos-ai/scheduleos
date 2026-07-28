# Calendar UI Responsive Contract - 2026-07-27

## Status

Local/static evidence only. Release remains `FAIL`.

## Scope

Added a regression test around the standalone calendar app shell responsive layout hooks. This protects the local foundation from accidental loss while production calendar UI approval remains open.

## Evidence Added

- `src/web-app.test.ts`: `standalone web app keeps responsive calendar layout contract`.
- Verifies desktop workspace uses the planning sidebar plus calendar main two-column grid.
- Verifies `main` keeps `min-width: 0` and `overflow: auto` so wide calendar content can scroll instead of forcing page breakage.
- Verifies toolbar and action rows wrap.
- Verifies week and day calendar grids keep stable minimum widths for fixed-format scheduling columns.
- Verifies tablet breakpoint stacks the workspace to one column and lowers calendar minimum width.
- Verifies mobile breakpoint stacks the header, two-column inputs, auth form, and auth-session alignment.

## Verification

Focused verification before this audit packet:

```text
npm run build && node --test dist/web-app.test.js
```

Observed result:

- 9 web-app tests passed.

Full required verification after this evidence update:

- `npm run check` passed 742 tests, documentation link check across 101 Markdown files, release safety scan across 156 files, security policy contact check, and license check.
- `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities.
- `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Checklist integrity reported `malformed: []`, `checked: 183`, `unchecked: 18`.

## Boundary

This does not approve production calendar UI hardening. Still required before the calendar UI gate can pass:

- Browser matrix covering release-target browsers and mobile/device targets.
- Responsive screenshot or device review across mobile, tablet/narrow desktop, and wide desktop.
- Interactive conflict-preview workflow proof.
- Accessibility audit.
- Visual regression baseline.
- Product-owner visual approval.
- Remote CI proof.
- Rollback plan and second-operator approval.
