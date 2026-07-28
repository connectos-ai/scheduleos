# Current-State Audit Addendum

Date: 2026-07-21

## Purpose

This addendum supersedes the older release-documentation gap notes in `docs/current-state-audit.md`. It does not change the public release status.

Current release gate: `FAIL`.

## 2026-07-27 Request Abuse Summary Foundation

- Added local/self-host `GET /api/request-abuse/summary` for persisted authenticated request-throttle windows.
- The endpoint returns scoped, content-minimized request-abuse evidence: active windows, saturated windows, request counts, retry timing, and truncated SHA-256 key fingerprints without raw bearer tokens, session cookies, client IPs, request paths, request bodies, task titles, calendar titles, or provider identifiers.
- Added in-memory, SQLite, PostgreSQL, and API test coverage for scoped request-throttle listing, cross-scope denial, saturated-window summary, and raw-token non-disclosure.
- Release remains `FAIL`: this strengthens local request-abuse visibility only. Production rate limiting and abuse monitoring still need edge/gateway policy proof, distributed throttle store proof, trusted proxy proof, provider quota governance, hosted alerts, dashboards, broader abuse analytics, remote CI, rollback, final audits, and second-operator approval.

## 2026-07-27 ICS Provider Fixture Idempotency Regression

- Added `src/ics-provider-fixtures.test.ts` with sanitized provider-shaped ICS fixtures for Google Calendar-style recurrence with `RRULE`/`EXDATE`, Outlook-style all-day private events, and iCloud-style `RDATE` timed events.
- The regression imports each fixture through `/api/calendar-events/ics/import`, verifies expected provider-neutral calendar-event mapping, then reimports the same fixture to prove local idempotency returns zero created events and updates existing events instead of duplicating them.
- Release remains `FAIL`: this strengthens local ICS provider fixture and reimport evidence only. Release-grade ICS still needs real provider fixture execution, production import/export workflow proof, production sync-state idempotency proof against hosted durable storage, provider write-back proof, remote CI proof, rollback proof, final audits, and operator approval.

## 2026-07-27 Provider CSV Export-Shaped Fixture Regression

- Added `src/provider-csv-fixtures.test.ts` with fictional provider export-shaped CSV fixtures for Todoist, Linear, Asana, ClickUp, Trello, Microsoft Planner, and GitHub Issues.
- The regression dry-runs each fixture through `/api/task-sources/csv/import`, verifies source-system mapping plus title, priority, duration, project/list/bucket/repository, tag, and source URL mapping, and confirms dry-runs do not persist tasks.
- Fixture coverage includes quoted commas, unknown extra columns, empty trailing rows, alternate documented aliases, semicolon and pipe tag delimiters, and mixed priority labels.
- Release remains `FAIL`: this strengthens local provider CSV fixture evidence only. Production provider CSV imports still need real-provider export review, production download/upload proof, provider quota governance, hosted abuse analytics, browser workflow proof, remote CI proof, rollback proof, final audits, and second-operator approval.

## 2026-07-27 Local Provider CSV Confirmation Summary Foundation

- Updated the standalone app CSV import flow with an in-page provider confirmation summary that renders provider/source mapping, preview row count, row error count, risk level, suggested provider policy, and remaining production evidence caveats before explicit import review.
- Added standalone web-app test coverage requiring the `csv-import-confirmation` panel and provider confirmation language.
- Release remains `FAIL`: this narrows local provider-specific confirmation UX only. Production provider CSV import still needs broader real-provider export fixture sets, production download/upload polish, provider quota governance, hosted abuse analytics, browser workflow proof, remote CI proof, rollback proof, final audits, clean public history, public repository setup, and second-operator approval.

## 2026-07-23 GitHub Actions CI Workflow Evidence Foundation

- Replaced `.github/workflows/ci.yml` with valid, review-ready GitHub Actions YAML that keeps public CI future-facing only: manual dispatch, pull request and main-branch triggers, read-only contents permission, concurrency cancellation, timeout-bounded quality and PostgreSQL jobs, production dependency audit, production dependency tree evidence, and step-summary review notes.
- Added `src/ci-workflow-validation.ts`, `src/ci-workflow-validation.test.ts`, and `scripts/check-ci-workflow.mjs`, then wired `npm run ci:workflow` into `npm run check` so the future public workflow evidence hooks and release-mutation guardrails are locally enforced.
- Updated public remote CI and remote CI PostgreSQL approval docs to name the workflow foundation while keeping both remote CI gates unchecked.
- Release remains `FAIL`: this narrows workflow readiness only. No public repository exists, no remote workflow has run, PostgreSQL remote CI proof is unavailable, logs/artifacts have not been reviewed, branch protection and repository settings are not configured, second-operator approval is missing, and public release remains blocked.

## 2026-07-23 Final Release Gate Approval Checklist

- Added `docs/release/final-release-gate-approval-checklist.md` to make the final release decision auditable across functionality, storage, documentation, dependency, security, privacy, licensing, remote CI, clean history, security contact, repository settings, naming/trademark, final source/generated-artifact review, owner approval, and second-operator approval.
- Linked the checklist from `docs/public-release-checklist.md` as a checked documentation foundation while keeping all real remaining release blockers unchecked.
- The checklist records required local commands, checklist integrity command, review-only `release:final-gate-readiness-packet` command, remaining risk, and the release rule without approving release, initializing git, creating remotes, pushing, tagging, publishing, deploying, configuring repository settings, configuring security contacts, or announcing ScheduleOS.
- Release remains `FAIL`: this narrows final-release approval traceability only. Production functionality gates, remote CI proof, final dependency/security/privacy/licensing audit `PASS`, clean public history, security policy contact, repository settings, repository naming/trademark approval, public repository setup, owner approval, and second-operator final release approval remain incomplete.

## 2026-07-23 Repository Naming And Trademark Approval Checklist

- Added `docs/release/repository-naming-trademark-approval-checklist.md` to make the public naming, repository target, package naming, and trademark-risk review gate explicit without creating a repository, claiming an organization, initializing git, adding a remote, publishing packages, deploying, or announcing ScheduleOS.
- Refreshed `docs/release/repository-readiness.md` with 2026-07-23 GitHub/public-web name-review notes. The preferred `scheduleos-ai/scheduleos` target remains review-only and unreserved. Exact `ScheduleOS` GitHub search still needs conflict review, and adjacent public `scheduleOS` usage remains a final naming/trademark review item.
- Linked the checklist from `docs/public-release-checklist.md` while keeping public repository creation and clean public history gates unchecked.
- Release remains `FAIL`: this narrows naming/trademark approval traceability only. Final GitHub namespace proof, exact and variant repository search proof, public-web search proof, official trademark search evidence, legal/owner naming decision, package-name review, launch-copy consistency review, second-operator review, public repository setup, clean public history, remote CI, final security/privacy/licensing/dependency approvals, and release approval remain incomplete.

## 2026-07-23 Repository Settings Approval Checklist

- Added `docs/release/repository-settings-approval-checklist.md` to make public repository settings reviewable without creating a repository, mutating branch protection, configuring advisories, changing maintainer access, or marking settings configured.
- The checklist records current repository settings readiness foundations, required public-repository settings evidence, required verification commands, the review-only `repository:settings-readiness-packet` command, remaining risk, and the release rule.
- Release remains `FAIL`: this narrows repository-settings approval traceability only. Actual public repository settings, branch protection, required checks, advisory/private vulnerability reporting, maintainer access, dependency alerts, secret scanning, release/package permissions, repository metadata, issue/discussion settings, second-operator review, public repository setup, and release approval remain incomplete.

## 2026-07-23 Public Repository Launch Approval Checklist

- Added `docs/release/public-repository-launch-approval-checklist.md` to make the public repository creation gate reviewable without creating a repository, initializing git, adding a remote, pushing commits, tagging releases, publishing packages, or announcing ScheduleOS.
- The checklist records current repository readiness foundations, required final release evidence, required verification commands, the review-only `repository:launch-readiness-packet` command, remaining risk, and the release rule.
- Release remains `FAIL`: this narrows public repository launch approval traceability only. Final release gate proof, clean public history `PASS`, security/privacy/licensing/dependency audit approval, public remote CI proof, security contact configuration, repository settings, name/trademark review, first-commit staging approval, owner approval, and second-operator review remain incomplete.

## 2026-07-23 Security Policy Contact Approval Checklist

- Added `docs/security/security-policy-contact-approval-checklist.md` to make the security policy contact gate reviewable without configuring contacts, editing repository settings, creating a repository, or marking security audit `PASS`.
- The checklist records current `SECURITY.md` and issue-template foundations, required monitored-contact evidence, required verification commands, the review-only `security:policy-contact-readiness-packet` command, remaining risk, and the release rule.
- Release remains `FAIL`: this narrows security policy contact approval traceability only. Real monitored reporting path proof, responsible maintainer coverage, disclosure workflow, repository advisory settings, response SLA, escalation path, private-report sanitization process, remote CI security proof, final `SECURITY.md` update, second-operator review, public repository setup, and release approval remain incomplete.

## 2026-07-23 Public Remote CI Approval Checklist

- Added `docs/release/public-remote-ci-approval-checklist.md` to make the public remote CI gate reviewable without creating a repository, initializing git, adding a remote, dispatching workflows, or mutating repository settings.
- The checklist records current local gate foundations, required public-repository CI evidence, required verification commands, the review-only `remote-ci:public-readiness-packet` command, remaining risk, and the release rule.
- Release remains `FAIL`: this narrows public remote CI approval traceability only. Real public workflow run proof, required-check proof, production dependency audit proof, log and artifact review, branch protection, repository settings, PostgreSQL remote CI proof where required, second-operator review, public repository setup, and release approval remain incomplete.

## 2026-07-23 Clean Public History Approval Checklist

- Added `docs/release/clean-public-history-approval-checklist.md` to make the clean public history gate reviewable without initializing git or creating a public repository.
- The checklist records current no-`.git` foundations, repository readiness docs, first-commit staging manifest, required PASS evidence, required verification commands, the review-only `repository:clean-history-readiness-packet` command, remaining risk, and the release rule.
- Release remains `FAIL`: this narrows clean-public-history approval traceability only. Final release-candidate gate alignment, staging manifest approval, generated artifact review, fixture/sample sanitization, license/NOTICE readiness, repository naming review, remote CI plan approval, second-operator review, intentional git initialization, public repository setup, and release approval remain incomplete.

## 2026-07-23 Final Licensing Audit Approval Checklist

- Added `docs/security/final-licensing-audit-approval-checklist.md` to make the final licensing audit `PASS` gate reviewable without closing it.
- The checklist records current local licensing foundations, required PASS evidence, required verification commands, the review-only `licensing:final-audit-readiness-packet` command, remaining risk, and the release rule.
- Release remains `FAIL`: this narrows final licensing-audit approval traceability only. Final release-candidate license check, reused-material inventory approval, NOTICE review, remote CI proof, final release-candidate freeze, public repository setup, second-operator review, and release approval remain incomplete.

## 2026-07-23 Final Privacy Audit Approval Checklist

- Added `docs/security/final-privacy-audit-approval-checklist.md` to make the final privacy audit `PASS` gate reviewable without closing it.
- The checklist records current local privacy foundations, required PASS evidence, required verification commands, the review-only `privacy:final-audit-readiness-packet` command, remaining risk, and the release rule.
- Release remains `FAIL`: this narrows final privacy-audit approval traceability only. Final release-candidate privacy scans, generated artifact review, provider identifier review, private compatible leadership system boundary proof, clean public history, remote CI, security contact configuration, public repository setup, second-operator review, and release approval remain incomplete.

## 2026-07-23 Final Security Audit Approval Checklist

- Added `docs/security/final-security-audit-approval-checklist.md` to make the final security audit `PASS` gate reviewable without closing it.
- The checklist records current local security foundations, required PASS evidence, required verification commands, the review-only `security:final-audit-readiness-packet` command, remaining risk, and the release rule.
- Release remains `FAIL`: this narrows final security-audit approval traceability only. Production auth approval, production rate-limit proof, provider managed-secret lifecycle proof, production deployment proof, remote CI proof, security policy contact configuration, final source review, privacy/licensing alignment, second-operator review, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Final Dependency Audit Approval Checklist

- Added `docs/security/final-dependency-audit-approval-checklist.md` to make the dependency audit final pass gate reviewable without closing it.
- The checklist records current local dependency-audit foundations, required PASS evidence, required verification commands, the review-only `dependency:final-audit-readiness-packet` command, remaining risk, and the release rule.
- Release remains `FAIL`: this narrows final dependency-audit approval traceability only. Release-candidate lockfile freeze, installed tree review, runtime inventory, dev dependency exclusion, override review, registry-secret absence review, remote CI proof, final security/privacy/licensing audit alignment, second-operator review, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Remote CI PostgreSQL Approval Checklist

- Added `docs/security/remote-ci-postgresql-approval-checklist.md` to make the successful remote CI PostgreSQL proof gate reviewable without closing it.
- The checklist records current local PostgreSQL foundations, required PASS evidence, required verification commands, the review-only `remote-ci:postgres-readiness-packet` command, remaining risk, and the release rule.
- Release remains `FAIL`: this narrows remote CI PostgreSQL approval traceability only. A real public-repository CI workflow run, remote PostgreSQL service proof, clean migration apply proof, live repository test proof, tenant-isolation regression, connection-secret redaction, artifact retention, failure visibility, retry/timeout proof, rollback/rerun proof, log sanitization, second-operator review, final audits, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Production Hosted Retention Cleanup Approval Checklist

- Added `docs/security/production-hosted-retention-cleanup-approval-checklist.md` to make the hosted retention cleanup destructive-operation approval gate reviewable without closing it.
- The checklist records current local/self-host retention cleanup foundations, required PASS evidence, required verification commands, review-only hosted cleanup and destructive approval packet commands, remaining risk, and the release rule.
- Release remains `FAIL`: this narrows hosted retention cleanup approval traceability only. Hosted dry-run evidence, fresh backup and restore proof, external approval workflow, legal/support review, hosted scheduler controls, operator visibility, rollback proof, remote CI proof, final audits, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Production Provider CSV Import Approval Checklist

- Added `docs/security/production-provider-csv-approval-checklist.md` to make the production-grade provider CSV import workflow gate reviewable without closing it.
- The checklist records current local provider CSV foundations, required PASS evidence, required verification commands, the review-only `provider-csv:production-readiness-packet` command, remaining risk, and the release rule.
- Release remains `FAIL`: this narrows provider CSV production-readiness approval traceability only. Download/upload polish, broader real-provider export fixture execution, provider-specific confirmation polish, production quota governance proof, hosted abuse analytics proof, browser workflow proof, remote CI proof, rollback proof, final audits, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Production ICS Workflow Approval Checklist

- Added `docs/security/production-ics-approval-checklist.md` to make the release-grade ICS workflow gate reviewable without closing it.
- The checklist records current local ICS foundations, required PASS evidence, required verification commands, the review-only `ics:production-readiness-packet` command, remaining risk, and the release rule.
- Release remains `FAIL`: this narrows ICS production-readiness approval traceability only. Broader real-provider fixture execution, production import/export workflow, production sync-state idempotency proof, provider write-back proof, browser workflow approval, remote CI proof, rollback proof, final audits, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Production Calendar UI Approval Checklist

- Added `docs/security/production-calendar-ui-approval-checklist.md` to make the production calendar UI hardening gate reviewable without closing it.
- The checklist records current local calendar UI foundations, required PASS evidence, required verification commands, the review-only `calendar-ui:production-readiness-packet` command, remaining risk, and the release rule.
- Release remains `FAIL`: this narrows calendar UI production-readiness approval traceability only. Production browser matrix evidence beyond local Chrome smoke, interactive conflict-preview workflow beyond local render smoke, accessibility pass, responsive polish, product-owner visual approval, second-operator review, remote CI proof, rollback proof, final audits, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Production Web App Approval Checklist

- Added `docs/security/production-web-app-approval-checklist.md` to make the standalone production web app gate reviewable without closing it.
- The checklist records current local app foundations, required PASS evidence, required verification commands, the review-only `web-app:production-readiness-packet` command, remaining risk, and the release rule.
- Release remains `FAIL`: this narrows standalone web app production-readiness approval traceability only. Production build/deployment proof, authenticated write-flow proof, production browser matrix, accessibility audit, responsive polish, visual regression, operator review, second-operator review, remote CI proof, rollback proof, final audits, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Hosted Retention Cleanup Evidence Label Update

- Hardened `retention:hosted-cleanup-packet` so release reviewers must provide explicit `--dry-run-evidence`, `--backup-evidence`, `--approval-record`, `--legal-support-review`, `--rollback-plan`, and `--second-operator` labels in addition to the maintenance window.
- Packet output now carries those evidence labels and review steps without scheduling hosted cleanup, approving destructive operations, applying retention cleanup, deleting records, or creating external approval records.
- Release remains `FAIL`: this narrows hosted retention cleanup destructive-operation review traceability only. Production hosted scheduler controls, production external approval workflow, legal/security signoff, remote CI proof, final security/privacy/licensing approval, public repository gates, and release approval remain incomplete.

## 2026-07-23 Production Deployment Second-Operator Evidence Update

- Hardened `deployment:production-readiness-packet` so release reviewers must provide explicit `--second-operator` evidence separate from `--operator-review`.
- Packet output now carries separate `operatorReview` and `secondOperator` labels, plus separate operator-review and second-operator evidence/review-step text without approving production deployment, configuring hosting, mutating DNS, writing secrets, starting services, creating remotes, publishing packages, or announcing ScheduleOS.
- Release remains `FAIL`: this narrows production deployment review traceability only. TLS/proxy/header deployment proof, startup/health proof, durable production storage proof, trusted proxy/throttle proof, remote CI deployment smoke proof, final security/privacy/licensing approval, public repository gates, and release approval remain incomplete.

## 2026-07-23 Calendar UI Second-Operator Evidence Update

- Hardened `calendar-ui:production-readiness-packet` so release reviewers must provide explicit `--second-operator` evidence alongside browser matrix, conflict workflow, write-back acknowledgement, accessibility, responsive polish, visual regression, product-owner approval, remote CI, and rollback labels.
- Packet output now carries `secondOperator`, `requiresSecondOperatorProof`, and second-operator evidence/review-step text without approving production UI, mutating schedules/calendar events, replacing browser/accessibility evidence, granting product-owner approval, or completing remote CI/security approval.
- Release remains `FAIL`: this narrows calendar UI production-readiness review traceability only. Production calendar UI hardening, browser matrix evidence beyond local smoke, interactive conflict-preview workflow beyond local render smoke, accessibility pass, responsive polish, product-owner visual approval, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 ICS Second-Operator Evidence Label Hardening

- Updated `ics:production-readiness-packet` to require and emit explicit `secondOperator` evidence alongside recurrence regression, timezone/DST, sync-state idempotency, import preview UX, export privacy redaction, write-back conflict preview, provider-neutral contract, provider fixture suite, large calendar fixture, browser workflow, remote CI, and rollback labels.
- Added blank-label rejection coverage for the ICS second-operator label so the packet cannot emit release-grade ICS readiness language with omitted independent operator approval evidence.
- Release remains `FAIL`: this narrows ICS production-readiness review traceability only. Release-grade ICS workflow still needs broader provider fixture execution, production import/export workflow, production sync-state idempotency proof, provider write-back proof, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval.

## 2026-07-23 Production Rate-Limit Second-Operator Evidence Label Hardening

- Updated `rate-limit:production-readiness-packet` to require and emit explicit `secondOperator` evidence alongside edge/gateway policy, distributed throttle store, provider quota policy, trusted proxy proof, hosted alert routing, hosted dashboard, abuse analytics, remote CI, and rollback labels.
- Added blank-label rejection coverage for the rate-limit second-operator label so the packet cannot emit production distributed rate-limit readiness language with omitted independent operator review evidence.
- Release remains `FAIL`: this narrows production rate-limit review traceability only. Production distributed rate limiting, provider-specific quota enforcement, hosted alert delivery/dashboards beyond local summary thresholds, abuse analytics, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Production Auth Second-Operator Evidence Label Hardening

- Updated `auth:production-readiness-packet` to require and emit explicit `secondOperator` evidence alongside identity-provider, session-store, authorization matrix, role/membership, session lifecycle, reset-token lifecycle, lockout/pruning, cookie transport, startup guard, migration-plan, rollback-drill, remote CI, and rollback labels.
- Preserved review-only behavior: the packet does not approve production auth, mutate users, create sessions, rotate credentials, run migrations, change cookie policy, or close production persisted-auth blockers.
- Release remains `FAIL`: this narrows production auth review traceability only. Production persisted auth, roles, memberships, session model approval, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Provider Lifecycle Second-Operator Evidence Label Hardening

- Updated `providers:lifecycle-readiness-packet` to require and emit explicit `secondOperator` evidence alongside existing managed-secret custody, rotation/revocation drills, write-back safety, hosted alert routing, provider-specific runbook, remote CI, and rollback labels.
- Added blank-label rejection coverage for the provider lifecycle second-operator label so the packet cannot emit provider lifecycle readiness language with omitted independent operator review evidence.
- Release remains `FAIL`: this narrows provider lifecycle review traceability only. Production-grade webhook/provider lifecycle enforcement, provider-specific adapters, hosted operator alerts, provider-specific rotation/revocation/write-back runbooks, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Hosted Delivery Second-Operator Evidence Label Hardening

- Updated `public-events:hosted-delivery-readiness-packet` to require and emit explicit `secondOperator` evidence alongside existing managed-secret provider, runtime identity, rotation drill, worker topology, retry queue, dead-letter queue, hosted dashboard, alert routing, replay boundary, rate-limit header key, incident drill, remote CI, and rollback labels.
- Added blank-label rejection coverage for the hosted delivery second-operator label so the packet cannot emit hosted delivery readiness language with omitted independent operator review evidence.
- Release remains `FAIL`: this narrows hosted delivery production-readiness review traceability only. Real production managed secret storage, durable subscription delivery workers, durable hosted retry workers, hosted delivery operations, hosted observability, hosted alert routing, remote CI proof, final audits, clean public history, and owner approval remain incomplete.

## 2026-07-23 Provider CSV Second-Operator Evidence Label Hardening

- Updated `provider-csv:production-readiness-packet` to require and emit explicit `secondOperator` evidence alongside existing real-provider fixture, download/upload workflow, confirmation UX, provider policy, browser workflow, abuse analytics, large fixture, formula-injection, field-mapping privacy, remote CI, and rollback labels.
- Added blank-label rejection coverage for the provider CSV second-operator label so the packet cannot emit production provider CSV readiness language with omitted independent operator review evidence.
- Release remains `FAIL`: this narrows provider CSV production-readiness review traceability only. Real production-grade provider CSV download/upload polish, broader real-provider export fixture execution, provider-specific confirmation polish, production quota governance proof, hosted abuse analytics proof, browser workflow proof, remote CI proof, final audits, clean public history, and owner approval remain incomplete.

## 2026-07-23 Standalone Web App Responsive/Review Evidence Hardening

- Updated `web-app:production-readiness-packet` to require and emit explicit `responsivePolish`, `visualRegression`, `operatorReview`, and `secondOperator` labels in addition to existing production build, authenticated write-flow, security, storage, browser, accessibility, remote CI, and rollback labels.
- Added blank-label rejection coverage for the new standalone web app production evidence labels so the packet cannot emit production web app readiness language with omitted responsive polish, visual regression, operator review, or second-operator evidence.
- Release remains `FAIL`: this narrows standalone web app production-readiness review traceability only. Real production build/deployment proof, authenticated write-flow proof, production browser matrix, accessibility audit, responsive polish, visual regression, operator review, remote CI, rollback proof, final audits, clean public history, and owner approval remain incomplete.

## 2026-07-23 Repository Launch Evidence Label Hardening

- Updated `repository:launch-readiness-packet` to require and emit explicit `finalReleaseGate`, `cleanPublicHistory`, `privacySecretScan`, `licenseAuditPass`, `securityAuditPass`, `securityPolicyContact`, `remoteCiPass`, `nameCollisionReview`, `trademarkReview`, `firstCommitStaging`, `repositorySettings`, and `secondOperator` labels.
- Added blank-label rejection coverage for every repository launch evidence label so the packet cannot emit repository launch readiness language with omitted final release gate, clean public history, privacy/secret scan, licensing audit, security audit, security contact, remote CI, name collision, trademark, first commit staging, repository settings, or second-operator evidence.
- Release remains `FAIL`: this narrows repository-launch review traceability only. Public repository creation remains incomplete until every release gate passes, clean public history is prepared, remote CI is verified, security contact and repository settings are configured, second-operator review is complete, and owner approval allows publication.

## 2026-07-23 Repository Settings Evidence Label Hardening

- Updated `repository:settings-readiness-packet` to require and emit explicit `branchProtectionSettings`, `requiredStatusChecks`, `securityAdvisorySettings`, `defaultBranchMergePolicy`, `maintainerAccessReview`, `dependabotAlerts`, `secretScanningPushProtection`, `releasePackagePermissions`, `repositoryMetadata`, `publicIssueDiscussionSettings`, and `secondOperator` labels.
- Added blank-label rejection coverage for every repository settings evidence label so the packet cannot emit repository settings readiness language with omitted branch protection, required status checks, security advisory settings, default branch merge policy, maintainer access, Dependabot alerts, secret scanning push protection, release/package permissions, repository metadata, public issue/discussion settings, or second-operator evidence.
- Release remains `FAIL`: this narrows repository-settings review traceability only. Actual public repository settings, branch protection, security advisory settings, maintainer access, public remote CI, clean public history, and release approval remain incomplete.

## 2026-07-23 Public Remote CI Evidence Label Hardening

- Updated `remote-ci:public-readiness-packet` to require and emit explicit `workflowRun`, `checkRun`, `productionDependencyAudit`, `noGitDirectory`, `releaseSafetyScan`, `docsLinkCheck`, `licenseCheck`, `logSanitization`, `artifactRetention`, `branchProtectionReview`, `repositorySettingsReadiness`, and `secondOperator` labels.
- Added blank-label rejection coverage for every public remote CI evidence label so the packet cannot emit public remote CI readiness language with omitted workflow run, `npm run check`, production dependency audit, no-`.git` proof, release safety, docs link check, license check, log sanitization, artifact retention, branch protection or required-checks review, repository settings readiness, or second-operator evidence.
- Release remains `FAIL`: this narrows public remote CI review traceability only. Public remote CI remains incomplete until a real remote workflow run passes after all release gates, logs and artifacts are reviewed, repository settings are configured, and second-operator review is complete.

## 2026-07-23 Clean History Evidence Label Hardening

- Updated `repository:clean-history-readiness-packet` to require and emit explicit `noGitDirectory`, `releaseSafetyScan`, `firstCommitStagingManifest`, `generatedArtifactReview`, `fixtureSanitization`, `licenseNoticeReadiness`, `repositoryNaming`, `remoteCiPlan`, and `secondOperator` labels.
- Added blank-label rejection coverage for every clean-history evidence label so the packet cannot emit clean public history readiness language with omitted no-`.git` proof, release safety scan, first-commit staging manifest, generated artifact review, fixture/sample sanitization, license/NOTICE readiness, repository naming, remote CI plan, or second-operator evidence.
- Release remains `FAIL`: this narrows clean-history review traceability only. Clean public history remains incomplete until all release gates pass, second-operator review occurs, git is intentionally initialized from the approved release-candidate tree, and the first public commit is created without private history.

## 2026-07-23 Final Licensing Audit Evidence Label Hardening

- Updated `licensing:final-audit-readiness-packet` to require and emit explicit `finalLicenseCheck`, `lockfileDependencyLicenses`, `installedDependencyMetadata`, `copiedSourceScan`, `fixtureTemplateExampleReview`, `assetMediaFontBinaryReview`, `documentationReuseScan`, `reusedMaterialInventory`, `noticeReview`, `rootLicenseConsistency`, `finalReleaseCandidateFreeze`, and `secondOperator` labels.
- Added blank-label rejection coverage for every final licensing audit evidence label so the packet cannot emit final licensing audit readiness language with omitted license check, lockfile dependency license, installed dependency metadata, copied-source scan, fixture/template/example, asset/media/font/binary, documentation reuse, reused-material inventory, NOTICE, root Apache-2.0 consistency, release-candidate freeze, or second-operator evidence.
- Release remains `FAIL`: this narrows final-licensing-audit review traceability only. Final licensing audit `PASS`, reused-material inventory approval, NOTICE review, release-candidate freeze, second-operator review, public repository gates, and release approval remain incomplete.

## 2026-07-23 Final Privacy Audit Evidence Label Hardening

- Updated `privacy:final-audit-readiness-packet` to require and emit explicit `releaseSafetyScan`, `fixtureSanitization`, `generatedArtifactReview`, `logExportBackupReview`, `providerIdentifierReview`, `localPathPrivateUrlReview`, `privateLeadershipBoundary`, `calendarTaskMinimization`, `aiRedactionBoundary`, `retentionExportDeletionRevocation`, and `secondOperator` labels.
- Added blank-label rejection coverage for every final privacy audit evidence label so the packet cannot emit final privacy audit readiness language with omitted release safety, fixture/sample sanitization, generated artifact, log/export/backup, provider identifier, local path/private URL, private compatible leadership system boundary, calendar/task minimization, AI redaction, retention/export/deletion/revocation, or second-operator evidence.
- Release remains `FAIL`: this narrows final-privacy-audit review traceability only. Final privacy audit `PASS`, release-candidate privacy scan, generated artifact review, provider identifier review, private compatible leadership system boundary proof, second-operator review, public repository gates, and release approval remain incomplete.

## 2026-07-23 Final Security Audit Evidence Label Hardening

- Updated `security:final-audit-readiness-packet` to require and emit explicit `dependencyAuditPass`, `secretScan`, `privacyScan`, `productionAuth`, `roleMembership`, `resetTokenLifecycle`, `rateLimitAbuseMonitoring`, `providerManagedSecretLifecycle`, `deploymentTlsProxyHeaders`, `remoteCi`, `securityPolicyContact`, `finalSourceReview`, and `secondOperator` labels.
- Added blank-label rejection coverage for every final security audit evidence label so the packet cannot emit final security audit readiness language with omitted dependency audit, secret scan, privacy scan, production auth, role/membership, reset-token lifecycle, rate-limit/abuse-monitoring, provider managed-secret lifecycle, deployment TLS/proxy/header, remote CI, security contact, final source review, or second-operator evidence.
- Release remains `FAIL`: this narrows final-security-audit review traceability only. Final security audit `PASS`, production auth approval, production rate-limit proof, provider managed-secret lifecycle proof, deployment proof, remote CI proof, security contact configuration, second-operator review, public repository gates, and release approval remain incomplete.

## 2026-07-23 Final Release Gate Evidence Label Hardening

- Updated `release:final-gate-readiness-packet` to require and emit explicit `functionalityGate`, `storageGate`, `documentationGate`, `securityAuditPass`, `licensingAuditPass`, `privacyAuditPass`, `dependencyAuditFinalPass`, `remoteCiPass`, `cleanHistory`, `securityPolicyContact`, `repositorySettings`, `finalSourceReview`, and `secondOperator` labels.
- Added blank-label rejection coverage for every final release gate evidence label so the packet cannot emit final release readiness language with omitted functionality, storage, documentation, security audit, licensing audit, privacy audit, dependency audit, remote CI, clean history, security contact, repository settings, final source review, or second-operator approval evidence.
- Release remains `FAIL`: this narrows final-release review traceability only. Final functionality/storage/documentation gates, security/licensing/privacy audit `PASS`, dependency audit final pass, remote CI proof, clean public history, security contact configuration, public repository settings, second-operator release approval, public repository creation, publication, and announcement remain incomplete.

## 2026-07-23 Security Policy Contact Evidence Label Hardening

- Updated `security:policy-contact-readiness-packet` to require and emit explicit `contactChannel`, `responsibleParty`, `disclosureWorkflow`, `advisorySettings`, `responseSla`, `escalationPath`, `privateReportSanitization`, `remoteCiSecurityWorkflow`, and `secondOperator` labels.
- Added blank-label rejection coverage for every new security-contact evidence label so the packet cannot emit readiness language with omitted disclosure workflow, advisory settings, response SLA, escalation path, private report sanitization, remote CI security workflow, or second-operator evidence.
- Release remains `FAIL`: this narrows security-contact review traceability only. Real monitored contact setup, repository security advisory settings, remote CI security workflow proof, second-operator review, final security audit `PASS`, public repository gates, and release approval remain incomplete.

## 2026-07-23 Security Policy Draft Hardening

- Expanded root `SECURITY.md` with explicit pre-release status, unsupported-version table, private-reporting guidance, monitored-contact prerequisites, advisory response expectations, redaction expectations, destructive-operation evidence expectations, and required release commands.
- Kept the policy free of fictional email addresses, personal contact details, private workspace URLs, and unmonitored placeholder channels.
- Release remains `FAIL`: this improves the policy draft only. A real monitored security contact, repository private vulnerability reporting or advisory settings, remote CI security workflow proof, second-operator review, and final security audit `PASS` remain incomplete.

## 2026-07-23 Public Issue Intake Safety Hardening

- Added `.github/ISSUE_TEMPLATE/config.yml` to disable blank issues and route security vulnerability or private-data exposure reports away from public issues toward the eventual private vulnerability reporting path.
- Rewrote bug, feature, integration, and solver-constraint issue templates with explicit fictional-data requirements, redaction expectations, and public-issue boundaries for secrets, provider credentials, calendar/task/customer data, screenshots, exports, logs, callback URLs, and private workspace details.
- Release remains `FAIL`: this hardens public repository intake only. It does not create the public repository, configure the real security contact, enable repository advisories, prove remote CI, complete second-operator review, or mark security audit `PASS`.

## 2026-07-23 Standalone Privacy Audit Document Foundation

- Added `docs/security/privacy-audit.md` with explicit current `FAIL` status, privacy posture, release surfaces to review, PASS requirements, automated local evidence commands, `privacy:final-audit-readiness-packet` boundary, remaining risk, and release rule.
- Updated root `SECURITY.md` to link the standalone privacy audit alongside security and licensing audits.
- Added checklist coverage proving the privacy audit artifact exists without changing privacy audit status to `PASS`.
- Release remains `FAIL`: this creates privacy audit structure only. Final release-candidate privacy review, generated artifact review, screenshot/log/export review, clean public history, remote CI proof, second-operator approval, and privacy audit `PASS` remain incomplete.

## 2026-07-23 Production Auth Approval Checklist Foundation

- Added `docs/security/production-auth-approval-checklist.md` with explicit current `FAIL` status, verified local auth foundations, required PASS evidence, local evidence commands, review-only auth packet commands, remaining risk, and release rule.
- Linked the checklist from `docs/security/auth-model.md` and `docs/operations/admin-auth-runbook.md` so production auth approval has one canonical review target.
- Added checklist coverage proving the production auth approval checklist exists without marking production persisted auth approved.
- Release remains `FAIL`: this creates production auth approval structure only. Identity-provider strategy, durable production session-store approval, full authorization matrix review, reset-token/recovery policy, production lockout/backoff, migration/rollback proof, browser verification, remote CI proof, second-operator approval, and final audits remain incomplete.

## 2026-07-23 Production Rate-Limit Approval Checklist Foundation

- Added `docs/security/production-rate-limit-approval-checklist.md` with explicit current `FAIL` status, verified local rate-limit and abuse-monitoring foundations, required PASS evidence, local evidence commands, review-only rate-limit packet command, remaining risk, and release rule.
- Linked the checklist from `docs/security/threat-model.md` so production abuse-protection approval has one canonical review target.
- Added checklist coverage proving the production rate-limit approval checklist exists without marking distributed production rate limiting, hosted alerting, dashboards, or abuse analytics approved.
- Release remains `FAIL`: this creates production rate-limit approval structure only. Edge/gateway proof, distributed throttle store approval, provider quota governance, trusted proxy verification, hosted alert routing, hosted dashboards, abuse analytics, rollback proof, remote CI proof, second-operator approval, and final audits remain incomplete.

## 2026-07-23 Production Managed Secret And Hosted Worker Approval Checklist Foundation

