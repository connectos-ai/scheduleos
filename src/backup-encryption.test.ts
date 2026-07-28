import test from "node:test";
import assert from "node:assert/strict";
import { readFile, rm } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  backupSqliteDatabase,
  createSqliteRepositories,
  restoreSqliteDatabase
} from "./sqlite.js";

const jordan = {
  kind: "user" as const,
  tenantId: "tenant_demo",
  workspaceId: "workspace_demo",
  userId: "user_jordan"
};

test("SQLite backup encrypts and restores with passphrase", async () => {
  const directory = await mkdtemp(join(tmpdir(), "scheduleos-sqlite-encryption-"));
  const databasePath = join(directory, "scheduleos.db");
  const backupPath = join(directory, "backup", "scheduleos-backup.enc.json");
  const restorePath = join(directory, "restore", "scheduleos-restored.db");
  const passphrase = "correct horse battery staple";

  try {
    const sqlite = createSqliteRepositories(databasePath);
    sqlite.repositories.tasks.upsert(jordan, {
      tenantId: jordan.tenantId,
      workspaceId: jordan.workspaceId,
      userId: jordan.userId,
      ownerId: jordan.userId,
      id: "task_encrypted_backup",
      title: "Private encrypted backup task",
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
    sqlite.close();

    const result = await backupSqliteDatabase(databasePath, backupPath, {
      encryptionPassphrase: passphrase
    });

    assert.equal(result.backupPath, backupPath);
    assert.equal(result.encrypted?.algorithm, "aes-256-gcm");
    assert.equal(result.encrypted?.kdf, "scrypt");
    assert.equal(
      (await readFile(backupPath, "utf8")).includes("Private encrypted backup task"),
      false
    );

    const restoreResult = await restoreSqliteDatabase(backupPath, restorePath, jordan, {
      encryptionPassphrase: passphrase
    });

    assert.equal(restoreResult.decrypted, true);
    assert.equal(restoreResult.smoke.tasks, 1);

    const restored = createSqliteRepositories(restorePath);
    assert.deepEqual(
      restored.repositories.tasks.list(jordan, jordan).map((task) => task.id),
      ["task_encrypted_backup"]
    );
    restored.close();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("SQLite encrypted restore rejects wrong passphrase", async () => {
  const directory = await mkdtemp(join(tmpdir(), "scheduleos-sqlite-encryption-"));
  const databasePath = join(directory, "scheduleos.db");
  const backupPath = join(directory, "backup", "scheduleos-backup.enc.json");
  const restorePath = join(directory, "restore", "scheduleos-restored.db");

  try {
    const sqlite = createSqliteRepositories(databasePath);
    sqlite.repositories.tasks.upsert(jordan, {
      tenantId: jordan.tenantId,
      workspaceId: jordan.workspaceId,
      userId: jordan.userId,
      ownerId: jordan.userId,
      id: "task_wrong_key",
      title: "Wrong key task",
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
    sqlite.close();

    await backupSqliteDatabase(databasePath, backupPath, {
      encryptionPassphrase: "correct horse battery staple"
    });

    await assert.rejects(
      () =>
        restoreSqliteDatabase(backupPath, restorePath, jordan, {
          encryptionPassphrase: "wrong horse battery staple"
        }),
      /Unsupported state|unable to authenticate data/
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
