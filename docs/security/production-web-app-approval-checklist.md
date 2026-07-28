# Production Standalone Web App Approval Checklist

## Status

Current result: `FAIL`.

ScheduleOS has local standalone app foundations and a review-only production web app readiness packet. The standalone production web app is not approved for public release until the evidence below is attached, reviewed, and accepted.

No public repository, hosted deployment, tag, package publication, or release announcement may rely on the production web app until this checklist changes to `PASS`.

## Verified Local Foundations

Current local evidence covers:

- Standalone app shell served at `/app`.
- Local task create, edit, delete, CSV/JSON preview/import, fixed-event entry, ICS fixed-event import, plan creation, replan, warning/explanation review, accept/reject, accepted-block ICS export, and write-back preview controls.
- Local daily and weekly calendar views.
- Local manual block drag/drop and keyboard movement controls.
- Local fixed-event entry/list UI foundation.
- Local accepted-plan write-back safety foundation that previews conflicts, blocks conflicted writes server-side, and requires review acknowledgement before write-back readiness.
- Local app/API server startup script foundation.
- Local app/API security headers and no-store cache-control foundation for JSON, HTML app shell, and CSV export responses.
- Local Chrome browser smoke evidence in `docs/release-audit/CALENDAR_UI_BROWSER_SMOKE_20260722.md` covering desktop render, mobile render, drag/drop movement, conflict preview, review acknowledgement, and write-back-ready state.
- `web-app:production-readiness-packet` review-only evidence labels for production web app release review.

These foundations do not approve production hosting, production authenticated writes, production browser support, accessibility compliance, responsive polish, visual regression baselines, remote CI, rollback readiness, or owner/operator release approval.

## Required Evidence Before PASS

Attach current evidence for every item:

- Production build artifact reviewed and traceable to the release candidate.
- Deployment target reviewed for self-host/container runtime, startup command, environment variables, volume/storage boundaries, and health checks.
- Authenticated write-flow proof covers create/update/delete task and event writes, plan accept/reject, write-back preview acknowledgement, CSRF behavior if cookie auth is enabled, and failed authorization behavior.
- Security headers verified in the intended deployment path, including proxy/CDN behavior if present.
- CSRF/cookie transport reviewed for the intended TLS, proxy, SameSite, Secure, Path, logout, and no-store behavior.
- Request throttle and import throttle proof exists for production shape, including trusted proxy assumptions.
- Durable storage proof covers JSON/SQLite/PostgreSQL release target, backup/restore expectation, migration or upgrade path, and data retention boundary.
- Static asset and app-shell cache policy verified so private app state is not cached unexpectedly.
- Startup guard and health-check proof exists in the intended production environment.
- Browser matrix covers at least current Chrome, Firefox, Safari, and a mobile viewport or device for the release target.
- Accessibility audit covers keyboard navigation, focus order, labels, live regions, screen-reader semantics, color contrast, reduced-motion expectations, and error states.
- Responsive polish review covers mobile, tablet/narrow desktop, and wide desktop layouts without overlapping text, hidden controls, or broken calendar grids.
- Visual regression baseline is captured from the release candidate and reviewed.
- Operator review confirms the web app can be deployed, operated, observed, rolled back, and supported without private compatible leadership system, OwnerOps, ConnectOS, paid AI, hosted service, or subscription requirements.
- Remote CI proof exists for web app build, tests, docs links, release safety scan, license check, and any production readiness packet tests.
- Rollback plan reviewed for app version, storage schema, environment variables, cache invalidation, and operator communication.
- Security, privacy, and licensing audits remain `PASS` after attaching web app evidence.
- Second operator approves the final production web app evidence packet.

## Required Commands

Run before changing this checklist to `PASS`:

```bash
npm run check
npm audit --omit=dev --audit-level=high
find . -maxdepth 2 -name .git -type d -print
```

The no-`.git` check must return no output until intentional clean public repository history is prepared.

## Review-Only Packet

Use this command to prepare evidence labels only:

```bash
npm run web-app:production-readiness-packet -- --environment production-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --deployment-target self-host-container-demo --production-build production-build-artifact-demo --authenticated-write-flow authenticated-write-flow-demo --security-headers security-header-deployment-demo --csrf-cookie-transport csrf-cookie-transport-demo --throttle-policy request-import-throttle-demo --durable-storage durable-storage-demo --cache-policy static-cache-policy-demo --health-startup-guard health-startup-guard-demo --browser-matrix desktop-mobile-browser-demo --accessibility-audit axe-keyboard-screenreader-demo --responsive-polish responsive-polish-demo --visual-regression visual-regression-demo --operator-review operator-review-demo --remote-ci remote-ci-webapp-demo --rollback-plan webapp-rollback-plan-demo --second-operator second-operator-webapp-review-demo --json
```

This packet does not approve production deployment, mutate application state, configure hosting, create a public remote, mark security/privacy/licensing audits `PASS`, or replace production evidence.

## Current Remaining Risk

High. The local standalone app foundation is useful, but production web app release remains unproven until deployment-specific build, authenticated writes, headers, CSRF/cookie transport, throttle, durable storage, cache, health, browser matrix, accessibility, responsive, visual regression, operator, remote CI, rollback, audit, and second-operator evidence are reviewed together.

## Release Rule

Do not mark "Standalone production web app beyond local foundations" complete until this checklist changes from `FAIL` to `PASS` with current release-candidate evidence.

## Evidence Contract Foundation

Local production web app evidence contract foundation exists at `docs/security/production-web-app-evidence-contract.md`. It validates deployment/build traceability, standalone/self-host independence, authenticated write flows, CSRF cookie transport, TLS/proxy/security headers, request/import throttles, durable storage, migration/backup/retention/health/startup/cache proof, browser matrix, accessibility, responsive polish, visual regression, operator review, remote CI, rollback, final audits, and second-operator review without approving production deployment.
