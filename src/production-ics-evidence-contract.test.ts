import test from "node:test";
import assert from "node:assert/strict";
import {
  type ProductionIcsEvidence,
  validateProductionIcsEvidence
} from "./production-ics-evidence-contract.js";

const completeEvidence = (): ProductionIcsEvidence => ({
  environment: "production_demo",
  providerFixtures: {
    providers: ["GOOGLE_CALENDAR", "MICROSOFT_OUTLOOK", "APPLE_ICLOUD", "GENERIC_ICS"],
    sanitizedFixturesOnly: true,
    realExportShapeReviewed: true,
    largeCalendarFixture: true,
    privateTitleFixture: true
  },
  recurrence: {
    features: [
      "DAILY",
      "WEEKLY",
      "MONTHLY",
      "YEARLY",
      "TZID",
      "DST",
      "EXDATE",
      "RDATE",
      "RDATE_PERIOD",
      "RECURRENCE_ID_MOVED",
      "RECURRENCE_ID_CANCELLED",
      "ALL_DAY",
      "DATE_ONLY_UNTIL"
    ],
    timezoneDstProof: true,
    rangeBoundedExpansion: true,
    performanceLimitReviewed: true
  },
  importExport: {
    workflows: [
      "IMPORT_PREVIEW",
      "IMPORT_CONFIRM",
      "EXPORT_ACCEPTED_PLAN",
      "WRITE_BACK_PREVIEW",
      "WRITE_BACK_ACKNOWLEDGE",
      "WRITE_BACK_CONFLICT_REFUSAL",
      "SYNC_CHECKPOINT_REPLAY",
      "ROLLBACK_CLEANUP"
    ],
    previewBeforeMutation: true,
    explicitImportConfirmation: true,
    acceptedPlanExportReviewed: true,
    privateTitleRedaction: true,
    providerNeutralContract: true
  },
  syncState: {
    idempotentReimport: true,
    checkpointReplayProof: true,
    duplicatePrevention: true,
    deletedOccurrenceHandling: true,
    outOfOrderChangeHandling: true
  },
  writeBack: {
    writableCalendarProof: true,
    readOnlyCalendarRefusal: true,
    busyConflictPreview: true,
    serverSideConflictRefusal: true,
    lockedBlockPreservation: true,
    disableWriteBackProcedure: true
  },
  operations: {
    browserWorkflowProof: true,
    accessibilityProof: true,
    responsiveProof: true,
    remoteCiProof: true,
    rollbackPlan: true,
    operatorApproval: true,
    secondOperatorReview: true,
    securityAuditPass: true,
    privacyAuditPass: true,
    licensingAuditPass: true
  }
});

test("production ICS evidence accepts complete release-grade evidence shape", () => {
  const result = validateProductionIcsEvidence(completeEvidence());

  assert.deepEqual(result, { ok: true, findings: [] });
});

test("production ICS evidence rejects missing provider fixture proof", () => {
  const evidence = completeEvidence();
  evidence.environment = "";
  evidence.providerFixtures.providers = ["GOOGLE_CALENDAR"];
  evidence.providerFixtures.sanitizedFixturesOnly = false;
  evidence.providerFixtures.realExportShapeReviewed = false;
  evidence.providerFixtures.largeCalendarFixture = false;
  evidence.providerFixtures.privateTitleFixture = false;

  const result = validateProductionIcsEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /environment/);
  assert.match(result.findings.join("\n"), /MICROSOFT_OUTLOOK/);
  assert.match(result.findings.join("\n"), /APPLE_ICLOUD/);
  assert.match(result.findings.join("\n"), /GENERIC_ICS/);
  assert.match(result.findings.join("\n"), /sanitized/);
  assert.match(result.findings.join("\n"), /real export shapes/);
  assert.match(result.findings.join("\n"), /large calendar fixture/);
  assert.match(result.findings.join("\n"), /private-title fixture/);
});

test("production ICS evidence rejects incomplete recurrence proof", () => {
  const evidence = completeEvidence();
  evidence.recurrence.features = ["DAILY", "WEEKLY"];
  evidence.recurrence.timezoneDstProof = false;
  evidence.recurrence.rangeBoundedExpansion = false;
  evidence.recurrence.performanceLimitReviewed = false;

  const result = validateProductionIcsEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /MONTHLY/);
  assert.match(result.findings.join("\n"), /TZID/);
  assert.match(result.findings.join("\n"), /RDATE_PERIOD/);
  assert.match(result.findings.join("\n"), /RECURRENCE_ID_CANCELLED/);
  assert.match(result.findings.join("\n"), /timezone\/DST/);
  assert.match(result.findings.join("\n"), /range bounded/);
  assert.match(result.findings.join("\n"), /performance limits/);
});

test("production ICS evidence rejects unsafe import export and sync evidence", () => {
  const evidence = completeEvidence();
  evidence.importExport.workflows = ["IMPORT_PREVIEW"];
  evidence.importExport.previewBeforeMutation = false;
  evidence.importExport.explicitImportConfirmation = false;
  evidence.importExport.privateTitleRedaction = false;
  evidence.syncState.idempotentReimport = false;
  evidence.syncState.checkpointReplayProof = false;
  evidence.syncState.duplicatePrevention = false;
  evidence.syncState.deletedOccurrenceHandling = false;

  const result = validateProductionIcsEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /EXPORT_ACCEPTED_PLAN/);
  assert.match(result.findings.join("\n"), /WRITE_BACK_CONFLICT_REFUSAL/);
  assert.match(result.findings.join("\n"), /preview before mutation/);
  assert.match(result.findings.join("\n"), /explicit confirmation/);
  assert.match(result.findings.join("\n"), /redact private titles/);
  assert.match(result.findings.join("\n"), /idempotent/);
  assert.match(result.findings.join("\n"), /checkpoint replay/);
  assert.match(result.findings.join("\n"), /duplicate prevention/);
  assert.match(result.findings.join("\n"), /deleted occurrence/);
});

test("production ICS evidence rejects missing write-back operations approvals", () => {
  const evidence = completeEvidence();
  evidence.writeBack.writableCalendarProof = false;
  evidence.writeBack.readOnlyCalendarRefusal = false;
  evidence.writeBack.busyConflictPreview = false;
  evidence.writeBack.serverSideConflictRefusal = false;
  evidence.writeBack.lockedBlockPreservation = false;
  evidence.operations.browserWorkflowProof = false;
  evidence.operations.remoteCiProof = false;
  evidence.operations.operatorApproval = false;
  evidence.operations.secondOperatorReview = false;
  evidence.operations.securityAuditPass = false;
  evidence.operations.privacyAuditPass = false;
  evidence.operations.licensingAuditPass = false;

  const result = validateProductionIcsEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /writable calendar/);
  assert.match(result.findings.join("\n"), /read-only calendar/);
  assert.match(result.findings.join("\n"), /busy conflict preview/);
  assert.match(result.findings.join("\n"), /server-side conflict/);
  assert.match(result.findings.join("\n"), /locked block/);
  assert.match(result.findings.join("\n"), /browser workflow/);
  assert.match(result.findings.join("\n"), /remote CI/);
  assert.match(result.findings.join("\n"), /operator approval/);
  assert.match(result.findings.join("\n"), /second operator/);
  assert.match(result.findings.join("\n"), /security audit/);
  assert.match(result.findings.join("\n"), /privacy audit/);
  assert.match(result.findings.join("\n"), /licensing audit/);
});
