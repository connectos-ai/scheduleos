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
import type { PostgresQueryClient } from "./postgres.js";
import {
 RepositoryForbiddenError,
 RepositoryNotFoundError,
 RepositoryValidationError,
  applyBlockTimePatch,
  matchesScope,
  type ImportThrottleConsumeInput,
  type ImportThrottleConsumeResult,
  type RequestThrottleConsumeInput,
  type RequestThrottleConsumeResult,
  type RepositoryActor,
  type Scope
} from "./repositories.js";
import {
 calculateRetentionCutoffs,
 type RetentionPolicyCategory
} from "./retention-policy.js";

export interface AsyncTaskRepository {
  upsert(actor: RepositoryActor, task: SchedulingTask): Promise<SchedulingTask>;
  get(actor: RepositoryActor, scope: Scope, taskId: string): Promise<SchedulingTask>;
  list(actor: RepositoryActor, scope: Scope): Promise<SchedulingTask[]>;
  delete(actor: RepositoryActor, scope: Scope, taskId: string): Promise<void>;
}

export interface AsyncCalendarEventRepository {
  upsert(
    actor: RepositoryActor,
    event: CalendarEvent,
    scope: Scope
  ): Promise<CalendarEvent>;
  get(
    actor: RepositoryActor,
    scope: Scope,
    eventId: string
  ): Promise<CalendarEvent>;
  listForSchedule(
    actor: RepositoryActor,
    scope: Scope
  ): Promise<CalendarEvent[]>;
  delete(actor: RepositoryActor, scope: Scope, eventId: string): Promise<void>;
}

export interface AsyncWorkingHoursRepository {
  put(
    actor: RepositoryActor,
    scope: Scope,
    workingHours: WorkingHours
  ): Promise<WorkingHours>;
  get(actor: RepositoryActor, scope: Scope): Promise<WorkingHours | undefined>;
}

export interface AsyncSchedulePlanRepository {
  upsert(actor: RepositoryActor, plan: SchedulePlan): Promise<SchedulePlan>;
  get(actor: RepositoryActor, planId: string): Promise<SchedulePlan>;
  list(actor: RepositoryActor, scope: Scope): Promise<SchedulePlan[]>;
  replace(actor: RepositoryActor, plan: SchedulePlan): Promise<SchedulePlan>;
}

export interface AsyncTimeBlockRepository {
  get(actor: RepositoryActor, blockId: string): Promise<TimeBlock>;
  updateTime(
    actor: RepositoryActor,
    blockId: string,
    patch: { start?: string; end?: string }
  ): Promise<TimeBlock>;
  updateStatus(
    actor: RepositoryActor,
    blockId: string,
    action: "lock" | "unlock" | "complete" | "missed"
  ): Promise<TimeBlock>;
}

export interface AsyncAuditEventRepository {
  append(actor: RepositoryActor, event: AuditEvent): Promise<AuditEvent>;
  list(actor: RepositoryActor, scope: Scope): Promise<AuditEvent[]>;
}

export interface AsyncIdempotencyRepository {
  reserve(
    actor: RepositoryActor,
    record: IdempotencyRecord
  ): Promise<{ record: IdempotencyRecord; created: boolean }>;
  get(
    actor: RepositoryActor,
    scope: Scope,
    key: string
  ): Promise<IdempotencyRecord | undefined>;
  complete(
    actor: RepositoryActor,
    scope: Scope,
    key: string,
    update: Pick<
      IdempotencyRecord,
      "status" | "completedAt" | "responseResourceId"
    >
  ): Promise<IdempotencyRecord>;
}

export interface AsyncIntegrationStateRepository {
  upsert(
    actor: RepositoryActor,
    state: IntegrationState
  ): Promise<IntegrationState>;
  get(
    actor: RepositoryActor,
    scope: Scope,
    id: string
  ): Promise<IntegrationState>;
  list(actor: RepositoryActor, scope: Scope): Promise<IntegrationState[]>;
}

export interface AsyncAuthRepository {
  upsertUser(actor: RepositoryActor, user: AuthUser): Promise<AuthUser>;
  getUser(
    actor: RepositoryActor,
    tenantId: string,
    userId: string
  ): Promise<AuthUser>;
  upsertMembership(
    actor: RepositoryActor,
    membership: WorkspaceMembership
  ): Promise<WorkspaceMembership>;
  getMembership(
    actor: RepositoryActor,
    scope: Scope
  ): Promise<WorkspaceMembership>;
  listMemberships(
    actor: RepositoryActor,
    tenantId: string,
    userId: string
  ): Promise<WorkspaceMembership[]>;
  upsertSession(
    actor: RepositoryActor,
    session: AuthSession
  ): Promise<AuthSession>;
  getSession(actor: RepositoryActor, sessionId: string): Promise<AuthSession>;
  listSessions(actor: RepositoryActor, scope: Scope): Promise<AuthSession[]>;
  revokeSession(
    actor: RepositoryActor,
    sessionId: string,
    revokedAt: string
  ): Promise<AuthSession>;
  upsertPasswordResetToken(
    actor: RepositoryActor,
    token: AuthPasswordResetToken
  ): Promise<AuthPasswordResetToken>;
  getPasswordResetToken(
    actor: RepositoryActor,
    tokenId: string
  ): Promise<AuthPasswordResetToken>;
  listPasswordResetTokens(
    actor: RepositoryActor,
    scope: Scope
  ): Promise<AuthPasswordResetToken[]>;
  markPasswordResetTokenUsed(
    actor: RepositoryActor,
    tokenId: string,
    usedAt: string
  ): Promise<AuthPasswordResetToken>;
  getLoginAttemptWindow(
    actor: RepositoryActor,
    scope: Scope
  ): Promise<AuthLoginAttemptWindow | undefined>;
  upsertLoginAttemptWindow(
    actor: RepositoryActor,
    window: AuthLoginAttemptWindow
  ): Promise<AuthLoginAttemptWindow>;
  clearLoginAttemptWindow(actor: RepositoryActor, scope: Scope): Promise<void>;
}

export interface AsyncImportThrottleRepository {
  consume(
    actor: RepositoryActor,
    scope: Scope,
    input: ImportThrottleConsumeInput
  ): Promise<ImportThrottleConsumeResult>;
}

export interface AsyncRequestThrottleRepository {
  consume(
    actor: RepositoryActor,
    scope: Scope,
    input: RequestThrottleConsumeInput
  ): Promise<RequestThrottleConsumeResult>;
  list(actor: RepositoryActor, scope: Scope): Promise<RequestThrottleRecord[]>;
}

export interface PostgresRepositorySlice {
  tasks: AsyncTaskRepository;
  calendarEvents: AsyncCalendarEventRepository;
  workingHours: AsyncWorkingHoursRepository;
  schedulePlans: AsyncSchedulePlanRepository;
  timeBlocks: AsyncTimeBlockRepository;
  auditEvents: AsyncAuditEventRepository;
  idempotency: AsyncIdempotencyRepository;
  integrationStates: AsyncIntegrationStateRepository;
  importThrottles: AsyncImportThrottleRepository;
  requestThrottles: AsyncRequestThrottleRepository;
  auth: AsyncAuthRepository;
}

