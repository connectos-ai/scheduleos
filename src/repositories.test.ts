import test from "node:test";
import assert from "node:assert/strict";
import {
  createStoreRepositories,
  RepositoryForbiddenError,
  RepositoryNotFoundError,
  RepositoryValidationError
} from "./repositories.js";
import { createApiStore } from "./store.js";
import type {
  AuditEvent,
  AuthLoginAttemptWindow,
  AuthPasswordResetToken,
  AuthSession,
  AuthUser,
  CalendarEvent,
  IdempotencyRecord,
  IntegrationState,
  RequestThrottleRecord,
  SchedulePlan,
  SchedulingTask,
  TimeBlock,
  WorkingHours,
  WorkspaceMembership
} from "./domain.js";

const jordan = {
  kind: "user" as const,
  tenantId: "tenant_demo",
  workspaceId: "workspace_demo",
  userId: "user_jordan"
};

const casey = {
  kind: "user" as const,
  tenantId: "tenant_other",
  workspaceId: "workspace_other",
  userId: "user_casey"
};

test("task repository enforces tenant workspace user scope", () => {
  const repositories = createStoreRepositories(createApiStore());
  const task = taskPayload("task_scope");

  repositories.tasks.upsert(jordan, task);

  assert.deepEqual(repositories.tasks.list(jordan, jordan).map((item) => item.id), [
    "task_scope"
  ]);
  assert.throws(
    () => repositories.tasks.upsert(casey, task),
    RepositoryForbiddenError
  );
  assert.throws(
    () => repositories.tasks.list(casey, jordan),
    RepositoryForbiddenError
  );
});

test("task repository gets and deletes scoped tasks", () => {
  const repositories = createStoreRepositories(createApiStore());
  const task = taskPayload("task_delete");
  repositories.tasks.upsert(jordan, task);

  assert.equal(repositories.tasks.get(jordan, jordan, "task_delete").id, "task_delete");

  repositories.tasks.delete(jordan, jordan, "task_delete");
  assert.deepEqual(repositories.tasks.list(jordan, jordan), []);
  assert.throws(
    () => repositories.tasks.get(jordan, jordan, "task_delete"),
    RepositoryNotFoundError
  );
  assert.throws(
    () => repositories.tasks.delete(jordan, jordan, "task_delete"),
    RepositoryNotFoundError
  );
});

test("calendar event repository gets lists and deletes scoped events", () => {
  const repositories = createStoreRepositories(createApiStore());
  const event = calendarEventPayload("event_delete");
  repositories.calendarEvents.upsert(jordan, event, jordan);

  assert.equal(
    repositories.calendarEvents.get(jordan, jordan, "event_delete").id,
    "event_delete"
  );
  assert.deepEqual(
    repositories.calendarEvents.listForSchedule(jordan, jordan).map((item) => item.id),
    ["event_delete"]
  );

  repositories.calendarEvents.delete(jordan, jordan, "event_delete");
  assert.deepEqual(repositories.calendarEvents.listForSchedule(jordan, jordan), []);
  assert.throws(
    () => repositories.calendarEvents.get(jordan, jordan, "event_delete"),
    RepositoryNotFoundError
  );
  assert.throws(
    () => repositories.calendarEvents.delete(jordan, jordan, "event_delete"),
    RepositoryNotFoundError
  );
});

test("calendar event repository enforces tenant workspace user scope", () => {
  const repositories = createStoreRepositories(createApiStore());
  const event = calendarEventPayload("event_scope");

  repositories.calendarEvents.upsert(jordan, event, jordan);

  assert.throws(
    () => repositories.calendarEvents.upsert(casey, event, jordan),
    RepositoryForbiddenError
  );
  assert.throws(
    () => repositories.calendarEvents.get(casey, jordan, "event_scope"),
    RepositoryForbiddenError
  );
  assert.throws(
    () => repositories.calendarEvents.listForSchedule(casey, jordan),
    RepositoryForbiddenError
  );
  assert.throws(
    () => repositories.calendarEvents.delete(casey, jordan, "event_scope"),
    RepositoryForbiddenError
  );
});

