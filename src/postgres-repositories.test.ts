import test from "node:test";
import assert from "node:assert/strict";
import { createPostgresRepositorySlice } from "./postgres-repositories.js";
import {
  RepositoryForbiddenError,
  RepositoryNotFoundError,
  RepositoryValidationError,
  type RepositoryActor
} from "./repositories.js";
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
import type { PostgresQueryClient, PostgresQueryResult } from "./postgres.js";

const jordan = {
  kind: "user",
  tenantId: "tenant_demo",
  workspaceId: "workspace_demo",
  userId: "user_jordan"
} satisfies RepositoryActor;

const casey = {
  kind: "user",
  tenantId: "tenant_other",
  workspaceId: "workspace_other",
  userId: "user_casey"
} satisfies RepositoryActor;

test("PostgreSQL task repository upserts scoped task rows", async () => {
  const client = new FakePostgresClient();
  const repositories = createPostgresRepositorySlice(client);
  const task = taskPayload("task_postgres");

  const saved = await repositories.tasks.upsert(jordan, task);

  assert.equal(saved.id, "task_postgres");
  assert.equal(client.queries.length, 1);
  assert.match(client.queries[0]?.sql ?? "", /INSERT INTO tasks/);
  assert.match(client.queries[0]?.sql ?? "", /ON CONFLICT/);
  assert.deepEqual(client.queries[0]?.params?.slice(0, 6), [
    "tenant_demo",
    "workspace_demo",
    "user_jordan",
    "task_postgres",
    "user_jordan",
    "ACTIVE"
  ]);
  assert.equal(client.queries[0]?.params?.[6], "HIGH");
  assert.equal(client.queries[0]?.params?.[7], "2026-07-23T17:00:00.000Z");
  assert.deepEqual(
    JSON.parse(String(client.queries[0]?.params?.[11])),
    task
  );
});

test("PostgreSQL task repository gets and deletes scoped task rows", async () => {
  const task = taskPayload("task_postgres_delete");
  const client = new FakePostgresClient([], [[{ data: task }], [{}]]);
  const repositories = createPostgresRepositorySlice(client);

  const fetched = await repositories.tasks.get(
    jordan,
    jordan,
    "task_postgres_delete"
  );
  assert.equal(fetched.id, "task_postgres_delete");
  assert.match(client.queries[0]?.sql ?? "", /SELECT data/);
  assert.deepEqual(client.queries[0]?.params, [
    "tenant_demo",
    "workspace_demo",
    "user_jordan",
    "task_postgres_delete"
  ]);

  await repositories.tasks.delete(jordan, jordan, "task_postgres_delete");
  assert.match(client.queries[1]?.sql ?? "", /DELETE FROM tasks/);
  assert.deepEqual(client.queries[1]?.params, [
    "tenant_demo",
    "workspace_demo",
    "user_jordan",
    "task_postgres_delete"
  ]);
});

test("PostgreSQL task repository lists only requested scope", async () => {
  const task = taskPayload("task_listed");
  const client = new FakePostgresClient([{ data: task }]);
  const repositories = createPostgresRepositorySlice(client);

  const listed = await repositories.tasks.list(jordan, jordan);

  assert.deepEqual(
    listed.map((item) => item.id),
    ["task_listed"]
  );
  assert.match(client.queries[0]?.sql ?? "", /WHERE tenant_id = \$1/);
  assert.deepEqual(client.queries[0]?.params, [
    "tenant_demo",
    "workspace_demo",
    "user_jordan"
  ]);
});

test("PostgreSQL task repository parses string JSONB rows", async () => {
  const task = taskPayload("task_json_string");
  const client = new FakePostgresClient([{ data: JSON.stringify(task) }]);
  const repositories = createPostgresRepositorySlice(client);

  const listed = await repositories.tasks.list(jordan, jordan);

  assert.equal(listed[0]?.id, "task_json_string");
});

test("PostgreSQL task repository rejects cross-scope writes and reads", async () => {
  const client = new FakePostgresClient();
  const repositories = createPostgresRepositorySlice(client);
  const task = taskPayload("task_forbidden");

  await assert.rejects(
    () => repositories.tasks.upsert(casey, task),
    RepositoryForbiddenError
  );
  await assert.rejects(
    () => repositories.tasks.list(casey, jordan),
    RepositoryForbiddenError
  );
  assert.equal(client.queries.length, 0);
});

test("PostgreSQL task repository allows system actor scoped access", async () => {
  const task = taskPayload("task_system");
  const client = new FakePostgresClient([{ data: task }]);
  const repositories = createPostgresRepositorySlice(client);

  const listed = await repositories.tasks.list({ kind: "system" }, jordan);

  assert.equal(listed[0]?.id, "task_system");
});

test("PostgreSQL calendar event repository upserts scoped event rows", async () => {
  const client = new FakePostgresClient();
  const repositories = createPostgresRepositorySlice(client);
  const event = calendarEventPayload("event_postgres");

  const saved = await repositories.calendarEvents.upsert(jordan, event, jordan);

  assert.equal(saved.id, "event_postgres");
  assert.equal(client.queries.length, 1);
  assert.match(client.queries[0]?.sql ?? "", /INSERT INTO calendar_events/);
  assert.match(client.queries[0]?.sql ?? "", /ON CONFLICT/);
  assert.deepEqual(client.queries[0]?.params?.slice(0, 8), [
    "tenant_demo",
    "workspace_demo",
    "user_jordan",
    "event_postgres",
    "calendar_primary",
    "2026-07-22T13:00:00.000Z",
    "2026-07-22T14:00:00.000Z",
    "BUSY"
  ]);
  assert.equal(client.queries[0]?.params?.[8], "PRIVATE");
  assert.equal(client.queries[0]?.params?.[9], 3);
  assert.deepEqual(
    JSON.parse(String(client.queries[0]?.params?.[10])),
    event
  );
});

test("PostgreSQL calendar event repository lists only requested workspace scope", async () => {
  const event = calendarEventPayload("event_listed");
  const client = new FakePostgresClient([{ data: event }]);
  const repositories = createPostgresRepositorySlice(client);

  const listed = await repositories.calendarEvents.listForSchedule(jordan, jordan);

  assert.deepEqual(
    listed.map((item) => item.id),
    ["event_listed"]
  );
  assert.match(client.queries[0]?.sql ?? "", /FROM calendar_events/);
  assert.match(client.queries[0]?.sql ?? "", /workspace_id = \$2/);
  assert.deepEqual(client.queries[0]?.params, [
    "tenant_demo",
    "workspace_demo",
    "user_jordan"
  ]);
});

test("PostgreSQL calendar event repository parses string JSONB rows", async () => {
  const event = calendarEventPayload("event_json_string");
  const client = new FakePostgresClient([{ data: JSON.stringify(event) }]);
  const repositories = createPostgresRepositorySlice(client);

  const listed = await repositories.calendarEvents.listForSchedule(jordan, jordan);

  assert.equal(listed[0]?.id, "event_json_string");
});

