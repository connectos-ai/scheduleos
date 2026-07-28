import test from "node:test";
import assert from "node:assert/strict";
import { createPgPostgresQueryClient } from "./postgres-client.js";
import { loadPostgresMigrations, runPostgresMigrations } from "./postgres.js";
import { createPostgresRepositorySlice } from "./postgres-repositories.js";
import type {
  AuditEvent,
  CalendarEvent,
  IdempotencyRecord,
  IntegrationState,
  SchedulePlan,
  SchedulingTask,
  TimeBlock,
  WorkingHours
} from "./domain.js";
import type { RepositoryActor } from "./repositories.js";

const liveDatabaseUrl = process.env["SCHEDULEOS_TEST_POSTGRES_URL"];

const jordan = {
  kind: "user",
  tenantId: "tenant_demo",
  workspaceId: "workspace_demo",
  userId: "user_jordan"
} satisfies RepositoryActor;

test(
  "live PostgreSQL migrations and repositories store scoped schedule data",
  { skip: liveDatabaseUrl ? false : "SCHEDULEOS_TEST_POSTGRES_URL not set" },
  async () => {
    assert.ok(liveDatabaseUrl);
    assertTestDatabaseUrl(liveDatabaseUrl);

    const client = createPgPostgresQueryClient({
      connectionString: liveDatabaseUrl
    });

    try {
      await resetPublicSchema(client);
      await runPostgresMigrations(client, await loadPostgresMigrations());
      await seedMembershipScope(client);

      const repositories = createPostgresRepositorySlice(client);
      const task = taskPayload("task_live");
      const event = calendarEventPayload("event_live");
      const workingHours = workingHoursPayload();
      const plan = planPayload("plan_live");
      const auditEvent = auditEventPayload("audit_live");
      const idempotency = idempotencyPayload("idem_live");
      const integrationState = integrationStatePayload("integration_live");

      await repositories.tasks.upsert(jordan, task);
      assert.deepEqual(
        (await repositories.tasks.list(jordan, jordan)).map((item) => item.id),
        ["task_live"]
      );

      await repositories.calendarEvents.upsert(jordan, event, jordan);
      assert.deepEqual(
        (
          await repositories.calendarEvents.listForSchedule(jordan, jordan)
        ).map((item) => item.id),
        ["event_live"]
      );

      await repositories.workingHours.put(jordan, jordan, workingHours);
      assert.equal(
        (await repositories.workingHours.get(jordan, jordan))?.timezone,
        "America/New_York"
      );

      await repositories.schedulePlans.upsert(jordan, plan);
      assert.equal(
        (await repositories.schedulePlans.get(jordan, "plan_live")).blocks[0]
          ?.id,
        "block_live"
      );

      const completedBlock = await repositories.timeBlocks.updateStatus(
        jordan,
        "block_live",
        "complete"
      );
      assert.equal(completedBlock.status, "COMPLETED");

      await repositories.auditEvents.append(jordan, auditEvent);
      assert.deepEqual(
        (await repositories.auditEvents.list(jordan, jordan)).map(
          (item) => item.id
        ),
        ["audit_live"]
      );

      const reserved = await repositories.idempotency.reserve(
        jordan,
        idempotency
      );
      assert.equal(reserved.created, true);

      const completedIdempotency = await repositories.idempotency.complete(
        jordan,
        jordan,
        "idem_live",
        {
          status: "COMPLETED",
          completedAt: "2026-07-22T18:30:00.000Z",
          responseResourceId: "plan_live"
        }
      );
      assert.equal(completedIdempotency.responseResourceId, "plan_live");

      await repositories.integrationStates.upsert(jordan, integrationState);
      assert.deepEqual(
        (await repositories.integrationStates.list(jordan, jordan)).map(
          (item) => item.id
        ),
        ["integration_live"]
      );
    } finally {
      await client.end();
    }
  }
);

function assertTestDatabaseUrl(connectionString: string): void {
  const databaseName = new URL(connectionString).pathname.replace(/^\/+/, "");

  if (!databaseName.includes("scheduleos_test")) {
    throw new Error(
      "Refusing to reset PostgreSQL database because URL path does not include scheduleos_test."
    );
  }
}

async function resetPublicSchema(
  client: ReturnType<typeof createPgPostgresQueryClient>
): Promise<void> {
  await client.query("DROP SCHEMA IF EXISTS public CASCADE");
  await client.query("CREATE SCHEMA public");
}

