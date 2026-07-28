# Public Release Security Audit

## Status

Current result: `FAIL`.

## Date

2026-07-23

## Current Conclusion

ScheduleOS has meaningful local security foundations and repeatable local safety checks, but it is not ready for public release. The current tree passes local build, tests, documentation links, release safety scanning, license scanning, and high-severity production dependency audit when the required gates are run. The public release security gate remains `FAIL` because production-grade auth/session hardening, provider token lifecycle design, hosted abuse monitoring, production deployment review, final release-candidate review, and public remote CI proof are still incomplete.

No public repository, tag, push, package publication, or hosted release is allowed until this audit changes to `PASS`.

## Current Local Evidence

- `npm run check` now runs TypeScript build, Node test suite, documentation link check, release safety scan, and license check.
- `npm audit --omit=dev --audit-level=high` has passed locally with 0 high-severity production dependency vulnerabilities in recent release-gate runs.
- `find . -maxdepth 2 -name .git -type d -print` has returned no `.git` directories in recent release-gate runs, matching the clean-history preparation constraint for this standalone workspace.
- `npm run release:safety` scans project-owned release files for common token/key patterns, private key blocks, OAuth token assignments, email addresses, local absolute paths, private URLs, and generated-output risks.
- Root `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`, `.env.example`, `.gitignore`, and `docs/public-release-checklist.md` exist.
- `.env.example` uses fictional local-development values only, and `.gitignore` ignores real `.env` files while allowing `.env.example`.
- Local API/app responses include tested baseline security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and app-shell `Content-Security-Policy`.
- Local API session-cookie transport foundation exists behind explicit configuration: `HttpOnly`, `SameSite=Lax`, `Path=/`, configurable `Secure`, CSRF-token enforcement on cookie-authenticated write requests, and production startup rejection when cookie auth is enabled without secure-cookie configuration.
- Local/self-host startup rejects `NODE_ENV=production` static API-key auth when `.env.example` defaults or demo tenant/workspace/user IDs are used.
- Static API-key tenant/workspace/user scope checks, read/write role checks, local persisted bearer session issuance/revocation, and owner/admin membership management exist as local API foundations.
- Persisted authenticated request throttling, scoped import-row throttle windows, per-source import limits, and content-minimized throttle-denial audit events exist as local abuse-prevention foundations.
- Repository-readiness docs record clean-history strategy and block public release until remote CI and final gates pass.
- Licensing audit foundation exists in `docs/security/licensing-audit.md`; licensing remains `FAIL` until final release-candidate repeat review.

## Required Before PASS

The security audit may change to `PASS` only after all items below are proven against the actual release candidate:

- Final `npm run check` passes after release-candidate freeze.
- Final `npm audit --omit=dev --audit-level=high` passes after release-candidate freeze.
- Final release safety scan passes across all project-owned release files, docs, fixtures, samples, generated outputs, root config, GitHub templates, scripts, migrations, and build outputs intended for release.
- Git-history or clean-history strategy is implemented and verified for the public repository.
- Remote CI passes on the public repository or a release-equivalent remote before publication.
- Production authentication, session, role, membership, password reset, recovery, and revocation behavior are reviewed as release-grade, not only local foundation behavior.
- Provider OAuth/token storage, encryption, rotation, revocation, webhook signature verification, replay protection, and provider-specific token lifecycle runbooks are implemented or explicitly excluded from the release surface.
- Production distributed rate limiting, provider quota governance, hosted abuse monitoring, and operator alerting are implemented or explicitly excluded from the release surface.
- Production deployment TLS/proxy/header behavior is reviewed for the target deployment path.
- Security policy contact or GitHub private vulnerability reporting path is configured.
- Privacy review confirms all fixtures, sample calendars, sample tasks, screenshots, logs, docs, database files, source maps, and generated files are fictional or sanitized.
- Licensing audit status changes from `FAIL` to `PASS`.

## Required Search Surface

Final review must inspect:

- Working tree and dotfiles.
- Generated files and build output.
- Git history, commit messages, authors, committers, branches, tags, and stashes where applicable.
- Documentation, tests, scripts, migrations, source maps, config, CI files, samples, fixtures, screenshots, logs, and database files.
- Sample calendars, ICS files, JSON exports, CSV templates, provider examples, and API examples.

Final review must search for:

- Real names from private repositories, real client names, real church names, personal email addresses, phone numbers, addresses, local usernames, local paths, machine names, private domains, real calendar titles, meeting participants, real task names, real Slack workspace IDs, Google Calendar IDs, Microsoft tenant IDs, private repository URLs, internal compatible leadership system prompts, customer metrics, and private business data.
- Google, Microsoft, Slack, GitHub, OpenAI, Anthropic, Gemini, AWS, SMTP, database, JWT, cookie, webhook, bearer-token, encryption-key, private-key, and PEM secrets.

## Final Security Audit Readiness Packet

`security:final-audit-readiness-packet` emits review-only final security audit evidence requirements for dependency audit, secret scan, privacy/private-data scan, production auth/session, roles/memberships, reset-token lifecycle, production rate-limit and abuse monitoring, provider managed-secret lifecycle, production deployment TLS/proxy/header behavior, remote CI, security policy contact, final source review, and second-operator review. It does not mark this audit `PASS`, approve production deployment, configure security contacts, mutate release gates, create remotes, publish packages, or announce ScheduleOS.

## Current Remaining Risk

High. Current ScheduleOS is a strong local foundation, not a public release candidate. The security gate remains `FAIL` until the release candidate proves clean through final local gates, clean-history/remote-CI review, production auth/storage/provider lifecycle review, abuse-monitoring review, privacy review, licensing review, and security contact configuration.
