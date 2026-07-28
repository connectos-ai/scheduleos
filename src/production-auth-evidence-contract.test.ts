import test from "node:test";
import assert from "node:assert/strict";
import {
  type ProductionAuthEvidence,
  validateProductionAuthEvidence
} from "./production-auth-evidence-contract.js";

const completeEvidence = (): ProductionAuthEvidence => ({
  environment: "production_demo",
  identity: {
    providerSelected: true,
    localCredentialFallbackReviewed: true,
    recoveryDeliveryReviewed: true,
    helpdeskPolicyReviewed: true
  },
  sessionStore: {
    durableStoreSelected: true,
    tokenHashesOnly: true,
    expirationEnforced: true,
    revocationEnforced: true,
    disabledUserDenied: true,
    inactiveMembershipDenied: true,
    lastSeenAudited: true
  },
  authorization: {
    matrixRoles: [
      "OWNER",
      "ADMIN",
      "EDITOR",
      "VIEWER",
      "DISABLED_USER",
      "INACTIVE_MEMBERSHIP",
      "CROSS_TENANT",
      "CROSS_WORKSPACE",
      "CROSS_USER"
    ],
    tenantScoped: true,
    workspaceScoped: true,
    userScoped: true,
    privateCalendarBoundary: true,
    ownerOnlyElevation: true,
    demotionReviewed: true,
    ownerTransferReviewed: true
  },
  resetTokens: {
    hashedTokensOnly: true,
    ttlEnforced: true,
    oneTimeUse: true,
    sameScopeConsumption: true,
    genericRequestResponse: true,
    sessionRevocationAfterReset: true,
    abuseThrottle: true
  },
  transport: {
    httpOnlyCookie: true,
    sameSiteCookie: true,
    secureCookieInProduction: true,
    csrfRequiredForCookieWrites: true,
    noBrowserTokenStorage: true,
    tlsProxyHeadersReviewed: true
  },
  lockoutRetention: {
    credentialBackoffDurable: true,
    resetRequestThrottleDurable: true,
    retentionCleanupReviewed: true,
    operatorVisibility: true
  },
  operations: {
    startupGuards: true,
    migrationPlan: true,
    rollbackDrill: true,
    remoteCiProof: true,
    browserFlows: [
      "LOGIN",
      "LOGOUT",
      "PASSWORD_RESET_REQUEST",
      "PASSWORD_RESET_CONFIRM",
      "OWNER_ADMIN_USER_MANAGEMENT",
      "MEMBERSHIP_MANAGEMENT",
      "CREDENTIAL_RESET",
      "ACCESSIBILITY",
      "RESPONSIVE"
    ],
    securityAuditPass: true,
    privacyAuditPass: true,
    licensingAuditPass: true,
    secondOperatorReview: true
  }
});

test("production auth evidence accepts complete production approval shape", () => {
  const result = validateProductionAuthEvidence(completeEvidence());

  assert.deepEqual(result, { ok: true, findings: [] });
});

test("production auth evidence rejects missing identity and session proof", () => {
  const evidence = completeEvidence();
  evidence.environment = "";
  evidence.identity.providerSelected = false;
  evidence.identity.recoveryDeliveryReviewed = false;
  evidence.sessionStore.durableStoreSelected = false;
  evidence.sessionStore.tokenHashesOnly = false;
  evidence.sessionStore.disabledUserDenied = false;
  evidence.sessionStore.inactiveMembershipDenied = false;

  const result = validateProductionAuthEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /environment/);
  assert.match(result.findings.join("\n"), /identity provider/);
  assert.match(result.findings.join("\n"), /recovery delivery/);
  assert.match(result.findings.join("\n"), /session store must be durable/);
  assert.match(result.findings.join("\n"), /token hashes only/);
  assert.match(result.findings.join("\n"), /disabled users/);
  assert.match(result.findings.join("\n"), /inactive memberships/);
});

test("production auth evidence rejects incomplete authorization matrix", () => {
  const evidence = completeEvidence();
  evidence.authorization.matrixRoles = ["OWNER", "ADMIN"];
  evidence.authorization.tenantScoped = false;
  evidence.authorization.workspaceScoped = false;
  evidence.authorization.privateCalendarBoundary = false;
  evidence.authorization.ownerOnlyElevation = false;
  evidence.authorization.ownerTransferReviewed = false;

  const result = validateProductionAuthEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /EDITOR/);
  assert.match(result.findings.join("\n"), /CROSS_TENANT/);
  assert.match(result.findings.join("\n"), /tenant scoped/);
  assert.match(result.findings.join("\n"), /workspace scoped/);
  assert.match(result.findings.join("\n"), /private calendar/);
  assert.match(result.findings.join("\n"), /owner-only role elevation/);
  assert.match(result.findings.join("\n"), /owner transfer/);
});

test("production auth evidence rejects unsafe reset token and cookie transport", () => {
  const evidence = completeEvidence();
  evidence.resetTokens.hashedTokensOnly = false;
  evidence.resetTokens.ttlEnforced = false;
  evidence.resetTokens.sameScopeConsumption = false;
  evidence.resetTokens.sessionRevocationAfterReset = false;
  evidence.transport.httpOnlyCookie = false;
  evidence.transport.secureCookieInProduction = false;
  evidence.transport.csrfRequiredForCookieWrites = false;
  evidence.transport.noBrowserTokenStorage = false;

  const result = validateProductionAuthEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /reset tokens must be stored as hashes/);
  assert.match(result.findings.join("\n"), /TTL/);
  assert.match(result.findings.join("\n"), /same-scope/);
  assert.match(result.findings.join("\n"), /revoke existing sessions/);
  assert.match(result.findings.join("\n"), /HttpOnly/);
  assert.match(result.findings.join("\n"), /Secure/);
  assert.match(result.findings.join("\n"), /CSRF/);
  assert.match(result.findings.join("\n"), /localStorage\/sessionStorage/);
});

test("production auth evidence rejects missing operations and final approvals", () => {
  const evidence = completeEvidence();
  evidence.lockoutRetention.credentialBackoffDurable = false;
  evidence.lockoutRetention.operatorVisibility = false;
  evidence.operations.startupGuards = false;
  evidence.operations.migrationPlan = false;
  evidence.operations.remoteCiProof = false;
  evidence.operations.browserFlows = ["LOGIN", "LOGOUT"];
  evidence.operations.securityAuditPass = false;
  evidence.operations.privacyAuditPass = false;
  evidence.operations.licensingAuditPass = false;
  evidence.operations.secondOperatorReview = false;

  const result = validateProductionAuthEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /credential backoff/);
  assert.match(result.findings.join("\n"), /operator visibility/);
  assert.match(result.findings.join("\n"), /startup guards/);
  assert.match(result.findings.join("\n"), /migration plan/);
  assert.match(result.findings.join("\n"), /remote CI/);
  assert.match(result.findings.join("\n"), /PASSWORD_RESET_REQUEST/);
  assert.match(result.findings.join("\n"), /ACCESSIBILITY/);
  assert.match(result.findings.join("\n"), /security audit/);
  assert.match(result.findings.join("\n"), /privacy audit/);
  assert.match(result.findings.join("\n"), /licensing audit/);
  assert.match(result.findings.join("\n"), /second operator/);
});
