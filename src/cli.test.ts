import test from "node:test";
import assert from "node:assert/strict";
import { runCli, type CliIO } from "./cli.js";
import type { CloseablePostgresQueryClient } from "./postgres-client.js";
import {
  POSTGRES_SCHEMA_MIGRATIONS_DDL,
  type PostgresMigration,
  type PostgresQueryClient,
  type PostgresQueryResult
} from "./postgres.js";

const migrations: PostgresMigration[] = [
  { version: 1, name: "initial", sql: "CREATE TABLE initial_table (id TEXT)" },
  { version: 2, name: "second", sql: "CREATE TABLE second_table (id TEXT)" }
];

test("PostgreSQL migration CLI dry-runs without a database client", async () => {
  const io = createCliIO();

  const exitCode = await runCli(["postgres:migrate", "--dry-run"], io, {
    loadMigrations: async () => migrations
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(io.stderrMessages, []);
  assert.match(io.stdoutMessages.join("\n"), /PostgreSQL migration dry run/);
  assert.match(io.stdoutMessages.join("\n"), /1 initial/);
  assert.match(io.stdoutMessages.join("\n"), /2 second/);
});

test("PostgreSQL migration CLI applies migrations with injected client", async () => {
  const io = createCliIO();
  const client = new FakePostgresClient([1]);

  const exitCode = await runCli(["postgres:migrate"], io, {
    client,
    loadMigrations: async () => migrations
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(client.insertedVersions, [2]);
  assert.match(io.stdoutMessages.join("\n"), /Applied versions: 2/);
  assert.match(io.stdoutMessages.join("\n"), /Skipped versions: 1/);
});

test("PostgreSQL migration CLI returns error when applying without client", async () => {
  const io = createCliIO();

  const exitCode = await runCli(["postgres:migrate"], io, {
    loadMigrations: async () => migrations
  });

  assert.equal(exitCode, 1);
  assert.deepEqual(io.stdoutMessages, []);
  assert.match(io.stderrMessages.join("\n"), /PostgreSQL client not configured/);
});

test("PostgreSQL migration CLI applies migrations with created live client", async () => {
  const io = createCliIO();
  const client = new CloseableFakePostgresClient([1]);
  let created = false;

  const exitCode = await runCli(["postgres:migrate"], io, {
    createPostgresClient: () => {
      created = true;
      return client;
    },
    loadMigrations: async () => migrations
  });

  assert.equal(exitCode, 0);
  assert.equal(created, true);
  assert.deepEqual(client.insertedVersions, [2]);
  assert.equal(client.closed, true);
});

test("PostgreSQL migration CLI dry-run does not create live client", async () => {
  const io = createCliIO();
  let created = false;

  const exitCode = await runCli(["postgres:migrate", "--dry-run"], io, {
    createPostgresClient: () => {
      created = true;
      return new CloseableFakePostgresClient();
    },
    loadMigrations: async () => migrations
  });

  assert.equal(exitCode, 0);
  assert.equal(created, false);
});

test("PostgreSQL migration CLI supports JSON dry-run output", async () => {
  const io = createCliIO();

  const exitCode = await runCli(["postgres:migrate", "--dry-run", "--json"], io, {
    loadMigrations: async () => migrations
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(JSON.parse(io.stdoutMessages[0] ?? "{}"), {
    dryRun: true,
    migrations: [
      { version: 1, name: "initial" },
      { version: 2, name: "second" }
    ]
  });
});

test("PostgreSQL migration CLI passes custom migration directory to loader", async () => {
  const io = createCliIO();
  const requestedDirectories: Array<string | undefined> = [];

  const exitCode = await runCli(
    ["postgres:migrate", "--dry-run", "--migrations-dir", "custom/postgres"],
    io,
    {
      loadMigrations: async (directory) => {
        requestedDirectories.push(directory);
        return migrations;
      }
    }
  );

  assert.equal(exitCode, 0);
  assert.deepEqual(requestedDirectories, ["custom/postgres"]);
});

test("PostgreSQL migration CLI rejects unknown options", async () => {
  const io = createCliIO();

  const exitCode = await runCli(["postgres:migrate", "--surprise"], io);

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /Unknown postgres:migrate option/);
});

test("SQLite backup CLI wraps backup helper", async () => {
  const io = createCliIO();
  const calls: Array<{ databasePath: string; backupPath: string }> = [];

  const exitCode = await runCli(
    [
      "sqlite:backup",
      "--database",
      "data/scheduleos.db",
      "--backup",
      "backups/scheduleos.db",
      "--json"
    ],
    io,
    {
      sqliteBackup: async (databasePath, backupPath) => {
        calls.push({ databasePath, backupPath });
        return { backupPath, bytes: 42 };
      }
    }
  );

  assert.equal(exitCode, 0);
  assert.deepEqual(calls, [
    { databasePath: "data/scheduleos.db", backupPath: "backups/scheduleos.db" }
  ]);
  assert.deepEqual(JSON.parse(io.stdoutMessages[0] ?? "{}"), {
    backupPath: "backups/scheduleos.db",
    bytes: 42
  });
});

test("SQLite restore CLI refuses overwrite without exact confirmation", async () => {
 const io = createCliIO();
 let restored = false;

 const exitCode = await runCli(
 [
 "sqlite:restore",
 "--backup",
 "backups/scheduleos.db",
 "--restore",
 "restore/scheduleos.db",
 "--tenant-id",
 "tenant_demo",
 "--workspace-id",
 "workspace_demo",
 "--user-id",
 "user_jordan",
 "--overwrite"
 ],
 io,
 {
 sqliteRestore: async () => {
 restored = true;
 throw new Error("should not restore");
 }
 }
 );

 assert.equal(exitCode, 1);
 assert.equal(restored, false);
 assert.match(
 io.stderrMessages.join("\n"),
 /tenant_demo\/workspace_demo\/user_jordan\/overwrite\/restore\/scheduleos\.db/
 );
});

test("SQLite restore CLI passes smoke scope and confirmed overwrite flag", async () => {
 const io = createCliIO();
 const calls: Array<{
 backupPath: string;
 restorePath: string;
 scope: { tenantId: string; workspaceId: string; userId: string };
 overwrite?: boolean;
 }> = [];

 const exitCode = await runCli(
 [
 "sqlite:restore",
 "--backup",
 "backups/scheduleos.db",
 "--restore",
 "restore/scheduleos.db",
 "--tenant-id",
 "tenant_demo",
 "--workspace-id",
 "workspace_demo",
 "--user-id",
 "user_jordan",
 "--overwrite",
 "--confirm",
 "tenant_demo/workspace_demo/user_jordan/overwrite/restore/scheduleos.db"
 ],
 io,
 {
 sqliteRestore: async (backupPath, restorePath, scope, options) => {
 calls.push({
 backupPath,
 restorePath,
 scope,
 ...(options?.overwrite === undefined
 ? {}
 : { overwrite: options.overwrite })
 });
 return {
 restorePath,
 bytes: 42,
 appliedVersions: [1],
 smoke: { tasks: 1, workingHours: true, schedulePlans: 1 }
 };
 }
 }
 );

 assert.equal(exitCode, 0);
 assert.deepEqual(calls, [
 {
 backupPath: "backups/scheduleos.db",
 restorePath: "restore/scheduleos.db",
 scope: {
 tenantId: "tenant_demo",
 workspaceId: "workspace_demo",
 userId: "user_jordan"
 },
 overwrite: true
 }
 ]);
 assert.match(io.stdoutMessages.join("\n"), /SQLite restore validated/);
});

test("SQLite export CLI writes scoped export JSON", async () => {
  const io = createCliIO();
  const writes: Array<{ path: string; data: string }> = [];

  const exitCode = await runCli(
    [
      "sqlite:export",
      "--database",
      "data/scheduleos.db",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--output",
      "exports/workspace.json"
    ],
    io,
    {
      sqliteExport: (databasePath, actor, scope) =>
        ({
          exportedAt: "2026-07-22T00:00:00.000Z",
          scope,
          tasks: [],
          calendarEvents: [],
          schedulePlans: [],
          auditEvents: [],
          idempotencyRecords: [],
          integrationStates: [],
          databasePath,
          actor
        }) as any,
      writeFile: async (path, data) => {
        writes.push({ path, data });
      }
    }
  );

  assert.equal(exitCode, 0);
  const write = writes[0];
  if (!write) throw new Error("expected export write");
  assert.equal(write.path, "exports/workspace.json");
  assert.equal(JSON.parse(write.data).scope.tenantId, "tenant_demo");
  assert.match(io.stdoutMessages.join("\n"), /workspace export written/);
});

test("SQLite delete-workspace CLI requires exact destructive confirmation", async () => {
  const io = createCliIO();
  let deleted = false;

  const rejected = await runCli(
    [
      "sqlite:delete-workspace",
      "--database",
      "data/scheduleos.db",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--confirm",
      "tenant_demo/wrong/user_jordan"
    ],
    io,
    {
      sqliteDeleteWorkspace: () => {
        deleted = true;
        throw new Error("should not delete");
      }
    }
  );

  assert.equal(rejected, 1);
  assert.equal(deleted, false);
  assert.match(io.stderrMessages.join("\n"), /Refusing destructive delete/);

  const approvedIo = createCliIO();
  const approved = await runCli(
    [
      "sqlite:delete-workspace",
      "--database",
      "data/scheduleos.db",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--confirm",
      "tenant_demo/workspace_demo/user_jordan",
      "--json"
    ],
    approvedIo,
    {
      sqliteDeleteWorkspace: (databasePath, actor, scope) =>
        ({
          deletedAt: "2026-07-22T00:00:00.000Z",
          scope,
          databasePath,
          actor,
          deleted: {
            tasks: 1,
            calendarEvents: 0,
            workingHours: 0,
            schedulePlans: 0,
            timeBlocks: 0,
            auditEvents: 0,
            idempotencyRecords: 0,
            integrationStates: 0
          }
        }) as any
    }
  );

  assert.equal(approved, 0);
  assert.equal(JSON.parse(approvedIo.stdoutMessages[0] ?? "{}").deleted.tasks, 1);
});

test("retention policy CLI returns policy and cutoffs as JSON", async () => {
  const io = createCliIO();
  const exitCode = await runCli([
    "retention:policy",
    "--as-of",
    "2026-07-22T12:00:00.000Z",
    "--json"
  ], io);

  assert.equal(exitCode, 0);
  const output = JSON.parse(io.stdoutMessages[0] ?? "{}");
  assert.equal(output.asOf, "2026-07-22T12:00:00.000Z");
  assert.equal(
    output.policy.find((entry: { category: string }) => entry.category === "ENCRYPTED_BACKUP")
      .retentionDays,
    30
  );
  assert.equal(
    output.cutoffs.find((entry: { category: string }) => entry.category === "WORKSPACE_EXPORT")
      .deleteBefore,
    "2026-07-15T12:00:00.000Z"
  );
});

test("retention operator packet CLI emits hosted cleanup approval evidence", async () => {
  const io = createCliIO();
  const exitCode = await runCli([
    "retention:operator-packet",
    "--backend",
    "sqlite",
    "--database",
    "data/scheduleos.db",
    "--tenant-id",
    "tenant_demo",
    "--workspace-id",
    "workspace_demo",
    "--user-id",
    "user_jordan",
    "--as-of",
    "2026-07-22T12:00:00.000Z",
    "--json"
  ], io);

  assert.equal(exitCode, 0);
  const output = JSON.parse(io.stdoutMessages[0] ?? "{}");
  assert.equal(output.backend, "sqlite");
  assert.equal(output.scope.tenantId, "tenant_demo");
  assert.equal(output.requiredConfirmation, "tenant_demo/workspace_demo/user_jordan/2026-07-22T12:00:00.000Z");
  assert.equal(output.destructiveAction, "retention cleanup apply");
  assert.equal(output.secondOperatorReviewRequired, true);
  assert.equal(output.applyAllowedByPacket, false);
  assert.deepEqual(output.dryRunCommand.slice(0, 2), ["npm", "run"]);
  assert.ok(output.reviewSteps.some((step: string) => step.includes("dry-run")));
});

const baseHostedRetentionCleanupPacketArgs = [
"retention:hosted-cleanup-packet",
"--environment",
"production-us-east",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
"--window-start",
"2026-07-24T02:00:00.000Z",
"--window-end",
"2026-07-24T03:00:00.000Z",
"--dry-run-evidence",
"retention-dry-run-digest-demo",
"--backup-evidence",
"retention-backup-validation-demo",
"--approval-record",
"external-approval-record-demo",
"--legal-support-review",
"legal-support-review-demo",
"--rollback-plan",
"hosted-retention-rollback-demo",
"--second-operator",
"second-operator-retention-cleanup-demo",
"--json"
];

test("hosted retention cleanup packet CLI emits production approval evidence without apply", async () => {
 const io = createCliIO();
 const exitCode = await runCli(
 [
 ...baseHostedRetentionCleanupPacketArgs
 ],
    io
  );

  assert.equal(exitCode, 0);
  const output = JSON.parse(io.stdoutMessages[0] ?? "{}");
  assert.equal(output.operation, "hosted retention cleanup approval");
  assert.equal(output.environment, "production-us-east");
  assert.equal(output.scope.tenantId, "tenant_demo");
  assert.equal(output.asOf, "2026-07-23T12:00:00.000Z");
assert.equal(output.maintenanceWindow.start, "2026-07-24T02:00:00.000Z");
assert.equal(output.maintenanceWindow.end, "2026-07-24T03:00:00.000Z");
assert.equal(output.dryRunEvidence, "retention-dry-run-digest-demo");
assert.equal(output.backupEvidence, "retention-backup-validation-demo");
assert.equal(output.externalApprovalRecord, "external-approval-record-demo");
assert.equal(output.legalSupportReview, "legal-support-review-demo");
assert.equal(output.rollbackPlan, "hosted-retention-rollback-demo");
assert.equal(output.secondOperator, "second-operator-retention-cleanup-demo");
  assert.equal(output.applyAllowedByPacket, false);
  assert.equal(output.deleteAllowedByPacket, false);
  assert.equal(output.secondOperatorReviewRequired, true);
  assert.equal(output.backupEvidenceRequired, true);
  assert.equal(output.hostedSchedulerRequiredForProduction, true);
  assert.equal(output.approvalRecord.mustBeStoredOutsideCleanupScope, true);
  assert.ok(
output.evidenceRequired.some((item: string) =>
item.includes("retention-dry-run-digest-demo")
)
);
assert.ok(output.evidenceRequired.some((item: string) => item.includes("retention-backup-validation-demo")));
assert.ok(output.evidenceRequired.some((item: string) => item.includes("external-approval-record-demo")));
assert.ok(output.evidenceRequired.some((item: string) => item.includes("legal-support-review-demo")));
assert.ok(output.evidenceRequired.some((item: string) => item.includes("hosted-retention-rollback-demo")));
assert.ok(output.evidenceRequired.some((item: string) => item.includes("second-operator-retention-cleanup-demo")));
  assert.ok(
    output.reviewSteps.some((step: string) =>
      step.includes("legal/support")
    )
  );
});

test("hosted retention cleanup packet CLI rejects invalid maintenance windows", async () => {
const io = createCliIO();
const args = [...baseHostedRetentionCleanupPacketArgs];
args[args.indexOf("--window-start") + 1] = "2026-07-24T03:00:00.000Z";
args[args.indexOf("--window-end") + 1] = "2026-07-24T02:00:00.000Z";
const exitCode = await runCli(args, io);

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--window-end must be after/);
assert.deepEqual(io.stdoutMessages, []);
});

for (const [flag, pattern] of [
["--dry-run-evidence", /--dry-run-evidence must be non-empty/],
["--backup-evidence", /--backup-evidence must be non-empty/],
["--approval-record", /--approval-record must be non-empty/],
["--legal-support-review", /--legal-support-review must be non-empty/],
["--rollback-plan", /--rollback-plan must be non-empty/],
["--second-operator", /--second-operator must be non-empty/]
] as const) {
test(`hosted retention cleanup packet CLI rejects blank ${flag}`, async () => {
const io = createCliIO();
const args = [...baseHostedRetentionCleanupPacketArgs];
args[args.indexOf(flag) + 1] = " ";
const exitCode = await runCli(args, io);

assert.equal(exitCode, 1);
assert.match(io.stderrMessages.join("\n"), pattern);
});
}

const baseDestructiveApprovalReadinessArgs = [
  "retention:destructive-approval-readiness-packet",
  "--environment",
  "production-demo",
  "--operation",
  "hosted-retention-cleanup",
  "--tenant-id",
  "tenant_demo",
  "--workspace-id",
  "workspace_demo",
  "--user-id",
  "user_jordan",
  "--as-of",
  "2026-07-23T12:00:00.000Z",
  "--approval-policy",
  "two-operator-approval-demo",
  "--dry-run-diff",
  "retention-dry-run-diff-demo",
  "--fresh-backup",
  "fresh-backup-proof-demo",
  "--restore-smoke",
  "restore-smoke-proof-demo",
  "--exact-confirmation",
  "exact-confirmation-proof-demo",
  "--two-operator-approval",
  "two-operator-approval-proof-demo",
  "--legal-support-approval",
  "legal-support-approval-proof-demo",
  "--scope-proof",
  "tenant-workspace-user-scope-proof-demo",
  "--maintenance-window",
  "maintenance-window-proof-demo",
  "--rollback-procedure",
  "rollback-procedure-proof-demo",
  "--audit-retention",
  "audit-retention-proof-demo",
  "--hosted-scheduler-disablement",
  "hosted-scheduler-disablement-proof-demo",
  "--remote-ci",
  "remote-ci-proof-demo",
  "--json"
];

test("destructive approval readiness packet CLI emits review evidence without approval", async () => {
  const io = createCliIO();
 const exitCode = await runCli(baseDestructiveApprovalReadinessArgs, io);

  assert.equal(exitCode, 0);
  const output = JSON.parse(io.stdoutMessages[0] ?? "{}");
  assert.equal(output.operation, "destructive operation approval readiness review");
assert.equal(output.environment, "production-demo");
assert.equal(output.destructiveOperation, "hosted-retention-cleanup");
assert.equal(output.approvalPolicy, "two-operator-approval-demo");
assert.equal(output.dryRunDiff, "retention-dry-run-diff-demo");
assert.equal(output.freshBackup, "fresh-backup-proof-demo");
assert.equal(output.restoreSmoke, "restore-smoke-proof-demo");
assert.equal(output.exactConfirmation, "exact-confirmation-proof-demo");
assert.equal(output.twoOperatorApproval, "two-operator-approval-proof-demo");
assert.equal(output.legalSupportApproval, "legal-support-approval-proof-demo");
assert.equal(output.scopeProof, "tenant-workspace-user-scope-proof-demo");
assert.equal(output.maintenanceWindow, "maintenance-window-proof-demo");
assert.equal(output.rollbackProcedure, "rollback-procedure-proof-demo");
assert.equal(output.auditRetention, "audit-retention-proof-demo");
assert.equal(output.hostedSchedulerDisablement, "hosted-scheduler-disablement-proof-demo");
assert.equal(output.remoteCi, "remote-ci-proof-demo");
assert.equal(output.destructiveApprovalGranted, false);
  assert.equal(output.applyMutationAllowedByPacket, false);
  assert.equal(output.deleteMutationAllowedByPacket, false);
  assert.equal(output.requiresBackupProof, true);
  assert.equal(output.requiresSecondOperatorProof, true);
assert.equal(output.requiresLegalSupportProof, true);
assert.deepEqual(output.evidenceRequired.slice(0, 3), [
"dry-run diff proof: retention-dry-run-diff-demo",
"fresh backup proof: fresh-backup-proof-demo",
"restore smoke proof: restore-smoke-proof-demo"
]);
  assert.equal(JSON.stringify(output).includes("backup_key_demo"), false);
  assert.equal(JSON.stringify(output).includes("private_task_title_demo"), false);
});

test("destructive approval readiness packet CLI rejects blank approval policy", async () => {
 const io = createCliIO();
 const args = [...baseDestructiveApprovalReadinessArgs];
 args[args.indexOf("--approval-policy") + 1] = " ";
 const exitCode = await runCli(args, io);

 assert.equal(exitCode, 1);
 assert.match(io.stderrMessages.join("\n"), /--approval-policy must be non-empty/);
});

for (const [flag, pattern] of [
  ["--dry-run-diff", /--dry-run-diff must be non-empty/],
  ["--fresh-backup", /--fresh-backup must be non-empty/],
  ["--restore-smoke", /--restore-smoke must be non-empty/],
  ["--exact-confirmation", /--exact-confirmation must be non-empty/],
  ["--two-operator-approval", /--two-operator-approval must be non-empty/],
  ["--legal-support-approval", /--legal-support-approval must be non-empty/],
  ["--scope-proof", /--scope-proof must be non-empty/],
  ["--maintenance-window", /--maintenance-window must be non-empty/],
  ["--rollback-procedure", /--rollback-procedure must be non-empty/],
  ["--audit-retention", /--audit-retention must be non-empty/],
  ["--hosted-scheduler-disablement", /--hosted-scheduler-disablement must be non-empty/],
  ["--remote-ci", /--remote-ci must be non-empty/]
] as const) {
  test(`destructive approval readiness packet CLI rejects blank ${flag}`, async () => {
    const io = createCliIO();
    const args = [...baseDestructiveApprovalReadinessArgs];
    args[args.indexOf(flag) + 1] = " ";
    const exitCode = await runCli(args, io);

    assert.equal(exitCode, 1);
    assert.match(io.stderrMessages.join("\n"), pattern);
  });
}

const baseAuthProductionReadinessArgs = [
  "auth:production-readiness-packet",
  "--environment",
  "production-demo",
  "--backend",
  "postgres",
  "--tenant-id",
  "tenant_demo",
  "--workspace-id",
  "workspace_demo",
  "--user-id",
  "user_jordan",
  "--as-of",
  "2026-07-23T12:00:00.000Z",
  "--identity-provider",
  "local-credential-demo",
  "--session-store",
  "postgres-auth-sessions",
  "--authorization-matrix",
  "owner-admin-editor-viewer-cross-scope-demo",
  "--role-membership-proof",
  "role-membership-proof-demo",
  "--session-lifecycle",
  "session-lifecycle-demo",
  "--reset-token-lifecycle",
  "reset-token-lifecycle-demo",
  "--lockout-pruning",
  "lockout-pruning-demo",
  "--cookie-transport",
  "secure-cookie-transport-demo",
  "--startup-guard",
  "production-auth-startup-guard-demo",
  "--migration-plan",
  "postgres-auth-migration-demo",
  "--rollback-drill",
  "postgres-auth-rollback-drill-demo",
"--remote-ci",
"remote-ci-auth-demo",
"--rollback-plan",
"auth-rollback-plan-demo",
"--second-operator",
"second-operator-auth-review-demo",
"--json"
];

test("production auth readiness packet CLI emits review evidence without approval", async () => {
  const io = createCliIO();
  const exitCode = await runCli(baseAuthProductionReadinessArgs, io);

  assert.equal(exitCode, 0);
  const output = JSON.parse(io.stdoutMessages[0] ?? "{}");
  assert.equal(output.operation, "production auth readiness review");
  assert.equal(output.environment, "production-demo");
  assert.equal(output.backend, "postgres");
  assert.equal(output.identityProvider, "local-credential-demo");
  assert.equal(output.sessionStore, "postgres-auth-sessions");
  assert.equal(output.authorizationMatrix, "owner-admin-editor-viewer-cross-scope-demo");
  assert.equal(output.roleMembershipProof, "role-membership-proof-demo");
  assert.equal(output.sessionLifecycle, "session-lifecycle-demo");
  assert.equal(output.resetTokenLifecycle, "reset-token-lifecycle-demo");
  assert.equal(output.lockoutPruning, "lockout-pruning-demo");
  assert.equal(output.cookieTransport, "secure-cookie-transport-demo");
  assert.equal(output.startupGuard, "production-auth-startup-guard-demo");
  assert.equal(output.migrationPlan, "postgres-auth-migration-demo");
  assert.equal(output.rollbackDrill, "postgres-auth-rollback-drill-demo");
  assert.equal(output.remoteCi, "remote-ci-auth-demo");
  assert.equal(output.rollbackPlan, "auth-rollback-plan-demo");
  assert.equal(output.secondOperator, "second-operator-auth-review-demo");
  assert.equal(output.productionApprovalGranted, false);
  assert.equal(output.authMutationAllowedByPacket, false);
  assert.equal(output.requiresRemoteCiProof, true);
  assert.equal(output.requiresIdentityProviderProof, true);
  assert.equal(output.requiresSessionStoreProof, true);
  assert.equal(output.requiresResetTokenLifecycleProof, true);
  assert.equal(output.requiresLockoutPruningProof, true);
  assert.equal(output.scope.tenantId, "tenant_demo");
  assert.deepEqual(output.evidenceRequired.slice(0, 4), [
    "identity provider proof",
    "session store proof",
    "database migration applied evidence",
    "roles memberships repository proof"
  ]);
  assert.equal(JSON.stringify(output).includes("token_owner"), false);
  assert.equal(JSON.stringify(output).includes("password_demo"), false);
});

test("production auth readiness packet CLI rejects invalid backend", async () => {
  const io = createCliIO();
  const args = [...baseAuthProductionReadinessArgs];
  args[args.indexOf("--backend") + 1] = "memory";
  const exitCode = await runCli(args, io);

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--backend must be sqlite or postgres/);
});

test("production auth readiness packet CLI rejects invalid as-of", async () => {
  const io = createCliIO();
  const args = [...baseAuthProductionReadinessArgs];
  args[args.indexOf("--as-of") + 1] = "not-a-date";
  const exitCode = await runCli(args, io);

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--as-of must be an ISO date\/time/);
});

const authProductionBlankCases = [
  ["--identity-provider", /--identity-provider must be non-empty/],
  ["--session-store", /--session-store must be non-empty/],
  ["--authorization-matrix", /--authorization-matrix must be non-empty/],
  ["--role-membership-proof", /--role-membership-proof must be non-empty/],
  ["--session-lifecycle", /--session-lifecycle must be non-empty/],
  ["--reset-token-lifecycle", /--reset-token-lifecycle must be non-empty/],
  ["--lockout-pruning", /--lockout-pruning must be non-empty/],
  ["--cookie-transport", /--cookie-transport must be non-empty/],
  ["--startup-guard", /--startup-guard must be non-empty/],
  ["--migration-plan", /--migration-plan must be non-empty/],
  ["--rollback-drill", /--rollback-drill must be non-empty/],
  ["--remote-ci", /--remote-ci must be non-empty/],
  ["--rollback-plan", /--rollback-plan must be non-empty/],
  ["--second-operator", /--second-operator must be non-empty/]
] as const;

for (const [flag, expectedError] of authProductionBlankCases) {
  test(`production auth readiness packet CLI rejects blank ${flag}`, async () => {
    const io = createCliIO();
    const args = [...baseAuthProductionReadinessArgs];
    args[args.indexOf(flag) + 1] = "   ";
    const exitCode = await runCli(args, io);

    assert.equal(exitCode, 1);
    assert.match(io.stderrMessages.join("\n"), expectedError);
  });
}

test("authorization matrix packet CLI emits scoped production proof rows", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "auth:authorization-matrix-packet",
      "--matrix",
      "owner-admin-editor-viewer-cross-scope-demo",
      "--environment",
      "production-demo",
      "--backend",
      "postgres",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--json"
    ],
    io
  );

  assert.equal(exitCode, 0);
  const output = JSON.parse(io.stdoutMessages[0] ?? "{}");
  assert.equal(output.operation, "authorization matrix production review");
  assert.equal(output.matrix, "owner-admin-editor-viewer-cross-scope-demo");
  assert.equal(output.environment, "production-demo");
  assert.equal(output.backend, "postgres");
  assert.equal(output.productionApprovalGranted, false);
  assert.equal(output.authMutationAllowedByPacket, false);
  assert.equal(output.scope.tenantId, "tenant_demo");
  assert.equal(output.authorizationRows.length, 12);
  assert.deepEqual(
    output.authorizationRows.map((row: { scenario: string }) => row.scenario),
    [
      "owner full workspace administration",
      "admin user and membership management",
      "editor planning write access",
      "viewer read-only access",
      "viewer write denial",
      "disabled user denial",
      "inactive membership denial",
      "cross-tenant denial",
      "cross-workspace denial",
      "cross-user private calendar denial",
      "revoked session denial",
      "expired session denial"
    ]
  );
  assert.equal(
    output.authorizationRows.every(
      (row: {
        requiredEvidence: string;
        expectedDecision: string;
        evidenceReferences: string[];
      }) =>
        row.requiredEvidence.length > 0 &&
        ["ALLOW", "DENY"].includes(row.expectedDecision) &&
        row.evidenceReferences.length > 0 &&
        row.evidenceReferences.every((reference) =>
          /^src\/[a-z0-9.-]+\.test\.ts::/.test(reference)
        )
    ),
    true
  );
  const viewerWriteDenial = output.authorizationRows.find(
    (row: { scenario: string }) => row.scenario === "viewer write denial"
  );
  assert.deepEqual(viewerWriteDenial.evidenceReferences, [
    "src/api.test.ts::local API enforces static API-key read-only role"
  ]);
  const expectedEvidenceReferences = new Set([
    "src/api.test.ts::local API lets owners admins manage auth users memberships",
    "src/postgres-repositories.test.ts::PostgreSQL auth repository upserts users memberships sessions",
    "src/api.test.ts::local API retention cleanup requires owner or admin role",
    "src/server.test.ts::standalone server config supports explicit static auth role",
    "src/api.test.ts::local API enforces static API-key read-only role",
    "src/api.test.ts::local API lists reads scoped schedule plans",
    "src/api.test.ts::local API denies sessions for disabled users and inactive memberships directly",
    "src/api.test.ts::local API rejects disabled users and inactive memberships during credential login",
    "src/api.test.ts::local API logs in active users with scrypt credential hashes",
    "src/api.test.ts::local API password reset request generic expired reset tokens rejected",
    "src/repositories.test.ts::auth repository stores users memberships sessions and reset tokens with scope checks",
    "src/api.test.ts::local API enforces static API-key tenant scope configured",
    "src/postgres-repositories.test.ts::PostgreSQL auth repository rejects cross-scope access",
    "src/api.test.ts::local API prevents cross-scope schedule plan reads",
    "src/postgres-repositories.test.ts::PostgreSQL schedule plan repository rejects cross-scope get",
    "src/api.test.ts::local API prevents cross-scope calendar event reads updates deletes",
    "src/postgres-repositories.test.ts::PostgreSQL calendar event repository rejects cross-scope access",
    "src/api.test.ts::local API denies revoked and expired auth sessions directly",
    "src/api.test.ts::local API issues validates and revokes durable auth sessions",
    "src/api.test.ts::local API rotates current-user password revokes existing sessions"
  ]);
  assert.equal(
    output.authorizationRows.every((row: { evidenceReferences: string[] }) =>
      row.evidenceReferences.every((reference) =>
        expectedEvidenceReferences.has(reference)
      )
    ),
    true
  );
  assert.equal(
    output.reviewSteps.some((step: string) =>
      step.includes("Attach this packet")
    ),
    true
  );
  assert.equal(JSON.stringify(output).includes("token_owner"), false);
  assert.equal(JSON.stringify(output).includes("plaintext_password_demo"), false);
  assert.equal(JSON.stringify(output).includes("secret"), false);
});

