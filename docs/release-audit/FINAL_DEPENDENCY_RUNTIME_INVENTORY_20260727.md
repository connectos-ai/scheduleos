# Final Dependency Runtime Inventory Foundation Audit

## Date

2026-07-27

## Scope

Added local final dependency runtime inventory evidence for the final dependency audit gate.

## Evidence Added

- `docs/security/final-dependency-runtime-inventory.md` records the current direct production dependency surface, production lockfile package table, development dependency boundary, override review, registry review, verification command, and release boundary.
- `scripts/check-dependency-runtime-inventory.mjs` compares the inventory against `package.json` and `package-lock.json`, requires every current production lockfile package to be listed, checks development dependency boundary wording, and keeps the inventory marked `FOUNDATION ONLY`.
- `package.json` now wires `npm run dependency:runtime-inventory:check` into `npm run check`.

## Local Verification

- `npm run dependency:runtime-inventory:check` passed for 14 production package(s).
- Full required verification passed after documentation updates:
  - `npm run check` passed.
  - `npm test` passed 824 tests.
  - `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities.
  - `find . -maxdepth 2 -name .git -type d -print` returned no output.
  - Checklist integrity returned `malformed: []`, `checked: 203`, `unchecked: 18`.
- Full check coverage included documentation link check over 158 Markdown files, release safety scan over 246 files, and license check over 18 package-lock licenses, 247 release text files, and 16 fixture/template/example-like files.

## Release Boundary

This is local dependency-audit support evidence only. It does not approve dependency audit final pass, remote CI proof, final security/privacy/licensing audit pass, clean public history, repository creation, package publication, tagging, deployment, or announcement. Release remains `FAIL`.
