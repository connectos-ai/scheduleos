# Final Dependency Audit Evidence Contract

Final dependency audit approval is tracked in `docs/security/final-dependency-audit-approval-checklist.md`.

This document defines the local evidence contract used to review that gate. It does not install, update, remove, override, publish, or replace dependencies; mutate package manifests or lockfiles; configure registries; approve the final dependency audit; create remotes; publish packages; or announce ScheduleOS.

## Status

Current result: `FAIL`.

ScheduleOS now has a local final dependency audit evidence validator in `src/final-dependency-audit-evidence-contract.ts` with tests in `src/final-dependency-audit-evidence-contract.test.ts`. It validates evidence shape only.

## Contract Purpose

The final dependency audit proof must show that the release candidate has a reviewed, reproducible, production-only dependency surface with no known high-severity production vulnerabilities, no unreviewed override or registry risk, and final release-audit alignment.

The validator checks:

- npm package-manager evidence, reviewed `package.json`, reviewed `package-lock.json`, manifest-lockfile match, lockfile freeze, and clean install reproducibility.
- Production dependency audit command exactly `npm audit --omit=dev --audit-level=high`, dev dependency omission, high-severity threshold, zero high-severity vulnerabilities, and retained advisory output.
- Installed production dependency tree command exactly `npm ls --omit=dev --all`, attached production tree, optional dependency review, duplicate dependency review, and transitive-risk review.
- Runtime inventory for production dependencies, Node.js version, package scripts, Docker install behavior, and CI install behavior.
- Dev dependency boundary showing dev dependencies are excluded from production runtime, build-only tools and test-only tools are identified, and production does not require dev-server dependencies.
- Override and registry review covering overrides, vendored substitutions, private registry URLs, registry tokens, and npm configuration.
- Release alignment with license check, release safety, final security audit, final privacy audit, final licensing audit, remote CI proof, and second-operator review.

## Review Commands

The final evidence packet should include current output from:

```bash
npm audit --omit=dev --audit-level=high
npm ls --omit=dev --all
npm run license:check
npm run release:safety
```

## Privacy Boundary

Evidence must not include registry tokens, private registry URLs, private machine paths, customer data, calendar data, task data, private compatible leadership system material, or real provider payloads.

Use privacy-safe demo identifiers such as:

```text
release_candidate_demo
dependency_audit_demo
lockfile_reproducibility_demo
installed_tree_demo
runtime_inventory_demo
second_operator_dependency_review_demo
```

## Verification

Focused verification:

```bash
npm run build
node --test dist/final-dependency-audit-evidence-contract.test.js
```

Full verification:

```bash
npm run check
npm audit --omit=dev --audit-level=high
find . -maxdepth 2 -name .git -type d -print
```

## Release Boundary

This contract is a local foundation. ScheduleOS release status remains `FAIL` until final dependency audit evidence proves the release-candidate lockfile, production audit, installed dependency tree, runtime inventory, dev dependency boundary, override and registry safety, remote CI proof, final security/privacy/licensing alignment, and second-operator review.