test("authorization matrix packet CLI rejects blank matrix name", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "auth:authorization-matrix-packet",
      "--matrix",
      " ",
      "--environment",
      "production-demo",
      "--backend",
      "postgres",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--json"
    ],
    io
  );

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--matrix must be non-empty/);
});

const baseRateLimitReadinessArgs = [
  "rate-limit:production-readiness-packet",
  "--environment",
  "production-demo",
  "--tenant-id",
  "tenant_demo",
  "--workspace-id",
  "workspace_demo",
  "--user-id",
  "user_jordan",
  "--as-of",
  "2026-07-23T12:00:00.000Z",
  "--edge-layer",
  "gateway-demo",
  "--store",
  "redis-demo",
  "--provider-quota-policy",
  "provider-quota-policy-demo",
  "--trusted-proxy-proof",
  "trusted-proxy-proof-demo",
  "--hosted-alert-routing",
  "hosted-alert-routing-demo",
  "--hosted-dashboard",
  "hosted-dashboard-demo",
  "--abuse-analytics",
  "abuse-analytics-export-demo",
"--remote-ci",
"remote-ci-rate-limit-demo",
"--rollback-plan",
"rate-limit-rollback-plan-demo",
"--second-operator",
"second-operator-rate-limit-review-demo",
"--json"
];

test("production rate limit readiness packet CLI emits review evidence without enablement", async () => {
  const io = createCliIO();
  const exitCode = await runCli(baseRateLimitReadinessArgs, io);

  assert.equal(exitCode, 0);
  const output = JSON.parse(io.stdoutMessages[0] ?? "{}");
  assert.equal(output.operation, "production rate limit readiness review");
  assert.equal(output.environment, "production-demo");
  assert.equal(output.edgeLayer, "gateway-demo");
  assert.equal(output.distributedStore, "redis-demo");
  assert.equal(output.providerQuotaPolicy, "provider-quota-policy-demo");
  assert.equal(output.trustedProxyProof, "trusted-proxy-proof-demo");
  assert.equal(output.hostedAlertRouting, "hosted-alert-routing-demo");
  assert.equal(output.hostedDashboard, "hosted-dashboard-demo");
  assert.equal(output.abuseAnalytics, "abuse-analytics-export-demo");
  assert.equal(output.remoteCi, "remote-ci-rate-limit-demo");
  assert.equal(output.rollbackPlan, "rate-limit-rollback-plan-demo");
  assert.equal(output.secondOperator, "second-operator-rate-limit-review-demo");
  assert.equal(output.productionEnablementGranted, false);
  assert.equal(output.rateLimitMutationAllowedByPacket, false);
  assert.equal(output.requiresHostedAlertRoutingProof, true);
  assert.equal(output.requiresAbuseAnalyticsProof, true);
  assert.equal(output.requiresProviderQuotaProof, true);
  assert.equal(output.requiresSecondOperatorReview, true);
  assert.equal(output.scope.tenantId, "tenant_demo");
  assert.deepEqual(output.evidenceRequired.slice(0, 4), [
    "edge or gateway rate-limit policy proof",
    "distributed throttle store proof",
    "provider quota policy proof",
    "trusted proxy deployment proof"
  ]);
  assert.equal(JSON.stringify(output).includes("token_owner"), false);
});

test("production rate limit readiness packet CLI rejects invalid as-of", async () => {
  const io = createCliIO();
  const args = [...baseRateLimitReadinessArgs];
  args[args.indexOf("--as-of") + 1] = "not-a-date";
  const exitCode = await runCli(args, io);

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--as-of must be an ISO date\/time/);
});

test("production rate limit readiness packet CLI rejects blank edge layer", async () => {
  const io = createCliIO();
  const args = [...baseRateLimitReadinessArgs];
  args[args.indexOf("--edge-layer") + 1] = "   ";
  const exitCode = await runCli(args, io);

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--edge-layer must be non-empty/);
});

test("production rate limit readiness packet CLI rejects blank distributed store", async () => {
  const io = createCliIO();
  const args = [...baseRateLimitReadinessArgs];
  args[args.indexOf("--store") + 1] = "   ";
  const exitCode = await runCli(args, io);

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--store must be non-empty/);
});

test("production rate limit readiness packet CLI rejects blank provider quota policy", async () => {
  const io = createCliIO();
  const args = [...baseRateLimitReadinessArgs];
  args[args.indexOf("--provider-quota-policy") + 1] = "   ";
  const exitCode = await runCli(args, io);

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--provider-quota-policy must be non-empty/);
});

test("production rate limit readiness packet CLI rejects blank trusted proxy proof", async () => {
  const io = createCliIO();
  const args = [...baseRateLimitReadinessArgs];
  args[args.indexOf("--trusted-proxy-proof") + 1] = "   ";
  const exitCode = await runCli(args, io);

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--trusted-proxy-proof must be non-empty/);
});

test("production rate limit readiness packet CLI rejects blank hosted alert routing", async () => {
  const io = createCliIO();
  const args = [...baseRateLimitReadinessArgs];
  args[args.indexOf("--hosted-alert-routing") + 1] = "   ";
  const exitCode = await runCli(args, io);

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--hosted-alert-routing must be non-empty/);
});

test("production rate limit readiness packet CLI rejects blank hosted dashboard", async () => {
  const io = createCliIO();
  const args = [...baseRateLimitReadinessArgs];
  args[args.indexOf("--hosted-dashboard") + 1] = "   ";
  const exitCode = await runCli(args, io);

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--hosted-dashboard must be non-empty/);
});

test("production rate limit readiness packet CLI rejects blank abuse analytics", async () => {
  const io = createCliIO();
  const args = [...baseRateLimitReadinessArgs];
  args[args.indexOf("--abuse-analytics") + 1] = "   ";
  const exitCode = await runCli(args, io);

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--abuse-analytics must be non-empty/);
});

test("production rate limit readiness packet CLI rejects blank remote CI", async () => {
  const io = createCliIO();
  const args = [...baseRateLimitReadinessArgs];
  args[args.indexOf("--remote-ci") + 1] = "   ";
  const exitCode = await runCli(args, io);

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--remote-ci must be non-empty/);
});

test("production rate limit readiness packet CLI rejects blank rollback plan", async () => {
  const io = createCliIO();
  const args = [...baseRateLimitReadinessArgs];
  args[args.indexOf("--rollback-plan") + 1] = "   ";
  const exitCode = await runCli(args, io);

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--rollback-plan must be non-empty/);
});

test("production rate limit readiness packet CLI rejects blank second operator", async () => {
  const io = createCliIO();
  const args = [...baseRateLimitReadinessArgs];
  args[args.indexOf("--second-operator") + 1] = " ";
  const exitCode = await runCli(args, io);

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--second-operator must be non-empty/);
});

test("provider lifecycle readiness packet CLI emits review evidence without enforcement", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "providers:lifecycle-readiness-packet",
      "--environment",
      "production-demo",
      "--provider",
      "google-calendar-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--managed-secret-custody",
      "managed-secret-custody-demo",
      "--rotation-drill",
      "provider-rotation-drill-demo",
      "--revocation-drill",
      "provider-revocation-drill-demo",
      "--write-back-safety",
      "write-back-preview-conflict-demo",
      "--hosted-alert-routing",
      "provider-hosted-alert-routing-demo",
      "--provider-runbook",
      "google-calendar-runbook-demo",
      "--remote-ci",
"remote-ci-provider-lifecycle-demo",
"--rollback-plan",
"provider-lifecycle-rollback-plan-demo",
"--second-operator",
"second-operator-provider-lifecycle-review-demo",
"--json"
    ],
    io
  );

  assert.equal(exitCode, 0);
  const output = JSON.parse(io.stdoutMessages[0] ?? "{}");
  assert.equal(output.operation, "provider lifecycle readiness review");
  assert.equal(output.environment, "production-demo");
  assert.equal(output.provider, "google-calendar-demo");
  assert.equal(output.managedSecretCustody, "managed-secret-custody-demo");
  assert.equal(output.rotationDrill, "provider-rotation-drill-demo");
  assert.equal(output.revocationDrill, "provider-revocation-drill-demo");
  assert.equal(output.writeBackSafety, "write-back-preview-conflict-demo");
  assert.equal(output.hostedAlertRouting, "provider-hosted-alert-routing-demo");
  assert.equal(output.providerRunbook, "google-calendar-runbook-demo");
  assert.equal(output.remoteCi, "remote-ci-provider-lifecycle-demo");
  assert.equal(output.rollbackPlan, "provider-lifecycle-rollback-plan-demo");
  assert.equal(output.secondOperator, "second-operator-provider-lifecycle-review-demo");
  assert.equal(output.productionEnforcementGranted, false);
  assert.equal(output.providerMutationAllowedByPacket, false);
  assert.equal(output.requiresHostedOperatorAlertProof, true);
  assert.equal(output.requiresRotationRevocationDrillProof, true);
  assert.equal(output.requiresProviderSpecificRunbookProof, true);
  assert.equal(output.requiresWriteBackSafetyProof, true);
  assert.deepEqual(output.requiredProviderRunbookSections, [
    "provider setup",
    "permissions and scopes",
    "managed-secret custody",
    "rotation drill",
    "emergency revocation drill",
    "write-back safety",
    "sync checkpoint recovery",
    "hosted operator alerts",
    "incident response",
    "rollback",
    "privacy minimization",
    "support escalation",
    "sanitized evidence examples"
  ]);
  assert.equal(output.scope.workspaceId, "workspace_demo");
  assert.deepEqual(output.evidenceRequired.slice(0, 3), [
    "provider adapter contract proof",
    "credential custody and managed-secret proof",
    "rotation drill proof"
  ]);
  assert.ok(output.evidenceRequired.includes("remote CI proof: remote-ci-provider-lifecycle-demo"));
  assert.ok(output.evidenceRequired.includes("operator rollback plan: provider-lifecycle-rollback-plan-demo"));
  assert.ok(
    output.evidenceRequired.includes(
      "second-operator provider lifecycle review: second-operator-provider-lifecycle-review-demo"
    )
  );
  assert.equal(
    output.reviewSteps.some((step: string) => step.includes("managed-secret-custody-demo")),
    true
  );
  assert.equal(
    output.reviewSteps.some((step: string) => step.includes("provider-rotation-drill-demo")),
    true
  );
  assert.equal(
    output.reviewSteps.some((step: string) => step.includes("provider-revocation-drill-demo")),
    true
  );
  assert.equal(
    output.reviewSteps.some((step: string) => step.includes("write-back-preview-conflict-demo")),
    true
  );
  assert.equal(
    output.reviewSteps.some((step: string) => step.includes("provider-hosted-alert-routing-demo")),
    true
  );
  assert.equal(
    output.reviewSteps.some((step: string) => step.includes("google-calendar-runbook-demo")),
    true
  );
  assert.equal(
    output.reviewSteps.some((step: string) =>
      step.includes("verify every required runbook section")
    ),
    true
  );
  assert.equal(JSON.stringify(output).includes("oauth_token_demo"), false);
  assert.equal(JSON.stringify(output).includes("webhook_secret_demo"), false);
});

test("provider lifecycle readiness packet CLI rejects blank managed secret custody", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "providers:lifecycle-readiness-packet",
      "--environment",
      "production-demo",
      "--provider",
      "google-calendar-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--managed-secret-custody",
      " ",
      "--rotation-drill",
      "provider-rotation-drill-demo",
      "--revocation-drill",
      "provider-revocation-drill-demo",
      "--write-back-safety",
      "write-back-preview-conflict-demo",
      "--hosted-alert-routing",
      "provider-hosted-alert-routing-demo",
      "--provider-runbook",
      "google-calendar-runbook-demo",
      "--remote-ci",
"remote-ci-provider-lifecycle-demo",
"--rollback-plan",
"provider-lifecycle-rollback-plan-demo",
"--second-operator",
"second-operator-provider-lifecycle-review-demo",
"--json"
    ],
    io
  );

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--managed-secret-custody must be non-empty/);
});

test("provider lifecycle readiness packet CLI rejects blank rotation drill", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "providers:lifecycle-readiness-packet",
      "--environment",
      "production-demo",
      "--provider",
      "google-calendar-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--managed-secret-custody",
      "managed-secret-custody-demo",
      "--rotation-drill",
      " ",
      "--revocation-drill",
      "provider-revocation-drill-demo",
      "--write-back-safety",
      "write-back-preview-conflict-demo",
      "--hosted-alert-routing",
      "provider-hosted-alert-routing-demo",
      "--provider-runbook",
      "google-calendar-runbook-demo",
      "--remote-ci",
"remote-ci-provider-lifecycle-demo",
"--rollback-plan",
"provider-lifecycle-rollback-plan-demo",
"--second-operator",
"second-operator-provider-lifecycle-review-demo",
"--json"
    ],
    io
  );

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--rotation-drill must be non-empty/);
});

test("provider lifecycle readiness packet CLI rejects blank revocation drill", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "providers:lifecycle-readiness-packet",
      "--environment",
      "production-demo",
      "--provider",
      "google-calendar-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--managed-secret-custody",
      "managed-secret-custody-demo",
      "--rotation-drill",
      "provider-rotation-drill-demo",
      "--revocation-drill",
      " ",
      "--write-back-safety",
      "write-back-preview-conflict-demo",
      "--hosted-alert-routing",
      "provider-hosted-alert-routing-demo",
      "--provider-runbook",
      "google-calendar-runbook-demo",
      "--remote-ci",
"remote-ci-provider-lifecycle-demo",
"--rollback-plan",
"provider-lifecycle-rollback-plan-demo",
"--second-operator",
"second-operator-provider-lifecycle-review-demo",
"--json"
    ],
    io
  );

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--revocation-drill must be non-empty/);
});

