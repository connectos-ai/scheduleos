export type ProductionAuthRole =
  | "OWNER"
  | "ADMIN"
  | "EDITOR"
  | "VIEWER"
  | "DISABLED_USER"
  | "INACTIVE_MEMBERSHIP"
  | "CROSS_TENANT"
  | "CROSS_WORKSPACE"
  | "CROSS_USER";

export type ProductionAuthBrowserFlow =
  | "LOGIN"
  | "LOGOUT"
  | "PASSWORD_RESET_REQUEST"
  | "PASSWORD_RESET_CONFIRM"
  | "OWNER_ADMIN_USER_MANAGEMENT"
  | "MEMBERSHIP_MANAGEMENT"
  | "CREDENTIAL_RESET"
  | "ACCESSIBILITY"
  | "RESPONSIVE";

export interface ProductionAuthEvidence {
  environment: string;
  identity: {
    providerSelected: boolean;
    localCredentialFallbackReviewed: boolean;
    recoveryDeliveryReviewed: boolean;
    helpdeskPolicyReviewed: boolean;
  };
  sessionStore: {
    durableStoreSelected: boolean;
    tokenHashesOnly: boolean;
    expirationEnforced: boolean;
    revocationEnforced: boolean;
    disabledUserDenied: boolean;
    inactiveMembershipDenied: boolean;
    lastSeenAudited: boolean;
  };
  authorization: {
    matrixRoles: ProductionAuthRole[];
    tenantScoped: boolean;
    workspaceScoped: boolean;
    userScoped: boolean;
    privateCalendarBoundary: boolean;
    ownerOnlyElevation: boolean;
    demotionReviewed: boolean;
    ownerTransferReviewed: boolean;
  };
  resetTokens: {
    hashedTokensOnly: boolean;
    ttlEnforced: boolean;
    oneTimeUse: boolean;
    sameScopeConsumption: boolean;
    genericRequestResponse: boolean;
    sessionRevocationAfterReset: boolean;
    abuseThrottle: boolean;
  };
  transport: {
    httpOnlyCookie: boolean;
    sameSiteCookie: boolean;
    secureCookieInProduction: boolean;
    csrfRequiredForCookieWrites: boolean;
    noBrowserTokenStorage: boolean;
    tlsProxyHeadersReviewed: boolean;
  };
  lockoutRetention: {
    credentialBackoffDurable: boolean;
    resetRequestThrottleDurable: boolean;
    retentionCleanupReviewed: boolean;
    operatorVisibility: boolean;
  };
  operations: {
    startupGuards: boolean;
    migrationPlan: boolean;
    rollbackDrill: boolean;
    remoteCiProof: boolean;
    browserFlows: ProductionAuthBrowserFlow[];
    securityAuditPass: boolean;
    privacyAuditPass: boolean;
    licensingAuditPass: boolean;
    secondOperatorReview: boolean;
  };
}

export interface ProductionAuthEvidenceValidation {
  ok: boolean;
  findings: string[];
}

const REQUIRED_ROLES: ProductionAuthRole[] = [
  "OWNER",
  "ADMIN",
  "EDITOR",
  "VIEWER",
  "DISABLED_USER",
  "INACTIVE_MEMBERSHIP",
  "CROSS_TENANT",
  "CROSS_WORKSPACE",
  "CROSS_USER"
];

const REQUIRED_BROWSER_FLOWS: ProductionAuthBrowserFlow[] = [
  "LOGIN",
  "LOGOUT",
  "PASSWORD_RESET_REQUEST",
  "PASSWORD_RESET_CONFIRM",
  "OWNER_ADMIN_USER_MANAGEMENT",
  "MEMBERSHIP_MANAGEMENT",
  "CREDENTIAL_RESET",
  "ACCESSIBILITY",
  "RESPONSIVE"
];

export function validateProductionAuthEvidence(
  evidence: ProductionAuthEvidence
): ProductionAuthEvidenceValidation {
  const findings: string[] = [];

  if (evidence.environment.trim().length === 0) {
    findings.push("production auth environment must be named");
  }

  validateIdentity(evidence, findings);
  validateSessionStore(evidence, findings);
  validateAuthorization(evidence, findings);
  validateResetTokens(evidence, findings);
  validateTransport(evidence, findings);
  validateLockoutRetention(evidence, findings);
  validateOperations(evidence, findings);

  return { ok: findings.length === 0, findings };
}

function validateIdentity(evidence: ProductionAuthEvidence, findings: string[]): void {
  if (!evidence.identity.providerSelected) {
    findings.push("production identity provider must be selected or explicitly approved");
  }
  if (!evidence.identity.localCredentialFallbackReviewed) {
    findings.push("local credential fallback must be reviewed");
  }
  if (!evidence.identity.recoveryDeliveryReviewed) {
    findings.push("recovery delivery must be reviewed");
  }
  if (!evidence.identity.helpdeskPolicyReviewed) {
    findings.push("operator/helpdesk policy must be reviewed");
  }
}

