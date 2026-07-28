import test from "node:test";
import assert from "node:assert/strict";

import {
  type ProductionWebAppEvidence,
  validateProductionWebAppEvidence
} from "./production-web-app-evidence-contract.js";

const completeEvidence = (): ProductionWebAppEvidence => ({
  environment: "production_demo",
  deployment: {
    targetReviewed: true,
    productionBuildArtifact: true,
    releaseCandidateTraceable: true,
    selfHostOrContainerProof: true,
    noHostedServiceRequirement: true,
    noPrivateLeadershipSystemDependency: true
  },
  authenticatedWriteFlow: {
    loginLogoutProof: true,
    createEditDeleteTaskProof: true,
    fixedEventWriteProof: true,
    planAcceptRejectProof: true,
    writeBackPreviewAcknowledgementProof: true,
    unauthorizedWriteDenied: true,
    csrfCookieTransportProof: true
  },
  platformSecurity: {
    tlsTerminationReviewed: true,
    trustedProxyHeadersReviewed: true,
    securityHeadersReviewed: true,
    requestThrottleProof: true,
    importThrottleProof: true,
    logRedactionProof: true,
    noStorePrivateResponses: true
  },
  storageOperations: {
    durableStorageProof: true,
    migrationUpgradePath: true,
    backupRestoreProof: true,
    retentionBoundaryReviewed: true,
    healthCheckProof: true,
    startupGuardProof: true,
    staticAssetCachePolicy: true
  },
  browserQuality: {
    browsers: ["CHROME", "FIREFOX", "SAFARI", "MOBILE_WEBKIT"],
    accessibilityAudit: true,
    keyboardNavigation: true,
    screenReaderSemantics: true,
    responsivePolish: true,
    visualRegressionBaseline: true,
    noCriticalConsoleErrors: true
  },
  operations: {
    operatorReview: true,
    remoteCiProof: true,
    rollbackPlan: true,
    cacheInvalidationPlan: true,
    apiCompatibilityReviewed: true,
    supportRunbookReviewed: true,
    securityAuditPass: true,
    privacyAuditPass: true,
    licensingAuditPass: true,
    secondOperatorReview: true
  }
});

test("production web app evidence accepts complete release-grade evidence shape", () => {
  const result = validateProductionWebAppEvidence(completeEvidence());

  assert.equal(result.ok, true);
  assert.deepEqual(result.findings, []);
});

test("production web app evidence rejects missing deployment independence proof", () => {
  const evidence = completeEvidence();
  evidence.deployment.targetReviewed = false;
  evidence.deployment.productionBuildArtifact = false;
  evidence.deployment.releaseCandidateTraceable = false;
  evidence.deployment.noHostedServiceRequirement = false;
  evidence.deployment.noPrivateLeadershipSystemDependency = false;

  const result = validateProductionWebAppEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /deployment target/);
  assert.match(result.findings.join("\n"), /production build artifact/);
  assert.match(result.findings.join("\n"), /release candidate/);
  assert.match(result.findings.join("\n"), /hosted service/);
  assert.match(result.findings.join("\n"), /compatible leadership system/);
});

test("production web app evidence rejects unsafe authenticated write flow", () => {
  const evidence = completeEvidence();
  evidence.authenticatedWriteFlow.loginLogoutProof = false;
  evidence.authenticatedWriteFlow.createEditDeleteTaskProof = false;
  evidence.authenticatedWriteFlow.writeBackPreviewAcknowledgementProof = false;
  evidence.authenticatedWriteFlow.unauthorizedWriteDenied = false;
  evidence.authenticatedWriteFlow.csrfCookieTransportProof = false;

  const result = validateProductionWebAppEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /login\/logout/);
  assert.match(result.findings.join("\n"), /task write/);
  assert.match(result.findings.join("\n"), /write-back preview/);
  assert.match(result.findings.join("\n"), /unauthorized writes/);
  assert.match(result.findings.join("\n"), /CSRF/);
});

test("production web app evidence rejects missing security storage proof", () => {
  const evidence = completeEvidence();
  evidence.platformSecurity.tlsTerminationReviewed = false;
  evidence.platformSecurity.securityHeadersReviewed = false;
  evidence.platformSecurity.requestThrottleProof = false;
  evidence.storageOperations.durableStorageProof = false;
  evidence.storageOperations.backupRestoreProof = false;
  evidence.storageOperations.healthCheckProof = false;

  const result = validateProductionWebAppEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /TLS/);
  assert.match(result.findings.join("\n"), /security headers/);
  assert.match(result.findings.join("\n"), /request throttle/);
  assert.match(result.findings.join("\n"), /durable storage/);
  assert.match(result.findings.join("\n"), /backup\/restore/);
  assert.match(result.findings.join("\n"), /health check/);
});

test("production web app evidence rejects missing browser operations approvals", () => {
  const evidence = completeEvidence();
  evidence.browserQuality.browsers = ["CHROME"];
  evidence.browserQuality.accessibilityAudit = false;
  evidence.browserQuality.responsivePolish = false;
  evidence.browserQuality.visualRegressionBaseline = false;
  evidence.operations.operatorReview = false;
  evidence.operations.remoteCiProof = false;
  evidence.operations.rollbackPlan = false;
  evidence.operations.securityAuditPass = false;
  evidence.operations.secondOperatorReview = false;

  const result = validateProductionWebAppEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /FIREFOX/);
  assert.match(result.findings.join("\n"), /accessibility audit/);
  assert.match(result.findings.join("\n"), /responsive polish/);
  assert.match(result.findings.join("\n"), /visual regression/);
  assert.match(result.findings.join("\n"), /operator review/);
  assert.match(result.findings.join("\n"), /remote CI/);
  assert.match(result.findings.join("\n"), /rollback/);
  assert.match(result.findings.join("\n"), /security audit/);
  assert.match(result.findings.join("\n"), /second operator/);
});
