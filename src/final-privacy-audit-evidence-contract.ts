export interface FinalPrivacyAuditEvidence {
  environment: string;
  releaseSurface: {
    releaseSafetyScanPass: boolean;
    sourceDocsScriptsReviewed: boolean;
    githubTemplatesReviewed: boolean;
    packageMetadataReviewed: boolean;
    generatedDocsReviewed: boolean;
  };
  artifactSanitization: {
    fixturesExamplesSanitized: boolean;
    generatedArtifactsReviewed: boolean;
    logsReviewed: boolean;
    screenshotsReviewed: boolean;
    exportsReviewed: boolean;
    backupsReviewed: boolean;
    localDatabasesExcludedOrSanitized: boolean;
    sourceMapsCoverageReviewed: boolean;
  };
  identifiersAndPrivateBoundaries: {
    providerIdentifiersMinimized: boolean;
    tenantWorkspaceUserIdsFictional: boolean;
    localPathsAbsent: boolean;
    machineNamesAbsent: boolean;
    privateUrlsAbsent: boolean;
    privateLeadershipSystemMaterialAbsent: boolean;
    hiddenLeadershipSystemApisAbsent: boolean;
  };
  calendarTaskMinimization: {
    calendarTitlesSanitized: boolean;
    attendeesLocationsDescriptionsSanitized: boolean;
    taskTitlesDescriptionsSanitized: boolean;
    deadlinesAndSourceMetadataMinimized: boolean;
    publicEventPayloadsMinimized: boolean;
    providerTokensExcluded: boolean;
  };
  aiAndAutomationBoundary: {
    optionalAiInputsReviewed: boolean;
    optionalAiOutputsReviewed: boolean;
    promptsReviewed: boolean;
    tracesLogsReviewed: boolean;
    noPrivateOwnerData: boolean;
    noCommercialLeadershipSystemScoringLogic: boolean;
  };
  rightsAndLifecycle: {
    retentionReviewed: boolean;
    exportReviewed: boolean;
    deletionReviewed: boolean;
    providerRevocationReviewed: boolean;
    destructiveOperationApprovalReviewed: boolean;
    rollbackReviewed: boolean;
  };
  finalReleaseAlignment: {
    cleanPublicHistoryReviewed: boolean;
    remoteCiPrivacyProof: boolean;
    securityAuditPass: boolean;
    licensingAuditPass: boolean;
    securityPolicyContactConfigured: boolean;
    publicRepositorySettingsReviewed: boolean;
    secondOperatorReview: boolean;
  };
}

export interface FinalPrivacyAuditEvidenceValidation {
  ok: boolean;
  findings: string[];
}

export function validateFinalPrivacyAuditEvidence(
  evidence: FinalPrivacyAuditEvidence
): FinalPrivacyAuditEvidenceValidation {
  const findings: string[] = [];

  if (!evidence.environment.trim()) {
    findings.push("final privacy audit environment is required");
  }

  validateReleaseSurface(evidence, findings);
  validateArtifactSanitization(evidence, findings);
  validateIdentifiersAndPrivateBoundaries(evidence, findings);
  validateCalendarTaskMinimization(evidence, findings);
  validateAiAndAutomationBoundary(evidence, findings);
  validateRightsAndLifecycle(evidence, findings);
  validateFinalReleaseAlignment(evidence, findings);

  return {
    ok: findings.length === 0,
    findings
  };
}

function validateReleaseSurface(
  evidence: FinalPrivacyAuditEvidence,
  findings: string[]
): void {
  if (!evidence.releaseSurface.releaseSafetyScanPass) {
    findings.push("release safety scan PASS evidence is required");
  }
  if (!evidence.releaseSurface.sourceDocsScriptsReviewed) {
    findings.push("source, docs, and scripts privacy review is required");
  }
  if (!evidence.releaseSurface.githubTemplatesReviewed) {
    findings.push("GitHub template privacy review is required");
  }
  if (!evidence.releaseSurface.packageMetadataReviewed) {
    findings.push("package metadata privacy review is required");
  }
  if (!evidence.releaseSurface.generatedDocsReviewed) {
    findings.push("generated documentation privacy review is required");
  }
}

function validateArtifactSanitization(
  evidence: FinalPrivacyAuditEvidence,
  findings: string[]
): void {
  if (!evidence.artifactSanitization.fixturesExamplesSanitized) {
    findings.push("fixture and example sanitization proof is required");
  }
  if (!evidence.artifactSanitization.generatedArtifactsReviewed) {
    findings.push("generated artifact privacy review is required");
  }
  if (!evidence.artifactSanitization.logsReviewed) {
    findings.push("log privacy review is required");
  }
  if (!evidence.artifactSanitization.screenshotsReviewed) {
    findings.push("screenshot privacy review is required");
  }
  if (!evidence.artifactSanitization.exportsReviewed) {
    findings.push("export privacy review is required");
  }
  if (!evidence.artifactSanitization.backupsReviewed) {
    findings.push("backup privacy review is required");
  }
  if (!evidence.artifactSanitization.localDatabasesExcludedOrSanitized) {
    findings.push("local database exclusion or sanitization proof is required");
  }
  if (!evidence.artifactSanitization.sourceMapsCoverageReviewed) {
    findings.push("source map and coverage output privacy review is required");
  }
}

