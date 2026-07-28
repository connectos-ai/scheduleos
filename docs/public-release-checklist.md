# Public Release Checklist

## Status

Current result: `FAIL`.

ScheduleOS must not be published, pushed to a public remote, tagged, packaged, deployed publicly, or announced until every required release gate passes.

This checklist distinguishes local/self-host foundations and review-only readiness packets from production proof. A checked readiness-packet row means ScheduleOS can collect and label evidence for later review; it does not mean the related production gate has passed.

## Functionality Gate

- [x] Production calendar UI evidence contract foundation in `src/production-calendar-ui-evidence-contract.ts` validates browser matrix coverage, safe conflict-preview and write-back workflows, accessibility proof, responsive polish proof, visual regression proof, product-owner approval, remote CI, rollback, final audits, and second-operator review without approving production calendar UI hardening.
- [x] Deterministic local scheduling foundation.
- [x] Local task create/list/read/update/delete API foundation.
- [x] Local calendar-event create/list/read/update/delete API foundation.
- [x] Local schedule-plan create/list/read API foundation.
- [x] Local schedule-plan accept/reject API foundation.
- [x] Fixed busy event avoidance.
- [x] Working-hour placement.
- [x] Locked block preservation in replanning.
- [x] Honest unscheduled-task reporting foundation.
- [x] Grounded explanation records foundation.
- [x] Local standalone planning app shell served at `/app` with task/event edit/delete, CSV/JSON preview/import, ICS fixed-event import, warning/explanation review, replan, block keyboard movement, and block status controls.
- [x] Local daily and weekly calendar views in standalone app shell.
- [x] Local manual time-block drag/drop and keyboard movement controls in standalone app shell.
- [x] Local fixed-event entry/list UI foundation.
- [x] Local plan accept/reject accepted-block ICS export UI foundation.
- [x] Local app/API server startup script foundation.
- [x] Local Chrome browser smoke for standalone calendar drag/drop, write-back conflict preview, review acknowledgement, desktop render, and mobile render documented in `docs/release-audit/CALENDAR_UI_BROWSER_SMOKE_20260722.md`.
- [ ] Standalone production web app beyond local foundations: production build/deployment proof, authenticated write-flow proof, production browser matrix, accessibility audit, responsive polish, visual regression, operator review, second-operator review, remote CI, and rollback proof.
- [x] Standalone web app production readiness packet foundation emits review-only production build, authenticated write-flow, TLS, proxy header, security header, startup guard, health check, durable storage, secure cookie/CSRF transport, trusted proxy/throttle, static asset cache, log redaction, backup/rollback, remote CI deployment smoke, and second-operator evidence without deploying, configuring hosting, creating remotes, publishing packages, or announcing ScheduleOS.
- [x] Standalone production web app approval checklist exists at `docs/security/production-web-app-approval-checklist.md` current `FAIL` status, verified local foundations, required PASS evidence, review-only packet command, remaining risk, release rule.
- [x] Production web app evidence contract foundation in `src/production-web-app-evidence-contract.ts` validates deployment/build traceability, standalone/self-host independence, authenticated write flows, CSRF cookie transport, TLS/proxy/security headers, request/import throttles, durable storage, migration/backup/retention/health/startup/cache proof, browser matrix, accessibility, responsive polish, visual regression, operator review, remote CI, rollback, final audits, and second-operator review without approving production deployment.
- [x] Production web app approval guard foundation verifies the production web app checklist remains `FAIL`, public production web app blocker remains unchecked, release-use prohibition remains explicit, required deployment/browser/accessibility/rollback evidence remains listed, evidence contract/test coverage remains present, local browser smoke remains local-only evidence, and guard audit preserves non-approval caveats.
- [x] Production web app evidence parity guard foundation verifies local `/app` shell evidence, README release warning, review-only readiness packet, production web approval checklist, evidence contract/source/tests, browser smoke, self-hosting boundary, final release dependency, and package ordering stay aligned while production web proof remains unchecked.
- [x] Production functionality evidence parity guard foundation verifies production web app, calendar UI, ICS, provider CSV, hosted public-event delivery, auth, rate-limit/abuse monitoring, and provider lifecycle approval surfaces remain `FAIL`, keep remote CI/final audit/second-operator dependencies visible, keep matching public production blockers unchecked, run after final release gate approval and before production approval guards, and preserve no local `.git` boundary.
- [x] Self-hosting boundary guard foundation verifies local/self-host guide instructions, production deployment notes, README standalone/no-hosted-service promise, production startup guards, standalone web-app coverage, no local `.git` directory, and production web app blocker remains unchecked while preserving non-approval caveats.
- [x] Calendar UI production readiness packet foundation requires explicit browser matrix, conflict-preview workflow, write-back acknowledgement, accessibility audit, responsive polish, visual regression, product-owner approval, remote CI, and rollback labels, then emits review-only mobile responsive, keyboard navigation, screen-reader semantics, and second-operator evidence without UI or schedule mutation.
- [x] Production calendar UI approval checklist exists at `docs/security/production-calendar-ui-approval-checklist.md` current `FAIL` status, verified local foundations, required PASS evidence, review-only packet command, remaining risk, release rule.
- [x] Local calendar UI static accessibility contract verifies app language and viewport metadata, named landmarks, labelled calendar view toggles, live regions, labelled calendar grid, focusable slots/blocks, described write-back controls, and keyboard-reachable earlier/later block movement buttons.
- [ ] Production calendar UI hardening: browser matrix beyond local Chrome smoke, interactive conflict-preview workflow beyond local render smoke, accessibility pass, responsive polish, product-owner visual approval, and second-operator review evidence.

- [x] Local calendar UI responsive layout contract verifies desktop two-column workspace, scrollable main/calendar surface, wrapping toolbars/actions, wide week/day calendar minimums, tablet one-column fallback, and mobile stacked header/forms/session alignment.

## ICS And Calendar Sync Gate

