export type ProductionProviderCsvProvider =
  | "TODOIST"
  | "LINEAR"
  | "ASANA"
  | "CLICKUP"
  | "TRELLO"
  | "MICROSOFT_PLANNER"
  | "GITHUB_ISSUES";

export type ProductionProviderCsvWorkflowStep =
  | "TEMPLATE_DOWNLOAD"
  | "USER_UPLOAD"
  | "DRY_RUN_PREVIEW"
  | "VALIDATION_ERRORS"
  | "CONFIRMATION_ACKNOWLEDGEMENT"
  | "CANCEL_NO_MUTATION"
  | "IMPORT_SUCCESS"
  | "IMPORT_FAILURE"
  | "RETRY_SAFE_REIMPORT";

export type ProductionProviderCsvAbuseSignal =
  | "DENIED_ROW_SPIKE"
  | "REPEATED_IMPORT_ATTEMPTS"
  | "OVERSIZED_FILE"
  | "FORMULA_LIKE_ROWS"
  | "UNKNOWN_PROVIDER_COLUMNS"
  | "DUPLICATE_ROW_SPIKE";

export interface ProductionProviderCsvEvidence {
  environment: string;
  providerFixtures: {
    providers: ProductionProviderCsvProvider[];
    sanitizedFixturesOnly: boolean;
    realExportShapeReviewed: boolean;
    documentedFictionalFallbacks: boolean;
    largeFixtureSuite: boolean;
    duplicateRowFixture: boolean;
    malformedRowFixture: boolean;
  };
  workflow: {
    steps: ProductionProviderCsvWorkflowStep[];
    previewBeforeMutation: boolean;
    explicitImportConfirmation: boolean;
    cancellationNoMutation: boolean;
    retrySafeBehavior: boolean;
    providerSpecificMappingReview: boolean;
  };
  confirmationUx: {
    providerNameShown: boolean;
    fieldMappingShown: boolean;
    rowCountsShown: boolean;
    skippedRowsShown: boolean;
    riskyRowsShown: boolean;
    throttlePolicyShown: boolean;
    formulaInjectionWarningShown: boolean;
    remainingProductionCaveatsShown: boolean;
  };
  quotaAndAbuse: {
    providerQuotaGovernance: boolean;
    perProviderRowLimits: boolean;
    importFrequencyLimits: boolean;
    operatorVisibility: boolean;
    alertThresholdsReviewed: boolean;
    hostedAbuseAnalytics: boolean;
    suspiciousPatternSignals: ProductionProviderCsvAbuseSignal[];
  };
  browserProof: {
    desktopWorkflow: boolean;
    mobileWorkflow: boolean;
    keyboardNavigation: boolean;
    screenReaderLabels: boolean;
    errorSummary: boolean;
    noHiddenDestructiveAction: boolean;
  };
  privacy: {
    formulaInjectionRegression: boolean;
    fieldMappingPrivacy: boolean;
    excludesPrivateTaskTitles: boolean;
    excludesRawCsvRows: boolean;
    excludesUploadedFilenames: boolean;
    excludesLocalPaths: boolean;
    excludesProviderAccountIdentifiers: boolean;
    contentMinimizedLogs: boolean;
  };
  operations: {
    remoteCiProof: boolean;
    rollbackPlan: boolean;
    importDisableProcedure: boolean;
    importedRowCleanupPlan: boolean;
    securityAuditPass: boolean;
    privacyAuditPass: boolean;
    licensingAuditPass: boolean;
    operatorApproval: boolean;
    secondOperatorReview: boolean;
  };
}

export interface ProductionProviderCsvEvidenceValidation {
  ok: boolean;
  findings: string[];
}

const REQUIRED_PROVIDERS: ProductionProviderCsvProvider[] = [
  "TODOIST",
  "LINEAR",
  "ASANA",
  "CLICKUP",
  "TRELLO",
  "MICROSOFT_PLANNER",
  "GITHUB_ISSUES"
];

const REQUIRED_WORKFLOW_STEPS: ProductionProviderCsvWorkflowStep[] = [
  "TEMPLATE_DOWNLOAD",
  "USER_UPLOAD",
  "DRY_RUN_PREVIEW",
  "VALIDATION_ERRORS",
  "CONFIRMATION_ACKNOWLEDGEMENT",
  "CANCEL_NO_MUTATION",
  "IMPORT_SUCCESS",
  "IMPORT_FAILURE",
  "RETRY_SAFE_REIMPORT"
];

