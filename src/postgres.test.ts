import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  loadPostgresMigrations,
  POSTGRES_SCHEMA_MIGRATIONS_DDL,
  runPostgresMigrations,
  type PostgresQueryClient,
  type PostgresQueryResult
} from "./postgres.js";

test("PostgreSQL migration defines required production tables", async () => {
  const migration = await readFile("migrations/postgres/001_initial.sql", "utf8");

  for (const table of [
    "tenants",
    "workspaces",
    "users",
    "memberships",
    "auth_sessions",
    "auth_password_reset_tokens",
    "auth_login_attempt_windows",
    "tasks",
    "calendar_events",
    "working_hours",
    "schedule_plans",
    "time_blocks",
    "audit_events",
    "idempotency_keys",
    "integration_states"
  ]) {
    assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  }
});

test("PostgreSQL migration includes tenant scope indexes and JSONB payloads", async () => {
  const migration = await readFile("migrations/postgres/001_initial.sql", "utf8");

  assert.match(migration, /data JSONB NOT NULL/g);
  assert.match(migration, /CREATE INDEX IF NOT EXISTS idx_tasks_scope_status/g);
  assert.match(migration, /CREATE INDEX IF NOT EXISTS idx_calendar_events_time/g);
  assert.match(migration, /CREATE INDEX IF NOT EXISTS idx_schedule_plans_range/g);
  assert.match(migration, /CREATE INDEX IF NOT EXISTS idx_time_blocks_plan/g);
  assert.match(
    migration,
    /CREATE UNIQUE INDEX IF NOT EXISTS idx_idempotency_unique_scope_key/g
  );
});

test("PostgreSQL migration keeps provider secrets out of integration state", async () => {
  const migration = await readFile("migrations/postgres/001_initial.sql", "utf8");

  assert.equal(/oauth|refresh_token|access_token|client_secret/i.test(migration), false);
});

test("loads PostgreSQL migrations from disk in version order", async () => {
  const migrations = await loadPostgresMigrations();

  assert.deepEqual(
    migrations.map((migration) => migration.version),
    [1]
  );
  assert.equal(migrations[0]?.name, "initial");
  assert.match(migrations[0]?.sql ?? "", /CREATE TABLE IF NOT EXISTS tenants/);
});

test("PostgreSQL migration runner applies missing migrations transactionally", async () => {
  const client = new FakePostgresClient();

  const result = await runPostgresMigrations(client, [
    { version: 2, name: "second", sql: "CREATE TABLE second_table (id TEXT)" },
    { version: 1, name: "first", sql: "CREATE TABLE first_table (id TEXT)" }
  ]);

  assert.deepEqual(result, {
    appliedVersions: [1, 2],
    skippedVersions: []
  });
  assert.deepEqual(client.insertedVersions, [1, 2]);
  assert.match(client.statements[0] ?? "", /CREATE TABLE IF NOT EXISTS schema_migrations/);
  assert.deepEqual(client.transactionStatements, [
    "BEGIN",
    "CREATE TABLE first_table (id TEXT)",
    "INSERT INTO schema_migrations (version, name) VALUES ($1, $2)",
    "COMMIT",
    "BEGIN",
    "CREATE TABLE second_table (id TEXT)",
    "INSERT INTO schema_migrations (version, name) VALUES ($1, $2)",
    "COMMIT"
  ]);
});

test("PostgreSQL migration runner skips already-applied versions", async () => {
  const client = new FakePostgresClient([1]);

  const result = await runPostgresMigrations(client, [
    { version: 1, name: "initial", sql: "CREATE TABLE skipped (id TEXT)" },
    { version: 2, name: "second", sql: "CREATE TABLE applied (id TEXT)" }
  ]);

  assert.deepEqual(result, {
    appliedVersions: [2],
    skippedVersions: [1]
  });
  assert.deepEqual(client.insertedVersions, [2]);
  assert.equal(
    client.statements.includes("CREATE TABLE skipped (id TEXT)"),
    false
  );
});

test("PostgreSQL migration runner rolls back failed migration", async () => {
  const client = new FakePostgresClient([], "CREATE TABLE broken (id TEXT)");

  await assert.rejects(
    () =>
      runPostgresMigrations(client, [
        { version: 1, name: "broken", sql: "CREATE TABLE broken (id TEXT)" }
      ]),
    /simulated PostgreSQL failure/
  );

  assert.deepEqual(client.transactionStatements, [
    "BEGIN",
    "CREATE TABLE broken (id TEXT)",
    "ROLLBACK"
  ]);
  assert.deepEqual(client.insertedVersions, []);
});

test("PostgreSQL migration runner rejects duplicate versions", async () => {
  const client = new FakePostgresClient();

  await assert.rejects(
    () =>
      runPostgresMigrations(client, [
        { version: 1, name: "first", sql: "SELECT 1" },
        { version: 1, name: "duplicate", sql: "SELECT 2" }
      ]),
    /Duplicate PostgreSQL migration version: 1/
  );
});

class FakePostgresClient implements PostgresQueryClient {
  readonly statements: string[] = [];
  readonly insertedVersions: number[] = [];

  constructor(
    private readonly existingVersions: readonly number[] = [],
    private readonly failOnStatement?: string
  ) {}

  get transactionStatements(): string[] {
    return this.statements.filter(
      (statement) =>
        statement !== POSTGRES_SCHEMA_MIGRATIONS_DDL.trim() &&
        !statement.startsWith("SELECT version FROM schema_migrations")
    );
  }

  async query(
    sql: string,
    params: readonly unknown[] = []
  ): Promise<PostgresQueryResult> {
    const normalizedSql = sql.trim();
    this.statements.push(normalizedSql);

    if (normalizedSql === this.failOnStatement) {
      throw new Error("simulated PostgreSQL failure");
    }

    if (normalizedSql.startsWith("SELECT version FROM schema_migrations")) {
      return {
        rows: this.existingVersions.map((version) => ({ version }))
      };
    }

    if (normalizedSql.startsWith("INSERT INTO schema_migrations")) {
      const version = params[0];

      if (typeof version !== "number") {
        throw new Error("expected migration version parameter");
      }

      this.insertedVersions.push(version);
    }

    return { rows: [], rowCount: 0 };
  }
}