- [x] ICS import/export module local API foundation for provider-neutral calendar events, including content-minimized public-event evidence for cancelled recurrence re-import deletion.
- [x] Local app ICS fixed-event review/import interface foundation.
- [x] ICS fixed-event IANA `TZID` local time conversion foundation.
- [x] Basic daily, weekly, monthly, and yearly ICS recurrence expansion foundation, including `BYHOUR`, `BYMINUTE`, `BYSECOND`, `BYDAY`, `BYMONTH`, `BYMONTHDAY`, ordinal `BYDAY`, `BYSETPOS`, `BYYEARDAY`, `BYWEEKNO`, `EXDATE`, date-only `EXDATE`, `RDATE`, `RDATE;VALUE=PERIOD`, and inclusive date-only `UNTIL` coverage inside requested ranges.
- [x] ICS moved and cancelled exception foundations for timed and all-day `RECURRENCE-ID` cases.
- [x] ICS recurrence edge-case foundations for daily, weekly, monthly, and yearly time-window, wall-clock, interval-boundary, date-clamping, DST, and set-position behavior.
- [x] Local accepted-plan calendar write-back foundation rejects read-only calendars, previews busy-event conflicts without persisting events, blocks conflicted writes server-side, and writes accepted/locked blocks to the writable local calendar-event store only when clear.
- [x] Local app accepted-plan write-back safety foundation requires clean matching conflict preview plus explicit review acknowledgement before enabling write-back, and invalidates previews when plan or calendar changes.
- [x] Local app write-back accessibility foundation adds described help/status text for preview, acknowledgement, and write-back controls.
- [x] ICS production readiness packet foundation requires explicit recurrence regression, timezone/DST, sync-state idempotency, import preview UX, export privacy redaction, write-back conflict preview, provider-neutral ICS contract, provider fixture suite, large calendar fixture, browser workflow, remote CI, rollback, and second-operator labels, then emits review-only evidence without production sync approval or calendar writes.
- [x] Production ICS workflow approval checklist exists at `docs/security/production-ics-approval-checklist.md` current `FAIL` status, verified local foundations, required PASS evidence, review-only packet command, remaining risk, release rule.
- [x] Production ICS evidence contract foundation in `src/production-ics-evidence-contract.ts` validates provider fixture coverage, recurrence coverage, import/export workflow safety, sync-state idempotency, write-back safety, browser proof, remote CI, rollback, operator approvals, and final audits without approving production ICS.
- [x] Production ICS approval guard foundation verifies the production ICS checklist remains `FAIL`, public release-grade ICS blocker remains unchecked, release-use prohibition remains explicit, required provider/recurrence/import/export/write-back/remote-CI/rollback/operator evidence remains listed, evidence contract/test coverage remains present, local provider fixture evidence remains local-only, and guard audit preserves non-approval caveats.
- [ ] Release-grade ICS workflow: broader provider fixture execution, production import/export workflow, production sync-state idempotency proof, provider write-back proof, remote CI proof, and operator approval.

## Task Import And Provider Gate

- [x] Generic webhook task ingestion local API foundation with signed event-id replay protection.
- [x] JSON task import local API foundation with row-level errors.
- [x] CSV task import local API foundation with row-level errors.
- [x] JSON/CSV task import dry-run preview local API foundation.
- [x] Local CSV task import preview/confirmation UI foundation.
- [x] Provider-specific CSV template API/import workflow foundation.
- [x] Local provider CSV sample download endpoint and app button foundation.
- [x] Local provider CSV template selector and sample-loading UI foundation.
- [x] Local provider CSV multi-row sample fixture provider-aware import confirmation foundation.
- [x] Local provider CSV built-in sample fixture preview validation covers fictional Todoist, Linear, Asana, ClickUp, Trello, Microsoft Planner, and GitHub Issues samples.
- [x] Local provider CSV in-page review gate shows preview rows, provider policy, risk, suggested local throttle policy, and requires explicit review before import. Browser smoke is documented in `docs/release-audit/PROVIDER_CSV_IMPORT_REVIEW_SMOKE_20260722.md`.
- [x] Local provider-specific import policy abuse-summary API foundation.
- [x] Local/self-host import-abuse alert-threshold summary foundation returns `REVIEW_REQUIRED` for configured denied-event or denied-row thresholds.
- [x] Local/self-host provider import policy catalog API foundation exposes copyable `importThrottle.sourcePolicies` output.
- [x] Provider CSV production readiness packet foundation requires explicit real-provider export fixture, download/upload workflow, provider-specific confirmation UX, provider quota governance, browser workflow, abuse analytics, large fixture suite, formula-injection regression, field-mapping privacy, remote CI, and rollback labels, then emits review-only evidence without import approval, import-row mutation, or provider quota mutation.
- [x] Production provider CSV import approval checklist exists at `docs/security/production-provider-csv-approval-checklist.md` current `FAIL` status, verified local foundations, required PASS evidence, review-only packet command, remaining risk, release rule.
- [x] Production provider CSV evidence contract foundation in `src/production-provider-csv-evidence-contract.ts` validates provider fixture breadth, download/upload workflow safety, provider-specific confirmation UX, quota governance, hosted abuse analytics, browser proof, privacy proof, rollback, final audits, operator approval, and second-operator review without approving production provider CSV imports.
- [ ] Production-grade provider CSV import workflow: download/upload polish, broader real-provider export fixture sets beyond fictional built-in samples, provider-specific import confirmation polish beyond local foundation, production provider quota governance, and abuse analytics.

- [x] Production provider CSV approval guard foundation verifies the production provider CSV checklist remains `FAIL`, public production-grade provider CSV blocker remains unchecked, release-use prohibition remains explicit, required fixture/workflow/confirmation/quota/abuse/browser/privacy/remote-CI/rollback/operator evidence remains listed, evidence contract/test coverage remains present, local provider fixture evidence remains local-only, and guard audit preserves non-approval caveats.

## Public Event And Webhook Gate

