import { DatabaseSync } from "node:sqlite";
import { access, copyFile, mkdir, rm, stat } from "node:fs/promises";
import { dirname } from "node:path";
import {
  decryptBackupFile,
  encryptBackupFile,
  type BackupEncryptionMetadata
} from "./backup-encryption.js";
import { calculateRetentionCutoffs, type RetentionPolicyCategory } from "./retention-policy.js";
import type {
  AuditEvent,
  AuthLoginAttemptWindow,
  AuthPasswordResetToken,
  AuthSession,
  AuthUser,
  CalendarEvent,
 IdempotencyRecord,
 ImportThrottleRecord,
 IntegrationState,
 RequestThrottleRecord,
 SchedulePlan,
  SchedulingTask,
  TimeBlock,
  WorkingHours,
  WorkspaceMembership
} from "./domain.js";
import {
  RepositoryForbiddenError,
  RepositoryNotFoundError,
  RepositoryValidationError,
  applyBlockTimePatch,
  matchesScope
} from "./repositories.js";
import type {
  AuditEventRepository,
  AuthRepository,
  CalendarEventRepository,
  IdempotencyRepository,
 ImportThrottleRepository,
 IntegrationStateRepository,
 RepositoryActor,
 RequestThrottleRepository,
 ScheduleOSRepositories,
  SchedulePlanRepository,
  Scope,
  TaskRepository,
  TimeBlockRepository,
  WorkingHoursRepository
} from "./repositories.js";

export interface SqliteRepositories {
  repositories: ScheduleOSRepositories;
  close: () => void;
}

export interface MigrationResult {
  appliedVersions: number[];
}

export interface SqliteBackupResult {
 backupPath: string;
 bytes: number;
 encrypted?: {
  algorithm: BackupEncryptionMetadata["algorithm"];
  kdf: BackupEncryptionMetadata["kdf"];
 };
}

export interface SqliteRestoreResult {
 restorePath: string;
 bytes: number;
 appliedVersions: number[];
  smoke: {
    tasks: number;
    workingHours: boolean;
  schedulePlans: number;
 };
 decrypted?: boolean;
}

export interface SqliteBackupOptions {
 encryptionPassphrase?: string;
}

export interface SqliteRestoreOptions {
 overwrite?: boolean;
 encryptionPassphrase?: string;
}

export interface SqliteWorkspaceExport {
  exportedAt: string;
  scope: Scope;
  tasks: SchedulingTask[];
  calendarEvents: CalendarEvent[];
  workingHours?: WorkingHours;
  schedulePlans: SchedulePlan[];
  auditEvents: AuditEvent[];
  idempotencyRecords: IdempotencyRecord[];
  integrationStates: IntegrationState[];
}

export interface SqliteWorkspaceDeletionResult {
  deletedAt: string;
  scope: Scope;
  deleted: {
    tasks: number;
    calendarEvents: number;
    workingHours: number;
    schedulePlans: number;
    timeBlocks: number;
    auditEvents: number;
    idempotencyRecords: number;
    integrationStates: number;
  };
}

export interface SqliteRetentionCleanupResult {
  evaluatedAt: string;
  scope: Scope;
  dryRun: boolean;
  eligible: Partial<Record<RetentionPolicyCategory, number>>;
  deleted: Partial<Record<RetentionPolicyCategory, number>>;
  reviewDue: Partial<Record<RetentionPolicyCategory, number>>;
}

const migrations = [
  {
    version: 1,
    name: "initial",
    sql: `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT,
  updated_at TEXT,
  PRIMARY KEY (tenant_id, workspace_id, user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_scope_deadline
  ON tasks (tenant_id, workspace_id, user_id, id);

CREATE TABLE IF NOT EXISTS calendar_events (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  calendar_id TEXT NOT NULL,
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_time
  ON calendar_events (tenant_id, workspace_id, user_id, start_at, end_at);

CREATE TABLE IF NOT EXISTS working_hours (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS schedule_plans (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  range_start TEXT NOT NULL,
  range_end TEXT NOT NULL,
  status TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_schedule_plans_range
  ON schedule_plans (tenant_id, workspace_id, user_id, range_start, range_end);

CREATE TABLE IF NOT EXISTS time_blocks (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  status TEXT NOT NULL,
  locked INTEGER NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_time_blocks_plan
  ON time_blocks (tenant_id, workspace_id, user_id, plan_id);

CREATE TABLE IF NOT EXISTS audit_events (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_audit_events_resource
  ON audit_events (tenant_id, workspace_id, user_id, resource_type, resource_id);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT,
  data TEXT NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id, key)
);

CREATE TABLE IF NOT EXISTS integration_states (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  source_system TEXT NOT NULL,
  status TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_integration_states_source
ON integration_states (tenant_id, workspace_id, user_id, source_system);

CREATE TABLE IF NOT EXISTS import_throttles (
tenant_id TEXT NOT NULL,
workspace_id TEXT NOT NULL,
user_id TEXT NOT NULL,
id TEXT NOT NULL,
source_system TEXT NOT NULL,
operation TEXT NOT NULL,
window_started_at TEXT NOT NULL,
window_ms INTEGER NOT NULL,
limit_count INTEGER NOT NULL,
count INTEGER NOT NULL,
updated_at TEXT NOT NULL,
data TEXT NOT NULL,
PRIMARY KEY (tenant_id, workspace_id, user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_import_throttles_source
  ON import_throttles (tenant_id, workspace_id, user_id, source_system, operation);

CREATE TABLE IF NOT EXISTS request_throttles (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  window_started_at TEXT NOT NULL,
  window_ms INTEGER NOT NULL,
  limit_count INTEGER NOT NULL,
  count INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_request_throttles_key
  ON request_throttles (tenant_id, workspace_id, user_id, key_hash);

CREATE TABLE IF NOT EXISTS auth_users (
  tenant_id TEXT NOT NULL,
  id TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (tenant_id, id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_users_email
  ON auth_users (tenant_id, email);

CREATE TABLE IF NOT EXISTS workspace_memberships (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_memberships_user
  ON workspace_memberships (tenant_id, user_id, status);

CREATE TABLE IF NOT EXISTS auth_sessions (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  session_token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  data TEXT NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id, id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_sessions_token_hash
  ON auth_sessions (tenant_id, session_token_hash);

CREATE TABLE IF NOT EXISTS auth_password_reset_tokens (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  data TEXT NOT NULL,
  PRIMARY KEY (tenant_id, workspace_id, user_id, id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_password_reset_tokens_hash
ON auth_password_reset_tokens (tenant_id, token_hash);

CREATE TABLE IF NOT EXISTS auth_login_attempt_windows (
tenant_id TEXT NOT NULL,
workspace_id TEXT NOT NULL,
user_id TEXT NOT NULL,
id TEXT NOT NULL,
window_started_at TEXT NOT NULL,
window_ms INTEGER NOT NULL,
max_failed_attempts INTEGER NOT NULL,
failed_count INTEGER NOT NULL,
locked_until TEXT,
updated_at TEXT NOT NULL,
data TEXT NOT NULL,
PRIMARY KEY (tenant_id, workspace_id, user_id, id)
);
`
  }
];

