export type ProviderAdapterClass = "CALENDAR" | "TASK_SOURCE" | "WEBHOOK_SOURCE";

export type ProviderAlertClass =
  | "TOKEN_FAILURE"
  | "WEBHOOK_SIGNATURE_FAILURE"
  | "REPLAY_ATTEMPT"
  | "PROVIDER_QUOTA_EXHAUSTION"
  | "WRITE_BACK_CONFLICT"
  | "REVOCATION_FAILURE"
  | "SYNC_DRIFT"
  | "MANAGED_SECRET_RESOLVER_FAILURE";

export interface ProviderScopeRequirement {
  name: string;
  reason: string;
  access: "READ" | "WRITE" | "WEBHOOK";
  optional: boolean;
}

export interface ProviderAdapterContract {
  providerId: string;
  providerClass: ProviderAdapterClass;
  publicContractOnly: boolean;
  noPrivateLeadershipOnlyApis: boolean;
  auth: {
    usesManagedSecretRefs: boolean;
    storesRawSecrets: boolean;
    requiredScopes: ProviderScopeRequirement[];
  };
  capabilities: {
    importSupported: boolean;
    exportSupported: boolean;
    syncCheckpointSupported: boolean;
    writeBackSupported: boolean;
    webhookSupported: boolean;
    revocationSupported: boolean;
  };
  lifecycle: {
    rotationDrill: boolean;
    emergencyRevocationDrill: boolean;
    syncCheckpointRecovery: boolean;
    quotaPolicy: boolean;
    retryPolicy: boolean;
    errorMapping: boolean;
    hostedAlerts: ProviderAlertClass[];
  };
  writeBackSafety: {
    conflictPreviewRequired: boolean;
    reviewAcknowledgementRequired: boolean;
    idempotencyKeyRequired: boolean;
    lockedBlockPreservationRequired: boolean;
    separatelyDisableable: boolean;
  };
  revocationSafety: {
    disablesSync: boolean;
    disablesWriteBack: boolean;
    rejectsNewCheckpoints: boolean;
    clearsUnsafeCursors: boolean;
    auditEventRequired: boolean;
  };
  privacy: {
    contentMinimizedEvidence: boolean;
    excludesRawProviderPayloads: boolean;
    excludesRawProviderIdentifiers: boolean;
    excludesPrivateTitles: boolean;
    excludesAttendeesLocationsDescriptions: boolean;
  };
}

export interface ProviderAdapterContractValidation {
  ok: boolean;
  findings: string[];
}

const REQUIRED_ALERT_CLASSES: ProviderAlertClass[] = [
  "TOKEN_FAILURE",
  "WEBHOOK_SIGNATURE_FAILURE",
  "REPLAY_ATTEMPT",
  "PROVIDER_QUOTA_EXHAUSTION",
  "WRITE_BACK_CONFLICT",
  "REVOCATION_FAILURE",
  "SYNC_DRIFT",
  "MANAGED_SECRET_RESOLVER_FAILURE"
];

export function validateProviderAdapterContract(
  contract: ProviderAdapterContract
): ProviderAdapterContractValidation {
  const findings: string[] = [];

  if (contract.providerId.trim().length === 0) {
    findings.push("providerId must be non-empty");
  }
  if (/\s/u.test(contract.providerId)) {
    findings.push("providerId must not contain spaces");
  }
  if (!contract.publicContractOnly) {
    findings.push("adapter must use public provider-neutral contracts");
  }
  if (!contract.noPrivateLeadershipOnlyApis) {
    findings.push("adapter must not require private leadership-only APIs");
  }
  if (!contract.auth.usesManagedSecretRefs) {
    findings.push("adapter credentials must use managed-secret references");
  }
  if (contract.auth.storesRawSecrets) {
    findings.push("adapter must not store raw secrets");
  }
  if (contract.auth.requiredScopes.length === 0) {
    findings.push("adapter must document provider scopes");
  }
  for (const scope of contract.auth.requiredScopes) {
    if (scope.name.trim().length === 0 || scope.reason.trim().length === 0) {
      findings.push("provider scopes must include name and reason");
    }
  }
  if (!contract.capabilities.importSupported && !contract.capabilities.exportSupported) {
    findings.push("adapter must support at least import or export capability");
  }
  if (!contract.capabilities.syncCheckpointSupported) {
    findings.push("adapter must support sync checkpoint handling");
  }
  if (!contract.capabilities.revocationSupported) {
    findings.push("adapter must support revocation handling");
  }

  validateLifecycle(contract, findings);
  validateWriteBackSafety(contract, findings);
  validateRevocationSafety(contract, findings);
  validatePrivacy(contract, findings);

  return { ok: findings.length === 0, findings };
}