- [x] Public event-contract catalog API foundation `GET /api/events/catalog` exposes the `ScheduleOSEvent` envelope v1 event type catalog.
- [x] Local/self-host public event read-model API foundation `GET /api/events` returns scoped, content-minimized `ScheduleOSEvent` envelopes from known task import, schedule/replan, block lifecycle, warning, and calendar event audit evidence without webhook secrets or raw target URLs.
- [x] Local/self-host public-event webhook subscription metadata foundation stores scoped subscriptions without returning webhook secrets or raw target URLs.
- [x] Local/self-host public-event webhook subscription delivery execution foundation verifies caller-provided target URL secret against registered hashes, sends matching scoped event types, records attempts, and returns content-minimized attempt views without returning webhook secrets or raw target URLs.
- [x] Local/self-host configured delivery-target reference foundation allows subscription delivery to resolve server-configured target URL/secret pairs while storing and returning only target, secret, and target-reference hashes.
- [x] Local/self-host worker-style public-event webhook subscription delivery foundation `POST /api/events/webhook-subscriptions/deliver-ready` scans enabled scoped subscriptions configured delivery-target references, supports bounded `dryRun`, `maxSubscriptions`, and `maxEvents` operator controls, delivers matching public events, records attempts, and returns content-minimized grouped results without returning webhook secrets, raw target URLs, or raw target references.
- [x] Local/self-host public-event webhook retry execution foundation `POST /api/events/webhook-deliveries/retry-due` retries due failed retryable delivery attempts, increments attempt numbers, records retry attempts, and returns content-minimized attempt views without returning webhook secrets or raw target URLs.
- [x] Local/self-host public-event exhausted-delivery visibility foundation.
- [x] Local/self-host public-event dead-letter review, queue visibility, queue packet, and alert-threshold foundations.
- [x] Public-event receiver verification replay-store guidance foundation in `docs/operations/public-event-webhook-receiver-runbook.md`.
- [x] Public-event delivery operator runbook foundation in `docs/operations/public-event-delivery-operator-runbook.md`.
- [x] Public-events hosted delivery readiness packet foundation requires explicit managed-secret provider, runtime identity, rotation/revocation drill, worker topology, retry queue, dead-letter queue, hosted dashboard, alert routing, replay boundary, rate-limit header key, incident drill, remote CI, and rollback labels, then emits review-only evidence without hosted delivery mutation.
- [x] Production managed-secret and hosted public-event worker approval checklist exists at `docs/security/production-managed-secret-public-event-approval-checklist.md` with current `FAIL` status, verified local foundations, required PASS evidence, review-only packet command, remaining risk, and release rule.
- [x] Hosted public-event delivery contract foundation in `src/hosted-public-event-delivery-contract.ts` validates managed-secret custody, scoped secret refs, runtime identity, least-privilege worker topology, durable retry/dead-letter queues, idempotent delivery, replay protection, observability, alert classes, incident drills, rollback, second-operator review, and privacy-minimized evidence without configuring hosted workers.
- [x] Hosted public-event approval guard foundation verifies the managed-secret public-event approval checklist remains `FAIL`, public hosted-worker blocker remains unchecked, release-use prohibition remains explicit, required managed-secret/runtime/worker/queue/observability/alert/incident/remote-CI/rollback/operator evidence remains listed, evidence contract/test coverage remains present, local contract evidence remains review-only, and guard audit preserves non-approval caveats.
- [ ] Production managed secret storage and durable hosted public-event workers/observability.

## Provider Lifecycle Gate

- [x] Provider-neutral adapter contract validator foundation in `src/provider-adapter-contract.ts` rejects private leadership-only APIs, raw secret storage, missing managed-secret references, unsafe write-back, incomplete revocation safety, missing hosted-alert classes, and non-minimized provider evidence.
- [x] Managed secret storage production contract verification runbook foundation in `docs/operations/managed-secret-storage-runbook.md`.
- [x] Implementation-facing managed secret resolver boundary for public-event delivery target URL and signing-secret refs, with tenant/workspace/purpose scope validation before provider lookup.
- [x] Local/self-host managed-secret resolver audit-evidence foundation records sanitized `MANAGED_SECRET_RESOLUTION_CHECKED` rows for resolved and rejected public-event delivery refs without raw target URLs, signing secrets, or raw secret refs.
- [x] Provider lifecycle production readiness packet foundation requires explicit managed-secret custody, rotation drill, revocation drill, write-back safety, hosted alert routing, provider-specific runbook, remote CI, and rollback labels, then emits review-only provider adapter, sync checkpoint idempotency, quota, and operator-review evidence without provider mutation.
- [x] Provider-specific lifecycle runbook contract foundation requires setup, permissions/scopes, managed-secret custody, rotation, emergency revocation, write-back safety, sync checkpoint recovery, hosted alerts, incident response, rollback, privacy minimization, support escalation, and sanitized evidence examples; `npm run check` verifies the contract remains present.
- [x] Demo calendar provider lifecycle runbook template exists at `docs/operations/providers/demo-calendar-provider-runbook.md` and is validated by `npm run providers:lifecycle-runbook-contract:check` as local/review-only evidence without approving production provider lifecycle support.
- [x] Production provider lifecycle approval checklist exists at `docs/security/production-provider-lifecycle-approval-checklist.md` with current `FAIL` status, verified local foundations, required PASS evidence, review-only packet command, remaining risk, and release rule.
- [x] Production provider lifecycle approval guard foundation verifies the production provider lifecycle checklist remains `FAIL`, public production provider lifecycle blocker remains unchecked, release-use prohibition remains explicit, required provider-specific adapter/webhook/replay/quota/write-back/revocation/hosted-alert/runbook/remote-CI/operator evidence remains listed, runbook contract and provider adapter contract coverage remain present, and guard audit preserves non-approval caveats.
- [ ] Production-grade webhook/provider lifecycle enforcement, provider-specific adapters, hosted operator alerts, and provider-specific rotation/revocation/write-back runbooks.

## Security Controls And Auth Gate