const REQUIRED_ABUSE_SIGNALS: ProductionProviderCsvAbuseSignal[] = [
  "DENIED_ROW_SPIKE",
  "REPEATED_IMPORT_ATTEMPTS",
  "OVERSIZED_FILE",
  "FORMULA_LIKE_ROWS",
  "UNKNOWN_PROVIDER_COLUMNS",
  "DUPLICATE_ROW_SPIKE"
];

export function validateProductionProviderCsvEvidence(
  evidence: ProductionProviderCsvEvidence
): ProductionProviderCsvEvidenceValidation {
  const findings: string[] = [];

  if (!evidence.environment.trim()) {
    findings.push("production provider CSV evidence environment is required");
  }

  validateProviderFixtures(evidence, findings);
  validateWorkflow(evidence, findings);
  validateConfirmationUx(evidence, findings);
  validateQuotaAndAbuse(evidence, findings);
  validateBrowserProof(evidence, findings);
  validatePrivacy(evidence, findings);
  validateOperations(evidence, findings);

  return {
    ok: findings.length === 0,
    findings
  };
}

function validateProviderFixtures(
  evidence: ProductionProviderCsvEvidence,
  findings: string[]
): void {
  for (const provider of REQUIRED_PROVIDERS) {
    if (!evidence.providerFixtures.providers.includes(provider)) {
      findings.push(`production provider CSV fixture proof must include ${provider}`);
    }
  }
  if (!evidence.providerFixtures.sanitizedFixturesOnly) {
    findings.push("production provider CSV fixture evidence must use sanitized fixtures only");
  }
  if (!evidence.providerFixtures.realExportShapeReviewed) {
    findings.push("production provider CSV real export shape review is required");
  }
  if (!evidence.providerFixtures.documentedFictionalFallbacks) {
    findings.push("production provider CSV fictional fallback policy must be documented");
  }
  if (!evidence.providerFixtures.largeFixtureSuite) {
    findings.push("production provider CSV large fixture suite proof is required");
  }
  if (!evidence.providerFixtures.duplicateRowFixture) {
    findings.push("production provider CSV duplicate row fixture proof is required");
  }
  if (!evidence.providerFixtures.malformedRowFixture) {
    findings.push("production provider CSV malformed row fixture proof is required");
  }
}

function validateWorkflow(
  evidence: ProductionProviderCsvEvidence,
  findings: string[]
): void {
  for (const step of REQUIRED_WORKFLOW_STEPS) {
    if (!evidence.workflow.steps.includes(step)) {
      findings.push(`production provider CSV workflow proof must include ${step}`);
    }
  }
  if (!evidence.workflow.previewBeforeMutation) {
    findings.push("production provider CSV import must preview before mutation");
  }
  if (!evidence.workflow.explicitImportConfirmation) {
    findings.push("production provider CSV import must require explicit confirmation");
  }
  if (!evidence.workflow.cancellationNoMutation) {
    findings.push("production provider CSV cancellation must prove no mutation");
  }
  if (!evidence.workflow.retrySafeBehavior) {
    findings.push("production provider CSV import must prove retry-safe behavior");
  }
  if (!evidence.workflow.providerSpecificMappingReview) {
    findings.push("production provider CSV provider-specific mapping review is required");
  }
}

function validateConfirmationUx(
  evidence: ProductionProviderCsvEvidence,
  findings: string[]
): void {
  if (!evidence.confirmationUx.providerNameShown) {
    findings.push("production provider CSV confirmation must show provider name");
  }
  if (!evidence.confirmationUx.fieldMappingShown) {
    findings.push("production provider CSV confirmation must show field mapping");
  }
  if (!evidence.confirmationUx.rowCountsShown) {
    findings.push("production provider CSV confirmation must show row counts");
  }
  if (!evidence.confirmationUx.skippedRowsShown) {
    findings.push("production provider CSV confirmation must show skipped rows");
  }
  if (!evidence.confirmationUx.riskyRowsShown) {
    findings.push("production provider CSV confirmation must show risky rows");
  }
  if (!evidence.confirmationUx.throttlePolicyShown) {
    findings.push("production provider CSV confirmation must show throttle policy");
  }
  if (!evidence.confirmationUx.formulaInjectionWarningShown) {
    findings.push("production provider CSV confirmation must show formula-injection warning");
  }
  if (!evidence.confirmationUx.remainingProductionCaveatsShown) {
    findings.push("production provider CSV confirmation must show remaining production caveats");
  }
}