test("PostgreSQL calendar event repository gets scoped event rows", async () => {
  const event = calendarEventPayload("event_get");
  const client = new FakePostgresClient([{ data: event }]);
  const repositories = createPostgresRepositorySlice(client);

  const found = await repositories.calendarEvents.get(jordan, jordan, "event_get");

  assert.equal(found.id, "event_get");
  assert.match(client.queries[0]?.sql ?? "", /FROM calendar_events/);
  assert.match(client.queries[0]?.sql ?? "", /workspace_id = \$2/);
  assert.deepEqual(client.queries[0]?.params, [
    "tenant_demo",
    "workspace_demo",
    "user_jordan",
    "event_get"
  ]);
});

test("PostgreSQL calendar event repository deletes scoped event rows", async () => {
  const client = new FakePostgresClient([{ deleted: true }]);
  const repositories = createPostgresRepositorySlice(client);

  await repositories.calendarEvents.delete(jordan, jordan, "event_delete");

  assert.match(client.queries[0]?.sql ?? "", /DELETE FROM calendar_events/);
  assert.match(client.queries[0]?.sql ?? "", /workspace_id = \$2/);
  assert.deepEqual(client.queries[0]?.params, [
    "tenant_demo",
    "workspace_demo",
    "user_jordan",
    "event_delete"
  ]);
});

test("PostgreSQL calendar event repository rejects cross-scope access", async () => {
  const client = new FakePostgresClient();
  const repositories = createPostgresRepositorySlice(client);
  const event = calendarEventPayload("event_forbidden");

  await assert.rejects(
    () => repositories.calendarEvents.upsert(casey, event, jordan),
    RepositoryForbiddenError
  );
  await assert.rejects(
    () => repositories.calendarEvents.listForSchedule(casey, jordan),
    RepositoryForbiddenError
  );
  await assert.rejects(
    () => repositories.calendarEvents.get(casey, jordan, "event_forbidden"),
    RepositoryForbiddenError
  );
  await assert.rejects(
    () => repositories.calendarEvents.delete(casey, jordan, "event_forbidden"),
    RepositoryForbiddenError
  );
  assert.equal(client.queries.length, 0);
});

test("PostgreSQL calendar event repository rejects mismatched event tenant", async () => {
  const client = new FakePostgresClient();
  const repositories = createPostgresRepositorySlice(client);
  const event = {
    ...calendarEventPayload("event_wrong_tenant"),
    tenantId: "tenant_other"
  };

  await assert.rejects(
    () => repositories.calendarEvents.upsert(jordan, event, jordan),
    RepositoryForbiddenError
  );
  assert.equal(client.queries.length, 0);
});

test("PostgreSQL working hours repository puts scoped availability rows", async () => {
  const client = new FakePostgresClient();
  const repositories = createPostgresRepositorySlice(client);
  const workingHours = workingHoursPayload();

  const saved = await repositories.workingHours.put(
    jordan,
    jordan,
    workingHours
  );

  assert.equal(saved.timezone, "America/New_York");
  assert.equal(client.queries.length, 1);
  assert.match(client.queries[0]?.sql ?? "", /INSERT INTO working_hours/);
  assert.match(client.queries[0]?.sql ?? "", /ON CONFLICT/);
  assert.deepEqual(client.queries[0]?.params?.slice(0, 5), [
    "tenant_demo",
    "workspace_demo",
    "user_jordan",
    "America/New_York",
    1
  ]);
  assert.deepEqual(
    JSON.parse(String(client.queries[0]?.params?.[5])),
    workingHours
  );
});

test("PostgreSQL working hours repository gets requested scope", async () => {
  const workingHours = workingHoursPayload();
  const client = new FakePostgresClient([{ data: workingHours }]);
  const repositories = createPostgresRepositorySlice(client);

  const found = await repositories.workingHours.get(jordan, jordan);

  assert.deepEqual(found, workingHours);
  assert.match(client.queries[0]?.sql ?? "", /FROM working_hours/);
  assert.deepEqual(client.queries[0]?.params, [
    "tenant_demo",
    "workspace_demo",
    "user_jordan"
  ]);
});

test("PostgreSQL working hours repository returns undefined for missing scope", async () => {
  const client = new FakePostgresClient();
  const repositories = createPostgresRepositorySlice(client);

  const found = await repositories.workingHours.get(jordan, jordan);

  assert.equal(found, undefined);
});

test("PostgreSQL working hours repository parses string JSONB rows", async () => {
  const workingHours = workingHoursPayload();
  const client = new FakePostgresClient([
    { data: JSON.stringify(workingHours) }
  ]);
  const repositories = createPostgresRepositorySlice(client);

  const found = await repositories.workingHours.get(jordan, jordan);

  assert.equal(found?.timezone, "America/New_York");
});

test("PostgreSQL working hours repository rejects cross-scope access", async () => {
  const client = new FakePostgresClient();
  const repositories = createPostgresRepositorySlice(client);
  const workingHours = workingHoursPayload();

  await assert.rejects(
    () => repositories.workingHours.put(casey, jordan, workingHours),
    RepositoryForbiddenError
  );
  await assert.rejects(
    () => repositories.workingHours.get(casey, jordan),
    RepositoryForbiddenError
  );
  assert.equal(client.queries.length, 0);
});

test("PostgreSQL working hours repository rejects mismatched user", async () => {
  const client = new FakePostgresClient();
  const repositories = createPostgresRepositorySlice(client);
  const workingHours = { ...workingHoursPayload(), userId: "user_casey" };

  await assert.rejects(
    () => repositories.workingHours.put(jordan, jordan, workingHours),
    RepositoryForbiddenError
  );
  assert.equal(client.queries.length, 0);
});

test("PostgreSQL schedule plan repository upserts plan and block rows transactionally", async () => {
  const client = new FakePostgresClient();
  const repositories = createPostgresRepositorySlice(client);
  const plan = planPayload("plan_postgres");

  const saved = await repositories.schedulePlans.upsert(jordan, plan);

  assert.equal(saved.id, "plan_postgres");
  assert.deepEqual(
    client.queries.map((query) => query.sql.split(/\s+/).slice(0, 3).join(" ")),
    [
      "BEGIN",
      "INSERT INTO schedule_plans",
      "DELETE FROM time_blocks",
      "INSERT INTO time_blocks",
      "COMMIT"
    ]
  );
  assert.deepEqual(client.queries[1]?.params?.slice(0, 8), [
    "tenant_demo",
    "workspace_demo",
    "user_jordan",
    "plan_postgres",
    "2026-07-22T09:00:00.000Z",
    "2026-07-22T17:00:00.000Z",
    "PROPOSED",
    1
  ]);
  assert.deepEqual(JSON.parse(String(client.queries[1]?.params?.[8])), plan);
  assert.deepEqual(client.queries[3]?.params?.slice(0, 10), [
    "tenant_demo",
    "workspace_demo",
    "user_jordan",
    "block_scope",
    "plan_postgres",
    "task_scope",
    "2026-07-22T09:00:00.000Z",
    "2026-07-22T09:30:00.000Z",
    "PROPOSED",
    false
  ]);
});