test("schedule plan repository rejects cross-scope plan access", () => {
  const repositories = createStoreRepositories(createApiStore());
  const plan = planPayload("plan_scope");

  repositories.schedulePlans.upsert(jordan, plan);

  assert.equal(repositories.schedulePlans.get(jordan, "plan_scope").id, "plan_scope");
  assert.deepEqual(
    repositories.schedulePlans.list(jordan, jordan).map((item) => item.id),
    ["plan_scope"]
  );
  assert.throws(
    () => repositories.schedulePlans.get(casey, "plan_scope"),
    RepositoryForbiddenError
  );
  assert.throws(
    () => repositories.schedulePlans.list(casey, jordan),
    RepositoryForbiddenError
  );
});

test("time block repository rejects cross-scope block updates", () => {
  const repositories = createStoreRepositories(createApiStore());
  repositories.schedulePlans.upsert(jordan, planPayload("plan_blocks"));

  const updated = repositories.timeBlocks.updateStatus(jordan, "block_scope", "lock");

  assert.equal(updated.status, "LOCKED");
  assert.throws(
    () => repositories.timeBlocks.updateStatus(casey, "block_scope", "complete"),
    RepositoryForbiddenError
  );
});

test("time block repository moves active blocks and persists plan state", () => {
  const repositories = createStoreRepositories(createApiStore());
  repositories.schedulePlans.upsert(jordan, planPayload("plan_move_blocks"));

  const updated = repositories.timeBlocks.updateTime(jordan, "block_scope", {
    start: "2026-07-22T10:00:00.000Z",
    end: "2026-07-22T11:00:00.000Z"
  });

  assert.equal(updated.start, "2026-07-22T10:00:00.000Z");
  assert.equal(updated.end, "2026-07-22T11:00:00.000Z");
  const persistedBlock = repositories.schedulePlans.get(jordan, "plan_move_blocks").blocks[0];
  assert.ok(persistedBlock);
  assert.equal(persistedBlock.start, "2026-07-22T10:00:00.000Z");
});

test("time block repository rejects cross-scope and protected block moves", () => {
  const repositories = createStoreRepositories(createApiStore());
  repositories.schedulePlans.upsert(jordan, planPayload("plan_protected_blocks"));

  assert.throws(
    () =>
      repositories.timeBlocks.updateTime(casey, "block_scope", {
        start: "2026-07-22T10:00:00.000Z"
      }),
    RepositoryForbiddenError
  );

  repositories.timeBlocks.updateStatus(jordan, "block_scope", "lock");

  assert.throws(
    () =>
      repositories.timeBlocks.updateTime(jordan, "block_scope", {
        start: "2026-07-22T10:00:00.000Z"
      }),
    RepositoryValidationError
  );
});

test("working hours repository requires matching tenant workspace user scope", () => {
  const repositories = createStoreRepositories(createApiStore());
  const workingHours: WorkingHours = {
    userId: "user_jordan",
    timezone: "UTC",
    daysOfWeek: [3],
    startTime: "09:00",
    endTime: "17:00"
  };

  repositories.workingHours.put(jordan, jordan, workingHours);

  assert.equal(repositories.workingHours.get(jordan, jordan)?.timezone, "UTC");
  assert.throws(
    () => repositories.workingHours.get(casey, jordan),
    RepositoryForbiddenError
  );
});

test("audit event repository appends and lists scoped events only", () => {
  const repositories = createStoreRepositories(createApiStore());
  const auditEvent = auditEventPayload("audit_scope");

  repositories.auditEvents.append(jordan, auditEvent);

  assert.deepEqual(
    repositories.auditEvents.list(jordan, jordan).map((event) => event.id),
    ["audit_scope"]
  );
  assert.throws(
    () => repositories.auditEvents.append(casey, auditEvent),
    RepositoryForbiddenError
  );
  assert.throws(
    () => repositories.auditEvents.list(casey, jordan),
    RepositoryForbiddenError
  );
});