test("provider lifecycle readiness packet CLI rejects blank write-back safety", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "providers:lifecycle-readiness-packet",
      "--environment",
      "production-demo",
      "--provider",
      "google-calendar-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--managed-secret-custody",
      "managed-secret-custody-demo",
      "--rotation-drill",
      "provider-rotation-drill-demo",
      "--revocation-drill",
      "provider-revocation-drill-demo",
      "--write-back-safety",
      " ",
      "--hosted-alert-routing",
      "provider-hosted-alert-routing-demo",
      "--provider-runbook",
      "google-calendar-runbook-demo",
      "--remote-ci",
"remote-ci-provider-lifecycle-demo",
"--rollback-plan",
"provider-lifecycle-rollback-plan-demo",
"--second-operator",
"second-operator-provider-lifecycle-review-demo",
"--json"
    ],
    io
  );

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--write-back-safety must be non-empty/);
});

test("provider lifecycle readiness packet CLI rejects blank hosted alert routing", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "providers:lifecycle-readiness-packet",
      "--environment",
      "production-demo",
      "--provider",
      "google-calendar-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--managed-secret-custody",
      "managed-secret-custody-demo",
      "--rotation-drill",
      "provider-rotation-drill-demo",
      "--revocation-drill",
      "provider-revocation-drill-demo",
      "--write-back-safety",
      "write-back-preview-conflict-demo",
      "--hosted-alert-routing",
      " ",
      "--provider-runbook",
      "google-calendar-runbook-demo",
      "--remote-ci",
"remote-ci-provider-lifecycle-demo",
"--rollback-plan",
"provider-lifecycle-rollback-plan-demo",
"--second-operator",
"second-operator-provider-lifecycle-review-demo",
"--json"
    ],
    io
  );

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--hosted-alert-routing must be non-empty/);
});

test("provider lifecycle readiness packet CLI rejects blank provider runbook", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "providers:lifecycle-readiness-packet",
      "--environment",
      "production-demo",
      "--provider",
      "google-calendar-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--managed-secret-custody",
      "managed-secret-custody-demo",
      "--rotation-drill",
      "provider-rotation-drill-demo",
      "--revocation-drill",
      "provider-revocation-drill-demo",
      "--write-back-safety",
      "write-back-preview-conflict-demo",
      "--hosted-alert-routing",
      "provider-hosted-alert-routing-demo",
      "--provider-runbook",
      " ",
      "--remote-ci",
"remote-ci-provider-lifecycle-demo",
"--rollback-plan",
"provider-lifecycle-rollback-plan-demo",
"--second-operator",
"second-operator-provider-lifecycle-review-demo",
"--json"
    ],
    io
  );

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--provider-runbook must be non-empty/);
});

const baseProviderLifecycleRemoteProofArgs = [
  "providers:lifecycle-readiness-packet",
  "--environment",
  "production-demo",
  "--provider",
  "google-calendar-demo",
  "--tenant-id",
  "tenant_demo",
  "--workspace-id",
  "workspace_demo",
  "--user-id",
  "user_jordan",
  "--as-of",
  "2026-07-23T12:00:00.000Z",
  "--managed-secret-custody",
  "managed-secret-custody-demo",
  "--rotation-drill",
  "provider-rotation-drill-demo",
  "--revocation-drill",
  "provider-revocation-drill-demo",
  "--write-back-safety",
  "write-back-preview-conflict-demo",
  "--hosted-alert-routing",
  "provider-hosted-alert-routing-demo",
  "--provider-runbook",
  "google-calendar-runbook-demo",
  "--remote-ci",
  "remote-ci-provider-lifecycle-demo",
"--rollback-plan",
"provider-lifecycle-rollback-plan-demo",
"--second-operator",
"second-operator-provider-lifecycle-review-demo",
"--json"
];

for (const [flag, pattern] of [
  ["--remote-ci", /--remote-ci must be non-empty/],
 ["--rollback-plan", /--rollback-plan must be non-empty/],
 ["--second-operator", /--second-operator must be non-empty/]
] as const) {
  test(`provider lifecycle readiness packet CLI rejects blank ${flag}`, async () => {
    const io = createCliIO();
    const args = [...baseProviderLifecycleRemoteProofArgs];
    args[args.indexOf(flag) + 1] = " ";
    const exitCode = await runCli(args, io);

    assert.equal(exitCode, 1);
    assert.match(io.stderrMessages.join("\n"), pattern);
  });
}

test("calendar UI production readiness packet CLI emits review evidence without approval", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "calendar-ui:production-readiness-packet",
      "--environment",
      "production-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--browser-matrix",
      "chrome-firefox-safari-demo",
      "--conflict-workflow",
      "calendar-conflict-workflow-demo",
      "--write-back-acknowledgement",
      "write-back-acknowledgement-demo",
      "--accessibility-audit",
      "keyboard-screenreader-audit-demo",
      "--responsive-polish",
      "responsive-polish-screenshots-demo",
      "--visual-regression",
      "visual-regression-baseline-demo",
      "--product-owner-approval",
      "product-owner-approval-demo",
      "--remote-ci",
"remote-ci-calendar-ui-demo",
"--rollback-plan",
"calendar-ui-rollback-plan-demo",
"--second-operator",
"second-operator-calendar-ui-review-demo",
"--json"
    ],
    io
  );

  assert.equal(exitCode, 0);
  const output = JSON.parse(io.stdoutMessages[0] ?? "{}");
  assert.equal(output.operation, "calendar UI production readiness review");
  assert.equal(output.environment, "production-demo");
  assert.equal(output.browserMatrix, "chrome-firefox-safari-demo");
  assert.equal(output.conflictWorkflow, "calendar-conflict-workflow-demo");
  assert.equal(output.writeBackAcknowledgement, "write-back-acknowledgement-demo");
  assert.equal(output.accessibilityAudit, "keyboard-screenreader-audit-demo");
  assert.equal(output.responsivePolish, "responsive-polish-screenshots-demo");
  assert.equal(output.visualRegression, "visual-regression-baseline-demo");
  assert.equal(output.productOwnerApproval, "product-owner-approval-demo");
assert.equal(output.remoteCi, "remote-ci-calendar-ui-demo");
assert.equal(output.rollbackPlan, "calendar-ui-rollback-plan-demo");
assert.equal(output.secondOperator, "second-operator-calendar-ui-review-demo");
  assert.equal(output.productionApprovalGranted, false);
  assert.equal(output.uiMutationAllowedByPacket, false);
  assert.equal(output.requiresAccessibilityPassProof, true);
  assert.equal(output.requiresProductOwnerApprovalProof, true);
  assert.equal(output.requiresResponsivePolishProof, true);
assert.equal(output.requiresInteractiveConflictWorkflowProof, true);
assert.equal(output.requiresRemoteCiProof, true);
assert.equal(output.requiresSecondOperatorProof, true);
  assert.equal(output.scope.workspaceId, "workspace_demo");
  assert.deepEqual(output.evidenceRequired.slice(0, 3), [
    "desktop browser matrix proof: chrome-firefox-safari-demo",
    "mobile responsive proof: responsive-polish-screenshots-demo",
    "interactive conflict-preview workflow proof: calendar-conflict-workflow-demo"
  ]);
assert.ok(output.evidenceRequired.includes("remote CI proof: remote-ci-calendar-ui-demo"));
assert.ok(output.evidenceRequired.includes("operator rollback plan: calendar-ui-rollback-plan-demo"));
assert.ok(output.evidenceRequired.includes("second-operator review proof: second-operator-calendar-ui-review-demo"));
  for (const label of [
    "chrome-firefox-safari-demo",
    "calendar-conflict-workflow-demo",
    "write-back-acknowledgement-demo",
    "keyboard-screenreader-audit-demo",
    "responsive-polish-screenshots-demo",
    "visual-regression-baseline-demo",
    "product-owner-approval-demo",
    "remote-ci-calendar-ui-demo",
"calendar-ui-rollback-plan-demo",
"second-operator-calendar-ui-review-demo"
  ]) {
    assert.equal(
      output.reviewSteps.some((step: string) => step.includes(label)),
      true
    );
  }
  assert.equal(JSON.stringify(output).includes("calendar_token_demo"), false);
  assert.equal(JSON.stringify(output).includes("private_event_title_demo"), false);
});

test("calendar UI production readiness packet CLI rejects blank browser matrix", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "calendar-ui:production-readiness-packet",
      "--environment",
      "production-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--browser-matrix",
      " ",
      "--conflict-workflow",
      "calendar-conflict-workflow-demo",
      "--write-back-acknowledgement",
      "write-back-acknowledgement-demo",
      "--accessibility-audit",
      "keyboard-screenreader-audit-demo",
      "--responsive-polish",
      "responsive-polish-screenshots-demo",
      "--visual-regression",
      "visual-regression-baseline-demo",
      "--product-owner-approval",
      "product-owner-approval-demo",
      "--remote-ci",
"remote-ci-calendar-ui-demo",
"--rollback-plan",
"calendar-ui-rollback-plan-demo",
"--second-operator",
"second-operator-calendar-ui-review-demo",
"--json"
    ],
    io
  );

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--browser-matrix must be non-empty/);
});

test("calendar UI production readiness packet CLI rejects blank conflict workflow", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "calendar-ui:production-readiness-packet",
      "--environment",
      "production-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--browser-matrix",
      "chrome-firefox-safari-demo",
      "--conflict-workflow",
      " ",
      "--write-back-acknowledgement",
      "write-back-acknowledgement-demo",
      "--accessibility-audit",
      "keyboard-screenreader-audit-demo",
      "--responsive-polish",
      "responsive-polish-screenshots-demo",
      "--visual-regression",
      "visual-regression-baseline-demo",
      "--product-owner-approval",
      "product-owner-approval-demo",
      "--remote-ci",
"remote-ci-calendar-ui-demo",
"--rollback-plan",
"calendar-ui-rollback-plan-demo",
"--second-operator",
"second-operator-calendar-ui-review-demo",
"--json"
    ],
    io
  );

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--conflict-workflow must be non-empty/);
});

test("calendar UI production readiness packet CLI rejects blank write-back acknowledgement", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "calendar-ui:production-readiness-packet",
      "--environment",
      "production-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--browser-matrix",
      "chrome-firefox-safari-demo",
      "--conflict-workflow",
      "calendar-conflict-workflow-demo",
      "--write-back-acknowledgement",
      " ",
      "--accessibility-audit",
      "keyboard-screenreader-audit-demo",
      "--responsive-polish",
      "responsive-polish-screenshots-demo",
      "--visual-regression",
      "visual-regression-baseline-demo",
      "--product-owner-approval",
      "product-owner-approval-demo",
      "--remote-ci",
"remote-ci-calendar-ui-demo",
"--rollback-plan",
"calendar-ui-rollback-plan-demo",
"--second-operator",
"second-operator-calendar-ui-review-demo",
"--json"
    ],
    io
  );

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--write-back-acknowledgement must be non-empty/);
});

test("calendar UI production readiness packet CLI rejects blank accessibility audit", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "calendar-ui:production-readiness-packet",
      "--environment",
      "production-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--browser-matrix",
      "chrome-firefox-safari-demo",
      "--conflict-workflow",
      "calendar-conflict-workflow-demo",
      "--write-back-acknowledgement",
      "write-back-acknowledgement-demo",
      "--accessibility-audit",
      " ",
      "--responsive-polish",
      "responsive-polish-screenshots-demo",
      "--visual-regression",
      "visual-regression-baseline-demo",
      "--product-owner-approval",
      "product-owner-approval-demo",
      "--remote-ci",
"remote-ci-calendar-ui-demo",
"--rollback-plan",
"calendar-ui-rollback-plan-demo",
"--second-operator",
"second-operator-calendar-ui-review-demo",
"--json"
    ],
    io
  );

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--accessibility-audit must be non-empty/);
});

test("calendar UI production readiness packet CLI rejects blank responsive polish", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "calendar-ui:production-readiness-packet",
      "--environment",
      "production-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--browser-matrix",
      "chrome-firefox-safari-demo",
      "--conflict-workflow",
      "calendar-conflict-workflow-demo",
      "--write-back-acknowledgement",
      "write-back-acknowledgement-demo",
      "--accessibility-audit",
      "keyboard-screenreader-audit-demo",
      "--responsive-polish",
      " ",
      "--visual-regression",
      "visual-regression-baseline-demo",
      "--product-owner-approval",
      "product-owner-approval-demo",
      "--remote-ci",
"remote-ci-calendar-ui-demo",
"--rollback-plan",
"calendar-ui-rollback-plan-demo",
"--second-operator",
"second-operator-calendar-ui-review-demo",
"--json"
    ],
    io
  );

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--responsive-polish must be non-empty/);
});

test("calendar UI production readiness packet CLI rejects blank visual regression", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "calendar-ui:production-readiness-packet",
      "--environment",
      "production-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--browser-matrix",
      "chrome-firefox-safari-demo",
      "--conflict-workflow",
      "calendar-conflict-workflow-demo",
      "--write-back-acknowledgement",
      "write-back-acknowledgement-demo",
      "--accessibility-audit",
      "keyboard-screenreader-audit-demo",
      "--responsive-polish",
      "responsive-polish-screenshots-demo",
      "--visual-regression",
      " ",
      "--product-owner-approval",
      "product-owner-approval-demo",
      "--remote-ci",
"remote-ci-calendar-ui-demo",
"--rollback-plan",
"calendar-ui-rollback-plan-demo",
"--second-operator",
"second-operator-calendar-ui-review-demo",
"--json"
    ],
    io
  );

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--visual-regression must be non-empty/);
});

test("calendar UI production readiness packet CLI rejects blank product-owner approval", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "calendar-ui:production-readiness-packet",
      "--environment",
      "production-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--browser-matrix",
      "chrome-firefox-safari-demo",
      "--conflict-workflow",
      "calendar-conflict-workflow-demo",
      "--write-back-acknowledgement",
      "write-back-acknowledgement-demo",
      "--accessibility-audit",
      "keyboard-screenreader-audit-demo",
      "--responsive-polish",
      "responsive-polish-screenshots-demo",
      "--visual-regression",
      "visual-regression-baseline-demo",
      "--product-owner-approval",
      " ",
      "--remote-ci",
"remote-ci-calendar-ui-demo",
"--rollback-plan",
"calendar-ui-rollback-plan-demo",
"--second-operator",
"second-operator-calendar-ui-review-demo",
"--json"
    ],
    io
  );

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--product-owner-approval must be non-empty/);
});

const baseCalendarUiRemoteProofArgs = [
  "calendar-ui:production-readiness-packet",
  "--environment",
  "production-demo",
  "--tenant-id",
  "tenant_demo",
  "--workspace-id",
  "workspace_demo",
  "--user-id",
  "user_jordan",
  "--as-of",
  "2026-07-23T12:00:00.000Z",
  "--browser-matrix",
  "chrome-firefox-safari-demo",
  "--conflict-workflow",
  "calendar-conflict-workflow-demo",
  "--write-back-acknowledgement",
  "write-back-acknowledgement-demo",
  "--accessibility-audit",
  "keyboard-screenreader-audit-demo",
  "--responsive-polish",
  "responsive-polish-screenshots-demo",
  "--visual-regression",
  "visual-regression-baseline-demo",
  "--product-owner-approval",
  "product-owner-approval-demo",
  "--remote-ci",
  "remote-ci-calendar-ui-demo",
  "--rollback-plan",
  "calendar-ui-rollback-plan-demo",
  "--second-operator",
  "second-operator-calendar-ui-review-demo",
  "--json"
];

for (const [flag, pattern] of [
  ["--remote-ci", /--remote-ci must be non-empty/],
["--rollback-plan", /--rollback-plan must be non-empty/],
["--second-operator", /--second-operator must be non-empty/]
] as const) {
  test(`calendar UI production readiness packet CLI rejects blank ${flag}`, async () => {
    const io = createCliIO();
    const args = [...baseCalendarUiRemoteProofArgs];
    args[args.indexOf(flag) + 1] = " ";
    const exitCode = await runCli(args, io);

    assert.equal(exitCode, 1);
    assert.match(io.stderrMessages.join("\n"), pattern);
  });
}

test("web app production readiness packet CLI emits review evidence without approval", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "web-app:production-readiness-packet",
      "--environment",
      "production-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--deployment-target",
      "self-host-container-demo",
      "--production-build",
      "production-build-artifact-demo",
      "--authenticated-write-flow",
      "authenticated-write-flow-demo",
      "--security-headers",
      "security-header-deployment-demo",
      "--csrf-cookie-transport",
      "csrf-cookie-transport-demo",
      "--throttle-policy",
      "request-import-throttle-demo",
      "--durable-storage",
      "durable-storage-demo",
      "--cache-policy",
      "static-cache-policy-demo",
      "--health-startup-guard",
      "health-startup-guard-demo",
      "--browser-matrix",
      "desktop-mobile-browser-demo",
      "--accessibility-audit",
      "axe-keyboard-screenreader-demo",
      "--responsive-polish",
"responsive-polish-demo",
"--visual-regression",
"visual-regression-demo",
"--operator-review",
"operator-review-demo",
"--remote-ci",
      "remote-ci-webapp-demo",
      "--rollback-plan",
      "webapp-rollback-plan-demo",
"--second-operator",
"second-operator-webapp-review-demo",
      "--json"
    ],
    io
  );

  assert.equal(exitCode, 0);
  const output = JSON.parse(io.stdoutMessages[0] ?? "{}");
  assert.equal(output.operation, "web app production readiness review");
  assert.equal(output.environment, "production-demo");
  assert.equal(output.deploymentTarget, "self-host-container-demo");
  assert.equal(output.productionBuild, "production-build-artifact-demo");
  assert.equal(output.authenticatedWriteFlow, "authenticated-write-flow-demo");
  assert.equal(output.securityHeaders, "security-header-deployment-demo");
  assert.equal(output.csrfCookieTransport, "csrf-cookie-transport-demo");
  assert.equal(output.throttlePolicy, "request-import-throttle-demo");
  assert.equal(output.durableStorage, "durable-storage-demo");
  assert.equal(output.cachePolicy, "static-cache-policy-demo");
assert.equal(output.healthStartupGuard, "health-startup-guard-demo");
assert.equal(output.browserMatrix, "desktop-mobile-browser-demo");
assert.equal(output.accessibilityAudit, "axe-keyboard-screenreader-demo");
assert.equal(output.responsivePolish, "responsive-polish-demo");
assert.equal(output.visualRegression, "visual-regression-demo");
assert.equal(output.operatorReview, "operator-review-demo");
assert.equal(output.remoteCi, "remote-ci-webapp-demo");
assert.equal(output.rollbackPlan, "webapp-rollback-plan-demo");
assert.equal(output.secondOperator, "second-operator-webapp-review-demo");
  assert.equal(output.productionApprovalGranted, false);
  assert.equal(output.deploymentMutationAllowedByPacket, false);
  assert.equal(output.requiresSecurityHeaderProof, true);
  assert.equal(output.requiresAuthenticatedWriteProof, true);
  assert.equal(output.requiresRollbackProof, true);
  assert.equal(output.requiresRemoteCiProof, true);
  assert.equal(output.scope.workspaceId, "workspace_demo");
  assert.deepEqual(output.evidenceRequired.slice(0, 3), [
    "production build artifact proof",
    "authenticated write-flow proof",
    "security header deployment proof"
  ]);
  for (const label of [
    "production-build-artifact-demo",
    "authenticated-write-flow-demo",
    "security-header-deployment-demo",
    "csrf-cookie-transport-demo",
    "request-import-throttle-demo",
    "durable-storage-demo",
    "static-cache-policy-demo",
    "health-startup-guard-demo",
    "desktop-mobile-browser-demo",
    "axe-keyboard-screenreader-demo",
    "remote-ci-webapp-demo",
    "webapp-rollback-plan-demo"
  ]) {
    assert.equal(
      output.reviewSteps.some((step: string) => step.includes(label)),
      true
    );
  }
  assert.equal(JSON.stringify(output).includes("session_cookie_demo"), false);
  assert.equal(JSON.stringify(output).includes("api_key_demo"), false);
});

test("web app production readiness packet CLI rejects blank deployment target", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "web-app:production-readiness-packet",
      "--environment",
      "production-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--deployment-target",
      " ",
      "--production-build",
      "production-build-artifact-demo",
      "--authenticated-write-flow",
      "authenticated-write-flow-demo",
      "--security-headers",
      "security-header-deployment-demo",
      "--csrf-cookie-transport",
      "csrf-cookie-transport-demo",
      "--throttle-policy",
      "request-import-throttle-demo",
      "--durable-storage",
      "durable-storage-demo",
      "--cache-policy",
      "static-cache-policy-demo",
      "--health-startup-guard",
      "health-startup-guard-demo",
      "--browser-matrix",
      "desktop-mobile-browser-demo",
      "--accessibility-audit",
      "axe-keyboard-screenreader-demo",
      "--responsive-polish",
"responsive-polish-demo",
"--visual-regression",
"visual-regression-demo",
"--operator-review",
"operator-review-demo",
"--remote-ci",
      "remote-ci-webapp-demo",
      "--rollback-plan",
      "webapp-rollback-plan-demo",
"--second-operator",
"second-operator-webapp-review-demo",
      "--json"
    ],
    io
  );

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--deployment-target must be non-empty/);
});

test("web app production readiness packet CLI rejects blank production build", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "web-app:production-readiness-packet",
      "--environment",
      "production-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--deployment-target",
      "self-host-container-demo",
      "--production-build",
      " ",
      "--authenticated-write-flow",
      "authenticated-write-flow-demo",
      "--security-headers",
      "security-header-deployment-demo",
      "--csrf-cookie-transport",
      "csrf-cookie-transport-demo",
      "--throttle-policy",
      "request-import-throttle-demo",
      "--durable-storage",
      "durable-storage-demo",
      "--cache-policy",
      "static-cache-policy-demo",
      "--health-startup-guard",
      "health-startup-guard-demo",
      "--browser-matrix",
      "desktop-mobile-browser-demo",
      "--accessibility-audit",
      "axe-keyboard-screenreader-demo",
      "--responsive-polish",
"responsive-polish-demo",
"--visual-regression",
"visual-regression-demo",
"--operator-review",
"operator-review-demo",
"--remote-ci",
      "remote-ci-webapp-demo",
      "--rollback-plan",
      "webapp-rollback-plan-demo",
"--second-operator",
"second-operator-webapp-review-demo",
      "--json"
    ],
    io
  );

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--production-build must be non-empty/);
});

test("web app production readiness packet CLI rejects blank authenticated write flow", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "web-app:production-readiness-packet",
      "--environment",
      "production-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--deployment-target",
      "self-host-container-demo",
      "--production-build",
      "production-build-artifact-demo",
      "--authenticated-write-flow",
      " ",
      "--security-headers",
      "security-header-deployment-demo",
      "--csrf-cookie-transport",
      "csrf-cookie-transport-demo",
      "--throttle-policy",
      "request-import-throttle-demo",
      "--durable-storage",
      "durable-storage-demo",
      "--cache-policy",
      "static-cache-policy-demo",
      "--health-startup-guard",
      "health-startup-guard-demo",
      "--browser-matrix",
      "desktop-mobile-browser-demo",
      "--accessibility-audit",
      "axe-keyboard-screenreader-demo",
      "--responsive-polish",
"responsive-polish-demo",
"--visual-regression",
"visual-regression-demo",
"--operator-review",
"operator-review-demo",
"--remote-ci",
      "remote-ci-webapp-demo",
      "--rollback-plan",
      "webapp-rollback-plan-demo",
"--second-operator",
"second-operator-webapp-review-demo",
      "--json"
    ],
    io
  );

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--authenticated-write-flow must be non-empty/);
});

