import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type {
  AuditEvent,
  AuthLoginAttemptWindow,
  AuthPasswordResetToken,
  AuthSession,
  IdempotencyRecord,
  IntegrationState,
  SchedulePlan,
  SchedulingTask
} from "./domain.js";
import {
  cleanupSqliteRetention,
  createSqliteRepositories,
  exportSqliteWorkspace
} from "./sqlite.js";

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

test("SQLite retention cleanup dry-run reports eligible scoped rows without deleting", async () => {
  const directory = await mkdtemp(join(tmpdir(), "scheduleos-retention-"));
  const databasePath = join(directory, "scheduleos.db");

  try {
    seedRetentionFixture(databasePath);

    const result = cleanupSqliteRetention(
      databasePath,
      jordan,
      jordan,
      new Date("2026-07-22T12:00:00.000Z")
    );

    assert.equal(result.dryRun, true);
  assert.equal(result.eligible.SCHEDULE_PLAN_HISTORY, 1);
  assert.equal(result.eligible.IDEMPOTENCY_RECORD, 1);
  assert.equal(result.eligible.AUTH_SESSION, 1);
  assert.equal(result.eligible.AUTH_PASSWORD_RESET_TOKEN, 1);
  assert.equal(result.eligible.AUTH_LOGIN_ATTEMPT_WINDOW, 1);
  assert.equal(result.eligible.IMPORT_THROTTLE_WINDOW, 1);
    assert.equal(result.eligible.INTEGRATION_SYNC_METADATA, 1);
    assert.equal(result.reviewDue.AUDIT_EVENT, 1);
    assert.deepEqual(result.deleted, {});

    const exported = exportSqliteWorkspace(databasePath, jordan, jordan);
    assert.equal(exported.schedulePlans.length, 2);
    assert.equal(exported.idempotencyRecords.length, 2);
  assert.equal(exported.integrationStates.length, 2);
  assert.equal(exported.auditEvents.length, 1);
  const reopened = createSqliteRepositories(databasePath);
  try {
    assert.deepEqual(
      reopened.repositories.auth
        .listPasswordResetTokens(jordan, jordan)
        .map((token) => token.id)
        .sort(),
      ["reset_active", "reset_old_used", "reset_recent_used"]
    );
  } finally {
    reopened.close();
  }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("SQLite retention cleanup apply deletes only eligible scoped operational rows", async () => {
  const directory = await mkdtemp(join(tmpdir(), "scheduleos-retention-"));
  const databasePath = join(directory, "scheduleos.db");

  try {
    seedRetentionFixture(databasePath);

    const result = cleanupSqliteRetention(
      databasePath,
      { kind: "system" },
      jordan,
      new Date("2026-07-22T12:00:00.000Z"),
      { dryRun: false }
    );

    assert.equal(result.dryRun, false);
  assert.equal(result.deleted.SCHEDULE_PLAN_HISTORY, 1);
  assert.equal(result.deleted.IDEMPOTENCY_RECORD, 1);
  assert.equal(result.deleted.AUTH_SESSION, 1);
  assert.equal(result.deleted.AUTH_PASSWORD_RESET_TOKEN, 1);
  assert.equal(result.deleted.AUTH_LOGIN_ATTEMPT_WINDOW, 1);
  assert.equal(result.deleted.IMPORT_THROTTLE_WINDOW, 1);
    assert.equal(result.deleted.INTEGRATION_SYNC_METADATA, 1);
    assert.equal(result.reviewDue.AUDIT_EVENT, 1);

    const exported = exportSqliteWorkspace(databasePath, jordan, jordan);
    assert.deepEqual(exported.schedulePlans.map((plan) => plan.id), ["plan_recent"]);
    assert.deepEqual(
      exported.idempotencyRecords.map((record) => record.key),
      ["idem_recent"]
    );
    assert.deepEqual(
      exported.integrationStates.map((state) => state.id),
      ["integration_connected_old"]
    );
    assert.deepEqual(exported.tasks.map((task) => task.id), ["task_active"]);
  assert.equal(exported.auditEvents.length, 1);
  const reopened = createSqliteRepositories(databasePath);
  try {
    assert.throws(
      () => reopened.repositories.auth.getSession(jordan, "session_old_revoked"),
      /Auth session not found/
    );
  assert.throws(
    () =>
      reopened.repositories.auth.getPasswordResetToken(
        jordan,
        "reset_old_used"
      ),
    /Password reset token not found/
  );
  assert.equal(
    reopened.repositories.auth.getLoginAttemptWindow(jordan, jordan)?.id,
    "login_attempt_recent"
  );
    assert.equal(
      reopened.repositories.auth.getSession(jordan, "session_recent_revoked").id,
      "session_recent_revoked"
    );
    assert.equal(
      reopened.repositories.auth.getSession(jordan, "session_active").id,
      "session_active"
    );
    assert.deepEqual(
      reopened.repositories.auth
        .listPasswordResetTokens(jordan, jordan)
        .map((token) => token.id)
        .sort(),
      ["reset_active", "reset_recent_used"]
    );
  } finally {
    reopened.close();
  }

    const otherScope = exportSqliteWorkspace(databasePath, casey, casey);
    assert.deepEqual(otherScope.schedulePlans.map((plan) => plan.id), ["plan_other_old"]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

const seedRetentionFixture = (databasePath: string): void => {
  const sqlite = createSqliteRepositories(databasePath);
  try {
    sqlite.repositories.tasks.upsert(jordan, taskPayload("task_active"));
    sqlite.repositories.schedulePlans.upsert(jordan, planPayload("plan_old", "2025-01-02T12:00:00.000Z"));
    sqlite.repositories.schedulePlans.upsert(
      jordan,
      planPayload("plan_recent", "2026-07-21T12:00:00.000Z")
    );
    sqlite.repositories.schedulePlans.upsert(
      { kind: "system" },
      {
        ...planPayload("plan_other_old", "2025-01-02T12:00:00.000Z"),
        tenantId: casey.tenantId,
        workspaceId: casey.workspaceId,
        userId: casey.userId,
        blocks: []
      }
    );
    sqlite.repositories.idempotency.reserve(
      jordan,
      idempotencyPayload("idem_old", "2026-05-01T12:00:00.000Z")
    );
  sqlite.repositories.idempotency.reserve(
    jordan,
    idempotencyPayload("idem_recent", "2026-07-21T12:00:00.000Z")
  );
  sqlite.repositories.auth.upsertSession(
    jordan,
    authSessionPayload(
      "session_old_revoked",
      "2026-01-01T12:00:00.000Z",
      "2026-05-01T12:00:00.000Z"
    )
  );
  sqlite.repositories.auth.upsertSession(
    jordan,
    authSessionPayload(
      "session_recent_revoked",
      "2026-07-01T12:00:00.000Z",
      "2026-07-21T12:00:00.000Z"
    )
  );
  sqlite.repositories.auth.upsertSession(
    jordan,
    authSessionPayload("session_active", "2026-08-01T12:00:00.000Z")
  );
  sqlite.repositories.auth.upsertPasswordResetToken(
    jordan,
    authPasswordResetTokenPayload(
      "reset_old_used",
      "2026-05-01T12:00:00.000Z",
      "2026-05-01T12:05:00.000Z"
    )
  );
  sqlite.repositories.auth.upsertPasswordResetToken(
    jordan,
    authPasswordResetTokenPayload(
      "reset_recent_used",
      "2026-07-21T12:30:00.000Z",
      "2026-07-21T12:05:00.000Z"
    )
  );
  sqlite.repositories.auth.upsertPasswordResetToken(
    jordan,
    authPasswordResetTokenPayload("reset_active", "2026-08-01T12:00:00.000Z")
  );
  sqlite.repositories.auth.upsertLoginAttemptWindow(
    jordan,
    authLoginAttemptWindowPayload(
      "login_attempt_old",
      "2026-05-01T12:00:00.000Z",
      "2026-05-01T12:15:00.000Z"
    )
  );
  sqlite.repositories.auth.upsertLoginAttemptWindow(
    jordan,
    authLoginAttemptWindowPayload(
      "login_attempt_recent",
      "2026-07-21T12:00:00.000Z",
      "2026-07-21T12:15:00.000Z"
    )
  );
  sqlite.repositories.integrationStates.upsert(
      jordan,
      integrationPayload("integration_disconnected_old", "DISCONNECTED", "2026-01-01T12:00:00.000Z")
    );
    sqlite.repositories.integrationStates.upsert(
      jordan,
      integrationPayload("integration_connected_old", "CONNECTED", "2026-01-01T12:00:00.000Z")
    );
    sqlite.repositories.auditEvents.append(jordan, auditPayload("audit_old"));
    sqlite.repositories.importThrottles.consume(jordan, jordan, {
      sourceSystem: "CSV",
      operation: "CSV_TASK_IMPORT",
      now: "2026-06-01T12:00:00.000Z",
      windowMs: 60_000,
      limit: 100,
      count: 1
    });
  } finally {
    sqlite.close();
  }
};

const taskPayload = (id: string): SchedulingTask => ({
  id,
  tenantId: jordan.tenantId,
  workspaceId: jordan.workspaceId,
  userId: jordan.userId,
  ownerId: jordan.userId,
  title: `Task ${id}`,
  priority: "HIGH",
  estimatedDurationMinutes: 30,
  remainingDurationMinutes: 30,
  schedulingMode: "FLEXIBLE",
  splittable: true,
  schedulingEligible: true,
  blocked: false,
  waiting: false,
  confidence: "CONFIRMED",
  createdAt: "2026-07-22T10:00:00.000Z",
  updatedAt: "2026-07-22T10:00:00.000Z"
});

const planPayload = (id: string, rangeEnd: string): SchedulePlan => ({
  id,
  tenantId: jordan.tenantId,
  workspaceId: jordan.workspaceId,
  userId: jordan.userId,
  rangeStart: "2025-01-01T12:00:00.000Z",
  rangeEnd,
  timezone: "America/New_York",
  status: "ACCEPTED",
  blocks: [
    {
      id: `${id}_block`,
      taskId: "task_active",
      tenantId: jordan.tenantId,
      workspaceId: jordan.workspaceId,
      userId: jordan.userId,
      start: "2025-01-01T13:00:00.000Z",
      end: "2025-01-01T13:30:00.000Z",
      status: "ACCEPTED",
      locked: false
    }
  ],
  unscheduledTasks: [],
  capacityWarnings: [],
  explanations: []
});

const idempotencyPayload = (key: string, createdAt: string): IdempotencyRecord => ({
  key,
  tenantId: jordan.tenantId,
  workspaceId: jordan.workspaceId,
  userId: jordan.userId,
  requestHash: `sha256:${key}`,
  status: "COMPLETED",
  createdAt
});

const authSessionPayload = (
  id: string,
  expiresAt: string,
  revokedAt?: string
): AuthSession => ({
  id,
  tenantId: jordan.tenantId,
  workspaceId: jordan.workspaceId,
  userId: jordan.userId,
  sessionTokenHash: `sha256_${id}`,
  createdAt: "2026-01-01T12:00:00.000Z",
  expiresAt,
  ...(revokedAt === undefined ? {} : { revokedAt })
});

const authPasswordResetTokenPayload = (
  id: string,
  expiresAt: string,
  usedAt?: string
): AuthPasswordResetToken => ({
  id,
  tenantId: jordan.tenantId,
  workspaceId: jordan.workspaceId,
  userId: jordan.userId,
  tokenHash: `sha256_${id}`,
  createdAt: "2026-01-01T12:00:00.000Z",
  expiresAt,
  ...(usedAt === undefined ? {} : { usedAt })
});

const authLoginAttemptWindowPayload = (
  id: string,
  updatedAt: string,
  lockedUntil?: string
): AuthLoginAttemptWindow => ({
  id,
  tenantId: jordan.tenantId,
  workspaceId: jordan.workspaceId,
  userId: jordan.userId,
  windowStartedAt: updatedAt,
  windowMs: 60_000,
  maxFailedAttempts: 2,
  failedCount: 2,
  updatedAt,
  ...(lockedUntil === undefined ? {} : { lockedUntil })
});

const integrationPayload = (
  id: string,
  status: IntegrationState["status"],
  updatedAt: string
): IntegrationState => ({
  id,
  tenantId: jordan.tenantId,
  workspaceId: jordan.workspaceId,
  userId: jordan.userId,
  sourceSystem: "CALENDAR_PROVIDER",
  status,
  updatedAt
});

const auditPayload = (id: string): AuditEvent => ({
  id,
  tenantId: jordan.tenantId,
  workspaceId: jordan.workspaceId,
  userId: jordan.userId,
  occurredAt: "2025-01-01T12:00:00.000Z",
  actorType: "USER",
  actorId: jordan.userId,
  action: "TASK_CREATED",
  resourceType: "task",
  resourceId: "task_active"
});
