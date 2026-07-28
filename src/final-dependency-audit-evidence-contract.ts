export type FinalDependencyAuditPackageManager = "NPM";

export interface FinalDependencyAuditEvidence {
  environment: string;
  packageManager: {
    name: FinalDependencyAuditPackageManager;
    packageJsonReviewed: boolean;
    lockfileReviewed: boolean;
    lockfileMatchesManifest: boolean;
    lockfileFrozen: boolean;
    cleanInstallReproduced: boolean;
  };
  productionAudit: {
    command: string;
    omitDevDependencies: boolean;
    highSeverityThreshold: boolean;
    zeroHighSeverityVulnerabilities: boolean;
    advisoryOutputRetained: boolean;
  };
  installedTree: {
    command: string;
    productionTreeAttached: boolean;
    optionalDependencyReview: boolean;
    duplicateDependencyReview: boolean;
    transitiveRiskReview: boolean;
  };
  runtimeInventory: {
    productionRuntimeDependenciesReviewed: boolean;
    nodeVersionRecorded: boolean;
    packageScriptsReviewed: boolean;
    dockerAndCiInstallReviewed: boolean;
  };
  devDependencyBoundary: {
    devDependenciesExcludedFromRuntime: boolean;
    buildOnlyToolsIdentified: boolean;
    testOnlyToolsIdentified: boolean;
    noDevServerRequiredInProduction: boolean;
  };
  overrideAndRegistryReview: {
    overridesReviewed: boolean;
    noUnreviewedOverrides: boolean;
    noVendoredDependencySubstitutions: boolean;
    noPrivateRegistryUrls: boolean;
    noRegistryTokens: boolean;
    npmConfigReviewed: boolean;
  };
  releaseAlignment: {
    licenseCheckPass: boolean;
    releaseSafetyPass: boolean;
    securityAuditPass: boolean;
    privacyAuditPass: boolean;
    licensingAuditPass: boolean;
    remoteCiProof: boolean;
    secondOperatorReview: boolean;
  };
}

export interface FinalDependencyAuditEvidenceValidation {
  ok: boolean;
  findings: string[];
}

export function validateFinalDependencyAuditEvidence(
  evidence: FinalDependencyAuditEvidence
): FinalDependencyAuditEvidenceValidation {
  const findings: string[] = [];

  if (!evidence.environment.trim()) {
    findings.push("final dependency audit environment is required");
  }

  validatePackageManager(evidence, findings);
  validateProductionAudit(evidence, findings);
  validateInstalledTree(evidence, findings);
  validateRuntimeInventory(evidence, findings);
  validateDevDependencyBoundary(evidence, findings);
  validateOverrideAndRegistryReview(evidence, findings);
  validateReleaseAlignment(evidence, findings);

  return {
    ok: findings.length === 0,
    findings
  };
}

function validatePackageManager(
  evidence: FinalDependencyAuditEvidence,
  findings: string[]
): void {
  if (evidence.packageManager.name !== "NPM") {
    findings.push("final dependency audit package manager must be npm");
  }
  if (!evidence.packageManager.packageJsonReviewed) {
    findings.push("package.json review is required");
  }
  if (!evidence.packageManager.lockfileReviewed) {
    findings.push("package-lock.json review is required");
  }
  if (!evidence.packageManager.lockfileMatchesManifest) {
    findings.push("package-lock.json must match package.json");
  }
  if (!evidence.packageManager.lockfileFrozen) {
    findings.push("release-candidate lockfile freeze proof is required");
  }
  if (!evidence.packageManager.cleanInstallReproduced) {
    findings.push("clean install reproducibility proof is required");
  }
}

function validateProductionAudit(
  evidence: FinalDependencyAuditEvidence,
  findings: string[]
): void {
  if (evidence.productionAudit.command !== "npm audit --omit=dev --audit-level=high") {
    findings.push("production dependency audit command must be npm audit --omit=dev --audit-level=high");
  }
  if (!evidence.productionAudit.omitDevDependencies) {
    findings.push("production dependency audit must omit dev dependencies");
  }
  if (!evidence.productionAudit.highSeverityThreshold) {
    findings.push("production dependency audit must use high severity threshold");
  }
  if (!evidence.productionAudit.zeroHighSeverityVulnerabilities) {
    findings.push("production dependency audit must show zero high-severity vulnerabilities");
  }
  if (!evidence.productionAudit.advisoryOutputRetained) {
    findings.push("production dependency audit advisory output must be retained");
  }
}

