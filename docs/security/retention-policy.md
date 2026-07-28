# Retention Policy

## Status

Retention duration foundation, local JSON-backed API cleanup foundation, SQLite cleanup foundation, and PostgreSQL cleanup foundation are accepted for local/self-host ScheduleOS as of 2026-07-22. Hosted scheduled cleanup controls and broader production destructive-operation approval workflow remain release blockers.

## Principle

ScheduleOS should not keep secondary copies of private planning data forever. Active user data remains available until explicit user/workspace deletion, but backups, exports, sync metadata, replay records, and historical operational evidence have bounded retention windows.

## Default Durations

| Category | Duration | Starts At | Action |
| --- | --- | --- | --- |
| Active user data | Until explicit deletion | User/workspace lifecycle | Keep until deletion |
| Workspace exports | 7 days | Export creation | Delete after retention |
| Plaintext backups | 7 days | Backup creation | Delete after retention |
| Encrypted backups | 30 days | Backup creation | Delete after retention |
| Audit events | 365 days | Event occurrence | Review after retention |
| Idempotency records | 30 days | Completion, expiry, or failure | Delete after retention |
| Auth sessions | 30 days | Session expiration or revocation | Delete after retention |
| Auth password reset tokens | 7 days | Token expiration or use | Delete after retention |
| Auth login-attempt windows | 14 days | Lock release or latest failed-attempt window update | Delete after retention |
| Import throttle windows | 14 days | Window end | Delete after retention |
| Calendar sync state | 90 days | Sync replacement, reset, or disconnect | Delete after retention |
| Integration sync metadata | 90 days | Provider disconnect or sync reset | Delete after retention |
| Schedule plan history | 180 days | Plan range end | Delete after retention |
| Deleted workspace operator notes | 365 days | Workspace deletion | Review after retention |

## CLI Inspection

Policy is inspectable without deleting anything:

```bash
npm run build
npm run retention:policy -- --as-of 2026-07-22T12:00:00.000Z
npm run retention:policy -- --as-of 2026-07-22T12:00:00.000Z --json
```

The command reports retention durations and `deleteBefore` cutoffs for categories with finite retention.

## Operator Approval Packet

`retention:operator-packet` prepares a non-destructive approval packet before SQLite or PostgreSQL cleanup apply. The packet includes the requested scope, backend, `asOf` timestamp, exact dry-run command, exact apply command, required confirmation token, and review steps. It sets `applyAllowedByPacket` to `false` and requires second-operator review.

SQLite packet:

```bash
npm run retention:operator-packet -- \
  --backend sqlite \
  --database data/scheduleos.db \
  --tenant-id tenant_demo \
  --workspace-id workspace_demo \
  --user-id user_jordan \
  --as-of 2026-07-22T12:00:00.000Z \
  --json
```

PostgreSQL packet:

```bash
npm run retention:operator-packet -- \
  --backend postgres \
  --tenant-id tenant_demo \
  --workspace-id workspace_demo \
  --user-id user_jordan \
  --as-of 2026-07-22T12:00:00.000Z \
  --json
```

Operators should follow [Retention Operator Runbook](../operations/retention-operator-runbook.md) before applying cleanup. Packet generation is not approval to delete records.

## Hosted Cleanup Approval Packet

`retention:hosted-cleanup-packet` prepares a review-only production approval packet for future hosted retention cleanup. It requires environment, tenant/workspace/user scope, `asOf`, and a maintenance window:

```bash
npm run retention:hosted-cleanup-packet -- \
  --environment production-demo \
  --tenant-id tenant_demo \
  --workspace-id workspace_demo \
  --user-id user_jordan \
  --as-of 2026-07-22T12:00:00.000Z \
  --window-start 2026-07-23T02:00:00.000Z \
  --window-end 2026-07-23T03:00:00.000Z \
  --json
```

The packet sets `applyAllowedByPacket` and `deleteAllowedByPacket` to `false`. It requires dry-run evidence, backup/export evidence, legal/support review for audit-event or deleted-workspace-note changes, second-operator approval, and approval records stored outside the cleanup scope. It does not schedule hosted cleanup, approve destructive action, apply cleanup, delete records, or replace production scheduler verification.

## Cleanup Scope

