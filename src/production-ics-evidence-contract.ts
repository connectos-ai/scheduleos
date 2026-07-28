export type ProductionIcsProvider =
  | "GOOGLE_CALENDAR"
  | "MICROSOFT_OUTLOOK"
  | "APPLE_ICLOUD"
  | "GENERIC_ICS";

export type ProductionIcsWorkflow =
  | "IMPORT_PREVIEW"
  | "IMPORT_CONFIRM"
  | "EXPORT_ACCEPTED_PLAN"
  | "WRITE_BACK_PREVIEW"
  | "WRITE_BACK_ACKNOWLEDGE"
  | "WRITE_BACK_CONFLICT_REFUSAL"
  | "SYNC_CHECKPOINT_REPLAY"
  | "ROLLBACK_CLEANUP";

export type ProductionIcsRecurrenceFeature =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "YEARLY"
  | "TZID"
  | "DST"
  | "EXDATE"
  | "RDATE"
  | "RDATE_PERIOD"
  | "RECURRENCE_ID_MOVED"
  | "RECURRENCE_ID_CANCELLED"
  | "ALL_DAY"
  | "DATE_ONLY_UNTIL";

export interface ProductionIcsEvidence {
  environment: string;
  providerFixtures: {
    providers: ProductionIcsProvider[];
    sanitizedFixturesOnly: boolean;
    realExportShapeReviewed: boolean;
    largeCalendarFixture: boolean;
    privateTitleFixture: boolean;
  };
  recurrence: {
    features: ProductionIcsRecurrenceFeature[];
    timezoneDstProof: boolean;
    rangeBoundedExpansion: boolean;
    performanceLimitReviewed: boolean;
  };
  importExport: {
    workflows: ProductionIcsWorkflow[];
    previewBeforeMutation: boolean;
    explicitImportConfirmation: boolean;
    acceptedPlanExportReviewed: boolean;
    privateTitleRedaction: boolean;
    providerNeutralContract: boolean;
  };
  syncState: {
    idempotentReimport: boolean;
    checkpointReplayProof: boolean;
    duplicatePrevention: boolean;
    deletedOccurrenceHandling: boolean;
    outOfOrderChangeHandling: boolean;
  };
  writeBack: {
    writableCalendarProof: boolean;
    readOnlyCalendarRefusal: boolean;
    busyConflictPreview: boolean;
    serverSideConflictRefusal: boolean;
    lockedBlockPreservation: boolean;
    disableWriteBackProcedure: boolean;
  };
  operations: {
    browserWorkflowProof: boolean;
    accessibilityProof: boolean;
    responsiveProof: boolean;
    remoteCiProof: boolean;
    rollbackPlan: boolean;
    operatorApproval: boolean;
    secondOperatorReview: boolean;
    securityAuditPass: boolean;
    privacyAuditPass: boolean;
    licensingAuditPass: boolean;
  };
}

export interface ProductionIcsEvidenceValidation {
  ok: boolean;
  findings: string[];
}

const REQUIRED_PROVIDERS: ProductionIcsProvider[] = [
  "GOOGLE_CALENDAR",
  "MICROSOFT_OUTLOOK",
  "APPLE_ICLOUD",
  "GENERIC_ICS"
];

const REQUIRED_RECURRENCE_FEATURES: ProductionIcsRecurrenceFeature[] = [
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
];

const REQUIRED_WORKFLOWS: ProductionIcsWorkflow[] = [
  "IMPORT_PREVIEW",
  "IMPORT_CONFIRM",
  "EXPORT_ACCEPTED_PLAN",
  "WRITE_BACK_PREVIEW",
  "WRITE_BACK_ACKNOWLEDGE",
  "WRITE_BACK_CONFLICT_REFUSAL",
  "SYNC_CHECKPOINT_REPLAY",
  "ROLLBACK_CLEANUP"
];

export function validateProductionIcsEvidence(
  evidence: ProductionIcsEvidence
): ProductionIcsEvidenceValidation {
  const findings: string[] = [];

  if (evidence.environment.trim().length === 0) {
    findings.push("production ICS environment must be named");
  }

  validateProviderFixtures(evidence, findings);
  validateRecurrence(evidence, findings);
  validateImportExport(evidence, findings);
  validateSyncState(evidence, findings);
  validateWriteBack(evidence, findings);
  validateOperations(evidence, findings);

  return { ok: findings.length === 0, findings };
}

function validateProviderFixtures(evidence: ProductionIcsEvidence, findings: string[]): void {
  for (const provider of REQUIRED_PROVIDERS) {
    if (!evidence.providerFixtures.providers.includes(provider)) {
      findings.push(`production ICS provider fixture suite must include ${provider}`);
    }
  }
  if (!evidence.providerFixtures.sanitizedFixturesOnly) {
    findings.push("production ICS fixtures must be sanitized");
  }
  if (!evidence.providerFixtures.realExportShapeReviewed) {
    findings.push("production ICS real export shapes must be reviewed");
  }
  if (!evidence.providerFixtures.largeCalendarFixture) {
    findings.push("production ICS large calendar fixture must be reviewed");
  }
  if (!evidence.providerFixtures.privateTitleFixture) {
    findings.push("production ICS private-title fixture must be reviewed");
  }
}

