# Request Abuse Summary Foundation - 2026-07-27

## Status

Local/self-host evidence only. Release remains `FAIL`.

## Scope

Added a content-minimized local request-abuse summary for persisted authenticated request throttles.

## Evidence Added

The local API now exposes:

```text
GET /api/request-abuse/summary
```

The endpoint reports scoped request-throttle windows without exposing raw bearer tokens, session cookies, client IP addresses, request paths, request bodies, task titles, calendar titles, or provider identifiers.

The summary includes:

- Tenant, workspace, and user scope.
- Optional `since`, `until`, and `asOf` filters.
- Active persisted request-throttle windows.
- Saturated windows where `count >= limit`.
- Request count across summarized windows.
- Maximum retry-after timing for saturated windows.
- Hashed key fingerprints, truncated to `sha256:<12 hex chars>`.
- Local `REVIEW_REQUIRED` status when persisted throttling is configured and any saturated window exists.

## Tests Added

- `src/api.test.ts`: verifies `GET /api/request-abuse/summary` reports saturated persisted request-throttle windows, blocks cross-scope reads, and does not leak raw demo tokens.
- `src/repositories.test.ts`: verifies scoped in-memory request-throttle listing and cross-scope denial.
- `src/postgres-repositories.test.ts`: verifies scoped PostgreSQL request-throttle listing and cross-scope denial.

## Storage Coverage

The request-throttle repository now supports scoped listing for:

- In-memory/local store.
- SQLite store.
- PostgreSQL adapter.

## Verification

`npm run check` passed after adding the foundation.

Observed result:

- 739 tests passed.
- GitHub Actions CI workflow validation passed.
- Documentation link check passed 91 Markdown files.
- Release safety scan passed 145 files.
- License check passed 18 package-lock licenses, 146 release text files, and 13 fixture/template/example-like files.

## Boundary

This does not approve production distributed rate limiting or hosted abuse analytics.

Still required before the rate-limit and abuse-monitoring gate can pass:

- Edge/gateway rate-limit policy proof.
- Distributed throttle store proof.
- Trusted proxy deployment proof.
- Provider quota governance.
- Hosted alert routing.
- Hosted dashboards.
- Abuse analytics across imports, invalid signatures, replay attempts, failed deliveries, oversized requests, credential attempts, reset-token requests, and cross-scope attempts.
- Remote CI proof.
- Rollback proof.
- Final security, privacy, licensing, and dependency approvals.
- Second-operator approval.
