# Clean Public History Approval Checklist

## Status

Current result: `FAIL`. ScheduleOS has a no-`.git` release strategy, repository readiness documentation, a first-commit staging manifest, and a review-only clean public history readiness packet. Clean public history is not prepared until the evidence below is attached, reviewed, and accepted.

No git initialization, public repository creation, remote creation, push, tag, package publication, hosted deployment, or release announcement may rely on clean public history until this checklist changes to `PASS`.

## Verified Local Foundations

Current local evidence covers:

- ScheduleOS intentionally has no `.git` directory before final public-history preparation.
- `docs/release/repository-readiness.md` records the preferred `scheduleos-ai/scheduleos` target and blocks public repository creation until release gates pass.
- `docs/release/first-commit-staging-manifest.md` records draft include/exclude rules for a future clean initial public commit.
- `npm run release:first-commit-manifest:check` verifies the draft manifest covers the current release-candidate top-level tree, required include/exclude rules, `.gitignore` exclusions, and the no-`.git` boundary while keeping clean public history unchecked.
- `.gitignore` excludes generated, local, private, runtime, credential, database, backup, log, coverage, and build-output paths.
- Local release safety source scan, local secret scan, local personal/private data scan, docs link check, and license check foundations run through `npm run check`.
- Generated artifact review packet foundation exists for review-only dist, fixtures/templates/samples, screenshots/exports/backups/logs, local path/private URL, provider identifier minimization, license/NOTICE triggers, staging alignment, local evidence command, and second-operator evidence.
- Repository clean-history readiness packet foundation emits review-only evidence without initializing git, creating repositories, adding remotes, pushing, tagging, mutating package files, publishing packages, or announcing ScheduleOS.

These foundations do not prepare clean public history, initialize git, stage files, create a first commit, create a public repository, add a remote, push, tag, publish, configure repository settings, approve CI, or approve release.

## Required Evidence Before PASS

Attach current evidence for every item:

- No-`.git` directory proof for the final release-candidate source tree before GitHub templates, package metadata, scripts, and generated artifacts are included in a public source tree.
- First-commit staging manifest review proof confirming intended included and excluded paths before any git initialization.
- Generated artifact review proof confirming generated outputs, screenshots, exports, backups, logs, source maps, coverage, and bundled assets are excluded or sanitized.
- Fixture sample-data sanitization proof confirming no real customer data, task data, calendar data, provider exports, tokens, credentials, private compatible leadership system prompts, private owner data, local machine paths, or private URLs.
- License NOTICE readiness proof confirming license check, reused-material inventory, NOTICE requirement review, root license consistency, and final licensing audit alignment.
- Repository naming proof confirming the preferred `scheduleos-ai/scheduleos` target remains acceptable or an approved naming decision exists.
- Remote CI plan proof confirming workflow requirements, required checks, artifact retention, log sanitization, rerun, and rollback expectations before public repository creation.
- Security, privacy, licensing, dependency, functionality, storage, documentation, and final release-gate evidence remain aligned to the same release candidate.
- Second operator approves clean public history evidence packet before git initialization and first public commit.

## Required Commands

Run before changing checklist to `PASS`:

```bash
npm run check
npm audit --omit=dev --audit-level=high
npm ls --omit=dev --all
npm run license:check
npm run release:safety
find . -maxdepth 2 -name .git -type d -print
```

The no-`.git` check must return no output until intentional clean public repository history is prepared.

## Review-Only Packet

Use this command to prepare evidence labels only:

```bash
npm run repository:clean-history-readiness-packet -- --environment release-demo --history-scope public-initial-history-demo --source-root scheduleos-local-tree-demo --no-git-directory no-git-directory-proof-demo --release-safety-scan release-safety-scan-demo --first-commit-staging-manifest first-commit-staging-manifest-demo --generated-artifact-review generated-artifact-review-demo --fixture-sanitization fixture-sanitization-demo --license-notice-readiness license-notice-readiness-demo --repository-naming repository-naming-demo --remote-ci-plan remote-ci-plan-demo --second-operator second-operator-clean-history-review-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --json
```

This packet does not initialize git, create repositories, add remotes, push commits, tag releases, mutate package files, mark clean history prepared, publish packages, or announce ScheduleOS.

## Current Remaining Risk

High. The local no-`.git` strategy, staging manifest, and manifest guard are useful foundations, but clean public history remains unproven until all release gates pass on the same final candidate, the staging manifest is reviewed, generated artifacts and fixtures are approved, naming and remote CI plans are accepted, second-operator approval is recorded, and git is intentionally initialized from the approved source tree.

## Release Rule

Do not mark "Clean public history prepared" complete until this checklist changes from `FAIL` to `PASS` with current release-candidate evidence and no public repository mutation has occurred prematurely.