function validateRecurrence(evidence: ProductionIcsEvidence, findings: string[]): void {
  for (const feature of REQUIRED_RECURRENCE_FEATURES) {
    if (!evidence.recurrence.features.includes(feature)) {
      findings.push(`production ICS recurrence proof must include ${feature}`);
    }
  }
  if (!evidence.recurrence.timezoneDstProof) {
    findings.push("production ICS timezone/DST proof must be reviewed");
  }
  if (!evidence.recurrence.rangeBoundedExpansion) {
    findings.push("production ICS recurrence expansion must be range bounded");
  }
  if (!evidence.recurrence.performanceLimitReviewed) {
    findings.push("production ICS recurrence performance limits must be reviewed");
  }
}

function validateImportExport(evidence: ProductionIcsEvidence, findings: string[]): void {
  for (const workflow of REQUIRED_WORKFLOWS) {
    if (!evidence.importExport.workflows.includes(workflow)) {
      findings.push(`production ICS workflow proof must include ${workflow}`);
    }
  }
  if (!evidence.importExport.previewBeforeMutation) {
    findings.push("production ICS import must preview before mutation");
  }
  if (!evidence.importExport.explicitImportConfirmation) {
    findings.push("production ICS import must require explicit confirmation");
  }
  if (!evidence.importExport.acceptedPlanExportReviewed) {
    findings.push("production ICS accepted-plan export must be reviewed");
  }
  if (!evidence.importExport.privateTitleRedaction) {
    findings.push("production ICS export must redact private titles when required");
  }
  if (!evidence.importExport.providerNeutralContract) {
    findings.push("production ICS provider-neutral contract must be reviewed");
  }
}

function validateSyncState(evidence: ProductionIcsEvidence, findings: string[]): void {
  if (!evidence.syncState.idempotentReimport) {
    findings.push("production ICS reimport must be idempotent");
  }
  if (!evidence.syncState.checkpointReplayProof) {
    findings.push("production ICS checkpoint replay proof must exist");
  }
  if (!evidence.syncState.duplicatePrevention) {
    findings.push("production ICS duplicate prevention must be proven");
  }
  if (!evidence.syncState.deletedOccurrenceHandling) {
    findings.push("production ICS deleted occurrence handling must be proven");
  }
  if (!evidence.syncState.outOfOrderChangeHandling) {
    findings.push("production ICS out-of-order change handling must be reviewed");
  }
}

function validateWriteBack(evidence: ProductionIcsEvidence, findings: string[]): void {
  if (!evidence.writeBack.writableCalendarProof) {
    findings.push("production ICS writable calendar proof must exist");
  }
  if (!evidence.writeBack.readOnlyCalendarRefusal) {
    findings.push("production ICS read-only calendar refusal must be proven");
  }
  if (!evidence.writeBack.busyConflictPreview) {
    findings.push("production ICS busy conflict preview must be proven");
  }
  if (!evidence.writeBack.serverSideConflictRefusal) {
    findings.push("production ICS server-side conflict refusal must be proven");
  }
  if (!evidence.writeBack.lockedBlockPreservation) {
    findings.push("production ICS locked block preservation must be proven");
  }
  if (!evidence.writeBack.disableWriteBackProcedure) {
    findings.push("production ICS write-back disablement procedure must be reviewed");
  }
}

function validateOperations(evidence: ProductionIcsEvidence, findings: string[]): void {
  if (!evidence.operations.browserWorkflowProof) {
    findings.push("production ICS browser workflow proof must exist");
  }
  if (!evidence.operations.accessibilityProof) {
    findings.push("production ICS accessibility proof must exist");
  }
  if (!evidence.operations.responsiveProof) {
    findings.push("production ICS responsive proof must exist");
  }
  if (!evidence.operations.remoteCiProof) {
    findings.push("production ICS remote CI proof must exist");
  }
  if (!evidence.operations.rollbackPlan) {
    findings.push("production ICS rollback plan must be reviewed");
  }
  if (!evidence.operations.operatorApproval) {
    findings.push("production ICS operator approval must be recorded");
  }
  if (!evidence.operations.secondOperatorReview) {
    findings.push("production ICS second operator review must be recorded");
  }
  if (!evidence.operations.securityAuditPass) {
    findings.push("security audit must remain PASS after ICS evidence");
  }
  if (!evidence.operations.privacyAuditPass) {
    findings.push("privacy audit must remain PASS after ICS evidence");
  }
  if (!evidence.operations.licensingAuditPass) {
    findings.push("licensing audit must remain PASS after ICS evidence");
  }
}