test("web app production readiness packet CLI rejects blank security headers", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "web-app:production-readiness-packet",
      "--environment",
      "production-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--deployment-target",
      "self-host-container-demo",
      "--production-build",
      "production-build-artifact-demo",
      "--authenticated-write-flow",
      "authenticated-write-flow-demo",
      "--security-headers",
      " ",
      "--csrf-cookie-transport",
      "csrf-cookie-transport-demo",
      "--throttle-policy",
      "request-import-throttle-demo",
      "--durable-storage",
      "durable-storage-demo",
      "--cache-policy",
      "static-cache-policy-demo",
      "--health-startup-guard",
      "health-startup-guard-demo",
      "--browser-matrix",
      "desktop-mobile-browser-demo",
      "--accessibility-audit",
      "axe-keyboard-screenreader-demo",
      "--responsive-polish",
"responsive-polish-demo",
"--visual-regression",
"visual-regression-demo",
"--operator-review",
"operator-review-demo",
"--remote-ci",
      "remote-ci-webapp-demo",
      "--rollback-plan",
      "webapp-rollback-plan-demo",
"--second-operator",
"second-operator-webapp-review-demo",
      "--json"
    ],
    io
  );

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--security-headers must be non-empty/);
});

test("web app production readiness packet CLI rejects blank CSRF cookie transport", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "web-app:production-readiness-packet",
      "--environment",
      "production-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--deployment-target",
      "self-host-container-demo",
      "--production-build",
      "production-build-artifact-demo",
      "--authenticated-write-flow",
      "authenticated-write-flow-demo",
      "--security-headers",
      "security-header-deployment-demo",
      "--csrf-cookie-transport",
      " ",
      "--throttle-policy",
      "request-import-throttle-demo",
      "--durable-storage",
      "durable-storage-demo",
      "--cache-policy",
      "static-cache-policy-demo",
      "--health-startup-guard",
      "health-startup-guard-demo",
      "--browser-matrix",
      "desktop-mobile-browser-demo",
      "--accessibility-audit",
      "axe-keyboard-screenreader-demo",
      "--responsive-polish",
"responsive-polish-demo",
"--visual-regression",
"visual-regression-demo",
"--operator-review",
"operator-review-demo",
"--remote-ci",
      "remote-ci-webapp-demo",
      "--rollback-plan",
      "webapp-rollback-plan-demo",
"--second-operator",
"second-operator-webapp-review-demo",
      "--json"
    ],
    io
  );

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--csrf-cookie-transport must be non-empty/);
});

test("web app production readiness packet CLI rejects blank throttle policy", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "web-app:production-readiness-packet",
      "--environment",
      "production-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--deployment-target",
      "self-host-container-demo",
      "--production-build",
      "production-build-artifact-demo",
      "--authenticated-write-flow",
      "authenticated-write-flow-demo",
      "--security-headers",
      "security-header-deployment-demo",
      "--csrf-cookie-transport",
      "csrf-cookie-transport-demo",
      "--throttle-policy",
      " ",
      "--durable-storage",
      "durable-storage-demo",
      "--cache-policy",
      "static-cache-policy-demo",
      "--health-startup-guard",
      "health-startup-guard-demo",
      "--browser-matrix",
      "desktop-mobile-browser-demo",
      "--accessibility-audit",
      "axe-keyboard-screenreader-demo",
      "--responsive-polish",
"responsive-polish-demo",
"--visual-regression",
"visual-regression-demo",
"--operator-review",
"operator-review-demo",
"--remote-ci",
      "remote-ci-webapp-demo",
      "--rollback-plan",
      "webapp-rollback-plan-demo",
"--second-operator",
"second-operator-webapp-review-demo",
      "--json"
    ],
    io
  );

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--throttle-policy must be non-empty/);
});

test("web app production readiness packet CLI rejects blank durable storage", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "web-app:production-readiness-packet",
      "--environment",
      "production-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--deployment-target",
      "self-host-container-demo",
      "--production-build",
      "production-build-artifact-demo",
      "--authenticated-write-flow",
      "authenticated-write-flow-demo",
      "--security-headers",
      "security-header-deployment-demo",
      "--csrf-cookie-transport",
      "csrf-cookie-transport-demo",
      "--throttle-policy",
      "request-import-throttle-demo",
      "--durable-storage",
      " ",
      "--cache-policy",
      "static-cache-policy-demo",
      "--health-startup-guard",
      "health-startup-guard-demo",
      "--browser-matrix",
      "desktop-mobile-browser-demo",
      "--accessibility-audit",
      "axe-keyboard-screenreader-demo",
      "--responsive-polish",
"responsive-polish-demo",
"--visual-regression",
"visual-regression-demo",
"--operator-review",
"operator-review-demo",
"--remote-ci",
      "remote-ci-webapp-demo",
      "--rollback-plan",
      "webapp-rollback-plan-demo",
"--second-operator",
"second-operator-webapp-review-demo",
      "--json"
    ],
    io
  );

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--durable-storage must be non-empty/);
});

test("web app production readiness packet CLI rejects blank cache policy", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "web-app:production-readiness-packet",
      "--environment",
      "production-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--deployment-target",
      "self-host-container-demo",
      "--production-build",
      "production-build-artifact-demo",
      "--authenticated-write-flow",
      "authenticated-write-flow-demo",
      "--security-headers",
      "security-header-deployment-demo",
      "--csrf-cookie-transport",
      "csrf-cookie-transport-demo",
      "--throttle-policy",
      "request-import-throttle-demo",
      "--durable-storage",
      "durable-storage-demo",
      "--cache-policy",
      " ",
      "--health-startup-guard",
      "health-startup-guard-demo",
      "--browser-matrix",
      "desktop-mobile-browser-demo",
      "--accessibility-audit",
      "axe-keyboard-screenreader-demo",
      "--responsive-polish",
"responsive-polish-demo",
"--visual-regression",
"visual-regression-demo",
"--operator-review",
"operator-review-demo",
"--remote-ci",
      "remote-ci-webapp-demo",
      "--rollback-plan",
      "webapp-rollback-plan-demo",
"--second-operator",
"second-operator-webapp-review-demo",
      "--json"
    ],
    io
  );

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--cache-policy must be non-empty/);
});

test("web app production readiness packet CLI rejects blank health startup guard", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "web-app:production-readiness-packet",
      "--environment",
      "production-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--deployment-target",
      "self-host-container-demo",
      "--production-build",
      "production-build-artifact-demo",
      "--authenticated-write-flow",
      "authenticated-write-flow-demo",
      "--security-headers",
      "security-header-deployment-demo",
      "--csrf-cookie-transport",
      "csrf-cookie-transport-demo",
      "--throttle-policy",
      "request-import-throttle-demo",
      "--durable-storage",
      "durable-storage-demo",
      "--cache-policy",
      "static-cache-policy-demo",
      "--health-startup-guard",
      " ",
      "--browser-matrix",
      "desktop-mobile-browser-demo",
      "--accessibility-audit",
      "axe-keyboard-screenreader-demo",
      "--responsive-polish",
"responsive-polish-demo",
"--visual-regression",
"visual-regression-demo",
"--operator-review",
"operator-review-demo",
"--remote-ci",
      "remote-ci-webapp-demo",
      "--rollback-plan",
      "webapp-rollback-plan-demo",
"--second-operator",
"second-operator-webapp-review-demo",
      "--json"
    ],
    io
  );

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--health-startup-guard must be non-empty/);
});

test("web app production readiness packet CLI rejects blank browser matrix", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "web-app:production-readiness-packet",
      "--environment",
      "production-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--deployment-target",
      "self-host-container-demo",
      "--production-build",
      "production-build-artifact-demo",
      "--authenticated-write-flow",
      "authenticated-write-flow-demo",
      "--security-headers",
      "security-header-deployment-demo",
      "--csrf-cookie-transport",
      "csrf-cookie-transport-demo",
      "--throttle-policy",
      "request-import-throttle-demo",
      "--durable-storage",
      "durable-storage-demo",
      "--cache-policy",
      "static-cache-policy-demo",
      "--health-startup-guard",
      "health-startup-guard-demo",
      "--browser-matrix",
      " ",
      "--accessibility-audit",
      "axe-keyboard-screenreader-demo",
      "--responsive-polish",
"responsive-polish-demo",
"--visual-regression",
"visual-regression-demo",
"--operator-review",
"operator-review-demo",
"--remote-ci",
      "remote-ci-webapp-demo",
      "--rollback-plan",
      "webapp-rollback-plan-demo",
"--second-operator",
"second-operator-webapp-review-demo",
      "--json"
    ],
    io
  );

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--browser-matrix must be non-empty/);
});

test("web app production readiness packet CLI rejects blank accessibility audit", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "web-app:production-readiness-packet",
      "--environment",
      "production-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--deployment-target",
      "self-host-container-demo",
      "--production-build",
      "production-build-artifact-demo",
      "--authenticated-write-flow",
      "authenticated-write-flow-demo",
      "--security-headers",
      "security-header-deployment-demo",
      "--csrf-cookie-transport",
      "csrf-cookie-transport-demo",
      "--throttle-policy",
      "request-import-throttle-demo",
      "--durable-storage",
      "durable-storage-demo",
      "--cache-policy",
      "static-cache-policy-demo",
      "--health-startup-guard",
      "health-startup-guard-demo",
      "--browser-matrix",
      "desktop-mobile-browser-demo",
      "--accessibility-audit",
      " ",
      "--responsive-polish",
"responsive-polish-demo",
"--visual-regression",
"visual-regression-demo",
"--operator-review",
"operator-review-demo",
"--remote-ci",
      "remote-ci-webapp-demo",
      "--rollback-plan",
      "webapp-rollback-plan-demo",
"--second-operator",
"second-operator-webapp-review-demo",
      "--json"
    ],
    io
  );

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--accessibility-audit must be non-empty/);
});

test("web app production readiness packet CLI rejects blank remote CI", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "web-app:production-readiness-packet",
      "--environment",
      "production-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--deployment-target",
      "self-host-container-demo",
      "--production-build",
      "production-build-artifact-demo",
      "--authenticated-write-flow",
      "authenticated-write-flow-demo",
      "--security-headers",
      "security-header-deployment-demo",
      "--csrf-cookie-transport",
      "csrf-cookie-transport-demo",
      "--throttle-policy",
      "request-import-throttle-demo",
      "--durable-storage",
      "durable-storage-demo",
      "--cache-policy",
      "static-cache-policy-demo",
      "--health-startup-guard",
      "health-startup-guard-demo",
      "--browser-matrix",
      "desktop-mobile-browser-demo",
      "--accessibility-audit",
      "axe-keyboard-screenreader-demo",
      "--responsive-polish",
"responsive-polish-demo",
"--visual-regression",
"visual-regression-demo",
"--operator-review",
"operator-review-demo",
"--remote-ci",
      " ",
      "--rollback-plan",
      "webapp-rollback-plan-demo",
"--second-operator",
"second-operator-webapp-review-demo",
      "--json"
    ],
    io
  );

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--remote-ci must be non-empty/);
});

test("web app production readiness packet CLI rejects blank rollback plan", async () => {
const io = createCliIO();
const exitCode = await runCli(
    [
      "web-app:production-readiness-packet",
      "--environment",
      "production-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--deployment-target",
      "self-host-container-demo",
      "--production-build",
      "production-build-artifact-demo",
      "--authenticated-write-flow",
      "authenticated-write-flow-demo",
      "--security-headers",
      "security-header-deployment-demo",
      "--csrf-cookie-transport",
      "csrf-cookie-transport-demo",
      "--throttle-policy",
      "request-import-throttle-demo",
      "--durable-storage",
      "durable-storage-demo",
      "--cache-policy",
      "static-cache-policy-demo",
      "--health-startup-guard",
      "health-startup-guard-demo",
      "--browser-matrix",
      "desktop-mobile-browser-demo",
      "--accessibility-audit",
      "axe-keyboard-screenreader-demo",
      "--responsive-polish",
"responsive-polish-demo",
"--visual-regression",
"visual-regression-demo",
"--operator-review",
"operator-review-demo",
"--remote-ci",
      "remote-ci-webapp-demo",
      "--rollback-plan",
      " ",
"--second-operator",
"second-operator-webapp-review-demo",
      "--json"
    ],
    io
  );

assert.equal(exitCode, 1);
assert.match(io.stderrMessages.join("\n"), /--rollback-plan must be non-empty/);
});

const webAppProductionNewBlankLabelCases: Array<[string, RegExp]> = [
["--responsive-polish", /--responsive-polish must be non-empty/],
["--visual-regression", /--visual-regression must be non-empty/],
["--operator-review", /--operator-review must be non-empty/],
["--second-operator", /--second-operator must be non-empty/]
];

for (const [blankFlag, expectedError] of webAppProductionNewBlankLabelCases) {
test(`web app production readiness packet CLI rejects blank ${blankFlag}`, async () => {
const io = createCliIO();
const exitCode = await runCli(webAppProductionReadinessPacketArgs(blankFlag), io);

assert.equal(exitCode, 1);
assert.match(io.stderrMessages.join("\n"), expectedError);
});
}

function webAppProductionReadinessPacketArgs(blankFlag?: string): string[] {
const args = [
"web-app:production-readiness-packet",
"--environment",
"production-demo",
"--tenant-id",
"tenant_demo",
"--workspace-id",
"workspace_demo",
"--user-id",
"user_jordan",
"--as-of",
"2026-07-23T12:00:00.000Z",
"--deployment-target",
"self-host-container-demo",
"--production-build",
"production-build-artifact-demo",
"--authenticated-write-flow",
"authenticated-write-flow-demo",
"--security-headers",
"security-header-deployment-demo",
"--csrf-cookie-transport",
"csrf-cookie-transport-demo",
"--throttle-policy",
"request-import-throttle-demo",
"--durable-storage",
"durable-storage-demo",
"--cache-policy",
"static-cache-policy-demo",
"--health-startup-guard",
"health-startup-guard-demo",
"--browser-matrix",
"desktop-mobile-browser-demo",
"--accessibility-audit",
"axe-keyboard-screenreader-demo",
"--responsive-polish",
"responsive-polish-demo",
"--visual-regression",
"visual-regression-demo",
"--operator-review",
"operator-review-demo",
"--remote-ci",
"remote-ci-webapp-demo",
"--rollback-plan",
"webapp-rollback-plan-demo",
"--second-operator",
"second-operator-webapp-review-demo",
"--json"
];
if (blankFlag !== undefined) {
const index = args.indexOf(blankFlag);
assert.notEqual(index, -1);
args[index + 1] = " ";
}
return args;
}

const baseProductionDeploymentReadinessArgs = [
"deployment:production-readiness-packet",
  "--environment",
  "production-demo",
  "--deployment-topology",
  "reverse-proxy-container-demo",
  "--tls-termination",
  "tls-termination-demo",
  "--reverse-proxy-headers",
  "reverse-proxy-headers-demo",
  "--security-headers",
  "deployment-security-headers-demo",
  "--startup-guards",
  "deployment-startup-guards-demo",
  "--health-checks",
  "deployment-health-checks-demo",
  "--durable-storage",
  "deployment-durable-storage-demo",
  "--cookie-csrf-transport",
  "cookie-csrf-transport-demo",
  "--trusted-proxy-throttle",
  "trusted-proxy-throttle-demo",
  "--static-asset-cache",
  "static-asset-cache-demo",
  "--log-redaction",
  "deployment-log-redaction-demo",
  "--backup-rollback",
  "backup-rollback-demo",
  "--remote-ci-deployment-smoke",
  "remote-ci-deployment-smoke-demo",
"--operator-review",
"deployment-operator-review-demo",
"--second-operator",
"second-operator-deployment-review-demo",
"--tenant-id",
  "tenant_demo",
  "--workspace-id",
  "workspace_demo",
  "--user-id",
  "user_jordan",
  "--as-of",
  "2026-07-23T12:00:00.000Z"
] as const;

test("production deployment readiness packet CLI emits review evidence without hosting mutation", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [...baseProductionDeploymentReadinessArgs, "--json"],
    io
  );

  assert.equal(exitCode, 0);
  const output = JSON.parse(io.stdoutMessages[0] ?? "{}");
  assert.equal(output.operation, "production deployment readiness review");
  assert.equal(output.environment, "production-demo");
  assert.equal(output.deploymentTopology, "reverse-proxy-container-demo");
  assert.equal(output.tlsTermination, "tls-termination-demo");
  assert.equal(output.reverseProxyHeaders, "reverse-proxy-headers-demo");
  assert.equal(output.securityHeaders, "deployment-security-headers-demo");
  assert.equal(output.startupGuards, "deployment-startup-guards-demo");
  assert.equal(output.healthChecks, "deployment-health-checks-demo");
  assert.equal(output.durableStorage, "deployment-durable-storage-demo");
  assert.equal(output.cookieCsrfTransport, "cookie-csrf-transport-demo");
  assert.equal(output.trustedProxyThrottle, "trusted-proxy-throttle-demo");
  assert.equal(output.staticAssetCache, "static-asset-cache-demo");
  assert.equal(output.logRedaction, "deployment-log-redaction-demo");
  assert.equal(output.backupRollback, "backup-rollback-demo");
assert.equal(output.remoteCiDeploymentSmoke, "remote-ci-deployment-smoke-demo");
assert.equal(output.operatorReview, "deployment-operator-review-demo");
assert.equal(output.secondOperator, "second-operator-deployment-review-demo");
  assert.equal(output.productionDeploymentApproved, false);
  assert.equal(output.hostingMutationAllowedByPacket, false);
  assert.equal(output.dnsMutationAllowedByPacket, false);
  assert.equal(output.secretMutationAllowedByPacket, false);
  assert.equal(output.requiresTlsProxyProof, true);
  assert.equal(output.requiresSecurityHeaderProof, true);
  assert.equal(output.requiresStartupGuardProof, true);
  assert.equal(output.requiresHealthCheckProof, true);
  assert.equal(output.requiresDurableStorageProof, true);
  assert.equal(output.requiresCookieCsrfTransportProof, true);
  assert.equal(output.requiresTrustedProxyThrottleProof, true);
  assert.equal(output.requiresLogRedactionProof, true);
assert.equal(output.requiresBackupRollbackProof, true);
assert.equal(output.requiresRemoteCiProof, true);
assert.equal(output.requiresSecondOperatorProof, true);
  assert.deepEqual(output.evidenceRequired.slice(0, 3), [
    "TLS termination proof: tls-termination-demo",
    "reverse proxy header proof: reverse-proxy-headers-demo",
    "security header proof: deployment-security-headers-demo"
  ]);
assert.ok(output.evidenceRequired.includes("remote CI deployment smoke proof: remote-ci-deployment-smoke-demo"));
assert.ok(output.evidenceRequired.includes("operator review proof: deployment-operator-review-demo"));
assert.ok(output.evidenceRequired.includes("second-operator review proof: second-operator-deployment-review-demo"));
  assert.equal(JSON.stringify(output).includes("private_deploy_token_demo"), false);
  assert.equal(JSON.stringify(output).includes("raw_cookie_secret_demo"), false);
  assert.equal(JSON.stringify(output).includes("private_task_title_demo"), false);
});

test("production deployment readiness packet CLI rejects blank deployment topology", async () => {
  const io = createCliIO();
  const args = [...baseProductionDeploymentReadinessArgs, "--json"];
  args[args.indexOf("--deployment-topology") + 1] = " ";
  const exitCode = await runCli(args, io);

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--deployment-topology must be non-empty/);
});

for (const [flag, pattern] of [
  ["--tls-termination", /--tls-termination must be non-empty/],
  ["--reverse-proxy-headers", /--reverse-proxy-headers must be non-empty/],
  ["--security-headers", /--security-headers must be non-empty/],
  ["--startup-guards", /--startup-guards must be non-empty/],
  ["--health-checks", /--health-checks must be non-empty/],
  ["--durable-storage", /--durable-storage must be non-empty/],
  ["--cookie-csrf-transport", /--cookie-csrf-transport must be non-empty/],
  ["--trusted-proxy-throttle", /--trusted-proxy-throttle must be non-empty/],
  ["--static-asset-cache", /--static-asset-cache must be non-empty/],
  ["--log-redaction", /--log-redaction must be non-empty/],
  ["--backup-rollback", /--backup-rollback must be non-empty/],
  ["--remote-ci-deployment-smoke", /--remote-ci-deployment-smoke must be non-empty/],
["--operator-review", /--operator-review must be non-empty/],
["--second-operator", /--second-operator must be non-empty/]
] as const) {
  test(`production deployment readiness packet CLI rejects blank ${flag}`, async () => {
    const io = createCliIO();
    const args = [...baseProductionDeploymentReadinessArgs, "--json"];
    args[args.indexOf(flag) + 1] = " ";
    const exitCode = await runCli(args, io);

    assert.equal(exitCode, 1);
    assert.match(io.stderrMessages.join("\n"), pattern);
  });
}

const baseIcsReadinessArgs = [
  "ics:production-readiness-packet",
  "--environment",
  "production-demo",
  "--tenant-id",
  "tenant_demo",
  "--workspace-id",
  "workspace_demo",
  "--user-id",
  "user_jordan",
  "--as-of",
  "2026-07-23T12:00:00.000Z",
  "--recurrence-suite",
  "rrule-regression-demo",
  "--timezone-dst-proof",
  "timezone-dst-regression-demo",
  "--sync-idempotency",
  "checkpoint-replay-demo",
  "--import-preview-ux",
  "import-preview-ux-demo",
  "--export-privacy-redaction",
  "export-privacy-redaction-demo",
  "--write-back-conflict-preview",
  "write-back-conflict-preview-demo",
  "--provider-neutral-contract",
  "provider-neutral-ics-contract-demo",
  "--provider-fixture-suite",
  "google-outlook-icloud-fixture-demo",
  "--large-calendar-fixture",
  "large-calendar-fixture-demo",
  "--browser-workflow",
  "import-preview-export-writeback-demo",
 "--remote-ci",
 "remote-ci-ics-demo",
 "--rollback-plan",
 "ics-rollback-plan-demo",
 "--second-operator",
 "second-operator-ics-review-demo",
 "--json"
];

