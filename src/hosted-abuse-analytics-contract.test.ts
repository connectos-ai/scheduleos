import test from "node:test";
import assert from "node:assert/strict";
import {
  type HostedAbuseAnalyticsEvidence,
  validateHostedAbuseAnalyticsEvidence
} from "./hosted-abuse-analytics-contract.js";

const completeEvidence = (): HostedAbuseAnalyticsEvidence => ({
  environment: "production_demo",
  hostedOnly: true,
  distributedCorrelationRequired: true,
  scopeKeys: {
    tenantId: true,
    workspaceId: true,
    userId: true,
    sourceSystem: true,
    providerId: true,
    operation: true
  },
  signals: [
    "REQUEST_THROTTLE_SATURATION",
    "IMPORT_THROTTLE_DENIAL",
    "PROVIDER_QUOTA_EXHAUSTION",
    "PUBLIC_EVENT_DELIVERY_FAILURE",
    "PUBLIC_EVENT_SUBSCRIPTION_HEALTH",
    "PUBLIC_EVENT_DEAD_LETTER_BACKLOG",
    "WEBHOOK_SIGNATURE_FAILURE",
    "WEBHOOK_REPLAY_ATTEMPT",
    "CREDENTIAL_FAILURE_SPIKE",
    "PASSWORD_RESET_REQUEST_SPIKE",
    "CROSS_SCOPE_AUTHORIZATION_ATTEMPT",
    "OVERSIZED_REQUEST_REJECTION"
  ],
  metrics: [
    "REQUEST_COUNT",
    "DENIED_COUNT",
    "DENIED_ROW_COUNT",
    "SATURATED_WINDOW_COUNT",
    "RETRY_AFTER_MS",
    "FAILED_DELIVERY_COUNT",
    "REPLAY_ATTEMPT_COUNT",
    "INVALID_SIGNATURE_COUNT",
    "CREDENTIAL_FAILURE_COUNT",
    "RESET_REQUEST_COUNT",
    "CROSS_SCOPE_ATTEMPT_COUNT",
    "OVERSIZED_REQUEST_COUNT"
  ],
  alerts: [
    "REQUEST_SPIKE",
    "IMPORT_ABUSE_SPIKE",
    "PROVIDER_QUOTA_EXHAUSTION",
    "DELIVERY_FAILURE_SPIKE",
    "SUBSCRIPTION_HEALTH_DEGRADED",
    "DEAD_LETTER_BACKLOG",
    "WEBHOOK_REPLAY_SPIKE",
    "CREDENTIAL_ATTACK_PATTERN",
    "CROSS_SCOPE_ATTEMPT_SPIKE",
    "OVERSIZED_REQUEST_SPIKE"
  ],
  dashboards: {
    operatorOverview: true,
    tenantWorkspaceBreakdown: true,
    providerOperationBreakdown: true,
    retryAndBackoffView: true,
    incidentExport: true
  },
  routing: {
    alertDestinationConfigured: true,
    escalationPathDocumented: true,
    onCallReviewRequired: true,
    falsePositiveReviewRequired: true
  },
  privacy: {
    hashedActorKeys: true,
    excludesRawTokens: true,
    excludesSessionCookies: true,
    excludesClientIp: true,
    excludesPrivateTitles: true,
    excludesRawPayloads: true,
    excludesRawWebhookTargets: true,
    excludesProviderAccountIds: true
  },
  retention: {
    retentionDays: 90,
    exportRequiresApproval: true,
    deletionRequiresApproval: true
  }
});

test("hosted abuse analytics accepts complete privacy-minimized hosted evidence", () => {
  const result = validateHostedAbuseAnalyticsEvidence(completeEvidence());

  assert.equal(result.ok, true);
  assert.deepEqual(result.findings, []);
});

test("hosted abuse analytics rejects local-only or under-scoped evidence", () => {
  const evidence = completeEvidence();
  evidence.environment = "";
  evidence.hostedOnly = false;
  evidence.distributedCorrelationRequired = false;
  evidence.scopeKeys.workspaceId = false;
  evidence.scopeKeys.providerId = false;
  evidence.scopeKeys.operation = false;

  const result = validateHostedAbuseAnalyticsEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /environment/);
  assert.match(result.findings.join("\n"), /hosted-only/);
  assert.match(result.findings.join("\n"), /distributed event correlation/);
  assert.match(result.findings.join("\n"), /workspaceId/);
  assert.match(result.findings.join("\n"), /providerId/);
  assert.match(result.findings.join("\n"), /operation/);
});

test("hosted abuse analytics rejects missing signals metrics alerts", () => {
  const evidence = completeEvidence();
  evidence.signals = ["REQUEST_THROTTLE_SATURATION"];
  evidence.metrics = ["REQUEST_COUNT"];
  evidence.alerts = ["REQUEST_SPIKE"];

  const result = validateHostedAbuseAnalyticsEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /signal IMPORT_THROTTLE_DENIAL/);
  assert.match(result.findings.join("\n"), /signal WEBHOOK_REPLAY_ATTEMPT/);
  assert.match(result.findings.join("\n"), /metric DENIED_ROW_COUNT/);
  assert.match(result.findings.join("\n"), /metric CROSS_SCOPE_ATTEMPT_COUNT/);
  assert.match(result.findings.join("\n"), /alert PROVIDER_QUOTA_EXHAUSTION/);
  assert.match(result.findings.join("\n"), /alert CREDENTIAL_ATTACK_PATTERN/);
});

test("hosted abuse analytics rejects missing dashboards routing review", () => {
  const evidence = completeEvidence();
  evidence.dashboards.providerOperationBreakdown = false;
  evidence.dashboards.retryAndBackoffView = false;
  evidence.routing.alertDestinationConfigured = false;
  evidence.routing.escalationPathDocumented = false;
  evidence.routing.falsePositiveReviewRequired = false;

  const result = validateHostedAbuseAnalyticsEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /provider\/operation breakdown/);
  assert.match(result.findings.join("\n"), /retry\/backoff view/);
  assert.match(result.findings.join("\n"), /alert destination/);
  assert.match(result.findings.join("\n"), /escalation path/);
  assert.match(result.findings.join("\n"), /false-positive review/);
});

test("hosted abuse analytics rejects unsafe evidence retention", () => {
  const evidence = completeEvidence();
  evidence.privacy.hashedActorKeys = false;
  evidence.privacy.excludesRawTokens = false;
  evidence.privacy.excludesClientIp = false;
  evidence.privacy.excludesRawWebhookTargets = false;
  evidence.retention.retentionDays = 401;
  evidence.retention.exportRequiresApproval = false;
  evidence.retention.deletionRequiresApproval = false;

  const result = validateHostedAbuseAnalyticsEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /actor keys/);
  assert.match(result.findings.join("\n"), /raw tokens/);
  assert.match(result.findings.join("\n"), /raw client IPs/);
  assert.match(result.findings.join("\n"), /raw webhook targets/);
  assert.match(result.findings.join("\n"), /retention days/);
  assert.match(result.findings.join("\n"), /exports must require approval/);
  assert.match(result.findings.join("\n"), /deletion must require approval/);
});
