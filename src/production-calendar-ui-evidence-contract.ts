export type ProductionCalendarUiBrowser =
  | "CHROME"
  | "FIREFOX"
  | "SAFARI"
  | "MOBILE_WEBKIT";

export type ProductionCalendarUiConflictScenario =
  | "CLEAN_WRITE"
  | "BUSY_CONFLICT"
  | "READ_ONLY_CALENDAR"
  | "STALE_PREVIEW"
  | "ACKNOWLEDGEMENT_REJECTED"
  | "ACKNOWLEDGEMENT_ACCEPTED"
  | "SERVER_SIDE_REFUSAL"
  | "NO_KEYBOARD_TRAP";

export type ProductionCalendarUiVisualState =
  | "EMPTY_STATE"
  | "LOADING_STATE"
  | "ERROR_STATE"
  | "TASK_LIST"
  | "FIXED_EVENTS"
  | "WARNINGS"
  | "EXPLANATIONS"
  | "CONFLICT_PREVIEW"
  | "ACCEPTED_BLOCKS"
  | "WRITE_BACK_READY";

export interface ProductionCalendarUiEvidence {
  environment: string;
  browserMatrix: {
    browsers: ProductionCalendarUiBrowser[];
    desktopViewportProof: boolean;
    mobileViewportProof: boolean;
    tabletViewportProof: boolean;
    releaseTargetVersionsRecorded: boolean;
    noCriticalConsoleErrors: boolean;
  };
  conflictWorkflow: {
    scenarios: ProductionCalendarUiConflictScenario[];
    previewBeforeWrite: boolean;
    acknowledgementRequired: boolean;
    serverSideConflictRefusal: boolean;
    lockedBlockPreservation: boolean;
    errorRecoveryReviewed: boolean;
  };
  accessibility: {
    auditToolRun: boolean;
    keyboardNavigation: boolean;
    screenReaderSemantics: boolean;
    focusOrderReviewed: boolean;
    liveRegionsReviewed: boolean;
    colorContrastReviewed: boolean;
    reducedMotionReviewed: boolean;
    noKeyboardTraps: boolean;
  };
  responsivePolish: {
    mobileLayoutReviewed: boolean;
    tabletLayoutReviewed: boolean;
    narrowDesktopReviewed: boolean;
    wideDesktopReviewed: boolean;
    noOverlappingText: boolean;
    noHiddenControls: boolean;
    calendarGridStable: boolean;
    fixedFormatElementsStable: boolean;
  };
  visualRegression: {
    states: ProductionCalendarUiVisualState[];
    baselineCaptured: boolean;
    diffReviewed: boolean;
    productOwnerApproval: boolean;
  };
  operations: {
    remoteCiProof: boolean;
    rollbackPlan: boolean;
    staticAssetCacheReviewed: boolean;
    apiCompatibilityReviewed: boolean;
    operatorCommunicationPlan: boolean;
    securityAuditPass: boolean;
    privacyAuditPass: boolean;
    licensingAuditPass: boolean;
    secondOperatorReview: boolean;
  };
}

export interface ProductionCalendarUiEvidenceValidation {
  ok: boolean;
  findings: string[];
}

const REQUIRED_BROWSERS: ProductionCalendarUiBrowser[] = [
  "CHROME",
  "FIREFOX",
  "SAFARI",
  "MOBILE_WEBKIT"
];

const REQUIRED_CONFLICT_SCENARIOS: ProductionCalendarUiConflictScenario[] = [
  "CLEAN_WRITE",
  "BUSY_CONFLICT",
  "READ_ONLY_CALENDAR",
  "STALE_PREVIEW",
  "ACKNOWLEDGEMENT_REJECTED",
  "ACKNOWLEDGEMENT_ACCEPTED",
  "SERVER_SIDE_REFUSAL",
  "NO_KEYBOARD_TRAP"
];

const REQUIRED_VISUAL_STATES: ProductionCalendarUiVisualState[] = [
  "EMPTY_STATE",
  "LOADING_STATE",
  "ERROR_STATE",
  "TASK_LIST",
  "FIXED_EVENTS",
  "WARNINGS",
  "EXPLANATIONS",
  "CONFLICT_PREVIEW",
  "ACCEPTED_BLOCKS",
  "WRITE_BACK_READY"
];

export function validateProductionCalendarUiEvidence(
  evidence: ProductionCalendarUiEvidence
): ProductionCalendarUiEvidenceValidation {
  const findings: string[] = [];

  if (!evidence.environment.trim()) {
    findings.push("production calendar UI evidence environment is required");
  }

  validateBrowserMatrix(evidence, findings);
  validateConflictWorkflow(evidence, findings);
  validateAccessibility(evidence, findings);
  validateResponsivePolish(evidence, findings);
  validateVisualRegression(evidence, findings);
  validateOperations(evidence, findings);

  return {
    ok: findings.length === 0,
    findings
  };
}

function validateBrowserMatrix(
  evidence: ProductionCalendarUiEvidence,
  findings: string[]
): void {
  for (const browser of REQUIRED_BROWSERS) {
    if (!evidence.browserMatrix.browsers.includes(browser)) {
      findings.push(`production calendar UI browser matrix must include ${browser}`);
    }
  }
  if (!evidence.browserMatrix.desktopViewportProof) {
    findings.push("production calendar UI desktop viewport proof is required");
  }
  if (!evidence.browserMatrix.mobileViewportProof) {
    findings.push("production calendar UI mobile viewport proof is required");
  }
  if (!evidence.browserMatrix.tabletViewportProof) {
    findings.push("production calendar UI tablet viewport proof is required");
  }
  if (!evidence.browserMatrix.releaseTargetVersionsRecorded) {
    findings.push("production calendar UI release target versions must be recorded");
  }
  if (!evidence.browserMatrix.noCriticalConsoleErrors) {
    findings.push("production calendar UI proof must show no critical console errors");
  }
}