function validateSessionStore(evidence: ProductionAuthEvidence, findings: string[]): void {
  if (!evidence.sessionStore.durableStoreSelected) {
    findings.push("production session store must be durable");
  }
  if (!evidence.sessionStore.tokenHashesOnly) {
    findings.push("production sessions must store token hashes only");
  }
  if (!evidence.sessionStore.expirationEnforced) {
    findings.push("session expiration must be enforced");
  }
  if (!evidence.sessionStore.revocationEnforced) {
    findings.push("session revocation must be enforced");
  }
  if (!evidence.sessionStore.disabledUserDenied) {
    findings.push("disabled users must be denied during session use");
  }
  if (!evidence.sessionStore.inactiveMembershipDenied) {
    findings.push("inactive memberships must be denied during session use");
  }
  if (!evidence.sessionStore.lastSeenAudited) {
    findings.push("session last-seen/audit behavior must be reviewed");
  }
}

function validateAuthorization(evidence: ProductionAuthEvidence, findings: string[]): void {
  for (const role of REQUIRED_ROLES) {
    if (!evidence.authorization.matrixRoles.includes(role)) {
      findings.push(`authorization matrix must include ${role}`);
    }
  }
  if (!evidence.authorization.tenantScoped) {
    findings.push("authorization must be tenant scoped");
  }
  if (!evidence.authorization.workspaceScoped) {
    findings.push("authorization must be workspace scoped");
  }
  if (!evidence.authorization.userScoped) {
    findings.push("authorization must be user scoped");
  }
  if (!evidence.authorization.privateCalendarBoundary) {
    findings.push("private calendar authorization boundary must be reviewed");
  }
  if (!evidence.authorization.ownerOnlyElevation) {
    findings.push("owner-only role elevation must be enforced");
  }
  if (!evidence.authorization.demotionReviewed) {
    findings.push("role demotion workflow must be reviewed");
  }
  if (!evidence.authorization.ownerTransferReviewed) {
    findings.push("owner transfer workflow must be reviewed");
  }
}

function validateResetTokens(evidence: ProductionAuthEvidence, findings: string[]): void {
  if (!evidence.resetTokens.hashedTokensOnly) {
    findings.push("password reset tokens must be stored as hashes only");
  }
  if (!evidence.resetTokens.ttlEnforced) {
    findings.push("password reset token TTL must be enforced");
  }
  if (!evidence.resetTokens.oneTimeUse) {
    findings.push("password reset tokens must be one-time use");
  }
  if (!evidence.resetTokens.sameScopeConsumption) {
    findings.push("password reset token consumption must be same-scope only");
  }
  if (!evidence.resetTokens.genericRequestResponse) {
    findings.push("password reset request response must be generic");
  }
  if (!evidence.resetTokens.sessionRevocationAfterReset) {
    findings.push("password reset must revoke existing sessions");
  }
  if (!evidence.resetTokens.abuseThrottle) {
    findings.push("password reset abuse throttle must be configured");
  }
}

function validateTransport(evidence: ProductionAuthEvidence, findings: string[]): void {
  if (!evidence.transport.httpOnlyCookie) {
    findings.push("cookie session transport must use HttpOnly");
  }
  if (!evidence.transport.sameSiteCookie) {
    findings.push("cookie session transport must use SameSite");
  }
  if (!evidence.transport.secureCookieInProduction) {
    findings.push("production cookie session transport must use Secure");
  }
  if (!evidence.transport.csrfRequiredForCookieWrites) {
    findings.push("cookie-authenticated writes must require CSRF");
  }
  if (!evidence.transport.noBrowserTokenStorage) {
    findings.push("browser auth must avoid localStorage/sessionStorage token storage");
  }
  if (!evidence.transport.tlsProxyHeadersReviewed) {
    findings.push("TLS/proxy/header deployment must be reviewed for auth transport");
  }
}

function validateLockoutRetention(evidence: ProductionAuthEvidence, findings: string[]): void {
  if (!evidence.lockoutRetention.credentialBackoffDurable) {
    findings.push("credential backoff must be durable");
  }
  if (!evidence.lockoutRetention.resetRequestThrottleDurable) {
    findings.push("reset request throttle must be durable");
  }
  if (!evidence.lockoutRetention.retentionCleanupReviewed) {
    findings.push("auth retention cleanup must be reviewed");
  }
  if (!evidence.lockoutRetention.operatorVisibility) {
    findings.push("auth lockout/reset operator visibility must be reviewed");
  }
}

function validateOperations(evidence: ProductionAuthEvidence, findings: string[]): void {
  if (!evidence.operations.startupGuards) {
    findings.push("production auth startup guards must be verified");
  }
  if (!evidence.operations.migrationPlan) {
    findings.push("production auth migration plan must be reviewed");
  }
  if (!evidence.operations.rollbackDrill) {
    findings.push("production auth rollback drill must be reviewed");
  }
  if (!evidence.operations.remoteCiProof) {
    findings.push("production auth remote CI proof must exist");
  }
  for (const flow of REQUIRED_BROWSER_FLOWS) {
    if (!evidence.operations.browserFlows.includes(flow)) {
      findings.push(`browser verification must include ${flow}`);
    }
  }
  if (!evidence.operations.securityAuditPass) {
    findings.push("security audit must remain PASS after auth evidence");
  }
  if (!evidence.operations.privacyAuditPass) {
    findings.push("privacy audit must remain PASS after auth evidence");
  }
  if (!evidence.operations.licensingAuditPass) {
    findings.push("licensing audit must remain PASS after auth evidence");
  }
  if (!evidence.operations.secondOperatorReview) {
    findings.push("second operator must approve production auth evidence");
  }
}
