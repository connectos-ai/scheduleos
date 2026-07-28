import test from "node:test";
import assert from "node:assert/strict";
import {
  type HostedPublicEventDeliveryContract,
  validateHostedPublicEventDeliveryContract
} from "./hosted-public-event-delivery-contract.js";

const completeContract = (): HostedPublicEventDeliveryContract => ({
  environment: "production_demo",
  managedSecrets: {
    providerSelected: true,
    usesSecretRefsOnly: true,
    rejectsRawSecretStorage: true,
    tenantWorkspacePurposeScoped: true,
    rotationDrill: true,
    emergencyRevocationDrill: true
  },
  runtime: {
    runtimeIdentitySelected: true,
    leastPrivilegePermissions: true,
    workerTopologyDocumented: true,
    horizontalScalingSafe: true,
    idempotentDelivery: true,
    replayProtection: true,
    receiverRateLimitHeaderPolicy: true
  },
  queues: {
    durableRetryQueue: true,
    durableDeadLetterQueue: true,
    retryBackoffPolicy: true,
    maxAttemptPolicy: true,
    pauseResumeControls: true,
    backlogDrainProcedure: true
  },
  observability: {
    signals: [
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
    ],
    alerts: [
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
    ],
    hostedDashboard: true,
    deliveryHealthView: true,
    retryQueueView: true,
    deadLetterQueueView: true,
    managedSecretHealthView: true,
    incidentExport: true
  },
  incidentResponse: {
    networkFailureDrill: true,
    receiverFailureDrill: true,
    signatureMismatchDrill: true,
    managedSecretOutageDrill: true,
    queueBacklogDrill: true,
    privacyAnomalyDrill: true,
    rollbackPlan: true,
    secondOperatorReview: true
  },
  privacy: {
    excludesRawTargetUrls: true,
    excludesSigningSecrets: true,
    excludesRawSecretRefs: true,
    excludesPrivateEventBodies: true,
    excludesRawPayloads: true,
    hashedSubscriptionKeys: true
  }
});

test("hosted public-event delivery accepts complete production evidence shape", () => {
  const result = validateHostedPublicEventDeliveryContract(completeContract());

  assert.deepEqual(result, { ok: true, findings: [] });
});

test("hosted public-event delivery rejects unsafe managed secret custody", () => {
  const contract = completeContract();
  contract.environment = "";
  contract.managedSecrets.providerSelected = false;
  contract.managedSecrets.usesSecretRefsOnly = false;
  contract.managedSecrets.rejectsRawSecretStorage = false;
  contract.managedSecrets.tenantWorkspacePurposeScoped = false;
  contract.managedSecrets.rotationDrill = false;
  contract.managedSecrets.emergencyRevocationDrill = false;

  const result = validateHostedPublicEventDeliveryContract(contract);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /environment/);
  assert.match(result.findings.join("\n"), /provider must be selected/);
  assert.match(result.findings.join("\n"), /secret refs only/);
  assert.match(result.findings.join("\n"), /raw secret storage/);
  assert.match(result.findings.join("\n"), /tenant\/workspace\/purpose/);
  assert.match(result.findings.join("\n"), /rotation drill/);
  assert.match(result.findings.join("\n"), /emergency revocation drill/);
});

test("hosted public-event delivery rejects non-durable worker runtime", () => {
  const contract = completeContract();
  contract.runtime.runtimeIdentitySelected = false;
  contract.runtime.leastPrivilegePermissions = false;
  contract.runtime.workerTopologyDocumented = false;
  contract.runtime.horizontalScalingSafe = false;
  contract.runtime.idempotentDelivery = false;
  contract.runtime.replayProtection = false;
  contract.runtime.receiverRateLimitHeaderPolicy = false;
  contract.queues.durableRetryQueue = false;
  contract.queues.durableDeadLetterQueue = false;
  contract.queues.backlogDrainProcedure = false;

  const result = validateHostedPublicEventDeliveryContract(contract);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /runtime identity/);
  assert.match(result.findings.join("\n"), /least privilege/);
  assert.match(result.findings.join("\n"), /worker topology/);
  assert.match(result.findings.join("\n"), /horizontally scaling safe/);
  assert.match(result.findings.join("\n"), /idempotent/);
  assert.match(result.findings.join("\n"), /replay protection/);
  assert.match(result.findings.join("\n"), /receiver rate-limit/);
  assert.match(result.findings.join("\n"), /durable retry queue/);
  assert.match(result.findings.join("\n"), /durable dead-letter queue/);
  assert.match(result.findings.join("\n"), /backlog drain/);
});

test("hosted public-event delivery rejects missing observability alerts", () => {
  const contract = completeContract();
  contract.observability.signals = ["DELIVERY_ATTEMPT_RECORDED"];
  contract.observability.alerts = ["FAILED_ATTEMPT_SPIKE"];
  contract.observability.hostedDashboard = false;
  contract.observability.deadLetterQueueView = false;
  contract.observability.managedSecretHealthView = false;

  const result = validateHostedPublicEventDeliveryContract(contract);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /signal RETRY_DUE/);
  assert.match(result.findings.join("\n"), /signal MANAGED_SECRET_SCOPE_REJECTED/);
  assert.match(result.findings.join("\n"), /alert DEAD_LETTER_BACKLOG/);
  assert.match(result.findings.join("\n"), /alert MANAGED_SECRET_PROVIDER_FAILURE/);
  assert.match(result.findings.join("\n"), /dashboard/);
  assert.match(result.findings.join("\n"), /dead-letter queue view/);
  assert.match(result.findings.join("\n"), /managed secret health view/);
});

test("hosted public-event delivery rejects missing drills and unsafe evidence", () => {
  const contract = completeContract();
  contract.incidentResponse.networkFailureDrill = false;
  contract.incidentResponse.signatureMismatchDrill = false;
  contract.incidentResponse.managedSecretOutageDrill = false;
  contract.incidentResponse.secondOperatorReview = false;
  contract.privacy.excludesRawTargetUrls = false;
  contract.privacy.excludesSigningSecrets = false;
  contract.privacy.excludesRawSecretRefs = false;
  contract.privacy.excludesPrivateEventBodies = false;
  contract.privacy.hashedSubscriptionKeys = false;

  const result = validateHostedPublicEventDeliveryContract(contract);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /network failure/);
  assert.match(result.findings.join("\n"), /signature mismatch/);
  assert.match(result.findings.join("\n"), /managed secret outage/);
  assert.match(result.findings.join("\n"), /second operator/);
  assert.match(result.findings.join("\n"), /raw target URLs/);
  assert.match(result.findings.join("\n"), /signing secrets/);
  assert.match(result.findings.join("\n"), /raw secret refs/);
  assert.match(result.findings.join("\n"), /private event bodies/);
  assert.match(result.findings.join("\n"), /hash subscription keys/);
});
