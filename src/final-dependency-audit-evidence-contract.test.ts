import test from "node:test";
import assert from "node:assert/strict";

import {
  type FinalDependencyAuditEvidence,
  validateFinalDependencyAuditEvidence
} from "./final-dependency-audit-evidence-contract.js";

const completeEvidence = (): FinalDependencyAuditEvidence => ({
  environment: "release_candidate_demo",
  packageManager: {
    name: "NPM",
    packageJsonReviewed: true,
    lockfileReviewed: true,
    lockfileMatchesManifest: true,
    lockfileFrozen: true,
    cleanInstallReproduced: true
  },
  productionAudit: {
    command: "npm audit --omit=dev --audit-level=high",
    omitDevDependencies: true,
    highSeverityThreshold: true,
    zeroHighSeverityVulnerabilities: true,
    advisoryOutputRetained: true
  },
  installedTree: {
    command: "npm ls --omit=dev --all",
    productionTreeAttached: true,
    optionalDependencyReview: true,
    duplicateDependencyReview: true,
    transitiveRiskReview: true
  },
  runtimeInventory: {
    productionRuntimeDependenciesReviewed: true,
    nodeVersionRecorded: true,
    packageScriptsReviewed: true,
    dockerAndCiInstallReviewed: true
  },
  devDependencyBoundary: {
    devDependenciesExcludedFromRuntime: true,
    buildOnlyToolsIdentified: true,
    testOnlyToolsIdentified: true,
    noDevServerRequiredInProduction: true
  },
  overrideAndRegistryReview: {
    overridesReviewed: true,
    noUnreviewedOverrides: true,
    noVendoredDependencySubstitutions: true,
    noPrivateRegistryUrls: true,
    noRegistryTokens: true,
    npmConfigReviewed: true
  },
  releaseAlignment: {
    licenseCheckPass: true,
    releaseSafetyPass: true,
    securityAuditPass: true,
    privacyAuditPass: true,
    licensingAuditPass: true,
    remoteCiProof: true,
    secondOperatorReview: true
  }
});

test("final dependency audit evidence accepts complete release-grade evidence shape", () => {
  const result = validateFinalDependencyAuditEvidence(completeEvidence());

  assert.equal(result.ok, true);
  assert.deepEqual(result.findings, []);
});

test("final dependency audit evidence rejects incomplete package manager proof", () => {
  const evidence = completeEvidence();
  evidence.environment = "";
  evidence.packageManager.packageJsonReviewed = false;
  evidence.packageManager.lockfileMatchesManifest = false;
  evidence.packageManager.lockfileFrozen = false;
  evidence.packageManager.cleanInstallReproduced = false;

  const result = validateFinalDependencyAuditEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /environment/);
  assert.match(result.findings.join("\n"), /package.json/);
  assert.match(result.findings.join("\n"), /package-lock.json must match/);
  assert.match(result.findings.join("\n"), /lockfile freeze/);
  assert.match(result.findings.join("\n"), /clean install/);
});

test("final dependency audit evidence rejects unsafe production audit and tree proof", () => {
  const evidence = completeEvidence();
  evidence.productionAudit.command = "npm audit";
  evidence.productionAudit.omitDevDependencies = false;
  evidence.productionAudit.zeroHighSeverityVulnerabilities = false;
  evidence.productionAudit.advisoryOutputRetained = false;
  evidence.installedTree.command = "npm ls";
  evidence.installedTree.productionTreeAttached = false;
  evidence.installedTree.transitiveRiskReview = false;

  const result = validateFinalDependencyAuditEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /npm audit --omit=dev --audit-level=high/);
  assert.match(result.findings.join("\n"), /omit dev dependencies/);
  assert.match(result.findings.join("\n"), /zero high-severity/);
  assert.match(result.findings.join("\n"), /advisory output/);
  assert.match(result.findings.join("\n"), /npm ls --omit=dev --all/);
  assert.match(result.findings.join("\n"), /production dependency tree/);
  assert.match(result.findings.join("\n"), /transitive dependency/);
});

test("final dependency audit evidence rejects weak runtime and dev dependency boundaries", () => {
  const evidence = completeEvidence();
  evidence.runtimeInventory.productionRuntimeDependenciesReviewed = false;
  evidence.runtimeInventory.nodeVersionRecorded = false;
  evidence.runtimeInventory.packageScriptsReviewed = false;
  evidence.devDependencyBoundary.devDependenciesExcludedFromRuntime = false;
  evidence.devDependencyBoundary.testOnlyToolsIdentified = false;
  evidence.devDependencyBoundary.noDevServerRequiredInProduction = false;

  const result = validateFinalDependencyAuditEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /runtime dependency inventory/);
  assert.match(result.findings.join("\n"), /Node.js runtime version/);
  assert.match(result.findings.join("\n"), /package scripts/);
  assert.match(result.findings.join("\n"), /dev dependencies/);
  assert.match(result.findings.join("\n"), /test-only tools/);
  assert.match(result.findings.join("\n"), /dev server/);
});

test("final dependency audit evidence rejects registry risks and missing final approvals", () => {
  const evidence = completeEvidence();
  evidence.overrideAndRegistryReview.overridesReviewed = false;
  evidence.overrideAndRegistryReview.noUnreviewedOverrides = false;
  evidence.overrideAndRegistryReview.noPrivateRegistryUrls = false;
  evidence.overrideAndRegistryReview.noRegistryTokens = false;
  evidence.releaseAlignment.securityAuditPass = false;
  evidence.releaseAlignment.privacyAuditPass = false;
  evidence.releaseAlignment.remoteCiProof = false;
  evidence.releaseAlignment.secondOperatorReview = false;

  const result = validateFinalDependencyAuditEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /override review/);
  assert.match(result.findings.join("\n"), /unreviewed dependency overrides/);
  assert.match(result.findings.join("\n"), /private registry URLs/);
  assert.match(result.findings.join("\n"), /registry tokens/);
  assert.match(result.findings.join("\n"), /security audit/);
  assert.match(result.findings.join("\n"), /privacy audit/);
  assert.match(result.findings.join("\n"), /remote CI/);
  assert.match(result.findings.join("\n"), /second operator/);
});