test("PostgreSQL schedule plan repository reads plan with current block rows", async () => {
  const plan = { ...planPayload("plan_read"), blocks: [] };
  const block = blockPayload("block_current");
  const client = new FakePostgresClient([], [[{ data: plan }], [{ data: block }]]);
  const repositories = createPostgresRepositorySlice(client);

  const found = await repositories.schedulePlans.get(jordan, "plan_read");

  assert.equal(found.id, "plan_read");
  assert.deepEqual(
    found.blocks.map((item) => item.id),
    ["block_current"]
  );
  assert.match(client.queries[0]?.sql ?? "", /FROM schedule_plans/);
  assert.match(client.queries[1]?.sql ?? "", /FROM time_blocks/);
});

test("PostgreSQL schedule plan repository lists requested scope", async () => {
  const plan = planPayload("plan_listed");
  const client = new FakePostgresClient([{ data: plan }]);
  const repositories = createPostgresRepositorySlice(client);

  const listed = await repositories.schedulePlans.list(jordan, jordan);

  assert.deepEqual(listed.map((item) => item.id), ["plan_listed"]);
  assert.match(client.queries[0]?.sql ?? "", /FROM schedule_plans/);
  assert.match(client.queries[0]?.sql ?? "", /workspace_id = \$2/);
  assert.deepEqual(client.queries[0]?.params, [
    "tenant_demo",
    "workspace_demo",
    "user_jordan"
  ]);
});

test("PostgreSQL schedule plan repository replaces existing block rows", async () => {
  const client = new FakePostgresClient();
  const repositories = createPostgresRepositorySlice(client);
  const plan = {
    ...planPayload("plan_replace"),
    blocks: [{ ...blockPayload("block_replaced"), status: "ACCEPTED" as const }]
  };

  const replaced = await repositories.schedulePlans.replace(jordan, plan);

  assert.equal(replaced.blocks[0]?.status, "ACCEPTED");
  assert.match(client.queries[2]?.sql ?? "", /DELETE FROM time_blocks/);
  assert.equal(client.queries[3]?.params?.[8], "ACCEPTED");
});

test("PostgreSQL schedule plan repository rejects cross-scope get", async () => {
  const plan = planPayload("plan_forbidden");
  const client = new FakePostgresClient([], [[], [{ data: plan }]]);
  const repositories = createPostgresRepositorySlice(client);

  await assert.rejects(
    () => repositories.schedulePlans.get(casey, "plan_forbidden"),
    RepositoryForbiddenError
  );
  await assert.rejects(
    () => repositories.schedulePlans.list(casey, jordan),
    RepositoryForbiddenError
  );
});

test("PostgreSQL schedule plan repository reports missing plan", async () => {
  const client = new FakePostgresClient([], [[], []]);
  const repositories = createPostgresRepositorySlice(client);

  await assert.rejects(
    () => repositories.schedulePlans.get(jordan, "plan_missing"),
    RepositoryNotFoundError
  );
});

test("PostgreSQL schedule plan repository rolls back mismatched block scope", async () => {
  const client = new FakePostgresClient();
  const repositories = createPostgresRepositorySlice(client);
  const plan = {
    ...planPayload("plan_bad_block"),
    blocks: [{ ...blockPayload("block_wrong"), workspaceId: "workspace_other" }]
  };

  await assert.rejects(
    () => repositories.schedulePlans.upsert(jordan, plan),
    RepositoryForbiddenError
  );
  assert.equal(client.queries.at(-1)?.sql, "ROLLBACK");
});

test("PostgreSQL time block repository gets scoped block", async () => {
  const block = blockPayload("block_get");
  const client = new FakePostgresClient([{ data: block }]);
  const repositories = createPostgresRepositorySlice(client);

  const found = await repositories.timeBlocks.get(jordan, "block_get");

  assert.equal(found.id, "block_get");
  assert.match(client.queries[0]?.sql ?? "", /FROM time_blocks/);
  assert.deepEqual(client.queries[0]?.params, [
    "tenant_demo",
    "workspace_demo",
    "user_jordan",
    "block_get"
  ]);
});

test("PostgreSQL time block repository updates lock status", async () => {
  const block = blockPayload("block_lock");
  const client = new FakePostgresClient([], [[{ data: block }], []]);
  const repositories = createPostgresRepositorySlice(client);

  const updated = await repositories.timeBlocks.updateStatus(
    jordan,
    "block_lock",
    "lock"
  );

  assert.equal(updated.status, "LOCKED");
  assert.equal(updated.locked, true);
  assert.match(client.queries[1]?.sql ?? "", /UPDATE time_blocks/);
  assert.deepEqual(client.queries[1]?.params?.slice(0, 3), [
    "LOCKED",
    true,
    JSON.stringify(updated)
  ]);
});

test("PostgreSQL time block repository updates block time", async () => {
  const block = blockPayload("block_move");
  const client = new FakePostgresClient([], [[{ data: block }], []]);
  const repositories = createPostgresRepositorySlice(client);

  const updated = await repositories.timeBlocks.updateTime(jordan, "block_move", {
    start: "2026-07-22T10:00:00.000Z",
    end: "2026-07-22T11:30:00.000Z"
  });

  assert.equal(updated.start, "2026-07-22T10:00:00.000Z");
  assert.equal(updated.end, "2026-07-22T11:30:00.000Z");
  assert.match(client.queries[1]?.sql ?? "", /UPDATE time_blocks/);
  assert.deepEqual(client.queries[1]?.params?.slice(0, 3), [
    "2026-07-22T10:00:00.000Z",
    "2026-07-22T11:30:00.000Z",
    JSON.stringify(updated)
  ]);
});

test("PostgreSQL time block repository rejects protected block moves", async () => {
  const block = { ...blockPayload("block_locked_move"), status: "LOCKED" as const, locked: true };
  const client = new FakePostgresClient([], [[{ data: block }]]);
  const repositories = createPostgresRepositorySlice(client);

  await assert.rejects(
    () =>
      repositories.timeBlocks.updateTime(jordan, "block_locked_move", {
        start: "2026-07-22T10:00:00.000Z"
      }),
    RepositoryValidationError
  );
});

test("PostgreSQL time block repository unlocks to accepted status", async () => {
  const block = { ...blockPayload("block_unlock"), status: "LOCKED" as const, locked: true };
  const client = new FakePostgresClient([], [[{ data: block }], []]);
  const repositories = createPostgresRepositorySlice(client);

  const updated = await repositories.timeBlocks.updateStatus(
    jordan,
    "block_unlock",
    "unlock"
  );

  assert.equal(updated.status, "ACCEPTED");
  assert.equal(updated.locked, false);
});

test("PostgreSQL time block repository completes and misses blocks", async () => {
  const completeBlock = blockPayload("block_complete");
  const missedBlock = blockPayload("block_missed");
  const client = new FakePostgresClient([], [
    [{ data: completeBlock }],
    [],
    [{ data: missedBlock }],
    []
  ]);
  const repositories = createPostgresRepositorySlice(client);

  const completed = await repositories.timeBlocks.updateStatus(
    jordan,
    "block_complete",
    "complete"
  );
  const missed = await repositories.timeBlocks.updateStatus(
    jordan,
    "block_missed",
    "missed"
  );

  assert.equal(completed.status, "COMPLETED");
  assert.equal(missed.status, "MISSED");
});