test("idempotency repository reserves scoped operation keys", () => {
  const repositories = createStoreRepositories(createApiStore());
  const record = idempotencyRecordPayload("import_tasks:demo-key");

  const first = repositories.idempotency.reserve(jordan, record);
  const second = repositories.idempotency.reserve(jordan, record);

  assert.equal(first.created, true);
  assert.equal(second.created, false);
  assert.equal(second.record.key, "import_tasks:demo-key");
  assert.throws(
    () => repositories.idempotency.get(casey, jordan, "import_tasks:demo-key"),
    RepositoryForbiddenError
  );
});

test("integration state repository stores scoped sync metadata without tokens", () => {
  const repositories = createStoreRepositories(createApiStore());
  const integrationState = integrationStatePayload("integration_calendar_demo");

  repositories.integrationStates.upsert(jordan, integrationState);

  assert.equal(
    repositories.integrationStates.get(jordan, jordan, "integration_calendar_demo")
      .sourceSystem,
    "CALENDAR_PROVIDER"
  );
  assert.throws(
    () =>
      repositories.integrationStates.upsert(casey, integrationState),
    RepositoryForbiddenError
  );
  assert.throws(
    () =>
      repositories.integrationStates.get(
        casey,
        jordan,
        "integration_calendar_demo"
      ),
    RepositoryForbiddenError
  );
});

test("import throttle repository tracks scoped source windows", () => {
  const repositories = createStoreRepositories(createApiStore());
  const first = repositories.importThrottles.consume(jordan, jordan, {
    sourceSystem: "JSON_IMPORT",
    operation: "JSON_TASK_IMPORT",
    count: 2,
    limit: 3,
    windowMs: 60_000,
    now: "2026-07-22T12:00:00.000Z"
  });
  const denied = repositories.importThrottles.consume(jordan, jordan, {
    sourceSystem: "JSON_IMPORT",
    operation: "JSON_TASK_IMPORT",
    count: 2,
    limit: 3,
    windowMs: 60_000,
    now: "2026-07-22T12:00:10.000Z"
  });
  const otherSource = repositories.importThrottles.consume(jordan, jordan, {
    sourceSystem: "CSV_IMPORT",
    operation: "JSON_TASK_IMPORT",
    count: 2,
    limit: 3,
    windowMs: 60_000,
    now: "2026-07-22T12:00:10.000Z"
  });
  const resetWindow = repositories.importThrottles.consume(jordan, jordan, {
    sourceSystem: "JSON_IMPORT",
    operation: "JSON_TASK_IMPORT",
    count: 1,
    limit: 3,
    windowMs: 60_000,
    now: "2026-07-22T12:01:01.000Z"
  });

  assert.equal(first.allowed, true);
  assert.equal(first.record.count, 2);
  assert.equal(denied.allowed, false);
  assert.equal(denied.retryAfterMs, 50_000);
  assert.equal(otherSource.allowed, true);
  assert.equal(resetWindow.allowed, true);
  assert.equal(resetWindow.record.count, 1);
  assert.throws(
    () =>
      repositories.importThrottles.consume(casey, jordan, {
        sourceSystem: "JSON_IMPORT",
        operation: "JSON_TASK_IMPORT",
        count: 1,
        limit: 3,
        windowMs: 60_000,
        now: "2026-07-22T12:00:00.000Z"
      }),
    RepositoryForbiddenError
  );
});