- Added `docs/security/production-managed-secret-public-event-approval-checklist.md` with explicit current `FAIL` status, verified local managed-secret/public-event foundations, required PASS evidence, local evidence commands, review-only hosted delivery packet command, remaining risk, and release rule.
- Linked the checklist from `docs/operations/managed-secret-storage-runbook.md` and `docs/operations/public-event-delivery-operator-runbook.md` so managed-secret and hosted public-event worker approval has one canonical review target.
- Added checklist coverage proving the managed-secret/hosted-worker approval checklist exists without marking production managed secret storage, durable hosted workers, observability, or alert routing approved.
- Release remains `FAIL`: this creates production managed-secret and hosted-worker approval structure only. Managed secret provider selection, runtime identity policy, rotation/revocation drill, durable subscription workers, hosted retry and dead-letter queues, dashboards, alert routing, incident drill, remote CI proof, second-operator approval, and final audits remain incomplete.

## 2026-07-23 Production Provider Lifecycle Approval Checklist Foundation

- Added `docs/security/production-provider-lifecycle-approval-checklist.md` with explicit current `FAIL` status, verified local provider lifecycle foundations, required PASS evidence, local evidence commands, review-only provider lifecycle packet command, remaining risk, and release rule.
- Linked the checklist from `docs/integrations/webhook-provider-policy.md`, `docs/integrations/calendar-providers.md`, and `docs/integrations/task-sources.md` so production provider lifecycle approval has one canonical review target.
- Added checklist coverage proving the provider lifecycle approval checklist exists without marking provider-specific adapters, hosted alerts, rotation/revocation, write-back runbooks, or production provider lifecycle enforcement approved.
- Release remains `FAIL`: this creates production provider lifecycle approval structure only. Provider-specific adapter contracts, token custody, webhook replay policy, quota governance, write-back safety, revocation handling, hosted alerts, provider runbooks, remote CI proof, second-operator approval, and final audits remain incomplete.

## 2026-07-23 Dependency Audit Evidence Label Hardening

- Updated `dependency:final-audit-readiness-packet` to require and emit explicit `productionAudit`, `lockfileProof`, `installedTree`, `runtimeInventory`, `devDependencyExclusion`, `overrideReview`, `licenseAlignment`, `registrySecretAbsence`, `remoteCi`, and `secondOperator` labels.
- Added blank-label rejection coverage for every dependency audit evidence label so the packet cannot emit final-audit readiness language with omitted production audit, lockfile, installed tree, runtime inventory, dev dependency exclusion, override review, license alignment, registry secret absence, remote CI, or second-operator evidence.
- Release remains `FAIL`: this narrows dependency-audit review traceability only. Final dependency audit `PASS`, remote CI dependency audit proof, second-operator review, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Public Release Checklist Integrity Repair

- Rebuilt `docs/public-release-checklist.md` into a clean gate-by-gate checklist after several release rows became spliced together during readiness-packet updates.
- Preserved the honest release result: `FAIL`. The rebuilt checklist keeps production UI, release-grade ICS workflow, provider lifecycle, hosted public-event workers, distributed rate limiting, production auth approval, remote CI PostgreSQL proof, hosted retention approvals, final dependency/security/privacy/licensing audit pass, clean public history, public remote CI, security contact, and public repository creation as unchecked blockers.
- This is documentation-integrity cleanup only. It does not publish, push, tag, create remotes, initialize git, mutate production systems, or mark any final release gate `PASS`.

## 2026-07-23 ICS Evidence Label Hardening

- Packet input/output now requires and carries `recurrenceSuite`, `timezoneDstProof`, `syncIdempotencyProof`, `importPreviewUx`, `exportPrivacyRedaction`, `writeBackConflictPreview`, `providerNeutralContract`, `providerFixtureSuite`, `largeCalendarFixture`, `browserWorkflow`, `remoteCi`, and `rollbackPlan`; review steps reference the provided labels without approving production calendar sync, writing calendar data, mutating provider state, replacing recurrence/browser/CI evidence, or completing remote CI/security approval.
- Added blank-label rejection coverage for each required ICS evidence label so the packet cannot emit production-readiness language with omitted recurrence, timezone/DST, sync idempotency, import preview, export redaction, write-back conflict, provider-neutral contract, provider fixture, large fixture, browser workflow, remote CI, or rollback evidence.
- Release remains `FAIL`: this narrows ICS production-readiness review traceability only. Release-grade ICS import/export workflow, production sync UX, production sync-state idempotency beyond local checkpoint foundation, broader real-provider fixture execution, provider write-back production proof, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Production Auth Evidence Label Hardening

- Packet input/output now requires and carries `identityProvider`, `sessionStore`, `authorizationMatrix`, `roleMembershipProof`, `sessionLifecycle`, `resetTokenLifecycle`, `lockoutPruning`, `cookieTransport`, `startupGuard`, `migrationPlan`, `rollbackDrill`, `remoteCi`, and `rollbackPlan`; review steps reference the provided labels without approving production auth, mutating users, creating sessions, rotating credentials, running migrations, changing cookie policy, or completing remote CI/security approval.
- Added blank-label rejection coverage for each required production-auth evidence label so the packet cannot emit production-readiness language with omitted identity-provider, session-store, authorization matrix, role/membership, session lifecycle, reset-token lifecycle, lockout/pruning, cookie transport, startup guard, migration, rollback-drill, remote CI, or rollback evidence.
- Release remains `FAIL`: this narrows production-auth review traceability only. Production persisted auth, roles, memberships, session model, production identity-provider integration, production reset-token delivery/recovery policy, production distributed lockout/backoff policy, live production authorization coverage, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Public-Events Hosted Delivery Evidence Label Hardening

- Packet input/output now requires and carries `secretProvider`, `runtimeIdentity`, `rotationDrill`, `workerTopology`, `retryQueue`, `deadLetterQueue`, `hostedDashboard`, `alertRouting`, `replayBoundary`, `rateLimitHeaderKey`, `incidentDrill`, `remoteCi`, and `rollbackPlan`; review steps reference the provided labels without approving hosted delivery, mutating workers, mutating secrets, mutating subscriptions, replaying events, configuring hosted alerts, or completing remote CI/security approval.
- Added blank-label rejection coverage for each required hosted-delivery evidence label so the packet cannot emit production-readiness language with omitted managed-secret provider, runtime identity, rotation/revocation drill, worker topology, retry queue, dead-letter queue, hosted dashboard, alert routing, replay boundary, rate-limit header key, incident drill, remote CI, or rollback evidence.
- Release remains `FAIL`: this narrows public-event hosted-delivery review traceability only. Production managed secret storage, durable public-event subscription delivery workers, durable hosted retry workers, hosted delivery operations, hosted observability proof, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Provider CSV Evidence Label Hardening

- Packet input/output now requires and carries `fixtureSuite`, `downloadUploadWorkflow`, `confirmationUx`, `providerPolicy`, `browserWorkflow`, `abuseAnalytics`, `largeFixtureSuite`, `formulaInjectionRegression`, `fieldMappingPrivacy`, `remoteCi`, and `rollbackPlan`; review steps reference the provided labels without approving production imports, mutating import rows, mutating provider quota policy, exporting analytics, configuring alerts, or completing remote CI/security approval.
- Added blank-label rejection coverage for each required provider CSV evidence label so the packet cannot emit production-readiness language with omitted real-provider fixture, download/upload workflow, provider-specific confirmation UX, quota, browser workflow, abuse analytics, large fixture, formula-injection, field-mapping privacy, remote CI, or rollback evidence.
- Release remains `FAIL`: this narrows provider CSV production-readiness review traceability only. Production-grade provider CSV download/upload polish, broader real-provider export fixture execution, provider-specific confirmation polish, production quota governance proof, hosted abuse analytics proof, browser workflow proof, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Production Rate-Limit Evidence Label Hardening

- Packet input/output now requires and carries `edgeLayer`, `distributedStore`, `providerQuotaPolicy`, `trustedProxyProof`, `hostedAlertRouting`, `hostedDashboard`, `abuseAnalytics`, `remoteCi`, and `rollbackPlan`; review steps reference the provided labels without enabling production distributed throttling, mutating quota policies, configuring hosted alerts, exporting analytics, or completing remote CI/security approval.
- Added blank-label rejection coverage for each required production rate-limit evidence label so the packet cannot emit broad production-readiness language with omitted edge, distributed-store, provider-quota, trusted-proxy, hosted observability, remote CI, or rollback evidence.
- Release remains `FAIL`: this narrows production rate-limit review traceability only. Production distributed rate limiting, provider-specific quota enforcement, hosted alert delivery/dashboard execution, abuse analytics proof, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Standalone Web App Evidence Label Update

- Hardened `web-app:production-readiness-packet` so release reviewers must provide explicit `--deployment-target`, `--production-build`, `--authenticated-write-flow`, `--security-headers`, `--csrf-cookie-transport`, `--throttle-policy`, `--durable-storage`, `--cache-policy`, `--health-startup-guard`, `--browser-matrix`, `--accessibility-audit`, `--remote-ci`, and `--rollback-plan` labels alongside environment, scope, and `asOf`.
- Packet output now carries the provided labels and review steps reference them without approving production deployment, mutating application state, configuring hosting, creating a public remote, replacing browser/accessibility evidence, or completing remote CI/security approval.
- Focused verification after implementation: `npm run build && node --test dist/cli.test.js` passed.
- Final required gates after documentation update: `npm run check` passed 531 tests, documentation link check across 64 Markdown files, release safety scan across 112 files, license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: narrows standalone web app production-readiness review traceability only. Standalone production web app hardening beyond local app/security-header foundations, production deployment proof, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Calendar UI Evidence Label Update

- Hardened `calendar-ui:production-readiness-packet` so release reviewers must provide explicit `--browser-matrix`, `--conflict-workflow`, `--write-back-acknowledgement`, `--accessibility-audit`, `--responsive-polish`, `--visual-regression`, and `--product-owner-approval` labels alongside environment, scope, and `asOf`.
- Packet output now carries `browserMatrix`, `conflictWorkflow`, `writeBackAcknowledgement`, `accessibilityAudit`, `responsivePolish`, `visualRegression`, and `productOwnerApproval`; review steps reference the provided labels without approving production UI, mutating schedules/calendar events, replacing browser/accessibility evidence, granting product-owner approval, or completing remote CI/security approval.
- Focused verification after implementation: `npm run build && node --test dist/cli.test.js` passed 100 CLI tests.
- Final required gates after documentation update: `npm run check` passed 521 tests, documentation link check across 64 Markdown files, release safety scan across 112 files, license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: narrows calendar UI production-readiness review traceability only. Production calendar UI hardening, browser matrix evidence beyond local smoke, interactive conflict-preview workflow beyond local render smoke, accessibility pass, responsive polish, product-owner visual approval, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Provider Lifecycle Evidence Label Update

- Hardened `providers:lifecycle-readiness-packet` so release reviewers must provide explicit `--managed-secret-custody`, `--rotation-drill`, `--revocation-drill`, `--write-back-safety`, `--hosted-alert-routing`, and `--provider-runbook` labels alongside environment, provider, scope, and `asOf`.
- Packet output now carries `managedSecretCustody`, `rotationDrill`, `revocationDrill`, `writeBackSafety`, `hostedAlertRouting`, and `providerRunbook`; review steps reference the provided labels without enforcing provider lifecycle, mutating provider connections, rotating/revoking credentials, writing calendar data, configuring hosted alerts, or completing remote CI/security approval.
- Focused verification after implementation: `npm run build && node --test dist/cli.test.js` passed 94 CLI tests.
- Final required gates after documentation update: `npm run check` passed 515 tests, documentation link check across 64 Markdown files, release safety scan across 112 files, license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: narrows provider lifecycle review traceability only. Production-grade webhook/provider lifecycle enforcement, provider-specific adapters, hosted operator alerts, provider-specific rotation/revocation/write-back runbooks, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Production Rate-Limit Hosted Observability Evidence Label Update

- Hardened `rate-limit:production-readiness-packet` so release reviewers must provide explicit `--hosted-alert-routing`, `--hosted-dashboard`, and `--abuse-analytics` labels alongside environment, scope, and `asOf`.
- Packet output now carries `hostedAlertRouting`, `hostedDashboard`, and `abuseAnalytics`, and review steps reference the provided labels without enabling production distributed throttling, mutating quota policies, configuring hosted alerts, exporting analytics, or completing remote CI/security approval.
- Focused verification implementation: `npm run build && node --test dist/cli.test.js` passed 89 CLI tests.
- Final required gates after documentation update: `npm run check` passed 510 tests, documentation link check across 64 Markdown files, release safety scan across 112 files, license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows production rate-limit review traceability only. Production distributed rate limiting, provider-specific quota enforcement, hosted alert delivery/dashboard execution, abuse analytics proof, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Public-Event Hosted Dashboard/Alert Evidence Label Update

- Hardened `public-events:hosted-delivery-readiness-packet` so release reviewers must provide explicit `--hosted-dashboard` and `--alert-routing` labels alongside managed-secret-provider and worker-topology labels.
- Packet output now carries `hostedDashboard` and `alertRouting`, and review steps reference the provided labels without approving hosted delivery, configuring managed secret providers, starting durable workers, replaying events, mutating subscriptions, mutating secret refs, configuring hosted alerts, or completing remote CI/security approval.
- Focused verification implementation: `npm run build && node --test dist/cli.test.js` passed 86 CLI tests.
- Final required gates after documentation update: `npm run check` passed 507 tests, documentation link check across 64 Markdown files, release safety scan across 112 files, license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows public-event hosted-delivery review traceability only. Production managed secret storage, durable public-event subscription delivery workers, durable hosted retry workers, hosted delivery operations, hosted observability proof, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Provider CSV Browser/Abuse Evidence Label Update

- Hardened `provider-csv:production-readiness-packet` so release reviewers must provide explicit `--browser-workflow` and `--abuse-analytics` labels alongside fixture-suite and provider-policy labels.
- Packet output now carries `browserWorkflow` and `abuseAnalytics`, and review steps reference the provided labels without approving production imports, mutating provider quota policy, exporting analytics, configuring alerts, or completing remote CI/security approval.
- Focused verification implementation: `npm run build && node --test dist/cli.test.js` passed 84 CLI tests.
- Final required gates after documentation update: `npm run check` passed 505 tests, documentation link check across 64 Markdown files, release safety scan across 112 files, license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows provider CSV production-readiness review traceability only. Production-grade provider CSV download/upload polish, broader real-provider export fixture execution, provider-specific confirmation polish, production quota governance proof, hosted abuse analytics proof, browser workflow proof, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 ICS Provider Fixture/Browser Workflow Evidence Label Update

- Hardened `ics:production-readiness-packet` so release reviewers must provide explicit `--provider-fixture-suite` and `--browser-workflow` labels alongside the existing recurrence-suite and sync-idempotency labels.
- Packet output now carries `providerFixtureSuite` and `browserWorkflow`, adds provider-fixture-suite and browser-workflow evidence requirements, and review steps reference the provided labels without approving production sync, writing calendar data, or mutating provider state.
- Focused verification implementation: `npm run build && node --test dist/cli.test.js` passed 82 CLI tests.
- Final required gates after documentation update: `npm run check` passed 503 tests, documentation link check across 64 Markdown files, release safety scan across 112 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows ICS production-readiness review traceability only. Release-grade ICS workflow still needs production sync UX, production sync-state idempotency proof beyond local checkpoint foundation, broader real-provider fixture execution, browser workflow proof, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval.

## 2026-07-23 Standalone Web App Browser/Accessibility Evidence Label Update

- Hardened `web-app:production-readiness-packet` so release reviewers must provide explicit `--browser-matrix` and `--accessibility-audit` labels alongside the deployment target.
- Packet output now carries `browserMatrix` and `accessibilityAudit`, adds browser-matrix and accessibility-audit evidence requirements, and review steps reference the provided labels without approving deployment, configuring hosting, or mutating app state.
- Focused verification implementation: `npm run build && node --test dist/cli.test.js` passed 80 CLI tests.
- Final required gates after documentation update: `npm run check` passed 501 tests, documentation link check across 64 Markdown files, release safety scan across 112 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows standalone web app review traceability only. Standalone production web app hardening, production deployment proof, remote CI proof, final security/privacy/licensing approval, public repository gates, and release approval remain incomplete.

## 2026-07-23 Production Auth Migration/Rollback Evidence Label Update

- Hardened `auth:production-readiness-packet` so release reviewers must provide explicit `--migration-plan` and `--rollback-drill` labels alongside the existing `--authorization-matrix` label.
- Packet output now carries `migrationPlan` and `rollbackDrill`, adds migration-plan and rollback-drill evidence requirements, and review steps reference the provided labels without approving production auth or mutating auth state.
- Focused verification implementation: `npm run build && node --test dist/cli.test.js` passed 78 CLI tests.
- Final required gates after documentation update: `npm run check` passed 499 tests, documentation link check across 64 Markdown files, release safety scan across 112 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows production-auth review traceability only. Production persisted auth, production authentication UX, identity-provider integration, production reset-token delivery/recovery policy, production distributed lockout/backoff policy, live production authorization coverage, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Local API All-Day RECURRENCE-ID Moved Re-Import Update

- Added local API regression coverage for all-day recurring ICS re-import where a later `RECURRENCE-ID;VALUE=DATE` exception VEVENT moves the occurrence to a different all-day date.
- Test proves the API updates the previously stored all-day occurrence under its original occurrence identity, reports `createdCount: 0`, `updatedCount: 3`, `deletedCount: 0`, moves the stored start/end to the provider-supplied all-day dates, and does not create a duplicate moved-date UID in ICS export.
- Focused verification implementation: `npm run build && node --test dist/api.test.js` passed 179 API tests.
- Release remains `FAIL`: this narrows local API all-day moved recurrence re-import evidence only. Release-grade ICS workflow still needs production sync UX, production sync-state idempotency proof beyond local checkpoint foundation, broader provider fixtures, browser workflow proof, remote CI proof, and final release gates.

## 2026-07-23 Local API All-Day CANCELLED RECURRENCE-ID Re-Import Update

- Added local API regression coverage for all-day recurring ICS re-import where a later `RECURRENCE-ID;VALUE=DATE` exception VEVENT is `STATUS:CANCELLED`.
- Test proves the API deletes the previously stored all-day occurrence, reports `deletedCount: 1`, omits the cancelled occurrence from ICS export, emits scoped `calendar.event_changed` evidence for the deleted event, and does not copy the cancelled private summary into the public event payload.
- Focused verification implementation: `npm run build && node --test dist/api.test.js` passed 178 API tests.
- Final required gates after documentation update: `npm run check` passed 496 tests, documentation link check across 64 Markdown files, release safety scan across 112 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows local API all-day cancelled recurrence re-import evidence only. Release-grade ICS workflow still needs production sync UX, production sync-state idempotency proof beyond local checkpoint foundation, broader provider fixtures, browser workflow proof, remote CI proof, and final release gates.

## 2026-07-23 ICS All-Day CANCELLED RECURRENCE-ID Regression Update

- Added ICS parser regression coverage for an all-day daily recurring event whose `RECURRENCE-ID;VALUE=DATE` exception VEVENT is `STATUS:CANCELLED`.
- Test proves the cancelled all-day occurrence is omitted while the surrounding all-day occurrences keep their original occurrence identity keys and all-day state.
- Focused verification implementation: `npm run build && node --test dist/ics.test.js` passed 74 ICS tests.
- Final required gates after documentation update: `npm run check` passed 495 tests, documentation link check across 64 Markdown files, release safety scan across 112 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows local all-day cancelled recurrence compatibility only. Release-grade ICS workflow still needs production sync UX, production sync-state idempotency proof beyond local checkpoint foundation, broader provider fixtures, browser workflow proof, remote CI proof, and final release gates.

## 2026-07-23 ICS All-Day RECURRENCE-ID Moved Exception Regression Update

- Added ICS parser regression coverage for an all-day daily recurring event whose `RECURRENCE-ID;VALUE=DATE` occurrence is moved to a different all-day date by an exception VEVENT.
- Test proves the moved all-day occurrence keeps the original occurrence identity key while replacing title, start, end, and all-day state from the exception VEVENT.
- Focused verification implementation: `npm run build && node --test dist/ics.test.js` passed 73 ICS tests.
- Final required gates after documentation update: `npm run check` passed 494 tests, documentation link check across 64 Markdown files, release safety scan across 112 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows local all-day recurring exception compatibility only. Release-grade ICS workflow still needs production sync UX, production sync-state idempotency proof beyond local checkpoint foundation, broader provider fixtures, browser workflow proof, remote CI proof, and final release gates.

## 2026-07-23 Targeted Auth Session Revocation Authorization Update

- Hardened targeted `DELETE /api/auth/sessions/:id` so only `OWNER` or `ADMIN` principals for the same tenant/workspace can revoke another auth session; current-session logout remains available through `DELETE /api/auth/session`.
- Added API regression coverage proving editor and viewer principals receive `403 FORBIDDEN` for targeted session revocation, while owner and admin principals can revoke a target session without returning raw session-token hashes.
- Focused verification implementation: `npm run build && node --test dist/api.test.js` passed 177 API tests.
- Final required gates after documentation update: `npm run check` passed 493 tests, documentation link check across 64 Markdown files, release safety scan across 112 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows local/self-host auth-session authorization evidence only. Production persisted auth, production identity-provider integration, hosted session cleanup, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 ICS TZID RECURRENCE-ID Moved Exception Regression Update

- Added ICS parser regression coverage for a daily `America/New_York` recurring event whose `RECURRENCE-ID;TZID=America/New_York` occurrence crosses the 2026 daylight-saving transition and is moved to a provider-supplied local wall time.
- Test proves the moved occurrence keeps the original occurrence identity key while replacing title, start, end, and timezone from the exception VEVENT.
- Focused verification implementation: `npm run build && node --test dist/ics.test.js` passed 72 ICS tests.
- Final required gates after documentation update: `npm run check` passed 492 tests, documentation link check across 64 Markdown files, release safety scan across 112 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows local recurring exception and timezone compatibility only. Release-grade ICS workflow still needs production sync UX, production sync-state idempotency proof beyond local checkpoint foundation, broader provider fixtures, browser workflow proof, remote CI proof, and final release gates.

## 2026-07-23 Licensing Audit Local Evidence Commands Update

- Updated `licensing:final-audit-readiness-packet` to include local evidence commands reviewers should attach: `npm run license:check`, `npm ls --omit=dev --all`, `npm run release:safety`, and no-`.git` directory proof.
- Added packet boundary text clarifying local command evidence does not replace reused-material inventory, NOTICE review, final release-candidate freeze, remote CI evidence, or second-operator licensing approval.
- Focused verification implementation: `npm run build && node --test dist/cli.test.js` passed 76 CLI tests.
- Package smoke verification: `npm run licensing:final-audit-readiness-packet -- --environment release-demo --audit-scope release-candidate-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --json` passed and emitted local evidence commands with all approval and mutation flags false.
- Final required gates after documentation update: `npm run check` passed 491 tests, documentation link check across 64 Markdown files, release safety scan across 112 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows licensing-audit evidence collection only. Final licensing audit `PASS`, reused-material inventory approval, NOTICE requirement review, release-candidate freeze, remote CI proof, second-operator licensing approval, public repository setup, and release approval remain incomplete.

## 2026-07-23 Generated Artifact Review Packet Foundation Update

- Added CLI coverage proving packet emits generated-artifact review requirements without approving artifacts, allowing artifact rewrite/delete, mutating release gates, creating repositories, or publishing.
- Packet requires dist output review, fixture/template/sample sanitization, screenshot/export/backup/log review, local path/private URL absence, provider identifier minimization, license/NOTICE trigger review, first-commit staging alignment, local evidence commands, and second-operator review.
- Focused verification implementation: `npm run build && node --test dist/cli.test.js` passed 76 CLI tests.
- Package smoke verification: `npm run release:generated-artifact-review-packet -- --environment release-demo --artifact-scope release-candidate-generated-artifacts-demo --manifest first-commit-staging-manifest-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --json` passed.
- Final required gates after documentation update: `npm run check` passed 491 tests, documentation link check across 64 Markdown files, release safety scan across 112 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: generated-artifact review packet evidence only. Actual generated artifact approval, final privacy/licensing/security audit `PASS`, clean public history staging, remote CI proof, public repository setup, and release approval remain incomplete.

## 2026-07-23 App And API No-Store Cache-Control Foundation Update

- Added local API coverage proving `/healthz` JSON and `/app` HTML responses include `Cache-Control: no-store, max-age=0` alongside existing security headers.
- Added shared no-store cache-control behavior for JSON, app-shell HTML, and CSV export responses so scoped API data, app shell, and exports are not retained across auth/session/deployment changes.
- Updated public release checklist and security audit addendum to record the local no-store cache-control foundation.
- Focused verification implementation: `npm run build && node --test dist/api.test.js` passed API tests.
- Final required gates after documentation update: `npm run check` passed 480 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: no-store cache-control is a local/self-host hardening foundation only. Standalone production web app hardening, broader browser/accessibility evidence, production deployment proof, remote CI proof, final security/privacy/licensing approval, public repository gates, and release approval remain incomplete.

## 2026-07-23 Repository Settings Readiness Packet Foundation Update

- Added `repository:settings-readiness-packet` CLI support matching package script review-only public repository settings evidence.
- Packet requires environment, tenant/workspace/user scope, `asOf`, target-repository label, settings-profile label, and branch-policy label. It emits required branch protection, required status checks, security advisory settings, default branch and merge policy, maintainer access, Dependabot and vulnerability alert settings, secret scanning push-protection review, release/package permission settings, repository metadata, public issue/discussion settings, and second-operator review evidence.
- Packet sets `publicRepositorySettingsConfigured`, `repositoryMutationAllowedByPacket`, `branchProtectionMutationAllowedByPacket`, `securityAdvisoryMutationAllowedByPacket`, `maintainerAccessMutationAllowedByPacket`, and `releaseGateMutationAllowedByPacket` to `false`; does not create repositories, initialize git, add remotes, mutate repository settings, mutate branch protection, configure security advisories, change maintainer access, mark repository settings configured, change release gates, push commits, tag releases, publish packages, or announce ScheduleOS.
- Added CLI coverage proving packet emits evidence requirements without demo GitHub tokens or private maintainer labels, and rejects blank settings-profile labels.
- Focused verification implementation: `npm run build && node --test dist/cli.test.js` passed 71 CLI tests.
- Package smoke verification: `npm run repository:settings-readiness-packet -- --environment release-demo --target-repository scheduleos-ai/scheduleos --settings-profile public-open-source-hardening-demo --branch-policy required-checks-main-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --json` passed.
- Final required gates after documentation update: `npm run check` passed 480 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: repository settings review-packet evidence only. Actual clean public history staging, repository initialization, remote creation, public repository settings configuration, branch protection configuration, second-operator review, public repository gates, and release approval remain incomplete.

## 2026-07-23 Public Remote CI Readiness Packet Foundation Update

- Added `remote-ci:public-readiness-packet` CLI support matching package script review-only public remote CI evidence.
- Packet requires environment, tenant/workspace/user scope, `asOf`, CI-provider label, workflow-suite label, target-repository label. It emits required public remote workflow run, `npm run check`, production dependency audit, no-.git-directory, release safety, documentation link, license, log sanitization, artifact retention, branch-protection or required-checks, public repository settings, second-operator review evidence.
- Packet sets `publicRemoteCiVerified`, `workflowDispatchAllowedByPacket`, `remoteMutationAllowedByPacket`, `repositoryCreationAllowedByPacket`, `secretMutationAllowedByPacket`, and `releaseGateMutationAllowedByPacket` to `false`; does not create repositories, initialize git, add remotes, dispatch workflows, store CI secrets, mutate branch protection, mark public remote CI verified, change release gates, push commits, tag releases, publish packages, or announce ScheduleOS.
- Added CLI coverage proving packet emits evidence requirements without demo GitHub tokens, private CI logs, or local absolute paths, and rejects blank workflow-suite labels.
- Focused verification implementation: `npm run build && node --test dist/cli.test.js` passed 69 CLI tests.
- Package smoke verification: `npm run remote-ci:public-readiness-packet -- --environment release-demo --ci-provider github-actions-demo --workflow-suite release-gates-workflow-demo --target-repository scheduleos-ai/scheduleos --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --json` passed.
- Final required gates after documentation update: `npm run check` passed 478 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: public remote CI review-packet evidence only. Actual clean public history staging, repository initialization, remote creation, public remote CI execution proof, branch protection configuration, second-operator review, public repository gates, and release approval remain incomplete.

## 2026-07-23 Clean Public History Readiness Packet Foundation Update

- Added `repository:clean-history-readiness-packet` CLI support matching package script review-only clean public history evidence.
- Packet requires environment, tenant/workspace/user scope, `asOf`, history-scope label, and source-root label. It emits required no-.git-directory proof, release safety scan, first commit staging manifest, generated artifact review, fixture/sample sanitization, license/notice readiness, repository naming, remote CI plan, and second-operator review evidence.
- Packet sets `cleanHistoryPrepared`, `gitInitializationAllowedByPacket`, `remoteMutationAllowedByPacket`, `pushMutationAllowedByPacket`, and `tagMutationAllowedByPacket` to `false`; does not initialize git, create repositories, add remotes, push commits, tag releases, mutate package files, mark clean history prepared, publish packages, or announce ScheduleOS.
- Added CLI coverage proving packet emits evidence requirements without demo GitHub tokens, private history snippets, or local absolute paths, and rejects blank history-scope labels.
- Focused verification implementation: `npm run build && node --test dist/cli.test.js` passed 67 CLI tests.
- Final required gates after documentation update: `npm run check` passed 476 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: clean public history review-packet evidence only. Actual public history staging, repository initialization, remote creation, remote CI, second-operator review, public repository gates, and release approval remain incomplete.

## 2026-07-23 Dependency Audit Readiness Packet Foundation Update

- Added `dependency:final-audit-readiness-packet` CLI support matching package script review-only dependency audit evidence.
- Packet requires environment, tenant/workspace/user scope, `asOf`, audit-scope label, and package-manager label. It emits required production dependency audit, lockfile reproducibility, installed dependency tree, runtime dependency inventory, dev dependency exclusion, override/resolution review, transitive license alignment, package-registry secret absence, remote CI dependency audit, and second-operator review evidence.
- Packet sets `dependencyAuditPassApproved`, `dependencyMutationAllowedByPacket`, `lockfileMutationAllowedByPacket`, `releaseGateMutationAllowedByPacket`, and `packageRegistryMutationAllowedByPacket` to `false`; does not install, update, remove, override, or publish dependencies, mutate package manifests or lockfiles, configure package registries, mark dependency audit `PASS`, mutate release gates, create remotes, or announce ScheduleOS.
- Added CLI coverage proving packet emits evidence requirements without demo package registry tokens, private registry labels, or private package names, and rejects blank audit-scope labels.
- Focused verification implementation: `npm run build && node --test dist/cli.test.js` passed 65 CLI tests.
- Final required gates after documentation update: `npm run check` passed 474 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: dependency audit review-packet evidence only. Final dependency audit `PASS`, remote CI dependency audit proof, second-operator review, final security audit `PASS`, public repository gates, and release approval remain incomplete.

## 2026-07-23 Security Policy Contact Readiness Packet Foundation Update

- Added `security:policy-contact-readiness-packet` CLI support matching package script review-only security contact evidence.
- Packet requires environment, tenant/workspace/user scope, `asOf`, contact-channel label, and responsible-party label. It emits required SECURITY.md contact-channel, responsible maintainer, vulnerability disclosure workflow, repository security advisory settings, response SLA, escalation path, private report sanitization, remote CI security workflow, and second-operator review evidence.
- Packet sets `securityContactConfigured`, `securityPolicyMutationAllowedByPacket`, `repositorySettingsMutationAllowedByPacket`, and `publicRepositoryMutationAllowedByPacket` to `false`; does not configure security contacts, edit repository settings, create a public repository, mutate SECURITY.md, mark security audit `PASS`, publish packages, or announce ScheduleOS.
- Added CLI coverage proving packet emits evidence requirements without demo email-shaped contact values, GitHub tokens, or private reporter names, and rejects blank contact-channel labels.
- Focused verification implementation: `npm run build && node --test dist/cli.test.js` passed 63 CLI tests.
- Final required gates after documentation update: `npm run check` passed 472 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: security policy contact review-packet evidence only. Real monitored contact setup, repository security settings, remote CI security workflow proof, second-operator review, final security audit `PASS`, public repository gates, and release approval remain incomplete.

## 2026-07-23 Production Deployment Readiness Packet Foundation Update

- Added `deployment:production-readiness-packet` CLI support matching package script review-only production deployment evidence.
- Packet now requires environment, tenant/workspace/user scope, `asOf`, deployment-topology label, plus explicit `tlsTermination`, `reverseProxyHeaders`, `securityHeaders`, `startupGuards`, `healthChecks`, `durableStorage`, `cookieCsrfTransport`, `trustedProxyThrottle`, `staticAssetCache`, `logRedaction`, `backupRollback`, `remoteCiDeploymentSmoke`, and `operatorReview` evidence labels. It emits required TLS termination, reverse proxy header, security header, startup guard, health check, durable storage, secure cookie/CSRF transport, trusted proxy/throttle, static asset cache, log redaction, backup/rollback, remote CI deployment smoke, and second-operator review evidence without broad proof claims.
- Packet sets `productionDeploymentApproved`, `hostingMutationAllowedByPacket`, `dnsMutationAllowedByPacket`, and `secretMutationAllowedByPacket` to `false`; does not approve production deployment, configure hosting, mutate DNS, write secrets, start services, create remotes, publish packages, or announce ScheduleOS.
- Added CLI coverage proving packet emits evidence requirements without demo private deployment token values and rejects blank deployment-topology, TLS termination, proxy header, security header, startup guard, health check, durable storage, cookie/CSRF, trusted proxy/throttle, static cache, log redaction, backup/rollback, remote CI deployment smoke, and operator-review labels.
- Focused verification implementation: `npm run build && node --test dist/cli.test.js` passed 167 CLI tests.
- Final required gates after documentation update: `npm run check` passed 588 tests, documentation link check across 64 Markdown files, release safety scan across 112 files, license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: production deployment review-packet evidence only. TLS/proxy/header deployment proof, startup/health proof, durable production storage proof, trusted proxy/throttle proof, remote CI deployment smoke proof, second-operator review, final security/privacy/licensing approval, public repository gates, and release approval remain incomplete.

## 2026-07-23 Final Release Gate Readiness Packet Foundation Update

- Added `release:final-gate-readiness-packet` CLI support matching package script review-only final release gate evidence.
- Packet requires environment, tenant/workspace/user scope, `asOf`, and release-scope label. It emits required functionality gate, storage gate, documentation gate, security audit `PASS`, licensing audit `PASS`, privacy audit `PASS`, dependency audit final pass, remote CI pass, clean public history, security policy contact, public repository settings, final source/generated-artifact review, and second-operator release approval evidence.
- Packet sets `releaseApproved`, `publicationAllowedByPacket`, `repositoryMutationAllowedByPacket`, `tagMutationAllowedByPacket`, `packagePublicationAllowedByPacket`, and `announcementAllowedByPacket` to `false`; does not approve release, create repositories, initialize git, add remotes, push commits, tag releases, publish packages, deploy production, or announce ScheduleOS.
- Added CLI coverage proving packet emits evidence requirements without demo GitHub tokens, private task titles, or release-contact values, and rejects blank release-scope labels.
- Focused verification implementation: `npm run build && node --test dist/cli.test.js` passed 59 CLI tests.
- Final required gates after documentation update: `npm run check` passed 468 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is final release gate review-packet evidence only. Final functionality/storage/documentation gates, security/licensing/privacy audit `PASS`, dependency audit final pass, remote CI proof, clean public history, security contact configuration, public repository settings, and second-operator release approval remain incomplete.

## 2026-07-23 Final Privacy Audit Readiness Packet Foundation Update

- Added `privacy:final-audit-readiness-packet` CLI support matching package script review-only final privacy audit evidence.
- Packet requires environment, tenant/workspace/user scope, `asOf`, and audit-scope label. It emits required final release safety scan, fixture/sample-data sanitization, generated artifact sanitization, logs/screenshots/exports/backups review, provider identifier/tenant-id review, local path/machine-name/private-URL review, private compatible leadership system prompt/customer-data boundary, calendar title/attendee/location/description minimization, task title/description/source metadata minimization, AI data redaction boundary, retention/export/deletion/provider-revocation, and second-operator review evidence.
- Packet sets `privacyAuditPassApproved`, `releaseGateMutationAllowedByPacket`, and `publicationAllowedByPacket` to `false`; does not mark privacy audit `PASS`, approve publication, mutate release gates, rewrite generated artifacts, create remotes, publish packages, or announce ScheduleOS.
- Added CLI coverage proving packet emits evidence requirements without demo personal-email values, private calendar title values, or internal compatible leadership system prompt values, and rejects blank audit-scope labels.
- Focused verification implementation: `npm run build && node --test dist/cli.test.js` passed 57 CLI tests.
- Final required gates after documentation update: `npm run check` passed 466 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is final privacy audit review-packet evidence only. Final release-candidate privacy scan, generated artifact review, provider identifier review, private compatible leadership system boundary proof, second-operator review, and final privacy/security audit `PASS` remain incomplete.

