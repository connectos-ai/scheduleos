export type HostedDeliveryWorkerSignal =
  | "DELIVERY_ATTEMPT_RECORDED"
  | "RETRY_DUE"
  | "RETRY_EXHAUSTED"
  | "DEAD_LETTER_CREATED"
  | "DEAD_LETTER_REVIEWED"
  | "SUBSCRIPTION_PAUSED"
  | "SUBSCRIPTION_EXHAUSTED"
  | "NEVER_DELIVERED_SUBSCRIPTION"
  | "MANAGED_SECRET_RESOLVED"
  | "MANAGED_SECRET_UNAVAILABLE"
  | "MANAGED_SECRET_SCOPE_REJECTED"
  | "SIGNATURE_ROTATION_REQUIRED"
  | "REPLAY_DETECTED"
  | "RECEIVER_RATE_LIMITED";

export type HostedDeliveryAlert =
  | "FAILED_ATTEMPT_SPIKE"
  | "RETRYABLE_FAILURE_SPIKE"
  | "EXHAUSTED_SUBSCRIPTION"
  | "NEVER_DELIVERED_SUBSCRIPTION"
  | "DEAD_LETTER_BACKLOG"
  | "MANAGED_SECRET_PROVIDER_FAILURE"
  | "MANAGED_SECRET_SCOPE_REJECTION"
  | "REPLAY_ANOMALY"
  | "RECEIVER_RATE_LIMIT_SPIKE"
  | "QUEUE_BACKLOG";

export interface HostedPublicEventDeliveryContract {
  environment: string;
  managedSecrets: {
    providerSelected: boolean;
    usesSecretRefsOnly: boolean;
    rejectsRawSecretStorage: boolean;
    tenantWorkspacePurposeScoped: boolean;
    rotationDrill: boolean;
    emergencyRevocationDrill: boolean;
  };
  runtime: {
    runtimeIdentitySelected: boolean;
    leastPrivilegePermissions: boolean;
    workerTopologyDocumented: boolean;
    horizontalScalingSafe: boolean;
    idempotentDelivery: boolean;
    replayProtection: boolean;
    receiverRateLimitHeaderPolicy: boolean;
  };
  queues: {
    durableRetryQueue: boolean;
    durableDeadLetterQueue: boolean;
    retryBackoffPolicy: boolean;
    maxAttemptPolicy: boolean;
    pauseResumeControls: boolean;
    backlogDrainProcedure: boolean;
  };
  observability: {
    signals: HostedDeliveryWorkerSignal[];
    alerts: HostedDeliveryAlert[];
    hostedDashboard: boolean;
    deliveryHealthView: boolean;
    retryQueueView: boolean;
    deadLetterQueueView: boolean;
    managedSecretHealthView: boolean;
    incidentExport: boolean;
  };
  incidentResponse: {
    networkFailureDrill: boolean;
    receiverFailureDrill: boolean;
    signatureMismatchDrill: boolean;
    managedSecretOutageDrill: boolean;
    queueBacklogDrill: boolean;
    privacyAnomalyDrill: boolean;
    rollbackPlan: boolean;
    secondOperatorReview: boolean;
  };
  privacy: {
    excludesRawTargetUrls: boolean;
    excludesSigningSecrets: boolean;
    excludesRawSecretRefs: boolean;
    excludesPrivateEventBodies: boolean;
    excludesRawPayloads: boolean;
    hashedSubscriptionKeys: boolean;
  };
}

export interface HostedPublicEventDeliveryValidation {
  ok: boolean;
  findings: string[];
}

