export type ProductionWebAppBrowser =
  | "CHROME"
  | "FIREFOX"
  | "SAFARI"
  | "MOBILE_WEBKIT";

export interface ProductionWebAppEvidence {
  environment: string;
  deployment: {
    targetReviewed: boolean;
    productionBuildArtifact: boolean;
    releaseCandidateTraceable: boolean;
    selfHostOrContainerProof: boolean;
    noHostedServiceRequirement: boolean;
    noPrivateLeadershipSystemDependency: boolean;
  };
  authenticatedWriteFlow: {
    loginLogoutProof: boolean;
    createEditDeleteTaskProof: boolean;
    fixedEventWriteProof: boolean;
    planAcceptRejectProof: boolean;
    writeBackPreviewAcknowledgementProof: boolean;
    unauthorizedWriteDenied: boolean;
    csrfCookieTransportProof: boolean;
  };
  platformSecurity: {
    tlsTerminationReviewed: boolean;
    trustedProxyHeadersReviewed: boolean;
    securityHeadersReviewed: boolean;
    requestThrottleProof: boolean;
    importThrottleProof: boolean;
    logRedactionProof: boolean;
    noStorePrivateResponses: boolean;
  };
  storageOperations: {
    durableStorageProof: boolean;
    migrationUpgradePath: boolean;
    backupRestoreProof: boolean;
    retentionBoundaryReviewed: boolean;
    healthCheckProof: boolean;
    startupGuardProof: boolean;
    staticAssetCachePolicy: boolean;
  };
  browserQuality: {
    browsers: ProductionWebAppBrowser[];
    accessibilityAudit: boolean;
    keyboardNavigation: boolean;
    screenReaderSemantics: boolean;
    responsivePolish: boolean;
    visualRegressionBaseline: boolean;
    noCriticalConsoleErrors: boolean;
  };
  operations: {
    operatorReview: boolean;
    remoteCiProof: boolean;
    rollbackPlan: boolean;
    cacheInvalidationPlan: boolean;
    apiCompatibilityReviewed: boolean;
    supportRunbookReviewed: boolean;
    securityAuditPass: boolean;
    privacyAuditPass: boolean;
    licensingAuditPass: boolean;
    secondOperatorReview: boolean;
  };
}

export interface ProductionWebAppEvidenceValidation {
  ok: boolean;
  findings: string[];
}

const REQUIRED_BROWSERS: ProductionWebAppBrowser[] = [
  "CHROME",
  "FIREFOX",
  "SAFARI",
  "MOBILE_WEBKIT"
];

export function validateProductionWebAppEvidence(
  evidence: ProductionWebAppEvidence
): ProductionWebAppEvidenceValidation {
  const findings: string[] = [];

  if (!evidence.environment.trim()) {
    findings.push("production web app evidence environment is required");
  }

  validateDeployment(evidence, findings);
  validateAuthenticatedWriteFlow(evidence, findings);
  validatePlatformSecurity(evidence, findings);
  validateStorageOperations(evidence, findings);
  validateBrowserQuality(evidence, findings);
  validateOperations(evidence, findings);

  return {
    ok: findings.length === 0,
    findings
  };
}

function validateDeployment(
  evidence: ProductionWebAppEvidence,
  findings: string[]
): void {
  if (!evidence.deployment.targetReviewed) {
    findings.push("production web app deployment target review is required");
  }
  if (!evidence.deployment.productionBuildArtifact) {
    findings.push("production web app production build artifact proof is required");
  }
  if (!evidence.deployment.releaseCandidateTraceable) {
    findings.push("production web app release candidate traceability is required");
  }
  if (!evidence.deployment.selfHostOrContainerProof) {
    findings.push("production web app self-host or container proof is required");
  }
  if (!evidence.deployment.noHostedServiceRequirement) {
    findings.push("production web app must not require a hosted service");
  }
  if (!evidence.deployment.noPrivateLeadershipSystemDependency) {
    findings.push("production web app must not require private compatible leadership system dependencies");
  }
}

function validateAuthenticatedWriteFlow(
  evidence: ProductionWebAppEvidence,
  findings: string[]
): void {
  if (!evidence.authenticatedWriteFlow.loginLogoutProof) {
    findings.push("production web app login/logout proof is required");
  }
  if (!evidence.authenticatedWriteFlow.createEditDeleteTaskProof) {
    findings.push("production web app task write proof is required");
  }
  if (!evidence.authenticatedWriteFlow.fixedEventWriteProof) {
    findings.push("production web app fixed-event write proof is required");
  }
  if (!evidence.authenticatedWriteFlow.planAcceptRejectProof) {
    findings.push("production web app plan accept/reject proof is required");
  }
  if (!evidence.authenticatedWriteFlow.writeBackPreviewAcknowledgementProof) {
    findings.push("production web app write-back preview acknowledgement proof is required");
  }
  if (!evidence.authenticatedWriteFlow.unauthorizedWriteDenied) {
    findings.push("production web app unauthorized writes must be denied");
  }
  if (!evidence.authenticatedWriteFlow.csrfCookieTransportProof) {
    findings.push("production web app CSRF cookie transport proof is required");
  }
}

