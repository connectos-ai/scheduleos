import test from "node:test";
import assert from "node:assert/strict";

import {
  type FinalSecurityAuditEvidence,
  validateFinalSecurityAuditEvidence
} from "./final-security-audit-evidence-contract.js";

const completeEvidence = (): FinalSecurityAuditEvidence => ({
  environment: "release_candidate_demo",
  dependencyAndSupplyChain: {
    dependencyAuditPass: true,
    lockfileReviewed: true,
    licenseAlignmentReviewed: true,
    noRegistrySecrets: true
  },
  scans: {
    releaseSafetyPass: true,
    secretScanPass: true,
    personalDataScanPass: true,
    fixtureExampleScanPass: true,
    noPrivateLeadershipSystemMaterial: true,
    noPrivateMachinePaths: true
  },
  authAndAccess: {
    productionAuthApproved: true,
    roleMembershipMatrixReviewed: true,
    resetTokenLifecycleReviewed: true,
    sessionCookieCsrfReviewed: true,
    ownerAdminFlowsReviewed: true
  },
  abuseAndProviderSecurity: {
    productionRateLimitApproved: true,
    distributedThrottleProof: true,
    providerQuotaPolicyReviewed: true,
    managedSecretLifecycleApproved: true,
    providerRotationRevocationReviewed: true,
    hostedAlertsReviewed: true
  },
  deploymentAndOperations: {
    tlsProxyHeadersReviewed: true,
    securityHeadersReviewed: true,
    durableStorageReviewed: true,
    backupRollbackReviewed: true,
    logRedactionReviewed: true,
    incidentResponseReviewed: true
  },
  remoteCiAndRepository: {
    remoteCiProof: true,
    postgresProofAccepted: true,
    dependencyAuditCiProof: true,
    logSanitizationReviewed: true,
    artifactRetentionReviewed: true,
    branchProtectionReviewed: true,
    repositorySettingsReviewed: true
  },
  disclosureAndFinalReview: {
    securityPolicyContactConfigured: true,
    advisoryWorkflowReviewed: true,
    responseSlaReviewed: true,
    escalationPathReviewed: true,
    privateReportSanitizationReviewed: true,
    finalSourceReview: true,
    privacyAuditPass: true,
    licensingAuditPass: true,
    secondOperatorReview: true
  }
});

test("final security audit evidence accepts complete release-grade evidence shape", () => {
  const result = validateFinalSecurityAuditEvidence(completeEvidence());

  assert.equal(result.ok, true);
  assert.deepEqual(result.findings, []);
});

test("final security audit evidence rejects missing dependency and scan proof", () => {
  const evidence = completeEvidence();
  evidence.environment = "";
  evidence.dependencyAndSupplyChain.dependencyAuditPass = false;
  evidence.dependencyAndSupplyChain.noRegistrySecrets = false;
  evidence.scans.secretScanPass = false;
  evidence.scans.personalDataScanPass = false;
  evidence.scans.noPrivateLeadershipSystemMaterial = false;
  evidence.scans.noPrivateMachinePaths = false;

  const result = validateFinalSecurityAuditEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /environment/);
  assert.match(result.findings.join("\n"), /dependency audit/);
  assert.match(result.findings.join("\n"), /registry secret/);
  assert.match(result.findings.join("\n"), /secret scan/);
  assert.match(result.findings.join("\n"), /personal\/private data/);
  assert.match(result.findings.join("\n"), /private compatible leadership system/);
  assert.match(result.findings.join("\n"), /private machine path/);
});

test("final security audit evidence rejects missing auth abuse and provider proof", () => {
  const evidence = completeEvidence();
  evidence.authAndAccess.productionAuthApproved = false;
  evidence.authAndAccess.roleMembershipMatrixReviewed = false;
  evidence.authAndAccess.resetTokenLifecycleReviewed = false;
  evidence.authAndAccess.sessionCookieCsrfReviewed = false;
  evidence.abuseAndProviderSecurity.productionRateLimitApproved = false;
  evidence.abuseAndProviderSecurity.distributedThrottleProof = false;
  evidence.abuseAndProviderSecurity.managedSecretLifecycleApproved = false;
  evidence.abuseAndProviderSecurity.providerRotationRevocationReviewed = false;

  const result = validateFinalSecurityAuditEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /production auth/);
  assert.match(result.findings.join("\n"), /role and membership/);
  assert.match(result.findings.join("\n"), /reset-token/);
  assert.match(result.findings.join("\n"), /CSRF/);
  assert.match(result.findings.join("\n"), /production rate-limit/);
  assert.match(result.findings.join("\n"), /distributed throttle/);
  assert.match(result.findings.join("\n"), /managed-secret/);
  assert.match(result.findings.join("\n"), /rotation\/revocation/);
});

test("final security audit evidence rejects missing deployment and remote CI proof", () => {
  const evidence = completeEvidence();
  evidence.deploymentAndOperations.tlsProxyHeadersReviewed = false;
  evidence.deploymentAndOperations.securityHeadersReviewed = false;
  evidence.deploymentAndOperations.backupRollbackReviewed = false;
  evidence.deploymentAndOperations.logRedactionReviewed = false;
  evidence.remoteCiAndRepository.remoteCiProof = false;
  evidence.remoteCiAndRepository.postgresProofAccepted = false;
  evidence.remoteCiAndRepository.dependencyAuditCiProof = false;
  evidence.remoteCiAndRepository.branchProtectionReviewed = false;

  const result = validateFinalSecurityAuditEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /TLS and proxy/);
  assert.match(result.findings.join("\n"), /security header/);
  assert.match(result.findings.join("\n"), /backup and rollback/);
  assert.match(result.findings.join("\n"), /log redaction/);
  assert.match(result.findings.join("\n"), /remote CI proof/);
  assert.match(result.findings.join("\n"), /PostgreSQL proof/);
  assert.match(result.findings.join("\n"), /dependency audit proof/);
  assert.match(result.findings.join("\n"), /branch protection/);
});

test("final security audit evidence rejects missing disclosure final approvals", () => {
  const evidence = completeEvidence();
  evidence.disclosureAndFinalReview.securityPolicyContactConfigured = false;
  evidence.disclosureAndFinalReview.advisoryWorkflowReviewed = false;
  evidence.disclosureAndFinalReview.responseSlaReviewed = false;
  evidence.disclosureAndFinalReview.escalationPathReviewed = false;
  evidence.disclosureAndFinalReview.privateReportSanitizationReviewed = false;
  evidence.disclosureAndFinalReview.finalSourceReview = false;
  evidence.disclosureAndFinalReview.privacyAuditPass = false;
  evidence.disclosureAndFinalReview.secondOperatorReview = false;

  const result = validateFinalSecurityAuditEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /security policy contact/);
  assert.match(result.findings.join("\n"), /advisory workflow/);
  assert.match(result.findings.join("\n"), /response SLA/);
  assert.match(result.findings.join("\n"), /escalation path/);
  assert.match(result.findings.join("\n"), /private-report sanitization/);
  assert.match(result.findings.join("\n"), /final source review/);
  assert.match(result.findings.join("\n"), /privacy audit/);
  assert.match(result.findings.join("\n"), /second operator/);
});