test("PostgreSQL time block repository rejects cross-scope get", async () => {
  const block = blockPayload("block_forbidden");
  const client = new FakePostgresClient([], [[], [{ data: block }]]);
  const repositories = createPostgresRepositorySlice(client);

  await assert.rejects(
    () => repositories.timeBlocks.get(casey, "block_forbidden"),
    RepositoryForbiddenError
  );
});

test("PostgreSQL time block repository reports missing block", async () => {
  const client = new FakePostgresClient([], [[], []]);
  const repositories = createPostgresRepositorySlice(client);

  await assert.rejects(
    () => repositories.timeBlocks.get(jordan, "block_missing"),
    RepositoryNotFoundError
  );
});

test("PostgreSQL time block repository allows system actor access", async () => {
  const block = blockPayload("block_system");
  const client = new FakePostgresClient([{ data: block }]);
  const repositories = createPostgresRepositorySlice(client);

  const found = await repositories.timeBlocks.get(
    { kind: "system" },
    "block_system"
  );

  assert.equal(found.id, "block_system");
  assert.deepEqual(client.queries[0]?.params, ["block_system"]);
});

test("PostgreSQL audit event repository appends scoped event rows", async () => {
  const client = new FakePostgresClient();
  const repositories = createPostgresRepositorySlice(client);
  const event = auditEventPayload("audit_postgres");

  const saved = await repositories.auditEvents.append(jordan, event);

  assert.equal(saved.id, "audit_postgres");
  assert.equal(client.queries.length, 1);
  assert.match(client.queries[0]?.sql ?? "", /INSERT INTO audit_events/);
  assert.deepEqual(client.queries[0]?.params?.slice(0, 10), [
    "tenant_demo",
    "workspace_demo",
    "user_jordan",
    "audit_postgres",
    "2026-07-21T12:10:00.000Z",
    "USER",
    "user_jordan",
    "schedule.plan.accepted",
    "schedule_plan",
    "plan_scope"
  ]);
  assert.deepEqual(
    JSON.parse(String(client.queries[0]?.params?.[10])),
    event
  );
});

test("PostgreSQL audit event repository lists requested scope", async () => {
  const event = auditEventPayload("audit_listed");
  const client = new FakePostgresClient([{ data: event }]);
  const repositories = createPostgresRepositorySlice(client);

  const listed = await repositories.auditEvents.list(jordan, jordan);

  assert.deepEqual(
    listed.map((item) => item.id),
    ["audit_listed"]
  );
  assert.match(client.queries[0]?.sql ?? "", /FROM audit_events/);
  assert.match(client.queries[0]?.sql ?? "", /ORDER BY occurred_at, id/);
  assert.deepEqual(client.queries[0]?.params, [
    "tenant_demo",
    "workspace_demo",
    "user_jordan"
  ]);
});

test("PostgreSQL audit event repository parses string JSONB rows", async () => {
  const event = auditEventPayload("audit_json_string");
  const client = new FakePostgresClient([{ data: JSON.stringify(event) }]);
  const repositories = createPostgresRepositorySlice(client);

  const listed = await repositories.auditEvents.list(jordan, jordan);

  assert.equal(listed[0]?.id, "audit_json_string");
});

test("PostgreSQL audit event repository rejects cross-scope access", async () => {
  const client = new FakePostgresClient();
  const repositories = createPostgresRepositorySlice(client);
  const event = auditEventPayload("audit_forbidden");

  await assert.rejects(
    () => repositories.auditEvents.append(casey, event),
    RepositoryForbiddenError
  );
  await assert.rejects(
    () => repositories.auditEvents.list(casey, jordan),
    RepositoryForbiddenError
  );
  assert.equal(client.queries.length, 0);
});

test("PostgreSQL audit event repository allows system actor appends", async () => {
  const client = new FakePostgresClient();
  const repositories = createPostgresRepositorySlice(client);
  const event = auditEventPayload("audit_system");

  const saved = await repositories.auditEvents.append({ kind: "system" }, event);

  assert.equal(saved.id, "audit_system");
  assert.equal(client.queries.length, 1);
});

test("PostgreSQL idempotency repository reserves new scoped keys", async () => {
  const client = new FakePostgresClient([], [[], []]);
  const repositories = createPostgresRepositorySlice(client);
  const record = idempotencyPayload("idem_create");

  const result = await repositories.idempotency.reserve(jordan, record);

  assert.equal(result.created, true);
  assert.deepEqual(result.record, record);
  assert.equal(client.queries.length, 2);
  assert.match(client.queries[0]?.sql ?? "", /FROM idempotency_keys/);
  assert.match(client.queries[1]?.sql ?? "", /INSERT INTO idempotency_keys/);
  assert.deepEqual(client.queries[1]?.params?.slice(0, 6), [
    "tenant_demo",
    "workspace_demo",
    "user_jordan",
    "idem_create",
    "hash_demo",
    "IN_PROGRESS"
  ]);
  assert.deepEqual(JSON.parse(String(client.queries[1]?.params?.[10])), record);
});

test("PostgreSQL idempotency repository returns existing scoped keys", async () => {
  const existing = idempotencyPayload("idem_existing");
  const client = new FakePostgresClient([{ data: existing }]);
  const repositories = createPostgresRepositorySlice(client);

  const result = await repositories.idempotency.reserve(
    jordan,
    idempotencyPayload("idem_existing")
  );

  assert.equal(result.created, false);
  assert.deepEqual(result.record, existing);
  assert.equal(client.queries.length, 1);
  assert.match(client.queries[0]?.sql ?? "", /FROM idempotency_keys/);
});

test("PostgreSQL idempotency repository gets scoped keys", async () => {
  const record = idempotencyPayload("idem_get");
  const client = new FakePostgresClient([{ data: JSON.stringify(record) }]);
  const repositories = createPostgresRepositorySlice(client);

  const found = await repositories.idempotency.get(jordan, jordan, "idem_get");

  assert.deepEqual(found, record);
  assert.match(client.queries[0]?.sql ?? "", /FROM idempotency_keys/);
  assert.deepEqual(client.queries[0]?.params, [
    "tenant_demo",
    "workspace_demo",
    "user_jordan",
    "idem_get"
  ]);
});

test("PostgreSQL idempotency repository returns undefined for missing scoped keys", async () => {
  const client = new FakePostgresClient();
  const repositories = createPostgresRepositorySlice(client);

  const found = await repositories.idempotency.get(jordan, jordan, "missing");

  assert.equal(found, undefined);
});