- [x] Static API-key local scope read/write role enforcement foundation.
- [x] Configurable local API request-body size cap foundation.
- [x] Configurable local API rate-limit foundation with env wiring, startup validation, and process-local default buckets.
- [x] Optional local/self-host persisted authenticated request-throttle foundation using hashed scoped keys.
- [x] Local/self-host trusted proxy client IP header foundation for request rate-limit keys.
- [x] Local app/API security-header foundation.
- [x] Local app/API no-store cache-control foundation for JSON, HTML app shell, and CSV export responses.
- [x] Configurable persisted scoped import-row throttle foundation.
- [x] Local/self-host request-abuse summary foundation exposes scoped persisted request-throttle windows, saturated-window counts, retry timing, and truncated SHA-256 key fingerprints without raw bearer tokens, session cookies, client IPs, request paths, request bodies, task titles, calendar titles, or provider identifiers.
- [x] Production rate-limit readiness packet foundation requires explicit edge/gateway policy, distributed throttle store, provider quota policy, trusted proxy proof, hosted alert-routing, hosted dashboard, abuse-analytics, remote CI, rollback, and second-operator labels, then emits review-only evidence requirements without enabling production throttling or mutating quota policy.
- [x] Production rate-limit and abuse-monitoring approval checklist exists at `docs/security/production-rate-limit-approval-checklist.md` with current `FAIL` status, verified local foundations, required PASS evidence, review-only packet command, remaining risk, and release rule.
- [x] Provider quota policy contract foundation in `src/provider-quota-policy.ts` validates distributed store requirement, scoped quota keys, import/export/sync/webhook/write-back operation limits, retry-after guidance, separate enforcement lanes, hosted alert classes, and privacy-minimized quota evidence without enabling production throttling.
- [x] Hosted abuse analytics contract foundation in `src/hosted-abuse-analytics-contract.ts` validates hosted-only evidence, distributed correlation, scoped dimensions, required abuse signals/metrics/alerts, operator dashboards, alert routing, privacy-minimized evidence, and retention/export/deletion controls without configuring hosted monitoring.
- [ ] Production distributed rate limiting, provider-specific quota enforcement, hosted alert delivery/dashboards beyond local summary thresholds, and abuse analytics.
- [x] Production rate-limit approval guard foundation verifies the production rate-limit abuse-monitoring checklist remains `FAIL`, public production distributed rate-limit blocker remains unchecked, release-use prohibition remains explicit, required edge/distributed-store/proxy/provider-quota/hosted-alert/dashboard/abuse-analytics/privacy/remote-CI/operator evidence remains listed, request-abuse summary/provider-quota/hosted-abuse contracts and tests remain present, and guard audit preserves non-approval caveats.
- [x] Mock OwnerOps adapter end-to-end foundation.
- [x] Mock ConnectOS adapter end-to-end foundation.
- [x] Local, SQLite, and PostgreSQL durable auth model repository foundation for users, memberships, roles, sessions, password reset tokens, local API session lifecycle, and owner/admin membership management.
- [x] Local credential-login foundation for active users with versioned scrypt credential hashes and generic invalid-credential failures.
- [x] Local credential-login disabled-user and suspended-membership denial foundation.
- [x] Local standalone app credential login/logout foundation using in-memory bearer fallback or hardened cookie-session CSRF API.
- [x] Local standalone app password reset request/confirm foundation.
- [x] Local API password-reset token scope regression rejects wrong-user and wrong-workspace token consumption while preserving valid same-scope one-time completion.
- [x] Durable credential-attempt backoff foundation.
- [x] Local/self-host production auth startup safety guards for reset-token return, default API key, static API-key scope IDs, public bind without auth, public bind without throttle, public bind without persisted throttle, public bind without durable storage, and insecure production session-cookie configuration.
- [x] Local current-user password-rotation foundation.
- [x] Local owner/admin credential-reset foundation.
- [x] Local standalone app owner/admin user, membership, credential-reset controls plus admin auth runbook foundation.
- [x] Optional local session-cookie transport foundation with HttpOnly SameSite Path cookie, configurable Secure flag, CSRF requirement for cookie-authenticated writes, current-session logout, and cookie clearing.
- [x] Production auth readiness packet foundation requires explicit identity-provider, session-store, authorization matrix, role/membership, session lifecycle, reset-token lifecycle, lockout/pruning, cookie transport, startup guard, migration-plan, rollback-drill, remote CI, and rollback labels, then emits review-only persisted-auth evidence without approving production auth or mutating auth state.
- [x] Production authorization matrix packet foundation emits review-only owner/admin/editor/viewer allow/deny, disabled-user, inactive-membership, cross-scope, private-calendar, revoked-session, and expired-session proof rows with in-repository test evidence references without approving production auth or mutating auth state.
- [x] Production auth approval checklist exists at `docs/security/production-auth-approval-checklist.md` with current `FAIL` status, verified local foundations, required PASS evidence, review-only packet commands, remaining risk, and release rule.
- [x] Production auth evidence contract foundation in `src/production-auth-evidence-contract.ts` validates identity/recovery review, durable hashed session storage, authorization matrix scope boundaries, reset-token lifecycle, cookie/CSRF transport, lockout/retention review, startup guards, migration/rollback, remote CI, browser flows, final audits, and second-operator review without approving production auth.
- [x] Production auth approval guard foundation verifies the auth checklist remains `FAIL`, public production-auth blocker remains unchecked, auth release-use prohibition remains explicit, auth evidence contract/test coverage remains present, and guard audit preserves non-approval caveats.
- [ ] Production persisted auth, roles, memberships, and session model approved for public release.

## Storage Gate

- [x] SQLite backup/restore/export/delete CLI wrapper foundation.
- [x] Local shared exact-confirmation helper for destructive SQLite restore overwrite, workspace delete, and retention cleanup apply commands.
- [x] SQLite encrypted backup/restore foundation.
- [x] SQLite migration foundation.
- [x] PostgreSQL schema migration runner.
- [x] Guarded live PostgreSQL spec.
- [x] Successful local Docker PostgreSQL proof.
- [x] Remote CI PostgreSQL readiness packet foundation emits review-only workflow, PostgreSQL service, migration apply, live repository test, tenant isolation, connection-secret redaction, artifact retention, failure visibility, retry/timeout, rollback/rerun, log-sanitization, and operator-review evidence without creating remotes, editing hosted CI settings, or mutating databases.
- [x] Remote CI PostgreSQL approval checklist exists at `docs/security/remote-ci-postgresql-approval-checklist.md` current `FAIL` status, verified local foundations, required PASS evidence, review-only packet command, remaining risk, release rule.
- [x] Remote CI PostgreSQL evidence contract foundation validates required public workflow, disposable service, migration/test, failure visibility, retry/timeout/rollback, sanitization, final audit, operator, and second-operator evidence shape without approving remote CI proof.
- [x] Remote CI PostgreSQL approval guard foundation verifies the remote CI PostgreSQL checklist remains `FAIL`, public proof blocker remains unchecked, release-use prohibition remains explicit, evidence contract/test coverage remains present, workflow live-test foundation remains wired, and guard audit preserves non-approval caveats.
- [ ] Successful remote CI PostgreSQL proof.
- [x] Production backup restore runbook foundation.
- [x] Tenant isolation verified at current storage boundaries.
- [x] Retention policy duration foundation.
- [x] Local JSON-backed API retention cleanup dry-run/apply foundation including exact confirmation scoped expired/revoked auth-session hash, expired/used password-reset-token hash, and credential-attempt-window pruning without raw secret output.
- [x] Destructive approval readiness packet foundation requires non-empty review-only labels for dry-run diff, fresh backup, restore smoke, exact confirmation, two-operator, legal/support, scope, maintenance window, rollback, audit-retention, hosted scheduler disablement, and remote CI evidence without approving destructive operations or mutating cleanup jobs/records.
- [x] Production hosted retention cleanup approval checklist exists at `docs/security/production-hosted-retention-cleanup-approval-checklist.md` current `FAIL` status, verified local foundations, required PASS evidence, review-only packet commands, remaining risk, release rule.
- [x] Hosted retention approval guard foundation verifies the hosted retention checklist remains `FAIL`, public destructive-operation blocker remains unchecked, release-use prohibition remains explicit, required evidence remains listed, review-only packet boundaries remain present, exact-confirmation helper remains enforced, and guard audit preserves non-approval caveats.
- [x] Hosted retention destructive-operation parity guard foundation verifies hosted cleanup approval stays `FAIL`, public destructive-operation blocker remains unchecked, hosted dry-run/backup/export/legal/support/rollback/scheduler/remote-CI/second-operator evidence remains required, review-only packet boundaries stay explicit, and exact-confirmation destructive helpers remain covered.
- [ ] Hosted retention cleanup production destructive-operation approvals: dry-run evidence, backup evidence, external approval record, legal/support review, rollback plan, second-operator review, hosted scheduler controls, and remote CI proof.