test("ICS production readiness packet CLI emits review evidence without sync approval", async () => {
  const io = createCliIO();
  const exitCode = await runCli(baseIcsReadinessArgs, io);

  assert.equal(exitCode, 0);
  const output = JSON.parse(io.stdoutMessages[0] ?? "{}");
  assert.equal(output.operation, "ICS production readiness review");
  assert.equal(output.environment, "production-demo");
  assert.equal(output.recurrenceSuite, "rrule-regression-demo");
  assert.equal(output.timezoneDstProof, "timezone-dst-regression-demo");
  assert.equal(output.syncIdempotencyProof, "checkpoint-replay-demo");
  assert.equal(output.importPreviewUx, "import-preview-ux-demo");
  assert.equal(output.exportPrivacyRedaction, "export-privacy-redaction-demo");
  assert.equal(output.writeBackConflictPreview, "write-back-conflict-preview-demo");
  assert.equal(output.providerNeutralContract, "provider-neutral-ics-contract-demo");
  assert.equal(output.providerFixtureSuite, "google-outlook-icloud-fixture-demo");
  assert.equal(output.largeCalendarFixture, "large-calendar-fixture-demo");
  assert.equal(output.browserWorkflow, "import-preview-export-writeback-demo");
 assert.equal(output.remoteCi, "remote-ci-ics-demo");
 assert.equal(output.rollbackPlan, "ics-rollback-plan-demo");
 assert.equal(output.secondOperator, "second-operator-ics-review-demo");
  assert.equal(output.productionSyncApprovalGranted, false);
  assert.equal(output.calendarWriteMutationAllowedByPacket, false);
  assert.equal(output.requiresRecurrenceRegressionProof, true);
  assert.equal(output.requiresSyncStateIdempotencyProof, true);
  assert.equal(output.requiresProviderWriteBackProof, true);
  assert.equal(output.requiresTimezoneDstProof, true);
  assert.equal(output.requiresImportPreviewUxProof, true);
  assert.equal(output.requiresExportPrivacyRedactionProof, true);
  assert.equal(output.requiresRemoteCiProof, true);
  assert.equal(output.scope.workspaceId, "workspace_demo");
  assert.deepEqual(output.evidenceRequired.slice(0, 3), [
    "recurrence regression suite proof",
    "timezone DST regression proof",
    "sync-state idempotency proof"
  ]);
  assert.equal(output.reviewSteps.some((step: string) => step.includes("timezone-dst-regression-demo")), true);
  assert.equal(output.reviewSteps.some((step: string) => step.includes("google-outlook-icloud-fixture-demo")), true);
  assert.equal(output.reviewSteps.some((step: string) => step.includes("import-preview-export-writeback-demo")), true);
  assert.equal(JSON.stringify(output).includes("ics_token_demo"), false);
  assert.equal(JSON.stringify(output).includes("private_calendar_title_demo"), false);
});

const icsBlankCases = [
  ["--recurrence-suite", /--recurrence-suite must be non-empty/],
  ["--timezone-dst-proof", /--timezone-dst-proof must be non-empty/],
  ["--sync-idempotency", /--sync-idempotency must be non-empty/],
  ["--import-preview-ux", /--import-preview-ux must be non-empty/],
  ["--export-privacy-redaction", /--export-privacy-redaction must be non-empty/],
  ["--write-back-conflict-preview", /--write-back-conflict-preview must be non-empty/],
  ["--provider-neutral-contract", /--provider-neutral-contract must be non-empty/],
  ["--provider-fixture-suite", /--provider-fixture-suite must be non-empty/],
  ["--large-calendar-fixture", /--large-calendar-fixture must be non-empty/],
  ["--browser-workflow", /--browser-workflow must be non-empty/],
  ["--remote-ci", /--remote-ci must be non-empty/],
  ["--rollback-plan", /--rollback-plan must be non-empty/]
] as const;

for (const [flag, expectedError] of icsBlankCases) {
  test(`ICS production readiness packet CLI rejects blank ${flag}`, async () => {
    const io = createCliIO();
    const args = [...baseIcsReadinessArgs];
    args[args.indexOf(flag) + 1] = "   ";
    const exitCode = await runCli(args, io);

    assert.equal(exitCode, 1);
    assert.match(io.stderrMessages.join("\n"), expectedError);
  });
}

const baseProviderCsvReadinessArgs = [
  "provider-csv:production-readiness-packet",
  "--environment",
  "production-demo",
  "--tenant-id",
  "tenant_demo",
  "--workspace-id",
  "workspace_demo",
  "--user-id",
  "user_jordan",
  "--as-of",
  "2026-07-23T12:00:00.000Z",
  "--fixture-suite",
  "real-provider-export-demo",
  "--download-upload-workflow",
  "provider-csv-download-upload-demo",
  "--confirmation-ux",
  "provider-csv-confirmation-ux-demo",
  "--provider-policy",
  "quota-abuse-policy-demo",
  "--browser-workflow",
  "provider-csv-browser-workflow-demo",
  "--abuse-analytics",
  "provider-csv-abuse-analytics-demo",
  "--large-fixture-suite",
  "large-provider-csv-fixture-demo",
  "--formula-injection-regression",
  "formula-injection-regression-demo",
  "--field-mapping-privacy",
  "field-mapping-privacy-demo",
"--remote-ci",
"remote-ci-provider-csv-demo",
"--rollback-plan",
"provider-csv-rollback-plan-demo",
"--second-operator",
"second-operator-provider-csv-review-demo",
"--json"
];

test("provider CSV production readiness packet CLI emits review evidence without import approval", async () => {
  const io = createCliIO();
  const exitCode = await runCli(baseProviderCsvReadinessArgs, io);

  assert.equal(exitCode, 0);
  const output = JSON.parse(io.stdoutMessages[0] ?? "{}");
  assert.equal(output.operation, "provider CSV production readiness review");
  assert.equal(output.environment, "production-demo");
  assert.equal(output.fixtureSuite, "real-provider-export-demo");
  assert.equal(output.downloadUploadWorkflow, "provider-csv-download-upload-demo");
  assert.equal(output.confirmationUx, "provider-csv-confirmation-ux-demo");
  assert.equal(output.providerPolicy, "quota-abuse-policy-demo");
  assert.equal(output.browserWorkflow, "provider-csv-browser-workflow-demo");
  assert.equal(output.abuseAnalytics, "provider-csv-abuse-analytics-demo");
  assert.equal(output.largeFixtureSuite, "large-provider-csv-fixture-demo");
  assert.equal(output.formulaInjectionRegression, "formula-injection-regression-demo");
  assert.equal(output.fieldMappingPrivacy, "field-mapping-privacy-demo");
assert.equal(output.remoteCi, "remote-ci-provider-csv-demo");
assert.equal(output.rollbackPlan, "provider-csv-rollback-plan-demo");
assert.equal(output.secondOperator, "second-operator-provider-csv-review-demo");
  assert.equal(output.productionImportApprovalGranted, false);
  assert.equal(output.importMutationAllowedByPacket, false);
  assert.equal(output.providerQuotaMutationAllowedByPacket, false);
  assert.equal(output.requiresRealProviderFixtureProof, true);
  assert.equal(output.requiresAbuseAnalyticsProof, true);
  assert.equal(output.requiresDownloadUploadWorkflowProof, true);
  assert.equal(output.requiresConfirmationUxProof, true);
  assert.equal(output.requiresFieldMappingPrivacyProof, true);
  assert.equal(output.requiresRemoteCiProof, true);
  assert.equal(output.scope.workspaceId, "workspace_demo");
  assert.deepEqual(output.evidenceRequired.slice(0, 3), [
    "real-provider export fixture proof",
    "download upload workflow proof",
    "provider-specific confirmation UX proof"
  ]);
  assert.equal(JSON.stringify(output).includes("provider_token_demo"), false);
  assert.equal(JSON.stringify(output).includes("private_task_title_demo"), false);
});

const providerCsvBlankCases = [
  ["--fixture-suite", /--fixture-suite must be non-empty/],
  ["--download-upload-workflow", /--download-upload-workflow must be non-empty/],
  ["--confirmation-ux", /--confirmation-ux must be non-empty/],
  ["--provider-policy", /--provider-policy must be non-empty/],
  ["--browser-workflow", /--browser-workflow must be non-empty/],
  ["--abuse-analytics", /--abuse-analytics must be non-empty/],
  ["--large-fixture-suite", /--large-fixture-suite must be non-empty/],
  ["--formula-injection-regression", /--formula-injection-regression must be non-empty/],
  ["--field-mapping-privacy", /--field-mapping-privacy must be non-empty/],
  ["--remote-ci", /--remote-ci must be non-empty/],
["--rollback-plan", /--rollback-plan must be non-empty/],

["--second-operator", /--second-operator must be non-empty/]
] as const;

for (const [flag, expectedError] of providerCsvBlankCases) {
  test(`provider CSV production readiness packet CLI rejects blank ${flag}`, async () => {
    const io = createCliIO();
    const args = [...baseProviderCsvReadinessArgs];
    args[args.indexOf(flag) + 1] = "   ";
    const exitCode = await runCli(args, io);

    assert.equal(exitCode, 1);
    assert.match(io.stderrMessages.join("\n"), expectedError);
  });
}

const baseHostedDeliveryReadinessArgs = [
  "public-events:hosted-delivery-readiness-packet",
  "--environment",
  "production-demo",
  "--tenant-id",
  "tenant_demo",
  "--workspace-id",
  "workspace_demo",
  "--user-id",
  "user_jordan",
  "--as-of",
  "2026-07-23T12:00:00.000Z",
  "--secret-provider",
  "managed-secret-provider-demo",
  "--runtime-identity",
  "runtime-identity-demo",
  "--rotation-drill",
  "secret-rotation-revocation-demo",
  "--worker-topology",
  "durable-worker-topology-demo",
  "--retry-queue",
  "hosted-retry-queue-demo",
  "--dead-letter-queue",
  "hosted-dead-letter-queue-demo",
  "--hosted-dashboard",
  "hosted-delivery-dashboard-demo",
  "--alert-routing",
  "hosted-alert-routing-demo",
  "--replay-boundary",
  "replay-boundary-demo",
  "--rate-limit-header-key",
  "rate-limit-header-key-demo",
  "--incident-drill",
  "hosted-delivery-incident-drill-demo",
"--remote-ci",
"remote-ci-hosted-delivery-demo",
"--rollback-plan",
"hosted-delivery-rollback-plan-demo",
"--second-operator",
"second-operator-hosted-delivery-review-demo",
"--json"
];

test("public events hosted delivery readiness packet CLI emits review evidence without enablement", async () => {
  const io = createCliIO();
  const exitCode = await runCli(baseHostedDeliveryReadinessArgs, io);

  assert.equal(exitCode, 0);
  const output = JSON.parse(io.stdoutMessages[0] ?? "{}");
  assert.equal(output.operation, "public events hosted delivery readiness review");
  assert.equal(output.environment, "production-demo");
  assert.equal(output.secretProvider, "managed-secret-provider-demo");
  assert.equal(output.runtimeIdentity, "runtime-identity-demo");
  assert.equal(output.rotationDrill, "secret-rotation-revocation-demo");
  assert.equal(output.workerTopology, "durable-worker-topology-demo");
  assert.equal(output.retryQueue, "hosted-retry-queue-demo");
  assert.equal(output.deadLetterQueue, "hosted-dead-letter-queue-demo");
  assert.equal(output.hostedDashboard, "hosted-delivery-dashboard-demo");
  assert.equal(output.alertRouting, "hosted-alert-routing-demo");
  assert.equal(output.replayBoundary, "replay-boundary-demo");
  assert.equal(output.rateLimitHeaderKey, "rate-limit-header-key-demo");
  assert.equal(output.incidentDrill, "hosted-delivery-incident-drill-demo");
assert.equal(output.remoteCi, "remote-ci-hosted-delivery-demo");
assert.equal(output.rollbackPlan, "hosted-delivery-rollback-plan-demo");
assert.equal(output.secondOperator, "second-operator-hosted-delivery-review-demo");
  assert.equal(output.productionHostedDeliveryApprovalGranted, false);
  assert.equal(output.hostedWorkerMutationAllowedByPacket, false);
  assert.equal(output.managedSecretProviderMutationAllowedByPacket, false);
  assert.equal(output.replayMutationAllowedByPacket, false);
  assert.equal(output.requiresManagedSecretProviderProof, true);
  assert.equal(output.requiresDurableWorkerProof, true);
  assert.equal(output.requiresHostedObservabilityProof, true);
  assert.equal(output.requiresReplayBoundaryProof, true);
  assert.equal(output.requiresRemoteCiProof, true);
  assert.equal(output.scope.workspaceId, "workspace_demo");
  assert.deepEqual(output.evidenceRequired.slice(0, 3), [
    "managed secret provider selection proof",
    "runtime identity and least-privilege policy proof",
    "secret rotation revocation drill proof"
  ]);
  assert.equal(JSON.stringify(output).includes("webhook_secret_demo"), false);
  assert.equal(JSON.stringify(output).includes("https://receiver.example.com"), false);
});

const hostedDeliveryBlankCases = [
  ["--secret-provider", /--secret-provider must be non-empty/],
  ["--runtime-identity", /--runtime-identity must be non-empty/],
  ["--rotation-drill", /--rotation-drill must be non-empty/],
  ["--worker-topology", /--worker-topology must be non-empty/],
  ["--retry-queue", /--retry-queue must be non-empty/],
  ["--dead-letter-queue", /--dead-letter-queue must be non-empty/],
  ["--hosted-dashboard", /--hosted-dashboard must be non-empty/],
  ["--alert-routing", /--alert-routing must be non-empty/],
  ["--replay-boundary", /--replay-boundary must be non-empty/],
  ["--rate-limit-header-key", /--rate-limit-header-key must be non-empty/],
  ["--incident-drill", /--incident-drill must be non-empty/],
  ["--remote-ci", /--remote-ci must be non-empty/],
["--rollback-plan", /--rollback-plan must be non-empty/],
["--second-operator", /--second-operator must be non-empty/]
] as const;

for (const [flag, expectedError] of hostedDeliveryBlankCases) {
  test(`public events hosted delivery readiness packet CLI rejects blank ${flag}`, async () => {
    const io = createCliIO();
    const args = [...baseHostedDeliveryReadinessArgs];
    args[args.indexOf(flag) + 1] = "   ";
    const exitCode = await runCli(args, io);

    assert.equal(exitCode, 1);
    assert.match(io.stderrMessages.join("\n"), expectedError);
  });
}

test("remote CI PostgreSQL readiness packet CLI emits review evidence without CI mutation", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "remote-ci:postgres-readiness-packet",
      "--environment",
      "ci-demo",
      "--ci-provider",
      "github-actions-demo",
      "--postgres-service",
      "postgres-service-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--json"
    ],
    io
  );

  assert.equal(exitCode, 0);
  const output = JSON.parse(io.stdoutMessages[0] ?? "{}");
  assert.equal(output.operation, "remote CI PostgreSQL readiness review");
  assert.equal(output.environment, "ci-demo");
  assert.equal(output.ciProvider, "github-actions-demo");
  assert.equal(output.postgresService, "postgres-service-demo");
  assert.equal(output.remoteCiPostgresApprovalGranted, false);
  assert.equal(output.ciMutationAllowedByPacket, false);
  assert.equal(output.databaseMutationAllowedByPacket, false);
  assert.equal(output.requiresRemoteCiProof, true);
  assert.equal(output.requiresMigrationProof, true);
  assert.equal(output.requiresTenantIsolationProof, true);
  assert.deepEqual(output.evidenceRequired.slice(0, 3), [
    "remote CI workflow proof",
    "PostgreSQL service container proof",
    "migration apply proof"
  ]);
  assert.equal(JSON.stringify(output).includes("postgres_demo_url_with_password"), false);
  assert.equal(JSON.stringify(output).includes("private_task_title_demo"), false);
});

test("remote CI PostgreSQL readiness packet CLI rejects blank CI provider", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "remote-ci:postgres-readiness-packet",
      "--environment",
      "ci-demo",
      "--ci-provider",
      " ",
      "--postgres-service",
      "postgres-service-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--json"
    ],
    io
  );

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--ci-provider must be non-empty/);
});

test("public remote CI readiness packet CLI emits review evidence without remote mutation", async () => {
const io = createCliIO();
const exitCode = await runCli(publicRemoteCiReadinessPacketArgs(), io);

  assert.equal(exitCode, 0);
  const output = JSON.parse(io.stdoutMessages[0] ?? "{}");
  assert.equal(output.operation, "public remote CI readiness review");
  assert.equal(output.environment, "release-demo");
assert.equal(output.ciProvider, "github-actions-demo");
assert.equal(output.workflowSuite, "release-gates-workflow-demo");
assert.equal(output.targetRepository, "scheduleos-ai/scheduleos");
assert.equal(output.workflowRun, "public-workflow-run-demo");
assert.equal(output.checkRun, "npm-check-run-demo");
assert.equal(output.productionDependencyAudit, "production-dependency-audit-demo");
assert.equal(output.noGitDirectory, "no-git-directory-proof-demo");
assert.equal(output.releaseSafetyScan, "release-safety-scan-demo");
assert.equal(output.docsLinkCheck, "docs-link-check-demo");
assert.equal(output.licenseCheck, "license-check-demo");
assert.equal(output.logSanitization, "log-sanitization-demo");
assert.equal(output.artifactRetention, "artifact-retention-demo");
assert.equal(output.branchProtectionReview, "branch-protection-review-demo");
assert.equal(output.repositorySettingsReadiness, "repository-settings-readiness-demo");
assert.equal(output.secondOperator, "second-operator-remote-ci-review-demo");
  assert.equal(output.publicRemoteCiVerified, false);
  assert.equal(output.workflowDispatchAllowedByPacket, false);
  assert.equal(output.remoteMutationAllowedByPacket, false);
  assert.equal(output.repositoryCreationAllowedByPacket, false);
  assert.equal(output.requiresFullCheckProof, true);
  assert.equal(output.requiresAuditProof, true);
  assert.equal(output.requiresNoGitDirectoryProof, true);
  assert.deepEqual(output.evidenceRequired.slice(0, 4), [
    "public remote CI workflow run proof",
    "npm run check proof",
    "production dependency audit proof",
    "no .git directory proof"
  ]);
  assert.equal(JSON.stringify(output).includes("ghp_demo_token"), false);
  assert.equal(JSON.stringify(output).includes("private_ci_log_demo"), false);
  assert.equal(JSON.stringify(output).includes(["/", "Users/"].join("")), false);
});

test("public remote CI readiness packet CLI rejects blank workflow suite", async () => {
const io = createCliIO();
const exitCode = await runCli(publicRemoteCiReadinessPacketArgs("--workflow-suite"), io);

assert.equal(exitCode, 1);
assert.match(io.stderrMessages.join("\n"), /--workflow-suite must be non-empty/);
});

const publicRemoteCiBlankLabelCases: Array<[string, RegExp]> = [
["--workflow-run", /--workflow-run must be non-empty/],
["--check-run", /--check-run must be non-empty/],
["--production-dependency-audit", /--production-dependency-audit must be non-empty/],
["--no-git-directory", /--no-git-directory must be non-empty/],
["--release-safety-scan", /--release-safety-scan must be non-empty/],
["--docs-link-check", /--docs-link-check must be non-empty/],
["--license-check", /--license-check must be non-empty/],
["--log-sanitization", /--log-sanitization must be non-empty/],
["--artifact-retention", /--artifact-retention must be non-empty/],
["--branch-protection-review", /--branch-protection-review must be non-empty/],
["--repository-settings-readiness", /--repository-settings-readiness must be non-empty/],
["--second-operator", /--second-operator must be non-empty/]
];

for (const [blankFlag, expectedError] of publicRemoteCiBlankLabelCases) {
test(`public remote CI readiness packet CLI rejects blank ${blankFlag}`, async () => {
const io = createCliIO();
const exitCode = await runCli(publicRemoteCiReadinessPacketArgs(blankFlag), io);
assert.equal(exitCode, 1);
assert.match(io.stderrMessages.join("\n"), expectedError);
});
}

function publicRemoteCiReadinessPacketArgs(blankFlag?: string): string[] {
const args = [
"remote-ci:public-readiness-packet",
"--environment",
"release-demo",
"--ci-provider",
"github-actions-demo",
"--workflow-suite",
"release-gates-workflow-demo",
"--target-repository",
"scheduleos-ai/scheduleos",
"--workflow-run",
"public-workflow-run-demo",
"--check-run",
"npm-check-run-demo",
"--production-dependency-audit",
"production-dependency-audit-demo",
"--no-git-directory",
"no-git-directory-proof-demo",
"--release-safety-scan",
"release-safety-scan-demo",
"--docs-link-check",
"docs-link-check-demo",
"--license-check",
"license-check-demo",
"--log-sanitization",
"log-sanitization-demo",
"--artifact-retention",
"artifact-retention-demo",
"--branch-protection-review",
"branch-protection-review-demo",
"--repository-settings-readiness",
"repository-settings-readiness-demo",
"--second-operator",
"second-operator-remote-ci-review-demo",
"--tenant-id",
"tenant_demo",
"--workspace-id",
"workspace_demo",
"--user-id",
"user_jordan",
"--as-of",
"2026-07-23T12:00:00.000Z",
"--json"
];
if (blankFlag !== undefined) {
const index = args.indexOf(blankFlag);
assert.notEqual(index, -1);
args[index + 1] = " ";
}
return args;
}

test("repository launch readiness packet CLI emits review evidence without publishing", async () => {
const io = createCliIO();
const exitCode = await runCli(repositoryLaunchReadinessPacketArgs(), io);

assert.equal(exitCode, 0);
const output = JSON.parse(io.stdoutMessages[0] ?? "{}");
assert.equal(output.operation, "repository launch readiness review");
assert.equal(output.environment, "release-demo");
assert.equal(output.targetRepository, "scheduleos-ai/scheduleos");
assert.equal(output.historyPlan, "clean-initial-history-demo");
assert.equal(output.finalReleaseGate, "final-release-gate-pass-demo");
assert.equal(output.cleanPublicHistory, "clean-public-history-demo");
assert.equal(output.privacySecretScan, "privacy-secret-scan-demo");
assert.equal(output.licenseAuditPass, "license-audit-pass-demo");
assert.equal(output.securityAuditPass, "security-audit-pass-demo");
assert.equal(output.securityPolicyContact, "security-policy-contact-demo");
assert.equal(output.remoteCiPass, "remote-ci-pass-demo");
assert.equal(output.nameCollisionReview, "name-collision-review-demo");
assert.equal(output.trademarkReview, "trademark-review-demo");
assert.equal(output.firstCommitStaging, "first-commit-staging-demo");
assert.equal(output.repositorySettings, "repository-settings-demo");
assert.equal(output.secondOperator, "second-operator-repository-launch-review-demo");
assert.equal(output.publicRepositoryCreationApproved, false);
assert.equal(output.pushMutationAllowedByPacket, false);
assert.equal(output.tagMutationAllowedByPacket, false);
assert.equal(output.releaseMutationAllowedByPacket, false);
assert.equal(output.requiresCleanHistoryProof, true);
assert.equal(output.requiresSecurityContactProof, true);
assert.equal(output.requiresRemoteCiProof, true);
assert.deepEqual(output.evidenceRequired.slice(0, 3), [
"final release gate pass proof",
"clean public history proof",
"privacy and secret scan proof"
]);
assert.equal(JSON.stringify(output).includes("security_contact_demo"), false);
assert.equal(JSON.stringify(output).includes("ghp_demo_token"), false);
assert.equal(JSON.stringify(output).includes("private_task_title_demo"), false);
});