function validateIdentifiersAndPrivateBoundaries(
  evidence: FinalPrivacyAuditEvidence,
  findings: string[]
): void {
  if (!evidence.identifiersAndPrivateBoundaries.providerIdentifiersMinimized) {
    findings.push("provider identifier minimization proof is required");
  }
  if (!evidence.identifiersAndPrivateBoundaries.tenantWorkspaceUserIdsFictional) {
    findings.push("tenant/workspace/user identifiers must be fictional");
  }
  if (!evidence.identifiersAndPrivateBoundaries.localPathsAbsent) {
    findings.push("local path absence proof is required");
  }
  if (!evidence.identifiersAndPrivateBoundaries.machineNamesAbsent) {
    findings.push("machine name absence proof is required");
  }
  if (!evidence.identifiersAndPrivateBoundaries.privateUrlsAbsent) {
    findings.push("private URL absence proof is required");
  }
  if (!evidence.identifiersAndPrivateBoundaries.privateLeadershipSystemMaterialAbsent) {
    findings.push("private compatible leadership system material absence proof is required");
  }
  if (!evidence.identifiersAndPrivateBoundaries.hiddenLeadershipSystemApisAbsent) {
    findings.push("hidden private leadership-only API absence proof is required");
  }
}

function validateCalendarTaskMinimization(
  evidence: FinalPrivacyAuditEvidence,
  findings: string[]
): void {
  if (!evidence.calendarTaskMinimization.calendarTitlesSanitized) {
    findings.push("calendar title sanitization proof is required");
  }
  if (!evidence.calendarTaskMinimization.attendeesLocationsDescriptionsSanitized) {
    findings.push("attendee, location, and description sanitization proof is required");
  }
  if (!evidence.calendarTaskMinimization.taskTitlesDescriptionsSanitized) {
    findings.push("task title and description sanitization proof is required");
  }
  if (!evidence.calendarTaskMinimization.deadlinesAndSourceMetadataMinimized) {
    findings.push("deadline and source metadata minimization proof is required");
  }
  if (!evidence.calendarTaskMinimization.publicEventPayloadsMinimized) {
    findings.push("public event payload minimization proof is required");
  }
  if (!evidence.calendarTaskMinimization.providerTokensExcluded) {
    findings.push("provider token exclusion proof is required");
  }
}

function validateAiAndAutomationBoundary(
  evidence: FinalPrivacyAuditEvidence,
  findings: string[]
): void {
  if (!evidence.aiAndAutomationBoundary.optionalAiInputsReviewed) {
    findings.push("optional AI input privacy review is required");
  }
  if (!evidence.aiAndAutomationBoundary.optionalAiOutputsReviewed) {
    findings.push("optional AI output privacy review is required");
  }
  if (!evidence.aiAndAutomationBoundary.promptsReviewed) {
    findings.push("prompt privacy review is required");
  }
  if (!evidence.aiAndAutomationBoundary.tracesLogsReviewed) {
    findings.push("AI trace/log privacy review is required");
  }
  if (!evidence.aiAndAutomationBoundary.noPrivateOwnerData) {
    findings.push("private owner data absence proof is required");
  }
  if (!evidence.aiAndAutomationBoundary.noCommercialLeadershipSystemScoringLogic) {
    findings.push("commercial compatible leadership system scoring logic absence proof is required");
  }
}

function validateRightsAndLifecycle(
  evidence: FinalPrivacyAuditEvidence,
  findings: string[]
): void {
  if (!evidence.rightsAndLifecycle.retentionReviewed) {
    findings.push("retention privacy review is required");
  }
  if (!evidence.rightsAndLifecycle.exportReviewed) {
    findings.push("export privacy review is required");
  }
  if (!evidence.rightsAndLifecycle.deletionReviewed) {
    findings.push("deletion privacy review is required");
  }
  if (!evidence.rightsAndLifecycle.providerRevocationReviewed) {
    findings.push("provider revocation privacy review is required");
  }
  if (!evidence.rightsAndLifecycle.destructiveOperationApprovalReviewed) {
    findings.push("destructive-operation approval privacy review is required");
  }
  if (!evidence.rightsAndLifecycle.rollbackReviewed) {
    findings.push("rollback privacy review is required");
  }
}

function validateFinalReleaseAlignment(
  evidence: FinalPrivacyAuditEvidence,
  findings: string[]
): void {
  if (!evidence.finalReleaseAlignment.cleanPublicHistoryReviewed) {
    findings.push("clean public history privacy review is required");
  }
  if (!evidence.finalReleaseAlignment.remoteCiPrivacyProof) {
    findings.push("remote CI privacy proof is required");
  }
  if (!evidence.finalReleaseAlignment.securityAuditPass) {
    findings.push("final security audit PASS evidence is required");
  }
  if (!evidence.finalReleaseAlignment.licensingAuditPass) {
    findings.push("final licensing audit PASS evidence is required");
  }
  if (!evidence.finalReleaseAlignment.securityPolicyContactConfigured) {
    findings.push("security policy contact configuration proof is required");
  }
  if (!evidence.finalReleaseAlignment.publicRepositorySettingsReviewed) {
    findings.push("public repository settings privacy review is required");
  }
  if (!evidence.finalReleaseAlignment.secondOperatorReview) {
    findings.push("second operator privacy audit review is required");
  }
}