async function seedMembershipScope(
  client: ReturnType<typeof createPgPostgresQueryClient>
): Promise<void> {
  await client.query(
    "INSERT INTO tenants (id, name) VALUES ($1, $2)",
    ["tenant_demo", "Demo Tenant"]
  );
  await client.query(
    "INSERT INTO workspaces (tenant_id, id, name) VALUES ($1, $2, $3)",
    ["tenant_demo", "workspace_demo", "Demo Workspace"]
  );
  await client.query(
    "INSERT INTO users (tenant_id, id, email, display_name) VALUES ($1, $2, $3, $4)",
    ["tenant_demo", "user_jordan", "jordan.release-demo.invalid", "Jordan"]
  );
  await client.query(
    `INSERT INTO memberships (tenant_id, workspace_id, user_id, role)
     VALUES ($1, $2, $3, $4)`,
    ["tenant_demo", "workspace_demo", "user_jordan", "OWNER"]
  );
}

function taskPayload(id: string): SchedulingTask {
  return {
    id,
    tenantId: "tenant_demo",
    workspaceId: "workspace_demo",
    userId: "user_jordan",
    ownerId: "user_jordan",
    title: "Live PostgreSQL task",
    priority: "HIGH",
    estimatedDurationMinutes: 30,
    remainingDurationMinutes: 30,
    schedulingMode: "FLEXIBLE",
    splittable: false,
    schedulingEligible: true,
    blocked: false,
    waiting: false,
    confidence: "CONFIRMED",
    createdAt: "2026-07-22T14:00:00.000Z",
    updatedAt: "2026-07-22T14:00:00.000Z",
    deadline: "2026-07-23T17:00:00.000Z"
  };
}

function calendarEventPayload(id: string): CalendarEvent {
  return {
    id,
    tenantId: "tenant_demo",
    workspaceId: "workspace_demo",
    userId: "user_jordan",
    calendarId: "calendar_primary",
    title: "Live busy block",
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
  };
}

function workingHoursPayload(): WorkingHours {
  return {
    userId: "user_jordan",
    timezone: "America/New_York",
    daysOfWeek: [1, 2, 3, 4, 5],
    startTime: "09:00",
    endTime: "17:00"
  };
}

function planPayload(id: string): SchedulePlan {
  return {
    id,
    tenantId: "tenant_demo",
    workspaceId: "workspace_demo",
    userId: "user_jordan",
    rangeStart: "2026-07-22T09:00:00.000Z",
    rangeEnd: "2026-07-22T17:00:00.000Z",
    timezone: "UTC",
    status: "PROPOSED",
    blocks: [blockPayload("block_live")],
    unscheduledTasks: [],
    capacityWarnings: [],
    explanations: []
  };
}

function blockPayload(id: string): TimeBlock {
  return {
    id,
    taskId: "task_live",
    tenantId: "tenant_demo",
    workspaceId: "workspace_demo",
    userId: "user_jordan",
    start: "2026-07-22T15:00:00.000Z",
    end: "2026-07-22T15:30:00.000Z",
    status: "PROPOSED",
    locked: false
  };
}

function auditEventPayload(id: string): AuditEvent {
  return {
    id,
    tenantId: "tenant_demo",
    workspaceId: "workspace_demo",
    userId: "user_jordan",
    occurredAt: "2026-07-22T18:00:00.000Z",
    actorType: "USER",
    actorId: "user_jordan",
    action: "LIVE_TEST",
    resourceType: "schedule_plan",
    resourceId: "plan_live"
  };
}

function idempotencyPayload(key: string): IdempotencyRecord {
  return {
    key,
    tenantId: "tenant_demo",
    workspaceId: "workspace_demo",
    userId: "user_jordan",
    requestHash: "hash_live",
    status: "IN_PROGRESS",
    createdAt: "2026-07-22T18:00:00.000Z"
  };
}

function integrationStatePayload(id: string): IntegrationState {
  return {
    id,
    tenantId: "tenant_demo",
    workspaceId: "workspace_demo",
    userId: "user_jordan",
    sourceSystem: "CALENDAR_PROVIDER",
    externalAccountId: "account_live",
    status: "CONNECTED",
    syncCursor: "cursor_live",
    updatedAt: "2026-07-22T18:00:00.000Z"
  };
}
