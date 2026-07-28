export interface FinalLicensingAuditEvidence {
  environment: string;
  rootLicense: {
    packageMetadataApache2: boolean;
    licenseFileApache2: boolean;
    readmeLicenseConsistent: boolean;
    packagePublicationMetadataReviewed: boolean;
    repositorySettingsReviewed: boolean;
  };
  dependencyLicenses: {
    finalLicenseCheckPass: boolean;
    packageLockReviewed: boolean;
    installedDependencyMetadataReviewed: boolean;
    productionDependencyTreeReviewed: boolean;
    allowedLicensesOnly: boolean;
    transitiveLicensesReviewed: boolean;
  };
  sourceAndDocumentationReuse: {
    copiedSourceScanPass: boolean;
    documentationReuseScanPass: boolean;
    thirdPartySnippetsAbsentOrApproved: boolean;
    generatedSummariesReviewed: boolean;
    screenshotsDiagramsReviewed: boolean;
    attributionRequirementsRecorded: boolean;
  };
  fixturesAssetsAndBinaries: {
    fixturesTemplatesExamplesReviewed: boolean;
    samplesFictionalAndProjectOwned: boolean;
    assetsMediaFontsIconsReviewed: boolean;
    binaryArtifactsAbsentOrApproved: boolean;
    sourceMapsCoverageReviewed: boolean;
  };
  reusedMaterialInventory: {
    inventoryComplete: boolean;
    projectVersionCommitRecorded: boolean;
    licenseRecorded: boolean;
    usageTypeRecorded: boolean;
    copiedVsReferencedRecorded: boolean;
    attributionRecorded: boolean;
    finalApprovalRecorded: boolean;
  };
  noticeAndDistribution: {
    noticeRequirementReviewed: boolean;
    noticeFileAddedWhenRequired: boolean;
    noticeAbsenceApprovedWhenUnneeded: boolean;
    distributionArtifactsReviewed: boolean;
    packageTarballReviewed: boolean;
  };
  finalReleaseAlignment: {
    releaseCandidateFrozen: boolean;
    dependencyAuditPass: boolean;
    securityAuditPass: boolean;
    privacyAuditPass: boolean;
    remoteCiLicenseProof: boolean;
    cleanPublicHistoryReviewed: boolean;
    secondOperatorReview: boolean;
  };
}

export interface FinalLicensingAuditEvidenceValidation {
  ok: boolean;
  findings: string[];
}

export function validateFinalLicensingAuditEvidence(
  evidence: FinalLicensingAuditEvidence
): FinalLicensingAuditEvidenceValidation {
  const findings: string[] = [];

  if (!evidence.environment.trim()) {
    findings.push("final licensing audit environment is required");
  }

  validateRootLicense(evidence, findings);
  validateDependencyLicenses(evidence, findings);
  validateSourceAndDocumentationReuse(evidence, findings);
  validateFixturesAssetsAndBinaries(evidence, findings);
  validateReusedMaterialInventory(evidence, findings);
  validateNoticeAndDistribution(evidence, findings);
  validateFinalReleaseAlignment(evidence, findings);

  return {
    ok: findings.length === 0,
    findings
  };
}

function validateRootLicense(
  evidence: FinalLicensingAuditEvidence,
  findings: string[]
): void {
  if (!evidence.rootLicense.packageMetadataApache2) {
    findings.push("package metadata must declare Apache-2.0");
  }
  if (!evidence.rootLicense.licenseFileApache2) {
    findings.push("root LICENSE must contain Apache-2.0 text");
  }
  if (!evidence.rootLicense.readmeLicenseConsistent) {
    findings.push("README license reference must match Apache-2.0");
  }
  if (!evidence.rootLicense.packagePublicationMetadataReviewed) {
    findings.push("package publication metadata license review is required");
  }
  if (!evidence.rootLicense.repositorySettingsReviewed) {
    findings.push("repository settings license review is required");
  }
}

function validateDependencyLicenses(
  evidence: FinalLicensingAuditEvidence,
  findings: string[]
): void {
  if (!evidence.dependencyLicenses.finalLicenseCheckPass) {
    findings.push("final npm run license:check PASS evidence is required");
  }
  if (!evidence.dependencyLicenses.packageLockReviewed) {
    findings.push("package-lock dependency license review is required");
  }
  if (!evidence.dependencyLicenses.installedDependencyMetadataReviewed) {
    findings.push("installed dependency metadata review is required");
  }
  if (!evidence.dependencyLicenses.productionDependencyTreeReviewed) {
    findings.push("production dependency tree license review is required");
  }
  if (!evidence.dependencyLicenses.allowedLicensesOnly) {
    findings.push("dependency licenses must be limited to approved licenses");
  }
  if (!evidence.dependencyLicenses.transitiveLicensesReviewed) {
    findings.push("transitive dependency license review is required");
  }
}

