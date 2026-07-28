import test from "node:test";
import assert from "node:assert/strict";
import {
  type ProviderAdapterContract,
  validateProviderAdapterContract
} from "./provider-adapter-contract.js";

const completeCalendarAdapterContract = (): ProviderAdapterContract => ({
  providerId: "demo_calendar_provider",
  providerClass: "CALENDAR",
  publicContractOnly: true,
  noPrivateLeadershipOnlyApis: true,
  auth: {
    usesManagedSecretRefs: true,
    storesRawSecrets: false,
    requiredScopes: [
      {
        name: "calendar.read.events",
        reason: "Import fixed busy commitments for scheduling conflicts.",
        access: "READ",
        optional: false
      },
      {
        name: "calendar.write.events",
        reason: "Write accepted ScheduleOS blocks after explicit review.",
        access: "WRITE",
        optional: true
      }
    ]
  },
  capabilities: {
    importSupported: true,
    exportSupported: true,
    syncCheckpointSupported: true,
    writeBackSupported: true,
    webhookSupported: true,
    revocationSupported: true
  },
  lifecycle: {
    rotationDrill: true,
    emergencyRevocationDrill: true,
    syncCheckpointRecovery: true,
    quotaPolicy: true,
    retryPolicy: true,
    errorMapping: true,
    hostedAlerts: [
      "TOKEN_FAILURE",
      "WEBHOOK_SIGNATURE_FAILURE",
      "REPLAY_ATTEMPT",
      "PROVIDER_QUOTA_EXHAUSTION",
      "WRITE_BACK_CONFLICT",
      "REVOCATION_FAILURE",
      "SYNC_DRIFT",
      "MANAGED_SECRET_RESOLVER_FAILURE"
    ]
  },
  writeBackSafety: {
    conflictPreviewRequired: true,
    reviewAcknowledgementRequired: true,
    idempotencyKeyRequired: true,
    lockedBlockPreservationRequired: true,
    separatelyDisableable: true
  },
  revocationSafety: {
    disablesSync: true,
    disablesWriteBack: true,
    rejectsNewCheckpoints: true,
    clearsUnsafeCursors: true,
    auditEventRequired: true
  },
  privacy: {
    contentMinimizedEvidence: true,
    excludesRawProviderPayloads: true,
    excludesRawProviderIdentifiers: true,
    excludesPrivateTitles: true,
    excludesAttendeesLocationsDescriptions: true
  }
});

test("provider adapter contract accepts complete public provider-neutral lifecycle evidence", () => {
  const result = validateProviderAdapterContract(completeCalendarAdapterContract());

  assert.deepEqual(result, { ok: true, findings: [] });
});

test("provider adapter contract rejects raw secrets and private leadership-only coupling", () => {
  const contract = completeCalendarAdapterContract();
  contract.publicContractOnly = false;
  contract.noPrivateLeadershipOnlyApis = false;
  contract.auth.usesManagedSecretRefs = false;
  contract.auth.storesRawSecrets = true;

  const result = validateProviderAdapterContract(contract);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /public provider-neutral contracts/);
  assert.match(result.findings.join("\n"), /private leadership-only APIs/);
  assert.match(result.findings.join("\n"), /managed-secret references/);
  assert.match(result.findings.join("\n"), /must not store raw secrets/);
});

test("provider adapter contract rejects unsafe write-back adapter evidence", () => {
  const contract = completeCalendarAdapterContract();
  contract.writeBackSafety.conflictPreviewRequired = false;
  contract.writeBackSafety.reviewAcknowledgementRequired = false;
  contract.writeBackSafety.idempotencyKeyRequired = false;
  contract.writeBackSafety.lockedBlockPreservationRequired = false;
  contract.writeBackSafety.separatelyDisableable = false;

  const result = validateProviderAdapterContract(contract);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /conflict preview/);
  assert.match(result.findings.join("\n"), /review acknowledgement/);
  assert.match(result.findings.join("\n"), /idempotency keys/);
  assert.match(result.findings.join("\n"), /preserve locked blocks/);
  assert.match(result.findings.join("\n"), /disableable separately/);
});

test("provider adapter contract rejects missing lifecycle alerts and privacy minimization", () => {
  const contract = completeCalendarAdapterContract();
  contract.lifecycle.hostedAlerts = ["TOKEN_FAILURE"];
  contract.privacy.contentMinimizedEvidence = false;
  contract.privacy.excludesRawProviderPayloads = false;
  contract.privacy.excludesRawProviderIdentifiers = false;
  contract.privacy.excludesPrivateTitles = false;
  contract.privacy.excludesAttendeesLocationsDescriptions = false;

  const result = validateProviderAdapterContract(contract);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /WEBHOOK_SIGNATURE_FAILURE/);
  assert.match(result.findings.join("\n"), /PROVIDER_QUOTA_EXHAUSTION/);
  assert.match(result.findings.join("\n"), /content-minimized/);
  assert.match(result.findings.join("\n"), /raw provider payloads/);
  assert.match(result.findings.join("\n"), /raw provider identifiers/);
  assert.match(result.findings.join("\n"), /private titles/);
  assert.match(result.findings.join("\n"), /attendees, locations, and descriptions/);
});

test("provider adapter contract rejects revocation that leaves sync or checkpoints active", () => {
  const contract = completeCalendarAdapterContract();
  contract.revocationSafety.disablesSync = false;
  contract.revocationSafety.disablesWriteBack = false;
  contract.revocationSafety.rejectsNewCheckpoints = false;
  contract.revocationSafety.clearsUnsafeCursors = false;
  contract.revocationSafety.auditEventRequired = false;

  const result = validateProviderAdapterContract(contract);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /revocation must disable sync/);
  assert.match(result.findings.join("\n"), /disable write-back/);
  assert.match(result.findings.join("\n"), /reject new sync checkpoints/);
  assert.match(result.findings.join("\n"), /clear or quarantine unsafe cursors/);
  assert.match(result.findings.join("\n"), /audit event/);
});