test("PostgreSQL idempotency repository completes scoped keys", async () => {
  const completed = {
    ...idempotencyPayload("idem_complete"),
    status: "COMPLETED",
    completedAt: "2026-07-22T15:00:00.000Z",
    responseResourceId: "plan_demo"
  } satisfies IdempotencyRecord;
  const client = new FakePostgresClient([{ data: completed }]);
  const repositories = createPostgresRepositorySlice(client);

  const updated = await repositories.idempotency.complete(
    jordan,
    jordan,
    "idem_complete",
    {
      status: "COMPLETED",
      completedAt: "2026-07-22T15:00:00.000Z",
      responseResourceId: "plan_demo"
    }
  );

  assert.deepEqual(updated, completed);
  assert.match(client.queries[0]?.sql ?? "", /UPDATE idempotency_keys/);
  assert.match(client.queries[0]?.sql ?? "", /RETURNING data/);
  assert.deepEqual(client.queries[0]?.params?.slice(0, 7), [
    "COMPLETED",
    "2026-07-22T15:00:00.000Z",
    "plan_demo",
    "tenant_demo",
    "workspace_demo",
    "user_jordan",
    "idem_complete"
  ]);
});

test("PostgreSQL idempotency repository throws when completing missing scoped keys", async () => {
  const client = new FakePostgresClient();
  const repositories = createPostgresRepositorySlice(client);

  await assert.rejects(
    () =>
      repositories.idempotency.complete(jordan, jordan, "missing", {
        status: "FAILED",
        completedAt: "2026-07-22T15:05:00.000Z"
      }),
    RepositoryNotFoundError
  );
});

test("PostgreSQL idempotency repository rejects cross-scope access", async () => {
  const client = new FakePostgresClient();
  const repositories = createPostgresRepositorySlice(client);
  const record = idempotencyPayload("idem_forbidden");

  await assert.rejects(
    () => repositories.idempotency.reserve(casey, record),
    RepositoryForbiddenError
  );
  await assert.rejects(
    () => repositories.idempotency.get(casey, jordan, "idem_forbidden"),
    RepositoryForbiddenError
  );
  await assert.rejects(
    () =>
      repositories.idempotency.complete(casey, jordan, "idem_forbidden", {
        status: "COMPLETED",
        completedAt: "2026-07-22T15:00:00.000Z",
        responseResourceId: "plan_demo"
      }),
    RepositoryForbiddenError
  );
  assert.equal(client.queries.length, 0);
});

test("PostgreSQL integration state repository upserts scoped state rows", async () => {
  const client = new FakePostgresClient();
  const repositories = createPostgresRepositorySlice(client);
  const state = integrationStatePayload("integration_create");

  const saved = await repositories.integrationStates.upsert(jordan, state);

  assert.deepEqual(saved, state);
  assert.equal(client.queries.length, 1);
  assert.match(client.queries[0]?.sql ?? "", /INSERT INTO integration_states/);
  assert.match(client.queries[0]?.sql ?? "", /ON CONFLICT/);
  assert.deepEqual(client.queries[0]?.params?.slice(0, 8), [
    "tenant_demo",
    "workspace_demo",
    "user_jordan",
    "integration_create",
    "CALENDAR_PROVIDER",
    "account_demo",
    "CONNECTED",
    "2026-07-22T16:00:00.000Z"
  ]);
  assert.deepEqual(JSON.parse(String(client.queries[0]?.params?.[9])), state);
});

test("PostgreSQL integration state repository gets scoped state", async () => {
  const state = integrationStatePayload("integration_get");
  const client = new FakePostgresClient([{ data: JSON.stringify(state) }]);
  const repositories = createPostgresRepositorySlice(client);

  const found = await repositories.integrationStates.get(
    jordan,
    jordan,
    "integration_get"
  );

  assert.deepEqual(found, state);
  assert.match(client.queries[0]?.sql ?? "", /FROM integration_states/);
  assert.deepEqual(client.queries[0]?.params, [
    "tenant_demo",
    "workspace_demo",
    "user_jordan",
    "integration_get"
  ]);
});

test("PostgreSQL integration state repository lists requested scope", async () => {
  const state = integrationStatePayload("integration_list");
  const client = new FakePostgresClient([{ data: state }]);
  const repositories = createPostgresRepositorySlice(client);

  const listed = await repositories.integrationStates.list(jordan, jordan);

  assert.deepEqual(
    listed.map((item) => item.id),
    ["integration_list"]
  );
  assert.match(client.queries[0]?.sql ?? "", /ORDER BY source_system, id/);
  assert.deepEqual(client.queries[0]?.params, [
    "tenant_demo",
    "workspace_demo",
    "user_jordan"
  ]);
});

test("PostgreSQL integration state repository reports missing state", async () => {
  const client = new FakePostgresClient();
  const repositories = createPostgresRepositorySlice(client);

  await assert.rejects(
    () => repositories.integrationStates.get(jordan, jordan, "missing"),
    RepositoryNotFoundError
  );
});

test("PostgreSQL integration state repository rejects cross-scope access", async () => {
  const client = new FakePostgresClient();
  const repositories = createPostgresRepositorySlice(client);
  const state = integrationStatePayload("integration_forbidden");

  await assert.rejects(
    () => repositories.integrationStates.upsert(casey, state),
    RepositoryForbiddenError
  );
  await assert.rejects(
    () => repositories.integrationStates.get(casey, jordan, state.id),
    RepositoryForbiddenError
  );
  await assert.rejects(
    () => repositories.integrationStates.list(casey, jordan),
    RepositoryForbiddenError
  );
  assert.equal(client.queries.length, 0);
});

test("PostgreSQL integration state repository allows system actor reads", async () => {
  const state = integrationStatePayload("integration_system");
  const client = new FakePostgresClient([{ data: state }]);
  const repositories = createPostgresRepositorySlice(client);

  const found = await repositories.integrationStates.get(
    { kind: "system" },
    jordan,
    "integration_system"
  );

  assert.equal(found.id, "integration_system");
});

test("PostgreSQL import throttle repository creates scoped windows", async () => {
  const expected = importThrottlePayload("JSON_TASK_IMPORT:JSON_IMPORT", 2);
  const client = new FakePostgresClient([], [[], [{ data: expected }]]);
  const repositories = createPostgresRepositorySlice(client);

  const result = await repositories.importThrottles.consume(jordan, jordan, {
    sourceSystem: "JSON_IMPORT",
    operation: "JSON_TASK_IMPORT",
    count: 2,
    limit: 3,
    windowMs: 60_000,
    now: "2026-07-22T12:00:00.000Z"
  });

  assert.equal(result.allowed, true);
  assert.equal(result.retryAfterMs, 0);
  assert.deepEqual(result.record, expected);
  assert.match(client.queries[0]?.sql ?? "", /SELECT data\s+FROM import_throttles/);
  assert.match(client.queries[1]?.sql ?? "", /INSERT INTO import_throttles/);
  assert.deepEqual(client.queries[1]?.params?.slice(0, 7), [
    "tenant_demo",
    "workspace_demo",
    "user_jordan",
    "JSON_TASK_IMPORT:JSON_IMPORT",
    "JSON_IMPORT",
    "JSON_TASK_IMPORT",
    "2026-07-22T12:00:00.000Z"
  ]);
});

