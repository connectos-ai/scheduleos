import type { ApiStoreController } from "./store.js";
import type {
  AuditEvent,
  AuthLoginAttemptWindow,
  AuthPasswordResetToken,
  AuthSession,
  AuthUser,
  CalendarEvent,
  IdempotencyRecord,
  ImportThrottleOperation,
  ImportThrottleRecord,
  IntegrationState,
  RequestThrottleRecord,
  SchedulePlan,
  SchedulingTask,
  TimeBlock,
  WorkingHours,
  WorkspaceMembership
} from "./domain.js";

export interface Scope {
  tenantId: string;
  workspaceId: string;
  userId: string;
}

export type RepositoryActor = ({ kind: "system" } | ({ kind: "user" } & Scope));

export interface TaskRepository {
  upsert(actor: RepositoryActor, task: SchedulingTask): SchedulingTask;
  get(actor: RepositoryActor, scope: Scope, taskId: string): SchedulingTask;
  list(actor: RepositoryActor, scope: Scope): SchedulingTask[];
  delete(actor: RepositoryActor, scope: Scope, taskId: string): void;
}

export interface CalendarEventRepository {
  upsert(actor: RepositoryActor, event: CalendarEvent, scope: Scope): CalendarEvent;
  get(actor: RepositoryActor, scope: Scope, eventId: string): CalendarEvent;
  listForSchedule(actor: RepositoryActor, scope: Scope): CalendarEvent[];
  delete(actor: RepositoryActor, scope: Scope, eventId: string): void;
}

export interface WorkingHoursRepository {
  put(actor: RepositoryActor, scope: Scope, workingHours: WorkingHours): WorkingHours;
  get(actor: RepositoryActor, scope: Scope): WorkingHours | undefined;
}

export interface SchedulePlanRepository {
  upsert(actor: RepositoryActor, plan: SchedulePlan): SchedulePlan;
  get(actor: RepositoryActor, planId: string): SchedulePlan;
  list(actor: RepositoryActor, scope: Scope): SchedulePlan[];
  replace(actor: RepositoryActor, plan: SchedulePlan): SchedulePlan;
}

export interface TimeBlockRepository {
  get(actor: RepositoryActor, blockId: string): TimeBlock;
  updateTime(
    actor: RepositoryActor,
    blockId: string,
    patch: { start?: string; end?: string }
  ): TimeBlock;
  updateStatus(
    actor: RepositoryActor,
    blockId: string,
    action: "lock" | "unlock" | "complete" | "missed"
  ): TimeBlock;
}

export interface AuditEventRepository {
  append(actor: RepositoryActor, event: AuditEvent): AuditEvent;
  list(actor: RepositoryActor, scope: Scope): AuditEvent[];
}

export interface IdempotencyRepository {
  reserve(
    actor: RepositoryActor,
    record: IdempotencyRecord
  ): { record: IdempotencyRecord; created: boolean };
  get(
    actor: RepositoryActor,
    scope: Scope,
    key: string
  ): IdempotencyRecord | undefined;
  complete(
    actor: RepositoryActor,
    scope: Scope,
    key: string,
    update: Pick<IdempotencyRecord, "status" | "completedAt" | "responseResourceId">
  ): IdempotencyRecord;
}

export interface IntegrationStateRepository {
  upsert(actor: RepositoryActor, state: IntegrationState): IntegrationState;
  get(actor: RepositoryActor, scope: Scope, id: string): IntegrationState;
  list(actor: RepositoryActor, scope: Scope): IntegrationState[];
}

export interface ImportThrottleConsumeInput {
  sourceSystem: string;
  operation: ImportThrottleOperation;
  count: number;
  limit: number;
  windowMs: number;
  now: string;
}

export interface ImportThrottleConsumeResult {
  allowed: boolean;
  retryAfterMs: number;
  record: ImportThrottleRecord;
}

export interface ImportThrottleRepository {
  consume(
    actor: RepositoryActor,
    scope: Scope,
    input: ImportThrottleConsumeInput
  ): ImportThrottleConsumeResult;
}

export interface RequestThrottleConsumeInput {
  keyHash: string;
  count: number;
  limit: number;
  windowMs: number;
  now: string;
}

