export type ProviderQuotaOperation =
  | "IMPORT"
  | "EXPORT"
  | "SYNC"
  | "WEBHOOK"
  | "WRITE_BACK";

export type ProviderQuotaAlert =
  | "QUOTA_EXHAUSTION"
  | "DENIED_REQUEST_SPIKE"
  | "RETRY_AFTER_SPIKE"
  | "SYNC_LOOP"
  | "WRITE_BACK_CONFLICT_SPIKE"
  | "CROSS_SCOPE_ATTEMPT"
  | "PROVIDER_ERROR_SPIKE";

export interface ProviderQuotaLimit {
  operation: ProviderQuotaOperation;
  maxRequests: number;
  windowMs: number;
  maxBurstRequests: number;
  retryAfterRequired: boolean;
}

export interface ProviderQuotaPolicy {
  providerId: string;
  distributedStoreRequired: boolean;
  scopeKeys: {
    tenantId: boolean;
    workspaceId: boolean;
    userId: boolean;
    providerId: boolean;
    operation: boolean;
  };
  limits: ProviderQuotaLimit[];
  enforcement: {
    readOnlySyncSeparatelyLimited: boolean;
    writeBackSeparatelyLimited: boolean;
    webhookSeparatelyLimited: boolean;
    importSeparatelyLimited: boolean;
    idempotencyAware: boolean;
    exponentialBackoff: boolean;
    providerRetryAfterHonored: boolean;
  };
  alerts: ProviderQuotaAlert[];
  privacy: {
    hashedQuotaKeys: boolean;
    excludesRawTokens: boolean;
    excludesRawProviderAccountIds: boolean;
    excludesPrivateTitles: boolean;
    excludesRawPayloads: boolean;
  };
}

export interface ProviderQuotaPolicyValidation {
  ok: boolean;
  findings: string[];
}

const REQUIRED_OPERATIONS: ProviderQuotaOperation[] = [
  "IMPORT",
  "EXPORT",
  "SYNC",
  "WEBHOOK",
  "WRITE_BACK"
];

const REQUIRED_ALERTS: ProviderQuotaAlert[] = [
  "QUOTA_EXHAUSTION",
  "DENIED_REQUEST_SPIKE",
  "RETRY_AFTER_SPIKE",
  "SYNC_LOOP",
  "WRITE_BACK_CONFLICT_SPIKE",
  "CROSS_SCOPE_ATTEMPT",
  "PROVIDER_ERROR_SPIKE"
];

export function validateProviderQuotaPolicy(
  policy: ProviderQuotaPolicy
): ProviderQuotaPolicyValidation {
  const findings: string[] = [];

  if (policy.providerId.trim().length === 0) {
    findings.push("providerId must be non-empty");
  }
  if (/\s/u.test(policy.providerId)) {
    findings.push("providerId must not contain spaces");
  }
  if (!policy.distributedStoreRequired) {
    findings.push("provider quota policy must require a distributed store");
  }
  validateScopeKeys(policy, findings);
  validateLimits(policy, findings);
  validateEnforcement(policy, findings);
  validateAlerts(policy, findings);
  validatePrivacy(policy, findings);

  return { ok: findings.length === 0, findings };
}

function validateScopeKeys(policy: ProviderQuotaPolicy, findings: string[]): void {
  for (const key of [
    "tenantId",
    "workspaceId",
    "userId",
    "providerId",
    "operation"
  ] as const) {
    if (!policy.scopeKeys[key]) {
      findings.push(`provider quota keys must include ${key}`);
    }
  }
}

function validateLimits(policy: ProviderQuotaPolicy, findings: string[]): void {
  const operations = new Set(policy.limits.map((limit) => limit.operation));
  for (const operation of REQUIRED_OPERATIONS) {
    if (!operations.has(operation)) {
      findings.push(`provider quota policy must define ${operation} limit`);
    }
  }
  for (const limit of policy.limits) {
    if (limit.maxRequests <= 0 || limit.windowMs <= 0 || limit.maxBurstRequests <= 0) {
      findings.push(`${limit.operation} quota limits must be positive`);
    }
    if (limit.maxBurstRequests > limit.maxRequests) {
      findings.push(`${limit.operation} burst limit must not exceed window limit`);
    }
    if (!limit.retryAfterRequired) {
      findings.push(`${limit.operation} quota denial must include retry-after guidance`);
    }
  }
}

function validateEnforcement(
  policy: ProviderQuotaPolicy,
  findings: string[]
): void {
  if (!policy.enforcement.readOnlySyncSeparatelyLimited) {
    findings.push("read-only sync quota must be limited separately");
  }
  if (!policy.enforcement.writeBackSeparatelyLimited) {
    findings.push("write-back quota must be limited separately");
  }
  if (!policy.enforcement.webhookSeparatelyLimited) {
    findings.push("webhook quota must be limited separately");
  }
  if (!policy.enforcement.importSeparatelyLimited) {
    findings.push("import quota must be limited separately");
  }
  if (!policy.enforcement.idempotencyAware) {
    findings.push("provider quota enforcement must be idempotency-aware");
  }
  if (!policy.enforcement.exponentialBackoff) {
    findings.push("provider quota enforcement must use exponential backoff");
  }
  if (!policy.enforcement.providerRetryAfterHonored) {
    findings.push("provider retry-after guidance must be honored");
  }
}

function validateAlerts(policy: ProviderQuotaPolicy, findings: string[]): void {
  for (const alert of REQUIRED_ALERTS) {
    if (!policy.alerts.includes(alert)) {
      findings.push(`provider quota policy must alert on ${alert}`);
    }
  }
}

function validatePrivacy(policy: ProviderQuotaPolicy, findings: string[]): void {
  if (!policy.privacy.hashedQuotaKeys) {
    findings.push("provider quota keys must be hashed in evidence");
  }
  if (!policy.privacy.excludesRawTokens) {
    findings.push("provider quota evidence must exclude raw tokens");
  }
  if (!policy.privacy.excludesRawProviderAccountIds) {
    findings.push("provider quota evidence must exclude raw provider account IDs");
  }
  if (!policy.privacy.excludesPrivateTitles) {
    findings.push("provider quota evidence must exclude private titles");
  }
  if (!policy.privacy.excludesRawPayloads) {
    findings.push("provider quota evidence must exclude raw payloads");
  }
}