## 2026-07-23 Final Licensing Audit Readiness Packet Foundation Update

- Added `licensing:final-audit-readiness-packet` CLI support matching package script review-only final licensing audit evidence.
- Packet requires environment, tenant/workspace/user scope, `asOf`, and audit-scope label. It emits required final license check pass, lockfile dependency license, installed dependency metadata, copied-source marker scan, fixture/template/example review, asset/media/font/binary review, documentation reuse marker, third-party reused material inventory, NOTICE requirement review, root Apache-2.0 license consistency, final release-candidate freeze, and second-operator review evidence.
- Packet sets `licensingAuditPassApproved`, `releaseGateMutationAllowedByPacket`, `noticeMutationAllowedByPacket`, and `publicationAllowedByPacket` to `false`; does not mark licensing audit `PASS`, approve publication, add NOTICE, mutate release gates, create remotes, publish packages, or announce ScheduleOS.
- Added CLI coverage proving packet emits evidence requirements without demo license-contact values, copied private snippet values, or private task titles, and rejects blank audit-scope labels.
- Focused verification implementation: `npm run build && node --test dist/cli.test.js` passed 55 CLI tests.
- Final required gates after documentation update: `npm run check` passed 464 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is final licensing audit review-packet evidence only. Final release-candidate license check, reused-material inventory, NOTICE requirement review, second-operator review, and final licensing audit `PASS` remain incomplete.

## 2026-07-23 Final Security Audit Readiness Packet Foundation Update

- Added `security:final-audit-readiness-packet` CLI support matching package script review-only final security audit evidence.
- Packet requires environment, tenant/workspace/user scope, `asOf`, and audit-scope label. It emits required final dependency audit pass, secret scan, privacy/private-data scan, production auth/session, roles/memberships, reset-token lifecycle, production rate-limit and abuse-monitoring, provider managed-secret lifecycle, production deployment TLS/proxy/header, remote CI, security policy contact, final release-candidate source review, and second-operator review evidence.
- Packet sets `securityAuditPassApproved`, `releaseGateMutationAllowedByPacket`, and `productionDeploymentApproved` to `false`; does not mark security audit `PASS`, approve production deployment, configure security contacts, mutate release gates, create remotes, publish packages, or announce ScheduleOS.
- Added CLI coverage proving packet emits evidence requirements without demo security-contact values, secret-like demo values, or private task titles, and rejects blank audit-scope labels.
- Focused verification implementation: `npm run build && node --test dist/cli.test.js` passed 53 CLI tests.
- Final required gates after documentation update: `npm run check` passed 462 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is final security audit review-packet evidence only. Dependency audit final pass, production deployment proof, production auth proof, production rate-limit and abuse-monitoring proof, provider managed-secret lifecycle proof, remote CI proof, security contact configuration, second-operator review, and final security audit `PASS` remain incomplete.

## 2026-07-23 Repository Launch Readiness Packet Foundation Update

- Added `repository:launch-readiness-packet` CLI support and matching package script for review-only public repository launch evidence.
- Packet requires environment, tenant/workspace/user scope, `asOf`, target repository label, and history-plan label. It emits required final release gate pass, clean public history, privacy and secret scan, license audit pass, security audit pass, security policy contact, remote CI pass, repository name collision review, trademark review, first commit staging review, public repository settings, and second-operator review evidence.
- Packet sets `publicRepositoryCreationApproved`, `pushMutationAllowedByPacket`, `tagMutationAllowedByPacket`, and `releaseMutationAllowedByPacket` to `false`; it does not create a public repository, initialize git, add remotes, push commits, tag releases, configure security contacts, publish packages, or announce ScheduleOS.
- Added CLI coverage proving the packet emits evidence requirements without demo security-contact addresses, GitHub tokens, or private task titles, and rejects blank target labels.
- Focused verification implementation: `npm run build && node --test dist/cli.test.js` passed with 51 CLI tests.
- Final required gates after documentation update: `npm run check` passed full build/test/docs/release-safety/license checks; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is repository launch review-packet evidence only. Clean public history, remote CI verification, security policy contact configuration, public repository creation, and all final release gates remain incomplete.

## 2026-07-23 Destructive Approval Readiness Packet Foundation Update

- Added `retention:destructive-approval-readiness-packet` CLI support and matching package script for review-only production destructive-operation approval evidence.
- Packet requires environment, tenant/workspace/user scope, `asOf`, destructive-operation label, and approval-policy label. It emits required dry-run diff, fresh backup, restore smoke, exact confirmation, two-operator approval, legal/support approval, tenant/workspace/user scope proof, maintenance window, rollback procedure, audit event retention, hosted scheduler disablement, and remote CI evidence.
- Packet sets `destructiveApprovalGranted`, `applyMutationAllowedByPacket`, and `deleteMutationAllowedByPacket` to `false`; it does not approve destructive operations, schedule hosted cleanup jobs, apply retention cleanup, delete records, create external approval records, rotate backup keys, or complete production security/legal approval.
- Added CLI coverage proving the packet emits evidence requirements without raw demo backup keys or private task titles, and rejects blank approval-policy labels.
- Focused verification implementation: `npm run build && node --test dist/cli.test.js` passed with 49 CLI tests.
- Final required gates after documentation update: `npm run check` passed full build/test/docs/release-safety/license checks; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is destructive approval review-packet evidence only. Hosted retention cleanup execution, production destructive-operation approvals, external approval workflow, legal/security signoff, remote CI proof, and final release gates remain incomplete.

## 2026-07-23 Destructive Approval Evidence Label Hardening Update

- Hardened `retention:destructive-approval-readiness-packet` so every destructive-operation proof category must be supplied as a non-empty evidence label: dry-run diff, fresh backup, restore smoke, exact confirmation, two-operator approval, legal/support approval, scope proof, maintenance window, rollback procedure, audit retention, hosted scheduler disablement, and remote CI.
- Updated the README example to show the full review-only command with all required labels.
- Added CLI coverage proving the JSON packet includes each supplied evidence label and rejects blank values for every new destructive-operation proof flag.
- Release remains `FAIL`: this is evidence-label hardening only. It does not approve destructive operations, run hosted retention cleanup, create external approval records, complete legal/security signoff, prove remote CI, or satisfy final release gates.

## 2026-07-23 Remote CI PostgreSQL Readiness Packet Foundation Update

- Added `remote-ci:postgres-readiness-packet` CLI support and matching package script for review-only remote CI PostgreSQL proof evidence.
- Packet requires environment, tenant/workspace/user scope, `asOf`, CI-provider label, and PostgreSQL-service label. It emits required remote CI workflow, PostgreSQL service container, migration apply, live PostgreSQL repository test, tenant isolation regression, connection secret redaction, artifact retention, CI failure visibility, retry and timeout policy, rollback or rerun procedure, remote CI log sanitization, and second-operator review evidence.
- Packet sets `remoteCiPostgresApprovalGranted`, `ciMutationAllowedByPacket`, and `databaseMutationAllowedByPacket` to `false`; it does not create a remote, edit hosted CI settings, mutate databases, store connection secrets, approve remote CI proof, or complete repository/security release gates.
- Added CLI coverage proving the packet emits evidence requirements without raw demo PostgreSQL URLs or private task titles, and rejects blank CI-provider labels.
- Focused verification implementation: `npm run build && node --test dist/cli.test.js` passed with 47 CLI tests.
- Final required gates after documentation update: `npm run check` passed full build/test/docs/release-safety/license checks; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is remote CI PostgreSQL review-packet evidence only. Successful hosted CI execution, retained run artifacts, public remote CI proof, final security/privacy/licensing gates, and repository release gates remain incomplete.

## 2026-07-23 Public-Event Hosted Delivery Readiness Packet Foundation Update

- Added `public-events:hosted-delivery-readiness-packet` CLI support and matching package script for review-only production managed-secret and hosted public-event delivery evidence.
- Packet requires environment, tenant/workspace/user scope, `asOf`, secret-provider label, and worker-topology label. It emits required managed-secret provider selection, runtime identity and least-privilege policy, secret rotation and revocation drill, durable subscription worker, durable hosted retry queue, hosted dead-letter queue, hosted dashboard, hosted alert routing, delivery idempotency and replay-boundary, request rate-limit header-key, incident drill, remote CI, and second-operator review evidence.
- Packet sets `productionHostedDeliveryApprovalGranted`, `hostedWorkerMutationAllowedByPacket`, and `managedSecretProviderMutationAllowedByPacket` to `false`; it does not approve hosted delivery, configure managed secret providers, start durable workers, replay events, mutate subscriptions, mutate secret refs, configure hosted alerts, or complete remote CI/security approval.
- Added CLI coverage proving the packet emits evidence requirements without raw demo target URLs, signing secrets, or raw secret refs, and rejects blank worker-topology labels.
- Focused verification implementation: `npm run build && node --test dist/cli.test.js` passed with 45 CLI tests.
- Final required gates after documentation update: `npm run check` passed full build/test/docs/release-safety/license checks; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is hosted delivery review-packet evidence only. Production managed secret storage implementation, durable subscription delivery workers, durable hosted retry workers, hosted delivery dashboards, hosted alert routing, production incident drills, remote CI proof, final security/privacy/licensing gates, and complete release audit remain incomplete.

## 2026-07-23 Provider CSV Production Readiness Packet Foundation Update

- Added `provider-csv:production-readiness-packet` CLI support and matching package script for review-only production provider CSV import workflow evidence.
- Packet requires environment, tenant/workspace/user scope, `asOf`, fixture-suite label, and provider-policy label. It emits required real-provider export fixture, download/upload workflow, provider-specific confirmation UX, provider quota governance, import abuse analytics, large CSV fixture, formula-injection regression, field-mapping privacy, browser import workflow, rollback, remote CI, and second-operator review evidence.
- Packet sets `productionImportApprovalGranted`, `importMutationAllowedByPacket`, and `providerQuotaMutationAllowedByPacket` to `false`; it does not approve production imports, import rows, mutate provider quota policy, export analytics, configure alerts, or complete remote CI/security approval.
- Added CLI coverage proving the packet emits evidence requirements without raw demo provider token or private task title values, and rejects blank fixture-suite labels.
- Focused verification after implementation: `npm run build && node --test dist/cli.test.js` passed.
- Final required gates after documentation update: `npm run check` passed 452 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is provider CSV review-packet evidence only. Production-grade provider CSV download/upload polish, real-provider fixture breadth, provider-specific confirmation polish, quota governance, abuse analytics, browser proof, remote CI proof, and final security/privacy/licensing approval remain incomplete.

## 2026-07-23 ICS Production Readiness Packet Foundation Update

- Added `ics:production-readiness-packet` CLI support and matching package script for review-only release-grade ICS import/export and sync evidence.
- Packet now requires environment, tenant/workspace/user scope, `asOf`, recurrence-suite label, sync-idempotency proof label, provider-fixture-suite label, and browser-workflow label. It emits required recurrence regression, timezone/DST, sync-state idempotency, import preview UX, export privacy redaction, write-back conflict preview, provider-neutral ICS contract, provider fixture suite, browser import/export workflow, rollback, remote CI, and second-operator review evidence.
- Packet sets `productionSyncApprovalGranted` and `calendarWriteMutationAllowedByPacket` to `false`; it does not approve production calendar sync, write calendar data, mutate provider state, replace recurrence/browser/CI evidence, or complete final security approval.
- Added CLI coverage proving the packet emits evidence requirements without raw demo ICS token or private calendar title values, and rejects blank recurrence-suite, provider-fixture-suite, and browser-workflow labels.
- Focused verification after implementation: `npm run build && node --test dist/cli.test.js` passed.
- Final required gates after documentation update: `npm run check` passed 450 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is ICS review-packet evidence only. Release-grade ICS import/export workflow, production sync UX, production sync-state idempotency beyond local checkpoint foundation, provider write-back production proof, remote CI proof, and final security/privacy/licensing approval remain incomplete.

## 2026-07-23 Standalone Web App Production Readiness Packet Foundation Update

- Added `web-app:production-readiness-packet` CLI support and matching package script for review-only standalone production web app evidence.
- Packet now requires environment, tenant/workspace/user scope, `asOf`, deployment-target label, browser-matrix label, and accessibility-audit label. It emits required production build artifact, authenticated write-flow, security header deployment, CSRF/cookie transport, request/import throttle, storage durability, static asset cache policy, health check/startup guard, browser matrix, accessibility audit, remote CI, rollback, and second-operator review evidence.
- Packet sets `productionApprovalGranted` and `deploymentMutationAllowedByPacket` to `false`; it does not approve production deployment, mutate application state, configure hosting, create a public remote, replace browser/accessibility evidence, or complete remote CI/security approval.
- Added CLI coverage proving the packet emits evidence requirements without raw demo session cookie or API-key values, and rejects blank deployment-target, browser-matrix, and accessibility-audit labels.
- Focused verification after implementation: `npm run build && node --test dist/cli.test.js` passed.
- Final required gates after documentation update: `npm run check` passed 448 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is standalone web app review-packet evidence only. Standalone production web app hardening beyond local app/security-header foundations, deployment proof, remote CI proof, browser/accessibility evidence, final security/privacy/licensing approval, and public repository gates remain incomplete.

## 2026-07-23 Calendar UI Production Readiness Packet Foundation Update

- Added `calendar-ui:production-readiness-packet` CLI support and matching package script for review-only production calendar UI evidence.
- Packet now requires environment, tenant/workspace/user scope, `asOf`, `browserMatrix`, `conflictWorkflow`, `writeBackAcknowledgement`, `accessibilityAudit`, `responsivePolish`, `visualRegression`, `productOwnerApproval`, `remoteCi`, and `rollbackPlan` evidence labels. It emits required desktop browser matrix, mobile responsive, interactive conflict-preview workflow, write-back acknowledgement, keyboard navigation, screen-reader semantics, accessibility pass, responsive polish, visual regression, product-owner approval, remote CI, rollback, and second-operator review evidence without broad proof claims.
- Packet sets `productionApprovalGranted` and `uiMutationAllowedByPacket` to `false`; it does not approve production UI, mutate schedules or calendar events, replace browser/accessibility evidence, provide product-owner approval, or complete remote CI/security approval.
- Added CLI coverage proving packet emits evidence requirements without raw demo calendar token or private event title values and rejects blank browser-matrix, conflict-workflow, write-back acknowledgement, accessibility audit, responsive polish, visual regression, product-owner approval, remote CI, and rollback labels.
- Focused verification after implementation: `npm run build && node --test dist/cli.test.js` passed 169 CLI tests.
- Final required gates after documentation update: `npm run check` passed 446 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is calendar UI review-packet evidence only. Production calendar UI hardening, browser matrix evidence, accessibility pass, responsive polish, product-owner visual approval, remote CI proof, and final security/privacy/licensing approval remain incomplete.

## 2026-07-23 Provider Lifecycle Readiness Packet Foundation Update

- Added `providers:lifecycle-readiness-packet` CLI support and matching package script for review-only production provider lifecycle evidence.
- Packet now requires environment, provider, tenant/workspace/user scope, `asOf`, `managedSecretCustody`, `rotationDrill`, `revocationDrill`, `writeBackSafety`, `hostedAlertRouting`, `providerRunbook`, `remoteCi`, and `rollbackPlan` evidence labels. It emits required provider adapter contract, credential custody/managed-secret, rotation drill, emergency revocation drill, sync checkpoint idempotency, write-back preview/conflict, provider quota, hosted operator alert, provider-specific runbook, remote CI, rollback, and second-operator review evidence without broad proof claims.
- Packet sets `productionEnforcementGranted` and `providerMutationAllowedByPacket` to `false`; it does not enforce production provider lifecycle, mutate provider connections, rotate or revoke credentials, write calendar data, configure alerts, or approve production provider operations.
- Added CLI coverage proving packet emits evidence requirements without raw demo token or webhook secret values and rejects blank managed-secret custody, rotation drill, revocation drill, write-back safety, hosted alert routing, provider runbook, remote CI, and rollback labels.
- Focused verification after implementation: `npm run build && node --test dist/cli.test.js` passed 171 CLI tests.
- Final required gates after documentation update: `npm run check` passed 444 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is provider lifecycle review-packet evidence only. Production-grade webhook/provider lifecycle enforcement, provider-specific adapters, hosted operator alerts, provider-specific rotation/revocation/write-back runbooks, remote CI proof, and final security/privacy/licensing approval remain incomplete.

## 2026-07-23 Production Rate-Limit Readiness Packet Foundation Update

- Added `rate-limit:production-readiness-packet` CLI support and matching package script for review-only production distributed rate-limit, quota, hosted alerting, and abuse-analytics readiness evidence.
- Packet requires environment, tenant/workspace/user scope, and `asOf`; optional edge-layer and distributed-store labels are content-only evidence labels, not credentials or connection strings.
- Packet sets `productionEnablementGranted` and `rateLimitMutationAllowedByPacket` to `false`; it does not enable production throttling, mutate provider quota policy, configure hosted alerts, export analytics, or complete remote CI/security approval.
- Added CLI coverage proving the packet emits evidence requirements without raw demo token or key values, and rejects invalid `asOf` values.
- Focused verification after the implementation: `npm run build && node --test dist/cli.test.js` passed.
- Final required gates after documentation update: `npm run check` passed 442 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is production rate-limit review-packet evidence only. Production distributed rate limiting, provider-specific quota enforcement, hosted alert delivery/dashboards, abuse analytics, remote CI proof, and final security/privacy/licensing approval remain incomplete.

## 2026-07-23 Production Auth Readiness Packet Foundation Update

- Added `auth:production-readiness-packet` CLI support and matching package script for review-only production auth readiness evidence.
- Packet requires environment, backend, tenant/workspace/user scope, and `asOf`; optional identity-provider and session-store labels are content-only evidence labels, not credentials.
- Packet sets `productionApprovalGranted` and `authMutationAllowedByPacket` to `false`; it does not approve production auth, mutate users, rotate credentials, run migrations, create sessions, or complete remote CI/security approval.
- Added CLI coverage proving the packet emits persisted-auth evidence requirements without raw demo tokens or secret-like values, and rejects unsupported auth backends.
- Focused verification after the implementation: `npm run build && node --test dist/cli.test.js` passed.
- Final required gates after documentation update: `npm run check` passed 440 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is production auth review-packet evidence only. Production persisted auth, roles, memberships, session model, remote CI proof, live migration proof, production identity/recovery operations, and final security/privacy/licensing approval remain incomplete.

## 2026-07-23 Managed Secret Audit-ID and Delivery Summary Stabilization Update

- Fixed managed-secret resolver audit event IDs so repeated successful resolution of the same secret ref, purpose, and outcome within the same millisecond cannot collapse evidence rows in storage.
- Fixed public-event webhook delivery IDs so repeated same-event deliveries in the same millisecond with the same attempt number cannot collapse delivery-attempt audit evidence.
- Corrected public-event delivery summary API coverage to reflect the documented delivery contract: direct webhook delivery sends every matching public event in the requested scope and filter, so a second matching event creates two failed attempts on the second delivery request.
- Focused verification after the fix: `npm run build && node --test dist/api.test.js` passed.
- Final required gates after documentation update: `npm run check` passed 438 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this stabilizes local/self-host audit evidence and delivery-summary coverage only. It does not select or wire a production managed secret provider, prove runtime identity policy, create durable hosted workers, create hosted dashboards or alert routing, prove remote CI, or complete final security/privacy/licensing approval.

## 2026-07-23 Hosted Retention Cleanup Approval-Packet Foundation Update

- Added `retention:hosted-cleanup-packet` CLI support and matching package script for review-only hosted retention cleanup approval evidence.
- Packet requires environment, tenant/workspace/user scope, `asOf`, and maintenance-window start/end. It emits required dry-run evidence, backup/export evidence, legal/support review, second-operator review, scheduler/runtime identity, and approval-record requirements.
- Packet sets `applyAllowedByPacket` and `deleteAllowedByPacket` to `false`; it does not schedule hosted cleanup, approve destructive action, apply cleanup, or delete records.
- Added CLI coverage proving the packet emits production approval evidence without apply/delete capability and rejects invalid maintenance windows.
- Verification before documentation update: focused `npm run build && node --test dist/cli.test.js` first failed because the command did not exist, then passed after adding the command interface, parser, packet builder, help text, package script, and tests.
- Full required gates after documentation update: `npm run check` passed 438 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is hosted approval packet evidence only. It does not create a hosted scheduler, production approval storage, reviewer identity proof, alerting, failure handling, deployment verification, remote CI proof, or final security/privacy/licensing approval.

## 2026-07-23 Managed Secret Resolver Audit-Evidence Foundation Update

- Added content-minimized `MANAGED_SECRET_RESOLUTION_CHECKED` audit evidence for public-event delivery target URL and signing-secret ref resolution through the `managedSecrets` boundary.
- Audit rows record scope, purpose, SHA-256 secret-ref hash, resolution outcome, and optional internal error code. They do not return raw target URLs, signing secrets, raw secret refs, provider tokens, signatures, raw event bodies, private task titles, or private calendar titles.
- Added API coverage proving successful managed-secret ref resolution records sanitized `RESOLVED` rows during subscription registration and delivery, and cross-scope ref rejection records a sanitized `REJECTED_SCOPE` row without calling the provider.
- Verification before documentation update: focused `npm run build && node --test dist/api.test.js` passed after adding the audit event builder, resolver outcome recording, delivery-path wiring, and API assertions.
- Full required gates after documentation update: `npm run check` passed 436 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is implementation-facing local/self-host resolver evidence only. It does not select or wire a production managed secret provider, prove runtime identity policy, export provider audit logs, complete rotation or emergency revocation drills, create hosted dashboards, prove remote CI, or complete final security/privacy/licensing approval.

## 2026-07-23 Public Event Dead-Letter Queue Alert-Threshold Foundation Update

- Added `publicEventDeadLetterQueueAlerts.unreviewedItems` API option and standalone env wiring through `SCHEDULEOS_PUBLIC_EVENT_DEAD_LETTER_QUEUE_ALERT_UNREVIEWED_ITEMS`.
- `GET /api/events/webhook-deliveries/dead-letter/queue` now returns summary-only `alert.enabled`, `alert.status`, threshold metadata, and trigger metadata when configured unreviewed queue item thresholds are met.
- Added API and standalone config coverage proving unreviewed queue items produce `REVIEW_REQUIRED`, reviewed queue state returns `OK`, env vars map into server options, and invalid zero thresholds are rejected at startup.
- Verification before documentation update: focused `npm run build && node --test dist/api.test.js dist/server.test.js` passed after adding the API option, startup validation, alert helper, queue response field, env parsing, and tests.
- Final required gates after documentation and audit-evidence updates: `npm run check` passed 436 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is local/self-host threshold signaling only. It does not create hosted alert routing, hosted dashboards, durable production dead-letter queues, durable workers, durable retry queues, production managed secret provider proof, remote CI proof, or final security/privacy/licensing approval.

## 2026-07-23 Public Event Dead-Letter Queue Operator Packet Foundation Update

- Added `public-events:dead-letter-queue-packet` CLI support and matching package script for review-only public-event dead-letter queue operator evidence.
- The packet accepts tenant/workspace/user scope, `asOf`, optional `maxAttempts`, optional event type, optional `UNREVIEWED` or `REVIEWED` status, and optional JSON output.
- Packet output includes scoped request metadata, queue-review command evidence, review steps, and production boundary flags. It does not include raw target URLs, signing secrets, raw event bodies, private task titles, or private calendar titles.
- Added CLI coverage proving the packet emits sanitized JSON, preserves bounded review metadata, disallows apply/replay/delete decisions, and marks durable production dead-letter queues as still required.
- Verification before documentation update: focused `npm run build && node --test dist/cli.test.js` first failed because the command did not exist, then passed after adding the command interface, parser, packet builder, help text, package script, and tests.
- Full required gates after documentation update: `npm run check` passed 434 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is review-only operator packet evidence. It does not create durable production dead-letter queues, replay orchestration, hosted dashboards, alert routing, durable workers, production managed secret provider proof, remote CI proof, or final security/privacy/licensing approval.

## 2026-07-23 Public Event Dead-Letter Queue Visibility Foundation Update

- Added `GET /api/events/webhook-deliveries/dead-letter/queue` as a local/self-host dead-letter queue visibility foundation for public-event webhook deliveries.
- The endpoint derives scoped queue rows from exhausted delivery candidates plus latest dead-letter review evidence, returning queue counts, reviewed/unreviewed counts, `maxAttempts`, event IDs, delivery IDs, target URL hashes, attempt metadata, exhaustion reasons, and latest review metadata when present.
- Queue rows remain content-minimized and do not return raw target URLs, webhook secrets, raw event bodies, private task titles, or private calendar titles.
- Added API coverage proving an exhausted retry-limit candidate appears as `UNREVIEWED`, then appears as `REVIEWED` with latest review metadata after operator review, while the response does not leak raw target URL or secret.
- Verification before documentation update: focused `npm run build && node --test dist/api.test.js` passed after adding the queue endpoint, queue grouping helper, and API coverage.
- Full required gates after documentation update: `npm run check` passed 433 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is visibility derived from local/self-host audit evidence only. It does not create durable production dead-letter queues, replay orchestration, hosted dashboards, alert routing, durable workers, production managed secret provider proof, remote CI proof, or final security/privacy/licensing approval.

## 2026-07-23 Public Event Dead-Letter Review Evidence Foundation Update

- Added `POST /api/events/webhook-deliveries/dead-letter` and `GET /api/events/webhook-deliveries/dead-letter` as a local/self-host dead-letter review evidence foundation for public-event webhook deliveries.
- `POST` accepts scoped delivery ID, event ID, target URL hash, `maxAttempts`, decision, and optional sanitized note; it records review evidence only when the matching latest attempt is an exhausted candidate.
- `GET` lists scoped content-minimized review records without raw target URLs, webhook secrets, raw event bodies, private task titles, or private calendar titles.
- Added API coverage proving an exhausted retry-limit candidate can be reviewed and listed, the response does not leak raw target URL or secret, and a non-exhausted candidate is rejected with `409`.
- Verification before documentation update: focused `npm run build && node --test dist/api.test.js` passed after adding routes, parser, audit-backed review mapping, and tests.
- Full required gates after documentation update: `npm run check` passed 433 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is review evidence only. It does not create durable production dead-letter queues, replay orchestration, hosted dashboards, alert routing, durable workers, production managed secret provider proof, remote CI proof, or final security/privacy/licensing approval.

## 2026-07-23 Public Event Subscription Health Alert-Threshold Foundation Update

- Added optional local/self-host `publicEventSubscriptionHealthAlerts.failingSubscriptions`, `publicEventSubscriptionHealthAlerts.exhaustedSubscriptions`, and `publicEventSubscriptionHealthAlerts.neverDeliveredSubscriptions` API config.
- Added standalone env wiring through `SCHEDULEOS_PUBLIC_EVENT_SUBSCRIPTION_HEALTH_ALERT_FAILING_SUBSCRIPTIONS`, `SCHEDULEOS_PUBLIC_EVENT_SUBSCRIPTION_HEALTH_ALERT_EXHAUSTED_SUBSCRIPTIONS`, and `SCHEDULEOS_PUBLIC_EVENT_SUBSCRIPTION_HEALTH_ALERT_NEVER_DELIVERED_SUBSCRIPTIONS`.
- `GET /api/events/webhook-subscriptions/health` now returns summary-only `alert.enabled`, `alert.status`, threshold metadata, and trigger metadata when configured thresholds are met, without sending hosted alerts or returning webhook secrets or raw target URLs.
- Added API and standalone config coverage proving subscription-health thresholds produce `REVIEW_REQUIRED`, env vars map into server options, and invalid zero thresholds are rejected at startup.
- Verification before documentation update: focused `npm run build && node --test dist/api.test.js dist/server.test.js` passed after adding the API option, startup validation, alert helper, health response field, env parsing, and tests.
- Full required gates after documentation update: `npm run check` passed 432 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is local/self-host threshold signaling only. It does not create hosted dashboards, alert routing, durable production workers, durable retry queues, durable dead-letter queues, production managed secret provider proof, remote CI proof, or final security/privacy/licensing approval.

## 2026-07-23 Public Event Subscription Health Observability Foundation Update

- Added `GET /api/events/webhook-subscriptions/health` local/self-host subscription-health observability foundation for public-event webhook subscriptions.
- Endpoint returns scoped summary counts for total, enabled, disabled, healthy, failing, exhausted, and never-delivered subscriptions plus content-minimized per-subscription rows with subscription ID, status, target URL hash, event filters, source-system filter, latest attempt status/time, delivered/failed/retryable/exhausted counts, and health state.
- Added API coverage proving enabled subscription repeated retryable failures report `EXHAUSTED`, disabled never-delivered subscription remains `DISABLED` while still counting as never delivered in summary, invalid `maxAttempts=0` is rejected, and raw target URLs and webhook secrets are not returned.
- Verification before documentation update: focused API proof first failed `404` because `/api/events/webhook-subscriptions/health` did not exist, then `npm run build && node --test dist/api.test.js` passed after adding endpoint, health summarizer, validation, and test coverage.
- Full required gates after documentation update: `npm run check` passed 429 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is local/self-host observability only. It does not create hosted dashboards, alert routing, durable production workers, durable retry queues, durable dead-letter queues, production managed secret provider proof, remote CI proof, or final security/privacy/licensing approval.

## 2026-07-23 Public Event Subscription Pause/Resume Foundation Update

- Added `POST /api/events/webhook-subscriptions/status` as a local/self-host subscription pause/resume foundation.
- Status changes append a scoped subscription metadata event with the existing target URL hash, secret hash, event filters, source-system filter, and updated `ENABLED` or `DISABLED` state, without returning raw target URLs or webhook secrets.
- Subscription listing, explicit subscription delivery, and worker-style `deliver-ready` selection now use the latest subscription state per subscription ID so stale enabled events do not keep disabled subscriptions eligible.
- Added API coverage proving a subscription can be disabled, skipped by `deliver-ready`, re-enabled, listed once as current state, and made eligible again without leaking raw target URLs or secrets.
- Verification before documentation update: focused API proof first failed with `404` because the status endpoint did not exist, then `npm run build && node --test dist/api.test.js` passed after adding the endpoint, parser, current-state subscription grouping, and test coverage.
- Full required gates after documentation update: `npm run check` passed 428 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is local/self-host pause/resume metadata control only. It does not create production worker pause queues, in-flight attempt draining, hosted approval workflows, dashboards, alert routing, managed secret provider proof, remote CI proof, or final security/privacy/licensing approval.

## 2026-07-23 Public Event Exhausted Delivery Visibility Foundation Update

- Added `GET /api/events/webhook-deliveries/exhausted` as a local/self-host exhausted-delivery visibility foundation for public-event webhook delivery attempts.
- The endpoint groups latest attempts by event ID and target URL hash, reports failed attempts that are non-retryable, missing retry schedule, or at/over configurable `maxAttempts`, and returns only content-minimized event IDs, target URL hashes, attempt numbers, statuses, timestamps, and exhaustion reasons.
- Added API coverage proving a failed delivery retried to attempt 2 appears as `retry_limit_reached` when `maxAttempts=2`, while the response does not leak raw target URLs or webhook secrets.
- Verification before documentation update: focused API proof first failed because the endpoint did not exist, then `npm run build && node --test dist/api.test.js` passed after adding the endpoint, query validation, exhausted grouping logic, and test coverage.
- Full required gates after documentation update: `npm run check` passed 427 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is exhausted-delivery visibility only. It does not create durable dead-letter queues, hosted dashboards, alert routing, production workers, managed secret provider proof, remote CI proof, or final security/privacy/licensing approval.

## 2026-07-23 Public Event Delivery Incident Drill Packet Foundation Update

- Added `public-events:delivery-incident-drill-packet` CLI support and package script for review-only public-event delivery incident rehearsals.
- Packet includes tenant/workspace/user scope, `asOf`, incident ID, failure class, optional event type/source-system filters, optional `maxSubscriptions` and `maxEvents` bounds, bounded dry-run command, pause posture, evidence collection list, containment steps, privacy boundaries, review steps, and production-boundary flags.
- Added CLI coverage proving the packet emits privacy-safe rehearsal evidence, never authorizes apply/replay/live delivery, points to bounded dry-run delivery evidence, avoids raw target URLs and secrets, and rejects invalid dates, invalid failure classes, and non-positive bounds.
- Verification before documentation update: focused `npm run build && node --test dist/cli.test.js` passed after adding the packet command, parser, package script, and tests.
- Full required gates after documentation update: `npm run check` passed 426 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is an incident drill packet foundation only. It does not create durable production workers, persistent queues, hosted retry execution, hosted dashboards, alert routing, managed secret provider proof, completed production incident drills, remote CI proof, or final security/privacy/licensing approval.

## 2026-07-23 Public Event Delivery Operator Packet Foundation Update

- Added `public-events:delivery-operator-packet` CLI support and matching package script for bounded dry-run public-event subscription delivery worker invocation evidence.
- The packet includes tenant/workspace/user scope, `asOf`, optional event type and source-system filters, optional `maxSubscriptions` and `maxEvents` bounds, a dry-run request payload for `POST /api/events/webhook-subscriptions/deliver-ready`, review steps, and production-boundary flags.
- Added CLI coverage proving the packet emits bounded worker evidence, defaults to dry-run, requires managed secret provider review, marks durable production workers as still required, avoids raw target URLs, and rejects invalid dates or non-positive bounds. Also isolated ready-delivery API tests to dedicated tenant/workspace/user scopes so broad test runs cannot leak prior default-scope events into worker delivery counts.
- Full required gates after documentation update: `npm run check` passed 424 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is an operator packet foundation only. It does not create durable production workers, persistent queues, hosted retry execution, hosted dashboards, alert routing, managed secret provider proof, production incident drills, remote CI proof, or final security/privacy/licensing approval.

## 2026-07-23 Managed Secret Resolver Boundary Foundation Update

- Added an implementation-facing `ApiServerOptions.managedSecrets` resolver boundary for public-event delivery target URL and signing-secret references.
- `publicEventDeliveryTargets` can now use `targetUrlSecretRef` and `signingSecretRef` instead of raw local target values; raw `{ targetUrl, secret }` local/self-host configuration remains supported.
- Secret references are validated against `scheduleos/{tenantId}/{workspaceId}/{purpose}/...` scope before provider resolution. Cross-scope refs are rejected before the resolver is called.
- Subscription registration and configured-target delivery continue to store and return only target URL hash, secret hash, and delivery-target reference hash; responses do not include raw target URLs, signing secrets, raw delivery-target refs, or raw secret refs.
- Fixed public-event delivery retry IDs to include attempt number in the delivery ID hash material so fast retry attempts cannot reuse the first attempt delivery ID when timestamps collide in the same millisecond.
- Verification before documentation update: focused API proof first failed because `managedSecrets`, `targetUrlSecretRef`, and `signingSecretRef` were not supported, then `npm run build && node --test dist/api.test.js` passed with 166 API tests after adding the resolver boundary, scoped ref validation, managed-ref delivery tests, cross-scope rejection coverage, and retry delivery ID fix.
- Full required gates after documentation update: `npm run check` passed 422 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is an implementation-facing resolver boundary only. Production managed secret provider selection, runtime identity policy, provider audit logs, rotation and emergency revocation drills, hosted log/export/backup secret scans, durable subscription workers, hosted operations, hosted observability, remote CI proof, and final security/privacy/licensing gates remain incomplete.

## 2026-07-23 Managed Secret Storage Contract Foundation Update

