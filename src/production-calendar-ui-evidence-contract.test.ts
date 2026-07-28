import test from "node:test";
import assert from "node:assert/strict";

import {
  type ProductionCalendarUiEvidence,
  validateProductionCalendarUiEvidence
} from "./production-calendar-ui-evidence-contract.js";

const completeEvidence = (): ProductionCalendarUiEvidence => ({
  environment: "production_demo",
  browserMatrix: {
    browsers: ["CHROME", "FIREFOX", "SAFARI", "MOBILE_WEBKIT"],
    desktopViewportProof: true,
    mobileViewportProof: true,
    tabletViewportProof: true,
    releaseTargetVersionsRecorded: true,
    noCriticalConsoleErrors: true
  },
  conflictWorkflow: {
    scenarios: [
      "CLEAN_WRITE",
      "BUSY_CONFLICT",
      "READ_ONLY_CALENDAR",
      "STALE_PREVIEW",
      "ACKNOWLEDGEMENT_REJECTED",
      "ACKNOWLEDGEMENT_ACCEPTED",
      "SERVER_SIDE_REFUSAL",
      "NO_KEYBOARD_TRAP"
    ],
    previewBeforeWrite: true,
    acknowledgementRequired: true,
    serverSideConflictRefusal: true,
    lockedBlockPreservation: true,
    errorRecoveryReviewed: true
  },
  accessibility: {
    auditToolRun: true,
    keyboardNavigation: true,
    screenReaderSemantics: true,
    focusOrderReviewed: true,
    liveRegionsReviewed: true,
    colorContrastReviewed: true,
    reducedMotionReviewed: true,
    noKeyboardTraps: true
  },
  responsivePolish: {
    mobileLayoutReviewed: true,
    tabletLayoutReviewed: true,
    narrowDesktopReviewed: true,
    wideDesktopReviewed: true,
    noOverlappingText: true,
    noHiddenControls: true,
    calendarGridStable: true,
    fixedFormatElementsStable: true
  },
  visualRegression: {
    states: [
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
    ],
    baselineCaptured: true,
    diffReviewed: true,
    productOwnerApproval: true
  },
  operations: {
    remoteCiProof: true,
    rollbackPlan: true,
    staticAssetCacheReviewed: true,
    apiCompatibilityReviewed: true,
    operatorCommunicationPlan: true,
    securityAuditPass: true,
    privacyAuditPass: true,
    licensingAuditPass: true,
    secondOperatorReview: true
  }
});

test("production calendar UI evidence accepts complete release-grade evidence shape", () => {
  const result = validateProductionCalendarUiEvidence(completeEvidence());

  assert.equal(result.ok, true);
  assert.deepEqual(result.findings, []);
});

test("production calendar UI evidence rejects incomplete browser matrix", () => {
  const evidence = completeEvidence();
  evidence.browserMatrix.browsers = ["CHROME"];
  evidence.browserMatrix.mobileViewportProof = false;
  evidence.browserMatrix.tabletViewportProof = false;
  evidence.browserMatrix.releaseTargetVersionsRecorded = false;
  evidence.browserMatrix.noCriticalConsoleErrors = false;

  const result = validateProductionCalendarUiEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /FIREFOX/);
  assert.match(result.findings.join("\n"), /SAFARI/);
  assert.match(result.findings.join("\n"), /mobile viewport/);
  assert.match(result.findings.join("\n"), /tablet viewport/);
  assert.match(result.findings.join("\n"), /release target versions/);
  assert.match(result.findings.join("\n"), /console errors/);
});

test("production calendar UI evidence rejects unsafe conflict workflow", () => {
  const evidence = completeEvidence();
  evidence.conflictWorkflow.scenarios = ["CLEAN_WRITE", "BUSY_CONFLICT"];
  evidence.conflictWorkflow.previewBeforeWrite = false;
  evidence.conflictWorkflow.acknowledgementRequired = false;
  evidence.conflictWorkflow.serverSideConflictRefusal = false;
  evidence.conflictWorkflow.lockedBlockPreservation = false;

  const result = validateProductionCalendarUiEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /READ_ONLY_CALENDAR/);
  assert.match(result.findings.join("\n"), /STALE_PREVIEW/);
  assert.match(result.findings.join("\n"), /preview before write/);
  assert.match(result.findings.join("\n"), /acknowledgement/);
  assert.match(result.findings.join("\n"), /server-side conflict refusal/);
  assert.match(result.findings.join("\n"), /locked block/);
});

test("production calendar UI evidence rejects missing accessibility responsive proof", () => {
  const evidence = completeEvidence();
  evidence.accessibility.auditToolRun = false;
  evidence.accessibility.keyboardNavigation = false;
  evidence.accessibility.colorContrastReviewed = false;
  evidence.responsivePolish.mobileLayoutReviewed = false;
  evidence.responsivePolish.noOverlappingText = false;
  evidence.responsivePolish.calendarGridStable = false;

  const result = validateProductionCalendarUiEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /accessibility audit/);
  assert.match(result.findings.join("\n"), /keyboard navigation/);
  assert.match(result.findings.join("\n"), /color contrast/);
  assert.match(result.findings.join("\n"), /mobile layout/);
  assert.match(result.findings.join("\n"), /overlapping text/);
  assert.match(result.findings.join("\n"), /calendar grid/);
});

test("production calendar UI evidence rejects missing visual operations approvals", () => {
  const evidence = completeEvidence();
  evidence.visualRegression.states = ["TASK_LIST"];
  evidence.visualRegression.baselineCaptured = false;
  evidence.visualRegression.productOwnerApproval = false;
  evidence.operations.remoteCiProof = false;
  evidence.operations.rollbackPlan = false;
  evidence.operations.securityAuditPass = false;
  evidence.operations.secondOperatorReview = false;

  const result = validateProductionCalendarUiEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /EMPTY_STATE/);
  assert.match(result.findings.join("\n"), /CONFLICT_PREVIEW/);
  assert.match(result.findings.join("\n"), /visual regression baseline/);
  assert.match(result.findings.join("\n"), /product-owner approval/);
  assert.match(result.findings.join("\n"), /remote CI/);
  assert.match(result.findings.join("\n"), /rollback/);
  assert.match(result.findings.join("\n"), /security audit/);
  assert.match(result.findings.join("\n"), /second operator/);
});