test("request throttle repository tracks scoped hashed key windows", () => {
  const repositories = createStoreRepositories(createApiStore());

  const first = repositories.requestThrottles.consume(jordan, jordan, {
    keyHash: "sha256_demo_request_key",
    count: 1,
    limit: 2,
    windowMs: 60_000,
    now: "2026-07-22T12:00:00.000Z"
  });
  const denied = repositories.requestThrottles.consume(jordan, jordan, {
    keyHash: "sha256_demo_request_key",
    count: 2,
    limit: 2,
    windowMs: 60_000,
    now: "2026-07-22T12:00:10.000Z"
  });
  const otherKey = repositories.requestThrottles.consume(jordan, jordan, {
    keyHash: "sha256_demo_other_request_key",
    count: 1,
    limit: 2,
    windowMs: 60_000,
    now: "2026-07-22T12:00:10.000Z"
  });
  const resetWindow = repositories.requestThrottles.consume(jordan, jordan, {
    keyHash: "sha256_demo_request_key",
    count: 1,
    limit: 2,
    windowMs: 60_000,
    now: "2026-07-22T12:01:01.000Z"
  });

  assert.equal(first.allowed, true);
  assert.equal(first.record.count, 1);
  assert.equal(denied.allowed, false);
  assert.equal(denied.retryAfterMs, 50_000);
  assert.equal(denied.record.count, 1);
  assert.equal(otherKey.allowed, true);
  assert.equal(resetWindow.allowed, true);
  assert.equal(resetWindow.record.count, 1);
  assert.deepEqual(
    repositories.requestThrottles.consume(jordan, jordan, {
      keyHash: "sha256_demo_request_key",
      count: 0,
      limit: 2,
      windowMs: 60_000,
      now: "2026-07-22T12:01:02.000Z"
    }).record,
    {
      id: "REQUEST:sha256_demo_request_key",
      tenantId: "tenant_demo",
      workspaceId: "workspace_demo",
      userId: "user_jordan",
      keyHash: "sha256_demo_request_key",
      windowStartedAt: "2026-07-22T12:01:01.000Z",
      windowMs: 60_000,
      limit: 2,
      count: 1,
      updatedAt: "2026-07-22T12:01:02.000Z"
    } satisfies RequestThrottleRecord
  );
  assert.deepEqual(
    repositories.requestThrottles
      .list(jordan, jordan)
      .map((record) => record.keyHash),
    ["sha256_demo_other_request_key", "sha256_demo_request_key"]
  );
  assert.throws(
    () =>
      repositories.requestThrottles.consume(casey, jordan, {
        keyHash: "sha256_demo_request_key",
        count: 1,
        limit: 2,
        windowMs: 60_000,
        now: "2026-07-22T12:00:00.000Z"
      }),
    RepositoryForbiddenError
  );
  assert.throws(
    () => repositories.requestThrottles.list(casey, jordan),
    RepositoryForbiddenError
  );
});

