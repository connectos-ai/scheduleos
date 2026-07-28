export type AbuseAnalyticsSignal =
  | "REQUEST_THROTTLE_SATURATION"
  | "IMPORT_THROTTLE_DENIAL"
  | "PROVIDER_QUOTA_EXHAUSTION"
  | "PUBLIC_EVENT_DELIVERY_FAILURE"
  | "PUBLIC_EVENT_SUBSCRIPTION_HEALTH"
  | "PUBLIC_EVENT_DEAD_LETTER_BACKLOG"
  | "WEBHOOK_SIGNATURE_FAILURE"
  | "WEBHOOK_REPLAY_ATTEMPT"
  | "CREDENTIAL_FAILURE_SPIKE"
  | "PASSWORD_RESET_REQUEST_SPIKE"
  | "CROSS_SCOPE_AUTHORIZATION_ATTEMPT"
  | "OVERSIZED_REQUEST_REJECTION";

export type AbuseAnalyticsMetric =
  | "REQUEST_COUNT"
  | "DENIED_COUNT"
  | "DENIED_ROW_COUNT"
  | "SATURATED_WINDOW_COUNT"
  | "RETRY_AFTER_MS"
  | "FAILED_DELIVERY_COUNT"
  | "REPLAY_ATTEMPT_COUNT"
  | "INVALID_SIGNATURE_COUNT"
  | "CREDENTIAL_FAILURE_COUNT"
  | "RESET_REQUEST_COUNT"
  | "CROSS_SCOPE_ATTEMPT_COUNT"
  | "OVERSIZED_REQUEST_COUNT";

export type AbuseAnalyticsAlert =
  | "REQUEST_SPIKE"
  | "IMPORT_ABUSE_SPIKE"
  | "PROVIDER_QUOTA_EXHAUSTION"
  | "DELIVERY_FAILURE_SPIKE"
  | "SUBSCRIPTION_HEALTH_DEGRADED"
  | "DEAD_LETTER_BACKLOG"
  | "WEBHOOK_REPLAY_SPIKE"
  | "CREDENTIAL_ATTACK_PATTERN"
  | "CROSS_SCOPE_ATTEMPT_SPIKE"
  | "OVERSIZED_REQUEST_SPIKE";

export interface HostedAbuseAnalyticsEvidence {
  environment: string;
  hostedOnly: boolean;
  distributedCorrelationRequired: boolean;
  scopeKeys: {
    tenantId: boolean;
    workspaceId: boolean;
    userId: boolean;
    sourceSystem: boolean;
    providerId: boolean;
    operation: boolean;
  };
  signals: AbuseAnalyticsSignal[];
  metrics: AbuseAnalyticsMetric[];
  alerts: AbuseAnalyticsAlert[];
  dashboards: {
    operatorOverview: boolean;
    tenantWorkspaceBreakdown: boolean;
    providerOperationBreakdown: boolean;
    retryAndBackoffView: boolean;
    incidentExport: boolean;
  };
  routing: {
    alertDestinationConfigured: boolean;
    escalationPathDocumented: boolean;
    onCallReviewRequired: boolean;
    falsePositiveReviewRequired: boolean;
  };
  privacy: {
    hashedActorKeys: boolean;
    excludesRawTokens: boolean;
    excludesSessionCookies: boolean;
    excludesClientIp: boolean;
    excludesPrivateTitles: boolean;
    excludesRawPayloads: boolean;
    excludesRawWebhookTargets: boolean;
    excludesProviderAccountIds: boolean;
  };
  retention: {
    retentionDays: number;
    exportRequiresApproval: boolean;
    deletionRequiresApproval: boolean;
  };
}

export interface HostedAbuseAnalyticsValidation {
  ok: boolean;
  findings: string[];
}

const REQUIRED_SIGNALS: AbuseAnalyticsSignal[] = [
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
];

const REQUIRED_METRICS: AbuseAnalyticsMetric[] = [
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
];

const REQUIRED_ALERTS: AbuseAnalyticsAlert[] = [
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
];

const MAX_RETENTION_DAYS = 400;