function validateQuotaAndAbuse(
  evidence: ProductionProviderCsvEvidence,
  findings: string[]
): void {
  if (!evidence.quotaAndAbuse.providerQuotaGovernance) {
    findings.push("production provider CSV quota governance proof is required");
  }
  if (!evidence.quotaAndAbuse.perProviderRowLimits) {
    findings.push("production provider CSV per-provider row limits are required");
  }
  if (!evidence.quotaAndAbuse.importFrequencyLimits) {
    findings.push("production provider CSV import frequency limits are required");
  }
  if (!evidence.quotaAndAbuse.operatorVisibility) {
    findings.push("production provider CSV operator visibility is required");
  }
  if (!evidence.quotaAndAbuse.alertThresholdsReviewed) {
    findings.push("production provider CSV alert thresholds must be reviewed");
  }
  if (!evidence.quotaAndAbuse.hostedAbuseAnalytics) {
    findings.push("production provider CSV hosted abuse analytics proof is required");
  }
  for (const signal of REQUIRED_ABUSE_SIGNALS) {
    if (!evidence.quotaAndAbuse.suspiciousPatternSignals.includes(signal)) {
      findings.push(`production provider CSV abuse analytics must include ${signal}`);
    }
  }
}

function validateBrowserProof(
  evidence: ProductionProviderCsvEvidence,
  findings: string[]
): void {
  if (!evidence.browserProof.desktopWorkflow) {
    findings.push("production provider CSV desktop browser workflow proof is required");
  }
  if (!evidence.browserProof.mobileWorkflow) {
    findings.push("production provider CSV mobile browser workflow proof is required");
  }
  if (!evidence.browserProof.keyboardNavigation) {
    findings.push("production provider CSV keyboard navigation proof is required");
  }
  if (!evidence.browserProof.screenReaderLabels) {
    findings.push("production provider CSV screen-reader labels proof is required");
  }
  if (!evidence.browserProof.errorSummary) {
    findings.push("production provider CSV browser error summary proof is required");
  }
  if (!evidence.browserProof.noHiddenDestructiveAction) {
    findings.push("production provider CSV proof must show no hidden destructive import action");
  }
}

function validatePrivacy(
  evidence: ProductionProviderCsvEvidence,
  findings: string[]
): void {
  if (!evidence.privacy.formulaInjectionRegression) {
    findings.push("production provider CSV formula-injection regression proof is required");
  }
  if (!evidence.privacy.fieldMappingPrivacy) {
    findings.push("production provider CSV field-mapping privacy proof is required");
  }
  if (!evidence.privacy.excludesPrivateTaskTitles) {
    findings.push("production provider CSV evidence must exclude private task titles");
  }
  if (!evidence.privacy.excludesRawCsvRows) {
    findings.push("production provider CSV evidence must exclude raw CSV rows");
  }
  if (!evidence.privacy.excludesUploadedFilenames) {
    findings.push("production provider CSV evidence must exclude uploaded filenames");
  }
  if (!evidence.privacy.excludesLocalPaths) {
    findings.push("production provider CSV evidence must exclude local paths");
  }
  if (!evidence.privacy.excludesProviderAccountIdentifiers) {
    findings.push("production provider CSV evidence must exclude provider account identifiers");
  }
  if (!evidence.privacy.contentMinimizedLogs) {
    findings.push("production provider CSV logs must be content-minimized");
  }
}

function validateOperations(
  evidence: ProductionProviderCsvEvidence,
  findings: string[]
): void {
  if (!evidence.operations.remoteCiProof) {
    findings.push("production provider CSV remote CI proof is required");
  }
  if (!evidence.operations.rollbackPlan) {
    findings.push("production provider CSV rollback plan is required");
  }
  if (!evidence.operations.importDisableProcedure) {
    findings.push("production provider CSV import disable procedure is required");
  }
  if (!evidence.operations.importedRowCleanupPlan) {
    findings.push("production provider CSV imported-row cleanup plan is required");
  }
  if (!evidence.operations.securityAuditPass) {
    findings.push("production provider CSV security audit PASS is required");
  }
  if (!evidence.operations.privacyAuditPass) {
    findings.push("production provider CSV privacy audit PASS is required");
  }
  if (!evidence.operations.licensingAuditPass) {
    findings.push("production provider CSV licensing audit PASS is required");
  }
  if (!evidence.operations.operatorApproval) {
    findings.push("production provider CSV operator approval is required");
  }
  if (!evidence.operations.secondOperatorReview) {
    findings.push("production provider CSV second operator review is required");
  }
}