function validateInstalledTree(
  evidence: FinalDependencyAuditEvidence,
  findings: string[]
): void {
  if (evidence.installedTree.command !== "npm ls --omit=dev --all") {
    findings.push("installed production dependency tree command must be npm ls --omit=dev --all");
  }
  if (!evidence.installedTree.productionTreeAttached) {
    findings.push("installed production dependency tree evidence is required");
  }
  if (!evidence.installedTree.optionalDependencyReview) {
    findings.push("optional dependency review is required");
  }
  if (!evidence.installedTree.duplicateDependencyReview) {
    findings.push("duplicate dependency review is required");
  }
  if (!evidence.installedTree.transitiveRiskReview) {
    findings.push("transitive dependency risk review is required");
  }
}

function validateRuntimeInventory(
  evidence: FinalDependencyAuditEvidence,
  findings: string[]
): void {
  if (!evidence.runtimeInventory.productionRuntimeDependenciesReviewed) {
    findings.push("production runtime dependency inventory review is required");
  }
  if (!evidence.runtimeInventory.nodeVersionRecorded) {
    findings.push("Node.js runtime version evidence is required");
  }
  if (!evidence.runtimeInventory.packageScriptsReviewed) {
    findings.push("package scripts dependency boundary review is required");
  }
  if (!evidence.runtimeInventory.dockerAndCiInstallReviewed) {
    findings.push("Docker and CI install dependency review is required");
  }
}

function validateDevDependencyBoundary(
  evidence: FinalDependencyAuditEvidence,
  findings: string[]
): void {
  if (!evidence.devDependencyBoundary.devDependenciesExcludedFromRuntime) {
    findings.push("dev dependencies must be excluded from production runtime");
  }
  if (!evidence.devDependencyBoundary.buildOnlyToolsIdentified) {
    findings.push("build-only tools must be identified");
  }
  if (!evidence.devDependencyBoundary.testOnlyToolsIdentified) {
    findings.push("test-only tools must be identified");
  }
  if (!evidence.devDependencyBoundary.noDevServerRequiredInProduction) {
    findings.push("production runtime must not require dev server dependencies");
  }
}

function validateOverrideAndRegistryReview(
  evidence: FinalDependencyAuditEvidence,
  findings: string[]
): void {
  if (!evidence.overrideAndRegistryReview.overridesReviewed) {
    findings.push("dependency override review is required");
  }
  if (!evidence.overrideAndRegistryReview.noUnreviewedOverrides) {
    findings.push("unreviewed dependency overrides must be absent");
  }
  if (!evidence.overrideAndRegistryReview.noVendoredDependencySubstitutions) {
    findings.push("vendored dependency substitutions must be absent or reviewed");
  }
  if (!evidence.overrideAndRegistryReview.noPrivateRegistryUrls) {
    findings.push("private registry URLs must be absent");
  }
  if (!evidence.overrideAndRegistryReview.noRegistryTokens) {
    findings.push("registry tokens must be absent");
  }
  if (!evidence.overrideAndRegistryReview.npmConfigReviewed) {
    findings.push("npm registry configuration review is required");
  }
}

function validateReleaseAlignment(
  evidence: FinalDependencyAuditEvidence,
  findings: string[]
): void {
  if (!evidence.releaseAlignment.licenseCheckPass) {
    findings.push("license check PASS evidence is required");
  }
  if (!evidence.releaseAlignment.releaseSafetyPass) {
    findings.push("release safety PASS evidence is required");
  }
  if (!evidence.releaseAlignment.securityAuditPass) {
    findings.push("final security audit PASS evidence is required");
  }
  if (!evidence.releaseAlignment.privacyAuditPass) {
    findings.push("final privacy audit PASS evidence is required");
  }
  if (!evidence.releaseAlignment.licensingAuditPass) {
    findings.push("final licensing audit PASS evidence is required");
  }
  if (!evidence.releaseAlignment.remoteCiProof) {
    findings.push("remote CI dependency audit proof is required");
  }
  if (!evidence.releaseAlignment.secondOperatorReview) {
    findings.push("second operator dependency audit review is required");
  }
}
