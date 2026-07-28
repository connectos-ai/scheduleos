# Public Release Security Audit Addendum

Date: 2026-07-21

## Purpose

This addendum updates security audit release-readiness documentation added after
the initial audit. It does not change the audit result.

Current result: `FAIL`.

## New Evidence

- Root `SECURITY.md` now exists with pre-release reporting safety expectations.
- Root `CONTRIBUTING.md` now documents fictional-data public-interface rules.
- Root `CODE_OF_CONDUCT.md` now exists.
- Root `CHANGELOG.md` now exists.
- Root `.env.example` now exists and contains fictional local-development
  values only.
- `.gitignore` now ignores real `.env` files while explicitly allowing
  `.env.example`.
- `docs/public-release-checklist.md` now keeps publication blocked until all
  gates pass.
- `docs/security/licensing-audit.md` now exists and records initial installed
  dependency metadata review.
- Local API/app responses now include tested baseline security-header
  foundation: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  and app-shell `Content-Security-Policy`.
- Local JSON, app-shell HTML, and CSV export responses now include tested `Cache-Control: no-store, max-age=0` foundation to avoid retaining app, scoped API, or export responses across auth/session/deployment changes.
- Local API session-cookie transport foundation now exists behind explicit
  configuration: `HttpOnly`, `SameSite=Lax`, `Path=/`, configurable `Secure`,
  CSRF-token enforcement on cookie-authenticated write requests, and production
  startup rejection when cookie auth is enabled without
  `SCHEDULEOS_AUTH_SESSION_COOKIE_SECURE=true`.
- Local/self-host startup now rejects `NODE_ENV=production` when static API-key
  auth uses the `.env.example` default
  `SCHEDULEOS_API_KEY=dev_scheduleos_change_me`.
- Local/self-host startup now rejects `NODE_ENV=production` static API-key
auth when tenant/workspace/user scope IDs are omitted or left as demo values.
- Local/self-host startup now rejects `NODE_ENV=production` with public bind
  hosts such as `0.0.0.0` or `::` unless static API-key or session-cookie auth
  is configured.
- Local/self-host startup now rejects `NODE_ENV=production` with public bind
  hosts such as `0.0.0.0` or `::` unless request throttling is configured.
- Local/self-host startup now rejects `NODE_ENV=production` with public bind
hosts such as `0.0.0.0` or `::` unless request throttling is persisted with
`SCHEDULEOS_RATE_LIMIT_PERSISTED=true`.
- Local/self-host startup now rejects `NODE_ENV=production` with public bind
  hosts such as `0.0.0.0` or `::` unless durable storage is configured with
  `SCHEDULEOS_STORAGE_PATH`.
- Local/self-host startup now rejects `NODE_ENV=production` when raw
  password-reset token return is enabled through
  `SCHEDULEOS_AUTH_PASSWORD_RESET_RETURN_TOKEN=true`.

## Remaining Security And Privacy Blockers

- No release-candidate source scan.
- No final secret scan.
- No final personal/private data scan.
- No generated-file review.
- No fixture/sample-data review.
- No git-history audit clean-history strategy.
- No production persisted auth, session, role, or membership model. Local static
  API-key scope/read-write checks, local API persisted bearer session
  issuance/revocation, and owner/admin membership management exist only as
  foundations.
- No production OAuth/provider token storage model.
- No production abuse/rate-limit strategy.
- No production deployment TLS/proxy/header review.
- No final release-candidate dependency vulnerability audit. Local high-severity production dependency audit evidence now exists, but it must be repeated after release-candidate freeze.

## 2026-07-22 Release Safety Scan Evidence

- `npm run release:safety` now performs dependency-free local scanning for local
  absolute paths, common token/key patterns, private key blocks, OAuth token
  assignments, and email addresses across project-owned files.
- `npm run check` now includes release safety scanning after build, tests, and
  documentation link checks.
- Stale absolute local paths in public-facing audit research docs were replaced
  with public-safe workspace labels.
- Local release safety scan passed 80 files.
- This dated section supersedes earlier "No final secret scan", "No final
  personal/private data scan", "No generated-file review", and "No
  fixture/sample-data review" blockers for the current local source tree.
- Security gate remains `FAIL` until git-history or clean-history strategy,
  production auth/storage hardening, provider token design, production proxy/TLS
  header review, licensing, and remote CI gates are complete.

## 2026-07-23 Canonical Security Audit Evidence Refresh

- `docs/security/public-release-security-audit.md` now records current local security evidence instead of stale "not run" wording.
- Local `npm audit --omit=dev --audit-level=high` evidence exists from recent required gate runs with 0 vulnerabilities, but final release-candidate dependency audit remains required.
- Security gate remains `FAIL` until final release-candidate gates, clean-history/public remote CI proof, production auth/session hardening, provider token lifecycle, hosted abuse monitoring, production deployment review, privacy review, licensing audit `PASS`, and security contact configuration are complete.

## Release Rule

No public release is allowed until the canonical security audit passes or this
addendum's blockers are resolved or moved to documented non-release roadmap
items.
