import test from "node:test";
import assert from "node:assert/strict";

import {
  type ProductionProviderCsvEvidence,
  validateProductionProviderCsvEvidence
} from "./production-provider-csv-evidence-contract.js";

const completeEvidence = (): ProductionProviderCsvEvidence => ({
  environment: "production_demo",
  providerFixtures: {
    providers: [
      "TODOIST",
      "LINEAR",
      "ASANA",
      "CLICKUP",
      "TRELLO",
      "MICROSOFT_PLANNER",
      "GITHUB_ISSUES"
    ],
    sanitizedFixturesOnly: true,
    realExportShapeReviewed: true,
    documentedFictionalFallbacks: true,
    largeFixtureSuite: true,
    duplicateRowFixture: true,
    malformedRowFixture: true
  },
  workflow: {
    steps: [
      "TEMPLATE_DOWNLOAD",
      "USER_UPLOAD",
      "DRY_RUN_PREVIEW",
      "VALIDATION_ERRORS",
      "CONFIRMATION_ACKNOWLEDGEMENT",
      "CANCEL_NO_MUTATION",
      "IMPORT_SUCCESS",
      "IMPORT_FAILURE",
      "RETRY_SAFE_REIMPORT"
    ],
    previewBeforeMutation: true,
    explicitImportConfirmation: true,
    cancellationNoMutation: true,
    retrySafeBehavior: true,
    providerSpecificMappingReview: true
  },
  confirmationUx: {
    providerNameShown: true,
    fieldMappingShown: true,
    rowCountsShown: true,
    skippedRowsShown: true,
    riskyRowsShown: true,
    throttlePolicyShown: true,
    formulaInjectionWarningShown: true,
    remainingProductionCaveatsShown: true
  },
  quotaAndAbuse: {
    providerQuotaGovernance: true,
    perProviderRowLimits: true,
    importFrequencyLimits: true,
    operatorVisibility: true,
    alertThresholdsReviewed: true,
    hostedAbuseAnalytics: true,
    suspiciousPatternSignals: [
      "DENIED_ROW_SPIKE",
      "REPEATED_IMPORT_ATTEMPTS",
      "OVERSIZED_FILE",
      "FORMULA_LIKE_ROWS",
      "UNKNOWN_PROVIDER_COLUMNS",
      "DUPLICATE_ROW_SPIKE"
    ]
  },
  browserProof: {
    desktopWorkflow: true,
    mobileWorkflow: true,
    keyboardNavigation: true,
    screenReaderLabels: true,
    errorSummary: true,
    noHiddenDestructiveAction: true
  },
  privacy: {
    formulaInjectionRegression: true,
    fieldMappingPrivacy: true,
    excludesPrivateTaskTitles: true,
    excludesRawCsvRows: true,
    excludesUploadedFilenames: true,
    excludesLocalPaths: true,
    excludesProviderAccountIdentifiers: true,
    contentMinimizedLogs: true
  },
  operations: {
    remoteCiProof: true,
    rollbackPlan: true,
    importDisableProcedure: true,
    importedRowCleanupPlan: true,
    securityAuditPass: true,
    privacyAuditPass: true,
    licensingAuditPass: true,
    operatorApproval: true,
    secondOperatorReview: true
  }
});

test("production provider CSV evidence accepts complete release-grade evidence shape", () => {
  const result = validateProductionProviderCsvEvidence(completeEvidence());

  assert.equal(result.ok, true);
  assert.deepEqual(result.findings, []);
});

test("production provider CSV evidence rejects missing provider fixture proof", () => {
  const evidence = completeEvidence();
  evidence.providerFixtures.providers = ["TODOIST", "LINEAR"];
  evidence.providerFixtures.sanitizedFixturesOnly = false;
  evidence.providerFixtures.realExportShapeReviewed = false;
  evidence.providerFixtures.documentedFictionalFallbacks = false;
  evidence.providerFixtures.largeFixtureSuite = false;

  const result = validateProductionProviderCsvEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /ASANA/);
  assert.match(result.findings.join("\n"), /sanitized/);
  assert.match(result.findings.join("\n"), /real export shape/);
  assert.match(result.findings.join("\n"), /fictional fallback/);
  assert.match(result.findings.join("\n"), /large fixture/);
});

test("production provider CSV evidence rejects unsafe download upload workflow", () => {
  const evidence = completeEvidence();
  evidence.workflow.steps = ["TEMPLATE_DOWNLOAD", "USER_UPLOAD", "IMPORT_SUCCESS"];
  evidence.workflow.previewBeforeMutation = false;
  evidence.workflow.explicitImportConfirmation = false;
  evidence.workflow.cancellationNoMutation = false;
  evidence.workflow.retrySafeBehavior = false;
  evidence.workflow.providerSpecificMappingReview = false;

  const result = validateProductionProviderCsvEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /DRY_RUN_PREVIEW/);
  assert.match(result.findings.join("\n"), /VALIDATION_ERRORS/);
  assert.match(result.findings.join("\n"), /preview before mutation/);
  assert.match(result.findings.join("\n"), /explicit confirmation/);
  assert.match(result.findings.join("\n"), /cancellation/);
  assert.match(result.findings.join("\n"), /retry-safe/);
  assert.match(result.findings.join("\n"), /provider-specific mapping/);
});

test("production provider CSV evidence rejects missing confirmation quota abuse proof", () => {
  const evidence = completeEvidence();
  evidence.confirmationUx.providerNameShown = false;
  evidence.confirmationUx.fieldMappingShown = false;
  evidence.confirmationUx.formulaInjectionWarningShown = false;
  evidence.quotaAndAbuse.providerQuotaGovernance = false;
  evidence.quotaAndAbuse.hostedAbuseAnalytics = false;
  evidence.quotaAndAbuse.suspiciousPatternSignals = ["DENIED_ROW_SPIKE"];

  const result = validateProductionProviderCsvEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /provider name/);
  assert.match(result.findings.join("\n"), /field mapping/);
  assert.match(result.findings.join("\n"), /formula-injection warning/);
  assert.match(result.findings.join("\n"), /quota governance/);
  assert.match(result.findings.join("\n"), /hosted abuse analytics/);
  assert.match(result.findings.join("\n"), /OVERSIZED_FILE/);
});

test("production provider CSV evidence rejects missing browser privacy operations proof", () => {
  const evidence = completeEvidence();
  evidence.browserProof.desktopWorkflow = false;
  evidence.browserProof.keyboardNavigation = false;
  evidence.privacy.formulaInjectionRegression = false;
  evidence.privacy.excludesRawCsvRows = false;
  evidence.privacy.excludesLocalPaths = false;
  evidence.operations.remoteCiProof = false;
  evidence.operations.rollbackPlan = false;
  evidence.operations.securityAuditPass = false;
  evidence.operations.secondOperatorReview = false;

  const result = validateProductionProviderCsvEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /desktop browser/);
  assert.match(result.findings.join("\n"), /keyboard navigation/);
  assert.match(result.findings.join("\n"), /formula-injection regression/);
  assert.match(result.findings.join("\n"), /raw CSV rows/);
  assert.match(result.findings.join("\n"), /local paths/);
  assert.match(result.findings.join("\n"), /remote CI/);
  assert.match(result.findings.join("\n"), /rollback/);
  assert.match(result.findings.join("\n"), /security audit/);
  assert.match(result.findings.join("\n"), /second operator/);
});