## Documentation Gate

- [x] README.
- [x] LICENSE.
- [x] CONTRIBUTING.
- [x] SECURITY.
- [x] CODE_OF_CONDUCT.
- [x] CHANGELOG.
- [x] `.env.example`.
- [x] Env example boundary guard foundation verifies `.env.example` stays local-only and fictional, keeps safe disabled auth/reset-token defaults, rejects unsafe public-bind or enabled-secret patterns, preserves `.gitignore` env/local-data rules, and verifies deployment, self-hosting, security-audit, startup-test, and release-safety caveats remain present.
- [x] Architecture docs.
- [x] Product model docs.
- [x] Integration docs.
- [x] Self-hosting, deployment, troubleshooting, roadmap, and release checklist drafts.
- [x] README validated clean checkout.
- [x] Documentation link check.

## Security And Privacy Gate

- [ ] Dependency audit final pass.
- [x] Dependency audit readiness packet foundation requires explicit production audit, lockfile, installed tree, runtime inventory, dev dependency exclusion, override review, license alignment, registry secret absence, remote CI, and second-operator labels, then emits review-only evidence without mutating dependencies, package manifests, lockfiles, registries, release gates, remotes, or marking dependency audit `PASS`.
- [x] Final dependency runtime inventory foundation records current direct production dependency, production lockfile packages, development dependency boundary, override review, registry review, release boundary, and is checked by `npm run dependency:runtime-inventory:check` inside `npm run check` without approving dependency audit final pass.
- [x] Final dependency audit approval checklist exists at `docs/security/final-dependency-audit-approval-checklist.md` current `FAIL` status, verified local foundations, required PASS evidence, review-only packet command, remaining risk, release rule.
- [x] Final dependency audit evidence contract foundation validates required npm package-manager, lockfile, production audit, installed tree, runtime inventory, dev dependency boundary, override/registry, final audit, remote CI, and second-operator evidence shape without approving dependency audit final pass.
- [x] Final dependency audit approval guard foundation verifies the dependency audit checklist remains `FAIL`, dependency audit final pass remains unchecked, no local `.git` directory exists, release-use prohibition remains explicit, required production-audit/lockfile/installed-tree/runtime-inventory/dev-exclusion/override/license/registry-secret/remote-CI/second-operator evidence remains listed, evidence contract and runtime inventory remain present, final security and release-gate dependencies remain present, readiness packet wiring remains present, and guard audit preserves non-approval caveats.
- [x] Dependency audit evidence refresh guard foundation verifies package manifest and lockfile dependency surface, public npm registry resolutions, lockfile integrity metadata, no local registry/patch/override configuration, runtime inventory freshness, CI/security/licensing/final-release dependency evidence hooks, dependency final pass remains unchecked, no local `.git` directory exists, and guard audit preserves non-approval caveats.
- [x] Local release safety source scan.
- [x] Release blocker guard foundation verifies the 18 known production/release blockers remain unchecked and release status remains `FAIL` through `npm run release:blockers:check` inside `npm run check`.
- [x] Final audit status guard foundation verifies dependency, security, privacy, and licensing final audit approval checklists remain `FAIL` and their public release checklist gates remain unchecked through `npm run final-audit:status:check` inside `npm run check`.
- [x] Final audit refresh rollup guard foundation verifies dependency/security/privacy/licensing evidence refresh guards remain wired, run before matching final audit approval guards, preserve non-approval audit notes, keep final audit checklists `FAIL`, keep public PASS blockers unchecked, run before final audit status, and preserve no local `.git` boundary.
- [x] Final audit approval parity guard foundation verifies dependency/security/privacy/licensing final audit approval checklists remain `FAIL`, their public PASS blockers stay unchecked, their evidence contracts and approval/refresh guards preserve no-git and non-approval boundaries, final release still depends on all four final audit `PASS` proofs, and README keeps review-only audit packet boundaries.
- [x] Local secret scan.
- [x] Local personal/private data scan.
- [x] Git-history scan or clean-history strategy finalized in `docs/release/repository-readiness.md`.
- [x] First-commit staging manifest guard foundation verifies include/exclude staging rules, `.gitignore` exclusions, no `.git` directory, expected top-level release tree, and keeps clean public history unchecked through `npm run release:first-commit-manifest:check` inside `npm run check`.
- [x] Generated files excluded release safety scan or reviewed generated output.
- [x] Generated artifact review packet foundation emits review-only dist, fixture/template/sample, screenshot/export/backup/log, local path/private URL, provider identifier minimization, license/NOTICE trigger, first-commit staging alignment, local evidence command, and second-operator evidence without approving artifacts or mutating release gates.
- [x] Final security audit readiness packet foundation emits review-only dependency-audit, secret-scan, privacy-scan, production-auth, production-rate-limit, provider-managed-secret, deployment-header, remote-CI, security-contact, final source-review, and second-operator evidence without marking security audit `PASS` or mutating release gates.
- [x] Final security audit approval checklist exists at `docs/security/final-security-audit-approval-checklist.md` current `FAIL` status, verified local foundations, required PASS evidence, review-only packet command, remaining risk, release rule.
- [x] Final security audit evidence contract foundation validates required dependency/supply-chain, scan, auth/access, abuse/provider, deployment, remote CI/repository, disclosure, final review, privacy/licensing, and second-operator evidence shape without approving security audit `PASS`.
- [x] Final security audit approval guard foundation verifies the security audit checklist remains `FAIL`, security audit PASS remains unchecked, no local `.git` directory exists, release-use prohibition remains explicit, required dependency-audit/secret-scan/privacy-scan/auth/rate-limit/provider-secret/deployment/remote-CI/security-contact/source-review/second-operator evidence remains listed, evidence contract and final release dependency remain present, readiness packet wiring remains present, and guard audit preserves non-approval caveats.
- [x] Security audit evidence refresh guard foundation verifies final security audit checklist/evidence contract/scanner/policy evidence surfaces remain current, release safety keeps secret/private-data rules, final release/dependency/privacy/licensing dependencies remain visible, security audit PASS remains unchecked, no local `.git` directory exists, and guard audit preserves non-approval caveats.
- [x] Final privacy audit readiness packet foundation emits review-only release-safety scan, fixture/sample sanitization, generated artifact, logs/screenshots/exports/backups, provider identifier, local path/private URL, private compatible leadership system boundary, calendar/task minimization, AI redaction, retention/export/deletion/provider-revocation, and second-operator evidence without marking privacy audit `PASS` or mutating release gates.
- [x] Standalone privacy audit document exists at `docs/security/privacy-audit.md` with current `FAIL` status, release surfaces, PASS criteria, automated evidence commands, privacy readiness packet boundary, and release rule.
- [x] Final privacy audit approval checklist exists at `docs/security/final-privacy-audit-approval-checklist.md` current `FAIL` status, verified local foundations, required PASS evidence, review-only packet command, remaining risk, release rule.
- [x] Final privacy audit evidence contract foundation validates required release-surface, artifact sanitization, identifier/private-boundary, calendar/task minimization, AI/automation, lifecycle, clean-history, remote CI, security/licensing, repository, and second-operator evidence shape without approving privacy audit `PASS`.
- [x] Final privacy audit approval guard foundation verifies the privacy audit checklist remains `FAIL`, privacy audit PASS remains unchecked, no local `.git` directory exists, release-use prohibition remains explicit, required release-safety/fixture/generated-artifact/log-export-backup/provider-identifier/local-path/private-compatible leadership system/calendar-task/AI/lifecycle/clean-history/remote-CI/security-licensing/second-operator evidence remains listed, evidence contract and final release dependency remain present, readiness packet wiring remains present, and guard audit preserves non-approval caveats.
- [x] Privacy audit evidence refresh guard foundation verifies final privacy audit checklist/evidence contract/privacy-audit/release-safety/SECURITY evidence surfaces remain current, private compatible leadership system boundary, generated-artifact, minimization, AI, lifecycle, clean-history, remote-CI, security/licensing, and second-operator requirements remain visible, privacy audit PASS remains unchecked, no local `.git` directory exists, and guard audit preserves non-approval caveats.
- [ ] Security audit status changed `FAIL` to `PASS`.
- [ ] Privacy audit status changed `FAIL` to `PASS`.

