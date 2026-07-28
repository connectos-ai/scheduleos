# Public Remote CI Approval Checklist

## Status

Current result: `FAIL`.

ScheduleOS has local gate parity and a review-only public remote CI readiness packet. Public remote CI is not verified until the evidence below is attached, reviewed, and accepted from the intended public repository.

No public release, tag, package publication, hosted deployment, or release announcement may rely on public remote CI until this checklist changes to `PASS`.

## Verified Local Foundations

Current local evidence covers:

- Local `npm run check` runs build, tests, documentation links, release safety, and license checks.
- Local production dependency audit can be run with `npm audit --omit=dev --audit-level=high`.
- `.github/workflows/ci.yml` defines a future public GitHub Actions workflow with manual dispatch, pull-request and main-branch triggers, read-only contents permission, concurrency cancellation, timeout-bounded quality and PostgreSQL jobs, production dependency audit, production dependency tree evidence, and step-summary review notes.
- `npm run ci:workflow` validates the future public workflow locally and is included in `npm run check`, so workflow evidence hooks and release-mutation guardrails cannot drift silently before public CI exists.
- Local no-`.git` strategy remains in place until clean public history is intentionally prepared.
- Public remote CI readiness packet foundation requires explicit workflow run, local gate, production dependency audit, no-`.git` proof, release safety, docs link check, license check, log sanitization, artifact retention, branch-protection review, repository settings readiness, and second-operator labels.
- Remote CI PostgreSQL readiness packet foundation exists separately for live PostgreSQL service proof.
- Repository readiness docs record that no public repository, remote, push, tag, publication, or announcement is allowed until all gates pass.

These foundations do not create a public repository, initialize git, add a remote, dispatch workflows, store CI secrets, configure branch protection, configure repository settings, approve remote CI, or approve release.

## Required Evidence Before PASS

Attach current evidence for every item:

- Public repository identity proof confirming CI ran against the approved target repository and release-candidate commit.
- Public workflow run proof from the intended CI provider.
- Required check-run proof showing the full release gate equivalent to `npm run check` passed remotely.
- Production dependency audit proof showing high-severity production dependency audit passed remotely.
- No-`.git` directory proof from the local release candidate before intentional public-history creation, plus clean public history proof after the approved initial commit exists.
- Release safety scan proof from remote CI logs or artifacts.
- Documentation link check proof from remote CI logs or artifacts.
- License check proof from remote CI logs or artifacts.
- PostgreSQL remote CI proof accepted where required by release gates.
- Log sanitization proof confirming CI logs contain no secrets, private URLs, provider tokens, database URLs, private machine paths, real customer data, or private compatible leadership system material.
- Artifact retention proof confirming retained logs and artifacts are sufficient for review but do not expose private data or secrets.
- Branch protection or required-checks review proof confirming the remote workflow gates the protected release branch as intended.
- Repository settings readiness proof confirming security advisories, secret scanning, dependency alerts, maintainer access, issue settings, release/package permissions, and metadata have been reviewed before relying on CI.
- Failure visibility and rerun/rollback proof confirming failed CI runs are visible, actionable, and rerunnable without force-push or hidden state.
- Security, privacy, licensing, dependency, clean-history, repository-settings, functionality, storage, documentation, and final release-gate evidence remain aligned with the same release candidate.
- Second operator approves public remote CI evidence packet.

## Required Commands

Run before changing checklist `PASS`:

```bash
npm run check
npm audit --omit=dev --audit-level=high
npm run release:safety
npm run license:check
find . -maxdepth 2 -name .git -type d -print
```

The no-`.git` check must return no output until intentional clean public repository history is prepared.

## Review-Only Packet

Use this command to prepare evidence labels only:

```bash
npm run remote-ci:public-readiness-packet -- --environment release-demo --ci-provider github-actions-demo --workflow-suite release-gates-workflow-demo --target-repository scheduleos-ai/scheduleos --workflow-run public-workflow-run-demo --check-run npm-check-run-demo --production-dependency-audit production-dependency-audit-demo --no-git-directory no-git-directory-proof-demo --release-safety-scan release-safety-scan-demo --docs-link-check docs-link-check-demo --license-check license-check-demo --log-sanitization log-sanitization-demo --artifact-retention artifact-retention-demo --branch-protection-review branch-protection-review-demo --repository-settings-readiness repository-settings-readiness-demo --second-operator second-operator-remote-ci-review-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --json
```

This packet does not create repositories, initialize git, add remotes, dispatch workflows, store CI secrets, mutate branch protection, mark public remote CI verified, change release gates, push, tag, publish, or announce ScheduleOS.

## Current Remaining Risk

High. Local checks are strong, but public remote CI remains unproven until a real remote workflow run passes on the approved release candidate after clean public history and repository settings are ready, CI logs and artifacts are reviewed, PostgreSQL remote proof is accepted where required, and second-operator approval is recorded.

## Release Rule

Do not mark "CI run verified on public remote" complete until this checklist changes from `FAIL` to `PASS` with current public-repository evidence and no premature repository mutation has occurred.
