export type RemoteCiPostgresqlProvider = "GITHUB_ACTIONS";

export interface RemoteCiPostgresqlEvidence {
  environment: string;
  workflow: {
    ciProvider: RemoteCiPostgresqlProvider;
    publicRepositoryRun: boolean;
    workflowFileReviewed: boolean;
    boundedJobTimeout: boolean;
    readOnlyDefaultPermissions: boolean;
    concurrencyCancellation: boolean;
    stepSummaryProof: boolean;
  };
  postgresService: {
    versionRecorded: boolean;
    disposableServiceContainer: boolean;
    healthCheckProof: boolean;
    networkIsolation: boolean;
    scopedDatabaseUser: boolean;
    connectionUrlInjectedByCiSecret: boolean;
  };
  migrationsAndTests: {
    cleanDatabaseMigrationApply: boolean;
    migrationVersionOrderProof: boolean;
    liveRepositoryTests: boolean;
    tenantIsolationRegression: boolean;
    authRepositoryCoverage: boolean;
    retentionCleanupCoverage: boolean;
    command: string;
  };
  failureVisibility: {
    failedMigrationVisible: boolean;
    failedConnectionVisible: boolean;
    failedRepositoryTestVisible: boolean;
    failedTenantIsolationVisible: boolean;
    jobLogsRetained: boolean;
    artifactsRetained: boolean;
  };
  retryTimeoutRollback: {
    serviceReadinessTimeout: boolean;
    migrationApplyTimeout: boolean;
    liveTestTimeout: boolean;
    stuckJobCancellation: boolean;
    rerunProcedure: boolean;
    workflowRollbackProcedure: boolean;
    serviceVersionRollbackProcedure: boolean;
  };
  sanitization: {
    noRawDatabaseUrls: boolean;
    noDatabasePasswords: boolean;
    noTokens: boolean;
    noPrivateHostnames: boolean;
    noPrivatePaths: boolean;
    noCustomerData: boolean;
    noCalendarTaskData: boolean;
    noPrivateLeadershipSystemMaterial: boolean;
  };
  operations: {
    remoteCiProofAccepted: boolean;
    securityAuditPass: boolean;
    privacyAuditPass: boolean;
    licensingAuditPass: boolean;
    operatorReview: boolean;
    secondOperatorReview: boolean;
  };
}

export interface RemoteCiPostgresqlEvidenceValidation {
  ok: boolean;
  findings: string[];
}

export function validateRemoteCiPostgresqlEvidence(
  evidence: RemoteCiPostgresqlEvidence
): RemoteCiPostgresqlEvidenceValidation {
  const findings: string[] = [];

  if (!evidence.environment.trim()) {
    findings.push("remote CI PostgreSQL evidence environment is required");
  }

  validateWorkflow(evidence, findings);
  validatePostgresService(evidence, findings);
  validateMigrationsAndTests(evidence, findings);
  validateFailureVisibility(evidence, findings);
  validateRetryTimeoutRollback(evidence, findings);
  validateSanitization(evidence, findings);
  validateOperations(evidence, findings);

  return {
    ok: findings.length === 0,
    findings
  };
}

function validateWorkflow(
  evidence: RemoteCiPostgresqlEvidence,
  findings: string[]
): void {
  if (evidence.workflow.ciProvider !== "GITHUB_ACTIONS") {
    findings.push("remote CI PostgreSQL proof must identify GitHub Actions provider");
  }
  if (!evidence.workflow.publicRepositoryRun) {
    findings.push("remote CI PostgreSQL public repository workflow run proof is required");
  }
  if (!evidence.workflow.workflowFileReviewed) {
    findings.push("remote CI PostgreSQL workflow file review is required");
  }
  if (!evidence.workflow.boundedJobTimeout) {
    findings.push("remote CI PostgreSQL bounded job timeout proof is required");
  }
  if (!evidence.workflow.readOnlyDefaultPermissions) {
    findings.push("remote CI PostgreSQL read-only permissions proof is required");
  }
  if (!evidence.workflow.concurrencyCancellation) {
    findings.push("remote CI PostgreSQL concurrency cancellation proof is required");
  }
  if (!evidence.workflow.stepSummaryProof) {
    findings.push("remote CI PostgreSQL step summary proof is required");
  }
}

function validatePostgresService(
  evidence: RemoteCiPostgresqlEvidence,
  findings: string[]
): void {
  if (!evidence.postgresService.versionRecorded) {
    findings.push("remote CI PostgreSQL version must be recorded");
  }
  if (!evidence.postgresService.disposableServiceContainer) {
    findings.push("remote CI PostgreSQL disposable service container proof is required");
  }
  if (!evidence.postgresService.healthCheckProof) {
    findings.push("remote CI PostgreSQL service health check proof is required");
  }
  if (!evidence.postgresService.networkIsolation) {
    findings.push("remote CI PostgreSQL network isolation proof is required");
  }
  if (!evidence.postgresService.scopedDatabaseUser) {
    findings.push("remote CI PostgreSQL scoped database user proof is required");
  }
  if (!evidence.postgresService.connectionUrlInjectedByCiSecret) {
    findings.push("remote CI PostgreSQL connection URL must be injected by CI secret");
  }
}