- Added `docs/operations/managed-secret-storage-runbook.md` as the production managed-secret storage contract foundation.
- The runbook defines production secret classes, the scoped `secretRef` convention, server-side resolution flow, provider requirements, rotation and emergency revocation expectations, access-control boundaries, release evidence, and the local/self-host boundary.
- Linked the runbook from `README.md`, `docs/architecture/integration-model.md`, `docs/self-hosting.md`, `docs/security/threat-model.md`, `docs/operations/public-event-delivery-operator-runbook.md`, `docs/operations/webhook-secret-lifecycle-runbook.md`, and `docs/public-release-checklist.md`.
- Verification before audit note: `npm run check` passed 420 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is a contract and operations foundation only. Production managed secret storage implementation, durable subscription delivery workers, durable hosted retry workers, hosted delivery dashboards, hosted alert routing, production incident drills, remote CI proof, final security/privacy/licensing gates, and complete release audit remain incomplete.

## 2026-07-23 Public Event Worker-Style Subscription Delivery Foundation Update

- Added `POST /api/events/webhook-subscriptions/deliver-ready` as a local/self-host worker-style subscription delivery foundation.
- The endpoint scans enabled scoped subscriptions with configured delivery-target references, resolves targets server-side, delivers matching content-minimized public events, records delivery attempts, and returns grouped delivery counts and hashed attempt views without webhook secrets, raw target URLs, or raw delivery-target references.
- Added API coverage proving two enabled configured-target subscriptions receive a scoped `calendar.event_imported` public event, a disabled subscription is skipped, and the response does not leak configured target URLs, secrets, or raw target references.
- Verification before documentation update: focused API test first failed because `/api/events/webhook-subscriptions/deliver-ready` did not exist, then `npm run build && node --test dist/api.test.js` passed with 161 API tests after adding the worker-style route, subscription scan, server-side target resolution, grouped result response, and audit-backed delivery attempts.
- Release remains `FAIL`: this creates a local/self-host worker-style delivery foundation only. Production managed secret storage, durable subscription delivery workers, durable hosted retry workers, hosted delivery dashboards, hosted alert routing, production incident drills, remote CI proof, final security/privacy/licensing gates, and complete release audit remain incomplete.

## 2026-07-23 Public Event Configured Delivery Target Reference Foundation Update

- Added local/self-host configured delivery-target reference support through `ApiServerOptions.publicEventDeliveryTargets`.
- `POST /api/events/webhook-subscriptions` can now register a subscription with `deliveryTargetRef` instead of raw `targetUrl` and `secret`; stored and returned metadata contains target URL hash, secret hash, and delivery-target reference hash only.
- `POST /api/events/webhook-subscriptions/deliver` can resolve the configured delivery target server-side from the stored reference hash, deliver matching scoped public events, record delivery attempts, and return content-minimized attempt views without raw webhook target URLs, secrets, or raw target references in subscription or delivery request bodies.
- Added API coverage proving a configured target-reference subscription can be registered without leaking raw target URL, secret, or target reference; can deliver a scoped `calendar.event_imported` public event without raw target URL or secret in the delivery request; and keeps the delivery response content-minimized.
- Verification before documentation update: focused API test first failed with `422` because `/api/events/webhook-subscriptions` required raw `targetUrl` and `secret`, then `npm run build && node --test dist/api.test.js` passed with 160 API tests after adding configured target references, server-side resolution, subscription hash metadata, and audit-backed delivery attempts.
- Full required gates after documentation update: `npm run check` passed 414 tests, documentation link check across 62 Markdown files, release safety scan across 110 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this creates a local/self-host configured target-reference foundation only. Production managed secret storage, durable subscription delivery workers, durable hosted retry workers, hosted delivery dashboards, hosted alert routing, production incident drills, remote CI proof, final security/privacy/licensing gates, and complete release audit remain incomplete.

## 2026-07-23 Public Event Subscription Delivery Execution Foundation Update

- Added `POST /api/events/webhook-subscriptions/deliver` as a local/self-host subscription delivery execution foundation.
- The endpoint reads scoped registered subscription metadata, verifies the caller-provided target URL and secret against stored hashes, rejects mismatched secrets or targets, sends matching scoped public event types, records delivery attempts, and returns content-minimized attempt views without webhook secrets or raw target URLs.
- Added API coverage proving a registered enabled subscription can deliver a scoped `calendar.event_imported` public event to a local receiver, does not leak the webhook secret or raw target URL in the response, and rejects a mismatched secret with `SUBSCRIPTION_SECRET_MISMATCH`.
- Verification before documentation update: focused API test first failed with `404` because `/api/events/webhook-subscriptions/deliver` did not exist, then `npm run build && node --test dist/api.test.js` passed with 159 API tests after adding the route, hash verification, subscription filters, and audit-backed delivery attempts.
- Full required gates after documentation update: `npm run check` passed 413 tests, documentation link check across 62 Markdown files, release safety scan across 110 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this creates a local/self-host subscription delivery execution foundation only. Production managed secret storage, durable subscription delivery workers, durable hosted retry workers, hosted delivery dashboards, hosted alert routing, production incident drills, remote CI proof, final security/privacy/licensing gates, and complete release audit remain incomplete.

## 2026-07-23 Public Event Retry Execution Foundation Update

- Added `POST /api/events/webhook-deliveries/retry-due` as a local/self-host retry execution foundation for due failed retryable public-event webhook delivery attempts.
- Retry execution selects scoped failed retryable attempts due by `asOf`, retries the original content-minimized public event for the caller-provided target and secret, records the next attempt number, and returns content-minimized attempt views without webhook secrets or raw target URLs.
- Added API coverage proving an initial failed `503` delivery can be retried successfully as attempt 2, records both attempts, keeps the event body stable, uses a new delivery ID, and does not leak webhook secret or raw target URL in the retry response.
- Verification before documentation update: focused API test first failed with `404` because `/api/events/webhook-deliveries/retry-due` did not exist, then `npm run build && node --test dist/api.test.js` passed with 158 API tests after adding the retry route and audit-backed retry selection.
- Full required gates after documentation update: `npm run check` passed 412 tests, documentation link check across 62 Markdown files, release safety scan across 110 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this creates a local/self-host retry execution foundation only. Production subscription delivery workers, durable hosted retry workers, managed secret storage integration, hosted delivery dashboards, hosted alert routing, production incident drills, remote CI proof, final security/privacy/licensing gates, and complete release audit remain incomplete.

## 2026-07-23 Public Event Delivery Operator Runbook Update

- Added `docs/operations/public-event-delivery-operator-runbook.md` covering production subscription worker expectations, subscription operations, retry policy, hosted observability, alerts, incident response, pause/disable behavior, privacy requirements, and production verification checklist.
- Updated the integration model, README, and public release checklist to mark the public-event delivery operator runbook as a documentation foundation.
- Full required gates after documentation update: `npm run check` passed 411 tests, documentation link check across 62 Markdown files, release safety scan across 110 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this closes public-event delivery operator-runbook documentation only. Production subscription delivery workers, persistent retry execution, managed secret storage integration, hosted delivery dashboards, hosted alert routing, production incident drills, remote CI proof, final security/privacy/licensing gates, and complete release audit remain incomplete.

## 2026-07-23 Public Event Subscription Metadata Foundation Update

- Added `POST /api/events/webhook-subscriptions` and `GET /api/events/webhook-subscriptions?tenantId=...&workspaceId=...&userId=...` as a local/self-host subscription metadata foundation.
- Subscription create/list responses expose scoped metadata, event type filters, source-system filter, status, timestamps, target URL hash, and secret hash without returning webhook secrets or raw target URLs.
- Added API coverage proving scoped registration, scoped listing, cross-user isolation, and no secret or raw target URL leak.
- Verification before documentation update: focused API test first failed with `404` because `/api/events/webhook-subscriptions` did not exist, then `npm run build && node --test dist/api.test.js` passed with 157 API tests after adding the metadata routes and audit-backed read model.
- Full required gates after documentation update: `npm run check` passed 411 tests, documentation link check across 61 Markdown files, release safety scan across 109 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this creates subscription metadata only. Production subscription delivery workers, persistent retry execution, hosted delivery workers, hosted delivery observability, remote CI proof, final security/privacy/licensing gates, and complete release audit remain incomplete.

## 2026-07-23 Public Event Receiver Replay Guidance Update

- Added `docs/operations/public-event-webhook-receiver-runbook.md` covering required delivery headers, signature base string, timestamp tolerance, replay-key selection, replay-store retention, duplicate handling, failure response expectations, secret rotation, and privacy expectations for receivers.
- Updated the integration model and public release checklist to mark receiver replay-store guidance as a local/self-host documentation foundation.
- Full required gates after documentation update: `npm run check` passed 410 tests, documentation link check across 61 Markdown files, release safety scan across 109 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this closes receiver replay-store guidance only. Production subscription delivery workers, persistent retry execution, hosted delivery workers, hosted delivery observability, remote CI proof, final security/privacy/licensing gates, and complete release audit remain incomplete.

## 2026-07-23 Public Event Webhook Delivery Foundation Update

- Added `POST /api/events/webhook-deliveries` as a local/self-host explicit delivery foundation for scoped public events.
- The endpoint filters the existing `ScheduleOSEvent` read model by scope plus optional `type` and `sourceSystem`, then POSTs content-minimized event envelopes to a caller-provided webhook target.
- Each delivery includes `scheduleos-event-id`, `scheduleos-delivery-id`, `scheduleos-timestamp`, and `scheduleos-signature` headers. The signature is HMAC-SHA256 over timestamp, delivery ID, event ID, and JSON body.
- Non-local webhook targets must use HTTPS; loopback HTTP is allowed only for local/self-host development and verification.
- Added API coverage proving a local receiver gets a signed `calendar.event_imported` delivery without copied private calendar title content, and proving non-local HTTP targets are rejected.
- Verification before documentation update: focused API test first failed with `404` because `/api/events/webhook-deliveries` did not exist, then `npm run build && node --test dist/api.test.js` passed with 155 API tests after adding the local delivery endpoint and target validation.
- Follow-up coverage now includes `GET /api/events/webhook-deliveries` delivery-attempt observability from scoped audit evidence, returning delivery status, event ID, delivery ID, event type, HTTP status, timestamp, and target URL hash without returning webhook secrets, raw target URLs, or private calendar title content.
- Verification before documentation update: focused API test first failed with `404` because delivery-attempt listing did not exist, then `npm run build && node --test dist/api.test.js` passed with 155 API tests after adding scoped delivery-attempt audit evidence and read mapping.
- Follow-up coverage now includes retry metadata for failed public-event deliveries: `retryable`, `attemptNumber`, and `nextRetryAt` are included for network failures and failed `408`, `429`, or `5xx` responses.
- Verification before documentation update: focused API test first failed because failed `503` delivery attempts had no retry metadata, then `npm run build && node --test dist/api.test.js` passed with 156 API tests after adding retry metadata to delivery attempts and the scoped attempt read model.
- Release remains `FAIL`: this creates a local/self-host explicit delivery and delivery-attempt observability foundation, but production subscription delivery workers, persistent retry queues, hosted delivery operations, hosted delivery observability, remote CI proof, final security/privacy/licensing gates, and complete release audit remain incomplete.

## 2026-07-23 Public Event Read Model Foundation Update

- Added `GET /api/events?tenantId=...&workspaceId=...&userId=...` as a local/self-host public event read-model foundation.
- The endpoint derives content-minimized `ScheduleOSEvent` envelopes from known scoped audit evidence instead of exposing raw audit rows or task payload content.
- Current mapping exposes task import audit evidence as `task.imported`, schedule lifecycle evidence as `schedule.created`, `schedule.accepted`, and `schedule.rejected`, and block lifecycle evidence as `block.locked`, `block.unlocked`, `block.completed`, and `block.missed`; it supports optional `type` and `sourceSystem` filters, hashes public event IDs and idempotency keys, and keeps raw task titles/descriptions out of public event data.
- Added API coverage proving scoped access, `task.imported` shape, schedule and block lifecycle event shape, source/type filtering, hashed idempotency keys, and no copied task-title leak.
- Verification before documentation update: focused API test first failed with `404` because `/api/events` did not exist, then `npm run build && node --test dist/api.test.js` passed after adding the scoped read endpoint and mapper.
- Follow-up coverage now includes `schedule.replanned` public event evidence from the local replan API, with type filtering and no copied private calendar-event title leak.
- Follow-up coverage now includes `schedule.capacity_exceeded` and `task.deadline_at_risk` public warning-event evidence from local capacity/deadline warnings, with no copied task title, warning message, or private calendar-event title leak.
- Follow-up coverage now includes `calendar.event_imported` and `calendar.event_changed` public event evidence from local ConnectOS calendar imports, with no copied private calendar title or provider token leak.
- Follow-up coverage now includes `calendar.event_imported` and `calendar.event_changed` public event evidence from local ScheduleOS calendar event create/update APIs, with no copied private calendar title leak.
- Release remains `FAIL`: this creates a local public event read-model foundation, but production signed replay-safe webhook delivery, hosted delivery operations, remote CI proof, final security/privacy/licensing gates, and complete release audit remain incomplete.

## 2026-07-23 Public Event Catalog Foundation Update

- Added `GET /api/events/catalog` as a public, read-only event-contract catalog.
- Catalog returns the `ScheduleOSEvent` required envelope fields, v1 event type catalog, content-minimized privacy posture, idempotency requirement, scope fields, and explicit production webhook delivery boundary.
- Added API coverage proving the catalog includes `task.imported`, `schedule.capacity_exceeded`, the canonical envelope fields, no fictional provider fixture rows, and no email-like strings.
- Verification before documentation update: focused API test first failed with `404` because `/api/events/catalog` did not exist, then `npm run build && node --test dist/api.test.js` passed after adding the route and static catalog.
- Full required gates after documentation update: `npm run check` passed 406 tests, documentation link check across 60 Markdown files, release safety scan across 108 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this creates a public event-contract foundation, but production webhook delivery, signed replay-safe outbound delivery, remote CI proof, final security/privacy/licensing gates, and complete release audit remain incomplete.

## 2026-07-23 Provider CSV Microsoft Planner Fixture Foundation Update

- Added Microsoft Planner-style CSV template coverage using fictional `planner_demo_*` rows only.
- Added Microsoft Planner sample download coverage through `GET /api/task-sources/csv/templates/microsoft_planner/sample`.
- Added Microsoft Planner `templateId` dry-run import coverage mapping `Task ID`, `Task Name`, `Bucket Name`, `Due Date`, `Priority`, `Estimated Minutes`, `Labels`, and `Task Link` into ScheduleOS task fields without requiring any Microsoft connection.
- Added `MICROSOFT_PLANNER_CSV` provider import policy entry so local preview/review can surface source-specific risk and suggested throttling guidance.
- Verification before documentation update: focused API tests first failed because `microsoft_planner` was missing from the provider-template catalog, sample download, import mapper, and provider policy, then `npm run build && node --test dist/api.test.js` passed after adding the template and provider import policy.
- Full required gates after documentation update: `npm run check` passed 405 tests, documentation link check across 60 Markdown files, release safety scan across 108 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this broadens local fictional provider CSV fixture coverage, but production-grade provider CSV import still needs production upload/download polish, larger real-provider export fixture sets, provider-specific quota governance, hosted abuse analytics, browser matrix coverage, and final release gates.

## 2026-07-23 Public Release Security Audit Evidence Refresh

- Updated `docs/security/public-release-security-audit.md` from stale "not run" wording to current canonical evidence.
- Preserved security audit result as `FAIL`; this documentation refresh does not approve public release.
- Recorded current local evidence for `npm run check`, high-severity production dependency audit, `.git` absence gate, release safety scanning, security headers, local auth/session foundations, throttle foundations, and licensing-audit foundation.
- Clarified remaining blockers: final release-candidate gates, clean-history/public remote CI proof, production auth/session hardening, provider token lifecycle, production abuse monitoring, deployment TLS/proxy/header review, privacy review, licensing audit `PASS`, and public security contact configuration.
- Release remains `FAIL`: this removes stale audit language but does not complete the public-release security gate.

## 2026-07-22 Provider CSV Trello Fixture Foundation Update

- Added local provider CSV template coverage for Trello-style card exports using fictional `trello_demo_*` rows only.
- Added Trello sample download coverage through `GET /api/task-sources/csv/templates/trello/sample`.
- Added Trello `templateId` dry-run import coverage mapping `Card ID`, `Card Name`, `List Name`, `Due Date`, `Labels`, `Card URL`, and `Estimated Minutes` into ScheduleOS task fields without requiring any Trello connection.
- Added a `TRELLO_CSV` provider import policy entry so local preview/review can surface source-specific risk and suggested throttling guidance.
- Verification before documentation update: focused API tests first failed because `trello` was missing from the provider-template catalog, sample download, and import mapper, then `npm run build && node --test dist/api.test.js` passed after adding the Trello template and provider import policy.
- Full required gates after documentation update: `npm run check` passed 405 tests, documentation link check across 60 Markdown files, release safety scan across 108 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this broadens local fictional provider CSV fixture coverage, but production-grade provider CSV import still needs production upload/download polish, larger real-provider export fixture sets, provider-specific quota governance, hosted abuse analytics, browser matrix coverage, and final release gates.

## 2026-07-22 ICS Yearly Time-Window BYSETPOS TZID Wall-Clock Foundation Update

- Preserved local wall-clock time for yearly `BYMONTH`/`BYMONTHDAY` plus `BYHOUR`/`BYMINUTE` and `BYSETPOS` recurring VEVENT imports that use an IANA `TZID`, so rules such as `FREQ=YEARLY;BYMONTH=1,7;BYMONTHDAY=15;BYHOUR=9,13;BYMINUTE=30;BYSETPOS=-1` select the last local time-window candidate per year while UTC timestamps stay correct for daylight-saving status dates.
- Added parser proof for a New York yearly last-window event, expecting July 15 occurrences at 17:30 UTC in 2025 and 2026 while preserving `America/New_York` source timezone.
- Added local API ICS import coverage for the same yearly time-window `BYSETPOS` `TZID` recurrence through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser/API tests first failed because yearly time-window `BYSETPOS` rules with `TZID` skipped the zoned wall-clock path and produced UTC-shaped candidates, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed after applying `BYSETPOS` inside yearly zoned time-window recurrence generation.
- Full required gates after documentation update: `npm run check` passed 405 tests, documentation link check across 60 Markdown files, release safety scan across 108 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows local recurring timezone compatibility, but release-grade ICS workflow still needs broader provider fixtures, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS Monthly Time-Window BYSETPOS TZID Wall-Clock Foundation Update

- Preserved local wall-clock time for monthly `BYMONTHDAY` plus `BYHOUR`/`BYMINUTE` and `BYSETPOS` recurring VEVENT imports that use an IANA `TZID`, so rules such as `FREQ=MONTHLY;BYMONTHDAY=1,15;BYHOUR=9,13;BYMINUTE=30;BYSETPOS=-1` select the last local time-window candidate per month while UTC timestamps shift correctly across daylight saving changes.
- Added parser proof for a New York monthly last-window event across the March 2025 daylight-saving transition, expecting January and February occurrences at 18:30 UTC and March and April occurrences at 17:30 UTC.
- Added local API ICS import coverage for the same monthly time-window `BYSETPOS` `TZID` recurrence through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser/API tests first failed because monthly time-window `BYSETPOS` rules with `TZID` generated UTC-shaped candidates, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed after applying `BYSETPOS` inside monthly zoned time-window recurrence generation.
- Full required gates after documentation update: `npm run check` passed 403 tests, documentation link check across 60 Markdown files, release safety scan across 108 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows local recurring timezone compatibility, but release-grade ICS workflow still needs broader provider fixtures, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS Weekly Time-Window BYSETPOS TZID Wall-Clock Foundation Update

- Preserved local wall-clock time for weekly `BYDAY` plus `BYHOUR`/`BYMINUTE` and `BYSETPOS` recurring VEVENT imports that use an IANA `TZID`, so rules such as `FREQ=WEEKLY;BYDAY=MO,WE;BYHOUR=9,13;BYMINUTE=30;BYSETPOS=-1` select the last local time-window candidate per week while UTC timestamps shift correctly across daylight saving changes.
- Added parser proof for a New York weekly last-window event across the March 2025 daylight-saving transition, expecting March 5 at 18:30 UTC and March 12 at 17:30 UTC.
- Added local API ICS import coverage for the same weekly time-window `BYSETPOS` `TZID` recurrence through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser/API tests first failed because weekly time-window `BYSETPOS` rules with `TZID` skipped the zoned wall-clock path and produced UTC-shaped candidates, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed after applying `BYSETPOS` inside weekly zoned time-window recurrence generation.
- Full required gates after documentation update: `npm run check` passed; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows local recurring timezone compatibility, but release-grade ICS workflow still needs broader provider fixtures, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS Daily Time-Window BYSETPOS TZID Wall-Clock Foundation Update

- Preserved local wall-clock time for daily `BYHOUR`/`BYMINUTE` plus `BYSETPOS` recurring VEVENT imports that use an IANA `TZID`, so rules such as `FREQ=DAILY;BYHOUR=9,13;BYMINUTE=30;BYSETPOS=-1` select the last local time-window candidate per day while UTC timestamps shift correctly across daylight saving changes.
- Added parser proof for a New York daily last-window event across the March 2025 daylight-saving transition, expecting March 8 at 18:30 UTC and March 9/10 at 17:30 UTC.
- Added local API ICS import coverage for the same daily time-window `BYSETPOS` `TZID` recurrence through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser/API tests first failed because daily time-window `BYSETPOS` rules with `TZID` skipped the zoned wall-clock path and produced UTC-shaped candidates, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed after applying `BYSETPOS` inside daily zoned time-window recurrence generation.
- Full required gates after documentation update: `npm run check` passed; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows local recurring timezone compatibility, but release-grade ICS workflow still needs broader provider fixtures, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS Yearly Time-Window TZID Wall-Clock Foundation Update

- Preserved local wall-clock time for yearly `BYMONTH`/`BYMONTHDAY` plus `BYHOUR`/`BYMINUTE`/`BYSECOND` recurring VEVENT imports that use an IANA `TZID`, so rules such as `FREQ=YEARLY;BYMONTH=1,7;BYMONTHDAY=15;BYHOUR=9;BYMINUTE=30;BYSECOND=0` keep the same local time while UTC timestamps shift correctly between standard-time and daylight-saving dates.
- Added parser proof for a New York yearly January/July 15 09:30 time-window event across 2025 and 2026, expecting January occurrences at 14:30 UTC and July occurrences at 13:30 UTC.
- Added local API ICS import coverage for the same yearly time-window `TZID` recurrence through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser/API tests first failed because yearly time-window recurrence generation treated `BYHOUR` as UTC and skipped the first local same-day candidate, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed after yearly time-window wall-clock recurrence generation.
- Full required gates after documentation update: `npm run check` passed 397 tests, documentation link check across 60 Markdown files, release safety scan across 108 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows local recurring timezone compatibility, but release-grade ICS workflow still needs broader provider fixtures, advanced timezone recurrence coverage, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS Monthly Time-Window TZID Wall-Clock Foundation Update

- Preserved local wall-clock time for monthly `BYMONTHDAY` plus `BYHOUR`/`BYMINUTE`/`BYSECOND` recurring VEVENT imports that use an IANA `TZID`, so rules such as `FREQ=MONTHLY;BYMONTHDAY=1,15;BYHOUR=9;BYMINUTE=30;BYSECOND=0` keep the same local time while UTC timestamps shift correctly across daylight saving changes.
- Added parser proof for a New York monthly 1st/15th 09:30 time-window event across the March 2026 daylight-saving transition, expecting March 1 at 14:30 UTC, then March 15, April 1, and April 15 at 13:30 UTC.
- Added local API ICS import coverage for the same monthly time-window `TZID` recurrence through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser/API tests first failed because monthly time-window recurrence generation treated `BYHOUR` as UTC and skipped the first local same-day candidate, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed after monthly time-window wall-clock recurrence generation.
- Full required gates after documentation update: `npm run check` passed 395 tests, documentation link check across 60 Markdown files, release safety scan across 108 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows local recurring timezone compatibility, but release-grade ICS workflow still needs broader provider fixtures, advanced timezone recurrence coverage, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS Weekly Time-Window TZID Wall-Clock Foundation Update

- Preserved local wall-clock time for weekly `BYDAY` plus `BYHOUR`/`BYMINUTE`/`BYSECOND` recurring VEVENT imports that use an IANA `TZID`, so rules such as `FREQ=WEEKLY;BYDAY=MO,WE;BYHOUR=9;BYMINUTE=30;BYSECOND=0` keep the same local time while UTC timestamps shift correctly across daylight saving changes.
- Added parser proof for a New York Monday/Wednesday 09:30 time-window event across the March 2026 daylight-saving transition, expecting March 2 and March 4 at 14:30 UTC, then March 9 and March 11 at 13:30 UTC.
- Added local API ICS import coverage for the same weekly time-window `TZID` recurrence through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser/API tests first failed because weekly time-window recurrence generation treated `BYHOUR` as UTC and skipped the first local same-day candidate, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed after weekly time-window wall-clock recurrence generation.
- Release remains `FAIL`: this narrows local recurring timezone compatibility, but release-grade ICS workflow still needs broader provider fixtures, advanced timezone recurrence coverage, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS Daily Time-Window TZID Wall-Clock Foundation Update

- Preserved local wall-clock time for daily `BYHOUR`/`BYMINUTE`/`BYSECOND` recurring VEVENT imports that use an IANA `TZID`, so rules such as `FREQ=DAILY;BYHOUR=9;BYMINUTE=30;BYSECOND=0` keep the same local time while UTC timestamps shift correctly across daylight saving changes.
- Added parser proof for a New York daily 09:30 time-window event across the March 2026 daylight-saving transition, expecting March 7 at 14:30 UTC and March 8/9 at 13:30 UTC.
- Added local API ICS import coverage for the same daily time-window `TZID` recurrence through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser/API tests first failed because daily time-window recurrence generation treated `BYHOUR` as UTC and skipped the first local same-day candidate, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed after daily time-window wall-clock recurrence generation.
- Release remains `FAIL`: this narrows local recurring timezone compatibility, but release-grade ICS workflow still needs broader provider fixtures, advanced timezone recurrence coverage, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS Weekly BYDAY BYMONTH TZID Wall-Clock Foundation Update

- Preserved local wall-clock time for weekly `BYDAY` plus `BYMONTH` recurring VEVENT imports that use an IANA `TZID`, so rules such as `FREQ=WEEKLY;BYDAY=MO;BYMONTH=3` keep the same local time while UTC timestamps shift correctly across daylight saving changes.
- Added parser proof for a New York March-only Monday event, expecting March 3 at 14:00 UTC and March 10/17/24 at 13:00 UTC.
- Added local API ICS import coverage for the same weekly `BYDAY` plus `BYMONTH` `TZID` recurrence through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser/API tests first failed because weekly `BYDAY` plus `BYMONTH` recurrence generation kept fixed UTC time, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed after weekly month-filtered wall-clock recurrence generation.
- Release remains `FAIL`: this narrows local recurring timezone compatibility, but release-grade ICS workflow still needs broader provider fixtures, advanced timezone recurrence coverage, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS Yearly BYWEEKNO TZID Wall-Clock Foundation Update

- Preserved local wall-clock time for yearly `BYWEEKNO` recurring VEVENT imports that use an IANA `TZID`, so rules such as `BYWEEKNO=10,11;BYDAY=MO;WKST=MO` keep the same local time while UTC timestamps shift correctly across daylight saving changes.
- Added parser proof for a New York yearly week-number event, expecting March 3 and March 2 occurrences at 14:00 UTC, and March 10 and March 9 occurrences at 13:00 UTC for 2025 and 2026.
- Added local API ICS import coverage for the same yearly `BYWEEKNO` `TZID` recurrence through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser/API tests first failed because yearly `BYWEEKNO` recurrence generation kept fixed UTC time, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed after yearly `BYWEEKNO` wall-clock recurrence generation.
- Release remains `FAIL`: this narrows local recurring timezone compatibility, but release-grade ICS workflow still needs broader provider fixtures, advanced timezone recurrence coverage, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS Yearly BYYEARDAY TZID Wall-Clock Foundation Update

- Preserved local wall-clock time for yearly `BYYEARDAY` recurring VEVENT imports that use an IANA `TZID`, so rules such as `BYYEARDAY=1,100` keep the same local time while UTC timestamps shift correctly across daylight saving changes.
- Added parser proof for a New York yearly year-day event, expecting January 1 occurrences at 14:00 UTC and April 10 occurrences at 13:00 UTC for 2025 and 2026.
- Added local API ICS import coverage for the same yearly `BYYEARDAY` `TZID` recurrence through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser/API tests first failed because yearly `BYYEARDAY` recurrence generation kept fixed UTC time, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed after yearly `BYYEARDAY` wall-clock recurrence generation.
- Release remains `FAIL`: this narrows local recurring timezone compatibility, but release-grade ICS workflow still needs broader provider fixtures, advanced timezone recurrence coverage, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS Yearly BYMONTH Plain BYDAY TZID Wall-Clock Foundation Update

- Preserved local wall-clock time for yearly `BYMONTH` plus plain `BYDAY` recurring VEVENT imports that use an IANA `TZID`, so rules such as `BYMONTH=3;BYDAY=MO` generate each matching local weekday while UTC timestamps shift correctly across daylight saving changes.
- Added parser proof for a New York yearly March-Mondays event, expecting March 3, 2025 at 14:00 UTC, March 10/17/24/31 at 13:00 UTC, and March 2, 2026 at 14:00 UTC.
- Added local API ICS import coverage for the same yearly `BYMONTH` plain `BYDAY` `TZID` recurrence through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser/API tests first failed because yearly `BYMONTH` plain `BYDAY` recurrence generation stayed on the yearly month-day path, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed after yearly plain `BYDAY` wall-clock recurrence generation.
- Release remains `FAIL`: this narrows local recurring timezone compatibility, but release-grade ICS workflow still needs broader provider fixtures, advanced timezone recurrence coverage, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS Yearly BYMONTH Ordinal BYDAY TZID Wall-Clock Foundation Update

- Preserved local wall-clock time for yearly `BYMONTH` plus ordinal `BYDAY` recurring VEVENT imports that use an IANA `TZID`, so rules such as `BYMONTH=3;BYDAY=2MO` stay at the same local time even when the matching date has different daylight-saving status in different years.
- Added parser proof for a New York yearly second-Monday-in-March event, expecting 2025 and 2026 at 13:00 UTC, then 2027 at 14:00 UTC because March 8, 2027 occurs before New York daylight saving time starts.
- Added local API ICS import coverage for the same yearly `BYMONTH` ordinal `BYDAY` `TZID` recurrence through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser/API tests first failed because yearly `BYMONTH` ordinal `BYDAY` recurrence generation kept fixed UTC time, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed after yearly ordinal `BYDAY` wall-clock recurrence generation.
- Release remains `FAIL`: this narrows local recurring timezone compatibility, but release-grade ICS workflow still needs broader provider fixtures, advanced timezone recurrence coverage, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS Monthly Plain BYDAY TZID Wall-Clock Foundation Update

- Preserved local wall-clock time for monthly plain `BYDAY` recurring VEVENT imports that use an IANA `TZID`, so rules such as `BYDAY=MO` generate each matching local weekday while UTC timestamps shift correctly across daylight saving changes.
- Added parser proof for a New York monthly Monday event over the March 2026 daylight-saving transition, expecting February 23 and March 2 at 14:00 UTC, then March 9, March 16, and March 23 at 13:00 UTC.
- Added local API ICS import coverage for the same monthly plain `BYDAY` `TZID` recurrence through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser/API tests first failed because monthly plain `BYDAY` recurrence generation stayed on the fixed UTC/month-day path, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed after monthly plain `BYDAY` wall-clock recurrence generation.
- Release remains `FAIL`: this narrows local recurring timezone compatibility, but release-grade ICS workflow still needs broader provider fixtures, advanced timezone recurrence coverage, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS Monthly Ordinal BYDAY TZID Wall-Clock Foundation Update

- Preserved local wall-clock time for monthly ordinal `BYDAY` recurring VEVENT imports that use an IANA `TZID`, so rules such as `BYDAY=1MO` stay at the same local time while UTC timestamps shift correctly across daylight saving changes.
- Added parser proof for a New York monthly first-Monday event over the March 2026 daylight-saving transition, expecting February 2 and March 2 at 14:00 UTC, then April 6 at 13:00 UTC.
- Added local API ICS import coverage for the same monthly ordinal `BYDAY` `TZID` recurrence through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser/API tests first failed because monthly ordinal `BYDAY` recurrence generation kept fixed UTC time, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed after monthly ordinal `BYDAY` wall-clock recurrence generation.
- Release remains `FAIL`: this narrows local recurring timezone compatibility, but release-grade ICS workflow still needs broader provider fixtures, advanced timezone recurrence coverage, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS Weekly BYDAY TZID Wall-Clock Foundation Update

- Preserved local wall-clock time for weekly `BYDAY` recurring VEVENT imports that use an IANA `TZID`, so selected weekdays stay at the same local time while UTC timestamps shift correctly across daylight saving changes.
- Added parser proof for a New York weekly `BYDAY=MO,WE` event over the March 2026 daylight-saving transition, expecting March 2 and March 4 at 14:00 UTC, then March 9 and March 11 at 13:00 UTC.
- Added local API ICS import coverage for the same weekly `BYDAY` `TZID` recurrence through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser/API tests first failed because weekly `BYDAY` recurrence generation kept fixed UTC time, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed after weekly `BYDAY` wall-clock recurrence generation.
- Release remains `FAIL`: this narrows local recurring timezone compatibility, but release-grade ICS workflow still needs broader provider fixtures, advanced timezone recurrence coverage, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS Yearly BYMONTH TZID Wall-Clock Foundation Update

- Preserved local wall-clock time for yearly `BYMONTH` recurring VEVENT imports that use an IANA `TZID`, using the original local day of month when `BYMONTHDAY` is omitted.
- Added parser proof for a New York yearly `BYMONTH=3` event, expecting 2025 at 14:00 UTC, 2026 at 13:00 UTC, and 2027 at 14:00 UTC.
- Added local API ICS import coverage for the same yearly `BYMONTH` `TZID` recurrence through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser/API tests first failed because yearly `BYMONTH` recurrence generation kept fixed UTC time, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed after yearly `BYMONTH` wall-clock recurrence generation.
- Release remains `FAIL`: this narrows local recurring timezone compatibility, but release-grade ICS workflow still needs broader provider fixtures, advanced yearly timezone recurrence coverage, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS Yearly BYMONTH BYMONTHDAY TZID Wall-Clock Foundation Update

- Preserved local wall-clock time for yearly `BYMONTH` plus `BYMONTHDAY` recurring VEVENT imports that use an IANA `TZID`, so annual month/day events remain at the same local time even when the date has different daylight-saving status in different years.
- Added parser proof for a New York yearly `BYMONTH=3;BYMONTHDAY=8` event, expecting 2025 at 14:00 UTC, 2026 at 13:00 UTC, and 2027 at 14:00 UTC.
- Added local API ICS import coverage for the same yearly `BYMONTH`/`BYMONTHDAY` `TZID` recurrence through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser/API tests first failed because yearly `BYMONTH`/`BYMONTHDAY` recurrence generation kept fixed UTC time, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed after yearly month/day wall-clock recurrence generation.
- Release remains `FAIL`: this narrows local recurring timezone compatibility, but release-grade ICS workflow still needs broader provider fixtures, advanced yearly timezone recurrence coverage, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS Yearly TZID Recurrence Wall-Clock Foundation Update

- Preserved local wall-clock time for simple yearly recurring VEVENT imports that use an IANA `TZID`, so a yearly America/New_York recurrence remains 09:00 local even when a repeated calendar date has different daylight-saving status in different years.
- Added parser proof for a New York yearly event on March 8, expecting 2025 at 14:00 UTC, 2026 at 13:00 UTC, and 2027 at 14:00 UTC.
- Added local API ICS import coverage for the same yearly `TZID` recurrence through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser/API tests first failed because yearly recurrence generation kept fixed UTC time, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed after yearly wall-clock recurrence generation.
- Release remains `FAIL`: this narrows local recurring timezone compatibility, but release-grade ICS workflow still needs broader provider fixtures, advanced yearly timezone recurrence coverage, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS Monthly BYMONTHDAY TZID Wall-Clock Foundation Update

