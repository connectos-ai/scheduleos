# Retention Operator Runbook

## Status

Local/self-host operator packet foundation accepted as of 2026-07-22. Hosted scheduled retention cleanup, production alerting, and fully verified destructive-operation approval workflow remain release blockers.

## Purpose

Retention cleanup can delete scoped operational records after their retention windows. Operators must review the exact scope, timestamp, dry-run evidence, and confirmation token before applying cleanup.

The `retention:operator-packet` command is intentionally non-destructive. It prepares a review packet with:

- The requested backend, scope, and `asOf` timestamp.
- The exact dry-run command an operator should run.
- The exact apply command, including the required confirmation token.
- Required review steps before any destructive apply command.
- A release-boundary reminder that the packet does not replace hosted production approvals.

## Operator Packet

SQLite packet:

```bash
npm run build
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
npm run build
npm run retention:operator-packet -- \
  --backend postgres \
  --tenant-id tenant_demo \
  --workspace-id workspace_demo \
  --user-id user_jordan \
  --as-of 2026-07-22T12:00:00.000Z \
  --json
```

The packet sets `applyAllowedByPacket` to `false` and `secondOperatorReviewRequired` to `true`. Operators must not treat packet generation as approval to delete records.

## Required Review

Before running cleanup apply:

1. Save the packet output outside the workspace being cleaned.
2. Run the packet's dry-run command and save the JSON output.
3. Confirm the tenant, workspace, user, backend, database, and `asOf` timestamp are correct.
4. Compare eligible counts against the retention policy and expected operational notes.
5. Confirm cleanup will not delete active tasks, active calendar events, working hours, connected integration state, workspace exports, backup files, or deleted-workspace operator notes.
6. Have a second operator review the packet, dry-run output, and exact confirmation token.
7. Validate a backup exists before applying cleanup.
8. Record approval evidence outside ScheduleOS when the cleanup itself could delete in-product context.

## Apply Boundary

The apply command requires the exact confirmation token:

```text
tenant/workspace/user/as-of-iso
```

Example:

```text
tenant_demo/workspace_demo/user_jordan/2026-07-22T12:00:00.000Z
```

If any scope value or timestamp changes, regenerate the packet and repeat review.

## Hosted Cleanup Approval Packet

`retention:hosted-cleanup-packet` prepares a review-only approval packet for future hosted scheduled retention cleanup:

```bash
npm run build
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

The hosted packet records the environment, scope, `asOf`, maintenance window, dry-run evidence command, required evidence list, second-operator requirement, and approval-record fields. It sets `applyAllowedByPacket` and `deleteAllowedByPacket` to `false`; operators must not treat packet generation as permission to schedule, approve, apply, or delete records.

Hosted approval evidence must be stored outside the tenant/workspace/user cleanup scope and include dry-run JSON digest, backup/export validation digest, primary operator identity, second operator identity, legal/support review, scheduler/runtime identity, and post-window audit evidence.

## Release Boundary

This runbook documents the current local/self-host foundation. Public production release still requires:

- Hosted scheduled cleanup orchestration.
- Production approval storage and reviewer identity proof.
- Operator alerting and failure handling.
- Backup/export filesystem cleanup guidance for chosen hosts.
- Legal/support review before changing audit-event or deleted-workspace note retention.
- Browser or deployment verification of any hosted operator UX.