export function validateHostedAbuseAnalyticsEvidence(
  evidence: HostedAbuseAnalyticsEvidence
): HostedAbuseAnalyticsValidation {
  const findings: string[] = [];

  if (evidence.environment.trim().length === 0) {
    findings.push("hosted abuse analytics environment must be named");
  }
  if (!evidence.hostedOnly) {
    findings.push("hosted abuse analytics evidence must be hosted-only, not local-only");
  }
  if (!evidence.distributedCorrelationRequired) {
    findings.push("hosted abuse analytics must require distributed event correlation");
  }

  validateScopeKeys(evidence, findings);
  validateRequiredList("signal", REQUIRED_SIGNALS, evidence.signals, findings);
  validateRequiredList("metric", REQUIRED_METRICS, evidence.metrics, findings);
  validateRequiredList("alert", REQUIRED_ALERTS, evidence.alerts, findings);
  validateDashboards(evidence, findings);
  validateRouting(evidence, findings);
  validatePrivacy(evidence, findings);
  validateRetention(evidence, findings);

  return { ok: findings.length === 0, findings };
}

function validateScopeKeys(
  evidence: HostedAbuseAnalyticsEvidence,
  findings: string[]
): void {
  for (const [key, enabled] of Object.entries(evidence.scopeKeys)) {
    if (!enabled) {
      findings.push(`hosted abuse analytics scope must include ${key}`);
    }
  }
}

function validateRequiredList<T extends string>(
  label: string,
  required: T[],
  actual: T[],
  findings: string[]
): void {
  for (const item of required) {
    if (!actual.includes(item)) {
      findings.push(`hosted abuse analytics must include ${label} ${item}`);
    }
  }
}

function validateDashboards(
  evidence: HostedAbuseAnalyticsEvidence,
  findings: string[]
): void {
  if (!evidence.dashboards.operatorOverview) {
    findings.push("hosted abuse analytics must include operator overview dashboard");
  }
  if (!evidence.dashboards.tenantWorkspaceBreakdown) {
    findings.push("hosted abuse analytics must include tenant/workspace breakdown");
  }
  if (!evidence.dashboards.providerOperationBreakdown) {
    findings.push("hosted abuse analytics must include provider/operation breakdown");
  }
  if (!evidence.dashboards.retryAndBackoffView) {
    findings.push("hosted abuse analytics must include retry/backoff view");
  }
  if (!evidence.dashboards.incidentExport) {
    findings.push("hosted abuse analytics must include incident export");
  }
}

function validateRouting(
  evidence: HostedAbuseAnalyticsEvidence,
  findings: string[]
): void {
  if (!evidence.routing.alertDestinationConfigured) {
    findings.push("hosted abuse analytics alert destination must be configured");
  }
  if (!evidence.routing.escalationPathDocumented) {
    findings.push("hosted abuse analytics escalation path must be documented");
  }
  if (!evidence.routing.onCallReviewRequired) {
    findings.push("hosted abuse analytics must require on-call review");
  }
  if (!evidence.routing.falsePositiveReviewRequired) {
    findings.push("hosted abuse analytics must require false-positive review");
  }
}

function validatePrivacy(
  evidence: HostedAbuseAnalyticsEvidence,
  findings: string[]
): void {
  if (!evidence.privacy.hashedActorKeys) {
    findings.push("hosted abuse analytics actor keys must be hashed");
  }
  if (!evidence.privacy.excludesRawTokens) {
    findings.push("hosted abuse analytics evidence must exclude raw tokens");
  }
  if (!evidence.privacy.excludesSessionCookies) {
    findings.push("hosted abuse analytics evidence must exclude session cookies");
  }
  if (!evidence.privacy.excludesClientIp) {
    findings.push("hosted abuse analytics evidence must exclude raw client IPs");
  }
  if (!evidence.privacy.excludesPrivateTitles) {
    findings.push("hosted abuse analytics evidence must exclude private titles");
  }
  if (!evidence.privacy.excludesRawPayloads) {
    findings.push("hosted abuse analytics evidence must exclude raw payloads");
  }
  if (!evidence.privacy.excludesRawWebhookTargets) {
    findings.push("hosted abuse analytics evidence must exclude raw webhook targets");
  }
  if (!evidence.privacy.excludesProviderAccountIds) {
    findings.push("hosted abuse analytics evidence must exclude provider account IDs");
  }
}

function validateRetention(
  evidence: HostedAbuseAnalyticsEvidence,
  findings: string[]
): void {
  if (
    !Number.isInteger(evidence.retention.retentionDays) ||
    evidence.retention.retentionDays <= 0
  ) {
    findings.push("hosted abuse analytics retention days must be positive");
  }
  if (evidence.retention.retentionDays > MAX_RETENTION_DAYS) {
    findings.push(`hosted abuse analytics retention days must be <= ${MAX_RETENTION_DAYS}`);
  }
  if (!evidence.retention.exportRequiresApproval) {
    findings.push("hosted abuse analytics exports must require approval");
  }
  if (!evidence.retention.deletionRequiresApproval) {
    findings.push("hosted abuse analytics deletion must require approval");
  }
}
