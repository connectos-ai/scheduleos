# Backup And Restore Runbook

## Status

Operational runbook foundation. ScheduleOS is still pre-release and not approved for production self-hosting.

This runbook documents the intended backup and restore process for standalone ScheduleOS deployments. It does not make the public release gate pass by itself. Production release still requires final authentication, tenant-isolation, remote CI PostgreSQL proof, hosted retention cleanup, and operator-approval hardening.

## Scope

This runbook covers:

- SQLite local and small self-host deployments.
- PostgreSQL team or production-style deployments.
- Restore validation before replacing an active database.
- Sensitive-data handling for backups and workspace exports.

This runbook does not cover:

- Provider token vault recovery outside ScheduleOS storage.
- OAuth token rotation or external connector revocation.
- Hosted managed-database provider-specific snapshots.
- Public release disaster-recovery service-level commitments.

## Sensitive Data Rules

Backups can contain private planning data: task titles, descriptions, calendar busy ranges, working hours, schedule plans, audit events, idempotency records, and integration state.

Operators must:

- Never commit backup, export, restore, or dump files.
- Encrypt backups before copying them off the host.
- Store backups only in approved private storage.
- Limit restore access to trusted operators.
- Keep operator notes outside the restored workspace when durable proof is required.
- Treat workspace exports as sensitive even when they do not include provider tokens.

ScheduleOS exports and backups must not be used as a provider token vault. OAuth tokens, refresh tokens, and private connector internals should be owned by the connector or token-store layer, not by generic ScheduleOS workspace export.

## SQLite Backup

Use SQLite for local or small self-host deployments only.

Current helper:

```ts
await backupSqliteDatabase("data/scheduleos.db", "backups/scheduleos-backup.db");
```

CLI foundation:

```bash
npm run db:sqlite:backup -- --database data/scheduleos.db --backup backups/scheduleos-backup.db
```

Encrypted CLI foundation:

```bash
export SCHEDULEOS_BACKUP_KEY="use-a-long-random-secret-from-your-password-manager"
npm run db:sqlite:backup -- \
  --database data/scheduleos.db \
  --backup backups/scheduleos-backup.enc.json \
  --encrypt-key-env SCHEDULEOS_BACKUP_KEY
```

Minimum backup procedure:

1. Announce a maintenance window if users or workers may write to the database.
2. Stop write-heavy import, sync, or planning jobs when possible.
3. Run `backupSqliteDatabase`.
4. Confirm the backup file exists and its size is greater than zero.
5. Record backup filename, UTC time, ScheduleOS version or commit, and operator.
6. Copy the backup to approved private storage after encryption if it leaves the host.
7. Restore the backup into a temporary path and run validation before trusting it.

## SQLite Restore Validation

Never validate by overwriting the active database.

Current helper:

```ts
await restoreSqliteDatabase(
  "backups/scheduleos-backup.db",
  "restore/scheduleos-restored.db",
  scope
);
```

CLI foundation:

```bash
npm run db:sqlite:restore -- \
 --backup backups/scheduleos-backup.db \
 --restore restore/scheduleos-restored.db \
 --tenant-id tenant_demo \
 --workspace-id workspace_demo \
 --user-id user_jordan
```

Overwrite confirmation foundation:

```bash
npm run db:sqlite:restore -- \
 --backup backups/scheduleos-backup.db \
 --restore restore/scheduleos-restored.db \
 --tenant-id tenant_demo \
 --workspace-id workspace_demo \
 --user-id user_jordan \
 --overwrite \
 --confirm tenant_demo/workspace_demo/user_jordan/overwrite/restore/scheduleos-restored.db
```

Restore overwrite commands refuse to run unless `--confirm` exactly matches `tenant/workspace/user/overwrite/restore-path`.

Encrypted restore validation:

```bash
export SCHEDULEOS_BACKUP_KEY="use-the-same-long-random-secret"
npm run db:sqlite:restore -- \
  --backup backups/scheduleos-backup.enc.json \
  --restore restore/scheduleos-restored.db \
  --tenant-id tenant_demo \
  --workspace-id workspace_demo \
  --user-id user_jordan \
  --decrypt-key-env SCHEDULEOS_BACKUP_KEY
```

Validation procedure:

1. Restore to a new temporary target path.
2. Confirm the helper refuses to overwrite an existing target unless an operator deliberately chooses an overwrite path with exact confirmation.
3. Apply pending migrations through the restore helper.
4. Open the restored database with `createSqliteRepositories`.
5. Read known scoped task, calendar event, working-hours, schedule-plan, audit-event, idempotency, and integration-state records.
6. Export the restored workspace with `exportSqliteWorkspace`.
7. Compare restored counts with the backup manifest or operator notes.
8. Confirm an unrelated tenant, workspace, or user cannot read the restored scoped data.
9. Keep the active database unchanged until validation passes.

## PostgreSQL Backup

Use PostgreSQL for team or production-style deployments.

Recommended logical backup:

```bash
pg_dump "$SCHEDULEOS_POSTGRES_URL" \
  --format=custom \
  --no-owner \
  --no-acl \
  --file "backups/scheduleos-$(date -u +%Y%m%dT%H%M%SZ).dump"
```

Create a checksum:

```bash
shasum -a 256 backups/scheduleos-*.dump > backups/scheduleos-backups.sha256
```

Minimum backup procedure:

1. Confirm `SCHEDULEOS_POSTGRES_URL` points to the intended database.
2. Record database host, database name, ScheduleOS version or commit, UTC time, and operator.
3. Run `pg_dump` with custom format.
4. Create and store a checksum.
5. Encrypt the dump before copying it off the host.
6. Keep database credentials out of terminal history, logs, and committed files.
7. Restore the dump into a disposable validation database before relying on it.

## PostgreSQL Restore Validation

Validate with a disposable database before replacing any active database:

```bash
createdb scheduleos_restore_check
pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  --dbname scheduleos_restore_check \
  backups/scheduleos-YYYYMMDDTHHMMSSZ.dump
```

Validation procedure:

1. Run pending ScheduleOS migrations against the restored database.
2. Read known scoped task, calendar-event, working-hours, schedule-plan, time-block, audit-event, idempotency, and integration-state records.
3. Compare table counts with backup notes or database inventory.
4. Create a disposable schedule plan for a fictional or test scope only.
5. Confirm cross-scope reads and writes are rejected.
6. Confirm no provider secret columns or raw OAuth token fields are present in ScheduleOS tables.
7. Drop the validation database after checks complete.

## Restore Cutover

Use this flow for SQLite or PostgreSQL when replacing an active database:

1. Schedule a maintenance window.
2. Stop API servers, workers, import jobs, sync jobs, and calendar write-back jobs.
3. Create a final backup before restore.
4. Restore into the target database or target file.
5. Apply pending migrations.
6. Start ScheduleOS bound to a private interface only.
7. Run health and scoped-read smoke tests.
8. Create a schedule plan for a test or fictional scope.
9. Confirm accepted-block export and audit-event reads work for the restored scope.
10. Re-enable jobs and provider sync only after validation passes.
11. Record operator notes outside the restored workspace.

## Workspace Export And Deletion

Workspace export can help validate backups, migrate local data, or support user data requests. It is not a complete disaster-recovery replacement for database backup.

SQLite scoped export CLI foundation:

```bash
npm run db:sqlite:export -- \
  --database data/scheduleos.db \
  --tenant-id tenant_demo \
  --workspace-id workspace_demo \
  --user-id user_jordan \
  --output exports/workspace.json
```

Workspace deletion must be preceded by:

- Backup when retention policy requires it.
- Workspace export when requested or required.
- Explicit tenant, workspace, and user confirmation.
- Provider connection revocation handled outside ScheduleOS when a connector owns tokens.

SQLite scoped deletion CLI foundation:

```bash
npm run db:sqlite:delete-workspace -- \
  --database data/scheduleos.db \
  --tenant-id tenant_demo \
  --workspace-id workspace_demo \
  --user-id user_jordan \
  --confirm tenant_demo/workspace_demo/user_jordan
```

Deletion commands must refuse to run unless `--confirm` exactly matches the requested `tenant/workspace/user` scope.

## Current Release Gaps

Before public production release, ScheduleOS still needs:

- Hosted retention cleanup enforcement.
- Full production operator approval workflow for destructive restore, cleanup, and deletion beyond local exact-confirmation helpers and the local retention operator packet foundation.
- Remote CI PostgreSQL proof.
- Production authentication, roles, memberships, sessions, and hosted auth cleanup scheduling.
- Tenant-isolation verification across live storage boundaries.
- Provider token vault recovery documentation outside ScheduleOS storage.
- Managed-database snapshot guidance for chosen production hosts.