function validateSourceAndDocumentationReuse(
  evidence: FinalLicensingAuditEvidence,
  findings: string[]
): void {
  if (!evidence.sourceAndDocumentationReuse.copiedSourceScanPass) {
    findings.push("copied-source scan PASS evidence is required");
  }
  if (!evidence.sourceAndDocumentationReuse.documentationReuseScanPass) {
    findings.push("documentation reuse scan PASS evidence is required");
  }
  if (!evidence.sourceAndDocumentationReuse.thirdPartySnippetsAbsentOrApproved) {
    findings.push("third-party snippets must be absent or approved");
  }
  if (!evidence.sourceAndDocumentationReuse.generatedSummariesReviewed) {
    findings.push("generated summaries license review is required");
  }
  if (!evidence.sourceAndDocumentationReuse.screenshotsDiagramsReviewed) {
    findings.push("screenshots and diagrams license review is required");
  }
  if (!evidence.sourceAndDocumentationReuse.attributionRequirementsRecorded) {
    findings.push("attribution requirements must be recorded");
  }
}

function validateFixturesAssetsAndBinaries(
  evidence: FinalLicensingAuditEvidence,
  findings: string[]
): void {
  if (!evidence.fixturesAssetsAndBinaries.fixturesTemplatesExamplesReviewed) {
    findings.push("fixture, template, and example license review is required");
  }
  if (!evidence.fixturesAssetsAndBinaries.samplesFictionalAndProjectOwned) {
    findings.push("sample material must be fictional and project-owned");
  }
  if (!evidence.fixturesAssetsAndBinaries.assetsMediaFontsIconsReviewed) {
    findings.push("asset, media, font, and icon license review is required");
  }
  if (!evidence.fixturesAssetsAndBinaries.binaryArtifactsAbsentOrApproved) {
    findings.push("binary artifacts must be absent or approved");
  }
  if (!evidence.fixturesAssetsAndBinaries.sourceMapsCoverageReviewed) {
    findings.push("source map and coverage output license review is required");
  }
}

function validateReusedMaterialInventory(
  evidence: FinalLicensingAuditEvidence,
  findings: string[]
): void {
  if (!evidence.reusedMaterialInventory.inventoryComplete) {
    findings.push("reused-material inventory must be complete");
  }
  if (!evidence.reusedMaterialInventory.projectVersionCommitRecorded) {
    findings.push("reused-material project version or commit must be recorded");
  }
  if (!evidence.reusedMaterialInventory.licenseRecorded) {
    findings.push("reused-material license must be recorded");
  }
  if (!evidence.reusedMaterialInventory.usageTypeRecorded) {
    findings.push("reused-material usage type must be recorded");
  }
  if (!evidence.reusedMaterialInventory.copiedVsReferencedRecorded) {
    findings.push("reused-material copied versus referenced status must be recorded");
  }
  if (!evidence.reusedMaterialInventory.attributionRecorded) {
    findings.push("reused-material attribution must be recorded");
  }
  if (!evidence.reusedMaterialInventory.finalApprovalRecorded) {
    findings.push("reused-material final approval must be recorded");
  }
}

function validateNoticeAndDistribution(
  evidence: FinalLicensingAuditEvidence,
  findings: string[]
): void {
  if (!evidence.noticeAndDistribution.noticeRequirementReviewed) {
    findings.push("NOTICE requirement review is required");
  }
  if (!evidence.noticeAndDistribution.noticeFileAddedWhenRequired) {
    findings.push("NOTICE file must be added when required");
  }
  if (!evidence.noticeAndDistribution.noticeAbsenceApprovedWhenUnneeded) {
    findings.push("NOTICE absence must be approved when unneeded");
  }
  if (!evidence.noticeAndDistribution.distributionArtifactsReviewed) {
    findings.push("distribution artifact license review is required");
  }
  if (!evidence.noticeAndDistribution.packageTarballReviewed) {
    findings.push("package tarball license review is required");
  }
}

function validateFinalReleaseAlignment(
  evidence: FinalLicensingAuditEvidence,
  findings: string[]
): void {
  if (!evidence.finalReleaseAlignment.releaseCandidateFrozen) {
    findings.push("final release-candidate freeze proof is required");
  }
  if (!evidence.finalReleaseAlignment.dependencyAuditPass) {
    findings.push("dependency audit PASS evidence is required");
  }
  if (!evidence.finalReleaseAlignment.securityAuditPass) {
    findings.push("final security audit PASS evidence is required");
  }
  if (!evidence.finalReleaseAlignment.privacyAuditPass) {
    findings.push("final privacy audit PASS evidence is required");
  }
  if (!evidence.finalReleaseAlignment.remoteCiLicenseProof) {
    findings.push("remote CI licensing proof is required");
  }
  if (!evidence.finalReleaseAlignment.cleanPublicHistoryReviewed) {
    findings.push("clean public history licensing review is required");
  }
  if (!evidence.finalReleaseAlignment.secondOperatorReview) {
    findings.push("second operator licensing audit review is required");
  }
}
