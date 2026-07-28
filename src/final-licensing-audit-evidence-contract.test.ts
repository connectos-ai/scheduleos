import test from "node:test";
import assert from "node:assert/strict";

import {
  type FinalLicensingAuditEvidence,
  validateFinalLicensingAuditEvidence
} from "./final-licensing-audit-evidence-contract.js";

const completeEvidence = (): FinalLicensingAuditEvidence => ({
  environment: "release_candidate_demo",
  rootLicense: {
    packageMetadataApache2: true,
    licenseFileApache2: true,
    readmeLicenseConsistent: true,
    packagePublicationMetadataReviewed: true,
    repositorySettingsReviewed: true
  },
  dependencyLicenses: {
    finalLicenseCheckPass: true,
    packageLockReviewed: true,
    installedDependencyMetadataReviewed: true,
    productionDependencyTreeReviewed: true,
    allowedLicensesOnly: true,
    transitiveLicensesReviewed: true
  },
  sourceAndDocumentationReuse: {
    copiedSourceScanPass: true,
    documentationReuseScanPass: true,
    thirdPartySnippetsAbsentOrApproved: true,
    generatedSummariesReviewed: true,
    screenshotsDiagramsReviewed: true,
    attributionRequirementsRecorded: true
  },
  fixturesAssetsAndBinaries: {
    fixturesTemplatesExamplesReviewed: true,
    samplesFictionalAndProjectOwned: true,
    assetsMediaFontsIconsReviewed: true,
    binaryArtifactsAbsentOrApproved: true,
    sourceMapsCoverageReviewed: true
  },
  reusedMaterialInventory: {
    inventoryComplete: true,
    projectVersionCommitRecorded: true,
    licenseRecorded: true,
    usageTypeRecorded: true,
    copiedVsReferencedRecorded: true,
    attributionRecorded: true,
    finalApprovalRecorded: true
  },
  noticeAndDistribution: {
    noticeRequirementReviewed: true,
    noticeFileAddedWhenRequired: true,
    noticeAbsenceApprovedWhenUnneeded: true,
    distributionArtifactsReviewed: true,
    packageTarballReviewed: true
  },
  finalReleaseAlignment: {
    releaseCandidateFrozen: true,
    dependencyAuditPass: true,
    securityAuditPass: true,
    privacyAuditPass: true,
    remoteCiLicenseProof: true,
    cleanPublicHistoryReviewed: true,
    secondOperatorReview: true
  }
});

test("final licensing audit evidence accepts complete release-grade evidence shape", () => {
  const result = validateFinalLicensingAuditEvidence(completeEvidence());

  assert.equal(result.ok, true);
  assert.deepEqual(result.findings, []);
});

test("final licensing audit evidence rejects missing root and dependency proof", () => {
  const evidence = completeEvidence();
  evidence.environment = "";
  evidence.rootLicense.packageMetadataApache2 = false;
  evidence.rootLicense.licenseFileApache2 = false;
  evidence.dependencyLicenses.finalLicenseCheckPass = false;
  evidence.dependencyLicenses.installedDependencyMetadataReviewed = false;
  evidence.dependencyLicenses.allowedLicensesOnly = false;

  const result = validateFinalLicensingAuditEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /environment/);
  assert.match(result.findings.join("\n"), /package metadata/);
  assert.match(result.findings.join("\n"), /root LICENSE/);
  assert.match(result.findings.join("\n"), /license:check/);
  assert.match(result.findings.join("\n"), /installed dependency metadata/);
  assert.match(result.findings.join("\n"), /approved licenses/);
});

test("final licensing audit evidence rejects copied material and artifact gaps", () => {
  const evidence = completeEvidence();
  evidence.sourceAndDocumentationReuse.copiedSourceScanPass = false;
  evidence.sourceAndDocumentationReuse.documentationReuseScanPass = false;
  evidence.sourceAndDocumentationReuse.thirdPartySnippetsAbsentOrApproved = false;
  evidence.fixturesAssetsAndBinaries.fixturesTemplatesExamplesReviewed = false;
  evidence.fixturesAssetsAndBinaries.samplesFictionalAndProjectOwned = false;
  evidence.fixturesAssetsAndBinaries.binaryArtifactsAbsentOrApproved = false;

  const result = validateFinalLicensingAuditEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /copied-source/);
  assert.match(result.findings.join("\n"), /documentation reuse/);
  assert.match(result.findings.join("\n"), /third-party snippets/);
  assert.match(result.findings.join("\n"), /fixture, template, and example/);
  assert.match(result.findings.join("\n"), /fictional and project-owned/);
  assert.match(result.findings.join("\n"), /binary artifacts/);
});

test("final licensing audit evidence rejects incomplete reused-material and NOTICE proof", () => {
  const evidence = completeEvidence();
  evidence.reusedMaterialInventory.inventoryComplete = false;
  evidence.reusedMaterialInventory.projectVersionCommitRecorded = false;
  evidence.reusedMaterialInventory.licenseRecorded = false;
  evidence.reusedMaterialInventory.copiedVsReferencedRecorded = false;
  evidence.noticeAndDistribution.noticeRequirementReviewed = false;
  evidence.noticeAndDistribution.noticeFileAddedWhenRequired = false;
  evidence.noticeAndDistribution.noticeAbsenceApprovedWhenUnneeded = false;

  const result = validateFinalLicensingAuditEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /reused-material inventory/);
  assert.match(result.findings.join("\n"), /version or commit/);
  assert.match(result.findings.join("\n"), /license must be recorded/);
  assert.match(result.findings.join("\n"), /copied versus referenced/);
  assert.match(result.findings.join("\n"), /NOTICE requirement/);
  assert.match(result.findings.join("\n"), /NOTICE file/);
  assert.match(result.findings.join("\n"), /NOTICE absence/);
});

test("final licensing audit evidence rejects missing final release alignment", () => {
  const evidence = completeEvidence();
  evidence.finalReleaseAlignment.releaseCandidateFrozen = false;
  evidence.finalReleaseAlignment.dependencyAuditPass = false;
  evidence.finalReleaseAlignment.securityAuditPass = false;
  evidence.finalReleaseAlignment.privacyAuditPass = false;
  evidence.finalReleaseAlignment.remoteCiLicenseProof = false;
  evidence.finalReleaseAlignment.cleanPublicHistoryReviewed = false;
  evidence.finalReleaseAlignment.secondOperatorReview = false;

  const result = validateFinalLicensingAuditEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /release-candidate freeze/);
  assert.match(result.findings.join("\n"), /dependency audit/);
  assert.match(result.findings.join("\n"), /security audit/);
  assert.match(result.findings.join("\n"), /privacy audit/);
  assert.match(result.findings.join("\n"), /remote CI licensing/);
  assert.match(result.findings.join("\n"), /clean public history/);
  assert.match(result.findings.join("\n"), /second operator/);
});
