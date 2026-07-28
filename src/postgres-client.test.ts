import test from "node:test";
import assert from "node:assert/strict";
import {
  createPgPostgresQueryClientFromEnv,
  PgPostgresQueryClient,
  type PgPoolLike
} from "./postgres-client.js";

test("pg PostgreSQL query client delegates parameterized queries", async () => {
  const pool = new FakePgPool([{ id: "tenant_demo" }]);
  const client = new PgPostgresQueryClient(pool);

  const result = await client.query("SELECT * FROM tenants WHERE id = $1", [
    "tenant_demo"
  ]);

  assert.deepEqual(result.rows, [{ id: "tenant_demo" }]);
  assert.equal(result.rowCount, 1);
  assert.deepEqual(pool.queries, [
    {
      sql: "SELECT * FROM tenants WHERE id = $1",
      params: ["tenant_demo"]
    }
  ]);
});

test("pg PostgreSQL query client handles command results without rows", async () => {
  const pool = new FakePgPool(undefined, { rowCount: null });
  const client = new PgPostgresQueryClient(pool);

  const result = await client.query("CREATE TABLE demo (id text)");

  assert.deepEqual(result.rows, []);
  assert.equal(result.rowCount, undefined);
});

test("pg PostgreSQL query client closes pool", async () => {
  const pool = new FakePgPool();
  const client = new PgPostgresQueryClient(pool);

  await client.end();

  assert.equal(pool.closed, true);
});

test("pg PostgreSQL env factory requires explicit ScheduleOS database URL", () => {
  const client = createPgPostgresQueryClientFromEnv({});

  assert.equal(client, undefined);
});

test("pg PostgreSQL query client pins transaction queries to one client", async () => {
  const pool = new FakePgPool();
  const client = new PgPostgresQueryClient(pool);

  await client.query("BEGIN");
  await client.query("INSERT INTO tenants (id) VALUES ($1)", ["tenant_demo"]);
  await client.query("COMMIT");

  assert.deepEqual(pool.queries, []);
  assert.equal(pool.checkedOutClients.length, 1);
  assert.deepEqual(pool.checkedOutClients[0]?.queries, [
    { sql: "BEGIN", params: [] },
    { sql: "INSERT INTO tenants (id) VALUES ($1)", params: ["tenant_demo"] },
    { sql: "COMMIT", params: [] }
  ]);
  assert.deepEqual(pool.checkedOutClients[0]?.releases, [undefined]);
});

class FakePgPool implements PgPoolLike {
  readonly queries: Array<{ sql: string; params: readonly unknown[] }> = [];
  readonly checkedOutClients: FakePgClient[] = [];
  closed = false;

  constructor(
    private readonly rows: Array<Record<string, unknown>> | undefined = [],
    private readonly rawResult?: { rows?: Array<Record<string, unknown>>; rowCount: number | null }
  ) {}

  async query(
    sql: string,
    params: readonly unknown[] = []
  ): Promise<{ rows: Array<Record<string, unknown>>; rowCount: number | null }> {
    this.queries.push({ sql, params });
    if (this.rawResult) return this.rawResult as { rows: Array<Record<string, unknown>>; rowCount: number | null };
    const rows = this.rows ?? [];
    return { rows, rowCount: rows.length };
  }

  async connect(): Promise<FakePgClient> {
    const client = new FakePgClient();
    this.checkedOutClients.push(client);
    return client;
  }

  async end(): Promise<void> {
    this.closed = true;
  }
}

class FakePgClient {
  readonly queries: Array<{ sql: string; params: readonly unknown[] }> = [];
  readonly releases: Array<boolean | undefined> = [];

  async query(
    sql: string,
    params: readonly unknown[] = []
  ): Promise<{ rows: Array<Record<string, unknown>>; rowCount: number }> {
    this.queries.push({ sql, params });
    return { rows: [], rowCount: 0 };
  }

  release(destroy?: boolean): void {
    this.releases.push(destroy);
  }
}