## Licensing Gate

- [x] Root Apache-2.0 license added.
- [x] Initial installed dependency metadata review found only MIT, ISC, and Apache-2.0 licenses.
- [x] Lockfile license review finalized current dependency set through `npm run license:check`.
- [x] Copied-source, fixture, asset, docs, and notice audit complete current tree through expanded `npm run license:check`.
- [x] Final licensing audit readiness packet foundation emits review-only license-check, lockfile, installed dependency metadata, copied-source, fixture/template/example, asset/media/font/binary, documentation reuse, reused-material inventory, NOTICE, root license, final release-candidate, and second-operator evidence without marking licensing audit `PASS` or mutating release gates.
- [x] Final licensing audit readiness packet local evidence command foundation lists `npm run license:check`, `npm ls --omit=dev --all`, `npm run release:safety`, and no-`.git` directory proof as reviewer attachments without replacing reused-material inventory, NOTICE review, release-candidate freeze, remote CI evidence, or second-operator licensing approval.
- [x] Final licensing audit approval checklist exists at `docs/security/final-licensing-audit-approval-checklist.md` current `FAIL` status, verified local foundations, required PASS evidence, review-only packet command, remaining risk, release rule.
- [x] Final licensing audit evidence contract foundation validates required root license, dependency license, copied-source/documentation reuse, fixture/asset/binary, reused-material inventory, NOTICE/distribution, release-candidate, remote CI, clean-history, and second-operator evidence shape without approving licensing audit `PASS`.
- [x] Final licensing audit approval guard foundation verifies the licensing audit checklist remains `FAIL`, licensing audit PASS remains unchecked, no local `.git` directory exists, release-use prohibition remains explicit, required license-check/dependency-tree/lockfile/installed-metadata/copied-source/fixture-template-example/asset-media-font-binary/documentation-reuse/reused-material/NOTICE/root-license/freeze/remote-CI/security-privacy/second-operator evidence remains listed, evidence contract and final release dependency remain present, readiness packet wiring remains present, and guard audit preserves non-approval caveats.
- [x] Licensing audit evidence refresh guard foundation verifies root Apache-2.0 metadata, license file, lockfile license metadata, public registry integrity, license checker rules, licensing audit checklist/evidence contract/licensing-audit/README evidence surfaces, final release/dependency/security/privacy dependencies, licensing audit PASS remains unchecked, no local `.git` directory exists, and guard audit preserves non-approval caveats.
- [ ] Licensing audit status changed `FAIL` to `PASS`.

## Repository Gate