const REQUIRED_SIGNALS: HostedDeliveryWorkerSignal[] = [
  "DELIVERY_ATTEMPT_RECORDED",
  "RETRY_DUE",
  "RETRY_EXHAUSTED",
  "DEAD_LETTER_CREATED",
  "DEAD_LETTER_REVIEWED",
  "SUBSCRIPTION_PAUSED",
  "SUBSCRIPTION_EXHAUSTED",
  "NEVER_DELIVERED_SUBSCRIPTION",
  "MANAGED_SECRET_RESOLVED",
  "MANAGED_SECRET_UNAVAILABLE",
  "MANAGED_SECRET_SCOPE_REJECTED",
  "SIGNATURE_ROTATION_REQUIRED",
  "REPLAY_DETECTED",
  "RECEIVER_RATE_LIMITED"
];

const REQUIRED_ALERTS: HostedDeliveryAlert[] = [
  "FAILED_ATTEMPT_SPIKE",
  "RETRYABLE_FAILURE_SPIKE",
  "EXHAUSTED_SUBSCRIPTION",
  "NEVER_DELIVERED_SUBSCRIPTION",
  "DEAD_LETTER_BACKLOG",
  "MANAGED_SECRET_PROVIDER_FAILURE",
  "MANAGED_SECRET_SCOPE_REJECTION",
  "REPLAY_ANOMALY",
  "RECEIVER_RATE_LIMIT_SPIKE",
  "QUEUE_BACKLOG"
];

export function validateHostedPublicEventDeliveryContract(
  contract: HostedPublicEventDeliveryContract
): HostedPublicEventDeliveryValidation {
  const findings: string[] = [];

  if (contract.environment.trim().length === 0) {
    findings.push("hosted public-event delivery environment must be named");
  }

  validateManagedSecrets(contract, findings);
  validateRuntime(contract, findings);
  validateQueues(contract, findings);
  validateObservability(contract, findings);
  validateIncidentResponse(contract, findings);
  validatePrivacy(contract, findings);

  return { ok: findings.length === 0, findings };
}

function validateManagedSecrets(
  contract: HostedPublicEventDeliveryContract,
  findings: string[]
): void {
  if (!contract.managedSecrets.providerSelected) {
    findings.push("managed secret provider must be selected");
  }
  if (!contract.managedSecrets.usesSecretRefsOnly) {
    findings.push("hosted delivery must use managed secret refs only");
  }
  if (!contract.managedSecrets.rejectsRawSecretStorage) {
    findings.push("hosted delivery must reject raw secret storage");
  }
  if (!contract.managedSecrets.tenantWorkspacePurposeScoped) {
    findings.push("managed secret refs must be tenant/workspace/purpose scoped");
  }
  if (!contract.managedSecrets.rotationDrill) {
    findings.push("managed secret rotation drill must be documented");
  }
  if (!contract.managedSecrets.emergencyRevocationDrill) {
    findings.push("managed secret emergency revocation drill must be documented");
  }
}

function validateRuntime(
  contract: HostedPublicEventDeliveryContract,
  findings: string[]
): void {
  if (!contract.runtime.runtimeIdentitySelected) {
    findings.push("hosted delivery runtime identity must be selected");
  }
  if (!contract.runtime.leastPrivilegePermissions) {
    findings.push("hosted delivery runtime must use least privilege permissions");
  }
  if (!contract.runtime.workerTopologyDocumented) {
    findings.push("hosted delivery worker topology must be documented");
  }
  if (!contract.runtime.horizontalScalingSafe) {
    findings.push("hosted delivery workers must be horizontally scaling safe");
  }
  if (!contract.runtime.idempotentDelivery) {
    findings.push("hosted delivery must be idempotent");
  }
  if (!contract.runtime.replayProtection) {
    findings.push("hosted delivery replay protection must be documented");
  }
  if (!contract.runtime.receiverRateLimitHeaderPolicy) {
    findings.push("receiver rate-limit header policy must be documented");
  }
}