test("repository launch readiness packet CLI rejects blank target", async () => {
const io = createCliIO();
const exitCode = await runCli(repositoryLaunchReadinessPacketArgs("--target"), io);

assert.equal(exitCode, 1);
assert.match(io.stderrMessages.join("\n"), /--target must be non-empty/);
});

const repositoryLaunchBlankLabelCases: Array<[string, RegExp]> = [
["--final-release-gate", /--final-release-gate must be non-empty/],
["--clean-public-history", /--clean-public-history must be non-empty/],
["--privacy-secret-scan", /--privacy-secret-scan must be non-empty/],
["--license-audit-pass", /--license-audit-pass must be non-empty/],
["--security-audit-pass", /--security-audit-pass must be non-empty/],
["--security-policy-contact", /--security-policy-contact must be non-empty/],
["--remote-ci-pass", /--remote-ci-pass must be non-empty/],
["--name-collision-review", /--name-collision-review must be non-empty/],
["--trademark-review", /--trademark-review must be non-empty/],
["--first-commit-staging", /--first-commit-staging must be non-empty/],
["--repository-settings", /--repository-settings must be non-empty/],
["--second-operator", /--second-operator must be non-empty/]
];

for (const [blankFlag, expectedError] of repositoryLaunchBlankLabelCases) {
test(`repository launch readiness packet CLI rejects blank ${blankFlag}`, async () => {
const io = createCliIO();
const exitCode = await runCli(repositoryLaunchReadinessPacketArgs(blankFlag), io);

assert.equal(exitCode, 1);
assert.match(io.stderrMessages.join("\n"), expectedError);
});
}

function repositoryLaunchReadinessPacketArgs(blankFlag?: string): string[] {
const args = [
"repository:launch-readiness-packet",
"--environment",
"release-demo",
"--target",
"scheduleos-ai/scheduleos",
"--history-plan",
"clean-initial-history-demo",
"--final-release-gate",
"final-release-gate-pass-demo",
"--clean-public-history",
"clean-public-history-demo",
"--privacy-secret-scan",
"privacy-secret-scan-demo",
"--license-audit-pass",
"license-audit-pass-demo",
"--security-audit-pass",
"security-audit-pass-demo",
"--security-policy-contact",
"security-policy-contact-demo",
"--remote-ci-pass",
"remote-ci-pass-demo",
"--name-collision-review",
"name-collision-review-demo",
"--trademark-review",
"trademark-review-demo",
"--first-commit-staging",
"first-commit-staging-demo",
"--repository-settings",
"repository-settings-demo",
"--second-operator",
"second-operator-repository-launch-review-demo",
"--tenant-id",
"tenant_demo",
"--workspace-id",
"workspace_demo",
"--user-id",
"user_jordan",
"--as-of",
"2026-07-23T12:00:00.000Z",
"--json"
];
if (blankFlag !== undefined) {
const index = args.indexOf(blankFlag);
assert.notEqual(index, -1);
args[index + 1] = " ";
}
return args;
}
test("repository settings readiness packet CLI emits review evidence without repository mutation", async () => {
const io = createCliIO();
const exitCode = await runCli(repositorySettingsReadinessPacketArgs(), io);

  assert.equal(exitCode, 0);
  const output = JSON.parse(io.stdoutMessages[0] ?? "{}");
  assert.equal(output.operation, "repository settings readiness review");
  assert.equal(output.environment, "release-demo");
assert.equal(output.targetRepository, "scheduleos-ai/scheduleos");
assert.equal(output.settingsProfile, "public-open-source-hardening-demo");
assert.equal(output.branchPolicy, "required-checks-main-demo");
assert.equal(output.branchProtectionSettings, "branch-protection-settings-demo");
assert.equal(output.requiredStatusChecks, "required-status-checks-demo");
assert.equal(output.securityAdvisorySettings, "security-advisory-settings-demo");
assert.equal(output.defaultBranchMergePolicy, "default-branch-merge-policy-demo");
assert.equal(output.maintainerAccessReview, "maintainer-access-review-demo");
assert.equal(output.dependabotAlerts, "dependabot-alerts-demo");
assert.equal(output.secretScanningPushProtection, "secret-scanning-push-protection-demo");
assert.equal(output.releasePackagePermissions, "release-package-permissions-demo");
assert.equal(output.repositoryMetadata, "repository-metadata-demo");
assert.equal(output.publicIssueDiscussionSettings, "public-issue-discussion-settings-demo");
assert.equal(output.secondOperator, "second-operator-repository-settings-review-demo");
  assert.equal(output.publicRepositorySettingsConfigured, false);
  assert.equal(output.repositoryMutationAllowedByPacket, false);
  assert.equal(output.branchProtectionMutationAllowedByPacket, false);
  assert.equal(output.securityAdvisoryMutationAllowedByPacket, false);
  assert.equal(output.releaseGateMutationAllowedByPacket, false);
  assert.equal(output.requiresBranchProtectionProof, true);
  assert.equal(output.requiresRequiredChecksProof, true);
  assert.equal(output.requiresSecuritySettingsProof, true);
  assert.deepEqual(output.evidenceRequired.slice(0, 4), [
    "branch protection settings proof",
    "required status checks proof",
    "security advisory settings proof",
    "default branch and merge policy proof"
  ]);
  assert.equal(JSON.stringify(output).includes("ghp_demo_token"), false);
  assert.equal(JSON.stringify(output).includes("private_admin_demo"), false);
});

test("repository settings readiness packet CLI rejects blank settings profile", async () => {
const io = createCliIO();
const exitCode = await runCli(repositorySettingsReadinessPacketArgs("--settings-profile"), io);

assert.equal(exitCode, 1);
assert.match(io.stderrMessages.join("\n"), /--settings-profile must be non-empty/);
});

const repositorySettingsBlankLabelCases: Array<[string, RegExp]> = [
["--branch-protection-settings", /--branch-protection-settings must be non-empty/],
["--required-status-checks", /--required-status-checks must be non-empty/],
["--security-advisory-settings", /--security-advisory-settings must be non-empty/],
["--default-branch-merge-policy", /--default-branch-merge-policy must be non-empty/],
["--maintainer-access-review", /--maintainer-access-review must be non-empty/],
["--dependabot-alerts", /--dependabot-alerts must be non-empty/],
["--secret-scanning-push-protection", /--secret-scanning-push-protection must be non-empty/],
["--release-package-permissions", /--release-package-permissions must be non-empty/],
["--repository-metadata", /--repository-metadata must be non-empty/],
["--public-issue-discussion-settings", /--public-issue-discussion-settings must be non-empty/],
["--second-operator", /--second-operator must be non-empty/]
];

for (const [blankFlag, expectedError] of repositorySettingsBlankLabelCases) {
test(`repository settings readiness packet CLI rejects blank ${blankFlag}`, async () => {
const io = createCliIO();
const exitCode = await runCli(repositorySettingsReadinessPacketArgs(blankFlag), io);
assert.equal(exitCode, 1);
assert.match(io.stderrMessages.join("\n"), expectedError);
});
}

function repositorySettingsReadinessPacketArgs(blankFlag?: string): string[] {
const args = [
"repository:settings-readiness-packet",
"--environment",
"release-demo",
"--target-repository",
"scheduleos-ai/scheduleos",
"--settings-profile",
"public-open-source-hardening-demo",
"--branch-policy",
"required-checks-main-demo",
"--branch-protection-settings",
"branch-protection-settings-demo",
"--required-status-checks",
"required-status-checks-demo",
"--security-advisory-settings",
"security-advisory-settings-demo",
"--default-branch-merge-policy",
"default-branch-merge-policy-demo",
"--maintainer-access-review",
"maintainer-access-review-demo",
"--dependabot-alerts",
"dependabot-alerts-demo",
"--secret-scanning-push-protection",
"secret-scanning-push-protection-demo",
"--release-package-permissions",
"release-package-permissions-demo",
"--repository-metadata",
"repository-metadata-demo",
"--public-issue-discussion-settings",
"public-issue-discussion-settings-demo",
"--second-operator",
"second-operator-repository-settings-review-demo",
"--tenant-id",
"tenant_demo",
"--workspace-id",
"workspace_demo",
"--user-id",
"user_jordan",
"--as-of",
"2026-07-23T12:00:00.000Z",
"--json"
];
if (blankFlag !== undefined) {
const index = args.indexOf(blankFlag);
assert.notEqual(index, -1);
args[index + 1] = " ";
}
return args;
}

test("final security audit readiness packet CLI emits review evidence without approving PASS", async () => {
const io = createCliIO();
const exitCode = await runCli(
finalSecurityAuditReadinessPacketArgs(),
io
);

  assert.equal(exitCode, 0);
  const output = JSON.parse(io.stdoutMessages[0] ?? "{}");
assert.equal(output.operation, "final security audit readiness review");
assert.equal(output.environment, "release-demo");
assert.equal(output.auditScope, "release-candidate-demo");
assert.equal(output.dependencyAuditPass, "dependency-audit-pass-demo");
assert.equal(output.secretScan, "secret-scan-demo");
assert.equal(output.privacyScan, "privacy-scan-demo");
assert.equal(output.productionAuth, "production-auth-demo");
assert.equal(output.roleMembership, "role-membership-demo");
assert.equal(output.resetTokenLifecycle, "reset-token-lifecycle-demo");
assert.equal(output.rateLimitAbuseMonitoring, "rate-limit-abuse-monitoring-demo");
assert.equal(output.providerManagedSecretLifecycle, "provider-managed-secret-lifecycle-demo");
assert.equal(output.deploymentTlsProxyHeaders, "deployment-tls-proxy-headers-demo");
assert.equal(output.remoteCi, "remote-ci-security-audit-demo");
assert.equal(output.securityPolicyContact, "security-policy-contact-demo");
assert.equal(output.finalSourceReview, "final-source-review-demo");
assert.equal(output.secondOperator, "second-operator-security-review-demo");
assert.equal(output.securityAuditPassApproved, false);
  assert.equal(output.releaseGateMutationAllowedByPacket, false);
  assert.equal(output.productionDeploymentApproved, false);
  assert.equal(output.requiresDependencyAuditFinalPass, true);
  assert.equal(output.requiresSecretScanProof, true);
  assert.equal(output.requiresPrivacyScanProof, true);
  assert.equal(output.requiresSecurityContactProof, true);
  assert.deepEqual(output.evidenceRequired.slice(0, 3), [
    "final dependency audit pass proof",
    "secret scan proof",
    "privacy and private-data scan proof"
]);
assert.match(output.reviewSteps.join("\n"), /dependency-audit-pass-demo/);
assert.match(output.reviewSteps.join("\n"), /second-operator-security-review-demo/);
assert.equal(JSON.stringify(output).includes("security_contact_demo"), false);
  assert.equal(JSON.stringify(output).includes("sk_demo_secret"), false);
  assert.equal(JSON.stringify(output).includes("private_task_title_demo"), false);
});

test("final security audit readiness packet CLI rejects blank audit scope", async () => {
const io = createCliIO();
const exitCode = await runCli(
finalSecurityAuditReadinessPacketArgs("--audit-scope"),
io
);

assert.equal(exitCode, 1);
assert.match(io.stderrMessages.join("\n"), /--audit-scope must be non-empty/);
});

const finalSecurityAuditBlankLabelCases: Array<[string, RegExp]> = [
["--dependency-audit-pass", /--dependency-audit-pass must be non-empty/],
["--secret-scan", /--secret-scan must be non-empty/],
["--privacy-scan", /--privacy-scan must be non-empty/],
["--production-auth", /--production-auth must be non-empty/],
["--role-membership", /--role-membership must be non-empty/],
["--reset-token-lifecycle", /--reset-token-lifecycle must be non-empty/],
["--rate-limit-abuse-monitoring", /--rate-limit-abuse-monitoring must be non-empty/],
["--provider-managed-secret-lifecycle", /--provider-managed-secret-lifecycle must be non-empty/],
["--deployment-tls-proxy-headers", /--deployment-tls-proxy-headers must be non-empty/],
["--remote-ci", /--remote-ci must be non-empty/],
["--security-policy-contact", /--security-policy-contact must be non-empty/],
["--final-source-review", /--final-source-review must be non-empty/],
["--second-operator", /--second-operator must be non-empty/]
];

for (const [blankFlag, expectedError] of finalSecurityAuditBlankLabelCases) {
test(`final security audit readiness packet CLI rejects blank ${blankFlag}`, async () => {
const io = createCliIO();
const exitCode = await runCli(finalSecurityAuditReadinessPacketArgs(blankFlag), io);

assert.equal(exitCode, 1);
assert.match(io.stderrMessages.join("\n"), expectedError);
});
}

function finalSecurityAuditReadinessPacketArgs(blankFlag?: string): string[] {
const args = [
"security:final-audit-readiness-packet",
"--environment",
"release-demo",
"--audit-scope",
"release-candidate-demo",
"--dependency-audit-pass",
"dependency-audit-pass-demo",
"--secret-scan",
"secret-scan-demo",
"--privacy-scan",
"privacy-scan-demo",
"--production-auth",
"production-auth-demo",
"--role-membership",
"role-membership-demo",
"--reset-token-lifecycle",
"reset-token-lifecycle-demo",
"--rate-limit-abuse-monitoring",
"rate-limit-abuse-monitoring-demo",
"--provider-managed-secret-lifecycle",
"provider-managed-secret-lifecycle-demo",
"--deployment-tls-proxy-headers",
"deployment-tls-proxy-headers-demo",
"--remote-ci",
"remote-ci-security-audit-demo",
"--security-policy-contact",
"security-policy-contact-demo",
"--final-source-review",
"final-source-review-demo",
"--second-operator",
"second-operator-security-review-demo",
"--tenant-id",
"tenant_demo",
"--workspace-id",
"workspace_demo",
"--user-id",
"user_jordan",
"--as-of",
"2026-07-23T12:00:00.000Z",
"--json"
];

if (blankFlag !== undefined) {
const index = args.indexOf(blankFlag);
assert.notEqual(index, -1);
args[index + 1] = " ";
}

return args;
}

test("final licensing audit readiness packet CLI emits review evidence without approving PASS", async () => {
const io = createCliIO();
const exitCode = await runCli(finalLicensingAuditReadinessPacketArgs(), io);

  assert.equal(exitCode, 0);
  const output = JSON.parse(io.stdoutMessages[0] ?? "{}");
  assert.equal(output.operation, "final licensing audit readiness review");
  assert.equal(output.environment, "release-demo");
  assert.equal(output.auditScope, "release-candidate-demo");
  assert.equal(output.finalLicenseCheck, "final-license-check-demo");
  assert.equal(output.lockfileDependencyLicenses, "lockfile-dependency-licenses-demo");
  assert.equal(output.installedDependencyMetadata, "installed-dependency-metadata-demo");
  assert.equal(output.copiedSourceScan, "copied-source-scan-demo");
  assert.equal(output.fixtureTemplateExampleReview, "fixture-template-example-review-demo");
  assert.equal(output.assetMediaFontBinaryReview, "asset-media-font-binary-review-demo");
  assert.equal(output.documentationReuseScan, "documentation-reuse-scan-demo");
  assert.equal(output.reusedMaterialInventory, "reused-material-inventory-demo");
  assert.equal(output.noticeReview, "notice-review-demo");
  assert.equal(output.rootLicenseConsistency, "root-license-consistency-demo");
  assert.equal(output.finalReleaseCandidateFreeze, "final-release-candidate-freeze-demo");
  assert.equal(output.secondOperator, "second-operator-licensing-review-demo");
  assert.equal(output.licensingAuditPassApproved, false);
  assert.equal(output.releaseGateMutationAllowedByPacket, false);
  assert.equal(output.noticeMutationAllowedByPacket, false);
  assert.equal(output.requiresLockfileLicenseProof, true);
  assert.equal(output.requiresCopiedSourceProof, true);
  assert.equal(output.requiresFixtureAssetDocsProof, true);
assert.equal(output.requiresNoticeReviewProof, true);
assert.deepEqual(output.evidenceRequired.slice(0, 3), [
"final license check pass proof",
"lockfile dependency license proof",
"installed dependency metadata proof"
]);
assert.deepEqual(output.localEvidenceCommands, [
"npm run license:check",
"npm ls --omit=dev --all",
"npm run release:safety",
"find . -maxdepth 2 -name .git -type d -print"
]);
assert.match(output.localEvidenceBoundary, /review inputs only/);
assert.equal(JSON.stringify(output).includes("license_contact_demo"), false);
assert.equal(JSON.stringify(output).includes("copied_private_snippet_demo"), false);
assert.equal(JSON.stringify(output).includes("private_task_title_demo"), false);
});

test("final licensing audit readiness packet CLI rejects blank audit scope", async () => {
const io = createCliIO();
const exitCode = await runCli(finalLicensingAuditReadinessPacketArgs("--audit-scope"), io);

assert.equal(exitCode, 1);
assert.match(io.stderrMessages.join("\n"), /--audit-scope must be non-empty/);
});

const finalLicensingAuditBlankLabelCases: Array<[string, RegExp]> = [
["--final-license-check", /--final-license-check must be non-empty/],
["--lockfile-dependency-licenses", /--lockfile-dependency-licenses must be non-empty/],
["--installed-dependency-metadata", /--installed-dependency-metadata must be non-empty/],
["--copied-source-scan", /--copied-source-scan must be non-empty/],
["--fixture-template-example-review", /--fixture-template-example-review must be non-empty/],
["--asset-media-font-binary-review", /--asset-media-font-binary-review must be non-empty/],
["--documentation-reuse-scan", /--documentation-reuse-scan must be non-empty/],
["--reused-material-inventory", /--reused-material-inventory must be non-empty/],
["--notice-review", /--notice-review must be non-empty/],
["--root-license-consistency", /--root-license-consistency must be non-empty/],
["--final-release-candidate-freeze", /--final-release-candidate-freeze must be non-empty/],
["--second-operator", /--second-operator must be non-empty/]
];

for (const [blankFlag, expectedError] of finalLicensingAuditBlankLabelCases) {
test(`final licensing audit readiness packet CLI rejects blank ${blankFlag}`, async () => {
const io = createCliIO();
const exitCode = await runCli(finalLicensingAuditReadinessPacketArgs(blankFlag), io);
assert.equal(exitCode, 1);
assert.match(io.stderrMessages.join("\n"), expectedError);
});
}

function finalLicensingAuditReadinessPacketArgs(blankFlag?: string): string[] {
const args = [
"licensing:final-audit-readiness-packet",
"--environment",
"release-demo",
"--audit-scope",
"release-candidate-demo",
"--final-license-check",
"final-license-check-demo",
"--lockfile-dependency-licenses",
"lockfile-dependency-licenses-demo",
"--installed-dependency-metadata",
"installed-dependency-metadata-demo",
"--copied-source-scan",
"copied-source-scan-demo",
"--fixture-template-example-review",
"fixture-template-example-review-demo",
"--asset-media-font-binary-review",
"asset-media-font-binary-review-demo",
"--documentation-reuse-scan",
"documentation-reuse-scan-demo",
"--reused-material-inventory",
"reused-material-inventory-demo",
"--notice-review",
"notice-review-demo",
"--root-license-consistency",
"root-license-consistency-demo",
"--final-release-candidate-freeze",
"final-release-candidate-freeze-demo",
"--second-operator",
"second-operator-licensing-review-demo",
"--tenant-id",
"tenant_demo",
"--workspace-id",
"workspace_demo",
"--user-id",
"user_jordan",
"--as-of",
"2026-07-23T12:00:00.000Z",
"--json"
];
if (blankFlag !== undefined) {
const index = args.indexOf(blankFlag);
assert.notEqual(index, -1);
args[index + 1] = " ";
}
return args;
}

test("final privacy audit readiness packet CLI emits review evidence without approving PASS", async () => {
const io = createCliIO();
const exitCode = await runCli(finalPrivacyAuditReadinessPacketArgs(), io);
assert.equal(exitCode, 0);
const output = JSON.parse(io.stdoutMessages[0] ?? "{}");
assert.equal(output.operation, "final privacy audit readiness review");
assert.equal(output.environment, "release-demo");
assert.equal(output.auditScope, "release-candidate-demo");
assert.equal(output.releaseSafetyScan, "release-safety-scan-demo");
assert.equal(output.fixtureSanitization, "fixture-sanitization-demo");
assert.equal(output.generatedArtifactReview, "generated-artifact-review-demo");
assert.equal(output.logExportBackupReview, "log-export-backup-review-demo");
assert.equal(output.providerIdentifierReview, "provider-identifier-review-demo");
assert.equal(output.localPathPrivateUrlReview, "local-path-private-url-review-demo");
assert.equal(output.privateLeadershipBoundary, "private-leadership-boundary-demo");
assert.equal(output.calendarTaskMinimization, "calendar-task-minimization-demo");
assert.equal(output.aiRedactionBoundary, "ai-redaction-boundary-demo");
assert.equal(output.retentionExportDeletionRevocation, "retention-export-deletion-revocation-demo");
assert.equal(output.secondOperator, "second-operator-privacy-review-demo");
assert.equal(output.privacyAuditPassApproved, false);
assert.equal(output.releaseGateMutationAllowedByPacket, false);
assert.equal(output.publicationAllowedByPacket, false);
assert.equal(output.requiresFixtureSanitizationProof, true);
assert.equal(output.requiresGeneratedArtifactReviewProof, true);
assert.equal(output.requiresProviderIdentifierReviewProof, true);
assert.equal(output.requiresPrivateLeadershipBoundaryProof, true);
assert.deepEqual(output.evidenceRequired.slice(0, 3), [
"final release safety scan proof",
"fixture and sample-data sanitization proof",
"generated artifact sanitization proof"
]);
assert.match(output.reviewSteps.join("\n"), /release-safety-scan-demo/);
assert.match(output.reviewSteps.join("\n"), /second-operator-privacy-review-demo/);
assert.equal(JSON.stringify(output).includes("personal_email_demo"), false);
assert.equal(JSON.stringify(output).includes("private_calendar_title_demo"), false);
assert.equal(JSON.stringify(output).includes("leadership-system_private_prompt_demo"), false);
});