test("PostgreSQL import throttle repository denies over-limit rows without upsert", async () => {
  const existing = importThrottlePayload("JSON_TASK_IMPORT:JSON_IMPORT", 2);
  const client = new FakePostgresClient([{ data: existing }]);
  const repositories = createPostgresRepositorySlice(client);

  const result = await repositories.importThrottles.consume(jordan, jordan, {
    sourceSystem: "JSON_IMPORT",
    operation: "JSON_TASK_IMPORT",
    count: 2,
    limit: 3,
    windowMs: 60_000,
    now: "2026-07-22T12:00:10.000Z"
  });

  assert.equal(result.allowed, false);
  assert.equal(result.retryAfterMs, 50_000);
  assert.deepEqual(result.record, existing);
  assert.equal(client.queries.length, 1);
});

test("PostgreSQL import throttle repository resets expired scoped windows", async () => {
  const existing = importThrottlePayload("JSON_TASK_IMPORT:JSON_IMPORT", 2);
  const expected = {
    ...existing,
    windowStartedAt: "2026-07-22T12:01:01.000Z",
    count: 1,
    updatedAt: "2026-07-22T12:01:01.000Z"
  } satisfies ImportThrottleRecord;
  const client = new FakePostgresClient([], [[{ data: existing }], [{ data: expected }]]);
  const repositories = createPostgresRepositorySlice(client);

  const result = await repositories.importThrottles.consume(jordan, jordan, {
    sourceSystem: "JSON_IMPORT",
    operation: "JSON_TASK_IMPORT",
    count: 1,
    limit: 3,
    windowMs: 60_000,
    now: "2026-07-22T12:01:01.000Z"
  });

  assert.equal(result.allowed, true);
  assert.deepEqual(result.record, expected);
  assert.match(client.queries[1]?.sql ?? "", /ON CONFLICT/);
});