function validatePlatformSecurity(
  evidence: ProductionWebAppEvidence,
  findings: string[]
): void {
  if (!evidence.platformSecurity.tlsTerminationReviewed) {
    findings.push("production web app TLS termination review is required");
  }
  if (!evidence.platformSecurity.trustedProxyHeadersReviewed) {
    findings.push("production web app trusted proxy header review is required");
  }
  if (!evidence.platformSecurity.securityHeadersReviewed) {
    findings.push("production web app security headers review is required");
  }
  if (!evidence.platformSecurity.requestThrottleProof) {
    findings.push("production web app request throttle proof is required");
  }
  if (!evidence.platformSecurity.importThrottleProof) {
    findings.push("production web app import throttle proof is required");
  }
  if (!evidence.platformSecurity.logRedactionProof) {
    findings.push("production web app log redaction proof is required");
  }
  if (!evidence.platformSecurity.noStorePrivateResponses) {
    findings.push("production web app private responses must use no-store cache controls");
  }
}

function validateStorageOperations(
  evidence: ProductionWebAppEvidence,
  findings: string[]
): void {
  if (!evidence.storageOperations.durableStorageProof) {
    findings.push("production web app durable storage proof is required");
  }
  if (!evidence.storageOperations.migrationUpgradePath) {
    findings.push("production web app migration or upgrade path is required");
  }
  if (!evidence.storageOperations.backupRestoreProof) {
    findings.push("production web app backup/restore proof is required");
  }
  if (!evidence.storageOperations.retentionBoundaryReviewed) {
    findings.push("production web app retention boundary review is required");
  }
  if (!evidence.storageOperations.healthCheckProof) {
    findings.push("production web app health check proof is required");
  }
  if (!evidence.storageOperations.startupGuardProof) {
    findings.push("production web app startup guard proof is required");
  }
  if (!evidence.storageOperations.staticAssetCachePolicy) {
    findings.push("production web app static asset cache policy proof is required");
  }
}

function validateBrowserQuality(
  evidence: ProductionWebAppEvidence,
  findings: string[]
): void {
  for (const browser of REQUIRED_BROWSERS) {
    if (!evidence.browserQuality.browsers.includes(browser)) {
      findings.push(`production web app browser matrix must include ${browser}`);
    }
  }
  if (!evidence.browserQuality.accessibilityAudit) {
    findings.push("production web app accessibility audit is required");
  }
  if (!evidence.browserQuality.keyboardNavigation) {
    findings.push("production web app keyboard navigation proof is required");
  }
  if (!evidence.browserQuality.screenReaderSemantics) {
    findings.push("production web app screen-reader semantics proof is required");
  }
  if (!evidence.browserQuality.responsivePolish) {
    findings.push("production web app responsive polish proof is required");
  }
  if (!evidence.browserQuality.visualRegressionBaseline) {
    findings.push("production web app visual regression baseline is required");
  }
  if (!evidence.browserQuality.noCriticalConsoleErrors) {
    findings.push("production web app proof must show no critical console errors");
  }
}

function validateOperations(
  evidence: ProductionWebAppEvidence,
  findings: string[]
): void {
  if (!evidence.operations.operatorReview) {
    findings.push("production web app operator review is required");
  }
  if (!evidence.operations.remoteCiProof) {
    findings.push("production web app remote CI proof is required");
  }
  if (!evidence.operations.rollbackPlan) {
    findings.push("production web app rollback plan is required");
  }
  if (!evidence.operations.cacheInvalidationPlan) {
    findings.push("production web app cache invalidation plan is required");
  }
  if (!evidence.operations.apiCompatibilityReviewed) {
    findings.push("production web app API compatibility review is required");
  }
  if (!evidence.operations.supportRunbookReviewed) {
    findings.push("production web app support runbook review is required");
  }
  if (!evidence.operations.securityAuditPass) {
    findings.push("production web app security audit PASS is required");
  }
  if (!evidence.operations.privacyAuditPass) {
    findings.push("production web app privacy audit PASS is required");
  }
  if (!evidence.operations.licensingAuditPass) {
    findings.push("production web app licensing audit PASS is required");
  }
  if (!evidence.operations.secondOperatorReview) {
    findings.push("production web app second operator review is required");
  }
}