- Preserved local wall-clock time for monthly `BYMONTHDAY` recurring VEVENT imports that use an IANA `TZID`, so a `BYMONTHDAY=15` America/New_York recurrence remains 09:00 local across daylight saving changes while stored UTC timestamps shift correctly.
- Added parser proof for a New York monthly `BYMONTHDAY=15` event over the March 2026 DST transition, expecting January and February at 14:00 UTC and March and April at 13:00 UTC.
- Added local API ICS import coverage for the same monthly `BYMONTHDAY` `TZID` recurrence through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser/API tests first failed because monthly `BYMONTHDAY` recurrence generation kept fixed UTC time, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed after monthly `BYMONTHDAY` wall-clock recurrence generation.
- Release remains `FAIL`: this narrows local recurring timezone compatibility, but release-grade ICS workflow still needs broader provider fixtures, advanced timezone recurrence coverage, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS Monthly TZID Recurrence Wall-Clock Foundation Update

- Preserved local wall-clock time for monthly recurring VEVENT imports that use an IANA `TZID`, so a 09:00 America/New_York monthly recurrence remains 09:00 local across daylight saving changes while stored UTC timestamps shift correctly.
- Added parser proof for a New York monthly event over the March 2026 DST transition, expecting January and February at 14:00 UTC and March and April at 13:00 UTC.
- Added local API ICS import coverage for the same monthly `TZID` recurrence through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser/API tests first failed because monthly recurrence generation kept fixed UTC time, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed after monthly wall-clock recurrence generation.
- Release remains `FAIL`: this narrows local recurring timezone compatibility, but release-grade ICS workflow still needs broader provider fixtures, advanced timezone recurrence coverage, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS Weekly TZID Recurrence Wall-Clock Foundation Update

- Preserved local wall-clock time for weekly recurring VEVENT imports that use an IANA `TZID`, so a 09:00 America/New_York weekly recurrence remains 09:00 local across daylight saving changes while stored UTC timestamps shift correctly.
- Added parser proof for a New York weekly event over the March 2026 DST transition, expecting March 1 at 14:00 UTC and March 8 and 15 at 13:00 UTC.
- Added local API ICS import coverage for the same weekly `TZID` recurrence through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser/API tests first failed because weekly recurrence generation kept fixed UTC time, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed with 178 tests after weekly wall-clock recurrence generation.
- Release remains `FAIL`: this narrows local recurring timezone compatibility, but release-grade ICS workflow still needs broader provider fixtures, advanced timezone recurrence coverage, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS Daily TZID Recurrence Wall-Clock Foundation Update

- Preserved local wall-clock time for daily recurring VEVENT imports that use an IANA `TZID`, so a 09:00 America/New_York recurrence remains 09:00 local across daylight saving changes while stored UTC timestamps shift correctly.
- Added parser proof for a New York daily event over the March 2026 DST transition, expecting March 7 at 14:00 UTC and March 8-9 at 13:00 UTC.
- Added local API ICS import coverage for the same daily `TZID` recurrence through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser test first failed because recurrence generation kept fixed UTC time, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed with 176 tests after wall-clock recurrence generation.
- Release remains `FAIL`: this narrows local recurring timezone compatibility, but release-grade ICS workflow still needs broader provider fixtures, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS Fixed-Event TZID Foundation Update

- Added fixed-event import support for IANA `TZID` local date-times, converting wall-clock values such as `DTSTART;TZID=America/New_York:20260722T090000` to UTC instants.
- Preserved the source timezone label on imported calendar events while correcting stored UTC `start` and `end` timestamps.
- Added parser proof for a New York fixed event expecting 09:00 local on July 22, 2026 to import as 13:00 UTC.
- Added local API ICS import coverage for fixed-event `TZID` through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser/API tests first failed by importing 09:00 as 09:00 UTC, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed with 174 tests after IANA TZID conversion.
- Release remains `FAIL`: this narrows local fixed-event calendar compatibility, but release-grade recurring timezone behavior, production sync UX, production sync-state idempotency, broader provider fixtures, browser UI hardening, remote CI proof, and final release gates remain incomplete.

## 2026-07-22 ICS Date-Only EXDATE Foundation Update

- Added day-level exclusion support for timed recurring VEVENT rules with date-only `EXDATE;VALUE=DATE` values.
- Added parser proof for a timed daily event with `EXDATE;VALUE=DATE:20260723`, expecting July 22 and July 24 occurrences while skipping the whole July 23 UTC date.
- Added local API ICS import coverage for timed date-only `EXDATE` through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser/API tests first failed by importing all three timed occurrences, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed with 172 tests after day-level EXDATE matching.
- Release remains `FAIL`: this narrows local recurrence compatibility, but release-grade ICS workflow still needs production sync UX, production sync-state idempotency, broader provider fixtures, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS Inclusive Date-Only UNTIL Foundation Update

- Changed date-only `UNTIL=YYYYMMDD` recurrence bounds to include the whole UTC date, so timed occurrences later on the UNTIL date are not dropped.
- Added parser proof for a timed daily event with `RRULE:FREQ=DAILY;UNTIL=20260724`, expecting July 22, 23, and 24 16:00 UTC occurrences.
- Added local API ICS import coverage for timed date-only `UNTIL` through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser/API tests first failed by returning only two timed occurrences, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed with 170 tests after inclusive date-only UNTIL parsing.
- Release remains `FAIL`: this narrows local recurrence compatibility, but release-grade ICS workflow still needs production sync UX, production sync-state idempotency, broader provider fixtures, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS Date-Only UNTIL Foundation Update

- Added parser support for all-day recurring VEVENT rules with date-only `UNTIL=YYYYMMDD` bounds.
- Added parser proof for `RRULE:FREQ=DAILY;UNTIL=20260724` on an all-day event, expecting July 22, 23, and 24 occurrences.
- Added local API ICS import coverage for date-only `UNTIL` through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser/API tests first failed because `UNTIL=20260724` was parsed as an invalid date-time, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed with 168 tests after date-only UNTIL parsing.
- Release remains `FAIL`: this narrows local recurrence compatibility, but release-grade ICS workflow still needs production sync UX, production sync-state idempotency, broader provider fixtures, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS RDATE PERIOD Foundation Update

- Added parser support for `RDATE;VALUE=PERIOD` entries using either `start/end` or `start/duration` period syntax.
- Preserved explicit period duration for additional RDATE occurrences instead of forcing every added date to reuse the base event duration.
- Added parser proof for `RDATE;VALUE=PERIOD:20260729T160000Z/20260729T183000Z,20260805T160000Z/PT2H`, expecting the base event plus both period occurrences with their own end times.
- Added local API ICS import coverage for `RDATE;VALUE=PERIOD` through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser/API tests first failed because period values were parsed as invalid ICS date-times, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed with 166 tests after period parsing and occurrence-duration preservation.
- Release remains `FAIL`: this narrows local recurrence compatibility, but release-grade ICS workflow still needs production sync UX, production sync-state idempotency, broader provider fixtures, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS RDATE-Only Foundation Update

- Added parser support so VEVENT entries with `RDATE` and no `RRULE` expand into requested-range occurrences instead of importing only the base event.
- Preserved event duration, occurrence IDs, external IDs, `EXDATE` filtering, and requested-range filtering through the same occurrence path used by RRULE events.
- Added parser proof for `RDATE:20260729T160000Z,20260805T160000Z` without `RRULE`, expecting the base event plus both RDATE instances.
- Added local API ICS import coverage for RDATE-only recurrence through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser test first failed by returning only the base event, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed after RDATE-only expansion.
- Release remains `FAIL`: this narrows local recurrence coverage, but release-grade ICS workflow still needs production sync UX, production sync-state idempotency, broader provider fixtures, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 Production Public-Bind Persisted-Throttle Safety Guard Update

- Added startup validation so standalone server config rejects `NODE_ENV=production` with public bind hosts such as `0.0.0.0` or `::` unless `SCHEDULEOS_RATE_LIMIT_PERSISTED=true` is configured.
- Added server config proof that authenticated, durable, rate-limited production public bind without persisted throttling is rejected and that the allowed public-bind path opts into persisted throttling.
- Documented the guard in `.env.example`, deployment guidance, auth-model docs, public release checklist, and security audit addendum.
- Verification before documentation update: focused server config test first failed, then `npm run build && node --test dist/server.test.js` passed after startup validation and explicit persisted-throttle config on the allowed path.
- Release remains `FAIL`: this narrows local/self-host request-throttle restart-bypass risk, but production distributed rate limiting, provider-specific quota enforcement, hosted alerting/dashboards, abuse analytics, remote CI proof, and final security gates remain incomplete.

## 2026-07-22 Production Static API-Key Scope Safety Guard Update

- Added startup validation so standalone server config rejects `NODE_ENV=production` static API-key auth when tenant, workspace, or user scope IDs are omitted or left as `.env.example` demo values.
- Added server config proof for omitted production static-auth scope and explicit demo production static-auth scope, while preserving explicit fictional production scope IDs in public-bind tests.
- Documented the guard in `.env.example`, deployment guidance, auth-model docs, public release checklist, and security audit addendum.
- Verification before documentation update: focused server config tests first failed, then `npm run build && node --test dist/server.test.js` passed after startup validation and explicit-scope test updates.
- Release remains `FAIL`: this narrows local/self-host demo-scope production auth risk, but production identity-provider integration, membership lifecycle, key rotation/revocation workflows, production persisted auth hardening, remote CI proof, and final security gates remain incomplete.

## 2026-07-22 Production Public-Bind Durable-Storage Safety Guard Update

- Added startup validation so standalone server config rejects `NODE_ENV=production` with public bind hosts such as `0.0.0.0` or `::` unless `SCHEDULEOS_STORAGE_PATH` is configured.
- Added server config proof that authenticated throttled production public bind without durable storage is rejected and authenticated throttled production public bind with storage remains allowed.
- Documented the guard in `.env.example`, deployment guidance, auth-model docs, public release checklist, and security audit addendum.
- Verification before documentation update: focused server config test first failed, then `npm run build && node --test dist/server.test.js` passed after startup validation.
- Release remains `FAIL`: this narrows local/self-host in-memory public deployment risk, but production persisted auth hardening, hosted retention/backup operations, live PostgreSQL CI proof, remote CI proof, and final security gates remain incomplete.

## 2026-07-22 Production Public-Bind Throttle Safety Guard Update

- Added startup validation so standalone server config rejects `NODE_ENV=production` with public bind hosts such as `0.0.0.0` or `::` unless request throttling is configured.
- Added server config proof that authenticated production public bind without request throttling is rejected and authenticated throttled production public bind remains allowed.
- Documented the guard in `.env.example`, deployment guidance, auth-model docs, public release checklist, and security audit addendum.
- Verification before documentation update: focused server config test first failed, then `npm run build && node --test dist/server.test.js` passed after startup validation.
- Release remains `FAIL`: this narrows local/self-host public abuse exposure risk, but production distributed rate limiting, provider-specific quota enforcement, hosted alerting/dashboards, abuse analytics, remote CI proof, and final security gates remain incomplete.

## 2026-07-22 Production Public-Bind Auth Safety Guard Update

- Added startup validation so standalone server config rejects `NODE_ENV=production` with public bind hosts such as `0.0.0.0` or `::` unless `SCHEDULEOS_API_KEY` or `SCHEDULEOS_AUTH_SESSION_COOKIE=true` is configured.
- Added server config proof that unauthenticated production public bind is rejected and authenticated production public bind remains allowed.
- Documented the guard in `.env.example`, deployment guidance, auth-model docs, public release checklist, and security audit addendum.
- Verification before documentation update: focused server config test first failed, then `npm run build && node --test dist/server.test.js` passed after startup validation.
- Release remains `FAIL`: this narrows local/self-host unauthenticated public exposure risk, but production identity-provider integration, hosted policy enforcement, production persisted auth hardening, remote CI proof, and final security gates remain incomplete.

## 2026-07-22 Production Static API-Key Safety Guard Update

- Added startup validation so standalone server config rejects `NODE_ENV=production` when `SCHEDULEOS_API_KEY=dev_scheduleos_change_me`.
- Added server config proof for accidental production use of the `.env.example` development key while preserving local static API-key bootstrap behavior.
- Documented the guard in `.env.example`, deployment guidance, auth-model docs, public release checklist, and security audit addendum.
- Verification before documentation update: focused server config test first failed, then `npm run build && node --test dist/server.test.js` passed after startup validation.
- Release remains `FAIL`: this narrows local/self-host static API-key deployment risk, but production identity-provider integration, key rotation/revocation workflows, production persisted auth hardening, remote CI proof, and final security gates remain incomplete.

## 2026-07-22 Production Password-Reset Token Safety Guard Update

- Added startup validation so standalone server config rejects `NODE_ENV=production` when `SCHEDULEOS_AUTH_PASSWORD_RESET_RETURN_TOKEN=true`.
- Added server config proof for unsafe production raw reset-token return while preserving the local development bootstrap path.
- Documented the guard in `.env.example`, deployment guidance, auth-model docs, public release checklist, and security audit addendum.
- Verification before documentation update: focused server config test first failed, then `npm run build && node --test dist/server.test.js` passed after startup validation.
- Full required gate after documentation update: `npm run check` passed, `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities, and `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows local/self-host password reset deployment risk, but production reset delivery, identity-provider recovery, abuse controls, production auth/storage hardening, remote CI proof, and final security gates remain incomplete.

## 2026-07-22 Production Cookie Safety Guard Update

- Added startup validation so standalone server config rejects `NODE_ENV=production` when `SCHEDULEOS_AUTH_SESSION_COOKIE=true` but `SCHEDULEOS_AUTH_SESSION_COOKIE_SECURE` is not true.
- Added server config proof for the unsafe production cookie setting while preserving local cookie-auth behavior.
- Updated deployment, auth-model, release checklist, security audit addendum, and `.env.example` documentation.
- Verification before documentation update: focused server config test first failed, then `npm run build && node --test dist/server.test.js` passed after startup validation.
- Full required gate after documentation update: `npm run check` passed, `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities, and `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows local/self-host cookie deployment risk, but production auth/storage hardening, production proxy/TLS deployment verification, identity-provider integration, remote CI proof, and final security gates remain incomplete.

## 2026-07-22 ICS Yearly Time-Window BYSETPOS Foundation Update

- Moved yearly `BYSETPOS` selection after yearly date candidates expand into `BYHOUR`/`BYMINUTE`/`BYSECOND` time-window candidates, so yearly rules select from the full yearly candidate set.
- Added parser proof for `RRULE:FREQ=YEARLY;BYMONTH=7;BYMONTHDAY=15;BYHOUR=9,13;BYMINUTE=30;BYSECOND=0;BYSETPOS=-1;COUNT=2`, expecting the later 13:30 candidate in each yearly set.
- Added local API ICS import coverage for yearly time-window `BYSETPOS` recurrence through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser/API tests first failed by returning both 2026 time candidates, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed after applying `applyBySetPositions` to full yearly time candidates.
- Full required gate after documentation update: `npm run check` passed, `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities, and `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: release-grade recurrence still needs broader RRULE coverage beyond current foundations, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, final release gates.

## 2026-07-23 Public Event Worker-Style Subscription Delivery Foundation Update

- Added local/self-host `POST /api/events/webhook-subscriptions/deliver-ready` so a worker or operator can deliver due public-event webhook subscriptions through configured delivery-target references without sending raw target URLs or secrets in the request body.
- Delivery scans enabled scoped subscriptions, resolves configured delivery targets server-side, delivers matching public events, records subscription delivery attempts, and returns grouped, content-minimized results.
- Added API test coverage proving a local API can deliver ready webhook subscriptions through configured target references and skip disabled subscriptions.
- Updated public-event documentation and operator runbook to describe configured target references and worker-style ready delivery.
- Pre-evidence gates for this update: `npm run check` passed 415 tests, documentation link check across 62 Markdown files, release safety scan across 110 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is still a local/self-host subscription delivery foundation. Production managed secret storage, durable public-event subscription workers, hosted retry workers, hosted delivery operations and observability, hosted alert routing, remote CI proof, final security review, and final release gates remain incomplete.

## 2026-07-22 ICS Daily BYSETPOS Foundation Update

- Applied existing `BYSETPOS` selection to daily time-window candidate sets so daily rules can choose candidates such as the last available time window each day.
- Added parser proof for `RRULE:FREQ=DAILY;BYHOUR=9,13;BYMINUTE=30;BYSETPOS=-1;COUNT=3`, expecting the 13:30 candidate across three days.
- Added local API ICS import coverage for daily `BYSETPOS` recurrence through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser/API tests first failed by returning the first three raw daily time candidates, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed after applying `applyBySetPositions` inside daily time-window recurrence generation.
- Full required gate after documentation update: `npm run check` passed, `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities, and `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: release-grade recurrence still needs broader RRULE coverage beyond current foundations, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, final release gates.

## 2026-07-22 ICS Weekly BYSETPOS Foundation Update

- Added weekly recurrence candidate-set handling so `BYSETPOS` applies to each weekly candidate group after `BYDAY` expansion rather than returning the first raw candidates.
- Added parser proof for `RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;BYSETPOS=-1;COUNT=3`, expecting the Friday candidate from each week.
- Added local API ICS import coverage for weekly `BYSETPOS` recurrence through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: focused parser/API tests first failed by returning the first three weekly candidates, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed after the weekly per-week candidate set and `applyBySetPositions` fix.
- Full required gate after documentation update: `npm run check` passed, `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities, and `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: release-grade recurrence still needs broader RRULE coverage beyond current foundations, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, final release gates.

## 2026-07-22 ICS Yearly BYWEEKNO Foundation Update

- Added local ICS parser support proof for yearly week-number recurrence, `RRULE:FREQ=YEARLY;BYWEEKNO=2;BYDAY=MO;WKST=MO;COUNT=3`.
- Added signed `BYWEEKNO` parsing and validation for yearly recurrence, including rejection of invalid zero values.
- Added yearly week-number candidate generation using the configured `WKST` week start and the existing yearly candidate, `BYSETPOS`, and time-window pipeline.
- Added parser test coverage proving week 2 Monday recurrence expands across calendar years.
- Added local API ICS import test coverage for yearly `BYWEEKNO` recurrence through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: parser/API tests first failed by repeating the original January 5 date every year, then over-generated every Monday in the first year, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed after fix.
- Full required gate after documentation update: `npm run check` passed, `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities, and `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: release-grade recurrence still needs broader RRULE coverage beyond current foundations, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, final release gates.

## 2026-07-22 ICS Yearly Time-Window Foundation Update

- Added local ICS parser support proof for yearly recurrence time windows, `RRULE:FREQ=YEARLY;BYMONTH=7;BYMONTHDAY=15;BYHOUR=9,13;BYMINUTE=30;BYSECOND=0;COUNT=4`.
- Relaxed `BYHOUR`, `BYMINUTE`, and `BYSECOND` parser guards to include yearly recurrence.
- Added parser test coverage proving yearly candidates can emit multiple time windows per matching year.
- Added local API ICS import test coverage for yearly time-window recurrence through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: parser/API tests first failed on yearly time-window rules, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed after fix.
- Full required gate after documentation update: `npm run check` passed, `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities, and `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: release-grade recurrence still needs broader RRULE coverage beyond current foundations, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, final release gates.

## 2026-07-22 ICS Monthly Time-Window Foundation Update

- Added local ICS parser support proof for monthly recurrence time windows, `RRULE:FREQ=MONTHLY;BYMONTHDAY=15;BYHOUR=9,13;BYMINUTE=30;BYSECOND=0;COUNT=4`.
- Relaxed `BYHOUR`, `BYMINUTE`, and `BYSECOND` parser guards to include monthly recurrence.
- Added parser test coverage proving monthly candidates can emit multiple time windows per matching month.
- Added local API ICS import test coverage for monthly time-window recurrence through `POST /api/calendar-events/ics/import`.
- Verification before documentation update: parser/API tests first failed on monthly time-window rules, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed after fix.
- Release remains `FAIL`: release-grade recurrence still needs broader RRULE coverage beyond current foundations, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, final release gates.

## 2026-07-22 ICS Weekly Time-Window Foundation Update

- Added local ICS parser support proof for weekly recurrence time windows, `RRULE:FREQ=WEEKLY;BYDAY=MO;BYHOUR=9,13;BYMINUTE=30;BYSECOND=0;COUNT=4`.
- Relaxed `BYHOUR`, `BYMINUTE`, and `BYSECOND` parser guards from daily-only to daily-or-weekly recurrence.
- Added parser test coverage proving weekly `BYDAY` rules can emit multiple time windows per matching week.
- Added local API ICS import test coverage for weekly time-window recurrence through `POST /api/calendar-events/ics/import`.
- Verification update: parser/API tests first failed on weekly time-window rules, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed after fix. Full required gate also passed after documentation update: `npm run check` passed 324 tests, documentation link check across 60 Markdown files, release safety scan across 108 files, license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: release-grade recurrence still needs broader RRULE coverage beyond current foundations, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, final release gates.

## 2026-07-22 ICS Daily BYSECOND Foundation Update

- Added local ICS parser support proof for daily recurrence second-level time windows, `RRULE:FREQ=DAILY;BYHOUR=9;BYMINUTE=30;BYSECOND=0,30;COUNT=4`.
- Added parser test coverage proving multiple daily second candidates emit in time order inside requested recurrence range.
- Added local API ICS import test coverage for daily `BYSECOND` recurrence through `POST /api/calendar-events/ics/import`.
- Verification update: parser/API tests first failed by emitting only original start-second occurrences, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed 147 tests after fix. Full required gate also passed after documentation update: `npm run check` passed 322 tests, documentation link check across 60 Markdown files, release safety scan across 108 files, license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: release-grade recurrence still needs broader RRULE coverage beyond current foundations, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, final release gates.

## 2026-07-22 ICS Daily BYHOUR BYMINUTE Foundation Update

- Added local ICS parser support proof for daily recurrence time windows, `RRULE:FREQ=DAILY;BYHOUR=9,13;BYMINUTE=30;COUNT=4`.
- Added parser test coverage proving multiple daily hour/minute candidates emit in time order inside requested recurrence range.
- Added local API ICS import test coverage for daily `BYHOUR`/`BYMINUTE` recurrence through `POST /api/calendar-events/ics/import`.
- Verification update: parser/API tests first failed by emitting only original start-hour occurrences, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed 145 tests after fix. Full required gate also passed after documentation update: `npm run check` passed 320 tests, documentation link check across 60 Markdown files, release safety scan across 108 files, license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: release-grade recurrence still needs broader RRULE coverage beyond current foundations, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, final release gates.

## 2026-07-22 ICS Weekly BYDAY BYMONTH Filter Foundation Update

- Added local ICS parser support proof for weekly `BYDAY` rules composed with `BYMONTH`, such as `RRULE:FREQ=WEEKLY;BYDAY=MO,WE;BYMONTH=2;COUNT=4`.
- Fixed weekly recurrence generation so `BYDAY` continues to emit multiple weekdays per matching week while `BYMONTH` and `BYMONTHDAY` act as filters on those weekly candidates.
- Added local API ICS import test coverage for weekly `BYDAY` plus `BYMONTH` recurrence through `POST /api/calendar-events/ics/import`.
- Verification after this update: parser/API tests first failed by dropping Wednesday occurrences, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed 143 tests after the fix. Full required gate also passed: `npm run check` passed 318 tests, documentation link check across 60 Markdown files, release safety scan across 108 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: release-grade recurrence still needs broader RRULE coverage beyond current foundations, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS Daily BYMONTHDAY Sparse Count Foundation Update

- Added local ICS parser support proof for sparse daily `BYMONTHDAY` filters that need more than one year of scanning to satisfy modest `COUNT` values, such as `RRULE:FREQ=DAILY;BYMONTHDAY=31;COUNT=8`.
- Fixed filtered daily recurrence generation so sparse filters count emitted occurrences instead of scanned intervals, with a bounded scan guard to avoid unbounded loops on impossible filters.
- Added local API ICS import test coverage for sparse daily `BYMONTHDAY` recurrence through `POST /api/calendar-events/ics/import`.
- Verification after this update: parser/API tests first failed with only seven occurrences, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed 141 tests after the fix. Full required gate also passed: `npm run check` passed 316 tests, documentation link check across 60 Markdown files, release safety scan across 108 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: release-grade recurrence still needs broader RRULE coverage beyond current foundations, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS Daily BYDAY Recurrence Foundation Update

- Added local ICS parser support for daily `BYDAY` weekday filters such as `RRULE:FREQ=DAILY;BYDAY=MO,WE,FR;COUNT=4`.
- Added parser test coverage proving daily recurrence counts only filtered weekday occurrences.
- Added local API ICS import test coverage for daily `BYDAY` recurrence through `POST /api/calendar-events/ics/import`.
- Verification after this update: daily `BYDAY` gap was first proven by failing parser/API tests, then `npm run build && node --test dist/ics.test.js dist/api.test.js` passed 139 tests. Full required gate also passed: `npm run check` passed 314 tests, documentation link check across 60 Markdown files, release safety scan across 108 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: release-grade recurrence still needs broader RRULE coverage beyond current foundations, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS BYYEARDAY Recurrence Foundation Update

- Added local ICS parser support for yearly `BYYEARDAY` rules with positive and negative day-of-year values such as `BYYEARDAY=100,-1`.
- Added parser tests for yearly `BYYEARDAY` expansion, `BYMONTH` intersection, and invalid `BYYEARDAY=0` rejection.
- Added local API ICS import test coverage for yearly `BYYEARDAY` recurrence through `POST /api/calendar-events/ics/import`.
- Verification after this update: `npm run build && node --test dist/ics.test.js dist/api.test.js` passed 137 tests. Full required gate also passed: `npm run check` passed 312 tests, documentation link check across 60 Markdown files, release safety scan across 108 files, and license check; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: release-grade recurrence still needs broader RRULE coverage beyond current foundations, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

## Added Or Refreshed

- Root `README.md`.
- Root `LICENSE` with Apache-2.0 text matching `package.json`.
- Root `CONTRIBUTING.md`.
- Root `SECURITY.md`.
- Root `CODE_OF_CONDUCT.md`.
- Root `CHANGELOG.md`.
- Root `.env.example`.
- `.gitignore` exception allowing `.env.example` while keeping real `.env` files ignored.
- `.github/dependabot.yml`.
- `.github/PULL_REQUEST_TEMPLATE.md`.
- Issue templates for bugs, features, integrations, and solver-constraint proposals.
- `docs/self-hosting.md`.
- `docs/deployment.md`.
- `docs/troubleshooting.md`.
- `docs/roadmap.md`.
- `docs/public-release-checklist.md`.
- `docs/security/licensing-audit.md`.
- Tested local task create/list/read/update/delete API foundation with tenant/workspace/user scope checks.
- Tested local calendar-event create/list/read/update/delete API foundation with tenant/workspace/user scope checks.
- Tested local schedule-plan list/read API foundation with tenant/workspace/user scope checks.
- Tested local schedule-plan reject API foundation with tenant/workspace/user scope checks.
- Tested generic webhook task ingestion local API foundation with source-id idempotency, timestamp-bound HMAC verification, signed event-id replay protection, audit event, missing-duration unscheduled handling, and malicious text treated as task data.
- Tested JSON task import local API foundation with batch import, dry-run preview, source-id idempotency, row-level validation errors, audit events, missing-duration unscheduled handling, and malicious text treated as task data.
- Tested CSV task import local API foundation with dry-run preview, quoted-field parsing, source-id idempotency, row-level validation errors, audit events, missing-duration unscheduled handling, and formula-like text treated as task data.
- Tested static API-key local auth foundation with tenant/workspace/user scope checks and read-only API-key write denial.
- Tested configurable local API request-body size cap with structured `413 REQUEST_BODY_TOO_LARGE` response.
- Tested configurable local API rate-limit foundation with standalone server env wiring, startup validation, structured `429 RATE_LIMITED` responses, process-local default buckets, and opt-in persisted authenticated request throttles with hashed scoped keys.
- Tested `src/ics.ts` ICS import/export module foundation, accepted schedule-block export, private-title redaction, `DTSTART` plus `DURATION` import, basic daily/weekly/monthly/yearly recurrence expansion including daily/weekly `BYDAY`, weekly `BYDAY` plus `BYMONTH`, daily/monthly `BYMONTHDAY`, yearly `BYMONTH`, yearly `BYYEARDAY`, `EXDATE` exclusions, and `RDATE` additions inside requested range, workspace-scoped local ICS re-import upsert counts, `src/ics.test.ts`, and local API ICS route coverage in `src/api.test.ts`.

## Corrected Blocker Status

- Licensing audit exists but remains `FAIL` until dependency, copied-source, attribution, notice, fixture, and documentation reuse review are complete.
- Root open-source docs now exist in draft form, but clean-checkout validation and documentation-link checks are incomplete.
- Self-hosting documentation now exists in draft form, but production self-hosting remains blocked.
- Local CI workflow exists, but remote CI has not run because no public repository exists.
- Public release checklist exists and remains `FAIL`.
- Static API-key local auth foundation now includes scope, read/write role checks, and optional bootstrap role configuration. Local durable auth model foundation now covers users, workspace memberships, session hashes in JSON-backed, SQLite, and PostgreSQL storage plus local API session issuance/revocation and owner/admin membership management, but production login UX, cookie auth, credential lifecycle, admin workflow UX/runbooks, remote live authorization proof, and identity-provider integration remain incomplete.
- Local API request-body size cap, process-local rate-limit, persisted scoped import-row throttle, import-throttle denial audit-event, scoped audit-event read, import-abuse summary, and provider import policy catalog foundations exist, but production distributed rate limiting, request throttling, provider quota enforcement, hosted alerts, and production abuse analytics remain incomplete.
- Generic webhook, JSON, and CSV task ingestion local API foundations exist, including JSON/CSV dry-run preview, local CSV/JSON app preview/import confirmation, and current/previous webhook secret rotation-list support, but production provider templates, managed webhook secret lifecycle, provider replay-policy documentation, provider mapping docs, and provider-specific adapters remain incomplete.
- ICS import/export module, local API foundation, local app ICS review/import interface, `DTSTART` plus `DURATION` import, accepted schedule-block export, private-title redaction, scoped local duplicate-prevention foundation, and basic daily/weekly/monthly/yearly recurrence expansion including daily/weekly `BYDAY`, weekly `BYDAY` plus `BYMONTH`, daily/monthly `BYMONTHDAY`, yearly `BYMONTH`, yearly `BYYEARDAY`, `EXDATE` exclusions, and `RDATE` additions exist, but richer RRULE coverage, production sync UX, and production sync-state idempotency remain incomplete.

## 2026-07-22 Time-Block Move/Resize Update

- Tested local time-block move/resize API foundation active-block updates, invalid-range rejection, locked/completed block rejection, tenant/workspace/user scope checks.
- Tested in-memory and PostgreSQL time-block move/resize repository foundations protected block validation scoped persistence behavior.
- Local time-block move/resize API and repository foundations exist, and the standalone app shell now includes local daily/weekly calendar views plus manual drag/drop and keyboard movement controls. Production calendar UI hardening, browser-verified drag/drop, conflict preview, accessibility pass, responsive polish, and user-facing confirmation flows remain incomplete.

## 2026-07-22 Import Throttle Foundation Update

- Added configurable `importThrottle` API option with `windowMs` and `maxRows`.
- Added optional `importThrottle.sourcePolicies` per-source override foundation.
- Added persisted scoped import throttle records to JSON-backed local storage.
- Added SQLite and PostgreSQL `import_throttles` migration table foundations.
- Tested JSON task import row throttling by tenant/workspace/user/source across API server restarts.
- Tested source-specific import throttle override behavior while unknown sources continue using the global default.
- Tested invalid global and source-specific import throttle policies fail API startup.
- Tested throttled import rows append scoped, content-minimized `IMPORT_THROTTLE_DENIED` audit events.
- Tested repository throttle behavior for scoped source windows, denial retry timing, window reset, source isolation, and cross-scope access rejection.
- Added and tested async PostgreSQL import throttle repository foundation for scoped create, denial without upsert, expired-window reset, and cross-scope access rejection.
- Foundation covers webhook task import, JSON task import, CSV task import, ICS calendar import paths, source-specific local policy overrides, startup policy validation, local denial audit events, and local provider import policy catalog guidance, but production distributed rate limiting, provider quota enforcement, hosted alerts, and production abuse analytics remain incomplete.

## 2026-07-22 Provider CSV Template Foundation Update

- Added local `GET /api/task-sources/csv/templates` provider-template catalog foundation.
- Added tested `templateId` support for CSV task import mapping provider export headers into canonical ScheduleOS fields.
- Current template catalog covers Todoist, Linear, Asana, ClickUp, Trello, Microsoft Planner, and GitHub Issues CSV-style exports.
- Tested provider-template dry-run preview, import persistence, row-level validation errors, priority normalization, tags/project/source URL mapping, audit-event persistence, and unknown-template rejection.
- Added local app template selector and sample-loading foundation backed by `GET /api/task-sources/csv/templates`.
- Tested standalone app shell contains the provider-template selector, sample loader, catalog fetch, and `templateId` import wiring.
- This remains API/import local UI foundation. Production download/upload polish, broader real-export fixture coverage, provider-specific import confirmation polish, provider quota enforcement, and hosted abuse analytics remain incomplete.

## 2026-07-22 Provider CSV Multi-Row Sample Confirmation Update

- Expanded provider CSV template samples for Todoist, Linear, Asana, ClickUp, Trello, and GitHub Issues from single-row examples to fictional multi-row samples.
- Added `sampleRowCount` metadata to provider CSV template catalog responses and tests requiring row count to match sample CSV.
- Updated local app CSV import confirmation to name selected provider template/source and previewed row count before import.
- Marked local multi-row sample fixture and provider-aware import confirmation foundation complete in release checklist.
- Release remains `FAIL`: production download/upload polish, larger real-provider fixture sets, provider quota enforcement, hosted abuse analytics, remote CI proof, production auth, final release gates remain incomplete.

## 2026-07-22 Provider CSV Sample Download Foundation Update

- Added `GET /api/task-sources/csv/templates/{templateId}/sample` to download fictional provider sample CSV fixtures as `text/csv` attachments with baseline security headers.
- Added local app `Download Sample` button for selected provider CSV template.
- Tested Todoist sample download headers, filename, fictional multi-row content, and unknown-template validation behavior.
- Marked local provider CSV sample download endpoint and app button foundation complete in release checklist.
- Release remains `FAIL`: production upload polish, larger real-provider fixture sets, provider quota enforcement, hosted abuse analytics, remote CI proof, production auth, final release gates remain incomplete.

## 2026-07-22 Audit Event Read Foundation Update

- Added local `GET /api/audit-events?tenantId=...&workspaceId=...&userId=...` route.
- Tested scoped audit-event reads after webhook import audit event creation.
- Added and tested optional scoped audit-event filters for `action`, `resourceType`, and audit metadata `sourceSystem`.
- Tested cross-user audit-event reads are rejected by authorization scope.
- This makes local audit and abuse evidence inspectable, but production abuse analytics, retention cleanup enforcement, alerting, and dashboarding remain incomplete.

## 2026-07-22 Mock OwnerOps Import Foundation Update

- Added local `POST /api/integrations/ownerops/tasks/import` public contract foundation.
- Tested mock OwnerOps owned-work import maps to `SchedulingTask` with `sourceSystem` `OWNEROPS`.
- Tested desired outcome, dependencies, owner/assignee mapping, blocked/waiting state, idempotent updates, and audit events.
- Tested blocked OwnerOps work remains unscheduled with existing scheduler ineligibility reason.
- Tested manual ScheduleOS tasks still plan when OwnerOps is not involved.
- This remains a mock public contract foundation. Production OwnerOps adapter authentication, webhook subscription management, outbound event delivery, completion reconciliation, and provider-specific retry policy remain incomplete.

## 2026-07-22 Mock ConnectOS Calendar Foundation Update

- Added local `POST /api/integrations/connectos/calendar-events/import` public contract foundation.
- Tested mock ConnectOS calendar import maps to provider-neutral `CalendarEvent` records with `sourceSystem` `CONNECTOS`.
- Tested raw provider credential fields are rejected instead of stored.
- Tested private imported event titles are redacted to `Busy`.
- Tested idempotent re-import updates existing ConnectOS calendar events.
- Tested imported ConnectOS busy events constrain schedule planning.
- Tested manual ScheduleOS tasks still plan when ConnectOS is not involved.
- This remains a mock public contract foundation. Production ConnectOS adapter OAuth, provider sync, revocation handling, retry policy, provider webhooks, and calendar write-back remain incomplete.

