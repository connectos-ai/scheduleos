# Production Web App Evidence Contract

Production standalone web app approval is tracked in `docs/security/production-web-app-approval-checklist.md`. This document defines the local evidence contract used to review that gate.

This document does not approve production deployment, mutate application state, configure hosting, create remotes, publish packages, or change release status.

## Status

Current result: `FAIL`.

ScheduleOS now has a local production web app evidence validator in `src/production-web-app-evidence-contract.ts` with tests in `src/production-web-app-evidence-contract.test.ts`. It validates evidence shape only.

## Contract Purpose

Production standalone web app release must prove that the app can be built, deployed, used through authenticated write flows, operated with durable storage and safe headers, reviewed across browsers and accessibility expectations, rolled back, and approved without requiring private compatible leadership system code, a hosted service, paid AI, or a commercial subscription.

The validator checks:

- Deployment target review, production build artifact, release-candidate traceability, self-host/container proof, no hosted-service requirement, and no private compatible leadership system dependency.
- Authenticated login/logout, task writes, fixed-event writes, plan accept/reject, write-back preview acknowledgement, unauthorized write denial, and CSRF cookie transport proof.
- TLS termination, trusted proxy headers, security headers, request/import throttles, log redaction, and no-store private responses.
- Durable storage, migration/upgrade path, backup/restore, retention boundary, health check, startup guard, and static asset cache policy.
- Browser matrix across Chrome, Firefox, Safari, and mobile WebKit.
- Accessibility audit, keyboard navigation, screen-reader semantics, responsive polish, visual regression baseline, and no critical console errors.
- Operator review, remote CI, rollback, cache invalidation, API compatibility, support runbook, final audits, and second-operator review.

## Required Browsers

Production web app evidence must cover:

- `CHROME`
- `FIREFOX`
- `SAFARI`
- `MOBILE_WEBKIT`

## Independence Boundary

Evidence must prove the production web app can run as a standalone self-host/container release target without requiring private compatible leadership system, OwnerOps, ConnectOS, paid AI, hosted service, external task manager, or subscription.

Use privacy-safe demo identifiers such as:

```text
tenant_demo
workspace_demo
user_jordan
production_web_app_build_demo
self_host_container_demo
authenticated_write_flow_demo
production_web_app_browser_matrix_demo
second_operator_web_app_review_demo
```

## Verification

Focused verification:

```bash
npm run build
node --test dist/production-web-app-evidence-contract.test.js
```

Full verification:

```bash
npm run check
npm audit --omit=dev --audit-level=high
find . -maxdepth 2 -name .git -type d -print
```

## Release Boundary

This contract is a local foundation. ScheduleOS release status remains `FAIL` until standalone production web app proof covers production build/deployment, authenticated write-flow proof, production browser matrix, accessibility audit, responsive polish, visual regression, operator review, second-operator review, remote CI, and rollback proof.
