import test from "node:test";
import assert from "node:assert/strict";

import {
  type FinalPrivacyAuditEvidence,
  validateFinalPrivacyAuditEvidence
} from "./final-privacy-audit-evidence-contract.js";

const completeEvidence = (): FinalPrivacyAuditEvidence => ({
  environment: "release_candidate_demo",
  releaseSurface: {
    releaseSafetyScanPass: true,
    sourceDocsScriptsReviewed: true,
    githubTemplatesReviewed: true,
    packageMetadataReviewed: true,
    generatedDocsReviewed: true
  },
  artifactSanitization: {
    fixturesExamplesSanitized: true,
    generatedArtifactsReviewed: true,
    logsReviewed: true,
    screenshotsReviewed: true,
    exportsReviewed: true,
    backupsReviewed: true,
    localDatabasesExcludedOrSanitized: true,
    sourceMapsCoverageReviewed: true
  },
  identifiersAndPrivateBoundaries: {
    providerIdentifiersMinimized: true,
    tenantWorkspaceUserIdsFictional: true,
    localPathsAbsent: true,
    machineNamesAbsent: true,
    privateUrlsAbsent: true,
    privateLeadershipSystemMaterialAbsent: true,
    hiddenLeadershipSystemApisAbsent: true
  },
  calendarTaskMinimization: {
    calendarTitlesSanitized: true,
    attendeesLocationsDescriptionsSanitized: true,
    taskTitlesDescriptionsSanitized: true,
    deadlinesAndSourceMetadataMinimized: true,
    publicEventPayloadsMinimized: true,
    providerTokensExcluded: true
  },
  aiAndAutomationBoundary: {
    optionalAiInputsReviewed: true,
    optionalAiOutputsReviewed: true,
    promptsReviewed: true,
    tracesLogsReviewed: true,
    noPrivateOwnerData: true,
    noCommercialLeadershipSystemScoringLogic: true
  },
  rightsAndLifecycle: {
    retentionReviewed: true,
    exportReviewed: true,
    deletionReviewed: true,
    providerRevocationReviewed: true,
    destructiveOperationApprovalReviewed: true,
    rollbackReviewed: true
  },
  finalReleaseAlignment: {
    cleanPublicHistoryReviewed: true,
    remoteCiPrivacyProof: true,
    securityAuditPass: true,
    licensingAuditPass: true,
    securityPolicyContactConfigured: true,
    publicRepositorySettingsReviewed: true,
    secondOperatorReview: true
  }
});

test("final privacy audit evidence accepts complete release-grade evidence shape", () => {
  const result = validateFinalPrivacyAuditEvidence(completeEvidence());

  assert.equal(result.ok, true);
  assert.deepEqual(result.findings, []);
});

test("final privacy audit evidence rejects missing release surface and artifact proof", () => {
  const evidence = completeEvidence();
  evidence.environment = "";
  evidence.releaseSurface.releaseSafetyScanPass = false;
  evidence.releaseSurface.githubTemplatesReviewed = false;
  evidence.artifactSanitization.fixturesExamplesSanitized = false;
  evidence.artifactSanitization.screenshotsReviewed = false;
  evidence.artifactSanitization.localDatabasesExcludedOrSanitized = false;

  const result = validateFinalPrivacyAuditEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /environment/);
  assert.match(result.findings.join("\n"), /release safety scan/);
  assert.match(result.findings.join("\n"), /GitHub template/);
  assert.match(result.findings.join("\n"), /fixture and example/);
  assert.match(result.findings.join("\n"), /screenshot/);
  assert.match(result.findings.join("\n"), /local database/);
});

test("final privacy audit evidence rejects private identifiers and weak minimization", () => {
  const evidence = completeEvidence();
  evidence.identifiersAndPrivateBoundaries.providerIdentifiersMinimized = false;
  evidence.identifiersAndPrivateBoundaries.tenantWorkspaceUserIdsFictional = false;
  evidence.identifiersAndPrivateBoundaries.privateLeadershipSystemMaterialAbsent = false;
  evidence.identifiersAndPrivateBoundaries.hiddenLeadershipSystemApisAbsent = false;
  evidence.calendarTaskMinimization.calendarTitlesSanitized = false;
  evidence.calendarTaskMinimization.publicEventPayloadsMinimized = false;
  evidence.calendarTaskMinimization.providerTokensExcluded = false;

  const result = validateFinalPrivacyAuditEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /provider identifier/);
  assert.match(result.findings.join("\n"), /tenant\/workspace\/user/);
  assert.match(result.findings.join("\n"), /private compatible leadership system/);
  assert.match(result.findings.join("\n"), /hidden private leadership-only API/);
  assert.match(result.findings.join("\n"), /calendar title/);
  assert.match(result.findings.join("\n"), /public event payload/);
  assert.match(result.findings.join("\n"), /provider token/);
});

test("final privacy audit evidence rejects missing AI and lifecycle proof", () => {
  const evidence = completeEvidence();
  evidence.aiAndAutomationBoundary.optionalAiInputsReviewed = false;
  evidence.aiAndAutomationBoundary.promptsReviewed = false;
  evidence.aiAndAutomationBoundary.noPrivateOwnerData = false;
  evidence.aiAndAutomationBoundary.noCommercialLeadershipSystemScoringLogic = false;
  evidence.rightsAndLifecycle.retentionReviewed = false;
  evidence.rightsAndLifecycle.providerRevocationReviewed = false;
  evidence.rightsAndLifecycle.rollbackReviewed = false;

  const result = validateFinalPrivacyAuditEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /AI input/);
  assert.match(result.findings.join("\n"), /prompt/);
  assert.match(result.findings.join("\n"), /private owner data/);
  assert.match(result.findings.join("\n"), /commercial compatible leadership system scoring/);
  assert.match(result.findings.join("\n"), /retention/);
  assert.match(result.findings.join("\n"), /provider revocation/);
  assert.match(result.findings.join("\n"), /rollback/);
});

test("final privacy audit evidence rejects missing final release alignment", () => {
  const evidence = completeEvidence();
  evidence.finalReleaseAlignment.cleanPublicHistoryReviewed = false;
  evidence.finalReleaseAlignment.remoteCiPrivacyProof = false;
  evidence.finalReleaseAlignment.securityAuditPass = false;
  evidence.finalReleaseAlignment.licensingAuditPass = false;
  evidence.finalReleaseAlignment.securityPolicyContactConfigured = false;
  evidence.finalReleaseAlignment.publicRepositorySettingsReviewed = false;
  evidence.finalReleaseAlignment.secondOperatorReview = false;

  const result = validateFinalPrivacyAuditEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /clean public history/);
  assert.match(result.findings.join("\n"), /remote CI privacy/);
  assert.match(result.findings.join("\n"), /security audit/);
  assert.match(result.findings.join("\n"), /licensing audit/);
  assert.match(result.findings.join("\n"), /security policy contact/);
  assert.match(result.findings.join("\n"), /public repository settings/);
  assert.match(result.findings.join("\n"), /second operator/);
});