## 2026-07-22 Standalone Planning App Shell Update

- Added local dependency-free planning app shell served at `/app` and `/`.
- Tested shell includes task entry/edit/delete controls, CSV/JSON task preview/import confirmation controls, fixed-event entry/edit/delete controls, ICS fixed-event review/import controls, working-hours setup, day/week view controls, schedule-plan API usage, warning and grounded explanation review, replan control, plan accept/reject controls, accepted-block ICS export hook, manual time-block drag/drop hooks, keyboard-accessible block earlier/later movement controls, and local block lock/done/missed controls.
- The shell uses existing public local APIs rather than private compatible leadership system, OwnerOps, ConnectOS, provider, paid AI, or hosted-service dependencies.
- Added tested env-driven `dist/server.js` entrypoint plus `npm run dev` and `npm start` scripts for local self-hosted app/API startup.
- This remains a local app foundation. Production web-app hardening, richer calendar interactions, accessibility audit, responsive browser verification, persisted identity UX, and production deployment packaging remain incomplete.

## 2026-07-22 Local App/API Security Header Foundation Update

- Added tested baseline security headers on API JSON responses: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: no-referrer`.
- Added tested app-shell `Content-Security-Policy` covering default, script, style, connect, image, base URI, frame ancestors, and form action directives.
- Tested `/healthz` JSON response and `/app` HTML shell expose the expected hardening headers.
- This remains a local app/API hardening foundation. Production deployment still needs proxy/TLS configuration, persisted identity UX, accessibility audit, responsive browser verification, and final production web-app review.

## 2026-07-22 Public Schedule-Guidance Foundation Update

- Added local `POST /api/schedule-guidance/apply` public contract foundation.
- Tested compatible leadership system-style guidance can update normal ScheduleOS task priority, preferred dayparts, and portable tags through a provider-neutral `sourceSystem`.
- Tested `ownerOnly` guidance is stored as an `owner-only` tag rather than private compatible leadership system state.
- Tested guidance does not unblock work or bypass `schedulingEligible` constraints.
- Tested standalone ScheduleOS planning still works without compatible leadership system, OwnerOps, or ConnectOS connected.
- This remains local public contract foundation. Production leadership-app adapters, signed guidance webhooks, review workflows, policy administration, and complete abuse analytics remain incomplete.

## 2026-07-22 Import Abuse Summary And Provider Policy Foundation Update
- Added local scoped `GET /api/import-abuse/summary` API foundation derived from existing audit events.
- Tested summary counts allowed import audit events, throttle-denial events, denied rows, operation policy evidence, and source filtering for a throttled JSON import.
- Tested summary endpoint rejects cross-user reads through existing tenant/workspace/user authorization checks.
- Added `docs/security/import-abuse-and-provider-policy.md` with local policy examples for generic webhook, JSON, CSV, ICS, provider-template CSV sources, OwnerOps, and ConnectOS import bridges.
- Linked provider policy documentation from README, task-source docs, threat model, and release checklist.
- This remains local/self-hosted provider policy and abuse visibility foundation. Production distributed rate limiting, production proxy deployment verification, operator dashboards, alert thresholds, runbooks, and provider-specific quota operations remain incomplete.
## 2026-07-22 Local Durable Auth Model Foundation Update
- Added `AuthUser`, `WorkspaceMembership`, and `AuthSession` domain records using credential/session hash fields rather than plaintext secrets.
- Added local JSON-backed `repositories.auth` foundation for auth users, memberships, session reads, and session revocation with tenant/workspace/user scope checks.
- Added SQLite auth tables for auth users, workspace memberships, and auth sessions.
- Tested in-memory and SQLite auth repositories persist scoped users, memberships, and sessions while rejecting cross-user reads/revokes.
- Documented current model and production gaps in `docs/security/auth-model.md`.
- This remains local storage/repository foundation. Production login/logout, cookie sessions, credential lifecycle, PostgreSQL auth repositories, identity-provider integration, admin membership management, and hosted scheduled session cleanup remain incomplete.
## 2026-07-22 PostgreSQL Auth Repository Foundation Update
- Added PostgreSQL auth repository foundation for auth users, workspace memberships, session reads, and session revocation.
- Added PostgreSQL `auth_sessions` table and expanded `users` and `memberships` rows with auth-model fields and JSONB payloads.
- Tested fake-client PostgreSQL auth repositories upsert/read/revoke scoped users, memberships, and sessions while rejecting cross-user access.
- Updated `docs/security/auth-model.md`, README, storage design, and public release checklist to reflect PostgreSQL auth repository foundation.
- This remains storage/repository foundation. Production login/logout, cookie sessions, credential lifecycle, identity-provider integration, admin membership management, hosted scheduled session cleanup, and remote live authorization proof remain incomplete.
## 2026-07-22 Local API Session Lifecycle Foundation Update
- Added local `POST /api/auth/sessions` session issuance foundation for already-authenticated scoped API-key principals.
- Added local `DELETE /api/auth/sessions/{sessionId}` revocation foundation.
- Session issuance requires same scoped active auth user and active workspace membership.
- Session bearer authentication stores and checks `sessionTokenHash` only; raw session tokens are returned only at creation time.
- Session use re-checks active user and membership state, updates `lastSeenAt`, rejects revoked or expired sessions, and derives write role from current workspace membership.
- Tested issuance, hashed persistence, scoped API use, revoke response redaction, and rejected bearer use after revocation.
- Updated `docs/security/auth-model.md`, `docs/security/threat-model.md`, and `docs/public-release-checklist.md`.
- remains local API session lifecycle foundation. Production login UX, hardened HttpOnly/Secure/SameSite cookie transport, CSRF controls, credential lifecycle, identity-provider integration, admin membership management, hosted scheduled session cleanup, and remote live authorization proof remain incomplete.
## 2026-07-22 Local Owner/Admin Auth Management Foundation Update
- Added local auth-user create/update/read endpoint foundation with redacted responses.
- Added local workspace-membership create/update/list endpoint foundation.
- Added `ADMIN` static/session role support and optional `SCHEDULEOS_API_ROLE` local bootstrap configuration, defaulting to `EDITOR`.
- Management routes require `OWNER` or `ADMIN` principals in the same tenant/workspace; only `OWNER` can grant `OWNER` or `ADMIN` memberships.
- User responses omit `credentialHash`; writes append scoped auth-user or workspace-membership audit events.
- Tested owner/admin creation, admin member assignment, admin privilege-escalation rejection, viewer rejection, membership listing, and server role parsing.
- Updated README, `.env.example`, self-hosting docs, auth model, threat model, and release checklist.
- remains local owner/admin management foundation. Production login UX, cookie auth, credential lifecycle, admin workflow UX/runbooks, remote live authorization proof, and identity-provider integration remain incomplete.

## 2026-07-22 Local Session Cookie/CSRF Foundation Update

- Added optional local session-cookie transport behind `SCHEDULEOS_AUTH_SESSION_COOKIE=true`.
- Session creation still returns the raw bearer session token only once and can also set an `HttpOnly`, `SameSite=Lax`, `Path=/` cookie when cookie transport is enabled.
- Added `SCHEDULEOS_AUTH_SESSION_COOKIE_SECURE=true` for TLS/proxy deployments that should emit `Secure`.
- Added returned CSRF token requirement for cookie-authenticated unsafe methods while keeping bearer-session clients unchanged.
- Added `DELETE /api/auth/session` current-session logout foundation that revokes the active bearer or cookie session and clears the configured browser session cookie.
- Tested cookie issuance, cookie-authenticated reads, cookie-authenticated write rejection without CSRF, accepted cookie-authenticated writes with CSRF, current-session logout, cookie clearing, and rejected cookie use after logout.
- Release remains `FAIL`: production login/logout UX, credential lifecycle/password hashing policy, identity-provider integration, production admin UX/runbooks, hosted session cleanup, remote live authorization proof, and final release audits remain incomplete.

## 2026-07-22 Local Credential Login Foundation Update

- Added local `POST /api/auth/login` foundation for active users with active workspace memberships.
- Login verifies versioned `scrypt$N$r$p$keyLength$salt$hash` credential hashes using Node crypto and issues the same durable session model as bootstrap session creation.
- Login returns generic `INVALID_CREDENTIALS` for wrong passwords or missing users and does not return stored credential hashes.
- Tested valid credential login, invalid password rejection, missing-user rejection, hashed session persistence, and bearer-session use after login.

## 2026-07-22 Current-User Password Rotation Foundation Update

- Added local `POST /api/auth/password` foundation requiring current bearer-session or cookie-session authentication.
- Password rotation verifies current password, rejects generic invalid credentials on mismatch, writes a fresh versioned `scrypt` credential hash with a random salt, and never returns or persists plaintext passwords.
- Successful rotation appends `AUTH_CREDENTIAL_ROTATED`, revokes active sessions in the user's scope, and clears the configured session cookie when cookie transport is enabled.
- Repository session listing is now covered for JSON-backed, SQLite, and PostgreSQL auth repositories.
- Tested wrong-current-password rejection, plaintext-password non-persistence, old-session rejection after rotation, old-password login rejection, and new-password login success.
- Release remains `FAIL`: password reset, recovery, lockout/backoff, production login/logout UX, identity-provider integration, production admin UX/runbooks, hosted session cleanup, remote live authorization proof, and final release audits remain incomplete.

## 2026-07-22 Durable Credential-Login Backoff Foundation Update

- Added durable scoped credential-login backoff for `POST /api/auth/login`.
- Repeated failed credential attempts for the same tenant/workspace/user key return `AUTH_ATTEMPT_LIMITED`; JSON-backed, SQLite, and PostgreSQL storage now persist that scoped backoff window across restarts, and a successful login clears it.
- Invalid `auth.loginBackoff` policies are rejected at server startup.
- Tested repeated wrong-password rejection, temporary scoped attempt limiting, unaffected login for another user scope, successful-login reset, and invalid-policy rejection.
- Release remains `FAIL`: durable self-host backoff foundation exists, but production distributed lockout/backoff, production login/logout UX, identity-provider integration, production admin UX/runbooks, hosted session cleanup, remote live authorization proof, and final release audits remain incomplete.

## 2026-07-22 Credential-Attempt Window Retention Cleanup Update

- Added `AUTH_LOGIN_ATTEMPT_WINDOW` retention policy: 14 days from lock release or latest failed-attempt window update.
- Local JSON-backed API cleanup, SQLite cleanup, and PostgreSQL cleanup now count and delete stale scoped credential-attempt windows.
- Tested dry-run and apply cleanup counts for JSON-backed API, SQLite, and PostgreSQL retention paths.
- Release remains `FAIL`: hosted scheduled retention cleanup, production operator approval workflow, production distributed lockout/backoff, and final release audits remain incomplete.

## 2026-07-22 Local Owner/Admin Credential Reset Foundation Update

- Added local owner/admin credential-reset endpoint foundation for administrative credential recovery.
- `OWNER` and `ADMIN` principals can reset `MEMBER` or `VIEWER` credentials in the same tenant/workspace; only `OWNER` principals can reset another `OWNER` or `ADMIN` credential.
- Reset writes a fresh versioned `scrypt` credential hash with a random salt, appends `AUTH_CREDENTIAL_RESET`, revokes active target sessions in scope, and never returns or persists plaintext passwords.
- Tested member reset, old-session rejection, old-password rejection, new-password login success, admin reset rejection for privileged target, owner reset of admin, and no plaintext password persistence.
- Release remains `FAIL`: this is local administrative recovery only. Self-service password reset/recovery policy, production distributed lockout/backoff, production login/logout UX, identity-provider integration, production admin UX/runbooks, hosted session cleanup, remote live authorization proof, and final release audits remain incomplete.
- Release remains `FAIL`: full credential lifecycle/password reset policy, identity-provider integration, production login UX, production admin UX/runbooks, hosted session cleanup, remote live authorization proof, and final release audits remain incomplete.

## 2026-07-22 Local Password Reset Token Foundation Update
- Added local `POST /api/auth/password-reset-requests` reset-token request foundation with generic `202` response to avoid account enumeration.
- Eligible active auth users with active workspace membership receive a stored one-time reset-token record containing a hash only, expiration timestamp, and later use timestamp.
- Raw reset token return is disabled by default and only available through explicit local-development/self-host bootstrap opt-in.
- Added local `POST /api/auth/password-reset` confirmation foundation validates unused unexpired token hash in scope, writes fresh versioned `scrypt` credential hash, marks token used, revokes active sessions, and appends `AUTH_PASSWORD_RESET_COMPLETED`.
- Tested hashed token storage, no plaintext new-password persistence, old-session rejection, old-password rejection, new-password login, expired token rejection, reused-token rejection, generic missing-user request behavior, and invalid reset TTL startup rejection.
- Release remains `FAIL`: production reset-token delivery, recovery UX, abuse controls, identity-provider recovery integration, production distributed lockout/backoff, production login/logout UX, remote live authorization proof, and final release audits remain incomplete.

## 2026-07-22 Durable Password Reset Token Repository Update

- Added `AuthPasswordResetToken` auth repository operations for upsert, read, list, and mark-used with tenant/workspace/user scope checks.
- Added SQLite `auth_password_reset_tokens` migration/runtime table and scoped hash index.
- Added PostgreSQL `auth_password_reset_tokens` migration table, JSONB payload storage, membership-scoped foreign key, and async repository methods.
- Updated password reset request/confirmation API paths to persist and consume reset tokens through `repositories.auth` instead of direct local store-array mutation.
- Tested in-memory, SQLite reopen persistence, and fake-client PostgreSQL reset-token upsert/read/list/mark-used behavior plus cross-scope denial.
- Release remains `FAIL`: reset-token delivery, production recovery UX, distributed abuse controls, identity-provider recovery integration, remote live authorization proof, and final release audits remain incomplete.

## 2026-07-22 Password Reset Token Retention Cleanup Update

- Added `AUTH_PASSWORD_RESET_TOKEN` retention category: 7 days from token expiration or use.
- Local JSON-backed retention cleanup now counts and deletes expired or used scoped password-reset-token hashes past retention.
- SQLite retention cleanup now counts and deletes expired or used scoped password-reset-token hashes past retention.
- PostgreSQL retention cleanup now counts and deletes expired or used scoped password-reset-token hashes past retention.
- Tested local JSON API dry-run/apply behavior, SQLite dry-run/apply preservation/deletion, PostgreSQL count/delete SQL wiring, and retention policy duration.
- Release remains `FAIL`: hosted scheduled cleanup, production destructive-operation approvals, reset-token delivery/recovery UX, remote live authorization proof, and final release audits remain incomplete.

## 2026-07-22 Auth Session Retention Cleanup Foundation Update
- Added `AUTH_SESSION` retention category: 30 days from session expiration or revocation.
- SQLite retention cleanup dry-run/apply now counts and deletes expired or revoked scoped auth-session hashes past retention.
- PostgreSQL retention cleanup dry-run/apply now counts and deletes expired or revoked scoped auth-session hashes past retention.
- Tested SQLite dry-run eligibility, apply deletion, active/recent-session preservation, and PostgreSQL count/delete SQL wiring.
- Updated retention policy, auth model, threat model, and release checklist docs.
- remains local/self-hosted retention foundation. Hosted scheduled cleanup, production operator approval workflow, login/cookie auth, and remote live authorization proof remain incomplete.

## 2026-07-22 Local JSON Retention Cleanup API Foundation Update
- Added local `POST /api/retention/cleanup` API foundation for JSON-backed self-host storage.
- Dry-run is default and reports eligible scoped schedule-plan history, idempotency records, expired/revoked auth sessions, import throttle windows, disconnected/error integration metadata, and audit events due for review.
- Apply requires authenticated `OWNER` or `ADMIN` role in the requested tenant/workspace plus exact `tenant/workspace/user/as-of-iso` confirmation.
- Apply deletes only eligible records in the requested tenant/workspace/user scope, preserves recent/active/connected/other-scope records, does not delete audit events, and appends `RETENTION_CLEANUP_APPLIED`.
- Tested dry-run non-deletion, wrong-confirmation refusal, scoped apply deletion, audit-event append, and viewer rejection in `src/api.test.ts`.
- remains local JSON-backed API retention foundation only. Hosted scheduled cleanup, production destructive-operation approval workflow, backup/export filesystem cleanup, and production retention runbooks remain incomplete.

## 2026-07-22 Webhook Secret Rotation Foundation Update

- Added local webhook HMAC rotation-list support: `webhookSecrets[sourceSystem]` may be a single secret or an ordered list of current and previous secrets.
- Tested signed generic webhooks accepted with current or previous configured secret.
- Tested signatures from unknown secrets still rejected.
- Tested blank configured webhook secrets and empty rotation lists fail API startup.
- Added and tested source-specific webhook replay-window overrides through `webhookReplayWindows[sourceSystem]`.
- Tested invalid source-specific replay-window policies fail API startup.
- Existing replay controls still require timestamp and event-id headers for signed webhooks.
- This is overlap-window verification foundation only. Managed production secret lifecycle, provider-specific rotation runbooks, operator alerts, and secret storage remain incomplete.

## 2026-07-22 Local PostgreSQL Docker Proof Update

- Fixed PostgreSQL `pg` adapter command-result normalization so migration commands that return no row array normalize to an empty result instead of failing.
- Added unit coverage for command results without rows in `src/postgres-client.test.ts`.
- Ran `npm run test:postgres:docker`; disposable PostgreSQL 16 became healthy, migrations applied to `scheduleos_test`, live repository proof passed, and `npm run postgres:test:down` removed the container and volume.
- Local Docker PostgreSQL proof now exists. Remote CI PostgreSQL proof remains unavailable because no public repository exists.

## 2026-07-22 Documentation Link Check Update

- Added dependency-free `npm run docs:links` command for project-owned Markdown files.
- `npm run check` now builds TypeScript, runs the local test suite, and validates project Markdown links.
- Documentation link check passed for 46 Markdown files. The documentation gate remains incomplete until README clean-checkout validation is also proven.

## 2026-07-22 README Clean-Checkout Validation Update

- Created a fresh temporary copy of ScheduleOS outside the workspace without `node_modules`, `dist`, or `.git`.
- Verified README local setup commands from that clean copy: `npm install` and `npm run check` passed.
- Verified optional README guarded Docker PostgreSQL commands from that clean copy: `npm run test:postgres:docker` passed and `npm run postgres:test:down` removed the disposable container and volume.
- Removed the temporary validation copy after the proof.
- Documentation gate is now complete, but overall release gate remains `FAIL`.

## 2026-07-22 Release Safety Scan Update

- Added dependency-free `npm run release:safety` scanner for public-owned files.
- `npm run check` now includes release safety scanning.
- Sanitized stale absolute local paths in audit and research docs.
- Release safety scan passed for 80 files. Security gate remains incomplete until git-history or clean-history strategy, production security controls, licensing audit, and remote CI evidence are complete.

## 2026-07-22 License Check Update

- Added dependency-free `npm run license:check` command.
- `npm run check` now includes license checking.
- `npm run license:check` verifies root Apache-2.0 package and license-file expectations.
- Current `package-lock.json` and installed dependency metadata contain only Apache-2.0, ISC, and MIT licenses.
- Current source-marker scan covers `.github`, `migrations`, `scripts`, and `src`.
- Current forbidden-asset scan found no project-owned binary/media/font assets requiring separate license approval.
- Lockfile license review is complete for the current dependency set, but licensing audit remains `FAIL` until documentation reuse, fixture, notice, and final release-candidate review are complete.

## 2026-07-22 Backup And Restore Runbook Foundation Update

- Added `docs/operations/backup-restore-runbook.md`.
- Documented SQLite backup and restore validation flow using existing helpers.
- Documented PostgreSQL `pg_dump`, checksum, disposable restore validation, and cutover procedure.
- Documented sensitive-data handling for backups and workspace exports.
- Linked the runbook from README, self-hosting, SQLite operations, PostgreSQL migrations, and storage design docs.
- Marked the storage-gate runbook foundation complete in `docs/public-release-checklist.md`.
- Release remains `FAIL`: retention cleanup enforcement, full destructive-operation approval workflow, production auth, and remote CI PostgreSQL proof remain incomplete.

## 2026-07-22 SQLite Operations CLI Foundation Update

- Added tested CLI wrappers for SQLite backup, restore validation, scoped workspace export, and scoped workspace deletion.
- Added npm script entrypoints: `db:sqlite:backup`, `db:sqlite:restore`, `db:sqlite:export`, and `db:sqlite:delete-workspace`.
- Tested `sqlite:delete-workspace` refuses destructive deletion unless `--confirm` exactly matches `tenant/workspace/user` for the requested scope.
- This remains a local SQLite operations foundation. Retention policy durations, full operator approval workflow, production auth, and remote CI PostgreSQL proof remain incomplete.

## 2026-07-22 SQLite Backup Encryption Foundation Update

- Added tested SQLite encrypted backup and restore foundation using AES-256-GCM encrypted JSON backup envelopes.
- Added CLI environment-variable key options: `--encrypt-key-env` for `sqlite:backup` and `--decrypt-key-env` for `sqlite:restore`.
- Tested encrypted backup avoids plaintext task content, restores with the right key, rejects wrong key, and refuses missing decrypt env var.
- Release remains `FAIL`: retention cleanup enforcement, full operator approval workflow, production auth, remote CI PostgreSQL proof, and production operational hardening remain incomplete.

## 2026-07-22 Retention Policy Duration Foundation Update

- Added `src/retention-policy.ts` with concrete default retention durations and cutoff calculation.
- Added `npm run retention:policy` for read-only policy/cutoff inspection.
- Documented retention durations in `docs/security/retention-policy.md` and linked it from data handling.
- Release remains `FAIL`: hosted retention cleanup, destructive-operation approvals, production auth, remote CI PostgreSQL proof, and production enforcement remain incomplete.

## 2026-07-22 SQLite Retention Cleanup Foundation Update

- Added SQLite retention cleanup dry-run/apply foundation for scoped operational records.
- Cleanup dry-run reports eligible schedule plan history, idempotency records, import throttle windows, inactive integration metadata, and review-due audit events.
- Cleanup apply requires exact CLI confirmation and deletes only eligible scoped operational records; audit events are review-due only and active tasks/calendar data are not retention-cleaned.
- Added `npm run retention:sqlite-cleanup` and tested dry-run, apply confirmation refusal, scoped deletion, and cross-scope preservation.
- Release remains `FAIL`: hosted retention cleanup, broader destructive-operation approvals, production auth, remote CI PostgreSQL proof, and production enforcement remain incomplete.

## 2026-07-22 PostgreSQL Retention Cleanup Foundation Update

- Added PostgreSQL retention cleanup dry-run/apply foundation for scoped operational records.
- Cleanup uses parameterized tenant/workspace/user scope predicates, reports audit events as review-due only, and applies deletes inside a transaction.
- Added `npm run retention:postgres-cleanup` and tested dry-run, missing-client refusal, apply confirmation refusal, transaction commit, and rollback on delete failure.
- Release remains `FAIL`: hosted retention cleanup, broader destructive-operation approvals, production auth, remote CI PostgreSQL proof, and production enforcement remain incomplete.

## 2026-07-22 Local Destructive Confirmation Helper Foundation Update

- Centralized local exact-confirmation tokens for destructive SQLite restore overwrite, workspace deletion, SQLite retention cleanup apply, and PostgreSQL retention cleanup apply commands.
- Added `sqlite:restore --overwrite --confirm tenant/workspace/user/overwrite/restore-path` refusal and approval coverage.
- Updated backup/restore, retention, storage design, README, and release checklist docs distinguish local helper foundation from still-open production operator approval workflow.
- Release remains `FAIL`: hosted retention cleanup, broader production destructive-operation approvals, production auth, remote CI PostgreSQL proof, production enforcement remain incomplete.

## 2026-07-22 Retention Operator Packet Foundation Update

- Added `npm run retention:operator-packet` for non-destructive SQLite/PostgreSQL cleanup approval packet generation.
- Packet output includes requested backend, tenant/workspace/user scope, `asOf` timestamp, exact dry-run command, exact apply command, required confirmation token, `applyAllowedByPacket: false`, and `secondOperatorReviewRequired: true`.
- Added `docs/operations/retention-operator-runbook.md` with dry-run review, backup validation, second-operator review, and apply-boundary steps.
- Updated retention policy, README, backup/restore runbook, and public release checklist docs.
- Release remains `FAIL`: hosted scheduled cleanup orchestration, production approval storage and reviewer identity proof, operator alerting, failure handling, and final production retention verification remain incomplete.

## 2026-07-22 Repository Naming And Clean-History Readiness Update

- Added `docs/release/repository-readiness.md`.
- Documented current GitHub namespace check for preferred `scheduleos-ai/scheduleos` target and existing unrelated `Agent4343/ScheduleOS` repository collision.
- Documented obvious trademark-conflict check status and required final pre-publication search.
- Documented clean public history strategy for current no-git local folder.
- Marked GitHub name availability check, trademark conflict documentation, and git-history strategy checklist items complete.
- Release remains `FAIL`: clean public history is not prepared, CI is not verified on a public remote, security contact is not configured, public repository is not created, and all final release gates have not passed.

## 2026-07-22 Expanded Licensing Release-Surface Audit Update

- Expanded `scripts/check-licenses.mjs` beyond dependency/root-license checks to scan release text files, docs, GitHub templates, config, source, migrations, scripts, fixture/template/example-like files, forbidden asset extensions, copied-source markers, and NOTICE triggers.
- Latest `npm run license:check` result reviewed 18 package-lock licenses, 99 release text files, and 6 fixture/template/example-like files with assets, copied-source markers, and NOTICE triggers clean.
- Updated `docs/security/licensing-audit.md` and marked the copied-source, fixture, asset, docs, and notice audit complete for the current tree.
- Licensing audit remains `FAIL` until the final release-candidate repeat check and status change are completed.

## 2026-07-22 Webhook Provider Policy Documentation Update

- Added `docs/integrations/webhook-provider-policy.md`.
- Documented current generic webhook task-source signature policy, current/previous secret rotation posture, replay-window policy, event-id idempotency, provider-neutral task payload mapping, CSV provider-template mapping references, and production abuse/rate-limit boundary.
- Linked the policy from task-source documentation and threat model.
- Split the release checklist so provider replay-policy and provider mapping documentation foundation is complete while production secret lifecycle management, provider-specific adapters, operator alerts, and rotation runbooks remain open.
- Release remains `FAIL`: production webhook lifecycle operations, production auth, distributed rate limiting, hosted retention enforcement, remote CI proof, and final release gates remain incomplete.

## 2026-07-22 Webhook Secret Lifecycle Runbook Foundation Update

- Rewrote `docs/integrations/webhook-provider-policy.md` into a clean provider-neutral policy covering payload shape, HMAC signature policy, rotation-list posture, replay windows, field mapping, abuse boundaries, public API boundary, and current test evidence.
- Added `docs/operations/webhook-secret-lifecycle-runbook.md` with local/self-host secret storage rules, planned rotation steps, emergency revocation steps, alert expectations, provider-specific adapter boundaries, and verification checklist.
- Linked the runbook from task-source docs and threat model.
- Split the release checklist so local/self-host runbook foundation is complete while production secret lifecycle enforcement, provider-specific adapters, hosted alerts, and provider-specific rotation runbooks remain blockers.
- Release remains `FAIL`: hosted webhook lifecycle enforcement, provider-specific adapter implementation, alert routing, production runbook verification, distributed rate limiting, production auth, remote CI proof, final release gates remain incomplete.

## 2026-07-22 Local Calendar UI Evidence Update

- Strengthened standalone app-shell test coverage for local daily/weekly calendar view controls, calendar-grid rendering, drag/drop slot wiring, and keyboard-accessible block movement controls.
- Marked local daily/weekly calendar views and local manual time-block drag/drop/keyboard movement controls complete in `docs/public-release-checklist.md`.
- Release remains `FAIL`: production calendar UI hardening, browser-verified drag/drop, conflict preview, accessibility pass, responsive polish, and user-facing confirmation flows remain incomplete.

## 2026-07-22 Tenant Isolation Storage-Boundary Verification Update

- Added `docs/security/tenant-isolation-verification.md`.
- Added SQLite repository test coverage proving cross-scope access is rejected for every current durable surface: tasks, calendar events, working hours, schedule plans, time blocks, audit events, idempotency records, integration state, and import throttle windows.
- Verification matrix maps tenant/workspace/user isolation evidence across local API, in-memory/JSON-backed repositories, SQLite repositories, PostgreSQL repository slices, workspace export, workspace deletion, and guarded live PostgreSQL proof path.
- Updated `docs/architecture/ADR-002-storage-boundaries.md` with current verification evidence.
- Marked current storage-boundary tenant-isolation verification complete in `docs/public-release-checklist.md`.
- Release remains `FAIL`: production persisted auth, roles, memberships, sessions, remote CI PostgreSQL proof, and broader live authorization coverage after production identity lands remain incomplete.

## 2026-07-22 Mock Adapter End-To-End Foundation Update

- Added `docs/integrations/mock-adapter-end-to-end-verification.md`.
- Added combined API test `local API runs mock OwnerOps and ConnectOS adapters end to end`.
- Verified mock OwnerOps work import, blocked/waiting/completed work handling, ConnectOS busy calendar import, private title redaction, plan creation around busy time, plan acceptance, block completion, scoped audit reads, and standalone manual task planning.
- Linked evidence from OwnerOps, ConnectOS, and integration-model docs.
- Marked mock OwnerOps and mock ConnectOS adapter end-to-end foundations complete in `docs/public-release-checklist.md`.
- Release remains `FAIL`: production OwnerOps authentication/webhooks/outbound delivery, ConnectOS OAuth/provider sync/revocation/write-back, production auth, provider retry policy, and abuse analytics remain incomplete.

## 2026-07-22 Local Standalone App Credential Login/Logout Foundation Update

- Added local `/app` credential login form wired to `POST /api/auth/login`.
- Added local `/app` logout action wired to `DELETE /api/auth/session`.
- App requests now include returned CSRF token on unsafe methods when cookie-session transport is enabled.
- Browser auth state is kept in memory only; the app does not use localStorage or sessionStorage for bearer or session tokens.
- Added focused web-app test covering login/logout controls and no browser-persistent auth-token storage.
- Release remains `FAIL`: production browser verification, accessibility pass, responsive polish, identity-provider integration, password reset/recovery UX, admin workflow UX/runbooks, hosted cleanup, remote live authorization proof, and final security review remain incomplete.

## 2026-07-22 Local Standalone App Password Reset UX Foundation Update

- Added local `/app` password reset request controls wired to `POST /api/auth/password-reset-requests`.
- Added local `/app` password reset confirmation controls wired to `POST /api/auth/password-reset`.
- Reset request status stays generic so the app does not reveal whether an account exists.
- Raw reset token is displayed only when the API explicitly returns one for local development/self-host bootstrap mode.
- Added focused web-app test covering reset request/confirm controls and no browser-persistent reset-token storage.
- Release remains `FAIL`: production reset-token delivery, abuse controls, operator/helpdesk workflow, identity-provider recovery, browser accessibility verification, and final security review remain incomplete.

## 2026-07-22 Local Owner/Admin App And Runbook Foundation Update

- Added local `/app` owner/admin controls for saving auth users, assigning workspace memberships, and resetting credentials through existing guarded auth APIs.
- Added focused web-app test coverage for the owner/admin controls and guarded auth-management routes.
- Added `docs/operations/admin-auth-runbook.md` documenting local operator steps, role boundaries, audit expectations, fictional demo IDs, and production gaps.
- Linked the runbook from README, auth model, and threat model.
- Release remains `FAIL`: production browser verification, elevated-action approval workflow, identity-provider integration, hosted cleanup, remote CI authorization proof, and final admin security review remain incomplete.

## 2026-07-22 Provider Import Policy Catalog Foundation Update

- Added tested `GET /api/import-policies` local/self-host catalog exposing provider source systems, operations, recommended local import throttle policies, risk notes, and copyable `importThrottle.sourcePolicies` configuration.
- Documented optional `sourceSystem` filtering and the release boundary in `docs/security/import-abuse-and-provider-policy.md`.
- Marked the local/self-host provider import policy catalog foundation complete in `docs/public-release-checklist.md`.
- Release remains `FAIL`: production distributed rate limiting, request throttling, provider quota enforcement, hosted alerts, abuse analytics, remote CI proof, production auth, and final release gates remain incomplete.

## 2026-07-22 Local Request Rate-Limit Env Foundation Update

- Added startup validation for `rateLimit.windowMs` and `rateLimit.maxRequests` so invalid local request-throttle policies fail before serving traffic.
- Added standalone server env wiring for `SCHEDULEOS_RATE_LIMIT_WINDOW_MS` and `SCHEDULEOS_RATE_LIMIT_MAX_REQUESTS` with local defaults when partially configured.
- Documented the local/self-host request throttling knobs in `.env.example`, deployment guidance, import-abuse policy, and threat model.
- Release remains `FAIL`: production distributed rate limiting, production proxy deployment verification, hosted alerts, abuse analytics, remote CI proof, production auth, and final release gates remain incomplete.

## 2026-07-22 Persisted Authenticated Request-Throttle Foundation Update

- Added JSON-backed, SQLite, and PostgreSQL request throttle repositories scoped by tenant, workspace, user, and hashed request key.
- Added opt-in API `rateLimit.persisted` and standalone env `SCHEDULEOS_RATE_LIMIT_PERSISTED=true`.
- Persisted request throttles store SHA-256 hashes, not raw bearer tokens, cookie values, or client IPs. Unauthenticated requests continue to use process-local buckets.
- Added focused JSON repository, SQLite repository, PostgreSQL fake-client repository, API, and server config tests.
- Release remains `FAIL`: this is a local/self-host shared-storage foundation for authenticated principals, not complete production distributed rate limiting, production proxy deployment verification, provider quota enforcement, hosted alerts, or abuse analytics.

## 2026-07-22 Calendar UI Browser Smoke Foundation Update

- Added stable browser-verification hooks to the standalone calendar grid, drop slots, draggable blocks, write-back conflict list, and drag-status live region.
- Added render tests proving the calendar grid exposes `role="grid"`, drop slots expose `role="gridcell"`, blocks are draggable and keyboard focusable, and write-back conflicts have a stable browser test hook.
- Ran local Chrome browser smoke against `http://127.0.0.1:8797/app` covering save working hours, add task, create plan, drag/drop block movement, accept plan, clean write-back conflict preview, review acknowledgement, desktop render, and mobile render.
- Documented evidence in `docs/release-audit/CALENDAR_UI_BROWSER_SMOKE_20260722.md`.
- Release remains `FAIL`: full production calendar UI hardening still needs broader manual accessibility review, browser matrix coverage, provider-backed conflict-preview edge cases, responsive polish review, and product-owner visual approval.

## 2026-07-22 Provider CSV Import Review Foundation Update

- Replaced provider CSV browser-confirm import flow with an in-page review gate.
- Added local app provider policy panel backed by `GET /api/import-policies`, showing source system, risk level, suggested local throttle policy, and provider notes.
- CSV imports now require a successful preview plus explicit `I reviewed the preview rows and provider policy` acknowledgement before the import button enables.
- Added render tests for the provider policy panel, review status, review checkbox, catalog loading, and no CSV import browser confirm.
- Ran local Chrome browser smoke against `http://127.0.0.1:8798/app` covering template selection, sample loading, preview, policy display, disabled-before-review import, enabled-after-review import, checkbox reset, and clean console.
- Documented evidence in `docs/release-audit/PROVIDER_CSV_IMPORT_REVIEW_SMOKE_20260722.md`.
- Release remains `FAIL`: production-grade provider CSV import workflow still needs larger real-provider fixture sets, provider-specific quota enforcement, hosted alerting, abuse analytics, browser matrix coverage, upload/download production polish, and product-owner approval.

## 2026-07-22 Password Reset Recovery Runbook Foundation Update

- Added `docs/operations/password-reset-recovery-runbook.md` documenting local/self-host reset procedure, production delivery requirements, helpdesk recovery requirements, identity-provider boundary, abuse controls, and verification checklist.
- Linked the runbook from README, auth model, and threat model.
- Marked the local/self-host password reset and recovery runbook foundation complete in `docs/public-release-checklist.md`.
- Release remains `FAIL`: production reset-token delivery integration, identity-provider recovery, distributed abuse controls, helpdesk workflow tooling, browser verification, remote CI proof, production auth, and final security review remain incomplete.