test("final privacy audit readiness packet CLI rejects blank audit scope", async () => {
const io = createCliIO();
const exitCode = await runCli(finalPrivacyAuditReadinessPacketArgs("--audit-scope"), io);
assert.equal(exitCode, 1);
assert.match(io.stderrMessages.join("\n"), /--audit-scope must be non-empty/);
});

const finalPrivacyAuditBlankLabelCases: Array<[string, RegExp]> = [
["--release-safety-scan", /--release-safety-scan must be non-empty/],
["--fixture-sanitization", /--fixture-sanitization must be non-empty/],
["--generated-artifact-review", /--generated-artifact-review must be non-empty/],
["--log-export-backup-review", /--log-export-backup-review must be non-empty/],
["--provider-identifier-review", /--provider-identifier-review must be non-empty/],
["--local-path-private-url-review", /--local-path-private-url-review must be non-empty/],
["--private-leadership-boundary", /--private-leadership-boundary must be non-empty/],
["--calendar-task-minimization", /--calendar-task-minimization must be non-empty/],
["--ai-redaction-boundary", /--ai-redaction-boundary must be non-empty/],
["--retention-export-deletion-revocation", /--retention-export-deletion-revocation must be non-empty/],
["--second-operator", /--second-operator must be non-empty/]
];

for (const [blankFlag, expectedError] of finalPrivacyAuditBlankLabelCases) {
test(`final privacy audit readiness packet CLI rejects blank ${blankFlag}`, async () => {
const io = createCliIO();
const exitCode = await runCli(finalPrivacyAuditReadinessPacketArgs(blankFlag), io);
assert.equal(exitCode, 1);
assert.match(io.stderrMessages.join("\n"), expectedError);
});
}

function finalPrivacyAuditReadinessPacketArgs(blankFlag?: string): string[] {
const args = [
"privacy:final-audit-readiness-packet",
"--environment",
"release-demo",
"--audit-scope",
"release-candidate-demo",
"--release-safety-scan",
"release-safety-scan-demo",
"--fixture-sanitization",
"fixture-sanitization-demo",
"--generated-artifact-review",
"generated-artifact-review-demo",
"--log-export-backup-review",
"log-export-backup-review-demo",
"--provider-identifier-review",
"provider-identifier-review-demo",
"--local-path-private-url-review",
"local-path-private-url-review-demo",
"--private-leadership-boundary",
"private-leadership-boundary-demo",
"--calendar-task-minimization",
"calendar-task-minimization-demo",
"--ai-redaction-boundary",
"ai-redaction-boundary-demo",
"--retention-export-deletion-revocation",
"retention-export-deletion-revocation-demo",
"--second-operator",
"second-operator-privacy-review-demo",
"--tenant-id",
"tenant_demo",
"--workspace-id",
"workspace_demo",
"--user-id",
"user_jordan",
"--as-of",
"2026-07-23T12:00:00.000Z",
"--json"
];
if (blankFlag !== undefined) {
const index = args.indexOf(blankFlag);
assert.notEqual(index, -1);
args[index + 1] = " ";
}
return args;
}

test("final release gate readiness packet CLI emits review evidence without release approval", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    finalReleaseGateReadinessPacketArgs(),
    io
  );

  assert.equal(exitCode, 0);
  const output = JSON.parse(io.stdoutMessages[0] ?? "{}");
  assert.equal(output.operation, "final release gate readiness review");
  assert.equal(output.environment, "release-demo");
  assert.equal(output.releaseScope, "public-release-candidate-demo");
  assert.equal(output.functionalityGate, "functionality-gate-pass-demo");
  assert.equal(output.storageGate, "storage-gate-pass-demo");
  assert.equal(output.documentationGate, "documentation-gate-pass-demo");
  assert.equal(output.securityAuditPass, "security-audit-pass-demo");
  assert.equal(output.licensingAuditPass, "licensing-audit-pass-demo");
  assert.equal(output.privacyAuditPass, "privacy-audit-pass-demo");
  assert.equal(output.dependencyAuditFinalPass, "dependency-audit-final-pass-demo");
  assert.equal(output.remoteCiPass, "remote-ci-pass-demo");
  assert.equal(output.cleanHistory, "clean-history-proof-demo");
  assert.equal(output.securityPolicyContact, "security-policy-contact-demo");
  assert.equal(output.repositorySettings, "repository-settings-demo");
  assert.equal(output.finalSourceReview, "final-source-review-demo");
  assert.equal(output.secondOperator, "second-operator-release-approval-demo");
  assert.equal(output.releaseApproved, false);
  assert.equal(output.publicationAllowedByPacket, false);
  assert.equal(output.repositoryMutationAllowedByPacket, false);
  assert.equal(output.requiresFunctionalityGateProof, true);
  assert.equal(output.requiresSecurityAuditPassProof, true);
  assert.equal(output.requiresLicensingAuditPassProof, true);
  assert.equal(output.requiresPrivacyAuditPassProof, true);
  assert.equal(output.requiresRemoteCiProof, true);
  assert.deepEqual(output.evidenceRequired.slice(0, 4), [
    "functionality gate pass proof",
    "storage gate pass proof",
    "documentation gate pass proof",
    "security audit PASS proof"
  ]);
  assert.match(output.reviewSteps.join("\n"), /functionality-gate-pass-demo/);
  assert.match(output.reviewSteps.join("\n"), /second-operator-release-approval-demo/);
  assert.equal(JSON.stringify(output).includes("ghp_demo_token"), false);
  assert.equal(JSON.stringify(output).includes("private_task_title_demo"), false);
  assert.equal(JSON.stringify(output).includes("release_contact_demo"), false);
});

test("final release gate readiness packet CLI rejects blank release scope", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    finalReleaseGateReadinessPacketArgs("--release-scope"),
    io
  );

assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--release-scope must be non-empty/);
});

const finalReleaseGateBlankLabelCases: Array<[string, RegExp]> = [
  ["--functionality-gate", /--functionality-gate must be non-empty/],
  ["--storage-gate", /--storage-gate must be non-empty/],
  ["--documentation-gate", /--documentation-gate must be non-empty/],
  ["--security-audit-pass", /--security-audit-pass must be non-empty/],
  ["--licensing-audit-pass", /--licensing-audit-pass must be non-empty/],
  ["--privacy-audit-pass", /--privacy-audit-pass must be non-empty/],
  ["--dependency-audit-final-pass", /--dependency-audit-final-pass must be non-empty/],
  ["--remote-ci-pass", /--remote-ci-pass must be non-empty/],
  ["--clean-history", /--clean-history must be non-empty/],
  ["--security-policy-contact", /--security-policy-contact must be non-empty/],
  ["--repository-settings", /--repository-settings must be non-empty/],
  ["--final-source-review", /--final-source-review must be non-empty/],
  ["--second-operator", /--second-operator must be non-empty/]
];

for (const [blankFlag, expectedError] of finalReleaseGateBlankLabelCases) {
  test(`final release gate readiness packet CLI rejects blank ${blankFlag}`, async () => {
    const io = createCliIO();
    const exitCode = await runCli(
      finalReleaseGateReadinessPacketArgs(blankFlag),
      io
    );

    assert.equal(exitCode, 1);
    assert.match(io.stderrMessages.join("\n"), expectedError);
  });
}

function finalReleaseGateReadinessPacketArgs(blankFlag?: string): string[] {
  const args = [
    "release:final-gate-readiness-packet",
    "--environment",
    "release-demo",
    "--release-scope",
    "public-release-candidate-demo",
    "--functionality-gate",
    "functionality-gate-pass-demo",
    "--storage-gate",
    "storage-gate-pass-demo",
    "--documentation-gate",
    "documentation-gate-pass-demo",
    "--security-audit-pass",
    "security-audit-pass-demo",
    "--licensing-audit-pass",
    "licensing-audit-pass-demo",
    "--privacy-audit-pass",
    "privacy-audit-pass-demo",
    "--dependency-audit-final-pass",
    "dependency-audit-final-pass-demo",
    "--remote-ci-pass",
    "remote-ci-pass-demo",
    "--clean-history",
    "clean-history-proof-demo",
    "--security-policy-contact",
    "security-policy-contact-demo",
    "--repository-settings",
    "repository-settings-demo",
    "--final-source-review",
    "final-source-review-demo",
    "--second-operator",
    "second-operator-release-approval-demo",
    "--tenant-id",
    "tenant_demo",
    "--workspace-id",
    "workspace_demo",
    "--user-id",
    "user_jordan",
    "--as-of",
    "2026-07-23T12:00:00.000Z",
    "--json"
  ];

  if (blankFlag !== undefined) {
    const index = args.indexOf(blankFlag);
    assert.notEqual(index, -1);
    args[index + 1] = " ";
  }

  return args;
}

test("dependency audit readiness packet CLI emits review evidence without dependency mutation", async () => {
const io = createCliIO();
const exitCode = await runCli(
[
"dependency:final-audit-readiness-packet",
"--environment",
"release-demo",
"--audit-scope",
"release-candidate-demo",
"--package-manager",
"npm-demo",
"--production-audit",
"production-dependency-audit-demo",
"--lockfile-proof",
"lockfile-reproducibility-demo",
"--installed-tree",
"installed-tree-demo",
"--runtime-inventory",
"runtime-inventory-demo",
"--dev-dependency-exclusion",
"dev-dependency-exclusion-demo",
"--override-review",
"override-review-demo",
"--license-alignment",
"license-alignment-demo",
"--registry-secret-absence",
"registry-secret-absence-demo",
"--remote-ci",
"remote-ci-dependency-audit-demo",
"--second-operator",
"second-operator-dependency-review-demo",
"--tenant-id",
"tenant_demo",
"--workspace-id",
"workspace_demo",
"--user-id",
"user_jordan",
"--as-of",
"2026-07-23T12:00:00.000Z",
"--json"
],
io
);

assert.equal(exitCode, 0);
const output = JSON.parse(io.stdoutMessages[0] ?? "{}");
assert.equal(output.operation, "dependency audit readiness review");
assert.equal(output.environment, "release-demo");
  assert.equal(output.auditScope, "release-candidate-demo");
  assert.equal(output.packageManager, "npm-demo");
  assert.equal(output.productionAudit, "production-dependency-audit-demo");
  assert.equal(output.lockfileProof, "lockfile-reproducibility-demo");
  assert.equal(output.installedTree, "installed-tree-demo");
  assert.equal(output.runtimeInventory, "runtime-inventory-demo");
  assert.equal(output.devDependencyExclusion, "dev-dependency-exclusion-demo");
  assert.equal(output.overrideReview, "override-review-demo");
  assert.equal(output.licenseAlignment, "license-alignment-demo");
  assert.equal(output.registrySecretAbsence, "registry-secret-absence-demo");
  assert.equal(output.remoteCi, "remote-ci-dependency-audit-demo");
  assert.equal(output.secondOperator, "second-operator-dependency-review-demo");
  assert.equal(output.dependencyAuditPassApproved, false);
assert.equal(output.dependencyMutationAllowedByPacket, false);
assert.equal(output.lockfileMutationAllowedByPacket, false);
assert.equal(output.releaseGateMutationAllowedByPacket, false);
assert.equal(output.requiresProductionAuditProof, true);
assert.equal(output.requiresLockfileProof, true);
assert.equal(output.requiresOverrideReviewProof, true);
  assert.deepEqual(output.evidenceRequired.slice(0, 3), [
    "production dependency audit proof",
    "lockfile reproducibility proof",
    "installed dependency tree proof"
  ]);
  assert.deepEqual(output.localEvidenceCommands, [
    "npm run check",
    "npm audit --omit=dev --audit-level=high",
    "npm ls --omit=dev --all",
    "npm run license:check",
    "find . -maxdepth 2 -name .git -type d -print"
  ]);
  assert.match(output.labelReviewSteps.join("\n"), /production-dependency-audit-demo/);
  assert.match(output.labelReviewSteps.join("\n"), /remote-ci-dependency-audit-demo/);
  assert.match(output.localEvidenceBoundary, /review inputs only/);
  assert.equal(JSON.stringify(output).includes("npm_token_demo"), false);
assert.equal(JSON.stringify(output).includes("private_registry_demo"), false);
assert.equal(JSON.stringify(output).includes("private_package_name_demo"), false);
});

test("dependency audit readiness packet CLI rejects blank audit scope", async () => {
const io = createCliIO();
const exitCode = await runCli(
[
"dependency:final-audit-readiness-packet",
"--environment",
"release-demo",
"--audit-scope",
" ",
"--package-manager",
"npm-demo",
"--production-audit",
"production-dependency-audit-demo",
"--lockfile-proof",
"lockfile-reproducibility-demo",
"--installed-tree",
"installed-tree-demo",
"--runtime-inventory",
"runtime-inventory-demo",
"--dev-dependency-exclusion",
"dev-dependency-exclusion-demo",
"--override-review",
"override-review-demo",
"--license-alignment",
"license-alignment-demo",
"--registry-secret-absence",
"registry-secret-absence-demo",
"--remote-ci",
"remote-ci-dependency-audit-demo",
"--second-operator",
"second-operator-dependency-review-demo",
"--tenant-id",
"tenant_demo",
"--workspace-id",
"workspace_demo",
"--user-id",
"user_jordan",
"--as-of",
"2026-07-23T12:00:00.000Z",
"--json"
],
io
);

assert.equal(exitCode, 1);
assert.match(io.stderrMessages.join("\n"), /--audit-scope must be non-empty/);
});

const dependencyAuditBlankLabelCases = [
  ["--production-audit", /--production-audit must be non-empty/],
  ["--lockfile-proof", /--lockfile-proof must be non-empty/],
  ["--installed-tree", /--installed-tree must be non-empty/],
  ["--runtime-inventory", /--runtime-inventory must be non-empty/],
  ["--dev-dependency-exclusion", /--dev-dependency-exclusion must be non-empty/],
  ["--override-review", /--override-review must be non-empty/],
  ["--license-alignment", /--license-alignment must be non-empty/],
  ["--registry-secret-absence", /--registry-secret-absence must be non-empty/],
  ["--remote-ci", /--remote-ci must be non-empty/],
  ["--second-operator", /--second-operator must be non-empty/]
] as const;

for (const [blankFlag, expectedError] of dependencyAuditBlankLabelCases) {
  test(`dependency audit readiness packet CLI rejects blank ${blankFlag}`, async () => {
    const args = [
      "dependency:final-audit-readiness-packet",
      "--environment",
      "release-demo",
      "--audit-scope",
      "release-candidate-demo",
      "--package-manager",
      "npm-demo",
      "--production-audit",
      "production-dependency-audit-demo",
      "--lockfile-proof",
      "lockfile-reproducibility-demo",
      "--installed-tree",
      "installed-tree-demo",
      "--runtime-inventory",
      "runtime-inventory-demo",
      "--dev-dependency-exclusion",
      "dev-dependency-exclusion-demo",
      "--override-review",
      "override-review-demo",
      "--license-alignment",
      "license-alignment-demo",
      "--registry-secret-absence",
      "registry-secret-absence-demo",
      "--remote-ci",
      "remote-ci-dependency-audit-demo",
      "--second-operator",
      "second-operator-dependency-review-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--json"
    ];
    const flagIndex = args.indexOf(blankFlag);
    assert.notEqual(flagIndex, -1);
    args[flagIndex + 1] = " ";

    const io = createCliIO();
    const exitCode = await runCli(args, io);

    assert.equal(exitCode, 1);
    assert.match(io.stderrMessages.join("\n"), expectedError);
  });
}

test("clean history readiness packet CLI emits review evidence without git mutation", async () => {
const io = createCliIO();
const exitCode = await runCli(cleanHistoryReadinessPacketArgs(), io);

assert.equal(exitCode, 0);
const output = JSON.parse(io.stdoutMessages[0] ?? "{}");
assert.equal(output.operation, "clean public history readiness review");
assert.equal(output.environment, "release-demo");
assert.equal(output.historyScope, "public-initial-history-demo");
assert.equal(output.sourceRoot, "scheduleos-local-tree-demo");
assert.equal(output.noGitDirectory, "no-git-directory-proof-demo");
assert.equal(output.releaseSafetyScan, "release-safety-scan-demo");
assert.equal(output.firstCommitStagingManifest, "first-commit-staging-manifest-demo");
assert.equal(output.generatedArtifactReview, "generated-artifact-review-demo");
assert.equal(output.fixtureSanitization, "fixture-sanitization-demo");
assert.equal(output.licenseNoticeReadiness, "license-notice-readiness-demo");
assert.equal(output.repositoryNaming, "repository-naming-demo");
assert.equal(output.remoteCiPlan, "remote-ci-plan-demo");
assert.equal(output.secondOperator, "second-operator-clean-history-review-demo");
assert.equal(output.cleanHistoryPrepared, false);
assert.equal(output.gitInitializationAllowedByPacket, false);
assert.equal(output.remoteMutationAllowedByPacket, false);
assert.equal(output.pushMutationAllowedByPacket, false);
assert.equal(output.tagMutationAllowedByPacket, false);
assert.equal(output.requiresNoGitDirectoryProof, true);
assert.equal(output.requiresReleaseSafetyProof, true);
assert.equal(output.requiresFirstCommitStagingProof, true);
assert.deepEqual(output.evidenceRequired.slice(0, 3), [
"no .git directory proof",
"release safety scan proof",
"first commit staging manifest proof"
]);
assert.equal(JSON.stringify(output).includes("ghp_demo_token"), false);
assert.equal(JSON.stringify(output).includes("private_history_snippet_demo"), false);
  assert.equal(JSON.stringify(output).includes(["/", "Users/"].join("")), false);
});

test("clean history readiness packet CLI rejects blank history scope", async () => {
const io = createCliIO();
const exitCode = await runCli(cleanHistoryReadinessPacketArgs("--history-scope"), io);

assert.equal(exitCode, 1);
assert.match(io.stderrMessages.join("\n"), /--history-scope must be non-empty/);
});

const cleanHistoryBlankLabelCases: Array<[string, RegExp]> = [
["--no-git-directory", /--no-git-directory must be non-empty/],
["--release-safety-scan", /--release-safety-scan must be non-empty/],
["--first-commit-staging-manifest", /--first-commit-staging-manifest must be non-empty/],
["--generated-artifact-review", /--generated-artifact-review must be non-empty/],
["--fixture-sanitization", /--fixture-sanitization must be non-empty/],
["--license-notice-readiness", /--license-notice-readiness must be non-empty/],
["--repository-naming", /--repository-naming must be non-empty/],
["--remote-ci-plan", /--remote-ci-plan must be non-empty/],
["--second-operator", /--second-operator must be non-empty/]
];

for (const [blankFlag, expectedError] of cleanHistoryBlankLabelCases) {
test(`clean history readiness packet CLI rejects blank ${blankFlag}`, async () => {
const io = createCliIO();
const exitCode = await runCli(cleanHistoryReadinessPacketArgs(blankFlag), io);
assert.equal(exitCode, 1);
assert.match(io.stderrMessages.join("\n"), expectedError);
});
}

function cleanHistoryReadinessPacketArgs(blankFlag?: string): string[] {
const args = [
"repository:clean-history-readiness-packet",
"--environment",
"release-demo",
"--history-scope",
"public-initial-history-demo",
"--source-root",
"scheduleos-local-tree-demo",
"--no-git-directory",
"no-git-directory-proof-demo",
"--release-safety-scan",
"release-safety-scan-demo",
"--first-commit-staging-manifest",
"first-commit-staging-manifest-demo",
"--generated-artifact-review",
"generated-artifact-review-demo",
"--fixture-sanitization",
"fixture-sanitization-demo",
"--license-notice-readiness",
"license-notice-readiness-demo",
"--repository-naming",
"repository-naming-demo",
"--remote-ci-plan",
"remote-ci-plan-demo",
"--second-operator",
"second-operator-clean-history-review-demo",
"--tenant-id",
"tenant_demo",
"--workspace-id",
"workspace_demo",
"--user-id",
"user_jordan",
"--as-of",
"2026-07-23T12:00:00.000Z",
"--json"
];
if (blankFlag !== undefined) {
const index = args.indexOf(blankFlag);
assert.notEqual(index, -1);
args[index + 1] = " ";
}
return args;
}

test("generated artifact review packet CLI emits review evidence without artifact mutation", async () => {
const io = createCliIO();
const exitCode = await runCli(
[
"release:generated-artifact-review-packet",
"--environment",
"release-demo",
"--artifact-scope",
"release-candidate-generated-artifacts-demo",
"--manifest",
"first-commit-staging-manifest-demo",
"--tenant-id",
"tenant_demo",
"--workspace-id",
"workspace_demo",
"--user-id",
"user_jordan",
"--as-of",
"2026-07-23T12:00:00.000Z",
"--json"
],
io
);

assert.equal(exitCode, 0);
const output = JSON.parse(io.stdoutMessages[0] ?? "{}");
assert.equal(output.operation, "generated artifact review");
assert.equal(output.environment, "release-demo");
assert.equal(output.artifactScope, "release-candidate-generated-artifacts-demo");
assert.equal(output.manifest, "first-commit-staging-manifest-demo");
assert.equal(output.generatedArtifactsApproved, false);
assert.equal(output.artifactRewriteAllowedByPacket, false);
assert.equal(output.artifactDeletionAllowedByPacket, false);
assert.equal(output.repositoryMutationAllowedByPacket, false);
assert.equal(output.releaseGateMutationAllowedByPacket, false);
assert.equal(output.publicationAllowedByPacket, false);
assert.equal(output.requiresDistReviewProof, true);
assert.equal(output.requiresFixtureReviewProof, true);
assert.equal(output.requiresExportBackupReviewProof, true);
assert.deepEqual(output.evidenceRequired.slice(0, 3), [
"generated artifact manifest proof",
"dist build output review proof",
"fixture template and sample output sanitization proof"
]);
assert.deepEqual(output.localEvidenceCommands, [
"npm run check",
"npm run release:safety",
"npm run license:check",
"find . -maxdepth 2 -name .git -type d -print"
]);
assert.equal(JSON.stringify(output).includes("personal_email_demo"), false);
assert.equal(JSON.stringify(output).includes("private_calendar_title_demo"), false);
assert.equal(JSON.stringify(output).includes(["/", "Users/"].join("")), false);
});

test("generated artifact review packet CLI rejects blank artifact scope", async () => {
const io = createCliIO();
const exitCode = await runCli(
[
"release:generated-artifact-review-packet",
"--environment",
"release-demo",
"--artifact-scope",
" ",
"--manifest",
"first-commit-staging-manifest-demo",
"--tenant-id",
"tenant_demo",
"--workspace-id",
"workspace_demo",
"--user-id",
"user_jordan",
"--as-of",
"2026-07-23T12:00:00.000Z",
"--json"
],
io
);

assert.equal(exitCode, 1);
assert.match(io.stderrMessages.join("\n"), /--artifact-scope must be non-empty/);
});

