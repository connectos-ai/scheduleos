# Public Intake Boundary Guard

Date: 2026-07-28

## Result

Added local guard for public GitHub issue templates, pull request template, and CI intake surfaces while ScheduleOS remains in release-prep `FAIL` status.

## Scope

- Verifies `.github/ISSUE_TEMPLATE/config.yml` keeps blank public issues disabled.
- Verifies security vulnerability and private-data/secret exposure reports route away from public issues.
- Verifies bug, feature, integration, and solver constraint templates keep safety sections, require fictional examples, and forbid real secrets, provider credentials, customer data, private workspace data, logs, screenshots, exports, or security reports in public issues.
- Verifies feature intake preserves standalone open-source value and does not request private private leadership-only behavior.
- Verifies integration intake preserves provider safety language for OAuth credentials, callback URLs, minimum permissions/scopes, token leakage, replay risk, unsafe write-back, quota abuse, and revocation failures.
- Verifies pull requests require `npm run check`, production dependency audit, fictional sample data, no secrets/private data, and tenant/workspace/user/source provenance boundaries.
- Verifies CI remains read-only evidence collection and rejects publish, deploy-style permission, tag, release, or `pull_request_target` drift.
- Verifies public release, security contact, and final privacy audit checklists keep public-intake dependencies visible.

## Boundary

This is not public repository launch approval. The guard does not configure GitHub issue settings, enable security advisories, create a public repository, approve public remote CI, approve security contacts, approve final audits, publish packages, deploy hosting, tag releases, or announce ScheduleOS. ScheduleOS release status remains `FAIL`.