test("auth repository stores users memberships sessions and reset tokens with scope checks", () => {
  const repositories = createStoreRepositories(createApiStore());
  const system = { kind: "system" as const };

  repositories.auth.upsertUser(system, authUserPayload());
  repositories.auth.upsertMembership(system, membershipPayload("OWNER"));
  repositories.auth.upsertSession(system, authSessionPayload("session_jordan"));
  repositories.auth.upsertSession(system, {
    ...authSessionPayload("session_jordan_second"),
    sessionTokenHash: "sha256:session_demo_hash_second"
  });
  repositories.auth.upsertPasswordResetToken(
    system,
    authPasswordResetTokenPayload("reset_jordan")
  );
  repositories.auth.upsertPasswordResetToken(system, {
    ...authPasswordResetTokenPayload("reset_jordan_second"),
    tokenHash: "sha256:reset_demo_hash_second"
  });
  repositories.auth.upsertLoginAttemptWindow(
    system,
    authLoginAttemptWindowPayload()
  );

  assert.equal(
    repositories.auth.getUser(jordan, "tenant_demo", "user_jordan").email,
    "user_jordan_at_example_invalid"
  );
  assert.equal(repositories.auth.getMembership(jordan, jordan).role, "OWNER");
  assert.deepEqual(
    repositories.auth
      .listMemberships(jordan, "tenant_demo", "user_jordan")
      .map((membership) => membership.workspaceId),
    ["workspace_demo"]
  );
  assert.equal(
    repositories.auth.getSession(jordan, "session_jordan").sessionTokenHash,
    "sha256:session_demo_hash"
  );
  assert.deepEqual(
    repositories.auth.listSessions(jordan, jordan).map((session) => session.id),
    ["session_jordan", "session_jordan_second"]
  );
  assert.equal(
    repositories.auth.getPasswordResetToken(jordan, "reset_jordan").tokenHash,
    "sha256:reset_demo_hash"
  );
  assert.deepEqual(
    repositories.auth
      .listPasswordResetTokens(jordan, jordan)
      .map((token) => token.id),
    ["reset_jordan", "reset_jordan_second"]
  );
  assert.equal(
    repositories.auth.getLoginAttemptWindow(jordan, jordan)?.failedCount,
    2
  );

  assert.throws(
    () => repositories.auth.getUser(casey, "tenant_demo", "user_jordan"),
    RepositoryForbiddenError
  );
  assert.throws(
    () => repositories.auth.getMembership(casey, jordan),
    RepositoryForbiddenError
  );
  assert.throws(
    () => repositories.auth.listSessions(casey, jordan),
    RepositoryForbiddenError
  );
  assert.throws(
    () => repositories.auth.getPasswordResetToken(casey, "reset_jordan"),
    RepositoryForbiddenError
  );
  assert.throws(
    () => repositories.auth.listPasswordResetTokens(casey, jordan),
    RepositoryForbiddenError
  );
  assert.throws(
    () => repositories.auth.getLoginAttemptWindow(casey, jordan),
    RepositoryForbiddenError
  );
  assert.throws(
    () =>
      repositories.auth.revokeSession(
        casey,
        "session_jordan",
        "2026-07-22T13:00:00.000Z"
      ),
    RepositoryForbiddenError
  );

  const revoked = repositories.auth.revokeSession(
    jordan,
    "session_jordan",
    "2026-07-22T13:00:00.000Z"
  );
  assert.equal(revoked.revokedAt, "2026-07-22T13:00:00.000Z");
  const usedToken = repositories.auth.markPasswordResetTokenUsed(
    jordan,
    "reset_jordan",
    "2026-07-22T13:05:00.000Z"
  );
  assert.equal(usedToken.usedAt, "2026-07-22T13:05:00.000Z");
  assert.equal(
    repositories.auth.getPasswordResetToken(jordan, "reset_jordan").usedAt,
    "2026-07-22T13:05:00.000Z"
  );
  repositories.auth.clearLoginAttemptWindow(jordan, jordan);
  assert.equal(repositories.auth.getLoginAttemptWindow(jordan, jordan), undefined);
});

const taskPayload = (id: string): SchedulingTask => ({
  id,
  tenantId: "tenant_demo",
  workspaceId: "workspace_demo",
  userId: "user_jordan",
  ownerId: "user_jordan",
  title: "Scoped task",
  priority: "HIGH",
  estimatedDurationMinutes: 30,
  remainingDurationMinutes: 30,
  schedulingMode: "FLEXIBLE",
  splittable: false,
  schedulingEligible: true,
  blocked: false,
  waiting: false,
  confidence: "CONFIRMED",
  createdAt: "2026-07-21T12:00:00.000Z",
  updatedAt: "2026-07-21T12:00:00.000Z"
});

const authUserPayload = (): AuthUser => ({
  id: "user_jordan",
  tenantId: "tenant_demo",
  email: "user_jordan_at_example_invalid",
  displayName: "Jordan Demo",
  status: "ACTIVE",
  credentialHash: "scrypt:credential_demo_hash",
  createdAt: "2026-07-21T12:00:00.000Z",
  updatedAt: "2026-07-21T12:00:00.000Z"
});

const membershipPayload = (
  role: WorkspaceMembership["role"]
): WorkspaceMembership => ({
  tenantId: "tenant_demo",
  workspaceId: "workspace_demo",
  userId: "user_jordan",
  role,
  status: "ACTIVE",
  createdAt: "2026-07-21T12:00:00.000Z",
  updatedAt: "2026-07-21T12:00:00.000Z"
});

