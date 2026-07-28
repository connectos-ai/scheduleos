# Licensing Audit Evidence Refresh Guard

Date: 2026-07-28

## Result

Added a local final licensing audit evidence refresh guard while ScheduleOS remains in release-prep `FAIL` status.

## Scope

- Verifies no local `.git` directory exists.
- Verifies root `package.json` remains `Apache-2.0` and root `LICENSE` remains Apache License 2.0 text.
- Verifies `package-lock.json` package entries keep approved license metadata, public npm registry resolutions, and sha512 integrity metadata.
- Verifies the final licensing audit approval checklist remains `FAIL`, keeps release-use prohibitions, and still requires final license check, production dependency tree, lockfile, installed metadata, copied-source, fixture/template/example, asset/media/font/icon/image/binary, documentation reuse, reused-material inventory, NOTICE, root license, final freeze, remote CI, security/privacy alignment, and second-operator evidence.
- Verifies the standalone licensing audit document remains `FAIL` and keeps automated license-check, copied-source, fixture, asset, documentation reuse, NOTICE, reused-material, release-candidate repeat-review, and non-approval boundaries visible.
- Verifies the final licensing audit evidence contract document remains `FAIL` and keeps root-license, dependency-license, source/documentation reuse, fixture/asset/binary, reused-material inventory, NOTICE/distribution, final release alignment, remote CI, security/privacy/dependency alignment, and second-operator evidence shape.
- Verifies the evidence contract source keeps required fields for Apache-2.0 root consistency, dependency license proof, copied-source and documentation reuse review, fixture/template/example review, asset/media/font/icon review, binary/source-map/coverage review, reused-material inventory, NOTICE distribution, release-candidate freeze, dependency/security/privacy alignment, remote CI licensing proof, clean public history, and second-operator review.
- Verifies evidence contract tests keep rejection coverage for root/dependency proof, copied material and artifacts, reused-material and NOTICE proof, final release alignment, dependency/security/privacy audit alignment, remote CI licensing proof, clean public history, and second-operator review.
- Verifies `scripts/check-licenses.mjs` keeps allowed license set, forbidden asset extensions, copied-source markers, NOTICE trigger markers, fixture/template/example scanning, lockfile metadata review, installed metadata comparison, and success summary.
- Verifies root `README.md` keeps final licensing audit readiness packet wiring, local evidence commands, and non-approval caveats.
- Verifies final release, dependency, security, and privacy checklists keep final licensing audit dependencies visible.
- Verifies package wiring keeps license check, final licensing readiness packet, approval guard, evidence refresh guard, and adjacent dependency/security/privacy evidence refresh guards available.

## Boundary

This is not final licensing audit approval. The guard does not mark licensing audit `PASS`, approve publication, approve reused-material inventory, approve NOTICE handling, approve final release-candidate freeze, approve remote CI licensing proof, approve security/privacy/dependency audits, mutate release gates, create remotes, initialize git, publish packages, deploy hosting, or announce ScheduleOS. ScheduleOS release status remains `FAIL`.
