export interface FinalSecurityAuditEvidence {
  environment: string;
  dependencyAndSupplyChain: {
    dependencyAuditPass: boolean;
    lockfileReviewed: boolean;
    licenseAlignmentReviewed: boolean;
    noRegistrySecrets: boolean;
  };
  scans: {
    releaseSafetyPass: boolean;
    secretScanPass: boolean;
    personalDataScanPass: boolean;
    fixtureExampleScanPass: boolean;
    noPrivateLeadershipSystemMaterial: boolean;
    noPrivateMachinePaths: boolean;
  };
  authAndAccess: {
    productionAuthApproved: boolean;
    roleMembershipMatrixReviewed: boolean;
    resetTokenLifecycleReviewed: boolean;
    sessionCookieCsrfReviewed: boolean;
    ownerAdminFlowsReviewed: boolean;
  };
  abuseAndProviderSecurity: {
    productionRateLimitApproved: boolean;
    distributedThrottleProof: boolean;
    providerQuotaPolicyReviewed: boolean;
    managedSecretLifecycleApproved: boolean;
    providerRotationRevocationReviewed: boolean;
    hostedAlertsReviewed: boolean;
  };
  deploymentAndOperations: {
    tlsProxyHeadersReviewed: boolean;
    securityHeadersReviewed: boolean;
    durableStorageReviewed: boolean;
    backupRollbackReviewed: boolean;
    logRedactionReviewed: boolean;
    incidentResponseReviewed: boolean;
  };
  remoteCiAndRepository: {
    remoteCiProof: boolean;
    postgresProofAccepted: boolean;
    dependencyAuditCiProof: boolean;
    logSanitizationReviewed: boolean;
    artifactRetentionReviewed: boolean;
    branchProtectionReviewed: boolean;
    repositorySettingsReviewed: boolean;
  };
  disclosureAndFinalReview: {
    securityPolicyContactConfigured: boolean;
    advisoryWorkflowReviewed: boolean;
    responseSlaReviewed: boolean;
    escalationPathReviewed: boolean;
    privateReportSanitizationReviewed: boolean;
    finalSourceReview: boolean;
    privacyAuditPass: boolean;
    licensingAuditPass: boolean;
    secondOperatorReview: boolean;
  };
}

export interface FinalSecurityAuditEvidenceValidation {
  ok: boolean;
  findings: string[];
}

export function validateFinalSecurityAuditEvidence(
  evidence: FinalSecurityAuditEvidence
): FinalSecurityAuditEvidenceValidation {
  const findings: string[] = [];

  if (!evidence.environment.trim()) {
    findings.push("final security audit environment is required");
  }

  validateDependencyAndSupplyChain(evidence, findings);
  validateScans(evidence, findings);
  validateAuthAndAccess(evidence, findings);
  validateAbuseAndProviderSecurity(evidence, findings);
  validateDeploymentAndOperations(evidence, findings);
  validateRemoteCiAndRepository(evidence, findings);
  validateDisclosureAndFinalReview(evidence, findings);

  return {
    ok: findings.length === 0,
    findings
  };
}

function validateDependencyAndSupplyChain(
  evidence: FinalSecurityAuditEvidence,
  findings: string[]
): void {
  if (!evidence.dependencyAndSupplyChain.dependencyAuditPass) {
    findings.push("dependency audit final pass evidence is required");
  }
  if (!evidence.dependencyAndSupplyChain.lockfileReviewed) {
    findings.push("lockfile security review is required");
  }
  if (!evidence.dependencyAndSupplyChain.licenseAlignmentReviewed) {
    findings.push("license alignment security review is required");
  }
  if (!evidence.dependencyAndSupplyChain.noRegistrySecrets) {
    findings.push("registry secret absence proof is required");
  }
}

function validateScans(
  evidence: FinalSecurityAuditEvidence,
  findings: string[]
): void {
  if (!evidence.scans.releaseSafetyPass) {
    findings.push("release safety scan PASS evidence is required");
  }
  if (!evidence.scans.secretScanPass) {
    findings.push("secret scan PASS evidence is required");
  }
  if (!evidence.scans.personalDataScanPass) {
    findings.push("personal/private data scan PASS evidence is required");
  }
  if (!evidence.scans.fixtureExampleScanPass) {
    findings.push("fixture and example scan PASS evidence is required");
  }
  if (!evidence.scans.noPrivateLeadershipSystemMaterial) {
    findings.push("private compatible leadership system material absence proof is required");
  }
  if (!evidence.scans.noPrivateMachinePaths) {
    findings.push("private machine path absence proof is required");
  }
}