test("PostgreSQL import throttle repository rejects cross-scope access", async () => {
  const client = new FakePostgresClient();
  const repositories = createPostgresRepositorySlice(client);

  await assert.rejects(
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
  assert.equal(client.queries.length, 0);
});

test("PostgreSQL request throttle repository creates scoped windows", async () => {
  const expected = requestThrottlePayload("REQUEST:sha256_demo_request_key", 1);
  const client = new FakePostgresClient([], [[], [{ data: expected }]]);
  const repositories = createPostgresRepositorySlice(client);

  const result = await repositories.requestThrottles.consume(jordan, jordan, {
    keyHash: "sha256_demo_request_key",
    count: 1,
    limit: 3,
    windowMs: 60_000,
    now: "2026-07-22T12:00:00.000Z"
  });

  assert.equal(result.allowed, true);
  assert.deepEqual(result.record, expected);
  assert.match(client.queries[1]?.sql ?? "", /INSERT INTO request_throttles/);
  assert.equal(client.queries[1]?.params?.[4], "sha256_demo_request_key");
});

test("PostgreSQL request throttle repository denies over-limit requests without upsert", async () => {
  const existing = requestThrottlePayload("REQUEST:sha256_demo_request_key", 2);
  const client = new FakePostgresClient([{ data: existing }]);
  const repositories = createPostgresRepositorySlice(client);

  const result = await repositories.requestThrottles.consume(jordan, jordan, {
    keyHash: "sha256_demo_request_key",
    count: 2,
    limit: 3,
    windowMs: 60_000,
    now: "2026-07-22T12:00:10.000Z"
  });

  assert.equal(result.allowed, false);
  assert.equal(result.retryAfterMs, 50_000);
  assert.deepEqual(result.record, existing);
  assert.equal(client.queries.length, 1);
});

test("PostgreSQL request throttle repository resets expired scoped windows", async () => {
  const existing = requestThrottlePayload("REQUEST:sha256_demo_request_key", 2);
  const expected = {
    ...existing,
    windowStartedAt: "2026-07-22T12:01:01.000Z",
    count: 1,
    updatedAt: "2026-07-22T12:01:01.000Z"
  } satisfies RequestThrottleRecord;
  const client = new FakePostgresClient([], [[{ data: existing }], [{ data: expected }]]);
  const repositories = createPostgresRepositorySlice(client);

  const result = await repositories.requestThrottles.consume(jordan, jordan, {
    keyHash: "sha256_demo_request_key",
    count: 1,
    limit: 3,
    windowMs: 60_000,
    now: "2026-07-22T12:01:01.000Z"
  });

  assert.equal(result.allowed, true);
  assert.deepEqual(result.record, expected);
  assert.match(client.queries[1]?.sql ?? "", /ON CONFLICT/);
});

test("PostgreSQL request throttle repository rejects cross-scope access", async () => {
  const client = new FakePostgresClient();
  const repositories = createPostgresRepositorySlice(client);

  await assert.rejects(
    () =>
      repositories.requestThrottles.consume(casey, jordan, {
        keyHash: "sha256_demo_request_key",
        count: 1,
        limit: 3,
        windowMs: 60_000,
        now: "2026-07-22T12:00:00.000Z"
      }),
    RepositoryForbiddenError
  );
  assert.equal(client.queries.length, 0);
});

test("PostgreSQL request throttle repository lists scoped windows", async () => {
  const expected = requestThrottlePayload("REQUEST:sha256_demo_request_key", 2);
  const client = new FakePostgresClient([{ data: expected }]);
  const repositories = createPostgresRepositorySlice(client);

  const records = await repositories.requestThrottles.list(jordan, jordan);

  assert.deepEqual(records, [expected]);
  assert.match(client.queries[0]?.sql ?? "", /FROM request_throttles/);
  assert.deepEqual(client.queries[0]?.params, [
    "tenant_demo",
    "workspace_demo",
    "user_jordan"
  ]);
});

test("PostgreSQL request throttle repository rejects cross-scope list", async () => {
  const client = new FakePostgresClient();
  const repositories = createPostgresRepositorySlice(client);

  await assert.rejects(
    () => repositories.requestThrottles.list(casey, jordan),
    RepositoryForbiddenError
  );
  assert.equal(client.queries.length, 0);
});

test("PostgreSQL auth repository upserts users memberships sessions", async () => {
  const client = new FakePostgresClient();
  const repositories = createPostgresRepositorySlice(client);
  const user = authUserPayload();
  const membership = membershipPayload("ADMIN");
  const session = authSessionPayload("session_postgres");
  const resetToken = authPasswordResetTokenPayload("reset_postgres");

  assert.deepEqual(await repositories.auth.upsertUser(jordan, user), user);
  assert.deepEqual(
    await repositories.auth.upsertMembership(jordan, membership),
    membership
  );
  assert.deepEqual(
    await repositories.auth.upsertMembership(jordan, membershipPayload("EDITOR")),
    membershipPayload("EDITOR")
  );
  assert.deepEqual(await repositories.auth.upsertSession(jordan, session), session);
  assert.deepEqual(
    await repositories.auth.upsertPasswordResetToken(jordan, resetToken),
    resetToken
  );

  assert.match(client.queries[0]?.sql ?? "", /INSERT INTO users/);
  assert.deepEqual(client.queries[0]?.params?.slice(0, 6), [
    "tenant_demo",
    "user_jordan",
    "user_jordan_at_example_invalid",
    "Jordan Demo",
    "ACTIVE",
    "scrypt:credential_demo_hash"
  ]);
assert.match(client.queries[1]?.sql ?? "", /INSERT INTO memberships/);
assert.deepEqual(client.queries[1]?.params?.slice(0, 5), [
  "tenant_demo",
    "workspace_demo",
    "user_jordan",
  "ADMIN",
  "ACTIVE"
]);
assert.match(client.queries[2]?.sql ?? "", /INSERT INTO memberships/);
assert.deepEqual(client.queries[2]?.params?.slice(0, 5), [
  "tenant_demo",
  "workspace_demo",
  "user_jordan",
  "EDITOR",
  "ACTIVE"
]);
assert.match(client.queries[3]?.sql ?? "", /INSERT INTO auth_sessions/);
assert.deepEqual(client.queries[3]?.params?.slice(0, 6), [
  "tenant_demo",
  "workspace_demo",
  "user_jordan",
    "session_postgres",
    "sha256:session_demo_hash",
    "2026-07-22T12:00:00.000Z"
  ]);
assert.match(
  client.queries[4]?.sql ?? "",
  /INSERT INTO auth_password_reset_tokens/
);
assert.deepEqual(client.queries[4]?.params?.slice(0, 6), [
    "tenant_demo",
    "workspace_demo",
    "user_jordan",
    "reset_postgres",
    "sha256:reset_demo_hash",
    "2026-07-22T12:00:00.000Z"
  ]);
});

test("PostgreSQL auth repository reads users memberships sessions and reset tokens", async () => {
  const user = authUserPayload();
  const membership = membershipPayload("OWNER");
  const session = authSessionPayload("session_read");
  const secondSession = {
    ...authSessionPayload("session_read_second"),
    sessionTokenHash: "sha256:session_demo_hash_second"
  };
  const resetToken = authPasswordResetTokenPayload("reset_read");
  const secondResetToken = {
    ...authPasswordResetTokenPayload("reset_read_second"),
    tokenHash: "sha256:reset_demo_hash_second"
  };
  const client = new FakePostgresClient([], [
    [{ data: JSON.stringify(user) }],
    [{ data: membership }],
    [{ data: membership }],
    [{ data: JSON.stringify(session) }],
    [{ data: session }, { data: secondSession }],
    [{ data: JSON.stringify(resetToken) }],
    [{ data: resetToken }, { data: secondResetToken }],
    [{ data: resetToken }],
    []
  ]);
  const repositories = createPostgresRepositorySlice(client);

  assert.deepEqual(
    await repositories.auth.getUser(jordan, "tenant_demo", "user_jordan"),
    user
  );
  assert.deepEqual(await repositories.auth.getMembership(jordan, jordan), membership);
  assert.deepEqual(
    await repositories.auth.listMemberships(jordan, "tenant_demo", "user_jordan"),
    [membership]
  );
  assert.deepEqual(await repositories.auth.getSession(jordan, "session_read"), session);
  assert.deepEqual(await repositories.auth.listSessions(jordan, jordan), [
    session,
    secondSession
  ]);
  assert.deepEqual(
    await repositories.auth.getPasswordResetToken(jordan, "reset_read"),
    resetToken
  );
  assert.deepEqual(
    await repositories.auth.listPasswordResetTokens(jordan, jordan),
    [resetToken, secondResetToken]
  );
  const usedToken = await repositories.auth.markPasswordResetTokenUsed(
    jordan,
    "reset_read",
    "2026-07-22T13:05:00.000Z"
  );
  assert.equal(usedToken.usedAt, "2026-07-22T13:05:00.000Z");
  assert.match(client.queries[0]?.sql ?? "", /FROM users/);
  assert.match(client.queries[1]?.sql ?? "", /FROM memberships/);
  assert.match(client.queries[3]?.sql ?? "", /FROM auth_sessions/);
  assert.match(client.queries[4]?.sql ?? "", /FROM auth_sessions/);
  assert.match(
    client.queries[5]?.sql ?? "",
    /FROM auth_password_reset_tokens/
  );
  assert.match(
    client.queries[6]?.sql ?? "",
    /FROM auth_password_reset_tokens/
  );
  assert.match(
    client.queries[8]?.sql ?? "",
    /INSERT INTO auth_password_reset_tokens/
  );
});

test("PostgreSQL auth repository revokes scoped sessions", async () => {
  const session = authSessionPayload("session_revoke");
  const client = new FakePostgresClient([], [[{ data: session }], []]);
  const repositories = createPostgresRepositorySlice(client);

  const revoked = await repositories.auth.revokeSession(
    jordan,
    "session_revoke",
    "2026-07-22T13:00:00.000Z"
  );

  assert.equal(revoked.revokedAt, "2026-07-22T13:00:00.000Z");
  assert.match(client.queries[0]?.sql ?? "", /FROM auth_sessions/);
  assert.match(client.queries[1]?.sql ?? "", /INSERT INTO auth_sessions/);
  assert.equal(client.queries[1]?.params?.[7], "2026-07-22T13:00:00.000Z");
});

test("PostgreSQL auth repository stores scoped login attempt windows", async () => {
  const window = authLoginAttemptWindowPayload();
  const client = new FakePostgresClient(
    [],
    [[{ data: window }], [], [{ data: window }], []]
  );
  const repositories = createPostgresRepositorySlice(client);

  assert.deepEqual(
    await repositories.auth.getLoginAttemptWindow(jordan, jordan),
    window
  );
  assert.deepEqual(
    await repositories.auth.upsertLoginAttemptWindow(jordan, window),
    window
  );
  assert.deepEqual(
    await repositories.auth.getLoginAttemptWindow(jordan, jordan),
    window
  );
  await repositories.auth.clearLoginAttemptWindow(jordan, jordan);

  assert.match(client.queries[0]?.sql ?? "", /FROM auth_login_attempt_windows/);
  assert.match(client.queries[1]?.sql ?? "", /INSERT INTO auth_login_attempt_windows/);
  assert.deepEqual(client.queries[1]?.params?.slice(0, 8), [
    "tenant_demo",
    "workspace_demo",
    "user_jordan",
    "tenant_demo\u0000workspace_demo\u0000user_jordan",
    "2026-07-22T12:00:00.000Z",
    60_000,
    2,
    2
  ]);
  assert.match(client.queries[3]?.sql ?? "", /DELETE FROM auth_login_attempt_windows/);
  assert.deepEqual(client.queries[3]?.params, [
    "tenant_demo",
    "workspace_demo",
    "user_jordan"
  ]);
});

test("PostgreSQL auth repository rejects cross-scope access", async () => {
  const session = authSessionPayload("session_forbidden");
  const resetToken = authPasswordResetTokenPayload("reset_forbidden");
  const client = new FakePostgresClient([], [[{ data: session }], [{ data: resetToken }]]);
  const repositories = createPostgresRepositorySlice(client);

  await assert.rejects(
    () => repositories.auth.getUser(casey, "tenant_demo", "user_jordan"),
    RepositoryForbiddenError
  );
  await assert.rejects(
    () => repositories.auth.upsertMembership(casey, membershipPayload("MEMBER")),
    RepositoryForbiddenError
  );
  await assert.rejects(
    () => repositories.auth.getSession(casey, "session_forbidden"),
    RepositoryForbiddenError
  );
  await assert.rejects(
    () => repositories.auth.getPasswordResetToken(casey, "reset_forbidden"),
    RepositoryForbiddenError
  );
  await assert.rejects(
    () => repositories.auth.getLoginAttemptWindow(casey, jordan),
    RepositoryForbiddenError
  );
  await assert.rejects(
    () =>
      repositories.auth.upsertLoginAttemptWindow(
        casey,
        authLoginAttemptWindowPayload()
      ),
    RepositoryForbiddenError
  );
  await assert.rejects(
    () => repositories.auth.clearLoginAttemptWindow(casey, jordan),
    RepositoryForbiddenError
  );
  assert.equal(client.queries.length, 2);
});

class FakePostgresClient implements PostgresQueryClient {
  readonly queries: Array<{ sql: string; params: readonly unknown[] }> = [];

  constructor(
    private readonly rows: Array<Record<string, unknown>> = [],
    private readonly queuedRows: Array<Array<Record<string, unknown>>> = []
  ) {}

  async query(
    sql: string,
    params: readonly unknown[] = []
  ): Promise<PostgresQueryResult> {
    this.queries.push({ sql: sql.trim(), params });
    const rows = this.queuedRows.shift() ?? this.rows;
    return { rows, rowCount: rows.length };
  }
}

function taskPayload(id: string): SchedulingTask {
  return {
    id,
    tenantId: "tenant_demo",
    workspaceId: "workspace_demo",
    userId: "user_jordan",
    ownerId: "user_jordan",
    title: "PostgreSQL scoped task",
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
    updatedAt: "2026-07-21T12:05:00.000Z",
    deadline: "2026-07-23T17:00:00.000Z",
    desiredOutcome: "Finish the PostgreSQL adapter slice"
  };
}

function authUserPayload(): AuthUser {
  return {
    id: "user_jordan",
    tenantId: "tenant_demo",
    email: "user_jordan_at_example_invalid",
    displayName: "Jordan Demo",
    status: "ACTIVE",
    credentialHash: "scrypt:credential_demo_hash",
    createdAt: "2026-07-21T12:00:00.000Z",
    updatedAt: "2026-07-21T12:00:00.000Z"
  };
}

function membershipPayload(role: WorkspaceMembership["role"]): WorkspaceMembership {
  return {
    tenantId: "tenant_demo",
    workspaceId: "workspace_demo",
    userId: "user_jordan",
    role,
    status: "ACTIVE",
    createdAt: "2026-07-21T12:00:00.000Z",
    updatedAt: "2026-07-21T12:00:00.000Z"
  };
}

function authSessionPayload(id: string): AuthSession {
  return {
    id,
    tenantId: "tenant_demo",
    workspaceId: "workspace_demo",
    userId: "user_jordan",
    sessionTokenHash: "sha256:session_demo_hash",
    createdAt: "2026-07-22T12:00:00.000Z",
    expiresAt: "2026-07-23T12:00:00.000Z",
    lastSeenAt: "2026-07-22T12:15:00.000Z"
  };
}

function authPasswordResetTokenPayload(id: string): AuthPasswordResetToken {
  return {
    id,
    tenantId: "tenant_demo",
    workspaceId: "workspace_demo",
    userId: "user_jordan",
    tokenHash: "sha256:reset_demo_hash",
    createdAt: "2026-07-22T12:00:00.000Z",
    expiresAt: "2026-07-22T12:30:00.000Z"
  };
}

function authLoginAttemptWindowPayload(): AuthLoginAttemptWindow {
  return {
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
  };
}

function calendarEventPayload(id: string): CalendarEvent {
  return {
    id,
    tenantId: "tenant_demo",
    workspaceId: "workspace_demo",
    userId: "user_jordan",
    calendarId: "calendar_primary",
    title: "Private busy block",
    start: "2026-07-22T13:00:00.000Z",
    end: "2026-07-22T14:00:00.000Z",
    timezone: "UTC",
    allDay: false,
    status: "CONFIRMED",
    busyStatus: "BUSY",
    movable: false,
    locked: true,
    privacyLevel: "PRIVATE",
    version: 3,
    sourceSystem: "LOCAL"
  };
}

function workingHoursPayload(): WorkingHours {
  return {
    userId: "user_jordan",
    timezone: "America/New_York",
    daysOfWeek: [1, 2, 3, 4, 5],
    startTime: "09:00",
    endTime: "17:00",
    breakWindows: [
      {
        label: "Lunch",
        startTime: "12:00",
        endTime: "13:00"
      }
    ]
  };
}

function idempotencyPayload(key: string): IdempotencyRecord {
  return {
    key,
    tenantId: "tenant_demo",
    workspaceId: "workspace_demo",
    userId: "user_jordan",
    requestHash: "hash_demo",
    status: "IN_PROGRESS",
    createdAt: "2026-07-22T14:00:00.000Z",
    expiresAt: "2026-07-23T14:00:00.000Z"
  };
}

function integrationStatePayload(id: string): IntegrationState {
  return {
    id,
    tenantId: "tenant_demo",
    workspaceId: "workspace_demo",
    userId: "user_jordan",
    sourceSystem: "CALENDAR_PROVIDER",
    externalAccountId: "account_demo",
    status: "CONNECTED",
    syncCursor: "cursor_demo",
    lastSyncedAt: "2026-07-22T15:30:00.000Z",
    updatedAt: "2026-07-22T16:00:00.000Z",
    metadata: { provider: "demo" }
  };
}

function importThrottlePayload(id: string, count: number): ImportThrottleRecord {
  return {
    id,
    tenantId: "tenant_demo",
    workspaceId: "workspace_demo",
    userId: "user_jordan",
    sourceSystem: "JSON_IMPORT",
    operation: "JSON_TASK_IMPORT",
    windowStartedAt: "2026-07-22T12:00:00.000Z",
    windowMs: 60_000,
    limit: 3,
    count,
    updatedAt: "2026-07-22T12:00:00.000Z"
  };
}

function requestThrottlePayload(id: string, count: number): RequestThrottleRecord {
  return {
    id,
    tenantId: "tenant_demo",
    workspaceId: "workspace_demo",
    userId: "user_jordan",
    keyHash: "sha256_demo_request_key",
    windowStartedAt: "2026-07-22T12:00:00.000Z",
    windowMs: 60_000,
    limit: 3,
    count,
    updatedAt: "2026-07-22T12:00:00.000Z"
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
    blocks: [blockPayload("block_scope")],
    unscheduledTasks: [],
    capacityWarnings: [],
    explanations: []
  };
}

function blockPayload(id: string): TimeBlock {
  return {
    id,
    taskId: "task_scope",
    tenantId: "tenant_demo",
    workspaceId: "workspace_demo",
    userId: "user_jordan",
    start: "2026-07-22T09:00:00.000Z",
    end: "2026-07-22T09:30:00.000Z",
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
    occurredAt: "2026-07-21T12:10:00.000Z",
    actorType: "USER",
    actorId: "user_jordan",
    action: "schedule.plan.accepted",
    resourceType: "schedule_plan",
    resourceId: "plan_scope",
    metadata: {
      source: "postgres_repository_test"
    }
  };
}