function validateQueues(
  contract: HostedPublicEventDeliveryContract,
  findings: string[]
): void {
  if (!contract.queues.durableRetryQueue) {
    findings.push("hosted delivery must use a durable retry queue");
  }
  if (!contract.queues.durableDeadLetterQueue) {
    findings.push("hosted delivery must use a durable dead-letter queue");
  }
  if (!contract.queues.retryBackoffPolicy) {
    findings.push("hosted delivery retry backoff policy must be documented");
  }
  if (!contract.queues.maxAttemptPolicy) {
    findings.push("hosted delivery max-attempt policy must be documented");
  }
  if (!contract.queues.pauseResumeControls) {
    findings.push("hosted delivery pause/resume controls must be documented");
  }
  if (!contract.queues.backlogDrainProcedure) {
    findings.push("hosted delivery backlog drain procedure must be documented");
  }
}

function validateObservability(
  contract: HostedPublicEventDeliveryContract,
  findings: string[]
): void {
  for (const signal of REQUIRED_SIGNALS) {
    if (!contract.observability.signals.includes(signal)) {
      findings.push(`hosted delivery observability must include signal ${signal}`);
    }
  }
  for (const alert of REQUIRED_ALERTS) {
    if (!contract.observability.alerts.includes(alert)) {
      findings.push(`hosted delivery observability must include alert ${alert}`);
    }
  }
  if (!contract.observability.hostedDashboard) {
    findings.push("hosted delivery dashboard must be documented");
  }
  if (!contract.observability.deliveryHealthView) {
    findings.push("hosted delivery health view must be documented");
  }
  if (!contract.observability.retryQueueView) {
    findings.push("hosted delivery retry queue view must be documented");
  }
  if (!contract.observability.deadLetterQueueView) {
    findings.push("hosted delivery dead-letter queue view must be documented");
  }
  if (!contract.observability.managedSecretHealthView) {
    findings.push("managed secret health view must be documented");
  }
  if (!contract.observability.incidentExport) {
    findings.push("hosted delivery incident export must be documented");
  }
}

function validateIncidentResponse(
  contract: HostedPublicEventDeliveryContract,
  findings: string[]
): void {
  if (!contract.incidentResponse.networkFailureDrill) {
    findings.push("network failure incident drill must be documented");
  }
  if (!contract.incidentResponse.receiverFailureDrill) {
    findings.push("receiver failure incident drill must be documented");
  }
  if (!contract.incidentResponse.signatureMismatchDrill) {
    findings.push("signature mismatch incident drill must be documented");
  }
  if (!contract.incidentResponse.managedSecretOutageDrill) {
    findings.push("managed secret outage incident drill must be documented");
  }
  if (!contract.incidentResponse.queueBacklogDrill) {
    findings.push("queue backlog incident drill must be documented");
  }
  if (!contract.incidentResponse.privacyAnomalyDrill) {
    findings.push("privacy anomaly incident drill must be documented");
  }
  if (!contract.incidentResponse.rollbackPlan) {
    findings.push("hosted delivery rollback plan must be documented");
  }
  if (!contract.incidentResponse.secondOperatorReview) {
    findings.push("hosted delivery second operator review must be documented");
  }
}

function validatePrivacy(
  contract: HostedPublicEventDeliveryContract,
  findings: string[]
): void {
  if (!contract.privacy.excludesRawTargetUrls) {
    findings.push("hosted delivery evidence must exclude raw target URLs");
  }
  if (!contract.privacy.excludesSigningSecrets) {
    findings.push("hosted delivery evidence must exclude signing secrets");
  }
  if (!contract.privacy.excludesRawSecretRefs) {
    findings.push("hosted delivery evidence must exclude raw secret refs");
  }
  if (!contract.privacy.excludesPrivateEventBodies) {
    findings.push("hosted delivery evidence must exclude private event bodies");
  }
  if (!contract.privacy.excludesRawPayloads) {
    findings.push("hosted delivery evidence must exclude raw payloads");
  }
  if (!contract.privacy.hashedSubscriptionKeys) {
    findings.push("hosted delivery evidence must hash subscription keys");
  }
}