export const migrateSqliteDatabase = (databasePath: string): MigrationResult => {
  const database = new DatabaseSync(databasePath);
  try {
    const appliedVersions = applyMigrations(database);
    return { appliedVersions };
  } finally {
    database.close();
  }
};

export const createSqliteRepositories = (databasePath: string): SqliteRepositories => {
  const database = new DatabaseSync(databasePath);
  applyMigrations(database);

  const tasks: TaskRepository = {
    upsert(actor, task) {
      assertCanAccess(actor, task);
      database
        .prepare(
          `INSERT INTO tasks (tenant_id, workspace_id, user_id, id, data, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (tenant_id, workspace_id, user_id, id)
           DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
        )
        .run(
          task.tenantId,
          task.workspaceId,
          task.userId,
          task.id,
          serialize(task),
          task.createdAt,
          task.updatedAt
      );
      return task;
    },
    get(actor, scope, taskId) {
      assertCanAccess(actor, scope);
      const tasks = selectJson<SchedulingTask>(
        database,
        `SELECT data FROM tasks
         WHERE tenant_id = ? AND workspace_id = ? AND user_id = ? AND id = ?`,
        [scope.tenantId, scope.workspaceId, scope.userId, taskId]
      );
      const task = tasks[0];
      if (!task) throw new RepositoryNotFoundError("Task not found.");
      return task;
    },
    list(actor, scope) {
      assertCanAccess(actor, scope);
      return selectJson<SchedulingTask>(
        database,
        `SELECT data FROM tasks
         WHERE tenant_id = ? AND workspace_id = ? AND user_id = ?
         ORDER BY id`,
        [scope.tenantId, scope.workspaceId, scope.userId]
      );
    },
    delete(actor, scope, taskId) {
      assertCanAccess(actor, scope);
      const result = database
        .prepare(
          `DELETE FROM tasks
           WHERE tenant_id = ? AND workspace_id = ? AND user_id = ? AND id = ?`
        )
        .run(scope.tenantId, scope.workspaceId, scope.userId, taskId);
      if (result.changes === 0) throw new RepositoryNotFoundError("Task not found.");
    }
  };

  const calendarEvents: CalendarEventRepository = {
    upsert(actor, event, scope) {
      assertCanAccess(actor, scope);
      assertCalendarEventScope(event, scope);
      database
        .prepare(
          `INSERT INTO calendar_events (tenant_id, workspace_id, user_id, id, calendar_id, start_at, end_at, data)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (tenant_id, workspace_id, user_id, id)
           DO UPDATE SET calendar_id = excluded.calendar_id,
                         start_at = excluded.start_at,
                         end_at = excluded.end_at,
                         data = excluded.data`
        )
        .run(
          event.tenantId,
          event.workspaceId,
          event.userId,
          event.id,
          event.calendarId,
          event.start,
          event.end,
          serialize(event)
        );
      return event;
    },
    get(actor, scope, eventId) {
      assertCanAccess(actor, scope);
      const event = selectOneJson<CalendarEvent>(
        database,
        `SELECT data FROM calendar_events
         WHERE tenant_id = ? AND workspace_id = ? AND user_id = ? AND id = ?`,
        [scope.tenantId, scope.workspaceId, scope.userId, eventId]
      );
      if (!event) throw new RepositoryNotFoundError("Calendar event not found.");
      return event;
    },
    listForSchedule(actor, scope) {
      assertCanAccess(actor, scope);
      return selectJson<CalendarEvent>(
        database,
        `SELECT data FROM calendar_events
         WHERE tenant_id = ? AND workspace_id = ? AND user_id = ?
         ORDER BY start_at, id`,
        [scope.tenantId, scope.workspaceId, scope.userId]
      );
    },
    delete(actor, scope, eventId) {
      assertCanAccess(actor, scope);
      const result = database
        .prepare(
          `DELETE FROM calendar_events
           WHERE tenant_id = ? AND workspace_id = ? AND user_id = ? AND id = ?`
        )
        .run(scope.tenantId, scope.workspaceId, scope.userId, eventId);
      if (result.changes === 0) {
        throw new RepositoryNotFoundError("Calendar event not found.");
      }
    }
  };

  const workingHours: WorkingHoursRepository = {
    put(actor, scope, workingHours) {
      assertCanAccess(actor, scope);
      assertWorkingHoursScope(workingHours, scope);
      database
        .prepare(
          `INSERT INTO working_hours (tenant_id, workspace_id, user_id, data)
           VALUES (?, ?, ?, ?)
           ON CONFLICT (tenant_id, workspace_id, user_id)
           DO UPDATE SET data = excluded.data`
        )
        .run(scope.tenantId, scope.workspaceId, scope.userId, serialize(workingHours));
      return workingHours;
    },
    get(actor, scope) {
      assertCanAccess(actor, scope);
      return selectOneJson<WorkingHours>(
        database,
        `SELECT data FROM working_hours
         WHERE tenant_id = ? AND workspace_id = ? AND user_id = ?`,
        [scope.tenantId, scope.workspaceId, scope.userId]
      );
    }
  };

  const schedulePlans: SchedulePlanRepository = {
    upsert(actor, plan) {
      assertCanAccess(actor, plan);
      upsertPlan(database, plan);
      return plan;
    },
    get(actor, planId) {
      const plan = getPlan(database, actor, planId);
      assertCanAccess(actor, plan);
      return plan;
    },
    list(actor, scope) {
      assertCanAccess(actor, scope);
      return selectJson<SchedulePlan>(
        database,
        `SELECT data FROM schedule_plans
         WHERE tenant_id = ? AND workspace_id = ? AND user_id = ?
         ORDER BY range_start, id`,
        [scope.tenantId, scope.workspaceId, scope.userId]
      );
    },
    replace(actor, plan) {
      assertCanAccess(actor, plan);
      upsertPlan(database, plan);
      return plan;
    }
  };

  const timeBlocks: TimeBlockRepository = {
    get(actor, blockId) {
      const block = getBlock(database, actor, blockId);
      assertCanAccess(actor, block);
      return block;
    },
    updateTime(actor, blockId, patch) {
      const block = getBlock(database, actor, blockId);
      assertCanAccess(actor, block);
      const planId = requireStringColumn(
        getBlockRow(database, actor, blockId),
        "plan_id",
        "Time block not found."
      );
      const updatedBlock = applyBlockTimePatch(block, patch);
      const plan = getPlan(database, actor, planId);
      const updatedPlan: SchedulePlan = {
        ...plan,
        blocks: plan.blocks.map((candidate) =>
          candidate.id === blockId ? updatedBlock : candidate
        )
      };
      upsertPlan(database, updatedPlan);
      return updatedBlock;
    },
    updateStatus(actor, blockId, action) {
      const block = getBlock(database, actor, blockId);
      assertCanAccess(actor, block);
      const planId = requireStringColumn(
        getBlockRow(database, actor, blockId),
        "plan_id",
        "Time block not found."
      );
      const updatedBlock = applyBlockAction(block, action);
      const plan = getPlan(database, actor, planId);
      const updatedPlan: SchedulePlan = {
        ...plan,
        blocks: plan.blocks.map((candidate) =>
          candidate.id === blockId ? updatedBlock : candidate
        )
      };
      upsertPlan(database, updatedPlan);
      return updatedBlock;
    }
  };

  const auditEvents: AuditEventRepository = {
    append(actor, event) {
      assertCanAccess(actor, event);
      database
        .prepare(
          `INSERT INTO audit_events (
             tenant_id, workspace_id, user_id, id, occurred_at,
             action, resource_type, resource_id, data
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (tenant_id, workspace_id, user_id, id)
           DO UPDATE SET data = excluded.data`
        )
        .run(
          event.tenantId,
          event.workspaceId,
          event.userId,
          event.id,
          event.occurredAt,
          event.action,
          event.resourceType,
          event.resourceId,
          serialize(event)
        );
      return event;
    },
    list(actor, scope) {
      assertCanAccess(actor, scope);
      return selectJson<AuditEvent>(
        database,
        `SELECT data FROM audit_events
         WHERE tenant_id = ? AND workspace_id = ? AND user_id = ?
         ORDER BY occurred_at, id`,
        [scope.tenantId, scope.workspaceId, scope.userId]
      );
    }
  };

  const idempotency: IdempotencyRepository = {
    reserve(actor, record) {
      assertCanAccess(actor, record);
      const existing = this.get(actor, record, record.key);
      if (existing) return { record: existing, created: false };
      database
        .prepare(
          `INSERT INTO idempotency_keys (
             tenant_id, workspace_id, user_id, key,
             request_hash, status, created_at, expires_at, data
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          record.tenantId,
          record.workspaceId,
          record.userId,
          record.key,
          record.requestHash,
          record.status,
          record.createdAt,
          record.expiresAt ?? null,
          serialize(record)
        );
      return { record, created: true };
    },
    get(actor, scope, key) {
      assertCanAccess(actor, scope);
      return selectOneJson<IdempotencyRecord>(
        database,
        `SELECT data FROM idempotency_keys
         WHERE tenant_id = ? AND workspace_id = ? AND user_id = ? AND key = ?`,
        [scope.tenantId, scope.workspaceId, scope.userId, key]
      );
    },
    complete(actor, scope, key, update) {
      assertCanAccess(actor, scope);
      const existing = this.get(actor, scope, key);
      if (!existing) throw new RepositoryNotFoundError("Idempotency record not found.");
      const updated = { ...existing, ...update };
      database
        .prepare(
          `UPDATE idempotency_keys
           SET status = ?, data = ?
           WHERE tenant_id = ? AND workspace_id = ? AND user_id = ? AND key = ?`
        )
        .run(
          updated.status,
          serialize(updated),
          scope.tenantId,
          scope.workspaceId,
          scope.userId,
          key
        );
      return updated;
    }
  };

  const integrationStates: IntegrationStateRepository = {
    upsert(actor, integrationState) {
      assertCanAccess(actor, integrationState);
      database
        .prepare(
          `INSERT INTO integration_states (
             tenant_id, workspace_id, user_id, id,
             source_system, status, updated_at, data
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (tenant_id, workspace_id, user_id, id)
           DO UPDATE SET source_system = excluded.source_system,
                         status = excluded.status,
                         updated_at = excluded.updated_at,
                         data = excluded.data`
        )
        .run(
          integrationState.tenantId,
          integrationState.workspaceId,
          integrationState.userId,
          integrationState.id,
          integrationState.sourceSystem,
          integrationState.status,
          integrationState.updatedAt,
          serialize(integrationState)
        );
      return integrationState;
    },
    get(actor, scope, id) {
      assertCanAccess(actor, scope);
      const integrationState = selectOneJson<IntegrationState>(
        database,
        `SELECT data FROM integration_states
         WHERE tenant_id = ? AND workspace_id = ? AND user_id = ? AND id = ?`,
        [scope.tenantId, scope.workspaceId, scope.userId, id]
      );
      if (!integrationState) {
        throw new RepositoryNotFoundError("Integration state not found.");
      }
      return integrationState;
    },
    list(actor, scope) {
      assertCanAccess(actor, scope);
      return selectJson<IntegrationState>(
        database,
        `SELECT data FROM integration_states
         WHERE tenant_id = ? AND workspace_id = ? AND user_id = ?
         ORDER BY source_system, id`,
        [scope.tenantId, scope.workspaceId, scope.userId]
      );
    }
  };

  const importThrottles: ImportThrottleRepository = {
    consume(actor, scope, input) {
      assertCanAccess(actor, scope);
      if (input.count < 0) {
        throw new RepositoryValidationError("Import throttle count must be non-negative.");
      }
      if (input.limit <= 0 || input.windowMs <= 0) {
        throw new RepositoryValidationError("Import throttle limit and windowMs must be positive.");
      }
      const nowMs = Date.parse(input.now);
      if (!Number.isFinite(nowMs)) {
        throw new RepositoryValidationError("Import throttle now must be a valid timestamp.");
      }

      const id = `${input.operation}:${input.sourceSystem}`;
      const existing = selectOneJson<ImportThrottleRecord>(
        database,
        `SELECT data FROM import_throttles
         WHERE tenant_id = ? AND workspace_id = ? AND user_id = ? AND id = ?`,
        [scope.tenantId, scope.workspaceId, scope.userId, id]
      );
      const existingStartedAtMs = existing ? Date.parse(existing.windowStartedAt) : NaN;
      const windowExpired =
        !existing || !Number.isFinite(existingStartedAtMs) || nowMs - existingStartedAtMs >= input.windowMs;
      const baseRecord: ImportThrottleRecord = windowExpired
        ? {
            id,
            tenantId: scope.tenantId,
            workspaceId: scope.workspaceId,
            userId: scope.userId,
            sourceSystem: input.sourceSystem,
            operation: input.operation,
            windowStartedAt: input.now,
            windowMs: input.windowMs,
            limit: input.limit,
            count: 0,
            updatedAt: input.now
          }
        : {
            ...existing,
            windowMs: input.windowMs,
            limit: input.limit
          };

      if (baseRecord.count + input.count > input.limit) {
        return {
          allowed: false,
          retryAfterMs: Math.max(0, input.windowMs - (nowMs - Date.parse(baseRecord.windowStartedAt))),
          record: baseRecord
        };
      }

      const updatedRecord = {
        ...baseRecord,
        count: baseRecord.count + input.count,
        updatedAt: input.now
      };
      database
        .prepare(
          `INSERT INTO import_throttles (
             tenant_id, workspace_id, user_id, id, source_system, operation,
             window_started_at, window_ms, limit_count, count, updated_at, data
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(tenant_id, workspace_id, user_id, id)
           DO UPDATE SET
             source_system = excluded.source_system,
             operation = excluded.operation,
             window_started_at = excluded.window_started_at,
             window_ms = excluded.window_ms,
             limit_count = excluded.limit_count,
             count = excluded.count,
             updated_at = excluded.updated_at,
             data = excluded.data`
        )
        .run(
          updatedRecord.tenantId,
          updatedRecord.workspaceId,
          updatedRecord.userId,
          updatedRecord.id,
          updatedRecord.sourceSystem,
          updatedRecord.operation,
          updatedRecord.windowStartedAt,
          updatedRecord.windowMs,
          updatedRecord.limit,
          updatedRecord.count,
          updatedRecord.updatedAt,
          serialize(updatedRecord)
        );

    return { allowed: true, retryAfterMs: 0, record: updatedRecord };
  }
};

  const requestThrottles: RequestThrottleRepository = {
    consume(actor, scope, input) {
      assertCanAccess(actor, scope);
      if (!input.keyHash) {
        throw new RepositoryValidationError("Request throttle keyHash required.");
      }
      if (input.count < 0) {
        throw new RepositoryValidationError("Request throttle count must be non-negative.");
      }
      if (input.limit <= 0 || input.windowMs <= 0) {
        throw new RepositoryValidationError("Request throttle limit and windowMs must be positive.");
      }
      const nowMs = Date.parse(input.now);
      if (!Number.isFinite(nowMs)) {
        throw new RepositoryValidationError("Request throttle now must be a valid timestamp.");
      }

      const id = `REQUEST:${input.keyHash}`;
      const existing = selectOneJson<RequestThrottleRecord>(
        database,
        `SELECT data FROM request_throttles
         WHERE tenant_id = ? AND workspace_id = ? AND user_id = ? AND id = ?`,
        [scope.tenantId, scope.workspaceId, scope.userId, id]
      );
      const existingStartedAtMs = existing ? Date.parse(existing.windowStartedAt) : NaN;
      const windowExpired =
        !existing ||
        !Number.isFinite(existingStartedAtMs) ||
        nowMs - existingStartedAtMs >= input.windowMs;
      const baseRecord: RequestThrottleRecord = windowExpired
        ? {
            id,
            tenantId: scope.tenantId,
            workspaceId: scope.workspaceId,
            userId: scope.userId,
            keyHash: input.keyHash,
            windowStartedAt: input.now,
            windowMs: input.windowMs,
            limit: input.limit,
            count: 0,
            updatedAt: input.now
          }
        : {
            ...existing,
            windowMs: input.windowMs,
            limit: input.limit
          };

      if (baseRecord.count + input.count > input.limit) {
        return {
          allowed: false,
          retryAfterMs: Math.max(
            0,
            input.windowMs - (nowMs - Date.parse(baseRecord.windowStartedAt))
          ),
          record: baseRecord
        };
      }

      const updatedRecord = {
        ...baseRecord,
        count: baseRecord.count + input.count,
        updatedAt: input.now
      };
      database
        .prepare(
          `INSERT INTO request_throttles (
             tenant_id, workspace_id, user_id, id, key_hash,
             window_started_at, window_ms, limit_count, count, updated_at, data
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(tenant_id, workspace_id, user_id, id)
           DO UPDATE SET
             key_hash = excluded.key_hash,
             window_started_at = excluded.window_started_at,
             window_ms = excluded.window_ms,
             limit_count = excluded.limit_count,
             count = excluded.count,
             updated_at = excluded.updated_at,
             data = excluded.data`
        )
        .run(
          updatedRecord.tenantId,
          updatedRecord.workspaceId,
          updatedRecord.userId,
          updatedRecord.id,
          updatedRecord.keyHash,
          updatedRecord.windowStartedAt,
          updatedRecord.windowMs,
          updatedRecord.limit,
          updatedRecord.count,
          updatedRecord.updatedAt,
          serialize(updatedRecord)
        );

    return { allowed: true, retryAfterMs: 0, record: updatedRecord };
  },
  list(actor, scope) {
    assertCanAccess(actor, scope);
    return selectJson<RequestThrottleRecord>(
      database,
      `SELECT data FROM request_throttles
       WHERE tenant_id = ? AND workspace_id = ? AND user_id = ?
       ORDER BY updated_at ASC`,
      [scope.tenantId, scope.workspaceId, scope.userId]
    );
  }
};

  const auth: AuthRepository = {
    upsertUser(actor, user) {
      assertAuthTenantAccess(actor, user.tenantId, user.id);
      database
        .prepare(
          `INSERT INTO auth_users (
            tenant_id, id, email, status, created_at, updated_at, data
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(tenant_id, id)
          DO UPDATE SET
            email = excluded.email,
            status = excluded.status,
            updated_at = excluded.updated_at,
            data = excluded.data`
        )
        .run(
          user.tenantId,
          user.id,
          user.email,
          user.status,
          user.createdAt,
          user.updatedAt,
          serialize(user)
        );
      return user;
    },
    getUser(actor, tenantId, userId) {
      assertAuthTenantAccess(actor, tenantId, userId);
      const user = selectOneJson<AuthUser>(
        database,
        `SELECT data FROM auth_users WHERE tenant_id = ? AND id = ?`,
        [tenantId, userId]
      );
      if (!user) throw new RepositoryNotFoundError("Auth user not found.");
      return user;
    },
    upsertMembership(actor, membership) {
      assertCanAccess(actor, membership);
      database
        .prepare(
          `INSERT INTO workspace_memberships (
            tenant_id, workspace_id, user_id, role, status, created_at, updated_at, data
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(tenant_id, workspace_id, user_id)
          DO UPDATE SET
            role = excluded.role,
            status = excluded.status,
            updated_at = excluded.updated_at,
            data = excluded.data`
        )
        .run(
          membership.tenantId,
          membership.workspaceId,
          membership.userId,
          membership.role,
          membership.status,
          membership.createdAt,
          membership.updatedAt,
          serialize(membership)
        );
      return membership;
    },
    getMembership(actor, scope) {
      assertCanAccess(actor, scope);
      const membership = selectOneJson<WorkspaceMembership>(
        database,
        `SELECT data FROM workspace_memberships
         WHERE tenant_id = ? AND workspace_id = ? AND user_id = ?`,
        [scope.tenantId, scope.workspaceId, scope.userId]
      );
      if (!membership) {
        throw new RepositoryNotFoundError("Workspace membership not found.");
      }
      return membership;
    },
    listMemberships(actor, tenantId, userId) {
      assertAuthTenantAccess(actor, tenantId, userId);
      return selectJson<WorkspaceMembership>(
        database,
        `SELECT data FROM workspace_memberships
         WHERE tenant_id = ? AND user_id = ?
         ORDER BY workspace_id`,
        [tenantId, userId]
      );
    },
    upsertSession(actor, session) {
      assertCanAccess(actor, session);
      database
        .prepare(
          `INSERT INTO auth_sessions (
            tenant_id, workspace_id, user_id, id, session_token_hash,
            created_at, expires_at, revoked_at, data
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(tenant_id, workspace_id, user_id, id)
          DO UPDATE SET
            session_token_hash = excluded.session_token_hash,
            expires_at = excluded.expires_at,
            revoked_at = excluded.revoked_at,
            data = excluded.data`
        )
        .run(
          session.tenantId,
          session.workspaceId,
          session.userId,
          session.id,
          session.sessionTokenHash,
          session.createdAt,
          session.expiresAt,
          session.revokedAt ?? null,
          serialize(session)
        );
      return session;
    },
    getSession(actor, sessionId) {
      const session = selectOneJson<AuthSession>(
        database,
        `SELECT data FROM auth_sessions WHERE id = ?`,
        [sessionId]
      );
      if (!session) throw new RepositoryNotFoundError("Auth session not found.");
      assertCanAccess(actor, session);
      return session;
    },
    listSessions(actor, scope) {
      assertCanAccess(actor, scope);
      return selectJson<AuthSession>(
        database,
        `SELECT data FROM auth_sessions
         WHERE tenant_id = ? AND workspace_id = ? AND user_id = ?
         ORDER BY created_at, id`,
        [scope.tenantId, scope.workspaceId, scope.userId]
      );
    },
    revokeSession(actor, sessionId, revokedAt) {
      const session = this.getSession(actor, sessionId);
      const revokedSession = { ...session, revokedAt };
      this.upsertSession(actor, revokedSession);
      return revokedSession;
    },
    upsertPasswordResetToken(actor, token) {
      assertCanAccess(actor, token);
      database
        .prepare(
          `INSERT INTO auth_password_reset_tokens (
            tenant_id, workspace_id, user_id, id, token_hash,
            created_at, expires_at, used_at, data
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(tenant_id, workspace_id, user_id, id)
          DO UPDATE SET
            token_hash = excluded.token_hash,
            expires_at = excluded.expires_at,
            used_at = excluded.used_at,
            data = excluded.data`
        )
        .run(
          token.tenantId,
          token.workspaceId,
          token.userId,
          token.id,
          token.tokenHash,
          token.createdAt,
          token.expiresAt,
          token.usedAt ?? null,
          serialize(token)
        );
      return token;
    },
    getPasswordResetToken(actor, tokenId) {
      const token = selectOneJson<AuthPasswordResetToken>(
        database,
        `SELECT data FROM auth_password_reset_tokens WHERE id = ?`,
        [tokenId]
      );
      if (!token) {
        throw new RepositoryNotFoundError("Password reset token not found.");
      }
      assertCanAccess(actor, token);
      return token;
    },
    listPasswordResetTokens(actor, scope) {
      assertCanAccess(actor, scope);
      return selectJson<AuthPasswordResetToken>(
        database,
        `SELECT data FROM auth_password_reset_tokens
          WHERE tenant_id = ? AND workspace_id = ? AND user_id = ?
          ORDER BY created_at, id`,
        [scope.tenantId, scope.workspaceId, scope.userId]
      );
    },
    markPasswordResetTokenUsed(actor, tokenId, usedAt) {
      const token = this.getPasswordResetToken(actor, tokenId);
      const usedToken = { ...token, usedAt };
      this.upsertPasswordResetToken(actor, usedToken);
      return usedToken;
    },
    getLoginAttemptWindow(actor, scope) {
      assertCanAccess(actor, scope);
      return selectOneJson<AuthLoginAttemptWindow>(
        database,
        `SELECT data FROM auth_login_attempt_windows
         WHERE tenant_id = ? AND workspace_id = ? AND user_id = ?`,
        [scope.tenantId, scope.workspaceId, scope.userId]
      );
    },
    upsertLoginAttemptWindow(actor, window) {
      assertCanAccess(actor, window);
      database
        .prepare(
          `INSERT INTO auth_login_attempt_windows (
            tenant_id, workspace_id, user_id, id, window_started_at,
            window_ms, max_failed_attempts, failed_count, locked_until,
            updated_at, data
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(tenant_id, workspace_id, user_id, id)
          DO UPDATE SET
            window_started_at = excluded.window_started_at,
            window_ms = excluded.window_ms,
            max_failed_attempts = excluded.max_failed_attempts,
            failed_count = excluded.failed_count,
            locked_until = excluded.locked_until,
            updated_at = excluded.updated_at,
            data = excluded.data`
        )
        .run(
          window.tenantId,
          window.workspaceId,
          window.userId,
          window.id,
          window.windowStartedAt,
          window.windowMs,
          window.maxFailedAttempts,
          window.failedCount,
          window.lockedUntil ?? null,
          window.updatedAt,
          serialize(window)
        );
      return window;
    },
    clearLoginAttemptWindow(actor, scope) {
      assertCanAccess(actor, scope);
      database
        .prepare(
          `DELETE FROM auth_login_attempt_windows
           WHERE tenant_id = ? AND workspace_id = ? AND user_id = ?`
        )
        .run(scope.tenantId, scope.workspaceId, scope.userId);
    }
  };

  return {
    repositories: {
      tasks,
      calendarEvents,
      workingHours,
      schedulePlans,
      timeBlocks,
      auditEvents,
      idempotency,
      integrationStates,
      importThrottles,
      requestThrottles,
      auth
    },
    close: () => database.close()
  };
};

export const backupSqliteDatabase = async (
 databasePath: string,
 backupPath: string,
 options: SqliteBackupOptions = {}
): Promise<SqliteBackupResult> => {
  const database = new DatabaseSync(databasePath);
  try {
    database.exec("PRAGMA wal_checkpoint(FULL)");
  } finally {
    database.close();
  }

 await mkdir(dirname(backupPath), { recursive: true });
 if (options.encryptionPassphrase) {
  const plaintextBackupPath = `${backupPath}.plain-${process.pid}-${Date.now()}`;
  try {
   await copyFile(databasePath, plaintextBackupPath);
   const encrypted = await encryptBackupFile(
    plaintextBackupPath,
    backupPath,
    options.encryptionPassphrase
   );
   return {
    backupPath,
    bytes: encrypted.bytes,
    encrypted: {
     algorithm: encrypted.metadata.algorithm,
     kdf: encrypted.metadata.kdf
    }
   };
  } finally {
   await rm(plaintextBackupPath, { force: true });
  }
 }

 await copyFile(databasePath, backupPath);
 const backupStat = await stat(backupPath);
 return { backupPath, bytes: backupStat.size };
};

export const restoreSqliteDatabase = async (
 backupPath: string,
 restorePath: string,
 smokeScope: Scope,
 options: SqliteRestoreOptions = {}
): Promise<SqliteRestoreResult> => {
  if (!options.overwrite && (await pathExists(restorePath))) {
    throw new Error(`Restore target already exists: ${restorePath}`);
  }

 await mkdir(dirname(restorePath), { recursive: true });
 if (options.encryptionPassphrase) {
  await decryptBackupFile(backupPath, restorePath, options.encryptionPassphrase);
 } else {
  await copyFile(backupPath, restorePath);
 }
 const restoredStat = await stat(restorePath);
  const migrationResult = migrateSqliteDatabase(restorePath);
  const exported = exportSqliteWorkspace(restorePath, { kind: "system" }, smokeScope);

  return {
  restorePath,
  bytes: restoredStat.size,
  appliedVersions: migrationResult.appliedVersions,
  ...(options.encryptionPassphrase ? { decrypted: true } : {}),
  smoke: {
      tasks: exported.tasks.length,
      workingHours: exported.workingHours !== undefined,
      schedulePlans: exported.schedulePlans.length
    }
  };
};

export const exportSqliteWorkspace = (
  databasePath: string,
  actor: RepositoryActor,
  scope: Scope
): SqliteWorkspaceExport => {
  assertCanAccess(actor, scope);
  const database = new DatabaseSync(databasePath);
  applyMigrations(database);
  try {
    const workingHours = selectOneJson<WorkingHours>(
      database,
      `SELECT data FROM working_hours
       WHERE tenant_id = ? AND workspace_id = ? AND user_id = ?`,
      [scope.tenantId, scope.workspaceId, scope.userId]
    );
    const exported: SqliteWorkspaceExport = {
      exportedAt: new Date().toISOString(),
      scope,
      tasks: selectJson<SchedulingTask>(
        database,
        `SELECT data FROM tasks
         WHERE tenant_id = ? AND workspace_id = ? AND user_id = ?
         ORDER BY id`,
        [scope.tenantId, scope.workspaceId, scope.userId]
      ),
    calendarEvents: selectJson<CalendarEvent>(
      database,
      `SELECT data FROM calendar_events
       WHERE tenant_id = ? AND workspace_id = ? AND user_id = ?
       ORDER BY start_at, id`,
      [scope.tenantId, scope.workspaceId, scope.userId]
    ),
      schedulePlans: selectJson<SchedulePlan>(
        database,
        `SELECT data FROM schedule_plans
         WHERE tenant_id = ? AND workspace_id = ? AND user_id = ?
         ORDER BY range_start, id`,
        [scope.tenantId, scope.workspaceId, scope.userId]
      ),
      auditEvents: selectJson<AuditEvent>(
        database,
        `SELECT data FROM audit_events
         WHERE tenant_id = ? AND workspace_id = ? AND user_id = ?
         ORDER BY occurred_at, id`,
        [scope.tenantId, scope.workspaceId, scope.userId]
      ),
      idempotencyRecords: selectJson<IdempotencyRecord>(
        database,
        `SELECT data FROM idempotency_keys
         WHERE tenant_id = ? AND workspace_id = ? AND user_id = ?
         ORDER BY created_at, key`,
        [scope.tenantId, scope.workspaceId, scope.userId]
      ),
      integrationStates: selectJson<IntegrationState>(
        database,
        `SELECT data FROM integration_states
         WHERE tenant_id = ? AND workspace_id = ? AND user_id = ?
         ORDER BY source_system, id`,
        [scope.tenantId, scope.workspaceId, scope.userId]
      )
    };
    if (workingHours) exported.workingHours = workingHours;
    return exported;
  } finally {
    database.close();
  }
};

export const deleteSqliteWorkspace = (
  databasePath: string,
  actor: RepositoryActor,
  scope: Scope
): SqliteWorkspaceDeletionResult => {
  assertCanAccess(actor, scope);
  const database = new DatabaseSync(databasePath);
  applyMigrations(database);

  database.exec("BEGIN");
  try {
    const deleted = {
      timeBlocks: deleteScopedRows(database, "time_blocks", scope),
      schedulePlans: deleteScopedRows(database, "schedule_plans", scope),
      tasks: deleteScopedRows(database, "tasks", scope),
      calendarEvents: deleteScopedRows(database, "calendar_events", scope),
      workingHours: deleteScopedRows(database, "working_hours", scope),
      auditEvents: deleteScopedRows(database, "audit_events", scope),
      idempotencyRecords: deleteScopedRows(database, "idempotency_keys", scope),
      integrationStates: deleteScopedRows(database, "integration_states", scope)
    };
    database.exec("COMMIT");
    return { deletedAt: new Date().toISOString(), scope, deleted };
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  } finally {
    database.close();
  }
};

export const cleanupSqliteRetention = (
  databasePath: string,
  actor: RepositoryActor,
  scope: Scope,
  asOf: Date,
  options: { dryRun?: boolean } = {}
): SqliteRetentionCleanupResult => {
  assertCanAccess(actor, scope);
  const cutoffs = new Map(
    calculateRetentionCutoffs(asOf).map((cutoff) => [cutoff.category, cutoff])
  );
  const deleteBefore = (category: RetentionPolicyCategory): string => {
    const cutoff = cutoffs.get(category)?.deleteBefore;
    if (!cutoff) {
      throw new Error(`Retention category has no delete cutoff: ${category}`);
    }
    return cutoff;
  };
  const dryRun = options.dryRun ?? true;
  const database = new DatabaseSync(databasePath);
  applyMigrations(database);

  const eligible: Partial<Record<RetentionPolicyCategory, number>> = {
    SCHEDULE_PLAN_HISTORY: countScopedRowsBefore(
      database,
      "schedule_plans",
      "range_end",
      scope,
      deleteBefore("SCHEDULE_PLAN_HISTORY")
    ),
    IDEMPOTENCY_RECORD: countScopedRowsBefore(
      database,
      "idempotency_keys",
      "created_at",
      scope,
      deleteBefore("IDEMPOTENCY_RECORD")
    ),
  AUTH_SESSION: countAuthSessionsBefore(
    database,
    scope,
    deleteBefore("AUTH_SESSION")
  ),
    AUTH_PASSWORD_RESET_TOKEN: countAuthPasswordResetTokensBefore(
      database,
      scope,
      deleteBefore("AUTH_PASSWORD_RESET_TOKEN")
    ),
    AUTH_LOGIN_ATTEMPT_WINDOW: countAuthLoginAttemptWindowsBefore(
      database,
      scope,
      deleteBefore("AUTH_LOGIN_ATTEMPT_WINDOW")
    ),
    IMPORT_THROTTLE_WINDOW: countScopedRowsBefore(
      database,
      "import_throttles",
      "updated_at",
      scope,
      deleteBefore("IMPORT_THROTTLE_WINDOW")
    ),
    INTEGRATION_SYNC_METADATA: countInactiveIntegrationStatesBefore(
      database,
      scope,
      deleteBefore("INTEGRATION_SYNC_METADATA")
    )
  };
  const reviewDue: Partial<Record<RetentionPolicyCategory, number>> = {
    AUDIT_EVENT: countScopedRowsBefore(
      database,
      "audit_events",
      "occurred_at",
      scope,
      deleteBefore("AUDIT_EVENT")
    )
  };
  const deleted: Partial<Record<RetentionPolicyCategory, number>> = {};

  try {
    if (!dryRun) {
      database.exec("BEGIN");
      try {
        deleted.SCHEDULE_PLAN_HISTORY = deleteExpiredSchedulePlans(
          database,
          scope,
          deleteBefore("SCHEDULE_PLAN_HISTORY")
        );
            deleted.IDEMPOTENCY_RECORD = deleteScopedRowsBefore(
              database,
              "idempotency_keys",
              "created_at",
              scope,
              deleteBefore("IDEMPOTENCY_RECORD")
            );
  deleted.AUTH_SESSION = deleteAuthSessionsBefore(
    database,
    scope,
    deleteBefore("AUTH_SESSION")
  );
      deleted.AUTH_PASSWORD_RESET_TOKEN = deleteAuthPasswordResetTokensBefore(
        database,
        scope,
        deleteBefore("AUTH_PASSWORD_RESET_TOKEN")
      );
      deleted.AUTH_LOGIN_ATTEMPT_WINDOW = deleteAuthLoginAttemptWindowsBefore(
        database,
        scope,
        deleteBefore("AUTH_LOGIN_ATTEMPT_WINDOW")
      );
      deleted.IMPORT_THROTTLE_WINDOW = deleteScopedRowsBefore(
              database,
              "import_throttles",
          "updated_at",
          scope,
          deleteBefore("IMPORT_THROTTLE_WINDOW")
        );
        deleted.INTEGRATION_SYNC_METADATA = deleteInactiveIntegrationStatesBefore(
          database,
          scope,
          deleteBefore("INTEGRATION_SYNC_METADATA")
        );
        database.exec("COMMIT");
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
    }

    return {
      evaluatedAt: asOf.toISOString(),
      scope,
      dryRun,
      eligible,
      deleted,
      reviewDue
    };
  } finally {
    database.close();
  }
};

const applyMigrations = (database: DatabaseSync): number[] => {
  database.exec(`
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL
);
`);
  const applied = new Set(
    selectRows(database, "SELECT version FROM schema_migrations").map((row) =>
      Number(row.version)
    )
  );
  const appliedVersions: number[] = [];

  for (const migration of migrations) {
    if (applied.has(migration.version)) continue;
    database.exec("BEGIN");
    try {
      database.exec(migration.sql);
      database
        .prepare(
          "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)"
        )
        .run(migration.version, migration.name, new Date().toISOString());
      database.exec("COMMIT");
      appliedVersions.push(migration.version);
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  }

  return appliedVersions;
};

const upsertPlan = (database: DatabaseSync, plan: SchedulePlan): void => {
  database.exec("BEGIN");
  try {
    database
      .prepare(
        `INSERT INTO schedule_plans (
           tenant_id, workspace_id, user_id, id, range_start, range_end, status, data
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (tenant_id, workspace_id, user_id, id)
         DO UPDATE SET range_start = excluded.range_start,
                       range_end = excluded.range_end,
                       status = excluded.status,
                       data = excluded.data`
      )
      .run(
        plan.tenantId,
        plan.workspaceId,
        plan.userId,
        plan.id,
        plan.rangeStart,
        plan.rangeEnd,
        plan.status,
        serialize(plan)
      );
    database
      .prepare(
        `DELETE FROM time_blocks
         WHERE tenant_id = ? AND workspace_id = ? AND user_id = ? AND plan_id = ?`
      )
      .run(plan.tenantId, plan.workspaceId, plan.userId, plan.id);
    const insertBlock = database.prepare(
      `INSERT INTO time_blocks (
         tenant_id, workspace_id, user_id, id, plan_id,
         task_id, start_at, end_at, status, locked, data
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const block of plan.blocks) {
      insertBlock.run(
        block.tenantId,
        block.workspaceId,
        block.userId,
        block.id,
        plan.id,
        block.taskId,
        block.start,
        block.end,
        block.status,
        block.locked ? 1 : 0,
        serialize(block)
      );
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
};

const getPlan = (
  database: DatabaseSync,
  actor: RepositoryActor,
  planId: string
): SchedulePlan => {
  const row = selectScopedOrForbidden(
    database,
    actor,
    "schedule_plans",
    "id",
    planId,
    "Schedule plan not found."
  );
  if (!row) throw new RepositoryNotFoundError("Schedule plan not found.");
  return parseJsonColumn<SchedulePlan>(row);
};

const getBlock = (
  database: DatabaseSync,
  actor: RepositoryActor,
  blockId: string
): TimeBlock => parseJsonColumn<TimeBlock>(getBlockRow(database, actor, blockId));

const getBlockRow = (
  database: DatabaseSync,
  actor: RepositoryActor,
  blockId: string
): Row => {
  const row = selectScopedOrForbidden(
    database,
    actor,
    "time_blocks",
    "id",
    blockId,
    "Time block not found.",
    "data, plan_id"
  );
  if (!row) throw new RepositoryNotFoundError("Time block not found.");
  return row;
};

const selectScopedOrForbidden = (
  database: DatabaseSync,
  actor: RepositoryActor,
  table: string,
  idColumn: string,
  id: string,
  notFoundMessage: string,
  columns = "data"
): Row | undefined => {
  if (actor.kind === "system") {
    return selectOneRow(database, `SELECT ${columns} FROM ${table} WHERE ${idColumn} = ?`, [
      id
    ]);
  }
  const scoped = selectOneRow(
    database,
    `SELECT ${columns} FROM ${table}
     WHERE tenant_id = ? AND workspace_id = ? AND user_id = ? AND ${idColumn} = ?`,
    [actor.tenantId, actor.workspaceId, actor.userId, id]
  );
  if (scoped) return scoped;
  const exists = selectOneRow(database, `SELECT ${columns} FROM ${table} WHERE ${idColumn} = ?`, [
    id
  ]);
  if (exists) throw new RepositoryForbiddenError();
  throw new RepositoryNotFoundError(notFoundMessage);
};

const selectJson = <T>(
  database: DatabaseSync,
  sql: string,
  params: unknown[]
): T[] => selectRows(database, sql, params).map((row) => parseJsonColumn<T>(row));

const selectOneJson = <T>(
  database: DatabaseSync,
  sql: string,
  params: unknown[]
): T | undefined => {
  const row = selectOneRow(database, sql, params);
  return row ? parseJsonColumn<T>(row) : undefined;
};

type Row = Record<string, unknown>;

const selectRows = (
  database: DatabaseSync,
  sql: string,
  params: unknown[] = []
): Row[] => database.prepare(sql).all(...params) as Row[];

const selectOneRow = (
  database: DatabaseSync,
  sql: string,
  params: unknown[] = []
): Row | undefined => database.prepare(sql).get(...params) as Row | undefined;

const deleteScopedRows = (
  database: DatabaseSync,
  table: string,
  scope: Scope
): number => {
  const result = database
    .prepare(
      `DELETE FROM ${table}
       WHERE tenant_id = ? AND workspace_id = ? AND user_id = ?`
    )
    .run(scope.tenantId, scope.workspaceId, scope.userId);
  return Number(result.changes);
};

const deleteTenantUserRows = (
  database: DatabaseSync,
  table: string,
  scope: Scope
): number => {
  const result = database
    .prepare(`DELETE FROM ${table} WHERE tenant_id = ? AND user_id = ?`)
    .run(scope.tenantId, scope.userId);
  return Number(result.changes);
};

const countScopedRowsBefore = (
  database: DatabaseSync,
  table: string,
  column: string,
  scope: Scope,
  deleteBefore: string
): number => {
  const row = database
    .prepare(
      `SELECT COUNT(*) AS count FROM ${table}
       WHERE tenant_id = ? AND workspace_id = ? AND user_id = ? AND ${column} < ?`
    )
    .get(scope.tenantId, scope.workspaceId, scope.userId, deleteBefore) as
    | { count: number }
    | undefined;
  return Number(row?.count ?? 0);
};

const deleteScopedRowsBefore = (
  database: DatabaseSync,
  table: string,
  column: string,
  scope: Scope,
  deleteBefore: string
): number => {
  const result = database
    .prepare(
      `DELETE FROM ${table}
       WHERE tenant_id = ? AND workspace_id = ? AND user_id = ? AND ${column} < ?`
    )
    .run(scope.tenantId, scope.workspaceId, scope.userId, deleteBefore);
  return Number(result.changes);
};

const countAuthSessionsBefore = (
  database: DatabaseSync,
  scope: Scope,
  deleteBefore: string
): number => {
  const row = database
    .prepare(
      `SELECT COUNT(*) count FROM auth_sessions
       WHERE tenant_id = ?
         AND workspace_id = ?
         AND user_id = ?
         AND COALESCE(revoked_at, expires_at) < ?`
    )
    .get(scope.tenantId, scope.workspaceId, scope.userId, deleteBefore) as
    | { count: number }
    | undefined;
  return Number(row?.count ?? 0);
};

const deleteAuthSessionsBefore = (
  database: DatabaseSync,
  scope: Scope,
  deleteBefore: string
): number => {
  const result = database
    .prepare(
      `DELETE FROM auth_sessions
       WHERE tenant_id = ?
         AND workspace_id = ?
         AND user_id = ?
         AND COALESCE(revoked_at, expires_at) < ?`
    )
    .run(scope.tenantId, scope.workspaceId, scope.userId, deleteBefore);
  return Number(result.changes);
};

const countAuthPasswordResetTokensBefore = (
  database: DatabaseSync,
  scope: Scope,
  deleteBefore: string
): number => {
  const row = database
    .prepare(
      `SELECT COUNT(*) count FROM auth_password_reset_tokens
        WHERE tenant_id = ?
          AND workspace_id = ?
          AND user_id = ?
          AND COALESCE(used_at, expires_at) < ?`
    )
    .get(scope.tenantId, scope.workspaceId, scope.userId, deleteBefore) as
    | { count: number }
    | undefined;
  return Number(row?.count ?? 0);
};

const deleteAuthPasswordResetTokensBefore = (
  database: DatabaseSync,
  scope: Scope,
  deleteBefore: string
): number => {
  const result = database
    .prepare(
      `DELETE FROM auth_password_reset_tokens
        WHERE tenant_id = ?
          AND workspace_id = ?
          AND user_id = ?
          AND COALESCE(used_at, expires_at) < ?`
    )
    .run(scope.tenantId, scope.workspaceId, scope.userId, deleteBefore);
  return Number(result.changes);
};

const countAuthLoginAttemptWindowsBefore = (
  database: DatabaseSync,
  scope: Scope,
  deleteBefore: string
): number => {
  const row = database
    .prepare(
      `SELECT COUNT(*) count FROM auth_login_attempt_windows
       WHERE tenant_id = ?
       AND workspace_id = ?
       AND user_id = ?
       AND COALESCE(locked_until, updated_at) < ?`
    )
    .get(scope.tenantId, scope.workspaceId, scope.userId, deleteBefore) as
    | { count: number }
    | undefined;
  return Number(row?.count ?? 0);
};

const deleteAuthLoginAttemptWindowsBefore = (
  database: DatabaseSync,
  scope: Scope,
  deleteBefore: string
): number => {
  const result = database
    .prepare(
      `DELETE FROM auth_login_attempt_windows
       WHERE tenant_id = ?
       AND workspace_id = ?
       AND user_id = ?
       AND COALESCE(locked_until, updated_at) < ?`
    )
    .run(scope.tenantId, scope.workspaceId, scope.userId, deleteBefore);
  return Number(result.changes);
};

const countInactiveIntegrationStatesBefore = (
  database: DatabaseSync,
  scope: Scope,
  deleteBefore: string
): number => {
  const row = database
    .prepare(
      `SELECT COUNT(*) AS count FROM integration_states
       WHERE tenant_id = ? AND workspace_id = ? AND user_id = ?
       AND status != 'CONNECTED' AND updated_at < ?`
    )
    .get(scope.tenantId, scope.workspaceId, scope.userId, deleteBefore) as
    | { count: number }
    | undefined;
  return Number(row?.count ?? 0);
};

const deleteInactiveIntegrationStatesBefore = (
  database: DatabaseSync,
  scope: Scope,
  deleteBefore: string
): number => {
  const result = database
    .prepare(
      `DELETE FROM integration_states
       WHERE tenant_id = ? AND workspace_id = ? AND user_id = ?
       AND status != 'CONNECTED' AND updated_at < ?`
    )
    .run(scope.tenantId, scope.workspaceId, scope.userId, deleteBefore);
  return Number(result.changes);
};

const deleteExpiredSchedulePlans = (
  database: DatabaseSync,
  scope: Scope,
  deleteBefore: string
): number => {
  const expiredPlanIds = selectRows(
    database,
    `SELECT id FROM schedule_plans
     WHERE tenant_id = ? AND workspace_id = ? AND user_id = ? AND range_end < ?`,
    [scope.tenantId, scope.workspaceId, scope.userId, deleteBefore]
  ).map((row) => String(row.id));

  for (const planId of expiredPlanIds) {
    database
      .prepare(
        `DELETE FROM time_blocks
         WHERE tenant_id = ? AND workspace_id = ? AND user_id = ? AND plan_id = ?`
      )
      .run(scope.tenantId, scope.workspaceId, scope.userId, planId);
  }

  const result = database
    .prepare(
      `DELETE FROM schedule_plans
       WHERE tenant_id = ? AND workspace_id = ? AND user_id = ? AND range_end < ?`
    )
    .run(scope.tenantId, scope.workspaceId, scope.userId, deleteBefore);
  return Number(result.changes);
};

const pathExists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const parseJsonColumn = <T>(row: Row): T => {
  const data = row.data;
  if (typeof data !== "string") {
    throw new RepositoryNotFoundError("Repository row payload not found.");
  }
  return JSON.parse(data) as T;
};

const requireStringColumn = (row: Row, column: string, message: string): string => {
  const value = row[column];
  if (typeof value !== "string") throw new RepositoryNotFoundError(message);
  return value;
};

const serialize = (value: unknown): string => JSON.stringify(value);

const assertCanAccess = (actor: RepositoryActor, scope: Scope): void => {
  if (actor.kind === "system") return;
  if (!matchesScope(actor, scope)) throw new RepositoryForbiddenError();
};

const assertAuthTenantAccess = (
  actor: RepositoryActor,
  tenantId: string,
  userId: string
): void => {
  if (actor.kind === "system") return;
  if (actor.tenantId !== tenantId || actor.userId !== userId) {
    throw new RepositoryForbiddenError();
  }
};

const assertCalendarEventScope = (event: CalendarEvent, scope: Scope): void => {
  if (event.tenantId !== scope.tenantId || event.userId !== scope.userId) {
    throw new RepositoryForbiddenError("Calendar event does not match repository scope.");
  }
};

const assertWorkingHoursScope = (workingHours: WorkingHours, scope: Scope): void => {
  if (workingHours.userId !== scope.userId) {
    throw new RepositoryForbiddenError("Working hours do not match repository scope.");
  }
};

const applyBlockAction = (
  block: TimeBlock,
  action: "lock" | "unlock" | "complete" | "missed"
): TimeBlock => {
  switch (action) {
    case "lock":
      return { ...block, locked: true, status: "LOCKED" };
    case "unlock":
      return { ...block, locked: false, status: "ACCEPTED" };
    case "complete":
      return { ...block, status: "COMPLETED" };
    case "missed":
      return { ...block, status: "MISSED" };
  }
};
