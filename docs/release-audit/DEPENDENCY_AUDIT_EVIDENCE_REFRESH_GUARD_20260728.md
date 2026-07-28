# Dependency Audit Evidence Refresh Guard

Date: 2026-07-28

## Result

Added a local dependency-audit evidence refresh guard while ScheduleOS remains in release-prep `FAIL` status.

## Scope

- Verifies no local `.git` directory exists.
- Verifies no local `.npmrc`, Yarn, pnpm, patch, override, resolution, bundled-dependency, or publish registry configuration has appeared without review.
- Verifies `package.json` remains private pre-release metadata with Apache-2.0 license and the current expected dependency surface.
- Verifies `package-lock.json` remains lockfile version 3, matches manifest root dependencies, and keeps the expected production package set.
- Verifies every current production lockfile package resolves from the public npm registry and keeps `sha512` integrity metadata.
- Verifies the runtime inventory remains `FOUNDATION ONLY`, lists all current production packages, preserves development-dependency exclusion, registry review, `.npmrc` absence, and release-boundary language.
- Verifies final dependency audit approval remains `FAIL`, dependency audit final pass remains unchecked, and required production audit, lockfile, installed-tree, runtime-inventory, dev-exclusion, registry-secret absence, remote-CI, and second-operator evidence remains listed.
- Verifies CI, security, licensing, and final release checklists continue to require dependency audit evidence.
- Scans release source outside excluded generated/runtime directories for npm registry token patterns.

## Boundary

This is not final dependency audit approval. The guard does not install, update, remove, override, publish, replace, or approve dependencies; mutate package manifests or lockfiles; configure package registries; mark dependency audit `PASS`; mark security, privacy, or licensing audits `PASS`; create remotes; initialize git; publish packages; deploy hosting; or announce ScheduleOS. ScheduleOS release status remains `FAIL`.
