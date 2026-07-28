# First-Commit Staging Manifest Guard Audit

## Date

2026-07-27

## Scope

Added local guard evidence for the clean public history gate. The guard verifies that the draft first public commit manifest matches the current release-candidate tree and keeps generated, runtime, private, credential, backup, and transient paths excluded.

## Evidence Added

- `scripts/check-first-commit-staging-manifest.mjs` validates `docs/release/first-commit-staging-manifest.md`.
- The checker confirms required include entries, required exclude entries, `.gitignore` exclusions, no `.git` directory, no unexpected top-level entries, and the public release checklist keeps `Clean public history prepared` unchecked.
- `package.json` now wires `npm run release:first-commit-manifest:check` into `npm run check`.
- `docs/release/first-commit-staging-manifest.md` now includes `examples/` as a public first-commit candidate because the current release tree includes fictional demo examples.

## Local Verification

- Focused verification passed: `npm run release:first-commit-manifest:check`.
- Full required verification passed after documentation updates:
  - `npm run check` passed.
  - `npm test` passed 824 tests.
  - `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities.
  - `find . -maxdepth 2 -name .git -type d -print` returned no output.
  - Checklist integrity returned `malformed: []`, `checked: 205`, `unchecked: 18`.
- Full check coverage included documentation link check over 160 Markdown files, release safety scan over 250 files, and license check over 18 package-lock licenses, 251 release text files, and 16 fixture/template/example-like files.

## Release Boundary

This is clean-history support evidence only. It does not initialize git, stage files, create a first commit, create a repository, add a remote, push, tag, publish, deploy, announce, or mark clean public history prepared. Release remains `FAIL`.