## 2026-07-22 ICS Monthly Recurrence Foundation Update

- Added `RRULE:FREQ=MONTHLY` expansion in `src/ics.ts` for requested recurrence ranges, including UTC end-of-month clamping when the original day does not exist in a target month.
- Added parser-level and local API tests covering monthly recurrence from July 31 through September 30, 2026.
- Updated calendar-provider docs and release checklist to mark local daily/weekly/monthly ICS recurrence foundation complete.
- Release remains `FAIL`: deeper recurrence coverage beyond the current daily/weekly/monthly foundation, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates remain incomplete.

## 2026-07-22 ICS Yearly Recurrence Foundation Update

- Added `RRULE:FREQ=YEARLY` expansion in `src/ics.ts` for requested recurrence ranges using the same UTC date-clamping path as monthly recurrence.
- Added parser-level and local API tests covering yearly recurrence from February 29, 2024 through February 28, 2026.
- Updated calendar-provider docs and release checklist to mark local daily/weekly/monthly/yearly ICS recurrence foundation complete.
- Release remains `FAIL`: richer RRULE coverage beyond the current local daily/weekly/monthly/yearly foundation, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates remain incomplete.

## 2026-07-22 ICS BYMONTHDAY And BYMONTH Foundation Update

- Added tested local `RRULE` filter support for monthly positive `BYMONTHDAY` day lists and yearly `BYMONTH` month filters in `src/ics.ts`.
- Added parser-level and local API tests covering monthly `BYMONTHDAY=15,30` and yearly `BYMONTH=3` imports through the public ICS import route.
- Updated README, calendar-provider documentation, and the release checklist to describe the expanded local recurrence foundation.
- Release remains `FAIL`: richer release-grade recurrence coverage, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates remain incomplete.

## 2026-07-22 Sync Checkpoint Idempotency Foundation Update

- Added `POST /api/sync/checkpoints` local/self-host foundation for provider sync cursor checkpoints using scoped provider event IDs.
- Added local API tests proving exact duplicate checkpoint delivery is idempotent and conflicting replay of the same provider event ID is rejected as `SYNC_REPLAY_CONFLICT`.
- Checkpoints update `IntegrationState` cursor metadata and append one `SYNC_CHECKPOINT_RECORDED` audit event for the first delivery.
- Updated README, calendar-provider documentation, and release checklist to mark the local/self-host checkpoint foundation complete.
- Release remains `FAIL`: production sync UX, production provider lifecycle enforcement, hosted alerts, browser UI hardening, remote CI proof, and final release gates remain incomplete.

## 2026-07-22 Provider Revocation Foundation Update

- Added `POST /api/integrations/revoke` local/self-host foundation for provider revocation handling using scoped provider event IDs.
- Added local API tests proving exact duplicate revocation delivery is idempotent and that disconnected integrations reject later sync checkpoints as `INTEGRATION_DISCONNECTED`.
- Revocation clears sync cursor and last sync time from `IntegrationState`, records revocation metadata, and appends one `INTEGRATION_REVOKED` audit event for the first delivery.
- Updated README, calendar-provider documentation, and release checklist to mark the local/self-host provider revocation foundation complete.
- Release remains `FAIL`: production provider lifecycle enforcement, provider-specific adapters, hosted alerts, revocation runbooks, browser UI hardening, remote CI proof, and final release gates remain incomplete.

## 2026-07-22 Local Calendar Write-Back Protection Foundation Update

- Added local API tests proving accepted plan write-back rejects read-only calendars with `CALENDAR_READ_ONLY`.
- Added `POST /api/schedule-plans/{planId}/calendar-writeback` foundation for accepted plans, writing accepted or locked plan blocks into scoped local `CalendarEvent` records when the target calendar is writable.
- Generated write-back events use stable plan/block-derived IDs, preserve tenant/workspace/user scope, store `sourceSystem: "SCHEDULEOS_WRITEBACK"`, and avoid pretending to be external provider writes.
- Updated README, calendar-provider documentation, and release checklist to mark only the local/self-host read-only protection and writable local calendar-event write-back foundation complete.
- Release remains `FAIL`: production Google/Microsoft/provider write-back adapters, provider-specific permission discovery, remote provider conflict handling, hosted alerts, browser UI hardening, remote CI proof, and final release gates remain incomplete.

## 2026-07-22 Local Calendar Write-Back Conflict Preview Foundation Update

- Added local API tests proving accepted-plan write-back preview reports conflicts with existing busy local calendar events and does not persist write-back events.
- Added `POST /api/schedule-plans/{planId}/calendar-writeback/preview` foundation for accepted plans, comparing candidate accepted/locked block events against existing busy events in the requested local calendar.
- Preview responses include block ID, task ID, proposed event ID, conflict event ID, overlap window, and `BLOCKING` severity while redacting private/confidential/busy-only conflict titles to `Busy`.
- Updated README, calendar-provider documentation, and release checklist to mark only the local no-write conflict preview foundation complete.
- Release remains `FAIL`: production calendar UI conflict review, remote provider conflict handling, provider-specific permissions, hosted alerts, browser verification, remote CI proof, and final release gates remain incomplete.

## 2026-07-22 Local Calendar Write-Back App Controls Foundation Update

- Added standalone app controls for accepted-plan local calendar write-back: target calendar ID, conflict preview button, write-back button, and live conflict list.
- Added static web-app test coverage proving the controls, local public API routes, `readOnly: false` payload, and no browser token storage remain present in rendered HTML.
- Browser-render smoke checked the rebuilt local app in Google Chrome at 1280x900 and 390x844: controls rendered, buttons were disabled until an accepted plan exists, page width did not overflow, and console output was clean.
- Added inline favicon hint to avoid implicit browser favicon 404 noise during local app loads.
- Release remains `FAIL`: interactive end-to-end conflict workflow, browser-verified drag/drop, accessibility pass, responsive polish, production provider conflict handling, remote CI proof, and final release gates remain incomplete.

## 2026-07-22 Local Calendar Write-Back Conflict Blocking Foundation Update

- Added local API tests proving accepted-plan write-back rejects blocking busy-event conflicts as `CALENDAR_WRITEBACK_CONFLICT` and persists no `SCHEDULEOS_WRITEBACK` events when conflicts exist.
- Updated `POST /api/schedule-plans/{planId}/calendar-writeback` to reuse the same redacted conflict detection shape as preview before performing local calendar-event writes.
- Conflict responses include redacted conflict details and `conflictCount` so API clients cannot bypass preview safety by calling write-back directly.
- Updated README, calendar-provider documentation, and release checklist to mark only the local/self-host server-side conflict blocking foundation complete.
- Release remains `FAIL`: production provider conflict resolution, provider-specific permissions, interactive browser conflict approval, hosted alerts, remote CI proof, and final release gates remain incomplete.

## 2026-07-22 Local Calendar Write-Back Preview-Gated App Safety Update

- Updated the standalone app so accepted-plan write-back stays disabled until user has run a clean conflict preview for the same accepted plan and calendar ID, then explicitly acknowledges review.
- The app now clears stale write-back preview state when plans are created, replanned, accepted, rejected, written back, fail write-back, or when the calendar ID changes.
- Added rendered-app test coverage proving preview state, calendar-ID invalidation wiring, disabled write-back derivation, review acknowledgement control, and user-facing preview guidance remain present.
- Browser-render smoke checked the rebuilt local app in Google Chrome at 1280x900 and 390x844: write-back controls and review acknowledgement rendered, preview/write-back/acknowledgement controls were disabled before an accepted plan exists, page width did not overflow, and console output was clean.
- Release remains `FAIL`: full interactive browser conflict workflow, browser-verified drag/drop, accessibility pass, responsive polish, production provider conflict handling, hosted alerts, remote CI proof, and final release gates remain incomplete.

## 2026-07-22 Local Calendar Write-Back Accessibility Status Foundation Update

- Added described help and status text for local write-back preview, review acknowledgement, and write-back controls.
- The write-back status region uses `role="status"` with polite live announcements for preview-required, clean-preview, conflict, confirmation-needed, and write-back-complete states.
- Added rendered-app test coverage proving the help/status region and `aria-describedby` relationships remain present.
- Browser-render smoke checked Google Chrome at 1280x900 and 390x844: help/status text rendered, preview/write-back/acknowledgement controls referenced existing described-by targets, status used `role="status"` with `aria-live="polite"`, controls were disabled before an accepted plan exists, page width did not overflow, and console output was clean.
- Release remains `FAIL`: full production accessibility pass, keyboard interaction audit, browser-verified drag/drop, responsive polish, production provider conflict handling, hosted alerts, remote CI proof, and final release gates remain incomplete.

## 2026-07-22 Provider CSV Fixture Validation Update

- Expanded every built-in provider CSV sample from two fictional rows to four fictional rows for Todoist, Linear, Asana, ClickUp, Trello, and GitHub Issues.
- Added API test coverage that fetches the provider template catalog and dry-runs every built-in sample fixture through the real CSV import path.
- Test coverage now verifies every built-in sample row count matches the shipped CSV, contains no email-like strings, previews without row errors, maps to the expected provider `sourceSystem`, and does not persist tasks during dry-run preview.
- Updated task-source documentation and release checklist to distinguish fictional built-in fixture validation from the still-open need for broader real-provider export fixture coverage.
- Release remains `FAIL`: production upload polish, broader real-provider export fixture sets, provider quota enforcement, hosted abuse analytics, remote CI proof, and final release gates remain incomplete.

## 2026-07-22 Trusted Proxy Rate-Limit Identity Foundation Update

- Added opt-in `rateLimit.trustedProxyClientIpHeader` API option for `x-forwarded-for` or `x-real-ip` client IP identity when ScheduleOS is behind a trusted reverse proxy.
- Added standalone server env wiring through `SCHEDULEOS_RATE_LIMIT_TRUSTED_PROXY_HEADER`.
- The default remains conservative: forwarded headers are ignored unless explicitly configured.
- Added tests proving spoofed forwarded IP headers are ignored by default, trusted `x-forwarded-for` separates unauthenticated request buckets by first forwarded IP, and invalid API/env header settings fail startup.
- Updated README, deployment guidance, import-abuse policy, threat model, and release checklist to mark only local/self-host trusted proxy identity foundation complete.
- Release remains `FAIL`: production distributed rate limiting, production proxy deployment verification, provider quota enforcement, hosted alerts, abuse analytics, remote CI proof, final release gates remain incomplete.

## 2026-07-22 Provider Import Policy Enforcement Foundation Update

- Added opt-in `importThrottle.enforceProviderPolicies` API option so local/self-host deployments can enforce built-in provider import policy catalog recommendations without manually copying every `sourcePolicies` entry.
- Source-specific `importThrottle.sourcePolicies` still wins when explicitly configured; unknown sources continue using the global import throttle policy.
- Added API test coverage proving catalog enforcement rate-limits `JSON_IMPORT` at the built-in 500-row policy even when the global policy allows 1000 rows, while uncataloged sources continue using the global policy.
- Updated README, self-hosting, import-abuse policy, threat model, and release checklist.
- Release remains `FAIL`: production provider quota governance, distributed enforcement, hosted alerts, abuse analytics, remote CI proof, and final release gates remain incomplete.

## Next Best Release-Readiness Work


## 2026-07-22 Import Abuse Alert Threshold Foundation Update

- Added optional local/self-host `importAbuseAlerts.deniedEvents` and `importAbuseAlerts.deniedRows` API configuration.
- Added standalone env wiring `SCHEDULEOS_IMPORT_ABUSE_ALERT_DENIED_EVENTS` and `SCHEDULEOS_IMPORT_ABUSE_ALERT_DENIED_ROWS`.
- `GET /api/import-abuse/summary` now returns `alert.enabled`, `alert.status`, `alert.thresholds`, and `alert.triggers`; configured thresholds produce `REVIEW_REQUIRED` without copying imported row content.
- Tested threshold-triggered summaries and invalid threshold startup rejection.
- Release remains `FAIL`: hosted alert delivery, dashboards, escalation policy, distributed throttling, provider quota enforcement, production abuse analytics, remote CI proof, and final release gates remain incomplete.


## 2026-07-22 ICS Ordinal BYDAY Recurrence Foundation Update

- Added local ICS parser support for monthly/yearly ordinal `BYDAY` rules such as `1MO` first Monday and `-1FR` last Friday.
- Added parser tests for positive and negative monthly/yearly ordinal `BYDAY` recurrence expansion.
- Added local API ICS import test coverage for monthly ordinal `BYDAY` recurrence through `POST /api/calendar-events/ics/import`.
- Release remains `FAIL`: release-grade recurrence still needs broader RRULE coverage beyond current `BYSETPOS` foundation, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.


## 2026-07-22 ICS BYSETPOS Recurrence Foundation Update

- Added local ICS parser support for monthly `BYSETPOS` recurrence selection, including rules such as `BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1` for last weekday of the month.
- Added parser tests proving monthly `BYSETPOS` expansion and invalid `BYSETPOS=0` rejection.
- Added local API ICS import test coverage for monthly `BYSETPOS` recurrence through `POST /api/calendar-events/ics/import`.
- Release remains `FAIL`: release-grade recurrence still needs broader RRULE coverage beyond current `BYSETPOS` foundation, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

Last verified after 2026-07-22 provider import policy enforcement foundation update: `npm run check` passed 289 tests, documentation link check across 60 Markdown files, release safety scan passed, license check passed. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities.

1. Run `npm run check`.
2. Run `npm audit --omit=dev --audit-level=high`.
3. Continue production webhook hardening, distributed rate limiting/throttling design, production proxy deployment verification, provider quota enforcement, hosted abuse analytics, release-grade ICS work beyond the current local daily/weekly/monthly/yearly recurrence foundation, and production sync-state idempotency.
4. Run the guarded live PostgreSQL Docker proof when Docker is available.
5. Continue production auth hardening: login/logout UX, self-service password reset/recovery policy, horizontally coordinated production lockout/backoff policy, identity-provider integration, production admin UX/runbooks, hosted session cleanup, and remote live authorization proof.

## 2026-07-22 ICS Yearly BYSETPOS Recurrence Foundation Update

- Added local ICS parser support for yearly `BYSETPOS` recurrence selection with `BYMONTH` and plain `BYDAY` candidate sets.
- Added parser tests proving a yearly last-weekday-in-March rule and yearly cross-quarter candidate selection such as `BYMONTH=3,6,9,12;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1`.
- Added local API ICS import test coverage for yearly `BYSETPOS` recurrence through `POST /api/calendar-events/ics/import`.
- Updated README, calendar-provider docs, and release checklist to record monthly/yearly `BYSETPOS` coverage while keeping the release-grade ICS workflow unchecked.
- Verified after this update: `npm run check` passed 303 tests, documentation link check across 60 Markdown files, release safety scan across 108 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: release-grade recurrence still needs broader RRULE coverage beyond current foundations, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS Negative BYMONTHDAY Recurrence Foundation Update

- Added local ICS parser support for negative monthly `BYMONTHDAY` values, including `BYMONTHDAY=-1` for month-end recurrence.
- Kept `BYMONTHDAY=0` invalid and added parser coverage proving it is rejected.
- Added parser and local API import tests for negative monthly `BYMONTHDAY` through `POST /api/calendar-events/ics/import`.
- Updated README, calendar-provider docs, and release checklist to record positive and negative monthly `BYMONTHDAY` coverage while keeping the release-grade ICS workflow unchecked.
- Verified after this update: `npm run check` passed 306 tests, documentation link check across 60 Markdown files, release safety scan across 108 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: release-grade recurrence still needs broader RRULE coverage beyond current foundations, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-22 ICS WKST Weekly Recurrence Foundation Update

- Added local ICS parser support for weekly `WKST` week-start handling on interval `BYDAY` rules.
- Added parser and local API import tests proving `WKST=SU` changes every-other-week Monday expansion from the previous implicit Monday-start behavior.
- Updated README, calendar-provider docs, and release checklist to record the local `WKST` foundation while keeping the release-grade ICS workflow unchecked.
- Verified after this update: `npm run check` passed 308 tests, documentation link check across 60 Markdown files, release safety scan across 108 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: release-grade recurrence still needs broader RRULE coverage beyond current foundations, production sync UX, production sync-state idempotency, browser UI hardening, remote CI proof, and final release gates.

## 2026-07-23 Public Event Bounded Ready Delivery Foundation Update

- Added optional `dryRun`, `maxSubscriptions`, and `maxEvents` controls to local/self-host `POST /api/events/webhook-subscriptions/deliver-ready`.
- Dry-run responses preview selected work without sending network deliveries or recording delivery attempts.
- Bounded delivery applies subscription and event caps before network delivery and returns content-minimized `matchedEventCount` and `processedEventCount` per subscription.
- Added API test coverage proving dry-run sends no webhook traffic and bounded delivery processes one event for one selected subscription.
- Updated README, integration model, public release checklist, and public-event delivery operator runbook with bounded ready-delivery operator guidance.
- Verified before this audit note: `npm run check` passed 416 tests, documentation link check across 62 Markdown files, release safety scan across 110 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows local/self-host operator risk, but production managed secret storage, durable public-event subscription workers, durable hosted retry workers, hosted delivery operations and observability, hosted alert routing, remote CI proof, final security review, and final release gates remain incomplete.

## 2026-07-23 Public Event Delivery-Health Summary Foundation Update

- Added local/self-host `GET /api/events/webhook-deliveries/summary` for scoped delivery health totals and per-target URL hash summaries.
- Summary responses expose total attempts, delivered attempts, failed attempts, retryable failed attempts, target count, latest target status, latest attempt timestamp, and next retry timestamp when available.
- Summary responses do not expose webhook secrets, signatures, raw target URLs, private task text, or private calendar titles.
- Added API test coverage proving the summary aggregates one delivered target and one repeatedly failing target by target URL hash without leaking raw targets or secrets.
- Updated README, integration model, public release checklist, and public-event delivery operator runbook with local/self-host delivery-health summary guidance.
- Verified before this audit note: `npm run check` passed 417 tests, documentation link check across 62 Markdown files, release safety scan across 110 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this is still local/self-host delivery observability. Production hosted dashboards, alert routing, durable subscription workers, hosted retry workers, managed secret storage, remote CI proof, final security review, and final release gates remain incomplete.

## 2026-07-23 Public Event Delivery Alert-Threshold Foundation Update

- Added optional local/self-host `publicEventDeliveryAlerts.failedAttempts` and `publicEventDeliveryAlerts.retryableFailedAttempts` API config.
- Added standalone env wiring through `SCHEDULEOS_PUBLIC_EVENT_DELIVERY_ALERT_FAILED_ATTEMPTS` and `SCHEDULEOS_PUBLIC_EVENT_DELIVERY_ALERT_RETRYABLE_FAILED_ATTEMPTS`.
- `GET /api/events/webhook-deliveries/summary` now returns `alert.enabled`, `alert.status`, `alert.thresholds`, and `alert.triggers`; configured thresholds produce `REVIEW_REQUIRED` without sending hosted alerts or exposing raw webhook targets/secrets.
- Added API tests proving delivery-health thresholds produce `REVIEW_REQUIRED` and invalid threshold config is rejected at startup.
- Added standalone server config tests proving env vars enable thresholds and invalid env values are rejected.
- Updated `.env.example`, README, self-hosting docs, integration model, threat model, public release checklist, and public-event delivery operator runbook with local/self-host threshold guidance.
- Verified before this audit note: `npm run check` passed 420 tests, documentation link check across 62 Markdown files, release safety scan across 110 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows local/self-host delivery review visibility, but production hosted alert routing, dashboards, durable delivery workers, durable retry workers, managed secret storage, remote CI proof, final security review, and final release gates remain incomplete.

## 2026-07-23 ICS RECURRENCE-ID Exception Foundation Update

- Added local ICS parser support for `RECURRENCE-ID` exception VEVENTs so a moved or edited recurrence instance replaces the generated occurrence keyed by the original recurrence start.
- Added parser test coverage proving a daily recurring event with a moved second occurrence preserves the original occurrence external ID while using the override title, start, and end.
- Updated README, calendar-provider docs, and release checklist to record local `RECURRENCE-ID` moved/edited exception substitution and cancelled-instance omission while keeping the release-grade ICS workflow unchecked.
- Verified after this update: `npm run check` passed 481 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows local recurrence exception handling, but release-grade ICS workflow still needs production sync UX, production sync-state idempotency, provider fixture breadth, browser UI hardening, remote CI proof, and final release gates remain incomplete.

## 2026-07-23 ICS Cancelled RECURRENCE-ID Foundation Update

- Added local ICS parser support for `STATUS:CANCELLED` `RECURRENCE-ID` exception VEVENTs so cancelled recurring instances omit the generated occurrence instead of importing as a busy cancelled event.
- Added parser test coverage proving a daily recurring event with a cancelled second occurrence returns only the remaining first and third occurrences.
- Updated README, calendar-provider docs, and release checklist to distinguish moved/edited `RECURRENCE-ID` exception substitution from cancelled-instance omission.
- Verified after this update: `npm run check` passed 482 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows local recurrence cancellation handling, but release-grade ICS workflow still needs production sync UX, production sync-state idempotency, provider fixture breadth, browser UI hardening, remote CI proof, and final release gates remain incomplete.

## 2026-07-23 ICS Cancelled RECURRENCE-ID API Reimport Foundation Update

- Added local API re-import support for cancelled `RECURRENCE-ID` recurrence instances so a previously imported occurrence is deleted when a later ICS import marks that instance `STATUS:CANCELLED`.
- Added API test coverage proving initial import creates three recurring occurrences, re-import with one cancelled recurrence occurrence updates the remaining two, returns `deletedCount: 1`, and exported ICS no longer contains the cancelled occurrence UID.
- Updated README, calendar-provider docs, and public release checklist with the local API cancelled-occurrence deletion count foundation.
- Verified after this update: `npm run check` passed 483 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows local sync-state deletion behavior for cancelled ICS recurrence instances, but production sync UX, production sync-state idempotency across real providers, provider fixture breadth, browser UI hardening, remote CI proof, and final release gates remain incomplete.

## 2026-07-23 ICS Cancelled RECURRENCE-ID Public Event Visibility Update

- Added local API public-event visibility for cancelled `RECURRENCE-ID` recurrence re-import deletion. When a later ICS import marks a previously stored recurrence occurrence `STATUS:CANCELLED`, the local API deletes that occurrence and appends scoped `calendar.event_changed` read-model evidence for the actual deleted event.
- Added API test coverage proving the deleted occurrence evidence is available through `GET /api/events?...type=calendar.event_changed&sourceSystem=SCHEDULEOS`, carries `status: "CANCELLED"` and the original occurrence external ID, and does not leak the cancelled ICS summary text.
- Updated README, integration-model docs, calendar-provider docs, and public release checklist with the local/self-host audit visibility foundation while keeping the release-grade ICS workflow unchecked.
- Focused verification before this audit note: `npm run build && node --test dist/api.test.js` passed 173 API tests.
- Verified after this update: `npm run check` passed 483 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows local audit/public-event visibility for cancelled ICS recurrence deletion only. Production sync UX, production sync-state idempotency across real providers, provider fixture breadth, browser UI hardening, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Local Calendar Delete Public Event Visibility Update

- Added local API public-event visibility for manual calendar event deletion. `DELETE /api/calendar-events/:id` now reads the scoped event before deletion, deletes it, then appends scoped `calendar.event_changed` evidence with `status: "CANCELLED"` and content-minimized metadata.
- Added API regression coverage proving manual local calendar delete creates a second `calendar.event_changed` item after an earlier update, keeps the calendar ID visible, and does not leak the deleted private calendar title.
- Hardened local calendar audit event IDs with a status segment so fast update/delete sequences cannot overwrite one another when they happen in the same millisecond in local storage.
- Focused verification before this audit note: `npm run build && node --test dist/api.test.js` passed 173 API tests.
- Verified after this update: `npm run check` passed 483 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows local/self-host calendar delete audit visibility only. Production sync UX, production sync-state idempotency across real providers, provider fixture breadth, browser UI hardening, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Production Auth Authorization Matrix Packet Update

- Hardened `auth:production-readiness-packet` so release reviewers must provide an explicit `--authorization-matrix` evidence label. This makes owner, admin, editor, viewer, disabled-user, inactive-membership, cross-tenant, cross-workspace, and cross-user authorization proof a first-class production-auth review artifact.
- Packet output now includes `authorizationMatrix`, requires `authorization matrix proof`, and adds a review step to attach the named authorization matrix evidence. The packet remains review-only and cannot approve production auth, mutate users, create sessions, rotate credentials, run migrations, or complete remote CI/security approval.
- Added CLI coverage proving the packet emits the authorization matrix field and evidence requirement without raw demo tokens, plaintext passwords, or secret-like values, and rejects blank authorization-matrix labels.
- Updated README, auth model docs, and public release checklist with the authorization-matrix requirement while keeping the production persisted-auth gate unchecked.
- Focused verification before this audit note: `npm run build && node --test dist/cli.test.js` passed 72 CLI tests.
- Verified after this update: `npm run check` passed 484 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows production-auth review evidence only. Production authentication UX, identity-provider integration, production reset-token delivery/recovery policy, production distributed lockout/backoff policy, live production authorization coverage, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Production Auth Authorization Matrix Evidence Rows Update

- Added `auth:authorization-matrix-packet` and package script to generate the concrete review-only authorization matrix row packet referenced by `auth:production-readiness-packet --authorization-matrix`.
- Packet rows cover owner, admin, editor, viewer, viewer write denial, disabled-user denial, inactive-membership denial, cross-tenant denial, cross-workspace denial, cross-user private-calendar denial, revoked-session denial, and expired-session denial.
- Packet output is scoped by tenant, workspace, user, backend, environment, and as-of timestamp. It explicitly keeps `productionApprovalGranted: false` and `authMutationAllowedByPacket: false`.
- Added CLI coverage proving the packet emits all expected proof rows, rejects blank matrix names, and avoids raw demo tokens, plaintext passwords, or secret-like values.
- Updated README, auth model docs, and public release checklist with the generated authorization-matrix packet while keeping the production persisted-auth gate unchecked.
- Focused verification before this audit note: `npm run build && node --test dist/cli.test.js` passed 74 CLI tests.
- Verified after this update: `npm run check` passed 486 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows production-auth review evidence only. Production authentication UX, identity-provider integration, production reset-token delivery/recovery policy, production distributed lockout/backoff policy, live production authorization coverage, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Durable Editor Membership Role Foundation Update

- Added explicit durable `EDITOR` workspace membership role support while preserving `MEMBER` as a compatibility role that maps to editor-level write access for session authorization.
- Updated local API membership parsing so owner/admin membership management can create `EDITOR` memberships, aligning durable auth records with static API roles and the production authorization matrix packet.
- Added API coverage proving admin-scoped membership management can create an `EDITOR` membership without replacing legacy `MEMBER` coverage.
- Added PostgreSQL repository coverage proving `EDITOR` memberships are stored and emitted through the same durable auth repository path as other membership roles.
- Updated auth model docs and public release checklist with the explicit `EDITOR` plus compatibility `MEMBER` role boundary while keeping the production persisted-auth gate unchecked.
- Focused verification before this audit note: `npm run build && node --test dist/api.test.js` passed 173 API tests; `npm run build && node --test dist/postgres-repositories.test.js` passed.
- Verified after this update: `npm run check` passed 486 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows durable role-model alignment only. Production authentication UX, identity-provider integration, production reset-token delivery/recovery policy, production distributed lockout/backoff policy, live production authorization coverage, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Authorization Matrix Evidence Reference Update

- Added `evidenceReferences` to every `auth:authorization-matrix-packet` row so release reviewers can trace each owner, admin, editor, viewer, disabled-user, inactive-membership, cross-scope, private-calendar, revoked-session, and expired-session review row back to in-repository test evidence.
- Added CLI coverage requiring every matrix row to include at least one `src/...test.ts::test name` reference and requiring references to match the known local evidence list.
- Updated README and public release checklist with the evidence-reference behavior while keeping the production persisted-auth gate unchecked.
- Focused verification before this audit note: `npm run build && node --test dist/cli.test.js` passed 74 CLI tests.
- Verified after this update: `npm run check` passed 486 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows review traceability only. Production authentication UX, identity-provider integration, production reset-token delivery/recovery policy, production distributed lockout/backoff policy, live production authorization coverage, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Credential Login Disabled Principal Denial Update

- Hardened local credential login so disabled users and suspended workspace memberships receive the same generic `INVALID_CREDENTIALS` response as missing users or wrong passwords.
- The denial path does not create persisted auth sessions and avoids exposing `DISABLED` or `SUSPENDED` account state in the response body.
- Updated `auth:authorization-matrix-packet` evidence references so disabled-user and inactive-membership rows point to direct API coverage instead of indirect login/repository evidence.
- Added API coverage proving disabled-user and inactive-membership credential login denials are generic and create no sessions.
- Updated auth model docs and public release checklist with the credential-login denial boundary while keeping the production persisted-auth gate unchecked.
- Focused verification before this audit note: `npm run build && node --test dist/api.test.js` passed 174 API tests; `npm run build && node --test dist/cli.test.js` passed 74 CLI tests.
- Verified after this update: `npm run check` passed 487 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows local credential-login authorization evidence only. Production authentication UX, identity-provider integration, production reset-token delivery/recovery policy, production distributed lockout/backoff policy, live production authorization coverage, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Revoked And Expired Session Denial Evidence Update

- Added direct protected-route API proof that revoked bearer sessions and expired bearer sessions return generic `UNAUTHENTICATED` responses.
- Updated `auth:authorization-matrix-packet` revoked-session and expired-session rows to reference direct API denial coverage instead of relying on broader lifecycle or reset-token evidence.
- Updated auth model docs to name revoked/expired protected-route denial as current local/self-host foundation.
- Focused verification before this audit note: `npm run build && node --test dist/api.test.js && node --test dist/cli.test.js` passed 175 API tests and 74 CLI tests.
- Verified after this update: `npm run check` passed 488 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows authorization-matrix evidence only. Production authentication UX, identity-provider integration, production reset-token delivery/recovery policy, production distributed lockout/backoff policy, live production authorization coverage, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Disabled User And Inactive Membership Session Denial Evidence Update

- Added direct protected-route API proof that otherwise unexpired sessions for disabled users and suspended workspace memberships return generic `UNAUTHENTICATED` responses.
- Updated `auth:authorization-matrix-packet` disabled-user and inactive-membership rows to reference direct session-use denial coverage in addition to credential-login denial coverage.
- Updated auth model docs to name disabled-user and inactive-membership protected-route denial as current local/self-host foundation.
- Focused verification before this audit note: `npm run build && node --test dist/api.test.js && node --test dist/cli.test.js` passed 176 API tests and 74 CLI tests.
- Verified after this update: `npm run check` passed 489 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows authorization-matrix evidence only. Production authentication UX, identity-provider integration, production reset-token delivery/recovery policy, production distributed lockout/backoff policy, live production authorization coverage, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Dependency Audit Local Evidence Command Update

- Updated `dependency:final-audit-readiness-packet` to include explicit local evidence commands for full local gate, production dependency audit, installed production dependency tree, license check, and no-`.git` proof.
- The packet keeps `dependencyAuditPassApproved`, dependency mutation, lockfile mutation, release-gate mutation, and package-registry mutation flags false.
- Updated README dependency readiness docs to explain the local evidence commands remain review inputs only and do not replace remote CI dependency audit proof or second-operator approval.
- Focused verification before this audit note: `npm run build && node --test dist/cli.test.js` passed 74 CLI tests. `npm ls --omit=dev --all` completed and reported the production dependency tree rooted at `pg@8.22.0` with optional `pg-native` unmet only as optional.
- Verified after this update: `npm run check` passed 489 tests, documentation link check across 63 Markdown files, release safety scan across 111 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows dependency-audit evidence collection only. Final dependency audit `PASS`, remote CI dependency audit proof, second-operator review, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 First Commit Staging Manifest Update

- Added `docs/release/first-commit-staging-manifest.md` as the review artifact required by the clean history readiness packet.
- The manifest defines include/exclude boundaries for the future first public commit and repeats the local evidence commands required before any git initialization.
- Updated repository readiness and README clean-history notes to point to the manifest.
- Focused verification before this audit note: `npm run docs:links && npm run release:safety && npm run license:check` passed documentation link check across 64 Markdown files, release safety scan across 112 files, and license check across 113 release text files.
- Verified after this update: `npm run check` passed 489 tests, documentation link check across 64 Markdown files, release safety scan across 112 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows clean-history preparation only. Clean public history remains incomplete until every release gate passes, second-operator review occurs, git is intentionally initialized from the approved release-candidate tree, and the first public commit is created without private history.

## 2026-07-23 Local Membership Privilege Boundary Evidence Update

- Added API regression coverage proving an `ADMIN` principal can create ordinary `MEMBER` and `EDITOR` memberships but receives `403 FORBIDDEN` when attempting to grant `OWNER` or `ADMIN`; privileged membership grants remain owner-only.
- Updated README, auth model docs, and public release checklist with the local/self-host membership privilege-boundary foundation while keeping the production persisted-auth gate unchecked.
- Focused verification before this audit note: `npm run build && node --test dist/api.test.js` passed 179 API tests.
- Verified after this update: `npm run check` passed 497 tests, documentation link check across 64 Markdown files, release safety scan across 112 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows local/self-host role-management authorization evidence only. Production authentication UX, identity-provider integration, production reset-token delivery/recovery policy, production distributed lockout/backoff policy, live production authorization coverage, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Local Auth Management Lower-Role Denial Evidence Update

- Added API regression coverage proving `EDITOR` and `VIEWER` principals receive `403 FORBIDDEN` when attempting auth-user creation or workspace-membership creation.
- Updated README, auth model docs, and public release checklist with the local/self-host auth-management lower-role denial foundation while keeping the production persisted-auth gate unchecked.
- Focused verification before this audit note: `npm run build && node --test dist/api.test.js` passed 179 API tests.
- Verified after this update: `npm run check` passed 497 tests, documentation link check across 64 Markdown files, release safety scan across 112 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows local/self-host role-management authorization evidence only. Production authentication UX, identity-provider integration, production reset-token delivery/recovery policy, production distributed lockout/backoff policy, live production authorization coverage, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Local Auth Management Cross-Scope Denial Evidence Update

- Added API regression coverage proving owner/admin auth-management requests receive `403 FORBIDDEN` when auth-user creation targets another tenant or workspace-membership creation targets another tenant or workspace.
- Updated README, auth model docs, and public release checklist with the local/self-host auth-management cross-scope denial foundation while keeping the production persisted-auth gate unchecked.
- Focused verification before this audit note: `npm run build && node --test dist/api.test.js` passed 179 API tests.
- Verified after this update: `npm run check` passed 497 tests, documentation link check across 64 Markdown files, release safety scan across 112 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows local/self-host role-management authorization evidence only. Production authentication UX, identity-provider integration, production reset-token delivery/recovery policy, production distributed lockout/backoff policy, live production authorization coverage, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-23 Local Auth Management Read/List Denial Evidence Update

- Added API regression coverage proving `EDITOR` and `VIEWER` principals receive `403 FORBIDDEN` when reading auth users or listing memberships, and owner/admin principals receive `403 FORBIDDEN` when reading another tenant's auth user or membership list.
- Updated README, auth model docs, and public release checklist with the local/self-host auth-management read/list denial foundation while keeping the production persisted-auth gate unchecked.
- Focused verification before this audit note: `npm run build && node --test dist/api.test.js` passed 179 API tests.
- Verified after this update: `npm run check` passed 497 tests, documentation link check across 64 Markdown files, release safety scan across 112 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories.
- Release remains `FAIL`: this narrows local/self-host role-management authorization evidence only. Production authentication UX, identity-provider integration, production reset-token delivery/recovery policy, production distributed lockout/backoff policy, live production authorization coverage, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-27 Auth Reset Token Scope Regression Update

