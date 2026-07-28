import test from "node:test";
import assert from "node:assert/strict";
import {
  cleanupPostgresRetention,
  type PostgresRetentionCleanupResult
} from "./postgres-repositories.js";
import type { PostgresQueryClient, PostgresQueryResult } from "./postgres.js";

const jordan = {
  kind: "user" as const,
  tenantId: "tenant_demo",
  workspaceId: "workspace_demo",
  userId: "user_jordan"
};

test("PostgreSQL retention cleanup dry-run reports scoped eligible rows without delete", async () => {
  const client = new FakeRetentionPostgresClient([
    countRows(1),
    countRows(2),
    countRows(3),
    countRows(4),
    countRows(5),
    countRows(6),
    countRows(7),
    countRows(8)
  ]);

  const result = await cleanupPostgresRetention(
    client,
    jordan,
    jordan,
    new Date("2026-07-22T12:00:00.000Z")
  );

  assert.equal(result.dryRun, true);
  assert.equal(result.eligible.SCHEDULE_PLAN_HISTORY, 1);
  assert.equal(result.eligible.IDEMPOTENCY_RECORD, 2);
  assert.equal(result.eligible.AUTH_SESSION, 3);
  assert.equal(result.eligible.AUTH_PASSWORD_RESET_TOKEN, 4);
  assert.equal(result.eligible.AUTH_LOGIN_ATTEMPT_WINDOW, 5);
  assert.equal(result.eligible.IMPORT_THROTTLE_WINDOW, 6);
  assert.equal(result.eligible.INTEGRATION_SYNC_METADATA, 7);
  assert.equal(result.reviewDue.AUDIT_EVENT, 8);
  assert.deepEqual(result.deleted, {});
  assert.equal(client.queries.some((query) => query.sql.startsWith("DELETE")), false);
  assert.deepEqual(client.queries[0]?.params, [
    "tenant_demo",
    "workspace_demo",
    "user_jordan",
    "2026-01-23T12:00:00.000Z"
  ]);
});

test("PostgreSQL retention cleanup apply deletes scoped operational rows in transaction", async () => {
  const client = new FakeRetentionPostgresClient([
    countRows(1),
    countRows(2),
    countRows(3),
    countRows(4),
    countRows(5),
    countRows(6),
    countRows(7),
    countRows(8),
    changedRows(9),
    changedRows(1),
    changedRows(2),
    changedRows(3),
    changedRows(4),
    changedRows(5),
    changedRows(6),
    changedRows(7)
  ]);

  const result: PostgresRetentionCleanupResult = await cleanupPostgresRetention(
    client,
    { kind: "system" },
    jordan,
    new Date("2026-07-22T12:00:00.000Z"),
    { dryRun: false }
  );

  assert.equal(result.dryRun, false);
  assert.equal(result.deleted.SCHEDULE_PLAN_HISTORY, 1);
  assert.equal(result.deleted.IDEMPOTENCY_RECORD, 2);
  assert.equal(result.deleted.AUTH_SESSION, 3);
  assert.equal(result.deleted.AUTH_PASSWORD_RESET_TOKEN, 4);
  assert.equal(result.deleted.AUTH_LOGIN_ATTEMPT_WINDOW, 5);
  assert.equal(result.deleted.IMPORT_THROTTLE_WINDOW, 6);
  assert.equal(result.deleted.INTEGRATION_SYNC_METADATA, 7);
  assert.equal(result.reviewDue.AUDIT_EVENT, 8);

  const sql = client.queries.map((query) => query.sql);
  assert.equal(sql.includes("BEGIN"), true);
  assert.equal(sql.includes("COMMIT"), true);
  assert.equal(sql.includes("ROLLBACK"), false);
  assert.equal(sql.filter((query) => query.startsWith("DELETE")).length, 8);
  assert.match(sql.join("\n"), /DELETE FROM time_blocks/);
  assert.match(sql.join("\n"), /DELETE FROM schedule_plans/);
  assert.match(sql.join("\n"), /DELETE FROM idempotency_keys/);
  assert.match(sql.join("\n"), /DELETE FROM auth_sessions/);
  assert.match(sql.join("\n"), /DELETE FROM auth_login_attempt_windows/);
  assert.match(sql.join("\n"), /DELETE FROM import_throttles/);
  assert.match(sql.join("\n"), /DELETE FROM integration_states/);
  assert.equal(sql.join("\n").includes("DELETE FROM audit_events"), false);
});

test("PostgreSQL retention cleanup rolls back failed apply", async () => {
  const client = new FakeRetentionPostgresClient([
    countRows(1),
    countRows(0),
    countRows(0),
    countRows(0),
    countRows(0),
    countRows(0),
    countRows(0),
    countRows(0)
  ]);
  client.failOnDelete = true;

  await assert.rejects(
    () =>
      cleanupPostgresRetention(
        client,
        { kind: "system" },
        jordan,
        new Date("2026-07-22T12:00:00.000Z"),
        { dryRun: false }
      ),
    /delete failed/
  );

  const sql = client.queries.map((query) => query.sql);
  assert.equal(sql.includes("BEGIN"), true);
  assert.equal(sql.includes("ROLLBACK"), true);
  assert.equal(sql.includes("COMMIT"), false);
});

const countRows = (count: number): PostgresQueryResult => ({
  rows: [{ count: String(count) }],
  rowCount: 1
});

const changedRows = (rowCount: number): PostgresQueryResult => ({
  rows: [],
  rowCount
});

class FakeRetentionPostgresClient implements PostgresQueryClient {
  readonly queries: Array<{ sql: string; params: readonly unknown[] }> = [];
  failOnDelete = false;

  constructor(private readonly results: PostgresQueryResult[]) {}

  async query(sql: string, params: readonly unknown[] = []): Promise<PostgresQueryResult> {
    const normalized = sql.trim();
    this.queries.push({ sql: normalized, params });
    if (this.failOnDelete && normalized.startsWith("DELETE")) {
      throw new Error("delete failed");
    }
    if (normalized === "BEGIN" || normalized === "COMMIT" || normalized === "ROLLBACK") {
      return { rows: [], rowCount: 0 };
    }
    return this.results.shift() ?? { rows: [], rowCount: 0 };
  }
}