- [x] GitHub name availability checked.
- [x] Repository readiness docs record no `.git` directory strategy and block publication until gates pass.
- [x] Clean public history readiness packet foundation emits review-only no-`.git`-directory, release safety scan, first commit staging manifest, generated artifact review, fixture/sample sanitization, license/notice readiness, repository naming, remote CI plan, and second-operator evidence without initializing git, creating repositories, adding remotes, pushing, tagging, mutating package files, publishing packages, or announcing.
- [x] Clean public history approval checklist exists at `docs/release/clean-public-history-approval-checklist.md` current `FAIL` status, verified local foundations, required PASS evidence, review-only packet command, remaining risk, release rule.
- [x] Clean public history approval guard foundation verifies the clean-history checklist remains `FAIL`, public clean-history blocker remains unchecked, release-use prohibition remains explicit, required staging/sanitization/license/naming/remote-CI evidence remains listed, first-commit manifest include/exclude rules remain guarded, `.gitignore` public-history exclusions remain present, readiness packet remains available, and guard audit preserves non-approval caveats.
- [x] Clean public history staging boundary guard foundation verifies no local `.git` directory exists, current top-level tree stays inside expected release/source/doc/config boundaries, generated/runtime directories remain excluded from first public commit, first-commit manifest and repository readiness keep no-mutation caveats, `.gitignore` preserves local/private exclusions, package wiring remains present, release/audit docs avoid local machine markers, forbidden local/private artifacts are absent outside excluded directories, and guard audit preserves non-approval caveats.
- [x] Public remote CI readiness packet foundation emits review-only public remote workflow run, full local gate, dependency audit, no-`.git`-directory, release safety, docs link, license, log sanitization, artifact retention, branch-protection, public repository settings, and second-operator evidence without creating repositories, initializing git, adding remotes, dispatching workflows, storing CI secrets, mutating branch protection, marking public remote CI verified, pushing, tagging, publishing, or announcing.
- [x] GitHub Actions CI workflow foundation defines manual dispatch, pull request and main-branch triggers, read-only contents permission, concurrency cancellation, bounded quality job, production dependency audit, production dependency tree evidence, bounded PostgreSQL live-service job, and step-summary review notes without creating a remote, dispatching workflow runs, approving remote CI, or marking PostgreSQL proof complete.
- [x] Local CI workflow validation foundation is wired into `npm run check` through `npm run ci:workflow`, with tests proving the future public workflow keeps required release evidence hooks and rejects unsafe release-mutation patterns.
- [x] Public remote CI approval checklist exists at `docs/release/public-remote-ci-approval-checklist.md` current `FAIL` status, verified local foundations, required PASS evidence, review-only packet command, remaining risk, release rule.
- [x] Public remote CI approval guard foundation verifies the public remote CI checklist remains `FAIL`, public remote CI blocker remains unchecked, release-use prohibition remains explicit, required workflow/dependency/log/artifact/repository evidence remains listed, workflow release-gate hooks and forbidden mutation checks remain present, readiness packet remains available, and guard audit preserves non-approval caveats.
- [x] Public remote CI evidence refresh guard foundation verifies the future workflow keeps read-only release evidence and PostgreSQL live-service hooks, rejects publish/release/tag/push/deployment/write-permission/artifact-upload drift, keeps validator/test coverage, preserves public remote CI approval checklist evidence requirements, keeps related repository/dependency/PostgreSQL gate dependencies visible, no local `.git` directory exists, and guard audit preserves non-approval caveats.
- [x] Remote evidence parity guard foundation verifies public remote CI, remote CI PostgreSQL, final release gate, repository launch, clean public history, repository settings, and security contact evidence surfaces remain `FAIL`, preserve aligned final audit/remote-CI/clean-history/repository dependencies, keep public remote CI/PostgreSQL/repository/final audit blockers unchecked, run after public remote CI evidence refresh and before downstream repository approvals, and preserve no local `.git` boundary.
- [x] Repository settings readiness packet foundation emits review-only branch protection, required status checks, security advisory settings, default branch merge policy, maintainer access, dependency alert, secret scanning, release/package permissions, repository metadata, public issue/discussion settings, and second-operator evidence without creating repositories, initializing git, adding remotes, mutating repository settings, mutating branch protection, configuring advisories, changing maintainer access, marking settings configured, pushing, tagging, publishing, or announcing.
- [x] Repository settings approval checklist exists at `docs/release/repository-settings-approval-checklist.md` current `FAIL` status, verified local foundations, required PASS evidence, review-only packet command, remaining risk, release rule.
- [x] Repository settings approval guard foundation verifies the repository settings checklist remains `FAIL`, public repository creation blocker remains unchecked, no local `.git` directory exists, release-use prohibition remains explicit, required target/branch-protection/status-check/security-advisory/merge-policy/maintainer/dependency-alert/secret-scanning/release-permission/metadata/issue-intake/retention/operator evidence remains listed, public remote CI and launch dependencies remain present, and guard audit preserves non-approval caveats.
- [x] Repository naming and trademark approval checklist exists at `docs/release/repository-naming-trademark-approval-checklist.md` current `FAIL` status, refreshed GitHub/public-web review notes, required final evidence, required commands, remaining risk, and release rule.
- [x] Repository naming/trademark approval guard foundation verifies the naming checklist remains `FAIL`, public repository creation blocker remains unchecked, no local `.git` directory exists, release-use prohibition remains explicit, required GitHub namespace/repository path/public-web/trademark/owner/legal/package-name/documentation/second-operator evidence remains listed, repository readiness plus clean-history and launch dependencies remain present, and guard audit preserves non-approval caveats.
- [x] Security policy contact readiness packet foundation requires explicit contact-channel, responsible-party, disclosure-workflow, advisory-settings, response-SLA, escalation-path, private-report-sanitization, remote-CI security workflow, and second-operator labels, then emits review-only evidence without configuring security contacts, mutating SECURITY.md, mutating repository settings, creating repositories, marking security audit `PASS`, publishing packages, or announcing.
- [x] Security policy contact approval checklist exists at `docs/security/security-policy-contact-approval-checklist.md` current `FAIL` status, verified local foundations, required PASS evidence, review-only packet command, remaining risk, release rule.
- [x] Security policy contact approval guard foundation verifies the security contact checklist remains `FAIL`, public security contact blocker remains unchecked, no local `.git` directory exists, release-use prohibition remains explicit, required monitored-contact/advisory-settings/response-SLA/escalation/private-report-sanitization/remote-CI-security/SECURITY.md-review/issue-template-review/second-operator evidence remains listed, final release and public repository launch dependencies remain present, pre-release `SECURITY.md` contact boundary remains intact, readiness packet wiring remains present, and guard audit preserves non-approval caveats.
- [x] Root `SECURITY.md` pre-release policy draft documents unsupported status, private-reporting guidance, monitored-contact prerequisites, advisory response expectations, redaction expectations, destructive-operation evidence expectations, and release-check commands without fictional email addresses or private contact placeholders.
- [x] Local security policy contact checker is wired into `npm run check` and fails if the pre-release `SECURITY.md` draft stops saying the contact is unconfigured, starts using email-shaped contact strings, relies on placeholder/private contact wording, or marks the public checklist contact item complete.
- [x] Public issue-template intake foundation disables blank issues, routes security/private-data reports away from public issues, and requires fictional data plus redaction guidance across bug, feature, integration, and solver-constraint templates.
- [x] Public intake boundary guard foundation verifies blank public issues remain disabled, public security/private-data reports route away from issues, issue templates require fictional data and forbid secrets/private data, PR template keeps release/data-safety checks, CI remains read-only and non-publishing, related audit checklists preserve intake dependencies, no local `.git` directory exists, and guard audit preserves non-approval caveats.
- [x] compatible leadership system public-contract boundary guard foundation verifies compatible leadership system remains optional, ScheduleOS works without compatible leadership system, OwnerOps and ConnectOS remain optional public-contract integrations, compatible leadership system uses the same public scheduling guidance and evidence surfaces available to other compatible leadership systems, hidden private leadership-only APIs remain forbidden, private compatible leadership system reasoning and Business DNA stay outside public ScheduleOS, local API integration tests remain present, final privacy audit leadership-system-boundary coverage remains present, no local `.git` directory exists, and guard audit preserves non-approval caveats.
- [x] Public repository launch approval checklist exists at `docs/release/public-repository-launch-approval-checklist.md` current `FAIL` status, verified local foundations, required PASS evidence, review-only packet command, remaining risk, release rule.
- [ ] Clean public history prepared.
- [ ] CI run verified on public remote.
- [x] Security contact final-status guard foundation verifies the security contact checklist remains `FAIL`, public contact blocker remains unchecked, release-use prohibition remains explicit, pre-release `SECURITY.md` still has no email-shaped contact, existing contact checker remains wired, required contact evidence remains listed, and guard audit preserves non-configuration caveats.
- [ ] Security policy contact configured.
- [x] Public repository launch approval guard foundation verifies the public repository launch checklist remains `FAIL`, public repository creation blocker remains unchecked, no local `.git` directory exists, release-use prohibition remains explicit, required final-release/privacy-secret/license/security/privacy/contact/remote-CI/settings/naming/trademark/staging/operator evidence remains listed, repository readiness and launch packet coverage remain present, and guard audit preserves non-approval caveats.
- [ ] Public repository created only after all gates pass.