test("security policy contact readiness packet CLI emits review evidence without contact mutation", async () => {
const io = createCliIO();
const exitCode = await runCli(
[
"security:policy-contact-readiness-packet",
"--environment",
"release-demo",
"--contact-channel",
"security-contact-form-demo",
"--responsible-party",
"maintainer-security-reviewer-demo",
"--disclosure-workflow",
"vulnerability-disclosure-workflow-demo",
"--advisory-settings",
"repository-advisory-settings-demo",
"--response-sla",
"security-response-sla-demo",
"--escalation-path",
"security-escalation-path-demo",
"--private-report-sanitization",
"private-report-sanitization-demo",
"--remote-ci-security-workflow",
"remote-ci-security-workflow-demo",
"--second-operator",
"second-operator-security-contact-demo",
"--tenant-id",
"tenant_demo",
"--workspace-id",
"workspace_demo",
"--user-id",
"user_jordan",
"--as-of",
"2026-07-23T12:00:00.000Z",
"--json"
],
io
);

assert.equal(exitCode, 0);
const output = JSON.parse(io.stdoutMessages[0] ?? "{}");
assert.equal(output.operation, "security policy contact readiness review");
assert.equal(output.environment, "release-demo");
assert.equal(output.contactChannel, "security-contact-form-demo");
assert.equal(output.responsibleParty, "maintainer-security-reviewer-demo");
assert.equal(output.disclosureWorkflow, "vulnerability-disclosure-workflow-demo");
assert.equal(output.advisorySettings, "repository-advisory-settings-demo");
assert.equal(output.responseSla, "security-response-sla-demo");
assert.equal(output.escalationPath, "security-escalation-path-demo");
assert.equal(output.privateReportSanitization, "private-report-sanitization-demo");
assert.equal(output.remoteCiSecurityWorkflow, "remote-ci-security-workflow-demo");
assert.equal(output.secondOperator, "second-operator-security-contact-demo");
assert.equal(output.securityContactConfigured, false);
assert.equal(output.securityPolicyMutationAllowedByPacket, false);
assert.equal(output.repositorySettingsMutationAllowedByPacket, false);
assert.equal(output.publicRepositoryMutationAllowedByPacket, false);
assert.equal(output.requiresSecurityPolicyProof, true);
assert.equal(output.requiresResponsiblePartyProof, true);
assert.equal(output.requiresDisclosureWorkflowProof, true);
assert.match(output.labelReviewSteps.join("\n"), /vulnerability-disclosure-workflow-demo/);
assert.match(output.labelReviewSteps.join("\n"), /remote-ci-security-workflow-demo/);
assert.deepEqual(output.evidenceRequired.slice(0, 3), [
"SECURITY.md contact-channel proof",
"responsible maintainer proof",
"vulnerability disclosure workflow proof"
]);
assert.equal(JSON.stringify(output).includes("security@example.com"), false);
assert.equal(JSON.stringify(output).includes("ghp_demo_token"), false);
assert.equal(JSON.stringify(output).includes("private_reporter_name_demo"), false);
});

test("security policy contact readiness packet CLI rejects blank contact channel", async () => {
const io = createCliIO();
const exitCode = await runCli(
[
"security:policy-contact-readiness-packet",
"--environment",
"release-demo",
"--contact-channel",
" ",
"--responsible-party",
"maintainer-security-reviewer-demo",
"--disclosure-workflow",
"vulnerability-disclosure-workflow-demo",
"--advisory-settings",
"repository-advisory-settings-demo",
"--response-sla",
"security-response-sla-demo",
"--escalation-path",
"security-escalation-path-demo",
"--private-report-sanitization",
"private-report-sanitization-demo",
"--remote-ci-security-workflow",
"remote-ci-security-workflow-demo",
"--second-operator",
"second-operator-security-contact-demo",
"--tenant-id",
"tenant_demo",
"--workspace-id",
"workspace_demo",
"--user-id",
"user_jordan",
"--as-of",
"2026-07-23T12:00:00.000Z",
"--json"
],
io
);

assert.equal(exitCode, 1);
assert.match(io.stderrMessages.join("\n"), /--contact-channel must be non-empty/);
});

const securityContactBlankLabelCases = [
  ["--disclosure-workflow", /--disclosure-workflow must be non-empty/],
  ["--advisory-settings", /--advisory-settings must be non-empty/],
  ["--response-sla", /--response-sla must be non-empty/],
  ["--escalation-path", /--escalation-path must be non-empty/],
  ["--private-report-sanitization", /--private-report-sanitization must be non-empty/],
  ["--remote-ci-security-workflow", /--remote-ci-security-workflow must be non-empty/],
  ["--second-operator", /--second-operator must be non-empty/]
] as const;

for (const [blankFlag, expectedError] of securityContactBlankLabelCases) {
  test(`security policy contact readiness packet CLI rejects blank ${blankFlag}`, async () => {
    const args = [
      "security:policy-contact-readiness-packet",
      "--environment",
      "release-demo",
      "--contact-channel",
      "security-contact-form-demo",
      "--responsible-party",
      "maintainer-security-reviewer-demo",
      "--disclosure-workflow",
      "vulnerability-disclosure-workflow-demo",
      "--advisory-settings",
      "repository-advisory-settings-demo",
      "--response-sla",
      "security-response-sla-demo",
      "--escalation-path",
      "security-escalation-path-demo",
      "--private-report-sanitization",
      "private-report-sanitization-demo",
      "--remote-ci-security-workflow",
      "remote-ci-security-workflow-demo",
      "--second-operator",
      "second-operator-security-contact-demo",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--json"
    ];
    const flagIndex = args.indexOf(blankFlag);
    assert.notEqual(flagIndex, -1);
    args[flagIndex + 1] = " ";

    const io = createCliIO();
    const exitCode = await runCli(args, io);

    assert.equal(exitCode, 1);
    assert.match(io.stderrMessages.join("\n"), expectedError);
  });
}

test("public event delivery operator packet CLI emits bounded worker evidence", async () => {
const io = createCliIO();
const exitCode = await runCli(
    [
      "public-events:delivery-operator-packet",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--type",
      "calendar.event_imported",
      "--source-system",
      "connectos",
      "--max-subscriptions",
      "2",
      "--max-events",
      "5",
      "--json"
    ],
    io
  );

  assert.equal(exitCode, 0);
  const output = JSON.parse(io.stdoutMessages[0] ?? "{}");
  assert.equal(output.operation, "public-event subscription delivery worker invocation");
  assert.equal(output.scope.tenantId, "tenant_demo");
  assert.equal(output.asOf, "2026-07-23T12:00:00.000Z");
  assert.equal(output.request.dryRun, true);
  assert.equal(output.request.type, "calendar.event_imported");
  assert.equal(output.request.sourceSystem, "connectos");
  assert.equal(output.request.maxSubscriptions, 2);
  assert.equal(output.request.maxEvents, 5);
  assert.equal(output.applyAllowedByPacket, false);
  assert.equal(output.managedSecretProviderRequired, true);
  assert.equal(output.durableWorkerRequiredForProduction, true);
  assert.deepEqual(output.workerCommand.slice(0, 2), ["npm", "run"]);
  assert.ok(
    output.reviewSteps.some((step: string) => step.includes("dry-run"))
  );
  assert.ok(
    output.reviewSteps.some((step: string) => step.includes("managed secret"))
  );
  assert.equal(JSON.stringify(output).includes("http://"), false);
  assert.equal(JSON.stringify(output).includes("secret"), true);
});

test("public event dead-letter queue packet CLI emits sanitized review evidence", async () => {
  const io = createCliIO();

  const exitCode = await runCli(
    [
      "public-events:dead-letter-queue-packet",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--max-attempts",
      "2",
      "--type",
      "calendar.event_imported",
      "--status",
      "UNREVIEWED",
      "--json"
    ],
    io
  );

  assert.equal(exitCode, 0);
  const output = JSON.parse(io.stdoutMessages[0] ?? "{}");
  assert.equal(output.operation, "public-event dead-letter queue review");
  assert.equal(output.scope.tenantId, "tenant_demo");
  assert.equal(output.asOf, "2026-07-23T12:00:00.000Z");
  assert.equal(output.request.maxAttempts, 2);
  assert.equal(output.request.type, "calendar.event_imported");
  assert.equal(output.request.status, "UNREVIEWED");
  assert.equal(output.applyAllowedByPacket, false);
  assert.equal(output.replayAllowedByPacket, false);
  assert.equal(output.deleteAllowedByPacket, false);
  assert.equal(output.durableDeadLetterQueueRequiredForProduction, true);
  assert.deepEqual(output.queueCommand.slice(0, 2), ["npm", "run"]);
  assert.ok(
    output.reviewSteps.some((step: string) =>
      step.includes("raw target URLs")
    )
  );
  const serialized = JSON.stringify(output);
  assert.equal(serialized.includes("targetUrl"), false);
  assert.equal(serialized.includes("signingSecret"), false);
});

test("public event delivery operator packet CLI rejects unsafe bounds", async () => {
  const invalidDateIo = createCliIO();
  const invalidDate = await runCli(
    [
      "public-events:delivery-operator-packet",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "not-a-date"
    ],
    invalidDateIo
  );
  assert.equal(invalidDate, 1);
  assert.ok(
    invalidDateIo.stderrMessages.join("\n").includes("--as-of must be an ISO date/time")
  );

  const zeroLimitIo = createCliIO();
  const zeroLimit = await runCli(
    [
      "public-events:delivery-operator-packet",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T12:00:00.000Z",
      "--max-events",
      "0"
    ],
    zeroLimitIo
  );
  assert.equal(zeroLimit, 1);
  assert.ok(
    zeroLimitIo.stderrMessages
      .join("\n")
      .includes("--max-events must be a positive integer")
  );
});

test("public event delivery incident drill packet CLI emits privacy-safe rehearsal evidence", async () => {
  const io = createCliIO();
  const exitCode = await runCli(
    [
      "public-events:delivery-incident-drill-packet",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T14:00:00.000Z",
      "--incident-id",
      "incident_delivery_20260723_001",
      "--failure-class",
      "signature",
      "--type",
      "calendar.event_imported",
      "--source-system",
      "connectos",
      "--max-subscriptions",
      "2",
      "--max-events",
      "5",
      "--json"
    ],
    io
  );

  assert.equal(exitCode, 0);
  const output = JSON.parse(io.stdoutMessages[0] ?? "{}");
  assert.equal(output.operation, "public-event delivery incident drill");
  assert.equal(output.incidentId, "incident_delivery_20260723_001");
  assert.equal(output.suspectedFailureClass, "signature");
  assert.equal(output.scope.tenantId, "tenant_demo");
  assert.equal(output.asOf, "2026-07-23T14:00:00.000Z");
  assert.equal(output.pauseWorkersFirst, true);
  assert.equal(output.applyAllowedByPacket, false);
  assert.equal(output.replayAllowedByPacket, false);
  assert.equal(output.liveDeliveryAllowedByPacket, false);
  assert.deepEqual(output.boundedDryRunCommand.slice(0, 2), ["npm", "run"]);
  assert.ok(
    output.boundedDryRunCommand.includes("public-events:delivery-operator-packet")
  );
  assert.ok(
    output.evidenceToCollect.some((item: string) =>
      item.includes("target URL hashes")
    )
  );
  assert.ok(
    output.privacyBoundaries.some((item: string) =>
      item.includes("Do not copy raw target URLs")
    )
  );
  assert.equal(JSON.stringify(output).includes("http://"), false);
  assert.equal(JSON.stringify(output).includes("https://"), false);
  assert.equal(JSON.stringify(output).includes("super-secret"), false);
});

test("public event delivery incident drill packet CLI rejects unsafe inputs", async () => {
  const invalidDateIo = createCliIO();
  const invalidDate = await runCli(
    [
      "public-events:delivery-incident-drill-packet",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "not-a-date",
      "--incident-id",
      "incident_delivery_20260723_001",
      "--failure-class",
      "signature"
    ],
    invalidDateIo
  );
  assert.equal(invalidDate, 1);
  assert.ok(
    invalidDateIo.stderrMessages.join("\n").includes("--as-of must be an ISO date/time")
  );

  const invalidFailureClassIo = createCliIO();
  const invalidFailureClass = await runCli(
    [
      "public-events:delivery-incident-drill-packet",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T14:00:00.000Z",
      "--incident-id",
      "incident_delivery_20260723_001",
      "--failure-class",
      "surprise"
    ],
    invalidFailureClassIo
  );
  assert.equal(invalidFailureClass, 1);
  assert.ok(
    invalidFailureClassIo.stderrMessages
      .join("\n")
      .includes("--failure-class must be one of")
  );

  const zeroLimitIo = createCliIO();
  const zeroLimit = await runCli(
    [
      "public-events:delivery-incident-drill-packet",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-23T14:00:00.000Z",
      "--incident-id",
      "incident_delivery_20260723_001",
      "--failure-class",
      "receiver",
      "--max-subscriptions",
      "0"
    ],
    zeroLimitIo
  );
  assert.equal(zeroLimit, 1);
  assert.ok(
    zeroLimitIo.stderrMessages
      .join("\n")
      .includes("--max-subscriptions must be a positive integer")
  );
});

test("retention operator packet CLI rejects invalid hosted cleanup inputs", async () => {
  const invalidDateIo = createCliIO();
  const invalidDate = await runCli([
    "retention:operator-packet",
    "--backend",
    "postgres",
    "--tenant-id",
    "tenant_demo",
    "--workspace-id",
    "workspace_demo",
    "--user-id",
    "user_jordan",
    "--as-of",
    "not-a-date"
  ], invalidDateIo);

  assert.equal(invalidDate, 1);
assert.ok(invalidDateIo.stderrMessages.join("\n").includes("--as-of must be an ISO date/time"));

  const missingDatabaseIo = createCliIO();
  const missingDatabase = await runCli([
    "retention:operator-packet",
    "--backend",
    "sqlite",
    "--tenant-id",
    "tenant_demo",
    "--workspace-id",
    "workspace_demo",
    "--user-id",
    "user_jordan",
    "--as-of",
    "2026-07-22T12:00:00.000Z"
  ], missingDatabaseIo);

  assert.equal(missingDatabase, 1);
  assert.match(missingDatabaseIo.stderrMessages.join("\n"), /--database required for sqlite retention packets/);
});

test("retention policy CLI rejects invalid as-of date", async () => {
  const io = createCliIO();
  const exitCode = await runCli(["retention:policy", "--as-of", "not-a-date"], io);

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /--as-of must be an ISO date\/time/);
});

test("SQLite retention cleanup CLI defaults to dry-run", async () => {
  const io = createCliIO();
  const calls: Array<{ dryRun?: boolean; asOf: string }> = [];
  const exitCode = await runCli(
    [
      "retention:sqlite-cleanup",
      "--database",
      "data/scheduleos.db",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-22T12:00:00.000Z",
      "--json"
    ],
    io,
    {
      sqliteRetentionCleanup: (_databasePath, _actor, scope, asOf, options) => {
        calls.push({
          ...(options?.dryRun === undefined ? {} : { dryRun: options.dryRun }),
          asOf: asOf.toISOString()
        });
        return {
          evaluatedAt: asOf.toISOString(),
          scope,
          dryRun: options?.dryRun ?? true,
          eligible: { IDEMPOTENCY_RECORD: 1 },
          deleted: {},
          reviewDue: { AUDIT_EVENT: 1 }
        };
      }
    }
  );

  assert.equal(exitCode, 0);
  assert.deepEqual(calls, [{ dryRun: true, asOf: "2026-07-22T12:00:00.000Z" }]);
  assert.equal(JSON.parse(io.stdoutMessages[0] ?? "{}").dryRun, true);
});

test("SQLite retention cleanup CLI requires exact apply confirmation", async () => {
  const io = createCliIO();
  let applied = false;
  const rejected = await runCli(
    [
      "retention:sqlite-cleanup",
      "--database",
      "data/scheduleos.db",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-22T12:00:00.000Z",
      "--apply",
      "--confirm",
      "tenant_demo/workspace_demo/user_jordan/wrong"
    ],
    io,
    {
      sqliteRetentionCleanup: () => {
        applied = true;
        throw new Error("should not apply");
      }
    }
  );

  assert.equal(rejected, 1);
  assert.equal(applied, false);
  assert.match(io.stderrMessages.join("\n"), /Refusing retention cleanup apply/);

  const approvedIo = createCliIO();
  const approved = await runCli(
    [
      "retention:sqlite-cleanup",
      "--database",
      "data/scheduleos.db",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-22T12:00:00.000Z",
      "--apply",
      "--confirm",
      "tenant_demo/workspace_demo/user_jordan/2026-07-22T12:00:00.000Z",
      "--json"
    ],
    approvedIo,
    {
      sqliteRetentionCleanup: (_databasePath, _actor, scope, asOf, options) => ({
        evaluatedAt: asOf.toISOString(),
        scope,
        dryRun: options?.dryRun ?? true,
        eligible: { IDEMPOTENCY_RECORD: 1 },
        deleted: { IDEMPOTENCY_RECORD: 1 },
        reviewDue: {}
      })
    }
  );

  assert.equal(approved, 0);
  assert.equal(JSON.parse(approvedIo.stdoutMessages[0] ?? "{}").dryRun, false);
  assert.equal(JSON.parse(approvedIo.stdoutMessages[0] ?? "{}").deleted.IDEMPOTENCY_RECORD, 1);
});

test("PostgreSQL retention cleanup CLI requires configured client", async () => {
  const io = createCliIO();
  const exitCode = await runCli([
    "retention:postgres-cleanup",
    "--tenant-id",
    "tenant_demo",
    "--workspace-id",
    "workspace_demo",
    "--user-id",
    "user_jordan",
    "--as-of",
    "2026-07-22T12:00:00.000Z"
  ], io, { createPostgresClient: () => undefined });

  assert.equal(exitCode, 1);
  assert.match(io.stderrMessages.join("\n"), /SCHEDULEOS_POSTGRES_URL is required/);
});

test("PostgreSQL retention cleanup CLI defaults to dry-run", async () => {
  const io = createCliIO();
  const client = new FakePostgresClient();
  const calls: Array<{ dryRun?: boolean; asOf: string }> = [];
  const exitCode = await runCli(
    [
      "retention:postgres-cleanup",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-22T12:00:00.000Z",
      "--json"
    ],
    io,
    {
      client,
      postgresRetentionCleanup: async (_client, _actor, scope, asOf, options) => {
        calls.push({
          ...(options?.dryRun === undefined ? {} : { dryRun: options.dryRun }),
          asOf: asOf.toISOString()
        });
        return {
          evaluatedAt: asOf.toISOString(),
          scope,
          dryRun: options?.dryRun ?? true,
          eligible: { IDEMPOTENCY_RECORD: 1 },
          deleted: {},
          reviewDue: { AUDIT_EVENT: 1 }
        };
      }
    }
  );

  assert.equal(exitCode, 0);
  assert.deepEqual(calls, [{ dryRun: true, asOf: "2026-07-22T12:00:00.000Z" }]);
  assert.equal(JSON.parse(io.stdoutMessages[0] ?? "{}").dryRun, true);
});

test("PostgreSQL retention cleanup CLI requires exact apply confirmation", async () => {
  const io = createCliIO();
  let applied = false;
  const rejected = await runCli(
    [
      "retention:postgres-cleanup",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-22T12:00:00.000Z",
      "--apply",
      "--confirm",
      "tenant_demo/workspace_demo/user_jordan/wrong"
    ],
    io,
    {
      client: new FakePostgresClient(),
      postgresRetentionCleanup: async () => {
        applied = true;
        throw new Error("should not apply");
      }
    }
  );

  assert.equal(rejected, 1);
  assert.equal(applied, false);
  assert.match(io.stderrMessages.join("\n"), /Refusing retention cleanup apply/);

  const approvedIo = createCliIO();
  const approved = await runCli(
    [
      "retention:postgres-cleanup",
      "--tenant-id",
      "tenant_demo",
      "--workspace-id",
      "workspace_demo",
      "--user-id",
      "user_jordan",
      "--as-of",
      "2026-07-22T12:00:00.000Z",
      "--apply",
      "--confirm",
      "tenant_demo/workspace_demo/user_jordan/2026-07-22T12:00:00.000Z",
      "--json"
    ],
    approvedIo,
    {
      client: new FakePostgresClient(),
      postgresRetentionCleanup: async (_client, _actor, scope, asOf, options) => ({
        evaluatedAt: asOf.toISOString(),
        scope,
        dryRun: options?.dryRun ?? true,
        eligible: { IDEMPOTENCY_RECORD: 1 },
        deleted: { IDEMPOTENCY_RECORD: 1 },
        reviewDue: {}
      })
    }
  );

  assert.equal(approved, 0);
  assert.equal(JSON.parse(approvedIo.stdoutMessages[0] ?? "{}").dryRun, false);
  assert.equal(JSON.parse(approvedIo.stdoutMessages[0] ?? "{}").deleted.IDEMPOTENCY_RECORD, 1);
});

function createCliIO(): CliIO & {
  stdoutMessages: string[];
  stderrMessages: string[];
} {
  const stdoutMessages: string[] = [];
  const stderrMessages: string[] = [];

  return {
    stdoutMessages,
    stderrMessages,
    stdout(message) {
      stdoutMessages.push(message);
    },
    stderr(message) {
      stderrMessages.push(message);
    }
  };
}

class FakePostgresClient implements PostgresQueryClient {
  readonly statements: string[] = [];
  readonly insertedVersions: number[] = [];

  constructor(private readonly existingVersions: readonly number[] = []) {}

  async query(
    sql: string,
    params: readonly unknown[] = []
  ): Promise<PostgresQueryResult> {
    const normalizedSql = sql.trim();
    this.statements.push(normalizedSql);

    if (normalizedSql.startsWith("SELECT version FROM schema_migrations")) {
      return {
        rows: this.existingVersions.map((version) => ({ version }))
      };
    }

    if (
      normalizedSql !== POSTGRES_SCHEMA_MIGRATIONS_DDL.trim() &&
      normalizedSql.startsWith("INSERT INTO schema_migrations")
    ) {
      const version = params[0];

      if (typeof version !== "number") {
        throw new Error("expected migration version parameter");
      }

      this.insertedVersions.push(version);
    }

    return { rows: [], rowCount: 0 };
  }
}

class CloseableFakePostgresClient
  extends FakePostgresClient
  implements CloseablePostgresQueryClient
{
  closed = false;

  async end(): Promise<void> {
    this.closed = true;
  }
}