function validateAuthAndAccess(
  evidence: FinalSecurityAuditEvidence,
  findings: string[]
): void {
  if (!evidence.authAndAccess.productionAuthApproved) {
    findings.push("production auth approval evidence is required");
  }
  if (!evidence.authAndAccess.roleMembershipMatrixReviewed) {
    findings.push("role and membership matrix review is required");
  }
  if (!evidence.authAndAccess.resetTokenLifecycleReviewed) {
    findings.push("reset-token lifecycle review is required");
  }
  if (!evidence.authAndAccess.sessionCookieCsrfReviewed) {
    findings.push("session cookie and CSRF review is required");
  }
  if (!evidence.authAndAccess.ownerAdminFlowsReviewed) {
    findings.push("owner/admin flow review is required");
  }
}

function validateAbuseAndProviderSecurity(
  evidence: FinalSecurityAuditEvidence,
  findings: string[]
): void {
  if (!evidence.abuseAndProviderSecurity.productionRateLimitApproved) {
    findings.push("production rate-limit approval evidence is required");
  }
  if (!evidence.abuseAndProviderSecurity.distributedThrottleProof) {
    findings.push("distributed throttle proof is required");
  }
  if (!evidence.abuseAndProviderSecurity.providerQuotaPolicyReviewed) {
    findings.push("provider quota policy review is required");
  }
  if (!evidence.abuseAndProviderSecurity.managedSecretLifecycleApproved) {
    findings.push("managed-secret lifecycle approval evidence is required");
  }
  if (!evidence.abuseAndProviderSecurity.providerRotationRevocationReviewed) {
    findings.push("provider rotation/revocation review is required");
  }
  if (!evidence.abuseAndProviderSecurity.hostedAlertsReviewed) {
    findings.push("hosted alert review is required");
  }
}

function validateDeploymentAndOperations(
  evidence: FinalSecurityAuditEvidence,
  findings: string[]
): void {
  if (!evidence.deploymentAndOperations.tlsProxyHeadersReviewed) {
    findings.push("TLS and proxy header review is required");
  }
  if (!evidence.deploymentAndOperations.securityHeadersReviewed) {
    findings.push("security header review is required");
  }
  if (!evidence.deploymentAndOperations.durableStorageReviewed) {
    findings.push("durable storage review is required");
  }
  if (!evidence.deploymentAndOperations.backupRollbackReviewed) {
    findings.push("backup and rollback review is required");
  }
  if (!evidence.deploymentAndOperations.logRedactionReviewed) {
    findings.push("log redaction review is required");
  }
  if (!evidence.deploymentAndOperations.incidentResponseReviewed) {
    findings.push("incident response review is required");
  }
}

function validateRemoteCiAndRepository(
  evidence: FinalSecurityAuditEvidence,
  findings: string[]
): void {
  if (!evidence.remoteCiAndRepository.remoteCiProof) {
    findings.push("remote CI proof is required");
  }
  if (!evidence.remoteCiAndRepository.postgresProofAccepted) {
    findings.push("remote CI PostgreSQL proof acceptance is required");
  }
  if (!evidence.remoteCiAndRepository.dependencyAuditCiProof) {
    findings.push("remote CI dependency audit proof is required");
  }
  if (!evidence.remoteCiAndRepository.logSanitizationReviewed) {
    findings.push("remote CI log sanitization review is required");
  }
  if (!evidence.remoteCiAndRepository.artifactRetentionReviewed) {
    findings.push("remote CI artifact retention review is required");
  }
  if (!evidence.remoteCiAndRepository.branchProtectionReviewed) {
    findings.push("branch protection review is required");
  }
  if (!evidence.remoteCiAndRepository.repositorySettingsReviewed) {
    findings.push("repository settings review is required");
  }
}

function validateDisclosureAndFinalReview(
  evidence: FinalSecurityAuditEvidence,
  findings: string[]
): void {
  if (!evidence.disclosureAndFinalReview.securityPolicyContactConfigured) {
    findings.push("security policy contact configuration proof is required");
  }
  if (!evidence.disclosureAndFinalReview.advisoryWorkflowReviewed) {
    findings.push("advisory workflow review is required");
  }
  if (!evidence.disclosureAndFinalReview.responseSlaReviewed) {
    findings.push("security response SLA review is required");
  }
  if (!evidence.disclosureAndFinalReview.escalationPathReviewed) {
    findings.push("security escalation path review is required");
  }
  if (!evidence.disclosureAndFinalReview.privateReportSanitizationReviewed) {
    findings.push("private-report sanitization review is required");
  }
  if (!evidence.disclosureAndFinalReview.finalSourceReview) {
    findings.push("final source review is required");
  }
  if (!evidence.disclosureAndFinalReview.privacyAuditPass) {
    findings.push("final privacy audit PASS evidence is required");
  }
  if (!evidence.disclosureAndFinalReview.licensingAuditPass) {
    findings.push("final licensing audit PASS evidence is required");
  }
  if (!evidence.disclosureAndFinalReview.secondOperatorReview) {
    findings.push("second operator security audit review is required");
  }
}
