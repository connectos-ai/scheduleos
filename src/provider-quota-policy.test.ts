import test from "node:test";
import assert from "node:assert/strict";
import {
  type ProviderQuotaPolicy,
  validateProviderQuotaPolicy
} from "./provider-quota-policy.js";

const completeQuotaPolicy = (): ProviderQuotaPolicy => ({
  providerId: "demo_calendar_provider",
  distributedStoreRequired: true,
  scopeKeys: {
    tenantId: true,
    workspaceId: true,
    userId: true,
    providerId: true,
    operation: true
  },
  limits: [
    { operation: "IMPORT", maxRequests: 500, windowMs: 900000, maxBurstRequests: 100, retryAfterRequired: true },
    { operation: "EXPORT", maxRequests: 300, windowMs: 900000, maxBurstRequests: 60, retryAfterRequired: true },
    { operation: "SYNC", maxRequests: 120, windowMs: 300000, maxBurstRequests: 30, retryAfterRequired: true },
    { operation: "WEBHOOK", maxRequests: 600, windowMs: 300000, maxBurstRequests: 120, retryAfterRequired: true },
    { operation: "WRITE_BACK", maxRequests: 60, windowMs: 300000, maxBurstRequests: 10, retryAfterRequired: true }
  ],
  enforcement: {
    readOnlySyncSeparatelyLimited: true,
    writeBackSeparatelyLimited: true,
    webhookSeparatelyLimited: true,
    importSeparatelyLimited: true,
    idempotencyAware: true,
    exponentialBackoff: true,
    providerRetryAfterHonored: true
  },
  alerts: [
    "QUOTA_EXHAUSTION",
    "DENIED_REQUEST_SPIKE",
    "RETRY_AFTER_SPIKE",
    "SYNC_LOOP",
    "WRITE_BACK_CONFLICT_SPIKE",
    "CROSS_SCOPE_ATTEMPT",
    "PROVIDER_ERROR_SPIKE"
  ],
  privacy: {
    hashedQuotaKeys: true,
    excludesRawTokens: true,
    excludesRawProviderAccountIds: true,
    excludesPrivateTitles: true,
    excludesRawPayloads: true
  }
});

test("provider quota policy accepts complete distributed quota evidence", () => {
  const result = validateProviderQuotaPolicy(completeQuotaPolicy());

  assert.deepEqual(result, { ok: true, findings: [] });
});

test("provider quota policy rejects local-only or under-scoped quota keys", () => {
  const policy = completeQuotaPolicy();
  policy.distributedStoreRequired = false;
  policy.scopeKeys.workspaceId = false;
  policy.scopeKeys.operation = false;

  const result = validateProviderQuotaPolicy(policy);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /distributed store/);
  assert.match(result.findings.join("\n"), /workspaceId/);
  assert.match(result.findings.join("\n"), /operation/);
});

test("provider quota policy rejects missing operation limits and unsafe burst limits", () => {
  const policy = completeQuotaPolicy();
  policy.limits = [
    { operation: "IMPORT", maxRequests: 0, windowMs: 900000, maxBurstRequests: 1, retryAfterRequired: true },
    { operation: "SYNC", maxRequests: 10, windowMs: 300000, maxBurstRequests: 20, retryAfterRequired: false }
  ];

  const result = validateProviderQuotaPolicy(policy);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /EXPORT limit/);
  assert.match(result.findings.join("\n"), /WEBHOOK limit/);
  assert.match(result.findings.join("\n"), /WRITE_BACK limit/);
  assert.match(result.findings.join("\n"), /IMPORT quota limits must be positive/);
  assert.match(result.findings.join("\n"), /SYNC burst limit/);
  assert.match(result.findings.join("\n"), /SYNC quota denial must include retry-after/);
});

test("provider quota policy rejects merged enforcement lanes", () => {
  const policy = completeQuotaPolicy();
  policy.enforcement.readOnlySyncSeparatelyLimited = false;
  policy.enforcement.writeBackSeparatelyLimited = false;
  policy.enforcement.webhookSeparatelyLimited = false;
  policy.enforcement.importSeparatelyLimited = false;
  policy.enforcement.idempotencyAware = false;
  policy.enforcement.exponentialBackoff = false;
  policy.enforcement.providerRetryAfterHonored = false;

  const result = validateProviderQuotaPolicy(policy);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /read-only sync quota/);
  assert.match(result.findings.join("\n"), /write-back quota/);
  assert.match(result.findings.join("\n"), /webhook quota/);
  assert.match(result.findings.join("\n"), /import quota/);
  assert.match(result.findings.join("\n"), /idempotency-aware/);
  assert.match(result.findings.join("\n"), /exponential backoff/);
  assert.match(result.findings.join("\n"), /retry-after guidance/);
});

test("provider quota policy rejects missing hosted alerts and unsafe evidence", () => {
  const policy = completeQuotaPolicy();
  policy.alerts = ["QUOTA_EXHAUSTION"];
  policy.privacy.hashedQuotaKeys = false;
  policy.privacy.excludesRawTokens = false;
  policy.privacy.excludesRawProviderAccountIds = false;
  policy.privacy.excludesPrivateTitles = false;
  policy.privacy.excludesRawPayloads = false;

  const result = validateProviderQuotaPolicy(policy);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /DENIED_REQUEST_SPIKE/);
  assert.match(result.findings.join("\n"), /SYNC_LOOP/);
  assert.match(result.findings.join("\n"), /hashed/);
  assert.match(result.findings.join("\n"), /raw tokens/);
  assert.match(result.findings.join("\n"), /raw provider account IDs/);
  assert.match(result.findings.join("\n"), /private titles/);
  assert.match(result.findings.join("\n"), /raw payloads/);
});
