# Troubleshooting

## Install Fails

Check Node.js and npm versions first.

```bash
node --version
npm --version
```

Use Node.js 20 or newer.

## Build Fails

Run:

```bash
npm run build
```

Fix TypeScript errors before running broader checks.

## Tests Fail

Run:

```bash
npm test
```

The local test suite runs from `dist`, so build first if the compiled output is stale:

```bash
npm run build
npm test
```

## PostgreSQL Docker Test Cannot Connect

`npm run test:postgres:docker` requires Docker to be running locally. If Docker is stopped, start Docker and rerun:

```bash
npm run test:postgres:docker
```

Clean up the test database container and volume:

```bash
npm run postgres:test:down
```

## Live PostgreSQL Test Skips

`npm run test:postgres:live` skips when `SCHEDULEOS_TEST_POSTGRES_URL` is not set. This is expected for local environments without PostgreSQL.

The test database name must include `scheduleos_test`.

## Migration Command Is Dry-Run

`npm run db:postgres:migrate` is intentionally dry-run. To apply migrations, build first and run:

```bash
SCHEDULEOS_POSTGRES_URL=postgres://user:password@host:5432/scheduleos npm run db:postgres:migrate:apply
```

## Schedule Does Not Fit

This may be correct behavior. Check:

- Task duration.
- Deadline.
- Earliest start.
- Working hours.
- Fixed busy events.
- Locked blocks.
- Minimum block size.
- Whether the task is blocked or scheduling-ineligible.

ScheduleOS should report impossible schedules honestly instead of silently dropping work.

## Public Release Checks Still Fail

This is expected while ScheduleOS is pre-release. Use `docs/public-release-checklist.md` and `docs/security/public-release-security-audit.md` to track remaining gates.
