import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";

export interface PostgresQueryResult {
  rows: Array<Record<string, unknown>>;
  rowCount?: number;
}

export interface PostgresQueryClient {
  query(sql: string, params?: readonly unknown[]): Promise<PostgresQueryResult>;
}

export interface PostgresMigration {
  version: number;
  name: string;
  sql: string;
}

export interface PostgresMigrationResult {
  appliedVersions: number[];
  skippedVersions: number[];
}

export const POSTGRES_SCHEMA_MIGRATIONS_DDL = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

const migrationFilePattern = /^(\d+)_(.+)\.sql$/;

export async function loadPostgresMigrations(
  directory = "migrations/postgres"
): Promise<PostgresMigration[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const migrations = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && migrationFilePattern.test(entry.name))
      .map(async (entry) => {
        const match = migrationFilePattern.exec(entry.name);

        if (!match?.[1] || !match[2]) {
          throw new Error(`Invalid PostgreSQL migration file name: ${entry.name}`);
        }

        return {
          version: Number.parseInt(match[1], 10),
          name: basename(match[2], ".sql"),
          sql: await readFile(join(directory, entry.name), "utf8")
        };
      })
  );

  return sortAndValidatePostgresMigrations(migrations);
}

export async function runPostgresMigrations(
  client: PostgresQueryClient,
  migrations: readonly PostgresMigration[]
): Promise<PostgresMigrationResult> {
  const orderedMigrations = sortAndValidatePostgresMigrations(migrations);

  await client.query(POSTGRES_SCHEMA_MIGRATIONS_DDL);

  const existingVersions = await readAppliedMigrationVersions(client);
  const appliedVersions: number[] = [];
  const skippedVersions: number[] = [];

  for (const migration of orderedMigrations) {
    if (existingVersions.has(migration.version)) {
      skippedVersions.push(migration.version);
      continue;
    }

    await applyPostgresMigration(client, migration);
    existingVersions.add(migration.version);
    appliedVersions.push(migration.version);
  }

  return { appliedVersions, skippedVersions };
}

function sortAndValidatePostgresMigrations(
  migrations: readonly PostgresMigration[]
): PostgresMigration[] {
  const versions = new Set<number>();

  for (const migration of migrations) {
    if (!Number.isInteger(migration.version) || migration.version < 1) {
      throw new Error(`Invalid PostgreSQL migration version: ${migration.version}`);
    }

    if (versions.has(migration.version)) {
      throw new Error(`Duplicate PostgreSQL migration version: ${migration.version}`);
    }

    versions.add(migration.version);
  }

  return [...migrations].sort((left, right) => left.version - right.version);
}

async function readAppliedMigrationVersions(
  client: PostgresQueryClient
): Promise<Set<number>> {
  const result = await client.query(
    "SELECT version FROM schema_migrations ORDER BY version"
  );

  return new Set(
    result.rows.map((row) => {
      const value = row["version"];

      if (typeof value === "number") {
        return value;
      }

      if (typeof value === "string") {
        const parsed = Number.parseInt(value, 10);

        if (Number.isInteger(parsed)) {
          return parsed;
        }
      }

      throw new Error("PostgreSQL migration table returned invalid version");
    })
  );
}

async function applyPostgresMigration(
  client: PostgresQueryClient,
  migration: PostgresMigration
): Promise<void> {
  await client.query("BEGIN");

  try {
    await client.query(migration.sql);
    await client.query(
      "INSERT INTO schema_migrations (version, name) VALUES ($1, $2)",
      [migration.version, migration.name]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}