## Recent Local Foundations

- [x] Fictional demo workspace foundation validates example data for fixed meetings, flexible deep work, habit-shaped work, deadline-bound tasks, splittable tasks, dependencies, overload, replanning, OwnerOps shape, ConnectOS private calendar shape, compatible leadership system public guidance shape, and no-double-booking scheduling regression without approving production release.
- [x] Fictional demo data boundary guard foundation verifies the canonical demo fixture remains valid JSON with fictional scope IDs and required OwnerOps, ConnectOS, compatible leadership system, overload, dependency, habit, and replanning coverage while rejecting email-shaped strings, credential fields, production provider names, private network markers, and non-fictional demo drift.
- [x] Required product persona validation foundation verifies fictional basic solo user, busy owner, pastor/creative leader, small-team manager, calendar-heavy professional, local-first user, ConnectOS user, and compatible leadership system user scenarios without approving production release.
- [x] Open-source scheduler foundation audit refresh guard verifies `docs/research/open-source-scheduler-audit.md` and the 2026-07-27 refresh keep FluidCalendar, Plazen, Zero Calendar, Super Productivity, KiraPilot, Timefold Solver Java/Kotlin, Timefold Solver Python, and Google OR-Tools review evidence present, preserve Strategy C clean-build recommendation, keep the foundation gate at `PARTIAL PASS`, keep Timefold Solver Java/Kotlin primary-candidate and Google OR-Tools alternate-benchmark positioning, and state the refresh does not approve code copying, dependencies, publication, or release.

- [x] Public release smoke loop foundation verifies fictional standalone planning, manual task creation, fixed commitments, OwnerOps task import, ConnectOS private calendar import, capacity and deadline-risk evidence, accept/lock/replan/complete/replan behavior, and ICS plan export without approving production release.
- [x] Local provider CSV confirmation summary foundation renders provider/source mapping, row count, error count, risk, suggested policy, and remaining production evidence caveats before explicit import review, with standalone web-app tests.
- [x] Final release gate approval checklist exists at `docs/release/final-release-gate-approval-checklist.md` current `FAIL` status, verified local foundations, required PASS evidence, required commands, checklist integrity command, review-only packet command, remaining risk, and release rule.
- [x] Final release gate approval guard foundation verifies the final release checklist remains `FAIL`, no local `.git` directory exists, release-use prohibition remains explicit, required final functionality/documentation/dependency/security/privacy/licensing/public-remote-CI/clean-history/security-contact/repository-settings/naming/source-review/owner/second-operator evidence remains listed, core public release blockers remain unchecked, README release gate remains `FAIL`, readiness packet wiring remains present, and guard audit preserves non-approval caveats.
- [x] ICS monthly `BYHOUR`/`BYMINUTE`/`BYSECOND` time-window recurrence foundation.
- [x] ICS monthly `BYMONTHDAY` plus `BYHOUR`/`BYMINUTE`/`BYSECOND` IANA `TZID` wall-clock recurrence foundation across daylight saving changes.
- [x] ICS import weekly `BYHOUR`/`BYMINUTE`/`BYSECOND` time-window recurrence foundation.
- [x] ICS import weekly `BYDAY` plus `BYHOUR`/`BYMINUTE`/`BYSECOND` IANA `TZID` wall-clock recurrence foundation across daylight saving changes.
- [x] ICS import weekly time-window `BYSETPOS` IANA `TZID` wall-clock recurrence foundation across daylight saving changes.
- [x] ICS import daily `BYSECOND` recurrence foundation.
- [x] ICS import daily `BYHOUR`/`BYMINUTE` time-window recurrence foundation.
- [x] ICS import weekly `WKST` interval-boundary recurrence foundation.
- [x] ICS import weekly `BYDAY` IANA `TZID` wall-clock recurrence foundation across daylight saving changes.
- [x] ICS import weekly `BYDAY` plus `BYMONTH` IANA `TZID` wall-clock recurrence foundation across daylight saving changes.
- [x] ICS import monthly ordinal `BYDAY` IANA `TZID` wall-clock recurrence foundation across daylight saving changes.
- [x] ICS import monthly plain `BYDAY` IANA `TZID` wall-clock recurrence foundation across daylight saving changes.
- [x] ICS import yearly `BYMONTH` ordinal `BYDAY` IANA `TZID` wall-clock recurrence foundation across daylight saving status changes.
- [x] ICS import yearly `BYMONTH` plain `BYDAY` IANA `TZID` wall-clock recurrence foundation across daylight saving changes.
- [x] ICS import yearly `BYYEARDAY` IANA `TZID` wall-clock recurrence foundation across daylight saving changes.
- [x] ICS import yearly `BYWEEKNO` IANA `TZID` wall-clock recurrence foundation across daylight saving changes.
- [x] ICS import daily `BYHOUR`/`BYMINUTE`/`BYSECOND` IANA `TZID` wall-clock recurrence foundation across daylight saving changes.
- [x] ICS import daily time-window `BYSETPOS` IANA `TZID` wall-clock recurrence foundation across daylight saving changes.
- [x] ICS import monthly time-window `BYSETPOS` IANA `TZID` wall-clock recurrence foundation across daylight saving changes.
- [x] ICS import yearly time-window `BYSETPOS` IANA `TZID` wall-clock recurrence foundation across daylight saving status dates.

## Final Rule

ScheduleOS release status remains `FAIL` until every unchecked item above is proven complete by current evidence, remote CI proof exists where required, security/privacy/licensing audits are changed to `PASS`, clean public history is prepared, repository settings are configured, and human release approval is recorded.
