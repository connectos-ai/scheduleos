# Final Licensing Audit Evidence Contract

Final licensing audit approval is tracked in `docs/security/final-licensing-audit-approval-checklist.md`.

This document defines the local evidence contract used to review that gate. It does not mark the licensing audit `PASS`, approve publication, add `NOTICE`, mutate release gates, create remotes, publish packages, or announce ScheduleOS.

## Status

Current result: `FAIL`.

ScheduleOS now has a local final licensing audit evidence validator in `src/final-licensing-audit-evidence-contract.ts` with tests in `src/final-licensing-audit-evidence-contract.test.ts`. It validates evidence shape only.

## Contract Purpose

The final licensing audit proof must show the frozen release candidate has consistent Apache-2.0 root licensing, approved dependency licenses, clean copied-source and documentation reuse review, reviewed fixtures/assets/binaries, complete reused-material inventory, NOTICE handling, distribution artifact review, remote CI licensing proof, final security/privacy/dependency alignment, clean public history, and second-operator review.

The validator checks:

- Root license proof covering `package.json`, root `LICENSE`, README, publication metadata, and repository settings.
- Dependency license proof covering final `npm run license:check`, `package-lock.json`, installed dependency metadata, production dependency tree, approved license set, and transitive licenses.
- Source and documentation reuse proof covering copied-source scan, documentation reuse scan, third-party snippets, generated summaries, screenshots/diagrams, and attribution requirements.
- Fixture, template, example, asset, media, font, icon, binary, source-map, and coverage output review.
- Reused-material inventory covering project/version/commit, license, usage type, copied versus referenced status, attribution, and final approval.
- NOTICE and distribution proof covering NOTICE requirement review, NOTICE file added when required, NOTICE absence approval when unneeded, distribution artifacts, and package tarball review.
- Final release alignment covering release-candidate freeze, dependency/security/privacy audit pass evidence, remote CI licensing proof, clean public history, and second-operator review.

## Privacy Boundary

Evidence must not include private registry URLs, tokens, customer data, private compatible leadership system material, private machine paths, or non-public third-party source snippets.

Use privacy-safe demo identifiers such as:

```text
release_candidate_demo
licensing_audit_demo
reused_material_inventory_demo
notice_review_demo
package_tarball_review_demo
second_operator_licensing_review_demo
```

## Verification

Focused verification:

```bash
npm run build
node --test dist/final-licensing-audit-evidence-contract.test.js
```

Full verification:

```bash
npm run check
npm audit --omit=dev --audit-level=high
find . -maxdepth 2 -name .git -type d -print
```

## Release Boundary

This contract is a local foundation. ScheduleOS release status remains `FAIL` until final licensing audit evidence proves final license check, dependency metadata, copied-source/documentation reuse, fixture/template/example review, asset/media/font/binary review, reused-material inventory, NOTICE review, Apache-2.0 consistency, final release-candidate freeze, remote CI proof, security/privacy/dependency alignment, clean public history, public repository settings, and second-operator review.