function validateMigrationsAndTests(
  evidence: RemoteCiPostgresqlEvidence,
  findings: string[]
): void {
  if (!evidence.migrationsAndTests.cleanDatabaseMigrationApply) {
    findings.push("remote CI PostgreSQL clean database migration apply proof is required");
  }
  if (!evidence.migrationsAndTests.migrationVersionOrderProof) {
    findings.push("remote CI PostgreSQL migration version-order proof is required");
  }
  if (!evidence.migrationsAndTests.liveRepositoryTests) {
    findings.push("remote CI PostgreSQL live repository tests proof is required");
  }
  if (!evidence.migrationsAndTests.tenantIsolationRegression) {
    findings.push("remote CI PostgreSQL tenant isolation regression proof is required");
  }
  if (!evidence.migrationsAndTests.authRepositoryCoverage) {
    findings.push("remote CI PostgreSQL auth repository coverage proof is required");
  }
  if (!evidence.migrationsAndTests.retentionCleanupCoverage) {
    findings.push("remote CI PostgreSQL retention cleanup coverage proof is required");
  }
  if (evidence.migrationsAndTests.command !== "npm run test:postgres:live") {
    findings.push("remote CI PostgreSQL command must be npm run test:postgres:live");
  }
}

function validateFailureVisibility(
  evidence: RemoteCiPostgresqlEvidence,
  findings: string[]
): void {
  if (!evidence.failureVisibility.failedMigrationVisible) {
    findings.push("remote CI PostgreSQL failed migration visibility proof is required");
  }
  if (!evidence.failureVisibility.failedConnectionVisible) {
    findings.push("remote CI PostgreSQL failed connection visibility proof is required");
  }
  if (!evidence.failureVisibility.failedRepositoryTestVisible) {
    findings.push("remote CI PostgreSQL failed repository test visibility proof is required");
  }
  if (!evidence.failureVisibility.failedTenantIsolationVisible) {
    findings.push("remote CI PostgreSQL failed tenant isolation visibility proof is required");
  }
  if (!evidence.failureVisibility.jobLogsRetained) {
    findings.push("remote CI PostgreSQL job logs retention proof is required");
  }
  if (!evidence.failureVisibility.artifactsRetained) {
    findings.push("remote CI PostgreSQL artifacts retention proof is required");
  }
}

function validateRetryTimeoutRollback(
  evidence: RemoteCiPostgresqlEvidence,
  findings: string[]
): void {
  if (!evidence.retryTimeoutRollback.serviceReadinessTimeout) {
    findings.push("remote CI PostgreSQL service readiness timeout proof is required");
  }
  if (!evidence.retryTimeoutRollback.migrationApplyTimeout) {
    findings.push("remote CI PostgreSQL migration apply timeout proof is required");
  }
  if (!evidence.retryTimeoutRollback.liveTestTimeout) {
    findings.push("remote CI PostgreSQL live test timeout proof is required");
  }
  if (!evidence.retryTimeoutRollback.stuckJobCancellation) {
    findings.push("remote CI PostgreSQL stuck job cancellation proof is required");
  }
  if (!evidence.retryTimeoutRollback.rerunProcedure) {
    findings.push("remote CI PostgreSQL rerun procedure proof is required");
  }
  if (!evidence.retryTimeoutRollback.workflowRollbackProcedure) {
    findings.push("remote CI PostgreSQL workflow rollback procedure proof is required");
  }
  if (!evidence.retryTimeoutRollback.serviceVersionRollbackProcedure) {
    findings.push("remote CI PostgreSQL service version rollback procedure proof is required");
  }
}

function validateSanitization(
  evidence: RemoteCiPostgresqlEvidence,
  findings: string[]
): void {
  if (!evidence.sanitization.noRawDatabaseUrls) {
    findings.push("remote CI PostgreSQL logs must exclude raw database URLs");
  }
  if (!evidence.sanitization.noDatabasePasswords) {
    findings.push("remote CI PostgreSQL logs must exclude database passwords");
  }
  if (!evidence.sanitization.noTokens) {
    findings.push("remote CI PostgreSQL logs must exclude tokens");
  }
  if (!evidence.sanitization.noPrivateHostnames) {
    findings.push("remote CI PostgreSQL logs must exclude private hostnames");
  }
  if (!evidence.sanitization.noPrivatePaths) {
    findings.push("remote CI PostgreSQL logs must exclude private paths");
  }
  if (!evidence.sanitization.noCustomerData) {
    findings.push("remote CI PostgreSQL logs must exclude customer data");
  }
  if (!evidence.sanitization.noCalendarTaskData) {
    findings.push("remote CI PostgreSQL logs must exclude calendar and task data");
  }
  if (!evidence.sanitization.noPrivateLeadershipSystemMaterial) {
    findings.push("remote CI PostgreSQL logs must exclude private compatible leadership system material");
  }
}

function validateOperations(
  evidence: RemoteCiPostgresqlEvidence,
  findings: string[]
): void {
  if (!evidence.operations.remoteCiProofAccepted) {
    findings.push("remote CI PostgreSQL proof acceptance is required");
  }
  if (!evidence.operations.securityAuditPass) {
    findings.push("remote CI PostgreSQL security audit PASS is required");
  }
  if (!evidence.operations.privacyAuditPass) {
    findings.push("remote CI PostgreSQL privacy audit PASS is required");
  }
  if (!evidence.operations.licensingAuditPass) {
    findings.push("remote CI PostgreSQL licensing audit PASS is required");
  }
  if (!evidence.operations.operatorReview) {
    findings.push("remote CI PostgreSQL operator review is required");
  }
  if (!evidence.operations.secondOperatorReview) {
    findings.push("remote CI PostgreSQL second operator review is required");
  }
}
