import test from "node:test";
import assert from "node:assert/strict";
import { runCli, type CliIO } from "./cli.js";

test("SQLite backup CLI reads encryption passphrase from env var", async () => {
  const io = createCliIO();
  const previous = process.env.SCHEDULEOS_BACKUP_KEY;
  process.env.SCHEDULEOS_BACKUP_KEY = "correct horse battery staple";
  const calls: Array<{ encryptionPassphrase?: string }> = [];

  try {
    const exitCode = await runCli(
      [
        "sqlite:backup",
        "--database",
        "data/scheduleos.db",
        "--backup",
        "backups/scheduleos.enc.json",
        "--encrypt-key-env",
        "SCHEDULEOS_BACKUP_KEY",
        "--json"
      ],
      io,
      {
        sqliteBackup: async (_databasePath, _backupPath, options) => {
          calls.push(
            options?.encryptionPassphrase === undefined
              ? {}
              : { encryptionPassphrase: options.encryptionPassphrase }
          );
          return {
            backupPath: "backups/scheduleos.enc.json",
            bytes: 42,
            encrypted: { algorithm: "aes-256-gcm", kdf: "scrypt" }
          };
        }
      }
    );

    assert.equal(exitCode, 0);
    assert.deepEqual(calls, [{ encryptionPassphrase: "correct horse battery staple" }]);
    assert.equal(JSON.parse(io.stdoutMessages[0] ?? "{}").encrypted.algorithm, "aes-256-gcm");
  } finally {
    restoreEnv("SCHEDULEOS_BACKUP_KEY", previous);
  }
});

test("SQLite restore CLI requires configured decrypt env var", async () => {
  const io = createCliIO();
  const previous = process.env.SCHEDULEOS_BACKUP_KEY;
  delete process.env.SCHEDULEOS_BACKUP_KEY;

  try {
    const exitCode = await runCli(
      [
        "sqlite:restore",
        "--backup",
        "backups/scheduleos.enc.json",
        "--restore",
        "restore/scheduleos.db",
        "--tenant-id",
        "tenant_demo",
        "--workspace-id",
        "workspace_demo",
        "--user-id",
        "user_jordan",
        "--decrypt-key-env",
        "SCHEDULEOS_BACKUP_KEY"
      ],
      io
    );

    assert.equal(exitCode, 1);
    assert.match(
      io.stderrMessages.join("\n"),
      /--decrypt-key-env environment variable is not set/
    );
  } finally {
    restoreEnv("SCHEDULEOS_BACKUP_KEY", previous);
  }
});

const createCliIO = (): CliIO & { stdoutMessages: string[]; stderrMessages: string[] } => {
  const stdoutMessages: string[] = [];
  const stderrMessages: string[] = [];
  return {
    stdoutMessages,
    stderrMessages,
    stdout: (message: string) => stdoutMessages.push(message),
    stderr: (message: string) => stderrMessages.push(message)
  };
};

const restoreEnv = (name: string, value: string | undefined): void => {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
};
