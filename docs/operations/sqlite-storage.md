# SQLite Storage Operations

## Status

Draft local/small self-host operations guide. SQLite support is an initial foundation, not a public release guarantee. For cross-database backup, restore, validation, and cutover procedures, see [Backup Restore Runbook](backup-restore-runbook.md).

## Scope

This guide applies to the SQLite adapter backed by `node:sqlite`.

It does not cover:

- PostgreSQL production deployments.
- Hosted database operations.
- Encrypted token vault backups.
- External calendar provider recovery.
- Public release disaster recovery guarantees.

## Sensitive Data Warning

SQLite backups and workspace exports can contain task titles, calendar busy ranges, schedule plans, audit events, integration metadata, and other private planning data. Do not commit database files, backup files, or exported workspace files. Store them only in approved private storage.

## Backup

The local plaintext helper is:

```ts
await backupSqliteDatabase("data/scheduleos.db", "backups/scheduleos-backup.db");
```

The encrypted helper is:

```ts
await backupSqliteDatabase("data/scheduleos.db", "backups/scheduleos-backup.enc.json", {
  encryptionPassphrase: process.env.SCHEDULEOS_BACKUP_KEY
});
```

The helper checkpoints SQLite write-ahead-log state before copying the database file, creates the destination directory, and returns backup path plus byte size. When `encryptionPassphrase` is provided, it writes an AES-256-GCM encrypted JSON backup instead of a plaintext database copy.

CLI examples:

```bash
npm run db:sqlite:backup -- --database data/scheduleos.db --backup backups/scheduleos-backup.db

export SCHEDULEOS_BACKUP_KEY="use-a-long-random-secret-from-your-password-manager"
npm run db:sqlite:backup -- \
  --database data/scheduleos.db \
  --backup backups/scheduleos-backup.enc.json \
  --encrypt-key-env SCHEDULEOS_BACKUP_KEY
```

Minimum operator checklist:

- Stop write-heavy jobs if possible.
- Create backup with `backupSqliteDatabase` or `npm run db:sqlite:backup`.
- Prefer encrypted backup when copying backup off host.
- Confirm backup file size is greater than zero.
- Restore backup into temporary location.
- Open restored database through `createSqliteRepositories`.
- Run smoke read for expected tenant/workspace/user.
- Store backup outside the application working directory.

## Restore Validation

Restore validation should never overwrite production data.

The local plaintext helper is:

```ts
await restoreSqliteDatabase(
  "backups/scheduleos-backup.db",
  "restore/scheduleos-restored.db",
  scope
);
```

The encrypted restore helper is:

```ts
await restoreSqliteDatabase(
  "backups/scheduleos-backup.enc.json",
  "restore/scheduleos-restored.db",
  scope,
  { encryptionPassphrase: process.env.SCHEDULEOS_BACKUP_KEY }
);
```

The helper copies or decrypts backup into a separate restore path, refuses to overwrite an existing target by default, applies pending migrations, and returns scoped smoke counts for tasks, working hours, and schedule plans.

CLI examples:

```bash
npm run db:sqlite:restore -- \
  --backup backups/scheduleos-backup.db \
  --restore restore/scheduleos-restored.db \
  --tenant-id tenant_demo \
  --workspace-id workspace_demo \
  --user-id user_jordan

export SCHEDULEOS_BACKUP_KEY="use-the-same-long-random-secret"
npm run db:sqlite:restore -- \
  --backup backups/scheduleos-backup.enc.json \
  --restore restore/scheduleos-restored.db \
  --tenant-id tenant_demo \
  --workspace-id workspace_demo \
  --user-id user_jordan \
  --decrypt-key-env SCHEDULEOS_BACKUP_KEY
```

Recommended flow:

1. Copy or decrypt backup to a temporary restore path.
2. Open temporary path with `createSqliteRepositories`.
3. Read known task, working-hours record, and schedule plan.
4. Export restored workspace with `exportSqliteWorkspace`.
5. Compare counts against expected backup manifest or operator notes.
6. Only then replace active database during a maintenance window.

## Workspace Export

The local helper is:

```ts
const exported = exportSqliteWorkspace("data/scheduleos.db", actor, scope);
```

Export is scoped by tenant, workspace, and user.

It includes:

- Tasks.
- Calendar events for tenant user.
- Working hours.
- Schedule plans.
- Audit events.
- Idempotency records.
- Integration state.

It must not include OAuth tokens or private connector internals. Provider tokens should be owned by a reviewed token store or connector layer, not by SQLite export.

## Workspace Deletion

The local helper is:

```ts
const result = deleteSqliteWorkspace("data/scheduleos.db", actor, scope);
```

The helper deletes scoped rows from:

- Time blocks.
- Schedule plans.
- Tasks.
- Calendar events.
- Working hours.
- Audit events.
- Idempotency records.
- Integration states.

It returns row counts for operator review.

Before deleting:

- Create backup.
- Export workspace if retention policy requires it.
- Confirm tenant, workspace, and user IDs.
- Confirm provider connection revocation is handled outside ScheduleOS if an external connector owns provider tokens.

After deleting:

- Run scoped read smoke test.
- Confirm unrelated tenant/workspace/user data remains.
- Record an operator audit note outside the deleted workspace if policy requires durable deletion evidence.

## Current Gaps

- SQLite backup, encrypted backup, restore validation, scoped export, and scoped deletion CLI wrapper foundation now exists through `npm run db:sqlite:*` commands.
- Retention policy durations and SQLite/PostgreSQL cleanup dry-run/apply foundations exist in [Retention Policy](../security/retention-policy.md); hosted cleanup remains incomplete.
- PostgreSQL backup restore guidance exists in shared runbook, but provider-specific managed-database snapshot guidance remains incomplete.
- Deletion has local helper coverage, but no public API route or production approval workflow.
