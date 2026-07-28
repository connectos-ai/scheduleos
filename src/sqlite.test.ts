import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  backupSqliteDatabase,
  createSqliteRepositories,
  deleteSqliteWorkspace,
  exportSqliteWorkspace,
  migrateSqliteDatabase,
  restoreSqliteDatabase
} from "./sqlite.js";
import { RepositoryForbiddenError } from "./repositories.js";
import type {
  AuditEvent,
  AuthLoginAttemptWindow,
  AuthPasswordResetToken,
  AuthSession,
  AuthUser,
  CalendarEvent,
  IdempotencyRecord,
  IntegrationState,
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

test("SQLite migration file defines required durable tables", async () => {
  const migration = await readFile("migrations/sqlite/001_initial.sql", "utf8");

  for (const table of [
    "tasks",
    "calendar_events",
    "working_hours",
    "schedule_plans",
    "time_blocks",
    "audit_events",
    "idempotency_keys",
    "integration_states",
    "auth_users",
    "workspace_memberships",
    "auth_sessions",
    "auth_password_reset_tokens",
    "auth_login_attempt_windows"
  ]) {
    assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  }
});

test("SQLite repositories persist scoped scheduling state across reopen", async () => {
  const directory = await mkdtemp(join(tmpdir(), "scheduleos-sqlite-"));
  const databasePath = join(directory, "scheduleos.db");

  try {
    const first = createSqliteRepositories(databasePath);
    first.repositories.workingHours.put(jordan, jordan, workingHoursPayload());
    first.repositories.tasks.upsert(jordan, taskPayload("task_sqlite"));
    first.repositories.schedulePlans.upsert(jordan, planPayload("plan_sqlite"));
    first.repositories.idempotency.reserve(
      jordan,
      idempotencyRecordPayload("plan:demo")
    );
    first.repositories.integrationStates.upsert(
      jordan,
      integrationStatePayload("integration_sqlite")
    );
    first.close();

    const second = createSqliteRepositories(databasePath);
    assert.equal(second.repositories.workingHours.get(jordan, jordan)?.timezone, "UTC");
    assert.deepEqual(
      second.repositories.tasks.list(jordan, jordan).map((task) => task.id),
      ["task_sqlite"]
    );
    const persistedPlan = second.repositories.schedulePlans.get(jordan, "plan_sqlite");
    assert.equal(persistedPlan.blocks.length, 1);
    assert.equal(persistedPlan.blocks[0]?.id, "block_sqlite");
    assert.equal(
      second.repositories.idempotency.get(jordan, jordan, "plan:demo")?.status,
      "IN_PROGRESS"
    );
    assert.equal(
      second.repositories.integrationStates.get(jordan, jordan, "integration_sqlite")
        .sourceSystem,
      "CALENDAR_PROVIDER"
    );
    second.close();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("SQLite repositories persist auth users memberships sessions across reopen", async () => {
  const directory = await mkdtemp(join(tmpdir(), "scheduleos-sqlite-"));
  const databasePath = join(directory, "scheduleos.db");
  const system = { kind: "system" as const };

  try {
    const first = createSqliteRepositories(databasePath);
    first.repositories.auth.upsertUser(system, authUserPayload());
    first.repositories.auth.upsertMembership(system, membershipPayload("ADMIN"));
    first.repositories.auth.upsertSession(system, authSessionPayload("session_sqlite"));
  first.repositories.auth.upsertSession(
    system,
    {
      ...authSessionPayload("session_sqlite_second"),
      sessionTokenHash: "sha256:session_demo_hash_second"
    }
  );
  first.repositories.auth.upsertPasswordResetToken(
    system,
    authPasswordResetTokenPayload("reset_sqlite")
  );
    first.repositories.auth.upsertPasswordResetToken(system, {
      ...authPasswordResetTokenPayload("reset_sqlite_second"),
      tokenHash: "sha256:reset_demo_hash_second"
    });
    first.repositories.auth.upsertLoginAttemptWindow(
      system,
      authLoginAttemptWindowPayload()
    );
    first.close();

    const second = createSqliteRepositories(databasePath);
    assert.equal(
      second.repositories.auth.getUser(jordan, "tenant_demo", "user_jordan")
        .email,
      "user_jordan_at_example_invalid"
    );
    assert.equal(
      second.repositories.auth.getMembership(jordan, jordan).role,
      "ADMIN"
    );
    assert.equal(
      second.repositories.auth.getSession(jordan, "session_sqlite")
        .sessionTokenHash,
      "sha256:session_demo_hash"
    );
  assert.deepEqual(
    second.repositories.auth.listSessions(jordan, jordan).map((session) => session.id),
    ["session_sqlite", "session_sqlite_second"]
  );
  assert.equal(
    second.repositories.auth.getPasswordResetToken(jordan, "reset_sqlite")
      .tokenHash,
    "sha256:reset_demo_hash"
  );
    assert.deepEqual(
      second.repositories.auth
        .listPasswordResetTokens(jordan, jordan)
        .map((token) => token.id),
      ["reset_sqlite", "reset_sqlite_second"]
    );
    assert.equal(
      second.repositories.auth.getLoginAttemptWindow(jordan, jordan)?.failedCount,
      2
    );
  const usedToken = second.repositories.auth.markPasswordResetTokenUsed(
    jordan,
    "reset_sqlite",
    "2026-07-22T13:05:00.000Z"
  );
  assert.equal(usedToken.usedAt, "2026-07-22T13:05:00.000Z");
  assert.throws(
    () =>
      second.repositories.auth.getUser(casey, "tenant_demo", "user_jordan"),
      RepositoryForbiddenError
    );
    assert.throws(
      () => second.repositories.auth.getSession(casey, "session_sqlite"),
      RepositoryForbiddenError
    );
  assert.throws(
    () => second.repositories.auth.listSessions(casey, jordan),
    RepositoryForbiddenError
  );
  assert.throws(
    () => second.repositories.auth.getPasswordResetToken(casey, "reset_sqlite"),
    RepositoryForbiddenError
  );
    assert.throws(
      () => second.repositories.auth.listPasswordResetTokens(casey, jordan),
      RepositoryForbiddenError
    );
    assert.throws(
      () => second.repositories.auth.getLoginAttemptWindow(casey, jordan),
      RepositoryForbiddenError
    );
    second.repositories.auth.clearLoginAttemptWindow(jordan, jordan);
    assert.equal(
      second.repositories.auth.getLoginAttemptWindow(jordan, jordan),
      undefined
    );
    second.close();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("SQLite repositories enforce tenant workspace user scope", async () => {
  const directory = await mkdtemp(join(tmpdir(), "scheduleos-sqlite-"));
  const databasePath = join(directory, "scheduleos.db");

  try {
    const sqlite = createSqliteRepositories(databasePath);
    sqlite.repositories.tasks.upsert(jordan, taskPayload("task_forbidden"));
    sqlite.repositories.schedulePlans.upsert(jordan, planPayload("plan_forbidden"));

    assert.throws(
      () => sqlite.repositories.tasks.list(casey, jordan),
      RepositoryForbiddenError
    );
    assert.throws(
      () => sqlite.repositories.schedulePlans.get(casey, "plan_forbidden"),
      RepositoryForbiddenError
    );
    assert.throws(
      () => sqlite.repositories.timeBlocks.updateStatus(casey, "block_sqlite", "lock"),
      RepositoryForbiddenError
    );

    sqlite.close();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("SQLite request throttle repository tracks scoped hashed windows", async () => {
  const directory = await mkdtemp(join(tmpdir(), "scheduleos-sqlite-"));
  const databasePath = join(directory, "scheduleos.db");
  try {
    const sqlite = createSqliteRepositories(databasePath);
    const first = sqlite.repositories.requestThrottles.consume(jordan, jordan, {
      keyHash: "sha256_demo_request_key",
      count: 1,
      limit: 2,
      windowMs: 60_000,
      now: "2026-07-22T12:00:00.000Z"
    });
    const denied = sqlite.repositories.requestThrottles.consume(jordan, jordan, {
      keyHash: "sha256_demo_request_key",
      count: 2,
      limit: 2,
      windowMs: 60_000,
      now: "2026-07-22T12:00:10.000Z"
    });
    const reset = sqlite.repositories.requestThrottles.consume(jordan, jordan, {
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
    assert.equal(reset.allowed, true);
    assert.equal(reset.record.count, 1);
    sqlite.close();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("SQLite repositories reject cross-scope access for every durable surface", async () => {
  const directory = await mkdtemp(join(tmpdir(), "scheduleos-sqlite-"));
  const databasePath = join(directory, "scheduleos.db");

  try {
    const sqlite = createSqliteRepositories(databasePath);

    sqlite.repositories.tasks.upsert(jordan, taskPayload("task_sqlite_scope"));
    sqlite.repositories.calendarEvents.upsert(
      jordan,
      calendarEventPayload("event_sqlite_scope"),
      jordan
    );
    sqlite.repositories.workingHours.put(jordan, jordan, workingHoursPayload());
    sqlite.repositories.schedulePlans.upsert(jordan, planPayload("plan_sqlite_scope"));
    sqlite.repositories.auditEvents.append(jordan, auditEventPayload("audit_sqlite_scope"));
    sqlite.repositories.idempotency.reserve(
      jordan,
      idempotencyRecordPayload("scope:sqlite")
    );
    sqlite.repositories.integrationStates.upsert(
      jordan,
      integrationStatePayload("integration_sqlite_scope")
    );
    sqlite.repositories.importThrottles.consume(jordan, jordan, {
      sourceSystem: "JSON_IMPORT",
      operation: "JSON_TASK_IMPORT",
      count: 1,
      limit: 3,
      windowMs: 60_000,
      now: "2026-07-22T12:00:00.000Z"
    });
    sqlite.repositories.requestThrottles.consume(jordan, jordan, {
      keyHash: "sha256_demo_request_key",
      count: 1,
      limit: 3,
      windowMs: 60_000,
      now: "2026-07-22T12:00:00.000Z"
    });

    assert.throws(() => sqlite.repositories.tasks.list(casey, jordan), RepositoryForbiddenError);
    assert.throws(
      () => sqlite.repositories.calendarEvents.listForSchedule(casey, jordan),
      RepositoryForbiddenError
    );
    assert.throws(
      () => sqlite.repositories.calendarEvents.get(casey, jordan, "event_sqlite_scope"),
      RepositoryForbiddenError
    );
    assert.throws(
      () => sqlite.repositories.calendarEvents.delete(casey, jordan, "event_sqlite_scope"),
      RepositoryForbiddenError
    );
    assert.throws(() => sqlite.repositories.workingHours.get(casey, jordan), RepositoryForbiddenError);
    assert.throws(
      () => sqlite.repositories.workingHours.put(casey, jordan, workingHoursPayload()),
      RepositoryForbiddenError
    );
    assert.throws(
      () => sqlite.repositories.schedulePlans.list(casey, jordan),
      RepositoryForbiddenError
    );
    assert.throws(
      () => sqlite.repositories.schedulePlans.get(casey, "plan_sqlite_scope"),
      RepositoryForbiddenError
    );
    assert.throws(
      () => sqlite.repositories.timeBlocks.get(casey, "block_sqlite"),
      RepositoryForbiddenError
    );
    assert.throws(
      () => sqlite.repositories.timeBlocks.updateTime(casey, "block_sqlite", {
        start: "2026-07-22T10:00:00.000Z"
      }),
      RepositoryForbiddenError
    );
    assert.throws(
      () => sqlite.repositories.auditEvents.list(casey, jordan),
      RepositoryForbiddenError
    );
    assert.throws(
      () => sqlite.repositories.idempotency.get(casey, jordan, "scope:sqlite"),
      RepositoryForbiddenError
    );
    assert.throws(
      () => sqlite.repositories.idempotency.complete(casey, jordan, "scope:sqlite", {
        status: "COMPLETED"
      }),
      RepositoryForbiddenError
    );
    assert.throws(
      () => sqlite.repositories.integrationStates.list(casey, jordan),
      RepositoryForbiddenError
    );
    assert.throws(
      () =>
        sqlite.repositories.integrationStates.get(
          casey,
          jordan,
          "integration_sqlite_scope"
        ),
      RepositoryForbiddenError
    );
    assert.throws(
      () =>
        sqlite.repositories.importThrottles.consume(casey, jordan, {
          sourceSystem: "JSON_IMPORT",
          operation: "JSON_TASK_IMPORT",
          count: 1,
          limit: 3,
          windowMs: 60_000,
          now: "2026-07-22T12:00:01.000Z"
        }),
      RepositoryForbiddenError
    );
    assert.throws(
      () =>
        sqlite.repositories.requestThrottles.consume(casey, jordan, {
          keyHash: "sha256_demo_request_key",
          count: 1,
          limit: 3,
          windowMs: 60_000,
          now: "2026-07-22T12:00:00.000Z"
        }),
      RepositoryForbiddenError
    );

    sqlite.close();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("SQLite migration runner records applied migration version", async () => {
  const directory = await mkdtemp(join(tmpdir(), "scheduleos-sqlite-"));
  const databasePath = join(directory, "scheduleos.db");

  try {
    const result = migrateSqliteDatabase(databasePath);
    assert.deepEqual(result.appliedVersions, [1]);

    const secondRun = migrateSqliteDatabase(databasePath);
    assert.deepEqual(secondRun.appliedVersions, []);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("SQLite backup creates a restorable database copy", async () => {
  const directory = await mkdtemp(join(tmpdir(), "scheduleos-sqlite-"));
  const databasePath = join(directory, "scheduleos.db");
  const backupPath = join(directory, "backup", "scheduleos-backup.db");

  try {
    const sqlite = createSqliteRepositories(databasePath);
    sqlite.repositories.tasks.upsert(jordan, taskPayload("task_backup"));
    sqlite.close();

    const result = await backupSqliteDatabase(databasePath, backupPath);
    assert.equal(result.backupPath, backupPath);
    assert.equal(result.bytes > 0, true);

    const restored = createSqliteRepositories(backupPath);
    assert.deepEqual(
      restored.repositories.tasks.list(jordan, jordan).map((task) => task.id),
      ["task_backup"]
    );
    restored.close();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("SQLite restore copies backup and smoke validates requested scope", async () => {
  const directory = await mkdtemp(join(tmpdir(), "scheduleos-sqlite-"));
  const databasePath = join(directory, "scheduleos.db");
  const backupPath = join(directory, "backup", "scheduleos-backup.db");
  const restorePath = join(directory, "restore", "scheduleos-restored.db");

  try {
    const sqlite = createSqliteRepositories(databasePath);
    sqlite.repositories.tasks.upsert(jordan, taskPayload("task_restore"));
    sqlite.repositories.workingHours.put(jordan, jordan, workingHoursPayload());
    sqlite.repositories.schedulePlans.upsert(jordan, planPayload("plan_restore"));
    sqlite.close();

    await backupSqliteDatabase(databasePath, backupPath);
    const result = await restoreSqliteDatabase(backupPath, restorePath, jordan);

    assert.equal(result.restorePath, restorePath);
    assert.equal(result.bytes > 0, true);
    assert.equal(result.smoke.tasks, 1);
    assert.equal(result.smoke.workingHours, true);
    assert.equal(result.smoke.schedulePlans, 1);

    const restored = createSqliteRepositories(restorePath);
    assert.deepEqual(
      restored.repositories.tasks.list(jordan, jordan).map((task) => task.id),
      ["task_restore"]
    );
    restored.close();

    await assert.rejects(
      () => restoreSqliteDatabase(backupPath, restorePath, jordan),
      /already exists/
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("SQLite workspace export includes only requested scope", async () => {
  const directory = await mkdtemp(join(tmpdir(), "scheduleos-sqlite-"));
  const databasePath = join(directory, "scheduleos.db");

  try {
    const sqlite = createSqliteRepositories(databasePath);
    sqlite.repositories.tasks.upsert(jordan, taskPayload("task_export"));
    sqlite.repositories.tasks.upsert(casey, {
      ...taskPayload("task_other"),
      tenantId: casey.tenantId,
      workspaceId: casey.workspaceId,
      userId: casey.userId,
      ownerId: casey.userId
    });
    sqlite.repositories.workingHours.put(jordan, jordan, workingHoursPayload());
    sqlite.repositories.schedulePlans.upsert(jordan, planPayload("plan_export"));
    sqlite.repositories.integrationStates.upsert(
      jordan,
      integrationStatePayload("integration_export")
    );
    sqlite.close();

    const exported = exportSqliteWorkspace(databasePath, jordan, jordan);

    assert.equal(exported.scope.tenantId, "tenant_demo");
    assert.deepEqual(exported.tasks.map((task) => task.id), ["task_export"]);
    assert.deepEqual(exported.schedulePlans.map((plan) => plan.id), [
      "plan_export"
    ]);
    assert.deepEqual(
      exported.integrationStates.map((state) => state.id),
      ["integration_export"]
    );
    assert.equal(JSON.stringify(exported).includes("task_other"), false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("SQLite workspace deletion removes only requested scoped data", async () => {
  const directory = await mkdtemp(join(tmpdir(), "scheduleos-sqlite-"));
  const databasePath = join(directory, "scheduleos.db");

  try {
    const sqlite = createSqliteRepositories(databasePath);
    sqlite.repositories.tasks.upsert(jordan, taskPayload("task_delete"));
    sqlite.repositories.tasks.upsert(casey, {
      ...taskPayload("task_keep"),
      tenantId: casey.tenantId,
      workspaceId: casey.workspaceId,
      userId: casey.userId,
      ownerId: casey.userId
    });
    sqlite.repositories.workingHours.put(jordan, jordan, workingHoursPayload());
    sqlite.repositories.schedulePlans.upsert(jordan, planPayload("plan_delete"));
    sqlite.repositories.idempotency.reserve(
      jordan,
      idempotencyRecordPayload("delete:demo")
    );
    sqlite.repositories.integrationStates.upsert(
      jordan,
      integrationStatePayload("integration_delete")
    );
    sqlite.close();

    const result = deleteSqliteWorkspace(databasePath, jordan, jordan);

    assert.equal(result.deleted.tasks, 1);
    assert.equal(result.deleted.workingHours, 1);
    assert.equal(result.deleted.schedulePlans, 1);
    assert.equal(result.deleted.timeBlocks, 1);
    assert.equal(result.deleted.idempotencyRecords, 1);
    assert.equal(result.deleted.integrationStates, 1);

    const reopened = createSqliteRepositories(databasePath);
    assert.deepEqual(reopened.repositories.tasks.list(jordan, jordan), []);
    assert.deepEqual(
      reopened.repositories.tasks.list(casey, casey).map((task) => task.id),
      ["task_keep"]
    );
    reopened.close();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

const taskPayload = (id: string): SchedulingTask => ({
  id,
  tenantId: "tenant_demo",
  workspaceId: "workspace_demo",
  userId: "user_jordan",
  ownerId: "user_jordan",
  title: "SQLite task",
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

const workingHoursPayload = (): WorkingHours => ({
  userId: "user_jordan",
  timezone: "UTC",
  daysOfWeek: [3],
  startTime: "09:00",
  endTime: "17:00"
});

const calendarEventPayload = (id: string): CalendarEvent => ({
  id,
  tenantId: "tenant_demo",
  workspaceId: "workspace_demo",
  userId: "user_jordan",
  calendarId: "calendar_primary",
  title: "SQLite scoped busy block",
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
  blocks: [blockPayload("block_sqlite")],
  unscheduledTasks: [],
  capacityWarnings: [],
  explanations: []
});

const blockPayload = (id: string): TimeBlock => ({
  id,
  taskId: "task_sqlite",
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
  action: "TASK_CREATED",
  resourceType: "task",
  resourceId: "task_sqlite_scope",
  metadata: { planId: "plan_sqlite_scope" }
});

const idempotencyRecordPayload = (key: string): IdempotencyRecord => ({
  key,
  tenantId: "tenant_demo",
  workspaceId: "workspace_demo",
  userId: "user_jordan",
  requestHash: "sha256:sqlite-demo",
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