function validateConflictWorkflow(
  evidence: ProductionCalendarUiEvidence,
  findings: string[]
): void {
  for (const scenario of REQUIRED_CONFLICT_SCENARIOS) {
    if (!evidence.conflictWorkflow.scenarios.includes(scenario)) {
      findings.push(`production calendar UI conflict workflow proof must include ${scenario}`);
    }
  }
  if (!evidence.conflictWorkflow.previewBeforeWrite) {
    findings.push("production calendar UI must preview before write");
  }
  if (!evidence.conflictWorkflow.acknowledgementRequired) {
    findings.push("production calendar UI write-back acknowledgement is required");
  }
  if (!evidence.conflictWorkflow.serverSideConflictRefusal) {
    findings.push("production calendar UI server-side conflict refusal proof is required");
  }
  if (!evidence.conflictWorkflow.lockedBlockPreservation) {
    findings.push("production calendar UI locked block preservation proof is required");
  }
  if (!evidence.conflictWorkflow.errorRecoveryReviewed) {
    findings.push("production calendar UI conflict error recovery review is required");
  }
}

function validateAccessibility(
  evidence: ProductionCalendarUiEvidence,
  findings: string[]
): void {
  if (!evidence.accessibility.auditToolRun) {
    findings.push("production calendar UI accessibility audit is required");
  }
  if (!evidence.accessibility.keyboardNavigation) {
    findings.push("production calendar UI keyboard navigation proof is required");
  }
  if (!evidence.accessibility.screenReaderSemantics) {
    findings.push("production calendar UI screen-reader semantics proof is required");
  }
  if (!evidence.accessibility.focusOrderReviewed) {
    findings.push("production calendar UI focus order review is required");
  }
  if (!evidence.accessibility.liveRegionsReviewed) {
    findings.push("production calendar UI live regions review is required");
  }
  if (!evidence.accessibility.colorContrastReviewed) {
    findings.push("production calendar UI color contrast review is required");
  }
  if (!evidence.accessibility.reducedMotionReviewed) {
    findings.push("production calendar UI reduced-motion review is required");
  }
  if (!evidence.accessibility.noKeyboardTraps) {
    findings.push("production calendar UI must prove no keyboard traps");
  }
}

function validateResponsivePolish(
  evidence: ProductionCalendarUiEvidence,
  findings: string[]
): void {
  if (!evidence.responsivePolish.mobileLayoutReviewed) {
    findings.push("production calendar UI mobile layout review is required");
  }
  if (!evidence.responsivePolish.tabletLayoutReviewed) {
    findings.push("production calendar UI tablet layout review is required");
  }
  if (!evidence.responsivePolish.narrowDesktopReviewed) {
    findings.push("production calendar UI narrow desktop review is required");
  }
  if (!evidence.responsivePolish.wideDesktopReviewed) {
    findings.push("production calendar UI wide desktop review is required");
  }
  if (!evidence.responsivePolish.noOverlappingText) {
    findings.push("production calendar UI must prove no overlapping text");
  }
  if (!evidence.responsivePolish.noHiddenControls) {
    findings.push("production calendar UI must prove no hidden controls");
  }
  if (!evidence.responsivePolish.calendarGridStable) {
    findings.push("production calendar UI calendar grid stability proof is required");
  }
  if (!evidence.responsivePolish.fixedFormatElementsStable) {
    findings.push("production calendar UI fixed-format element stability proof is required");
  }
}

function validateVisualRegression(
  evidence: ProductionCalendarUiEvidence,
  findings: string[]
): void {
  for (const state of REQUIRED_VISUAL_STATES) {
    if (!evidence.visualRegression.states.includes(state)) {
      findings.push(`production calendar UI visual regression proof must include ${state}`);
    }
  }
  if (!evidence.visualRegression.baselineCaptured) {
    findings.push("production calendar UI visual regression baseline is required");
  }
  if (!evidence.visualRegression.diffReviewed) {
    findings.push("production calendar UI visual regression diff review is required");
  }
  if (!evidence.visualRegression.productOwnerApproval) {
    findings.push("production calendar UI product-owner approval is required");
  }
}

function validateOperations(
  evidence: ProductionCalendarUiEvidence,
  findings: string[]
): void {
  if (!evidence.operations.remoteCiProof) {
    findings.push("production calendar UI remote CI proof is required");
  }
  if (!evidence.operations.rollbackPlan) {
    findings.push("production calendar UI rollback plan is required");
  }
  if (!evidence.operations.staticAssetCacheReviewed) {
    findings.push("production calendar UI static asset cache review is required");
  }
  if (!evidence.operations.apiCompatibilityReviewed) {
    findings.push("production calendar UI API compatibility review is required");
  }
  if (!evidence.operations.operatorCommunicationPlan) {
    findings.push("production calendar UI operator communication plan is required");
  }
  if (!evidence.operations.securityAuditPass) {
    findings.push("production calendar UI security audit PASS is required");
  }
  if (!evidence.operations.privacyAuditPass) {
    findings.push("production calendar UI privacy audit PASS is required");
  }
  if (!evidence.operations.licensingAuditPass) {
    findings.push("production calendar UI licensing audit PASS is required");
  }
  if (!evidence.operations.secondOperatorReview) {
    findings.push("production calendar UI second operator review is required");
  }
}