const authSessionPayload = (id: string): AuthSession => ({
  id,
  tenantId: "tenant_demo",
  workspaceId: "workspace_demo",
  userId: "user_jordan",
  sessionTokenHash: "sha256:session_demo_hash",
  createdAt: "2026-07-22T12:00:00.000Z",
  expiresAt: "2026-07-23T12:00:00.000Z",
  lastSeenAt: "2026-07-22T12:15:00.000Z"
});

const authPasswordResetTokenPayload = (
  id: string
): AuthPasswordResetToken => ({
  id,
  tenantId: "tenant_demo",
  workspaceId: "workspace_demo",
  userId: "user_jordan",
  tokenHash: "sha256:reset_demo_hash",
  createdAt: "2026-07-22T12:00:00.000Z",
  expiresAt: "2026-07-22T12:30:00.000Z"
});

const authLoginAttemptWindowPayload = (): AuthLoginAttemptWindow => ({
  id: "tenant_demo\u0000workspace_demo\u0000user_jordan",
  tenantId: "tenant_demo",
  workspaceId: "workspace_demo",
  userId: "user_jordan",
  windowStartedAt: "2026-07-22T12:00:00.000Z",
  windowMs: 60_000,
  maxFailedAttempts: 2,
  failedCount: 2,
  lockedUntil: "2026-07-22T12:01:00.000Z",
  updatedAt: "2026-07-22T12:00:10.000Z"
});

const calendarEventPayload = (id: string): CalendarEvent => ({
  id,
  tenantId: "tenant_demo",
  workspaceId: "workspace_demo",
  userId: "user_jordan",
  calendarId: "calendar_primary",
  title: "Scoped busy block",
  start: "2026-07-22T13:00:00.000Z",
  end: "2026-07-22T14:00:00.000Z",
  timezone: "UTC",
  allDay: false,
  status: "CONFIRMED",
  busyStatus: "BUSY",
  movable: false,
  locked: true,
  privacyLevel: "PRIVATE",
  version: 1,
  sourceSystem: "LOCAL"
});

const planPayload = (id: string): SchedulePlan => ({
  id,
  tenantId: "tenant_demo",
  workspaceId: "workspace_demo",
  userId: "user_jordan",
  rangeStart: "2026-07-22T09:00:00.000Z",
  rangeEnd: "2026-07-22T17:00:00.000Z",
  timezone: "UTC",
  status: "PROPOSED",
  blocks: [blockPayload("block_scope")],
  unscheduledTasks: [],
  capacityWarnings: [],
  explanations: []
});

const blockPayload = (id: string): TimeBlock => ({
  id,
  taskId: "task_scope",
  tenantId: "tenant_demo",
  workspaceId: "workspace_demo",
  userId: "user_jordan",
  start: "2026-07-22T09:00:00.000Z",
  end: "2026-07-22T09:30:00.000Z",
  status: "PROPOSED",
  locked: false
});

const auditEventPayload = (id: string): AuditEvent => ({
  id,
  tenantId: "tenant_demo",
  workspaceId: "workspace_demo",
  userId: "user_jordan",
  occurredAt: "2026-07-21T12:00:00.000Z",
  actorType: "USER",
  actorId: "user_jordan",
  action: "schedule.plan.accepted",
  resourceType: "schedule_plan",
  resourceId: "plan_scope",
  metadata: { planId: "plan_scope" }
});

const idempotencyRecordPayload = (key: string): IdempotencyRecord => ({
  key,
  tenantId: "tenant_demo",
  workspaceId: "workspace_demo",
  userId: "user_jordan",
  requestHash: "sha256:demo",
  status: "IN_PROGRESS",
  createdAt: "2026-07-21T12:00:00.000Z"
});

const integrationStatePayload = (id: string): IntegrationState => ({
  id,
  tenantId: "tenant_demo",
  workspaceId: "workspace_demo",
  userId: "user_jordan",
  sourceSystem: "CALENDAR_PROVIDER",
  externalAccountId: "account_demo",
  status: "CONNECTED",
  syncCursor: "cursor_demo",
  updatedAt: "2026-07-21T12:00:00.000Z"
});
