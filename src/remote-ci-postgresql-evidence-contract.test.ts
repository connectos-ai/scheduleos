import test from "node:test";
import assert from "node:assert/strict";

import {
  type RemoteCiPostgresqlEvidence,
  validateRemoteCiPostgresqlEvidence
} from "./remote-ci-postgresql-evidence-contract.js";

const completeEvidence = (): RemoteCiPostgresqlEvidence => ({
  environment: "ci_demo",
  workflow: {
    ciProvider: "GITHUB_ACTIONS",
    publicRepositoryRun: true,
    workflowFileReviewed: true,
    boundedJobTimeout: true,
    readOnlyDefaultPermissions: true,
    concurrencyCancellation: true,
    stepSummaryProof: true
  },
  postgresService: {
    versionRecorded: true,
    disposableServiceContainer: true,
    healthCheckProof: true,
    networkIsolation: true,
    scopedDatabaseUser: true,
    connectionUrlInjectedByCiSecret: true
  },
  migrationsAndTests: {
    cleanDatabaseMigrationApply: true,
    migrationVersionOrderProof: true,
    liveRepositoryTests: true,
    tenantIsolationRegression: true,
    authRepositoryCoverage: true,
    retentionCleanupCoverage: true,
    command: "npm run test:postgres:live"
  },
  failureVisibility: {
    failedMigrationVisible: true,
    failedConnectionVisible: true,
    failedRepositoryTestVisible: true,
    failedTenantIsolationVisible: true,
    jobLogsRetained: true,
    artifactsRetained: true
  },
  retryTimeoutRollback: {
    serviceReadinessTimeout: true,
    migrationApplyTimeout: true,
    liveTestTimeout: true,
    stuckJobCancellation: true,
    rerunProcedure: true,
    workflowRollbackProcedure: true,
    serviceVersionRollbackProcedure: true
  },
  sanitization: {
    noRawDatabaseUrls: true,
    noDatabasePasswords: true,
    noTokens: true,
    noPrivateHostnames: true,
    noPrivatePaths: true,
    noCustomerData: true,
    noCalendarTaskData: true,
    noPrivateLeadershipSystemMaterial: true
  },
  operations: {
    remoteCiProofAccepted: true,
    securityAuditPass: true,
    privacyAuditPass: true,
    licensingAuditPass: true,
    operatorReview: true,
    secondOperatorReview: true
  }
});

test("remote CI PostgreSQL evidence accepts complete release-grade evidence shape", () => {
  const result = validateRemoteCiPostgresqlEvidence(completeEvidence());

  assert.equal(result.ok, true);
  assert.deepEqual(result.findings, []);
});

test("remote CI PostgreSQL evidence rejects missing workflow proof", () => {
  const evidence = completeEvidence();
  evidence.workflow.publicRepositoryRun = false;
  evidence.workflow.workflowFileReviewed = false;
  evidence.workflow.boundedJobTimeout = false;
  evidence.workflow.readOnlyDefaultPermissions = false;
  evidence.workflow.stepSummaryProof = false;

  const result = validateRemoteCiPostgresqlEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /public repository workflow run/);
  assert.match(result.findings.join("\n"), /workflow file review/);
  assert.match(result.findings.join("\n"), /bounded job timeout/);
  assert.match(result.findings.join("\n"), /read-only permissions/);
  assert.match(result.findings.join("\n"), /step summary/);
});

test("remote CI PostgreSQL evidence rejects incomplete service migration and test proof", () => {
  const evidence = completeEvidence();
  evidence.postgresService.versionRecorded = false;
  evidence.postgresService.healthCheckProof = false;
  evidence.postgresService.scopedDatabaseUser = false;
  evidence.migrationsAndTests.cleanDatabaseMigrationApply = false;
  evidence.migrationsAndTests.liveRepositoryTests = false;
  evidence.migrationsAndTests.tenantIsolationRegression = false;
  evidence.migrationsAndTests.command = "npm test";

  const result = validateRemoteCiPostgresqlEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /version must be recorded/);
  assert.match(result.findings.join("\n"), /health check/);
  assert.match(result.findings.join("\n"), /scoped database user/);
  assert.match(result.findings.join("\n"), /clean database migration/);
  assert.match(result.findings.join("\n"), /live repository tests/);
  assert.match(result.findings.join("\n"), /tenant isolation/);
  assert.match(result.findings.join("\n"), /npm run test:postgres:live/);
});

test("remote CI PostgreSQL evidence rejects missing failure retry rollback proof", () => {
  const evidence = completeEvidence();
  evidence.failureVisibility.failedMigrationVisible = false;
  evidence.failureVisibility.failedConnectionVisible = false;
  evidence.failureVisibility.artifactsRetained = false;
  evidence.retryTimeoutRollback.serviceReadinessTimeout = false;
  evidence.retryTimeoutRollback.stuckJobCancellation = false;
  evidence.retryTimeoutRollback.workflowRollbackProcedure = false;

  const result = validateRemoteCiPostgresqlEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /failed migration/);
  assert.match(result.findings.join("\n"), /failed connection/);
  assert.match(result.findings.join("\n"), /artifacts/);
  assert.match(result.findings.join("\n"), /service readiness timeout/);
  assert.match(result.findings.join("\n"), /stuck job cancellation/);
  assert.match(result.findings.join("\n"), /workflow rollback/);
});

test("remote CI PostgreSQL evidence rejects unsafe logs and missing approvals", () => {
  const evidence = completeEvidence();
  evidence.sanitization.noRawDatabaseUrls = false;
  evidence.sanitization.noDatabasePasswords = false;
  evidence.sanitization.noPrivatePaths = false;
  evidence.sanitization.noPrivateLeadershipSystemMaterial = false;
  evidence.operations.remoteCiProofAccepted = false;
  evidence.operations.securityAuditPass = false;
  evidence.operations.secondOperatorReview = false;

  const result = validateRemoteCiPostgresqlEvidence(evidence);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /raw database URLs/);
  assert.match(result.findings.join("\n"), /database passwords/);
  assert.match(result.findings.join("\n"), /private paths/);
  assert.match(result.findings.join("\n"), /private compatible leadership system/);
  assert.match(result.findings.join("\n"), /proof acceptance/);
  assert.match(result.findings.join("\n"), /security audit/);
  assert.match(result.findings.join("\n"), /second operator/);
});