function validateLifecycle(
  contract: ProviderAdapterContract,
  findings: string[]
): void {
  if (!contract.lifecycle.rotationDrill) {
    findings.push("adapter must document rotation drill evidence");
  }
  if (!contract.lifecycle.emergencyRevocationDrill) {
    findings.push("adapter must document emergency revocation drill evidence");
  }
  if (!contract.lifecycle.syncCheckpointRecovery) {
    findings.push("adapter must document sync checkpoint recovery");
  }
  if (!contract.lifecycle.quotaPolicy) {
    findings.push("adapter must document provider quota policy");
  }
  if (!contract.lifecycle.retryPolicy) {
    findings.push("adapter must document retry policy");
  }
  if (!contract.lifecycle.errorMapping) {
    findings.push("adapter must document provider error mapping");
  }
  for (const alertClass of REQUIRED_ALERT_CLASSES) {
    if (!contract.lifecycle.hostedAlerts.includes(alertClass)) {
      findings.push(`adapter must document hosted alert ${alertClass}`);
    }
  }
}

function validateWriteBackSafety(
  contract: ProviderAdapterContract,
  findings: string[]
): void {
  if (!contract.capabilities.writeBackSupported) return;
  if (!contract.writeBackSafety.conflictPreviewRequired) {
    findings.push("write-back adapters must require conflict preview");
  }
  if (!contract.writeBackSafety.reviewAcknowledgementRequired) {
    findings.push("write-back adapters must require review acknowledgement");
  }
  if (!contract.writeBackSafety.idempotencyKeyRequired) {
    findings.push("write-back adapters must require idempotency keys");
  }
  if (!contract.writeBackSafety.lockedBlockPreservationRequired) {
    findings.push("write-back adapters must preserve locked blocks");
  }
  if (!contract.writeBackSafety.separatelyDisableable) {
    findings.push("write-back must be disableable separately from read-only sync");
  }
}

function validateRevocationSafety(
  contract: ProviderAdapterContract,
  findings: string[]
): void {
  if (!contract.revocationSafety.disablesSync) {
    findings.push("revocation must disable sync");
  }
  if (!contract.revocationSafety.disablesWriteBack) {
    findings.push("revocation must disable write-back");
  }
  if (!contract.revocationSafety.rejectsNewCheckpoints) {
    findings.push("revocation must reject new sync checkpoints");
  }
  if (!contract.revocationSafety.clearsUnsafeCursors) {
    findings.push("revocation must clear or quarantine unsafe cursors");
  }
  if (!contract.revocationSafety.auditEventRequired) {
    findings.push("revocation must require an audit event");
  }
}

function validatePrivacy(
  contract: ProviderAdapterContract,
  findings: string[]
): void {
  if (!contract.privacy.contentMinimizedEvidence) {
    findings.push("provider evidence must be content-minimized");
  }
  if (!contract.privacy.excludesRawProviderPayloads) {
    findings.push("provider evidence must exclude raw provider payloads");
  }
  if (!contract.privacy.excludesRawProviderIdentifiers) {
    findings.push("provider evidence must exclude raw provider identifiers");
  }
  if (!contract.privacy.excludesPrivateTitles) {
    findings.push("provider evidence must exclude private titles");
  }
  if (!contract.privacy.excludesAttendeesLocationsDescriptions) {
    findings.push(
      "provider evidence must exclude attendees, locations, and descriptions"
    );
  }
}