export interface RequestThrottleConsumeResult {
  allowed: boolean;
  retryAfterMs: number;
  record: RequestThrottleRecord;
}

export interface RequestThrottleRepository {
  consume(
    actor: RepositoryActor,
    scope: Scope,
    input: RequestThrottleConsumeInput
  ): RequestThrottleConsumeResult;
  list(actor: RepositoryActor, scope: Scope): RequestThrottleRecord[];
}

export interface AuthRepository {
  upsertUser(actor: RepositoryActor, user: AuthUser): AuthUser;
  getUser(actor: RepositoryActor, tenantId: string, userId: string): AuthUser;
  upsertMembership(
    actor: RepositoryActor,
    membership: WorkspaceMembership
  ): WorkspaceMembership;
  getMembership(actor: RepositoryActor, scope: Scope): WorkspaceMembership;
  listMemberships(
    actor: RepositoryActor,
    tenantId: string,
    userId: string
  ): WorkspaceMembership[];
  upsertSession(actor: RepositoryActor, session: AuthSession): AuthSession;
  getSession(actor: RepositoryActor, sessionId: string): AuthSession;
  listSessions(actor: RepositoryActor, scope: Scope): AuthSession[];
  revokeSession(
    actor: RepositoryActor,
    sessionId: string,
    revokedAt: string
  ): AuthSession;
  upsertPasswordResetToken(
    actor: RepositoryActor,
    token: AuthPasswordResetToken
  ): AuthPasswordResetToken;
  getPasswordResetToken(
    actor: RepositoryActor,
    tokenId: string
  ): AuthPasswordResetToken;
  listPasswordResetTokens(
    actor: RepositoryActor,
    scope: Scope
  ): AuthPasswordResetToken[];
  markPasswordResetTokenUsed(
    actor: RepositoryActor,
    tokenId: string,
    usedAt: string
  ): AuthPasswordResetToken;
  getLoginAttemptWindow(
    actor: RepositoryActor,
    scope: Scope
  ): AuthLoginAttemptWindow | undefined;
  upsertLoginAttemptWindow(
    actor: RepositoryActor,
    window: AuthLoginAttemptWindow
  ): AuthLoginAttemptWindow;
  clearLoginAttemptWindow(actor: RepositoryActor, scope: Scope): void;
}

export interface ScheduleOSRepositories {
  tasks: TaskRepository;
  calendarEvents: CalendarEventRepository;
  workingHours: WorkingHoursRepository;
  schedulePlans: SchedulePlanRepository;
  timeBlocks: TimeBlockRepository;
  auditEvents: AuditEventRepository;
  idempotency: IdempotencyRepository;
  integrationStates: IntegrationStateRepository;
  importThrottles: ImportThrottleRepository;
  requestThrottles: RequestThrottleRepository;
  auth: AuthRepository;
}

export class RepositoryForbiddenError extends Error {
  readonly code = "FORBIDDEN";
  readonly status = 403;

  constructor(message = "Actor cannot access this repository scope.") {
    super(message);
  }
}

export class RepositoryNotFoundError extends Error {
  readonly code = "NOT_FOUND";
  readonly status = 404;

  constructor(message = "Repository record not found.") {
    super(message);
  }
}

export class RepositoryValidationError extends Error {
  readonly code = "VALIDATION_ERROR";
  readonly status = 422;

  constructor(message: string) {
    super(message);
  }
}