export interface PostgresRetentionCleanupResult {
 evaluatedAt: string;
 scope: Scope;
 dryRun: boolean;
 eligible: Partial<Record<RetentionPolicyCategory, number>>;
 deleted: Partial<Record<RetentionPolicyCategory, number>>;
 reviewDue: Partial<Record<RetentionPolicyCategory, number>>;
}

export function createPostgresRepositorySlice(
 client: PostgresQueryClient
): PostgresRepositorySlice {
  return {
    tasks: createPostgresTaskRepository(client),
    calendarEvents: createPostgresCalendarEventRepository(client),
    workingHours: createPostgresWorkingHoursRepository(client),
    schedulePlans: createPostgresSchedulePlanRepository(client),
    timeBlocks: createPostgresTimeBlockRepository(client),
    auditEvents: createPostgresAuditEventRepository(client),
    idempotency: createPostgresIdempotencyRepository(client),
    integrationStates: createPostgresIntegrationStateRepository(client),
    importThrottles: createPostgresImportThrottleRepository(client),
    requestThrottles: createPostgresRequestThrottleRepository(client),
    auth: createPostgresAuthRepository(client)
  };
}

export async function cleanupPostgresRetention(
 client: PostgresQueryClient,
 actor: RepositoryActor,
 scope: Scope,
 asOf: Date,
 options: { dryRun?: boolean } = {}
): Promise<PostgresRetentionCleanupResult> {
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
 const eligible: Partial<Record<RetentionPolicyCategory, number>> = {
  SCHEDULE_PLAN_HISTORY: await countPostgresScopedRowsBefore(
   client,
   "schedule_plans",
   "range_end",
   scope,
   deleteBefore("SCHEDULE_PLAN_HISTORY")
  ),
    IDEMPOTENCY_RECORD: await countPostgresScopedRowsBefore(
      client,
      "idempotency_keys",
      "created_at",
      scope,
      deleteBefore("IDEMPOTENCY_RECORD")
    ),
  AUTH_SESSION: await countPostgresAuthSessionsBefore(
    client,
    scope,
    deleteBefore("AUTH_SESSION")
  ),
    AUTH_PASSWORD_RESET_TOKEN: await countPostgresAuthPasswordResetTokensBefore(
      client,
      scope,
      deleteBefore("AUTH_PASSWORD_RESET_TOKEN")
    ),
    AUTH_LOGIN_ATTEMPT_WINDOW: await countPostgresAuthLoginAttemptWindowsBefore(
      client,
      scope,
      deleteBefore("AUTH_LOGIN_ATTEMPT_WINDOW")
    ),
    IMPORT_THROTTLE_WINDOW: await countPostgresScopedRowsBefore(
      client,
      "import_throttles",
   "updated_at",
   scope,
   deleteBefore("IMPORT_THROTTLE_WINDOW")
  ),
  INTEGRATION_SYNC_METADATA: await countPostgresInactiveIntegrationStatesBefore(
   client,
   scope,
   deleteBefore("INTEGRATION_SYNC_METADATA")
  )
 };
 const reviewDue: Partial<Record<RetentionPolicyCategory, number>> = {
  AUDIT_EVENT: await countPostgresScopedRowsBefore(
   client,
   "audit_events",
   "occurred_at",
   scope,
   deleteBefore("AUDIT_EVENT")
  )
 };
 const deleted: Partial<Record<RetentionPolicyCategory, number>> = {};

 if (!dryRun) {
  await client.query("BEGIN");
  try {
   deleted.SCHEDULE_PLAN_HISTORY = await deleteExpiredPostgresSchedulePlans(
    client,
    scope,
    deleteBefore("SCHEDULE_PLAN_HISTORY")
   );
      deleted.IDEMPOTENCY_RECORD = await deletePostgresScopedRowsBefore(
        client,
        "idempotency_keys",
        "created_at",
        scope,
        deleteBefore("IDEMPOTENCY_RECORD")
      );
  deleted.AUTH_SESSION = await deletePostgresAuthSessionsBefore(
    client,
    scope,
    deleteBefore("AUTH_SESSION")
  );
  deleted.AUTH_PASSWORD_RESET_TOKEN =
      await deletePostgresAuthPasswordResetTokensBefore(
        client,
        scope,
        deleteBefore("AUTH_PASSWORD_RESET_TOKEN")
      );
      deleted.AUTH_LOGIN_ATTEMPT_WINDOW =
        await deletePostgresAuthLoginAttemptWindowsBefore(
          client,
          scope,
          deleteBefore("AUTH_LOGIN_ATTEMPT_WINDOW")
        );
      deleted.IMPORT_THROTTLE_WINDOW = await deletePostgresScopedRowsBefore(
        client,
        "import_throttles",
    "updated_at",
    scope,
    deleteBefore("IMPORT_THROTTLE_WINDOW")
   );
   deleted.INTEGRATION_SYNC_METADATA =
    await deletePostgresInactiveIntegrationStatesBefore(
     client,
     scope,
     deleteBefore("INTEGRATION_SYNC_METADATA")
    );
   await client.query("COMMIT");
  } catch (error) {
   await client.query("ROLLBACK");
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
}

export function createPostgresTaskRepository(
 client: PostgresQueryClient
): AsyncTaskRepository {
  return {
    async upsert(actor, task) {
      assertCanAccess(actor, task);

      await client.query(
        `
        INSERT INTO tasks (
          tenant_id,
          workspace_id,
          user_id,
          id,
          owner_id,
          status,
          priority,
          deadline,
          created_at,
          updated_at,
          version,
          data
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
        ON CONFLICT (tenant_id, workspace_id, user_id, id)
        DO UPDATE SET
          owner_id = excluded.owner_id,
          status = excluded.status,
          priority = excluded.priority,
          deadline = excluded.deadline,
          updated_at = excluded.updated_at,
          version = excluded.version,
          data = excluded.data
        `,
        [
          task.tenantId,
          task.workspaceId,
          task.userId,
          task.id,
          task.ownerId,
          task.schedulingEligible ? "ACTIVE" : "INACTIVE",
          task.priority,
          task.deadline ?? null,
          task.createdAt,
          task.updatedAt,
          1,
          JSON.stringify(task)
        ]
      );

      return task;
    },

    async get(actor, scope, taskId) {
      assertCanAccess(actor, scope);

      const result = await client.query(
        `
          SELECT data
          FROM tasks
          WHERE tenant_id = $1
            AND workspace_id = $2
            AND user_id = $3
            AND id = $4
        `,
        [scope.tenantId, scope.workspaceId, scope.userId, taskId]
      );

      const row = result.rows[0];
      if (!row) throw new RepositoryNotFoundError("Task not found.");
      return readTaskRow(row);
    },

    async list(actor, scope) {
      assertCanAccess(actor, scope);

      const result = await client.query(
        `
        SELECT data
        FROM tasks
        WHERE tenant_id = $1
          AND workspace_id = $2
          AND user_id = $3
        ORDER BY id
        `,
        [scope.tenantId, scope.workspaceId, scope.userId]
      );

      return result.rows.map((row) => readTaskRow(row));
    },

    async delete(actor, scope, taskId) {
      assertCanAccess(actor, scope);

      const result = await client.query(
        `
          DELETE FROM tasks
          WHERE tenant_id = $1
            AND workspace_id = $2
            AND user_id = $3
            AND id = $4
        `,
        [scope.tenantId, scope.workspaceId, scope.userId, taskId]
      );

      if (result.rowCount === 0) throw new RepositoryNotFoundError("Task not found.");
    }
  };
}

export function createPostgresCalendarEventRepository(
  client: PostgresQueryClient
): AsyncCalendarEventRepository {
  return {
    async upsert(actor, event, scope) {
      assertCanAccess(actor, scope);
      assertCalendarEventScope(event, scope);

      await client.query(
        `
        INSERT INTO calendar_events (
          tenant_id,
          workspace_id,
          user_id,
          id,
          calendar_id,
          start_at,
          end_at,
          busy_status,
          privacy_level,
          version,
          data
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
        ON CONFLICT (tenant_id, workspace_id, user_id, id)
        DO UPDATE SET
          calendar_id = excluded.calendar_id,
          start_at = excluded.start_at,
          end_at = excluded.end_at,
          busy_status = excluded.busy_status,
          privacy_level = excluded.privacy_level,
          version = excluded.version,
          data = excluded.data
        `,
        [
          event.tenantId,
          event.workspaceId,
          event.userId,
          event.id,
          event.calendarId,
          event.start,
          event.end,
          event.busyStatus,
          event.privacyLevel,
          event.version,
          JSON.stringify(event)
        ]
      );

      return event;
    },

    async get(actor, scope, eventId) {
      assertCanAccess(actor, scope);

      const result = await client.query(
        `
        SELECT data
        FROM calendar_events
        WHERE tenant_id = $1
          AND workspace_id = $2
          AND user_id = $3
          AND id = $4
        `,
        [scope.tenantId, scope.workspaceId, scope.userId, eventId]
      );

      const row = result.rows[0];
      if (!row) throw new RepositoryNotFoundError("Calendar event not found.");
      return readCalendarEventRow(row);
    },

    async listForSchedule(actor, scope) {
      assertCanAccess(actor, scope);

      const result = await client.query(
        `
        SELECT data
        FROM calendar_events
        WHERE tenant_id = $1
          AND workspace_id = $2
          AND user_id = $3
        ORDER BY start_at, id
        `,
        [scope.tenantId, scope.workspaceId, scope.userId]
      );

      return result.rows.map((row) => readCalendarEventRow(row));
    },

    async delete(actor, scope, eventId) {
      assertCanAccess(actor, scope);

      const result = await client.query(
        `
        DELETE FROM calendar_events
        WHERE tenant_id = $1
          AND workspace_id = $2
          AND user_id = $3
          AND id = $4
        `,
        [scope.tenantId, scope.workspaceId, scope.userId, eventId]
      );

      if (result.rowCount === 0) {
        throw new RepositoryNotFoundError("Calendar event not found.");
      }
    }
  };
}

export function createPostgresWorkingHoursRepository(
  client: PostgresQueryClient
): AsyncWorkingHoursRepository {
  return {
    async put(actor, scope, workingHours) {
      assertCanAccess(actor, scope);
      assertWorkingHoursScope(workingHours, scope);

      await client.query(
        `
        INSERT INTO working_hours (
          tenant_id,
          workspace_id,
          user_id,
          timezone,
          version,
          data
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb)
        ON CONFLICT (tenant_id, workspace_id, user_id)
        DO UPDATE SET
          timezone = excluded.timezone,
          updated_at = now(),
          version = excluded.version,
          data = excluded.data
        `,
        [
          scope.tenantId,
          scope.workspaceId,
          scope.userId,
          workingHours.timezone,
          1,
          JSON.stringify(workingHours)
        ]
      );

      return workingHours;
    },

    async get(actor, scope) {
      assertCanAccess(actor, scope);

      const result = await client.query(
        `
        SELECT data
        FROM working_hours
        WHERE tenant_id = $1
          AND workspace_id = $2
          AND user_id = $3
        `,
        [scope.tenantId, scope.workspaceId, scope.userId]
      );

      const row = result.rows[0];

      return row ? readWorkingHoursRow(row) : undefined;
    }
  };
}

export function createPostgresSchedulePlanRepository(
  client: PostgresQueryClient
): AsyncSchedulePlanRepository {
  return {
    async upsert(actor, plan) {
      assertCanAccess(actor, plan);
      await upsertSchedulePlan(client, plan);
      return plan;
    },

    async get(actor, planId) {
      const plan = await getSchedulePlan(client, actor, planId);
      assertCanAccess(actor, plan);
      return plan;
    },

    async list(actor, scope) {
      assertCanAccess(actor, scope);
      const result = await client.query(
        `
        SELECT data
        FROM schedule_plans
        WHERE tenant_id = $1
          AND workspace_id = $2
          AND user_id = $3
        ORDER BY range_start, id
        `,
        [scope.tenantId, scope.workspaceId, scope.userId]
      );
      return result.rows.map((row) => readSchedulePlanRow(row));
    },

    async replace(actor, plan) {
      assertCanAccess(actor, plan);
      await upsertSchedulePlan(client, plan);
      return plan;
    }
  };
}

export function createPostgresTimeBlockRepository(
  client: PostgresQueryClient
): AsyncTimeBlockRepository {
  return {
    async get(actor, blockId) {
      return getTimeBlock(client, actor, blockId);
    },

    async updateTime(actor, blockId, patch) {
      const block = await getTimeBlock(client, actor, blockId);
      const updated = applyBlockTimePatch(block, patch);

      await client.query(
        `
        UPDATE time_blocks
        SET start_at = $1,
            end_at = $2,
            data = $3::jsonb
        WHERE tenant_id = $4
          AND workspace_id = $5
          AND user_id = $6
          AND id = $7
        `,
        [
          updated.start,
          updated.end,
          JSON.stringify(updated),
          updated.tenantId,
          updated.workspaceId,
          updated.userId,
          updated.id
        ]
      );

      return updated;
    },

    async updateStatus(actor, blockId, action) {
      const block = await getTimeBlock(client, actor, blockId);
      const updated = applyBlockAction(block, action);

      await client.query(
        `
        UPDATE time_blocks
        SET status = $1,
            locked = $2,
            data = $3::jsonb
        WHERE tenant_id = $4
          AND workspace_id = $5
          AND user_id = $6
          AND id = $7
        `,
        [
          updated.status,
          updated.locked,
          JSON.stringify(updated),
          updated.tenantId,
          updated.workspaceId,
          updated.userId,
          updated.id
        ]
      );

      return updated;
    }
  };
}

export function createPostgresAuditEventRepository(
  client: PostgresQueryClient
): AsyncAuditEventRepository {
  return {
    async append(actor, event) {
      assertCanAccess(actor, event);

      await client.query(
        `
        INSERT INTO audit_events (
          tenant_id,
          workspace_id,
          user_id,
          id,
          occurred_at,
          actor_type,
          actor_id,
          action,
          resource_type,
          resource_id,
          data
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
        ON CONFLICT (tenant_id, workspace_id, user_id, id)
        DO UPDATE SET
          occurred_at = excluded.occurred_at,
          actor_type = excluded.actor_type,
          actor_id = excluded.actor_id,
          action = excluded.action,
          resource_type = excluded.resource_type,
          resource_id = excluded.resource_id,
          data = excluded.data
        `,
        [
          event.tenantId,
          event.workspaceId,
          event.userId,
          event.id,
          event.occurredAt,
          event.actorType,
          event.actorId,
          event.action,
          event.resourceType,
          event.resourceId,
          JSON.stringify(event)
        ]
      );

      return event;
    },

    async list(actor, scope) {
      assertCanAccess(actor, scope);

      const result = await client.query(
        `
        SELECT data
        FROM audit_events
        WHERE tenant_id = $1
          AND workspace_id = $2
          AND user_id = $3
        ORDER BY occurred_at, id
        `,
        [scope.tenantId, scope.workspaceId, scope.userId]
      );

      return result.rows.map((row) => readAuditEventRow(row));
    }
  };
}

export function createPostgresIdempotencyRepository(
  client: PostgresQueryClient
): AsyncIdempotencyRepository {
  return {
    async reserve(actor, record) {
      assertCanAccess(actor, record);

      const existing = await getIdempotencyRecord(
        client,
        record,
        record.key
      );

      if (existing) {
        return { record: existing, created: false };
      }

      await client.query(
        `
        INSERT INTO idempotency_keys (
          tenant_id,
          workspace_id,
          user_id,
          key,
          request_hash,
          status,
          created_at,
          completed_at,
          expires_at,
          response_resource_id,
          data
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
        `,
        [
          record.tenantId,
          record.workspaceId,
          record.userId,
          record.key,
          record.requestHash,
          record.status,
          record.createdAt,
          record.completedAt ?? null,
          record.expiresAt ?? null,
          record.responseResourceId ?? null,
          JSON.stringify(record)
        ]
      );

      return { record, created: true };
    },

    async get(actor, scope, key) {
      assertCanAccess(actor, scope);

      return getIdempotencyRecord(client, scope, key);
    },

    async complete(actor, scope, key, update) {
      assertCanAccess(actor, scope);

      const updatedRecord = {
        key,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        userId: scope.userId,
        ...update
      };

      const result = await client.query(
        `
        UPDATE idempotency_keys
        SET status = $1,
            completed_at = $2,
            response_resource_id = $3,
            data = data || $8::jsonb
        WHERE tenant_id = $4
          AND workspace_id = $5
          AND user_id = $6
          AND key = $7
        RETURNING data
        `,
        [
          update.status,
          update.completedAt ?? null,
          update.responseResourceId ?? null,
          scope.tenantId,
          scope.workspaceId,
          scope.userId,
          key,
          JSON.stringify(updatedRecord)
        ]
      );

      const row = result.rows[0];

      if (!row) {
        throw new RepositoryNotFoundError("Idempotency record not found.");
      }

      return readIdempotencyRow(row);
    }
  };
}

export function createPostgresIntegrationStateRepository(
  client: PostgresQueryClient
): AsyncIntegrationStateRepository {
  return {
    async upsert(actor, state) {
      assertCanAccess(actor, state);

      await client.query(
        `
        INSERT INTO integration_states (
          tenant_id,
          workspace_id,
          user_id,
          id,
          source_system,
          external_account_id,
          status,
          updated_at,
          last_synced_at,
          data
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
        ON CONFLICT (tenant_id, workspace_id, user_id, id)
        DO UPDATE SET
          source_system = excluded.source_system,
          external_account_id = excluded.external_account_id,
          status = excluded.status,
          updated_at = excluded.updated_at,
          last_synced_at = excluded.last_synced_at,
          data = excluded.data
        `,
        [
          state.tenantId,
          state.workspaceId,
          state.userId,
          state.id,
          state.sourceSystem,
          state.externalAccountId ?? null,
          state.status,
          state.updatedAt,
          state.lastSyncedAt ?? null,
          JSON.stringify(state)
        ]
      );

      return state;
    },

    async get(actor, scope, id) {
      assertCanAccess(actor, scope);

      const row = await selectOne(
        client,
        `
        SELECT data
        FROM integration_states
        WHERE tenant_id = $1
          AND workspace_id = $2
          AND user_id = $3
          AND id = $4
        `,
        [scope.tenantId, scope.workspaceId, scope.userId, id]
      );

      if (!row) {
        throw new RepositoryNotFoundError("Integration state not found.");
      }

      return readIntegrationStateRow(row);
    },

    async list(actor, scope) {
      assertCanAccess(actor, scope);

      const result = await client.query(
        `
        SELECT data
        FROM integration_states
        WHERE tenant_id = $1
          AND workspace_id = $2
          AND user_id = $3
        ORDER BY source_system, id
        `,
        [scope.tenantId, scope.workspaceId, scope.userId]
      );

      return result.rows.map((row) => readIntegrationStateRow(row));
    }
  };
}

export function createPostgresImportThrottleRepository(
  client: PostgresQueryClient
): AsyncImportThrottleRepository {
  return {
    async consume(actor, scope, input) {
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
      const existing = await getImportThrottleRecord(client, scope, id);
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
      const result = await client.query(
        `
        INSERT INTO import_throttles (
          tenant_id,
          workspace_id,
          user_id,
          id,
          source_system,
          operation,
          window_started_at,
          window_ms,
          limit_count,
          count,
          updated_at,
          data
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
        ON CONFLICT (tenant_id, workspace_id, user_id, id)
        DO UPDATE SET
          source_system = excluded.source_system,
          operation = excluded.operation,
          window_started_at = excluded.window_started_at,
          window_ms = excluded.window_ms,
          limit_count = excluded.limit_count,
          count = excluded.count,
          updated_at = excluded.updated_at,
          data = excluded.data
        RETURNING data
        `,
        [
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
          JSON.stringify(updatedRecord)
        ]
      );
      return {
        allowed: true,
        retryAfterMs: 0,
        record: readImportThrottleRow(result.rows[0] ?? { data: updatedRecord })
      };
    }
  };
}

export function createPostgresRequestThrottleRepository(
  client: PostgresQueryClient
): AsyncRequestThrottleRepository {
  return {
    async consume(actor, scope, input) {
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
      const existing = await getRequestThrottleRecord(client, scope, id);
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
      const result = await client.query(
        `
        INSERT INTO request_throttles (
          tenant_id,
          workspace_id,
          user_id,
          id,
          key_hash,
          window_started_at,
          window_ms,
          limit_count,
          count,
          updated_at,
          data
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
        ON CONFLICT (tenant_id, workspace_id, user_id, id)
        DO UPDATE SET
          key_hash = excluded.key_hash,
          window_started_at = excluded.window_started_at,
          window_ms = excluded.window_ms,
          limit_count = excluded.limit_count,
          count = excluded.count,
          updated_at = excluded.updated_at,
          data = excluded.data
        RETURNING data
        `,
        [
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
          JSON.stringify(updatedRecord)
        ]
      );
      return {
        allowed: true,
        retryAfterMs: 0,
        record: readRequestThrottleRow(result.rows[0] ?? { data: updatedRecord })
      };
    },
    async list(actor, scope) {
      assertCanAccess(actor, scope);
      const result = await client.query(
        `
          SELECT data
          FROM request_throttles
          WHERE tenant_id = $1 AND workspace_id = $2 AND user_id = $3
          ORDER BY updated_at ASC
        `,
        [scope.tenantId, scope.workspaceId, scope.userId]
      );
      return result.rows.map((row) => readRequestThrottleRow(row));
    }
  };
}

export function createPostgresAuthRepository(
  client: PostgresQueryClient
): AsyncAuthRepository {
  return {
    async upsertUser(actor, user) {
      assertAuthTenantAccess(actor, user.tenantId, user.id);
      await client.query(
        `
        INSERT INTO users (
          tenant_id,
          id,
          email,
          display_name,
          status,
          credential_hash,
          created_at,
          updated_at,
          data
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
        ON CONFLICT (tenant_id, id)
        DO UPDATE SET
          email = excluded.email,
          display_name = excluded.display_name,
          status = excluded.status,
          credential_hash = excluded.credential_hash,
          updated_at = excluded.updated_at,
          data = excluded.data
        `,
        [
          user.tenantId,
          user.id,
          user.email,
          user.displayName,
          user.status,
          user.credentialHash ?? null,
          user.createdAt,
          user.updatedAt,
          JSON.stringify(user)
        ]
      );
      return user;
    },
    async getUser(actor, tenantId, userId) {
      assertAuthTenantAccess(actor, tenantId, userId);
      const row = await selectOne(
        client,
        `
        SELECT data
        FROM users
        WHERE tenant_id = $1
          AND id = $2
        `,
        [tenantId, userId]
      );
      if (!row) throw new RepositoryNotFoundError("Auth user not found.");
      return readAuthUserRow(row);
    },
    async upsertMembership(actor, membership) {
      assertCanAccess(actor, membership);
      await client.query(
        `
        INSERT INTO memberships (
          tenant_id,
          workspace_id,
          user_id,
          role,
          status,
          created_at,
          updated_at,
          data
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
        ON CONFLICT (tenant_id, workspace_id, user_id)
        DO UPDATE SET
          role = excluded.role,
          status = excluded.status,
          updated_at = excluded.updated_at,
          data = excluded.data
        `,
        [
          membership.tenantId,
          membership.workspaceId,
          membership.userId,
          membership.role,
          membership.status,
          membership.createdAt,
          membership.updatedAt,
          JSON.stringify(membership)
        ]
      );
      return membership;
    },
    async getMembership(actor, scope) {
      assertCanAccess(actor, scope);
      const row = await selectOne(
        client,
        `
        SELECT data
        FROM memberships
        WHERE tenant_id = $1
          AND workspace_id = $2
          AND user_id = $3
        `,
        [scope.tenantId, scope.workspaceId, scope.userId]
      );
      if (!row) {
        throw new RepositoryNotFoundError("Workspace membership not found.");
      }
      return readWorkspaceMembershipRow(row);
    },
    async listMemberships(actor, tenantId, userId) {
      assertAuthTenantAccess(actor, tenantId, userId);
      const result = await client.query(
        `
        SELECT data
        FROM memberships
        WHERE tenant_id = $1
          AND user_id = $2
        ORDER BY workspace_id
        `,
        [tenantId, userId]
      );
      return result.rows.map((row) => readWorkspaceMembershipRow(row));
    },
    async upsertSession(actor, session) {
      assertCanAccess(actor, session);
      await client.query(
        `
        INSERT INTO auth_sessions (
          tenant_id,
          workspace_id,
          user_id,
          id,
          session_token_hash,
          created_at,
          expires_at,
          revoked_at,
          last_seen_at,
          data
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
        ON CONFLICT (tenant_id, workspace_id, user_id, id)
        DO UPDATE SET
          session_token_hash = excluded.session_token_hash,
          expires_at = excluded.expires_at,
          revoked_at = excluded.revoked_at,
          last_seen_at = excluded.last_seen_at,
          data = excluded.data
        `,
        [
          session.tenantId,
          session.workspaceId,
          session.userId,
          session.id,
          session.sessionTokenHash,
          session.createdAt,
          session.expiresAt,
          session.revokedAt ?? null,
          session.lastSeenAt ?? null,
          JSON.stringify(session)
        ]
      );
      return session;
    },
    async getSession(actor, sessionId) {
      const row = await selectOne(
        client,
        `
        SELECT data
        FROM auth_sessions
        WHERE id = $1
        `,
        [sessionId]
      );
      if (!row) throw new RepositoryNotFoundError("Auth session not found.");
      const session = readAuthSessionRow(row);
      assertCanAccess(actor, session);
      return session;
    },
    async listSessions(actor, scope) {
      assertCanAccess(actor, scope);
      const result = await client.query(
        `
        SELECT data
        FROM auth_sessions
        WHERE tenant_id = $1 AND workspace_id = $2 AND user_id = $3
        ORDER BY created_at, id
        `,
        [scope.tenantId, scope.workspaceId, scope.userId]
      );
      return result.rows.map((row) => readAuthSessionRow(row));
    },
    async revokeSession(actor, sessionId, revokedAt) {
      const session = await this.getSession(actor, sessionId);
      const revokedSession = { ...session, revokedAt };
      await this.upsertSession(actor, revokedSession);
      return revokedSession;
    },
    async upsertPasswordResetToken(actor, token) {
      assertCanAccess(actor, token);
      await client.query(
        `
        INSERT INTO auth_password_reset_tokens (
          tenant_id,
          workspace_id,
          user_id,
          id,
          token_hash,
          created_at,
          expires_at,
          used_at,
          data
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
        ON CONFLICT (tenant_id, workspace_id, user_id, id)
        DO UPDATE SET
          token_hash = excluded.token_hash,
          expires_at = excluded.expires_at,
          used_at = excluded.used_at,
          data = excluded.data
        `,
        [
          token.tenantId,
          token.workspaceId,
          token.userId,
          token.id,
          token.tokenHash,
          token.createdAt,
          token.expiresAt,
          token.usedAt ?? null,
          JSON.stringify(token)
        ]
      );
      return token;
    },
    async getPasswordResetToken(actor, tokenId) {
      const row = await selectOne(
        client,
        `
        SELECT data
        FROM auth_password_reset_tokens
        WHERE id = $1
        `,
        [tokenId]
      );
      if (!row) {
        throw new RepositoryNotFoundError("Password reset token not found.");
      }
      const token = readAuthPasswordResetTokenRow(row);
      assertCanAccess(actor, token);
      return token;
    },
    async listPasswordResetTokens(actor, scope) {
      assertCanAccess(actor, scope);
      const result = await client.query(
        `
        SELECT data
        FROM auth_password_reset_tokens
        WHERE tenant_id = $1 AND workspace_id = $2 AND user_id = $3
        ORDER BY created_at, id
        `,
        [scope.tenantId, scope.workspaceId, scope.userId]
      );
      return result.rows.map((row) => readAuthPasswordResetTokenRow(row));
    },
    async markPasswordResetTokenUsed(actor, tokenId, usedAt) {
      const token = await this.getPasswordResetToken(actor, tokenId);
      const usedToken = { ...token, usedAt };
      await this.upsertPasswordResetToken(actor, usedToken);
      return usedToken;
    },
    async getLoginAttemptWindow(actor, scope) {
      assertCanAccess(actor, scope);
      const row = await selectOne(
        client,
        `
        SELECT data
        FROM auth_login_attempt_windows
        WHERE tenant_id = $1 AND workspace_id = $2 AND user_id = $3
        `,
        [scope.tenantId, scope.workspaceId, scope.userId]
      );
      return row ? readAuthLoginAttemptWindowRow(row) : undefined;
    },
    async upsertLoginAttemptWindow(actor, window) {
      assertCanAccess(actor, window);
      await client.query(
        `
        INSERT INTO auth_login_attempt_windows (
          tenant_id, workspace_id, user_id, id, window_started_at, window_ms,
          max_failed_attempts, failed_count, locked_until, updated_at, data
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
        ON CONFLICT (tenant_id, workspace_id, user_id, id)
        DO UPDATE SET
          window_started_at = excluded.window_started_at,
          window_ms = excluded.window_ms,
          max_failed_attempts = excluded.max_failed_attempts,
          failed_count = excluded.failed_count,
          locked_until = excluded.locked_until,
          updated_at = excluded.updated_at,
          data = excluded.data
        `,
        [
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
          JSON.stringify(window)
        ]
      );
      return window;
    },
    async clearLoginAttemptWindow(actor, scope) {
      assertCanAccess(actor, scope);
      await client.query(
        `
        DELETE FROM auth_login_attempt_windows
        WHERE tenant_id = $1 AND workspace_id = $2 AND user_id = $3
        `,
        [scope.tenantId, scope.workspaceId, scope.userId]
      );
    }
  };
}

async function upsertSchedulePlan(
  client: PostgresQueryClient,
  plan: SchedulePlan
): Promise<void> {
  await client.query("BEGIN");

  try {
    await client.query(
      `
      INSERT INTO schedule_plans (
        tenant_id,
        workspace_id,
        user_id,
        id,
        range_start,
        range_end,
        status,
        version,
        data
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
      ON CONFLICT (tenant_id, workspace_id, user_id, id)
      DO UPDATE SET
        range_start = excluded.range_start,
        range_end = excluded.range_end,
        status = excluded.status,
        updated_at = now(),
        version = excluded.version,
        data = excluded.data
      `,
      [
        plan.tenantId,
        plan.workspaceId,
        plan.userId,
        plan.id,
        plan.rangeStart,
        plan.rangeEnd,
        plan.status,
        1,
        JSON.stringify(plan)
      ]
    );

    await client.query(
      `
      DELETE FROM time_blocks
      WHERE tenant_id = $1
        AND workspace_id = $2
        AND user_id = $3
        AND plan_id = $4
      `,
      [plan.tenantId, plan.workspaceId, plan.userId, plan.id]
    );

    for (const block of plan.blocks) {
      assertTimeBlockScope(block, plan);
      await client.query(
        `
        INSERT INTO time_blocks (
          tenant_id,
          workspace_id,
          user_id,
          id,
          plan_id,
          task_id,
          start_at,
          end_at,
          status,
          locked,
          version,
          data
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
        `,
        [
          block.tenantId,
          block.workspaceId,
          block.userId,
          block.id,
          plan.id,
          block.taskId,
          block.start,
          block.end,
          block.status,
          block.locked,
          1,
          JSON.stringify(block)
        ]
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function getTimeBlock(
  client: PostgresQueryClient,
  actor: RepositoryActor,
  blockId: string
): Promise<TimeBlock> {
  const blockRow =
    actor.kind === "system"
      ? await selectOne(client, "SELECT data FROM time_blocks WHERE id = $1", [
          blockId
        ])
      : await selectOne(
          client,
          `
          SELECT data
          FROM time_blocks
          WHERE tenant_id = $1
            AND workspace_id = $2
            AND user_id = $3
            AND id = $4
          `,
          [actor.tenantId, actor.workspaceId, actor.userId, blockId]
        );

  if (!blockRow && actor.kind !== "system") {
    const existing = await selectOne(
      client,
      "SELECT data FROM time_blocks WHERE id = $1",
      [blockId]
    );

    if (existing) {
      throw new RepositoryForbiddenError();
    }
  }

  if (!blockRow) {
    throw new RepositoryNotFoundError("Time block not found.");
  }

  return readTimeBlockRow(blockRow);
}

async function getSchedulePlan(
  client: PostgresQueryClient,
  actor: RepositoryActor,
  planId: string
): Promise<SchedulePlan> {
  const planRow =
    actor.kind === "system"
      ? await selectOne(client, "SELECT data FROM schedule_plans WHERE id = $1", [
          planId
        ])
      : await selectOne(
          client,
          `
          SELECT data
          FROM schedule_plans
          WHERE tenant_id = $1
            AND workspace_id = $2
            AND user_id = $3
            AND id = $4
          `,
          [actor.tenantId, actor.workspaceId, actor.userId, planId]
        );

  if (!planRow && actor.kind !== "system") {
    const existing = await selectOne(
      client,
      "SELECT data FROM schedule_plans WHERE id = $1",
      [planId]
    );

    if (existing) {
      throw new RepositoryForbiddenError();
    }
  }

  if (!planRow) {
    throw new RepositoryNotFoundError("Schedule plan not found.");
  }

  const plan = readSchedulePlanRow(planRow);
  const blockResult = await client.query(
    `
    SELECT data
    FROM time_blocks
    WHERE tenant_id = $1
      AND workspace_id = $2
      AND user_id = $3
      AND plan_id = $4
    ORDER BY start_at, id
    `,
    [plan.tenantId, plan.workspaceId, plan.userId, plan.id]
  );

  return {
    ...plan,
    blocks: blockResult.rows.map((row) => readTimeBlockRow(row))
  };
}

function applyBlockAction(
  block: TimeBlock,
  action: "lock" | "unlock" | "complete" | "missed"
): TimeBlock {
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
}

async function selectOne(
 client: PostgresQueryClient,
 sql: string,
 params: readonly unknown[]
): Promise<Record<string, unknown> | undefined> {
 const result = await client.query(sql, params);
 return result.rows[0];
}

async function countPostgresScopedRowsBefore(
 client: PostgresQueryClient,
 table: string,
 column: string,
 scope: Scope,
 deleteBefore: string
): Promise<number> {
 const result = await client.query(
  `SELECT COUNT(*) AS count FROM ${table}
   WHERE tenant_id = $1 AND workspace_id = $2 AND user_id = $3 AND ${column} < $4`,
  [scope.tenantId, scope.workspaceId, scope.userId, deleteBefore]
 );
 return Number(result.rows[0]?.count ?? 0);
}

async function deletePostgresScopedRowsBefore(
  client: PostgresQueryClient,
  table: string,
  column: string,
  scope: Scope,
 deleteBefore: string
): Promise<number> {
 const result = await client.query(
  `DELETE FROM ${table}
   WHERE tenant_id = $1 AND workspace_id = $2 AND user_id = $3 AND ${column} < $4`,
  [scope.tenantId, scope.workspaceId, scope.userId, deleteBefore]
 );
  return Number(result.rowCount ?? 0);
}

async function countPostgresAuthSessionsBefore(
  client: PostgresQueryClient,
  scope: Scope,
  deleteBefore: string
): Promise<number> {
  const result = await client.query(
    `SELECT COUNT(*) count FROM auth_sessions
     WHERE tenant_id = $1
       AND workspace_id = $2
       AND user_id = $3
       AND COALESCE(revoked_at, expires_at) < $4`,
    [scope.tenantId, scope.workspaceId, scope.userId, deleteBefore]
  );
  return Number(result.rows[0]?.count ?? 0);
}

async function deletePostgresAuthSessionsBefore(
  client: PostgresQueryClient,
  scope: Scope,
  deleteBefore: string
): Promise<number> {
  const result = await client.query(
    `DELETE FROM auth_sessions
     WHERE tenant_id = $1
       AND workspace_id = $2
       AND user_id = $3
       AND COALESCE(revoked_at, expires_at) < $4`,
    [scope.tenantId, scope.workspaceId, scope.userId, deleteBefore]
  );
  return Number(result.rowCount ?? 0);
}

async function countPostgresAuthPasswordResetTokensBefore(
  client: PostgresQueryClient,
  scope: Scope,
  deleteBefore: string
): Promise<number> {
  const result = await client.query(
    `SELECT COUNT(*) count FROM auth_password_reset_tokens
      WHERE tenant_id = $1
        AND workspace_id = $2
        AND user_id = $3
        AND COALESCE(used_at, expires_at) < $4`,
    [scope.tenantId, scope.workspaceId, scope.userId, deleteBefore]
  );
  return Number(result.rows[0]?.count ?? 0);
}

async function deletePostgresAuthPasswordResetTokensBefore(
  client: PostgresQueryClient,
  scope: Scope,
  deleteBefore: string
): Promise<number> {
  const result = await client.query(
    `DELETE FROM auth_password_reset_tokens
      WHERE tenant_id = $1
        AND workspace_id = $2
        AND user_id = $3
        AND COALESCE(used_at, expires_at) < $4`,
    [scope.tenantId, scope.workspaceId, scope.userId, deleteBefore]
  );
  return Number(result.rowCount ?? 0);
}

async function countPostgresAuthLoginAttemptWindowsBefore(
  client: PostgresQueryClient,
  scope: Scope,
  deleteBefore: string
): Promise<number> {
  const result = await client.query(
    `SELECT COUNT(*) count FROM auth_login_attempt_windows
     WHERE tenant_id = $1
     AND workspace_id = $2
     AND user_id = $3
     AND COALESCE(locked_until, updated_at) < $4`,
    [scope.tenantId, scope.workspaceId, scope.userId, deleteBefore]
  );
  return Number(result.rows[0]?.count ?? 0);
}

async function deletePostgresAuthLoginAttemptWindowsBefore(
  client: PostgresQueryClient,
  scope: Scope,
  deleteBefore: string
): Promise<number> {
  const result = await client.query(
    `DELETE FROM auth_login_attempt_windows
     WHERE tenant_id = $1
     AND workspace_id = $2
     AND user_id = $3
     AND COALESCE(locked_until, updated_at) < $4`,
    [scope.tenantId, scope.workspaceId, scope.userId, deleteBefore]
  );
  return Number(result.rowCount ?? 0);
}

async function countPostgresInactiveIntegrationStatesBefore(
  client: PostgresQueryClient,
  scope: Scope,
 deleteBefore: string
): Promise<number> {
 const result = await client.query(
  `SELECT COUNT(*) AS count FROM integration_states
   WHERE tenant_id = $1 AND workspace_id = $2 AND user_id = $3
   AND status != 'CONNECTED' AND updated_at < $4`,
  [scope.tenantId, scope.workspaceId, scope.userId, deleteBefore]
 );
 return Number(result.rows[0]?.count ?? 0);
}

async function deletePostgresInactiveIntegrationStatesBefore(
 client: PostgresQueryClient,
 scope: Scope,
 deleteBefore: string
): Promise<number> {
 const result = await client.query(
  `DELETE FROM integration_states
   WHERE tenant_id = $1 AND workspace_id = $2 AND user_id = $3
   AND status != 'CONNECTED' AND updated_at < $4`,
  [scope.tenantId, scope.workspaceId, scope.userId, deleteBefore]
 );
 return Number(result.rowCount ?? 0);
}

async function deleteExpiredPostgresSchedulePlans(
 client: PostgresQueryClient,
 scope: Scope,
 deleteBefore: string
): Promise<number> {
 await client.query(
  `DELETE FROM time_blocks
   WHERE tenant_id = $1 AND workspace_id = $2 AND user_id = $3
   AND plan_id IN (
    SELECT id FROM schedule_plans
    WHERE tenant_id = $1 AND workspace_id = $2 AND user_id = $3 AND range_end < $4
   )`,
  [scope.tenantId, scope.workspaceId, scope.userId, deleteBefore]
 );
 const result = await client.query(
  `DELETE FROM schedule_plans
   WHERE tenant_id = $1 AND workspace_id = $2 AND user_id = $3 AND range_end < $4`,
  [scope.tenantId, scope.workspaceId, scope.userId, deleteBefore]
 );
 return Number(result.rowCount ?? 0);
}

async function getIdempotencyRecord(
 client: PostgresQueryClient,
 scope: Scope,
  key: string
): Promise<IdempotencyRecord | undefined> {
  const row = await selectOne(
    client,
    `
    SELECT data
    FROM idempotency_keys
    WHERE tenant_id = $1
      AND workspace_id = $2
      AND user_id = $3
      AND key = $4
    `,
    [scope.tenantId, scope.workspaceId, scope.userId, key]
  );

  return row ? readIdempotencyRow(row) : undefined;
}

async function getImportThrottleRecord(
  client: PostgresQueryClient,
  scope: Scope,
  id: string
): Promise<ImportThrottleRecord | undefined> {
  const row = await selectOne(
    client,
    `
    SELECT data
    FROM import_throttles
    WHERE tenant_id = $1
      AND workspace_id = $2
      AND user_id = $3
      AND id = $4
    `,
    [scope.tenantId, scope.workspaceId, scope.userId, id]
  );

  return row ? readImportThrottleRow(row) : undefined;
}

async function getRequestThrottleRecord(
  client: PostgresQueryClient,
  scope: Scope,
  id: string
): Promise<RequestThrottleRecord | undefined> {
  const row = await selectOne(
    client,
    `
    SELECT data
    FROM request_throttles
    WHERE tenant_id = $1
      AND workspace_id = $2
      AND user_id = $3
      AND id = $4
    `,
    [scope.tenantId, scope.workspaceId, scope.userId, id]
  );

  return row ? readRequestThrottleRow(row) : undefined;
}

function readTaskRow(row: Record<string, unknown>): SchedulingTask {
  const data = row["data"];

  if (typeof data === "string") {
    return JSON.parse(data) as SchedulingTask;
  }

  if (data && typeof data === "object") {
    return data as SchedulingTask;
  }

  throw new Error("PostgreSQL task row missing JSONB data payload");
}

function readCalendarEventRow(row: Record<string, unknown>): CalendarEvent {
  const data = row["data"];

  if (typeof data === "string") {
    return JSON.parse(data) as CalendarEvent;
  }

  if (data && typeof data === "object") {
    return data as CalendarEvent;
  }

  throw new Error("PostgreSQL calendar event row missing JSONB data payload");
}

function readWorkingHoursRow(row: Record<string, unknown>): WorkingHours {
  const data = row["data"];

  if (typeof data === "string") {
    return JSON.parse(data) as WorkingHours;
  }

  if (data && typeof data === "object") {
    return data as WorkingHours;
  }

  throw new Error("PostgreSQL working hours row missing JSONB data payload");
}

function readSchedulePlanRow(row: Record<string, unknown>): SchedulePlan {
  const data = row["data"];

  if (typeof data === "string") {
    return JSON.parse(data) as SchedulePlan;
  }

  if (data && typeof data === "object") {
    return data as SchedulePlan;
  }

  throw new Error("PostgreSQL schedule plan row missing JSONB data payload");
}

function readTimeBlockRow(row: Record<string, unknown>): TimeBlock {
  const data = row["data"];

  if (typeof data === "string") {
    return JSON.parse(data) as TimeBlock;
  }

  if (data && typeof data === "object") {
    return data as TimeBlock;
  }

  throw new Error("PostgreSQL time block row missing JSONB data payload");
}

function readAuditEventRow(row: Record<string, unknown>): AuditEvent {
  const data = row["data"];

  if (typeof data === "string") {
    return JSON.parse(data) as AuditEvent;
  }

  if (data && typeof data === "object") {
    return data as AuditEvent;
  }

  throw new Error("PostgreSQL audit event row missing JSONB data payload");
}

function readIdempotencyRow(row: Record<string, unknown>): IdempotencyRecord {
  const data = row["data"];

  if (typeof data === "string") {
    return JSON.parse(data) as IdempotencyRecord;
  }

  if (data && typeof data === "object") {
    return data as IdempotencyRecord;
  }

  throw new Error("PostgreSQL idempotency row missing JSONB data payload");
}

function readIntegrationStateRow(
  row: Record<string, unknown>
): IntegrationState {
  const data = row["data"];

  if (typeof data === "string") {
    return JSON.parse(data) as IntegrationState;
  }

  if (data && typeof data === "object") {
    return data as IntegrationState;
  }

  throw new Error("PostgreSQL integration state row missing JSONB data payload");
}

function readImportThrottleRow(row: Record<string, unknown>): ImportThrottleRecord {
  const data = row["data"];

  if (typeof data === "string") {
    return JSON.parse(data) as ImportThrottleRecord;
  }

  if (data && typeof data === "object") {
    return data as ImportThrottleRecord;
  }

  throw new Error("PostgreSQL import throttle row missing JSONB data payload");
}

function readRequestThrottleRow(row: Record<string, unknown>): RequestThrottleRecord {
  const data = row["data"];
  if (typeof data === "string") {
    return JSON.parse(data) as RequestThrottleRecord;
  }
  if (data && typeof data === "object") {
    return data as RequestThrottleRecord;
  }
  throw new Error("PostgreSQL request throttle row missing JSONB data payload");
}

function readAuthUserRow(row: Record<string, unknown>): AuthUser {
  const data = row["data"];

  if (typeof data === "string") {
    return JSON.parse(data) as AuthUser;
  }

  if (data && typeof data === "object") {
    return data as AuthUser;
  }

  throw new Error("PostgreSQL auth user row missing JSONB data payload");
}

function readWorkspaceMembershipRow(
  row: Record<string, unknown>
): WorkspaceMembership {
  const data = row["data"];

  if (typeof data === "string") {
    return JSON.parse(data) as WorkspaceMembership;
  }

  if (data && typeof data === "object") {
    return data as WorkspaceMembership;
  }

  throw new Error(
    "PostgreSQL workspace membership row missing JSONB data payload"
  );
}

function readAuthSessionRow(row: Record<string, unknown>): AuthSession {
  const data = row["data"];

  if (typeof data === "string") {
    return JSON.parse(data) as AuthSession;
  }

  if (data && typeof data === "object") {
    return data as AuthSession;
  }

  throw new Error("PostgreSQL auth session row missing JSONB data payload");
}

function readAuthPasswordResetTokenRow(
  row: Record<string, unknown>
): AuthPasswordResetToken {
  const data = row["data"];

  if (typeof data === "string") {
    return JSON.parse(data) as AuthPasswordResetToken;
  }

  if (data && typeof data === "object") {
    return data as AuthPasswordResetToken;
  }

  throw new Error(
    "PostgreSQL password reset token row missing JSONB data payload"
  );
}

function readAuthLoginAttemptWindowRow(
  row: Record<string, unknown>
): AuthLoginAttemptWindow {
  const data = row["data"];

  if (typeof data === "string") {
    return JSON.parse(data) as AuthLoginAttemptWindow;
  }

  if (data && typeof data === "object") {
    return data as AuthLoginAttemptWindow;
  }

  throw new Error(
    "PostgreSQL auth login attempt window row missing JSONB data payload"
  );
}

function assertCanAccess(actor: RepositoryActor, scope: Scope): void {
  if (actor.kind === "system") {
    return;
  }

  if (!matchesScope(actor, scope)) {
    throw new RepositoryForbiddenError();
  }
}

function assertAuthTenantAccess(
  actor: RepositoryActor,
  tenantId: string,
  userId: string
): void {
  if (actor.kind === "system") {
    return;
  }

  if (actor.tenantId !== tenantId || actor.userId !== userId) {
    throw new RepositoryForbiddenError();
  }
}

function assertCalendarEventScope(event: CalendarEvent, scope: Scope): void {
  if (
    event.tenantId !== scope.tenantId ||
    event.workspaceId !== scope.workspaceId ||
    event.userId !== scope.userId
  ) {
    throw new RepositoryForbiddenError(
      "Calendar event does not match repository scope."
    );
  }
}

function assertWorkingHoursScope(
  workingHours: WorkingHours,
  scope: Scope
): void {
  if (workingHours.userId !== scope.userId) {
    throw new RepositoryForbiddenError(
      "Working hours do not match repository scope."
    );
  }
}

function assertTimeBlockScope(block: TimeBlock, plan: SchedulePlan): void {
  if (
    block.tenantId !== plan.tenantId ||
    block.workspaceId !== plan.workspaceId ||
    block.userId !== plan.userId
  ) {
    throw new RepositoryForbiddenError(
      "Time block does not match schedule plan scope."
    );
  }
}
