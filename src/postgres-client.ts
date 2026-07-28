import { Pool, type PoolConfig, type QueryResultRow } from "pg";
import type { PostgresQueryClient, PostgresQueryResult } from "./postgres.js";

export interface CloseablePostgresQueryClient extends PostgresQueryClient {
  end(): Promise<void>;
}

export interface PgClientLike {
  query(
    sql: string,
    params?: readonly unknown[]
  ): Promise<{ rows: QueryResultRow[]; rowCount: number | null }>;
  release(destroy?: boolean): void;
}

export interface PgPoolLike {
  query(
    sql: string,
    params?: readonly unknown[]
  ): Promise<{ rows: QueryResultRow[]; rowCount: number | null }>;
  connect(): Promise<PgClientLike>;
  end(): Promise<void>;
}

export class PgPostgresQueryClient implements CloseablePostgresQueryClient {
  private transactionClient: PgClientLike | undefined;

  constructor(private readonly pool: PgPoolLike) {}

  async query(
    sql: string,
    params: readonly unknown[] = []
  ): Promise<PostgresQueryResult> {
    const command = sql.trim().split(/\s+/)[0]?.toUpperCase();

    if (command === "BEGIN") {
      if (this.transactionClient) {
        throw new Error("PostgreSQL transaction already in progress.");
      }

      const client = await this.pool.connect();

      try {
        const result = await client.query(sql, params);
        this.transactionClient = client;
        return normalizePgQueryResult(result);
      } catch (error) {
        client.release(true);
        throw error;
      }
    }

    if (this.transactionClient) {
      const client = this.transactionClient;
      const shouldRelease = command === "COMMIT" || command === "ROLLBACK";

      try {
        const result = await client.query(sql, params);
        return normalizePgQueryResult(result);
      } catch (error) {
        if (shouldRelease) {
          client.release(true);
          this.transactionClient = undefined;
        }

        throw error;
      } finally {
        if (shouldRelease && this.transactionClient === client) {
          client.release();
          this.transactionClient = undefined;
        }
      }
    }

    const result = await this.pool.query(sql, params);
    return normalizePgQueryResult(result);
  }

  async end(): Promise<void> {
    if (this.transactionClient) {
      this.transactionClient.release(true);
      this.transactionClient = undefined;
    }

    await this.pool.end();
  }
}

function normalizePgQueryResult(result: {
  rows?: QueryResultRow[];
  rowCount: number | null;
}): PostgresQueryResult {
  const queryResult: PostgresQueryResult = {
    rows: (result.rows ?? []).map((row) => ({ ...row }))
  };

    if (result.rowCount !== null) {
      queryResult.rowCount = result.rowCount;
    }

    return queryResult;
}

export function createPgPostgresQueryClient(
  config: PoolConfig
): CloseablePostgresQueryClient {
  return new PgPostgresQueryClient(new Pool(config));
}

export function createPgPostgresQueryClientFromEnv(
  env: NodeJS.ProcessEnv = process.env
): CloseablePostgresQueryClient | undefined {
  const connectionString = env["SCHEDULEOS_POSTGRES_URL"];

  if (!connectionString) {
    return undefined;
  }

  return createPgPostgresQueryClient({ connectionString });
}