export const createStoreRepositories = (
  controller: ApiStoreController
): ScheduleOSRepositories => {
  const { state, persist } = controller;

  const tasks: TaskRepository = {
    upsert(actor, task) {
      assertCanAccess(actor, task);
      state.tasks = [
        ...state.tasks.filter(
          (existing) =>
            !(
              existing.tenantId === task.tenantId &&
              existing.workspaceId === task.workspaceId &&
              existing.userId === task.userId &&
              existing.id === task.id
            )
        ),
        task
      ];
      persist();
      return task;
    },
    get(actor, scope, taskId) {
      assertCanAccess(actor, scope);
      const task = state.tasks.find(
        (candidate) => matchesScope(candidate, scope) && candidate.id === taskId
      );
      if (!task) throw new RepositoryNotFoundError("Task not found.");
      return task;
    },
    list(actor, scope) {
      assertCanAccess(actor, scope);
      return state.tasks.filter((task) => matchesScope(task, scope));
    },
    delete(actor, scope, taskId) {
      assertCanAccess(actor, scope);
      const beforeCount = state.tasks.length;
      state.tasks = state.tasks.filter(
        (task) => !(matchesScope(task, scope) && task.id === taskId)
      );
      if (state.tasks.length === beforeCount) {
        throw new RepositoryNotFoundError("Task not found.");
      }
      persist();
    }
  };

  const calendarEvents: CalendarEventRepository = {
    upsert(actor, event, scope) {
      assertCanAccess(actor, scope);
      assertCalendarEventScope(event, scope);
      state.calendarEvents = [
        ...state.calendarEvents.filter(
          (existing) =>
            !(
              existing.tenantId === event.tenantId &&
              existing.workspaceId === event.workspaceId &&
              existing.userId === event.userId &&
              existing.id === event.id
            )
        ),
        event
      ];
      persist();
      return event;
    },
    get(actor, scope, eventId) {
      assertCanAccess(actor, scope);
      const event = state.calendarEvents.find(
        (candidate) => matchesScope(candidate, scope) && candidate.id === eventId
      );
      if (!event) throw new RepositoryNotFoundError("Calendar event not found.");
      return event;
    },
    listForSchedule(actor, scope) {
      assertCanAccess(actor, scope);
      return state.calendarEvents.filter((event) => matchesScope(event, scope));
    },
    delete(actor, scope, eventId) {
      assertCanAccess(actor, scope);
      const beforeCount = state.calendarEvents.length;
      state.calendarEvents = state.calendarEvents.filter(
        (event) => !(matchesScope(event, scope) && event.id === eventId)
      );
      if (state.calendarEvents.length === beforeCount) {
        throw new RepositoryNotFoundError("Calendar event not found.");
      }
      persist();
    }
  };

  const workingHours: WorkingHoursRepository = {
    put(actor, scope, value) {
      assertCanAccess(actor, scope);
      assertWorkingHoursScope(value, scope);
      state.workingHours.set(workingHoursKey(scope), value);
      state.workingHours.set(value.userId, value);
      persist();
      return value;
    },
    get(actor, scope) {
      assertCanAccess(actor, scope);
      return state.workingHours.get(workingHoursKey(scope)) ?? state.workingHours.get(scope.userId);
    }
  };

  const schedulePlans: SchedulePlanRepository = {
    upsert(actor, plan) {
      assertCanAccess(actor, plan);
      replacePlan(plan);
      persist();
      return plan;
    },
    get(actor, planId) {
      const plan = findPlan(planId);
      assertCanAccess(actor, plan);
      return plan;
    },
    list(actor, scope) {
      assertCanAccess(actor, scope);
      return state.plans.filter((plan) => matchesScope(plan, scope));
    },
    replace(actor, plan) {
      assertCanAccess(actor, plan);
      replacePlan(plan);
      persist();
      return plan;
    }
  };

  const timeBlocks: TimeBlockRepository = {
    get(actor, blockId) {
      const block = findBlock(blockId);
      assertCanAccess(actor, block);
      return block;
    },
    updateTime(actor, blockId, patch) {
      let updatedBlock: TimeBlock | undefined;
      let foundBlock = false;

      state.plans = state.plans.map((plan) => ({
        ...plan,
        blocks: plan.blocks.map((block) => {
          if (block.id !== blockId) return block;
          foundBlock = true;
          assertCanAccess(actor, block);
          updatedBlock = applyBlockTimePatch(block, patch);
          return updatedBlock;
        })
      }));

      if (!foundBlock) throw new RepositoryNotFoundError("Time block not found.");
      if (!updatedBlock) throw new RepositoryNotFoundError("Time block not found.");
      persist();
      return updatedBlock;
    },
    updateStatus(actor, blockId, action) {
      let updatedBlock: TimeBlock | undefined;
      let foundBlock = false;

      state.plans = state.plans.map((plan) => ({
        ...plan,
        blocks: plan.blocks.map((block) => {
          if (block.id !== blockId) return block;
          foundBlock = true;
          assertCanAccess(actor, block);
          updatedBlock = applyBlockAction(block, action);
          return updatedBlock;
        })
      }));

      if (!foundBlock) throw new RepositoryNotFoundError("Time block not found.");
      if (!updatedBlock) throw new RepositoryNotFoundError("Time block not found.");
      persist();
      return updatedBlock;
    }
  };

  const auditEvents: AuditEventRepository = {
    append(actor, event) {
      assertCanAccess(actor, event);
      state.auditEvents = [
        ...state.auditEvents.filter((existing) => existing.id !== event.id),
        event
      ];
      persist();
      return event;
    },
    list(actor, scope) {
      assertCanAccess(actor, scope);
      return state.auditEvents.filter((event) => matchesScope(event, scope));
    }
  };

  const idempotency: IdempotencyRepository = {
    reserve(actor, record) {
      assertCanAccess(actor, record);
      const existing = state.idempotencyRecords.find(
        (candidate) => candidate.key === record.key && matchesScope(candidate, record)
      );
      if (existing) return { record: existing, created: false };

      state.idempotencyRecords = [...state.idempotencyRecords, record];
      persist();
      return { record, created: true };
    },
    get(actor, scope, key) {
      assertCanAccess(actor, scope);
      return state.idempotencyRecords.find(
        (record) => record.key === key && matchesScope(record, scope)
      );
    },
    complete(actor, scope, key, update) {
      assertCanAccess(actor, scope);
      let updatedRecord: IdempotencyRecord | undefined;
      state.idempotencyRecords = state.idempotencyRecords.map((record) => {
        if (record.key !== key || !matchesScope(record, scope)) return record;
        updatedRecord = { ...record, ...update };
        return updatedRecord;
      });
      if (!updatedRecord) {
        throw new RepositoryNotFoundError("Idempotency record not found.");
      }
      persist();
      return updatedRecord;
    }
  };

  const integrationStates: IntegrationStateRepository = {
    upsert(actor, integrationState) {
      assertCanAccess(actor, integrationState);
      state.integrationStates = [
        ...state.integrationStates.filter(
          (existing) =>
            !(existing.id === integrationState.id && matchesScope(existing, integrationState))
        ),
        integrationState
      ];
      persist();
      return integrationState;
    },
    get(actor, scope, id) {
      assertCanAccess(actor, scope);
      const integrationState = state.integrationStates.find(
        (candidate) => candidate.id === id && matchesScope(candidate, scope)
      );
      if (!integrationState) {
        throw new RepositoryNotFoundError("Integration state not found.");
      }
      return integrationState;
    },
    list(actor, scope) {
      assertCanAccess(actor, scope);
      return state.integrationStates.filter((integrationState) =>
        matchesScope(integrationState, scope)
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

      const id = importThrottleId(input.operation, input.sourceSystem);
      const existing = state.importThrottleRecords.find(
        (candidate) => candidate.id === id && matchesScope(candidate, scope)
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
        const retryAfterMs = Math.max(
          0,
          input.windowMs - (nowMs - Date.parse(baseRecord.windowStartedAt))
        );
        return { allowed: false, retryAfterMs, record: baseRecord };
      }

      const updatedRecord = {
        ...baseRecord,
        count: baseRecord.count + input.count,
        updatedAt: input.now
      };
      state.importThrottleRecords = [
        ...state.importThrottleRecords.filter(
          (candidate) => !(candidate.id === updatedRecord.id && matchesScope(candidate, scope))
        ),
        updatedRecord
      ];
    persist();
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

      const id = requestThrottleId(input.keyHash);
      const existing = state.requestThrottleRecords.find(
        (candidate) => candidate.id === id && matchesScope(candidate, scope)
      );
      const existingStartedAtMs = existing ? Date.parse(existing.windowStartedAt) : NaN;
      const windowExpired =
        !existing || !Number.isFinite(existingStartedAtMs) || nowMs - existingStartedAtMs >= input.windowMs;
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
        const retryAfterMs = Math.max(
          0,
          input.windowMs - (nowMs - Date.parse(baseRecord.windowStartedAt))
        );
        return { allowed: false, retryAfterMs, record: baseRecord };
      }

      const updatedRecord = {
        ...baseRecord,
        count: baseRecord.count + input.count,
        updatedAt: input.now
      };
      state.requestThrottleRecords = [
        ...state.requestThrottleRecords.filter(
          (candidate) => !(candidate.id === updatedRecord.id && matchesScope(candidate, scope))
        ),
        updatedRecord
      ];
    persist();
    return { allowed: true, retryAfterMs: 0, record: updatedRecord };
  },
  list(actor, scope) {
    assertCanAccess(actor, scope);
    return state.requestThrottleRecords
      .filter((record) => matchesScope(record, scope))
      .sort((left, right) => left.updatedAt.localeCompare(right.updatedAt));
  }
};


  const auth: AuthRepository = {
    upsertUser(actor, user) {
      assertAuthTenantAccess(actor, user.tenantId, user.id);
      state.authUsers = [
        ...state.authUsers.filter(
          (existing) =>
            !(existing.tenantId === user.tenantId && existing.id === user.id)
        ),
        user
      ];
      persist();
      return user;
    },
    getUser(actor, tenantId, userId) {
      assertAuthTenantAccess(actor, tenantId, userId);
      const user = state.authUsers.find(
        (candidate) => candidate.tenantId === tenantId && candidate.id === userId
      );
      if (!user) throw new RepositoryNotFoundError("Auth user not found.");
      return user;
    },
    upsertMembership(actor, membership) {
      assertCanAccess(actor, membership);
      state.workspaceMemberships = [
        ...state.workspaceMemberships.filter(
          (existing) =>
            !(
              existing.tenantId === membership.tenantId &&
              existing.workspaceId === membership.workspaceId &&
              existing.userId === membership.userId
            )
        ),
        membership
      ];
      persist();
      return membership;
    },
    getMembership(actor, scope) {
      assertCanAccess(actor, scope);
      const membership = state.workspaceMemberships.find((candidate) =>
        matchesScope(candidate, scope)
      );
      if (!membership) {
        throw new RepositoryNotFoundError("Workspace membership not found.");
      }
      return membership;
    },
    listMemberships(actor, tenantId, userId) {
      assertAuthTenantAccess(actor, tenantId, userId);
      return state.workspaceMemberships.filter(
        (membership) =>
          membership.tenantId === tenantId && membership.userId === userId
      );
    },
    upsertSession(actor, session) {
      assertCanAccess(actor, session);
      state.authSessions = [
        ...state.authSessions.filter(
          (existing) =>
            !(existing.tenantId === session.tenantId && existing.id === session.id)
        ),
        session
      ];
      persist();
      return session;
    },
    getSession(actor, sessionId) {
      const session = state.authSessions.find(
        (candidate) => candidate.id === sessionId
      );
      if (!session) throw new RepositoryNotFoundError("Auth session not found.");
      assertCanAccess(actor, session);
      return session;
    },
    listSessions(actor, scope) {
      assertCanAccess(actor, scope);
      return state.authSessions.filter((session) => matchesScope(session, scope));
    },
    revokeSession(actor, sessionId, revokedAt) {
      const session = this.getSession(actor, sessionId);
      const revokedSession = { ...session, revokedAt };
      state.authSessions = [
        ...state.authSessions.filter(
          (existing) =>
            !(existing.tenantId === session.tenantId && existing.id === session.id)
        ),
        revokedSession
      ];
      persist();
      return revokedSession;
    },
    upsertPasswordResetToken(actor, token) {
      assertCanAccess(actor, token);
      state.authPasswordResetTokens = [
        ...state.authPasswordResetTokens.filter(
          (existing) =>
            !(
              existing.tenantId === token.tenantId &&
              existing.workspaceId === token.workspaceId &&
              existing.userId === token.userId &&
              existing.id === token.id
            )
        ),
        token
      ];
      persist();
      return token;
    },
    getPasswordResetToken(actor, tokenId) {
      const token = state.authPasswordResetTokens.find(
        (candidate) => candidate.id === tokenId
      );
      if (!token) {
        throw new RepositoryNotFoundError("Password reset token not found.");
      }
      assertCanAccess(actor, token);
      return token;
    },
    listPasswordResetTokens(actor, scope) {
      assertCanAccess(actor, scope);
      return state.authPasswordResetTokens.filter((token) =>
        matchesScope(token, scope)
      );
    },
    markPasswordResetTokenUsed(actor, tokenId, usedAt) {
      const token = this.getPasswordResetToken(actor, tokenId);
      const usedToken = { ...token, usedAt };
      state.authPasswordResetTokens = [
        ...state.authPasswordResetTokens.filter(
          (existing) =>
            !(
              existing.tenantId === token.tenantId &&
              existing.workspaceId === token.workspaceId &&
              existing.userId === token.userId &&
              existing.id === token.id
            )
        ),
        usedToken
      ];
      persist();
      return usedToken;
    },
    getLoginAttemptWindow(actor, scope) {
      assertCanAccess(actor, scope);
      return state.authLoginAttemptWindows.find((window) =>
        matchesScope(window, scope)
      );
    },
    upsertLoginAttemptWindow(actor, window) {
      assertCanAccess(actor, window);
      state.authLoginAttemptWindows = [
        ...state.authLoginAttemptWindows.filter(
          (existing) =>
            !(
              existing.tenantId === window.tenantId &&
              existing.workspaceId === window.workspaceId &&
              existing.userId === window.userId &&
              existing.id === window.id
            )
        ),
        window
      ];
      persist();
      return window;
    },
    clearLoginAttemptWindow(actor, scope) {
      assertCanAccess(actor, scope);
      state.authLoginAttemptWindows = state.authLoginAttemptWindows.filter(
        (window) => !matchesScope(window, scope)
      );
      persist();
    }
  };

  const findPlan = (planId: string): SchedulePlan => {
    const plan = state.plans.find((candidate) => candidate.id === planId);
    if (!plan) throw new RepositoryNotFoundError("Schedule plan not found.");
    return plan;
  };

  const findBlock = (blockId: string): TimeBlock => {
    for (const plan of state.plans) {
      const block = plan.blocks.find((candidate) => candidate.id === blockId);
      if (block) return block;
    }
    throw new RepositoryNotFoundError("Time block not found.");
  };

  const replacePlan = (plan: SchedulePlan): void => {
    state.plans = [...state.plans.filter((existing) => existing.id !== plan.id), plan];
  };

  return {
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
  };
};