- Added local API regression coverage proving a password-reset token requested for `tenant_demo` / `workspace_demo` / `user_jordan` cannot be consumed by the same tenant with `workspace_other` or `user_other`.
- Verified invalid cross-scope reset attempts return `401 INVALID_RESET_TOKEN` and do not consume the token; the original same-scope reset can still complete once and the new credential can log in.
- Updated `docs/release-audit/AUTH_RESET_TOKEN_SCOPE_REGRESSION_20260727.md`, `docs/security/auth-model.md`, `docs/security/production-auth-approval-checklist.md`, and `docs/public-release-checklist.md`.
- Focused verification before this audit note: `npm run build && node --test dist/api.test.js` passed 181 API tests.
- Verified after this update: `npm run check` passed 740 tests, documentation link check across 95 Markdown files, release safety scan across 149 files, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories. Checklist integrity reported `malformed: []`, `checked: 180`, `unchecked: 18`.
- Release remains `FAIL`: this narrows local/self-host password-reset scope evidence only. Production authentication UX, identity-provider integration, production reset-token delivery/recovery policy, distributed recovery abuse controls, operator/helpdesk workflow, remote CI proof, final security/privacy/licensing approval, clean public history, public repository setup, and release approval remain incomplete.

## 2026-07-27 Security Policy Contact Checker Update

- Added `scripts/check-security-policy-contact.mjs` and wired `security:policy-contact:check` into `npm run check`.
- The checker verifies the pre-release `SECURITY.md` draft still states the public vulnerability contact is not configured, routes security reports away from public issues, forbids fictional/personal/private/unmonitored contact placeholders, contains no email-shaped contact address, and keeps the public release checklist contact item unchecked.
- Updated `docs/release-audit/SECURITY_POLICY_CONTACT_CHECKER_20260727.md`, `docs/security/security-policy-contact-approval-checklist.md`, and `docs/public-release-checklist.md`.
- Focused verification before this audit note: `npm run security:policy-contact:check` passed.
- Verified after this update: `npm run check` passed 740 tests, documentation link check across 97 Markdown files, release safety scan across 152 files, security policy contact check, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories. Checklist integrity reported `malformed: []`, `checked: 181`, `unchecked: 18`.
- Release remains `FAIL`: this hardens security-contact pre-release guardrails only. Real monitored reporting path proof, responsible maintainer coverage, disclosure workflow, repository advisory settings, response SLA, escalation path, private-report sanitization process, remote CI security proof, final `SECURITY.md` update, second-operator review, public repository setup, and release approval remain incomplete.

## 2026-07-27 Calendar UI Accessibility Contract Update

- Added `src/web-app.test.ts` coverage for the standalone calendar app accessibility contract: app language and viewport metadata, named main/planning/calendar landmarks, labelled calendar view toggle group, polite status/live regions, labelled calendar grid, focusable grid slots, focusable draggable blocks, described write-back controls, and keyboard-reachable earlier/later block movement buttons.
- Updated `docs/release-audit/CALENDAR_UI_ACCESSIBILITY_CONTRACT_20260727.md`, `docs/security/production-calendar-ui-approval-checklist.md`, and `docs/public-release-checklist.md`.
- Focused verification before this audit note: `npm run build && node --test dist/web-app.test.js` passed 8 web-app tests.
- Verified after this update: `npm run check` passed 741 tests, documentation link check across 99 Markdown files, release safety scan across 154 files, security policy contact check, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories. Checklist integrity reported `malformed: []`, `checked: 182`, `unchecked: 18`.
- Release remains `FAIL`: this narrows local calendar UI accessibility regression coverage only. Production browser matrix, interactive conflict-preview workflow beyond local render/static hooks, manual accessibility pass, responsive polish review, visual regression baseline, product-owner visual approval, remote CI proof, rollback proof, final audits, and second-operator review remain incomplete.

## 2026-07-27 Calendar UI Responsive Contract Update

- Added `src/web-app.test.ts` coverage for the standalone calendar app responsive layout contract: desktop two-column workspace, scrollable main/calendar surface, wrapping toolbars/actions, wide week/day calendar minimums, tablet one-column fallback, tablet calendar minimum width, and mobile stacked header, form, auth, and session alignment rules.
- Updated `docs/release-audit/CALENDAR_UI_RESPONSIVE_CONTRACT_20260727.md`, `docs/security/production-calendar-ui-approval-checklist.md`, and `docs/public-release-checklist.md`.
- Focused verification before this audit note: `npm run build && node --test dist/web-app.test.js` passed 9 web-app tests.
- Verified after this update: `npm run check` passed 742 tests, documentation link check across 101 Markdown files, release safety scan across 156 files, security policy contact check, and license check. `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities. `find . -maxdepth 2 -name .git -type d -print` returned no `.git` directories. Checklist integrity reported `malformed: []`, `checked: 183`, `unchecked: 18`.
- Release remains `FAIL`: this narrows local calendar UI responsive regression coverage only. Production browser matrix, manual responsive screenshot review, interactive conflict-preview workflow, accessibility pass, visual regression baseline, product-owner visual approval, remote CI proof, rollback proof, final audits, and second-operator review remain incomplete.

## 2026-07-27 Provider Lifecycle Runbook Contract Update

- Added `docs/operations/provider-lifecycle-runbook-contract.md` defining required provider-specific runbook sections for setup, permissions/scopes, managed-secret custody, rotation, emergency revocation, write-back safety, sync checkpoint recovery, hosted alerts, incident response, rollback, privacy minimization, support escalation, and sanitized evidence examples.
- Added `scripts/check-provider-lifecycle-runbook-contract.mjs` and wired it into `npm run check` through `npm run providers:lifecycle-runbook-contract:check`.
- Updated `providers:lifecycle-readiness-packet` output and CLI tests so packets expose `requiredProviderRunbookSections` and require section verification before production enforcement.
- Added `docs/operations/providers/demo-calendar-provider-runbook.md` as a validated, fictional provider lifecycle runbook template covering setup, permissions/scopes, managed-secret custody, rotation, emergency revocation, write-back safety, sync checkpoint recovery, hosted alerts, incident response, rollback, privacy minimization, support escalation, and sanitized evidence examples.
- Updated provider lifecycle release checklist evidence while keeping the production provider lifecycle gate unchecked.
- Verified after this update: `npm run check` passed, `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities, `find . -maxdepth 2 -name .git -type d -print` returned no output, and checklist integrity returned `malformed: []`, `checked: 185`, `unchecked: 18`.
- Release remains `FAIL`: this narrows provider-specific runbook traceability only. Real provider-specific adapters, hosted operator alerts, managed-secret storage proof, provider-specific rotation/revocation/write-back runbooks, remote CI proof, final audits, and second-operator approval remain incomplete.

## 2026-07-27 Provider Adapter Contract Update

- Added `src/provider-adapter-contract.ts` and `src/provider-adapter-contract.test.ts` as a local provider-neutral adapter contract validator covering public contract use, private leadership-only API rejection, managed-secret custody, provider scopes, sync checkpoints, revocation, write-back safety, hosted alerts, and privacy-minimized evidence.
- Added `docs/integrations/provider-adapter-contract.md` documenting the adapter contract foundation and release boundary.
- Added `docs/release-audit/PROVIDER_ADAPTER_CONTRACT_20260727.md` and `docs/SESSION_TRANSFER_2026-07-27_PROVIDER_ADAPTER_CONTRACT.md`.
- Updated provider lifecycle checklist evidence while keeping the production provider lifecycle gate unchecked.
- Verified after this update: `npm run check` passed, `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities, `find . -maxdepth 2 -name .git -type d -print` returned no output, and checklist integrity returned `malformed: []`, `checked: 186`, `unchecked: 18`.
- Release remains `FAIL`: this narrows local provider adapter contract validation only. Real provider-specific adapters, hosted operator alerts, managed-secret storage proof, provider-specific rotation/revocation/write-back runbooks, remote CI proof, final audits, and second-operator approval remain incomplete.

## 2026-07-27 Provider Quota Policy Contract Update

- Added `src/provider-quota-policy.ts` and `src/provider-quota-policy.test.ts` as a local provider quota policy validator covering distributed store requirement, scoped quota keys, import/export/sync/webhook/write-back operation limits, retry-after guidance, separate enforcement lanes, hosted alert classes, and privacy-minimized quota evidence.
- Added `docs/security/provider-quota-policy-contract.md`, `docs/release-audit/PROVIDER_QUOTA_POLICY_CONTRACT_20260727.md`, and `docs/SESSION_TRANSFER_2026-07-27_PROVIDER_QUOTA_POLICY_CONTRACT.md`.
- Updated rate-limit release checklist evidence while keeping the production rate-limit and abuse-monitoring gate unchecked.
- Verified update: `npm run check` passed, `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities, `find . -maxdepth 2 -name .git -type d -print` returned no output, checklist integrity returned `malformed: []`, `checked: 187`, `unchecked: 18`.
- Release remains `FAIL`: this narrows local provider quota policy validation only. Production distributed rate limiting, provider-specific quota enforcement, hosted alert delivery, hosted dashboards, abuse analytics, remote CI proof, final audits, and second-operator approval remain incomplete.

## 2026-07-27 Hosted Abuse Analytics Contract Update

- Added `src/hosted-abuse-analytics-contract.ts` and `src/hosted-abuse-analytics-contract.test.ts` as a local hosted abuse analytics evidence validator covering hosted-only evidence, distributed correlation, scoped dimensions, request/import/provider/public-event/webhook/auth abuse signals, metrics, alerts, dashboards, routing, privacy minimization, retention, export approval, and deletion approval.
- Added `docs/security/hosted-abuse-analytics-contract.md`, `docs/release-audit/HOSTED_ABUSE_ANALYTICS_CONTRACT_20260727.md`, and `docs/SESSION_TRANSFER_2026-07-27_HOSTED_ABUSE_ANALYTICS_CONTRACT.md`.
- Updated rate-limit release checklist evidence while keeping the production rate-limit and abuse-monitoring gate unchecked.
- Verified update: focused `npm run build && node --test dist/hosted-abuse-analytics-contract.test.js` passed 5 tests; `npm run check` passed; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no output; checklist integrity returned `malformed: []`, `checked: 188`, `unchecked: 18`.
- Release remains `FAIL`: this narrows hosted abuse analytics evidence shape only. Real hosted monitoring, alert delivery, dashboards, distributed throttling, provider quota enforcement, remote CI proof, final audits, and second-operator approval remain incomplete.

## 2026-07-27 Hosted Public-Event Delivery Contract Update

- Added `src/hosted-public-event-delivery-contract.ts` and `src/hosted-public-event-delivery-contract.test.ts` as a local hosted public-event delivery evidence validator covering managed-secret custody, scoped secret refs, runtime identity, least-privilege worker topology, durable retry/dead-letter queues, idempotent delivery, replay protection, hosted observability, alert classes, incident drills, rollback, second-operator review, and privacy-minimized evidence.
- Added `docs/security/hosted-public-event-delivery-contract.md`, `docs/release-audit/HOSTED_PUBLIC_EVENT_DELIVERY_CONTRACT_20260727.md`, and `docs/SESSION_TRANSFER_2026-07-27_HOSTED_PUBLIC_EVENT_DELIVERY_CONTRACT.md`.
- Updated managed-secret hosted public-event worker release checklist evidence while keeping the production hosted-worker gate unchecked.
- Verified update: focused `npm run build && node --test dist/hosted-public-event-delivery-contract.test.js` passed 5 tests; `npm run check` passed; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no output; checklist integrity returned `malformed: []`, `checked: 189`, `unchecked: 18`.
- Release remains `FAIL`: this narrows hosted public-event delivery evidence shape only. Real managed secret storage, durable hosted workers, retry/dead-letter queue infrastructure, hosted observability, alert routing, incident response, remote CI proof, final audits, and second-operator approval remain incomplete.

## 2026-07-27 Production Auth Evidence Contract Update

- Added `src/production-auth-evidence-contract.ts` and `src/production-auth-evidence-contract.test.ts` as a local production auth evidence validator covering identity/recovery review, durable hashed session storage, authorization matrix scope boundaries, reset-token lifecycle, cookie/CSRF transport, lockout/retention review, startup guards, migration/rollback, remote CI, browser flows, final audits, and second-operator review.
- Added `docs/security/production-auth-evidence-contract.md`, `docs/release-audit/PRODUCTION_AUTH_EVIDENCE_CONTRACT_20260727.md`, and `docs/SESSION_TRANSFER_2026-07-27_PRODUCTION_AUTH_EVIDENCE_CONTRACT.md`.
- Updated production auth release checklist evidence while keeping the production persisted-auth gate unchecked.
- Verified update: focused `npm run build && node --test dist/production-auth-evidence-contract.test.js` passed 5 tests; `npm run check` passed; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no output; checklist integrity returned `malformed: []`, `checked: 190`, `unchecked: 18`.
- Release remains `FAIL`: this narrows production auth evidence shape only. Real production identity/recovery evidence, browser UX proof, remote CI, final audits, and second-operator approval remain incomplete.

## 2026-07-27 Production ICS Evidence Contract Update

- Added `src/production-ics-evidence-contract.ts` and `src/production-ics-evidence-contract.test.ts` as a local production ICS evidence validator covering provider fixture coverage, recurrence coverage, import/export workflow safety, sync-state idempotency, write-back safety, browser proof, remote CI, rollback, operator approvals, and final audits.
- Added `docs/security/production-ics-evidence-contract.md`, `docs/release-audit/PRODUCTION_ICS_EVIDENCE_CONTRACT_20260727.md`, and `docs/SESSION_TRANSFER_2026-07-27_PRODUCTION_ICS_EVIDENCE_CONTRACT.md`.
- Updated production ICS release checklist evidence while keeping the release-grade ICS workflow gate unchecked.
- Verified update: focused `npm run build && node --test dist/production-ics-evidence-contract.test.js` passed 5 tests; `npm run check` passed after final documentation updates; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no output; checklist integrity returned `malformed: []`, `checked: 191`, `unchecked: 18`.
- Full check coverage included docs link check over 124 Markdown files, release safety scan over 192 files, and license check over 18 package-lock licenses, 193 release text files, and 13 fixture/template/example-like files.
- Release remains `FAIL`: this narrows production ICS evidence shape only. Real provider fixture execution, production import/export workflow proof, sync-state idempotency proof, provider write-back proof, remote CI, final audits, rollback, and operator approval remain incomplete.

## 2026-07-27 Production Provider CSV Evidence Contract Update

- Added `src/production-provider-csv-evidence-contract.ts` and `src/production-provider-csv-evidence-contract.test.ts` as a local production provider CSV evidence validator covering provider fixture breadth, sanitized fixture handling, documented fictional fallbacks, download/upload workflow safety, provider-specific confirmation UX, quota governance, hosted abuse analytics, browser proof, privacy proof, rollback, final audits, operator approval, and second-operator review.
- Added `docs/security/production-provider-csv-evidence-contract.md`, `docs/release-audit/PRODUCTION_PROVIDER_CSV_EVIDENCE_CONTRACT_20260727.md`, and `docs/SESSION_TRANSFER_2026-07-27_PRODUCTION_PROVIDER_CSV_EVIDENCE_CONTRACT.md`.
- Updated production provider CSV release checklist evidence while keeping the production-grade provider CSV import workflow gate unchecked.
- Focused verification passed: `npm run build && node --test dist/production-provider-csv-evidence-contract.test.js` passed 5 tests.
- Verified update: `npm run check` passed after documentation updates; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no output; checklist integrity returned `malformed: []`, `checked: 192`, `unchecked: 18`.
- Full check coverage included docs link check over 127 Markdown files, release safety scan over 197 files, and license check over 18 package-lock licenses, 198 release text files, and 13 fixture/template/example-like files.
- Release remains `FAIL`: this narrows production provider CSV evidence shape only. Production download/upload polish, broader real-provider export fixture sets beyond fictional built-in samples, provider-specific import confirmation polish beyond local foundation, production provider quota governance, hosted abuse analytics, browser workflow proof, remote CI, rollback, final audits, and second-operator approval remain incomplete.

## 2026-07-27 Production Calendar UI Evidence Contract Update

- Added `src/production-calendar-ui-evidence-contract.ts` and `src/production-calendar-ui-evidence-contract.test.ts` as a local production calendar UI evidence validator covering release browser matrix, desktop/tablet/mobile viewport proof, release target versions, console-error review, conflict-preview and write-back scenarios, accessibility proof, responsive polish proof, visual regression states, product-owner approval, remote CI, rollback, final audits, and second-operator review.
- Added `docs/security/production-calendar-ui-evidence-contract.md`, `docs/release-audit/PRODUCTION_CALENDAR_UI_EVIDENCE_CONTRACT_20260727.md`, and `docs/SESSION_TRANSFER_2026-07-27_PRODUCTION_CALENDAR_UI_EVIDENCE_CONTRACT.md`.
- Updated production calendar UI release checklist evidence while keeping the production calendar UI hardening gate unchecked.
- Focused verification passed: `npm run build && node --test dist/production-calendar-ui-evidence-contract.test.js` passed 5 tests.
- Verified update: `npm run check` passed after documentation updates; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no output; checklist integrity returned `malformed: []`, `checked: 193`, `unchecked: 18`.
- Full check coverage included docs link check over 130 Markdown files, release safety scan over 202 files, and license check over 18 package-lock licenses, 203 release text files, and 13 fixture/template/example-like files.
- Release remains `FAIL`: this narrows production calendar UI evidence shape only. Real browser matrix evidence beyond local Chrome smoke, interactive conflict-preview workflow beyond local render smoke, accessibility pass, responsive polish, product-owner visual approval, second-operator review, remote CI, rollback, and final audits remain incomplete.

## 2026-07-27 Production Web App Evidence Contract Update

- Added `src/production-web-app-evidence-contract.ts` and `src/production-web-app-evidence-contract.test.ts` as a local production web app evidence validator covering deployment target review, production build artifact, release-candidate traceability, standalone/self-host independence, authenticated write flows, CSRF cookie transport, TLS/proxy/security headers, request/import throttles, durable storage, migration/backup/retention/health/startup/cache proof, browser matrix, accessibility, responsive polish, visual regression, operator review, remote CI, rollback, final audits, and second-operator review.
- Added `docs/security/production-web-app-evidence-contract.md`, `docs/release-audit/PRODUCTION_WEB_APP_EVIDENCE_CONTRACT_20260727.md`, and `docs/SESSION_TRANSFER_2026-07-27_PRODUCTION_WEB_APP_EVIDENCE_CONTRACT.md`.
- Updated standalone production web app release checklist evidence while keeping the standalone production web app gate unchecked.
- Focused verification passed: `npm run build && node --test dist/production-web-app-evidence-contract.test.js` passed 5 tests.
- Verified update: `npm run check` passed after documentation updates; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no output; checklist integrity returned `malformed: []`, `checked: 194`, `unchecked: 18`.
- Full check coverage included docs link check over 133 Markdown files, release safety scan over 207 files, and license check over 18 package-lock licenses, 208 release text files, and 13 fixture/template/example-like files.
- Release remains `FAIL`: this narrows production web app evidence shape only. Production build/deployment proof, authenticated write-flow proof, production browser matrix, accessibility audit, responsive polish, visual regression, operator review, second-operator review, remote CI, rollback proof, and final audits remain incomplete.

## 2026-07-27 Remote CI PostgreSQL Evidence Contract Update

- Added `src/remote-ci-postgresql-evidence-contract.ts` and `src/remote-ci-postgresql-evidence-contract.test.ts` as a local validator for the successful remote CI PostgreSQL proof gate.
- Added `docs/security/remote-ci-postgresql-evidence-contract.md`, `docs/release-audit/REMOTE_CI_POSTGRESQL_EVIDENCE_CONTRACT_20260727.md`, and `docs/SESSION_TRANSFER_2026-07-27_REMOTE_CI_POSTGRESQL_EVIDENCE_CONTRACT.md`.
- Updated `docs/security/remote-ci-postgresql-approval-checklist.md` and `docs/public-release-checklist.md` with the evidence-contract foundation while keeping the successful remote CI PostgreSQL proof gate unchecked.
- Focused verification passed: `npm run build && node --test dist/remote-ci-postgresql-evidence-contract.test.js` passed 5 tests.
- Verified update: `npm run check` passed after documentation updates; `npm test` passed 792 tests; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no output; checklist integrity returned `malformed: []`, `checked: 195`, `unchecked: 18`.
- Full check coverage included docs link check over 136 Markdown files, release safety scan over 212 files, and license check over 18 package-lock licenses, 213 release text files, and 13 fixture/template/example-like files.
- Release remains `FAIL`: this narrows remote CI PostgreSQL evidence shape only. Real public-repository workflow run, disposable PostgreSQL service proof, clean migration apply proof, live repository tests, tenant isolation proof, sanitized logs, retained artifacts, failure visibility, rerun/rollback procedure, final audits, and second-operator review remain incomplete.

## 2026-07-27 Final Dependency Audit Evidence Contract Update

- Added `src/final-dependency-audit-evidence-contract.ts` and `src/final-dependency-audit-evidence-contract.test.ts` as a local validator for the dependency audit final pass gate.
- Added `docs/security/final-dependency-audit-evidence-contract.md`, `docs/release-audit/FINAL_DEPENDENCY_AUDIT_EVIDENCE_CONTRACT_20260727.md`, and `docs/SESSION_TRANSFER_2026-07-27_FINAL_DEPENDENCY_AUDIT_EVIDENCE_CONTRACT.md`.
- Updated `docs/security/final-dependency-audit-approval-checklist.md` and `docs/public-release-checklist.md` with the evidence-contract foundation while keeping the dependency audit final pass gate unchecked.
- Focused verification passed: `npm run build && node --test dist/final-dependency-audit-evidence-contract.test.js` passed 5 tests.
- Verified update: `npm run check` passed after documentation updates; `npm test` passed 797 tests; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no output; checklist integrity returned `malformed: []`, `checked: 196`, `unchecked: 18`.
- Full check coverage included docs link check over 139 Markdown files, release safety scan over 217 files, and license check over 18 package-lock licenses, 218 release text files, and 13 fixture/template/example-like files.
- Release remains `FAIL`: this narrows final dependency audit evidence shape only. Real release-candidate production audit, frozen lockfile review, clean install proof, installed production tree review, runtime inventory, dev dependency boundary review, registry-secret absence review, remote CI proof, final audit alignment, and second-operator review remain incomplete.

## 2026-07-27 Final Security Audit Evidence Contract Update

- Added `src/final-security-audit-evidence-contract.ts` and `src/final-security-audit-evidence-contract.test.ts` as a local validator for the final security audit `PASS` gate.
- Added `docs/security/final-security-audit-evidence-contract.md`, `docs/release-audit/FINAL_SECURITY_AUDIT_EVIDENCE_CONTRACT_20260727.md`, and `docs/SESSION_TRANSFER_2026-07-27_FINAL_SECURITY_AUDIT_EVIDENCE_CONTRACT.md`.
- Updated `docs/security/final-security-audit-approval-checklist.md` and `docs/public-release-checklist.md` with the evidence-contract foundation while keeping the security audit `PASS` gate unchecked.
- Focused verification passed: `npm run build && node --test dist/final-security-audit-evidence-contract.test.js` passed 5 tests.
- Verified update: `npm run check` passed after documentation updates; `npm test` passed 802 tests; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no output; checklist integrity returned `malformed: []`, `checked: 197`, `unchecked: 18`.
- Full check coverage included docs link check over 142 Markdown files, release safety scan over 222 files, and license check over 18 package-lock licenses, 223 release text files, and 13 fixture/template/example-like files.
- Release remains `FAIL`: this narrows final security audit evidence shape only. Real dependency audit pass, secret/privacy scans, production auth approval, production abuse/provider-security proof, deployment security proof, remote CI/repository proof, security contact workflow, final source review, privacy/licensing alignment, and second-operator review remain incomplete.

## 2026-07-27 Final Privacy Audit Evidence Contract Update

- Added `src/final-privacy-audit-evidence-contract.ts` and `src/final-privacy-audit-evidence-contract.test.ts` as a local validator for the final privacy audit `PASS` gate.
- Added `docs/security/final-privacy-audit-evidence-contract.md`, `docs/release-audit/FINAL_PRIVACY_AUDIT_EVIDENCE_CONTRACT_20260727.md`, and `docs/SESSION_TRANSFER_2026-07-27_FINAL_PRIVACY_AUDIT_EVIDENCE_CONTRACT.md`.
- Updated `docs/security/final-privacy-audit-approval-checklist.md` and `docs/public-release-checklist.md` with the evidence-contract foundation while keeping the privacy audit `PASS` gate unchecked.
- Focused verification passed: `npm run build && node --test dist/final-privacy-audit-evidence-contract.test.js` passed 5 tests.
- Verified update: `npm run check` passed after documentation updates; `npm test` passed 807 tests; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no output; checklist integrity returned `malformed: []`, `checked: 198`, `unchecked: 18`.
- Full check coverage included docs link check over 145 Markdown files, release safety scan over 227 files, and license check over 18 package-lock licenses, 228 release text files, and 13 fixture/template/example-like files.
- Release remains `FAIL`: this narrows final privacy audit evidence shape only. Real final release-candidate privacy scans, generated artifact review, log/screenshot/export/backup/database review, provider identifier review, private compatible leadership system boundary proof, calendar/task minimization, AI redaction boundary, lifecycle review, clean public history, remote CI privacy proof, security/licensing alignment, repository settings, and second-operator review remain incomplete.

## 2026-07-27 Final Licensing Audit Evidence Contract Update

- Added `src/final-licensing-audit-evidence-contract.ts` and `src/final-licensing-audit-evidence-contract.test.ts` as a local final licensing audit evidence validator covering root Apache-2.0 consistency, dependency license proof, copied-source and documentation reuse scans, fixture/template/example review, asset/media/font/binary review, reused-material inventory, NOTICE/distribution proof, release-candidate freeze, dependency/security/privacy audit alignment, remote CI, clean public history, and second-operator review.
- Added `docs/security/final-licensing-audit-evidence-contract.md`, `docs/release-audit/FINAL_LICENSING_AUDIT_EVIDENCE_CONTRACT_20260727.md`, and `docs/SESSION_TRANSFER_2026-07-27_FINAL_LICENSING_AUDIT_EVIDENCE_CONTRACT.md`.
- Updated final licensing audit release checklist evidence while keeping the licensing audit `PASS` gate unchecked.
- Focused verification passed: `npm run build && node --test dist/final-licensing-audit-evidence-contract.test.js` passed 5 tests.
- Verified update: `npm run check` passed after documentation updates; `npm test` passed 812 tests; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no output; checklist integrity returned `malformed: []`, `checked: 199`, `unchecked: 18`.
- Full check coverage included docs link check over 148 Markdown files, release safety scan over 232 files, and license check over 18 package-lock licenses, 233 release text files, and 13 fixture/template/example-like files.
- Release remains `FAIL`: this narrows final licensing audit evidence shape only. Real final release-candidate license checks, reused-material inventory approval, NOTICE review, final release-candidate freeze, remote CI proof, clean public history, public repository setup, package publication review, and second-operator approval remain incomplete.

## 2026-07-27 Public Release Smoke Loop Update

- Added a local fictional API smoke loop in `src/api.test.ts` covering standalone working hours, fixed commitments, manual tasks, OwnerOps task import, ConnectOS private calendar import, plan creation, unscheduled work, capacity evidence, deadline-risk evidence, accept, lock, replan after new meeting, locked-block preservation, completion, second replan, and ICS plan export.
- Added `docs/release-audit/PUBLIC_RELEASE_SMOKE_LOOP_20260727.md` and `docs/SESSION_TRANSFER_2026-07-27_PUBLIC_RELEASE_SMOKE_LOOP.md`.
- Updated `docs/public-release-checklist.md` with a checked local smoke foundation while keeping all production release gates unchecked.
- Focused verification passed: `npm run build && node --test dist/api.test.js` passed 182 API tests.
- Verified update: `npm run check` passed after documentation updates; `npm test` passed 813 tests; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no output; checklist integrity returned `malformed: []`, `checked: 200`, `unchecked: 18`.
- Full check coverage included docs link check over 150 Markdown files, release safety scan over 234 files, and license check over 18 package-lock licenses, 235 release text files, and 13 fixture/template/example-like files.
- Release remains `FAIL`: this narrows local release-candidate smoke proof only. Real production browser matrix, production provider proof, hosted operations, remote CI, final audits, clean public history, repository setup, owner approval, and second-operator approval remain incomplete.

## 2026-07-27 Persona Validation Foundation Update

- Added `src/persona-validation.test.ts` with fictional local product persona validation for basic solo user, busy owner, pastor/creative leader, small-team manager, calendar-heavy professional, local-first user, ConnectOS user, and compatible leadership system user.
- Added `docs/product/persona-validation.md`, `docs/release-audit/PERSONA_VALIDATION_FOUNDATION_20260727.md`, and `docs/SESSION_TRANSFER_2026-07-27_PERSONA_VALIDATION_FOUNDATION.md`.
- Updated `docs/public-release-checklist.md` with a checked local persona validation foundation while keeping all production release gates unchecked.
- Focused verification passed: `npm run build && node --test dist/persona-validation.test.js` passed 8 persona validation tests.
- Verified update: `npm run check` passed after documentation updates; `npm test` passed 821 tests; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no output; checklist integrity returned `malformed: []`, `checked: 201`, `unchecked: 18`.
- Full check coverage included docs link check over 153 Markdown files, release safety scan over 238 files, and license check over 18 package-lock licenses, 239 release text files, and 13 fixture/template/example-like files.
- Release remains `FAIL`: this narrows local persona proof only. Real production browser matrix, real provider proof, hosted operations, remote CI, final security/privacy/licensing approvals, clean public history, repository setup, owner approval, and second-operator approval remain incomplete.

## 2026-07-27 Fictional Demo Workspace Foundation Update

- Added `examples/fictional-demo-workspace.json` as a fictional local demo workspace covering fixed meetings, flexible deep work, habit-shaped work, deadline-bound tasks, splittable tasks, dependencies, overload, replanning, OwnerOps task shape, ConnectOS private calendar shape, and compatible leadership system public guidance shape.
- Added `src/demo-workspace-example.test.ts` to validate the fixture and prove deterministic planning, split blocks, no overlapping proposed work, honest overload evidence, grounded unscheduled explanations, and locked-block preservation during replanning.
- Fixed scheduler busy-block ordering in `src/scheduler.ts` so previously proposed work blocks are sorted with fixed busy events before subsequent slot search, preventing double-booking when fixed events sort later than proposed blocks.
- Added direct no-double-booking regression coverage in `src/scheduler.test.ts`.
- Added `docs/product/examples-and-demo-data.md`, `docs/release-audit/FICTIONAL_DEMO_WORKSPACE_FOUNDATION_20260727.md`, and `docs/SESSION_TRANSFER_2026-07-27_FICTIONAL_DEMO_WORKSPACE_FOUNDATION.md`.
- Focused verification passed: `npm run build && node --test dist/scheduler.test.js dist/demo-workspace-example.test.js` passed 15 tests.
- Verified update: `npm run check` passed after documentation updates; `npm test` passed 824 tests; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no output; checklist integrity returned `malformed: []`, `checked: 202`, `unchecked: 18`.
- Full check coverage included docs link check over 156 Markdown files, release safety scan over 243 files, and license check over 18 package-lock licenses, 244 release text files, and 16 fixture/template/example-like files.
- Release remains `FAIL`: this narrows local fictional demo-data and scheduler regression proof only. Real production provider fixtures, production browser proof, hosted operations, remote CI, final audits, clean public history, repository setup, owner approval, and second-operator approval remain incomplete.

## 2026-07-27 Final Dependency Runtime Inventory Foundation Update

- Added `docs/security/final-dependency-runtime-inventory.md` to record the current direct production dependency, production lockfile package table, development dependency boundary, override review, registry review, verification command, and release boundary.
- Added `scripts/check-dependency-runtime-inventory.mjs` and wired `npm run dependency:runtime-inventory:check` into `npm run check` so the runtime inventory is compared against `package.json` and `package-lock.json`.
- Added `docs/release-audit/FINAL_DEPENDENCY_RUNTIME_INVENTORY_20260727.md` and linked the inventory foundation in `docs/public-release-checklist.md` while keeping the real dependency audit final pass unchecked.
- Focused verification passed: `npm run dependency:runtime-inventory:check` passed for 14 production package(s).
- Verified update: `npm run check` passed after documentation updates; `npm test` passed 824 tests; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no output; checklist integrity returned `malformed: []`, `checked: 203`, `unchecked: 18`.
- Full check coverage included docs link check over 158 Markdown files, release safety scan over 246 files, and license check over 18 package-lock licenses, 247 release text files, and 16 fixture/template/example-like files.
- Release remains `FAIL`: this narrows local dependency runtime inventory evidence only. Final dependency audit remains incomplete until current release-candidate production audit output, installed tree evidence, clean-install proof, runtime inventory approval, dev dependency exclusion approval, override and registry review approval, license alignment, remote CI proof, final security/privacy/licensing alignment, and second-operator review are complete.

## 2026-07-27 Release Blocker Guard Foundation Update

- Added `scripts/check-release-blockers.mjs` to verify `docs/public-release-checklist.md` keeps release status `FAIL` and keeps the 18 known production/release blockers unchecked.
- Wired `npm run release:blockers:check` into `npm run check`.
- Added `docs/release-audit/RELEASE_BLOCKER_GUARD_20260727.md` and linked the guard foundation in `docs/public-release-checklist.md` without approving any real production/release blocker.
- Focused verification passed: `npm run release:blockers:check` passed for 18 unchecked blocker(s).
- Verified update: `npm run check` passed after documentation updates; `npm test` passed 824 tests; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no output; checklist integrity returned `malformed: []`, `checked: 204`, `unchecked: 18`.
- Full check coverage included docs link check over 159 Markdown files, release safety scan over 248 files, and license check over 18 package-lock licenses, 249 release text files, and 16 fixture/template/example-like files.
- Release remains `FAIL`: this narrows release-safety enforcement only. Production UI, release-grade ICS, provider CSV, hosted workers, provider lifecycle, distributed rate limiting, production auth, remote CI, hosted retention approvals, final audits, clean public history, security contact, and public repository creation remain incomplete.

## 2026-07-27 First-Commit Staging Manifest Guard Foundation Update

- Added `scripts/check-first-commit-staging-manifest.mjs` to verify the draft first public commit manifest covers current release-candidate top-level entries, required include/exclude rules, `.gitignore` exclusions, no-`.git` boundary, and keeps clean public history unchecked.
- Wired `npm run release:first-commit-manifest:check` into `npm run check`.
- Updated `docs/release/first-commit-staging-manifest.md` to include `examples/` as a public first-commit candidate because the current release tree includes fictional demo examples.
- Added `docs/release-audit/FIRST_COMMIT_STAGING_MANIFEST_GUARD_20260727.md` and linked the guard foundation in `docs/public-release-checklist.md` without preparing clean public history.
- Focused verification passed: `npm run release:first-commit-manifest:check`.
- Verified update: `npm run check` passed after documentation updates; `npm test` passed 824 tests; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no output; checklist integrity returned `malformed: []`, `checked: 205`, `unchecked: 18`.
- Full check coverage included docs link check over 160 Markdown files, release safety scan over 250 files, and license check over 18 package-lock licenses, 251 release text files, and 16 fixture/template/example-like files.
- Release remains `FAIL`: this narrows clean-history support only. Clean public history remains incomplete until every release gate passes on the same final candidate, staging manifest and generated artifacts are reviewed, naming and remote CI plans are accepted, second-operator approval is recorded, and git is intentionally initialized from the approved source tree.

## 2026-07-27 Final Audit Status Guard Foundation Update

- Added `scripts/check-final-audit-status.mjs` to verify final dependency, security, privacy, and licensing audit approval checklists remain `FAIL` and keep release-rule boundaries.
- Wired `npm run final-audit:status:check` into `npm run check`.
- Added `docs/release-audit/FINAL_AUDIT_STATUS_GUARD_20260727.md` and linked the guard foundation in `docs/public-release-checklist.md` while keeping dependency, security, privacy, and licensing final audit gates unchecked.
- Focused verification passed: `npm run final-audit:status:check` passed for 4 final audit gate(s).
- Verified update: `npm run check` passed after documentation updates; `npm test` passed 824 tests; `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities; `find . -maxdepth 2 -name .git -type d -print` returned no output; checklist integrity returned `malformed: []`, `checked: 206`, `unchecked: 18`.
- Full check coverage included docs link check over 161 Markdown files, release safety scan over 252 files, and license check over 18 package-lock licenses, 253 release text files, and 16 fixture/template/example-like files.
- Release remains `FAIL`: this narrows final-audit status safety only. Final dependency, security, privacy, and licensing audits remain incomplete until their current release-candidate evidence, remote CI proof, clean history alignment, and second-operator approvals are complete.