Local JSON-backed API cleanup and SQLite/PostgreSQL cleanup dry-run by default and apply only requested tenant/workspace/user scope.

Cleanup can delete eligible scoped operational records:

- Schedule plan history past retention.
- Idempotency records past retention.
- Expired revoked auth session hashes past retention.
- Expired or used password reset token hashes past retention.
- Import throttle windows past retention.
- Disconnected error integration metadata past retention.

Cleanup reports audit events review-due but does not delete them automatically. Cleanup does not delete active tasks, active calendar events, working hours, connected integration state, workspace exports, backup files, or deleted-workspace operator notes.

## Local JSON-Backed API Cleanup

Dry-run requires an authenticated `OWNER` or `ADMIN` principal in the requested tenant/workspace:

```bash
curl -X POST http://127.0.0.1:8787/api/retention/cleanup \
  -H 'authorization: Bearer token_demo_owner' \
  -H 'content-type: application/json' \
  -d '{
    "tenantId": "tenant_demo",
    "workspaceId": "workspace_demo",
    "userId": "user_jordan",
    "asOf": "2026-07-22T12:00:00.000Z"
  }'
```

Apply requires exact confirmation:

```bash
curl -X POST http://127.0.0.1:8787/api/retention/cleanup \
  -H 'authorization: Bearer token_demo_owner' \
  -H 'content-type: application/json' \
  -d '{
    "tenantId": "tenant_demo",
    "workspaceId": "workspace_demo",
    "userId": "user_jordan",
    "asOf": "2026-07-22T12:00:00.000Z",
    "apply": true,
    "confirm": "tenant_demo/workspace_demo/user_jordan/2026-07-22T12:00:00.000Z"
  }'
```

Successful apply appends `RETENTION_CLEANUP_APPLIED`. This endpoint controls the local JSON-backed API store only; it is not a hosted scheduled cleanup system and does not replace SQLite/PostgreSQL operator workflows.

## SQLite Cleanup

Dry-run:

```bash
npm run retention:sqlite-cleanup -- \
  --database data/scheduleos.db \
  --tenant-id tenant_demo \
  --workspace-id workspace_demo \
  --user-id user_jordan \
  --as-of 2026-07-22T12:00:00.000Z \
  --json
```

Apply requires exact confirmation:

```bash
npm run retention:sqlite-cleanup -- \
  --database data/scheduleos.db \
  --tenant-id tenant_demo \
  --workspace-id workspace_demo \
  --user-id user_jordan \
  --as-of 2026-07-22T12:00:00.000Z \
  --apply \
  --confirm tenant_demo/workspace_demo/user_jordan/2026-07-22T12:00:00.000Z \
  --json
```

Retention apply commands use the shared local destructive-operation confirmation helper. Required token is `tenant/workspace/user/as-of-iso`; production release still requires broader hosted operator approval workflow.

## PostgreSQL Cleanup

Dry-run:

```bash
SCHEDULEOS_POSTGRES_URL=postgres://scheduleos:scheduleos@localhost:55432/scheduleos_test \
npm run retention:postgres-cleanup -- \
  --tenant-id tenant_demo \
  --workspace-id workspace_demo \
  --user-id user_jordan \
  --as-of 2026-07-22T12:00:00.000Z \
  --json
```

Apply requires exact confirmation:

```bash
SCHEDULEOS_POSTGRES_URL=postgres://scheduleos:scheduleos@localhost:55432/scheduleos_test \
npm run retention:postgres-cleanup -- \
  --tenant-id tenant_demo \
  --workspace-id workspace_demo \
  --user-id user_jordan \
  --as-of 2026-07-22T12:00:00.000Z \
  --apply \
  --confirm tenant_demo/workspace_demo/user_jordan/2026-07-22T12:00:00.000Z \
  --json
```

## Release Boundary

This policy defines durations, cutoff calculation, local JSON-backed API cleanup foundation, and local SQLite/PostgreSQL cleanup foundations only. Public production release still requires:

- Broader operator approval workflow before destructive cleanup.
- Backup/export filesystem cleanup guidance host-specific controls.
- Hosted production-specific retention configuration review.
- Legal/support review before changing audit-event and deleted-workspace note retention.