export const matchesScope = (item: Scope, scope: Scope): boolean =>
  item.tenantId === scope.tenantId &&
  item.workspaceId === scope.workspaceId &&
  item.userId === scope.userId;

const importThrottleId = (
  operation: ImportThrottleOperation,
  sourceSystem: string
): string => `${operation}:${sourceSystem}`;

const requestThrottleId = (keyHash: string): string => `REQUEST:${keyHash}`;

const assertCanAccess = (actor: RepositoryActor, scope: Scope): void => {
  if (actor.kind === "system") return;
  if (!matchesScope(actor, scope)) {
    throw new RepositoryForbiddenError();
  }
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
  if (
    event.tenantId !== scope.tenantId ||
    event.workspaceId !== scope.workspaceId ||
    event.userId !== scope.userId
  ) {
    throw new RepositoryForbiddenError("Calendar event does not match repository scope.");
  }
};

const assertWorkingHoursScope = (workingHours: WorkingHours, scope: Scope): void => {
  if (workingHours.userId !== scope.userId) {
    throw new RepositoryForbiddenError("Working hours do not match repository scope.");
  }
};

const workingHoursKey = (scope: Scope): string =>
  `${scope.tenantId}:${scope.workspaceId}:${scope.userId}`;

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

export const applyBlockTimePatch = (
  block: TimeBlock,
  patch: { start?: string; end?: string }
): TimeBlock => {
  if (block.locked || ["LOCKED", "COMPLETED", "MISSED"].includes(block.status)) {
    throw new RepositoryValidationError("Time block cannot be moved in its current state.");
  }

  const start = patch.start ?? block.start;
  const end = patch.end ?? block.end;
  const startTime = Date.parse(start);
  const endTime = Date.parse(end);

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    throw new RepositoryValidationError("Time block start and end must be valid ISO dates.");
  }
  if (startTime >= endTime) {
    throw new RepositoryValidationError("Time block start must be before end.");
  }

  return { ...block, start, end };
};
