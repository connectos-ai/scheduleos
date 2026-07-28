import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";

const encryptedBackupFormat = "scheduleos-encrypted-backup-v1";
const algorithm = "aes-256-gcm";
const kdf = "scrypt";
const keyLengthBytes = 32;

export interface BackupEncryptionMetadata {
  format: typeof encryptedBackupFormat;
  algorithm: typeof algorithm;
  kdf: typeof kdf;
  salt: string;
  iv: string;
  authTag: string;
}

interface EncryptedBackupEnvelope extends BackupEncryptionMetadata {
  ciphertext: string;
}

export interface BackupEncryptionResult {
  path: string;
  bytes: number;
  encrypted: true;
  metadata: BackupEncryptionMetadata;
}

export const encryptBackupFile = async (
  sourcePath: string,
  encryptedPath: string,
  passphrase: string
): Promise<BackupEncryptionResult> => {
  const source = await readFile(sourcePath);
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = deriveKey(passphrase, salt);
  const cipher = createCipheriv(algorithm, key, iv);
  const ciphertext = Buffer.concat([cipher.update(source), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const envelope: EncryptedBackupEnvelope = {
    format: encryptedBackupFormat,
    algorithm,
    kdf,
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    ciphertext: ciphertext.toString("base64")
  };

  await writeFile(encryptedPath, `${JSON.stringify(envelope)}\n`);
  const encryptedStat = await stat(encryptedPath);

  return {
    path: encryptedPath,
    bytes: encryptedStat.size,
    encrypted: true,
    metadata: {
      format: envelope.format,
      algorithm: envelope.algorithm,
      kdf: envelope.kdf,
      salt: envelope.salt,
      iv: envelope.iv,
      authTag: envelope.authTag
    }
  };
};

export const decryptBackupFile = async (
  encryptedPath: string,
  outputPath: string,
  passphrase: string
): Promise<{ path: string; bytes: number }> => {
  const envelope = parseEnvelope(await readFile(encryptedPath, "utf8"));
  const key = deriveKey(passphrase, Buffer.from(envelope.salt, "base64"));
  const decipher = createDecipheriv(algorithm, key, Buffer.from(envelope.iv, "base64"));
  decipher.setAuthTag(Buffer.from(envelope.authTag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, "base64")),
    decipher.final()
  ]);

  await writeFile(outputPath, plaintext);
  const decryptedStat = await stat(outputPath);
  return { path: outputPath, bytes: decryptedStat.size };
};

const deriveKey = (passphrase: string, salt: Buffer): Buffer => {
  if (passphrase.trim().length < 16) {
    throw new Error("Backup encryption passphrase must be at least 16 characters.");
  }

  return scryptSync(passphrase, salt, keyLengthBytes);
};

const parseEnvelope = (content: string): EncryptedBackupEnvelope => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Encrypted backup is not valid ScheduleOS backup JSON.");
  }

  if (!isEncryptedBackupEnvelope(parsed)) {
    throw new Error("Encrypted backup metadata is invalid.");
  }

  return parsed;
};

const isEncryptedBackupEnvelope = (value: unknown): value is EncryptedBackupEnvelope => {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<Record<keyof EncryptedBackupEnvelope, unknown>>;
  return (
    candidate.format === encryptedBackupFormat &&
    candidate.algorithm === algorithm &&
    candidate.kdf === kdf &&
    typeof candidate.salt === "string" &&
    typeof candidate.iv === "string" &&
    typeof candidate.authTag === "string" &&
    typeof candidate.ciphertext === "string"
  );
};
