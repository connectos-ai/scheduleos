import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
 requireDestructiveConfirmation,
 restoreOverwriteConfirmation,
 scopedConfirmation,
 timedScopedConfirmation
} from "./destructive-approval.js";
import {
 createPgPostgresQueryClientFromEnv,
 type CloseablePostgresQueryClient
} from "./postgres-client.js";
import {
 cleanupPostgresRetention,
 type PostgresRetentionCleanupResult
} from "./postgres-repositories.js";
import {
 loadPostgresMigrations,
 runPostgresMigrations,
 type PostgresMigration,
  type PostgresQueryClient
} from "./postgres.js";
import type { RepositoryActor, Scope } from "./repositories.js";
import { calculateRetentionCutoffs, scheduleOSRetentionPolicy } from "./retention-policy.js";
import {
  backupSqliteDatabase,
  cleanupSqliteRetention,
  deleteSqliteWorkspace,
  exportSqliteWorkspace,
 restoreSqliteDatabase,
 type SqliteBackupOptions,
 type SqliteBackupResult,
  type SqliteRestoreOptions,
  type SqliteRestoreResult,
  type SqliteRetentionCleanupResult,
  type SqliteWorkspaceDeletionResult,
  type SqliteWorkspaceExport
} from "./sqlite.js";

export interface CliIO {
  stdout: (message: string) => void;
  stderr: (message: string) => void;
}

export interface CliOptions {
  client?: PostgresQueryClient;
  createPostgresClient?: () => CloseablePostgresQueryClient | undefined;
  loadMigrations?: (directory?: string) => Promise<PostgresMigration[]>;
 sqliteBackup?: (
  databasePath: string,
  backupPath: string,
  options?: SqliteBackupOptions
 ) => Promise<SqliteBackupResult>;
  sqliteRestore?: (
    backupPath: string,
    restorePath: string,
    smokeScope: Scope,
 options?: SqliteRestoreOptions
 ) => Promise<SqliteRestoreResult>;
  sqliteExport?: (
    databasePath: string,
    actor: RepositoryActor,
    scope: Scope
  ) => SqliteWorkspaceExport;
  sqliteDeleteWorkspace?: (
    databasePath: string,
    actor: RepositoryActor,
    scope: Scope
  ) => SqliteWorkspaceDeletionResult;
 sqliteRetentionCleanup?: (
  databasePath: string,
  actor: RepositoryActor,
  scope: Scope,
  asOf: Date,
  options?: { dryRun?: boolean }
 ) => SqliteRetentionCleanupResult;
 postgresRetentionCleanup?: (
  client: PostgresQueryClient,
  actor: RepositoryActor,
  scope: Scope,
  asOf: Date,
  options?: { dryRun?: boolean }
 ) => Promise<PostgresRetentionCleanupResult>;
 writeFile?: (path: string, data: string) => Promise<void>;
}

interface PostgresMigrateCommand {
  dryRun: boolean;
  json: boolean;
  migrationsDir: string;
}

interface PublicEventDeliveryOperatorPacketCommand {
  scope: Scope;
  asOf: Date;
  json: boolean;
  type?: string;
  sourceSystem?: string;
  maxSubscriptions?: number;
  maxEvents?: number;
}

interface PublicEventDeadLetterQueuePacketCommand {
  scope: Scope;
  asOf: Date;
  json: boolean;
  maxAttempts: number;
  type?: string;
  status?: "UNREVIEWED" | "REVIEWED";
}

interface PublicEventDeliveryIncidentDrillPacketCommand {
  scope: Scope;
  asOf: Date;
  incidentId: string;
  failureClass:
    | "network"
    | "receiver"
    | "signature"
    | "throttling"
    | "contract"
    | "privacy"
    | "cross-scope"
    | "worker";
  json: boolean;
  type?: string;
  sourceSystem?: string;
  maxSubscriptions?: number;
  maxEvents?: number;
}

interface AuthProductionReadinessPacketCommand {
  environment: string;
  backend: "sqlite" | "postgres";
  scope: Scope;
  asOf: Date;
  json: boolean;
  identityProvider: string;
  sessionStore: string;
  authorizationMatrix: string;
  roleMembershipProof: string;
  sessionLifecycle: string;
  resetTokenLifecycle: string;
  lockoutPruning: string;
  cookieTransport: string;
  startupGuard: string;
  migrationPlan: string;
  rollbackDrill: string;
  remoteCi: string;
  rollbackPlan: string;
  secondOperator: string;
}

interface AuthAuthorizationMatrixPacketCommand {
  matrix: string;
  environment: string;
  backend: "sqlite" | "postgres";
  scope: Scope;
  asOf: Date;
  json: boolean;
}

interface RateLimitProductionReadinessPacketCommand {
  environment: string;
  scope: Scope;
  asOf: Date;
  json: boolean;
  edgeLayer: string;
  distributedStore: string;
  providerQuotaPolicy: string;
  trustedProxyProof: string;
  hostedAlertRouting: string;
  hostedDashboard: string;
  abuseAnalytics: string;
  remoteCi: string;
  rollbackPlan: string;
  secondOperator: string;
}

interface ProviderLifecycleReadinessPacketCommand {
  environment: string;
  provider: string;
  scope: Scope;
  asOf: Date;
  managedSecretCustody: string;
  rotationDrill: string;
  revocationDrill: string;
 writeBackSafety: string;
 hostedAlertRouting: string;
  providerRunbook: string;
  remoteCi: string;
  rollbackPlan: string;
  secondOperator: string;
  json: boolean;
}

const REQUIRED_PROVIDER_RUNBOOK_SECTIONS = [
  "provider setup",
  "permissions and scopes",
  "managed-secret custody",
  "rotation drill",
  "emergency revocation drill",
  "write-back safety",
  "sync checkpoint recovery",
  "hosted operator alerts",
  "incident response",
  "rollback",
  "privacy minimization",
  "support escalation",
  "sanitized evidence examples"
] as const;

interface CalendarUiProductionReadinessPacketCommand {
  environment: string;
  scope: Scope;
  asOf: Date;
  browserMatrix: string;
  conflictWorkflow: string;
  writeBackAcknowledgement: string;
  accessibilityAudit: string;
 responsivePolish: string;
 visualRegression: string;
  productOwnerApproval: string;
  remoteCi: string;
  rollbackPlan: string;
  secondOperator: string;
  json: boolean;
}

interface WebAppProductionReadinessPacketCommand {
  environment: string;
  scope: Scope;
  asOf: Date;
  deploymentTarget: string;
  productionBuild: string;
  authenticatedWriteFlow: string;
  securityHeaders: string;
  csrfCookieTransport: string;
  throttlePolicy: string;
  durableStorage: string;
  cachePolicy: string;
  healthStartupGuard: string;
  browserMatrix: string;
  accessibilityAudit: string;
  responsivePolish: string;
  visualRegression: string;
  operatorReview: string;
  remoteCi: string;
  rollbackPlan: string;
  secondOperator: string;
  json: boolean;
}

interface ProductionDeploymentReadinessPacketCommand {
  environment: string;
  scope: Scope;
  asOf: Date;
  deploymentTopology: string;
  tlsTermination: string;
  reverseProxyHeaders: string;
  securityHeaders: string;
  startupGuards: string;
  healthChecks: string;
  durableStorage: string;
  cookieCsrfTransport: string;
  trustedProxyThrottle: string;
  staticAssetCache: string;
  logRedaction: string;
  backupRollback: string;
  remoteCiDeploymentSmoke: string;
  operatorReview: string;
  secondOperator: string;
  json: boolean;
}

interface IcsProductionReadinessPacketCommand {
  environment: string;
  scope: Scope;
  asOf: Date;
  recurrenceSuite: string;
  timezoneDstProof: string;
  syncIdempotencyProof: string;
  importPreviewUx: string;
  exportPrivacyRedaction: string;
  writeBackConflictPreview: string;
  providerNeutralContract: string;
  providerFixtureSuite: string;
  largeCalendarFixture: string;
  browserWorkflow: string;
  remoteCi: string;
  rollbackPlan: string;
  secondOperator: string;
  json: boolean;
}

interface ProviderCsvProductionReadinessPacketCommand {
  environment: string;
  scope: Scope;
  asOf: Date;
  fixtureSuite: string;
  downloadUploadWorkflow: string;
  confirmationUx: string;
  providerPolicy: string;
  browserWorkflow: string;
  abuseAnalytics: string;
  largeFixtureSuite: string;
  formulaInjectionRegression: string;
  fieldMappingPrivacy: string;
  remoteCi: string;
  rollbackPlan: string;
  secondOperator: string;
  json: boolean;
}

interface PublicEventsHostedDeliveryReadinessPacketCommand {
  environment: string;
  scope: Scope;
  asOf: Date;
  secretProvider: string;
  runtimeIdentity: string;
  rotationDrill: string;
  workerTopology: string;
  retryQueue: string;
  deadLetterQueue: string;
  hostedDashboard: string;
  alertRouting: string;
  replayBoundary: string;
  rateLimitHeaderKey: string;
  incidentDrill: string;
  remoteCi: string;
  rollbackPlan: string;
  secondOperator: string;
  json: boolean;
}

interface RemoteCiPostgresReadinessPacketCommand {
  environment: string;
  scope: Scope;
  asOf: Date;
  ciProvider: string;
  postgresService: string;
  json: boolean;
}

interface PublicRemoteCiReadinessPacketCommand {
  environment: string;
  scope: Scope;
  asOf: Date;
  ciProvider: string;
  workflowSuite: string;
  targetRepository: string;
  workflowRun: string;
  checkRun: string;
  productionDependencyAudit: string;
  noGitDirectory: string;
  releaseSafetyScan: string;
  docsLinkCheck: string;
  licenseCheck: string;
  logSanitization: string;
  artifactRetention: string;
  branchProtectionReview: string;
  repositorySettingsReadiness: string;
  secondOperator: string;
  json: boolean;
}

interface DestructiveApprovalReadinessPacketCommand {
  environment: string;
  scope: Scope;
  asOf: Date;
destructiveOperation: string;
approvalPolicy: string;
dryRunDiff: string;
freshBackup: string;
restoreSmoke: string;
exactConfirmation: string;
twoOperatorApproval: string;
legalSupportApproval: string;
scopeProof: string;
maintenanceWindow: string;
rollbackProcedure: string;
auditRetention: string;
hostedSchedulerDisablement: string;
remoteCi: string;
json: boolean;
}

interface RepositoryLaunchReadinessPacketCommand {
  environment: string;
  scope: Scope;
  asOf: Date;
  targetRepository: string;
  historyPlan: string;
  finalReleaseGate: string;
  cleanPublicHistory: string;
  privacySecretScan: string;
  licenseAuditPass: string;
  securityAuditPass: string;
  securityPolicyContact: string;
  remoteCiPass: string;
  nameCollisionReview: string;
  trademarkReview: string;
  firstCommitStaging: string;
  repositorySettings: string;
  secondOperator: string;
  json: boolean;
}

interface RepositorySettingsReadinessPacketCommand {
  environment: string;
  scope: Scope;
  asOf: Date;
  targetRepository: string;
  settingsProfile: string;
  branchPolicy: string;
  branchProtectionSettings: string;
  requiredStatusChecks: string;
  securityAdvisorySettings: string;
  defaultBranchMergePolicy: string;
  maintainerAccessReview: string;
  dependabotAlerts: string;
  secretScanningPushProtection: string;
  releasePackagePermissions: string;
  repositoryMetadata: string;
  publicIssueDiscussionSettings: string;
  secondOperator: string;
  json: boolean;
}

interface CleanHistoryReadinessPacketCommand {
  environment: string;
  scope: Scope;
  asOf: Date;
  historyScope: string;
  sourceRoot: string;
  noGitDirectory: string;
  releaseSafetyScan: string;
  firstCommitStagingManifest: string;
  generatedArtifactReview: string;
  fixtureSanitization: string;
  licenseNoticeReadiness: string;
  repositoryNaming: string;
  remoteCiPlan: string;
  secondOperator: string;
  json: boolean;
}

interface GeneratedArtifactReviewPacketCommand {
environment: string;
scope: Scope;
asOf: Date;
artifactScope: string;
manifest: string;
json: boolean;
}

interface SecurityPolicyContactReadinessPacketCommand {
  environment: string;
  scope: Scope;
  asOf: Date;
  contactChannel: string;
  responsibleParty: string;
  disclosureWorkflow: string;
  advisorySettings: string;
  responseSla: string;
  escalationPath: string;
  privateReportSanitization: string;
  remoteCiSecurityWorkflow: string;
  secondOperator: string;
  json: boolean;
}

interface FinalSecurityAuditReadinessPacketCommand {
  environment: string;
  scope: Scope;
  asOf: Date;
  auditScope: string;
  dependencyAuditPass: string;
  secretScan: string;
  privacyScan: string;
  productionAuth: string;
  roleMembership: string;
  resetTokenLifecycle: string;
  rateLimitAbuseMonitoring: string;
  providerManagedSecretLifecycle: string;
  deploymentTlsProxyHeaders: string;
  remoteCi: string;
  securityPolicyContact: string;
  finalSourceReview: string;
  secondOperator: string;
  json: boolean;
}

interface FinalLicensingAuditReadinessPacketCommand {
  environment: string;
  scope: Scope;
  asOf: Date;
  auditScope: string;
  finalLicenseCheck: string;
  lockfileDependencyLicenses: string;
  installedDependencyMetadata: string;
  copiedSourceScan: string;
  fixtureTemplateExampleReview: string;
  assetMediaFontBinaryReview: string;
  documentationReuseScan: string;
  reusedMaterialInventory: string;
  noticeReview: string;
  rootLicenseConsistency: string;
  finalReleaseCandidateFreeze: string;
  secondOperator: string;
  json: boolean;
}

interface FinalPrivacyAuditReadinessPacketCommand {
  environment: string;
  scope: Scope;
  asOf: Date;
  auditScope: string;
  releaseSafetyScan: string;
  fixtureSanitization: string;
  generatedArtifactReview: string;
  logExportBackupReview: string;
  providerIdentifierReview: string;
  localPathPrivateUrlReview: string;
  privateLeadershipBoundary: string;
  calendarTaskMinimization: string;
  aiRedactionBoundary: string;
  retentionExportDeletionRevocation: string;
  secondOperator: string;
  json: boolean;
}

interface FinalReleaseGateReadinessPacketCommand {
  environment: string;
  scope: Scope;
  asOf: Date;
  releaseScope: string;
  functionalityGate: string;
  storageGate: string;
  documentationGate: string;
  securityAuditPass: string;
  licensingAuditPass: string;
  privacyAuditPass: string;
  dependencyAuditFinalPass: string;
  remoteCiPass: string;
  cleanHistory: string;
  securityPolicyContact: string;
  repositorySettings: string;
  finalSourceReview: string;
  secondOperator: string;
  json: boolean;
}

interface DependencyAuditReadinessPacketCommand {
  environment: string;
  scope: Scope;
  asOf: Date;
  auditScope: string;
  packageManager: string;
  productionAudit: string;
  lockfileProof: string;
  installedTree: string;
  runtimeInventory: string;
  devDependencyExclusion: string;
  overrideReview: string;
  licenseAlignment: string;
  registrySecretAbsence: string;
  remoteCi: string;
  secondOperator: string;
  json: boolean;
}

const defaultMigrationsDir = "migrations/postgres";

export async function runCli(
  argv: readonly string[],
  io: CliIO = defaultCliIO,
  options: CliOptions = {}
): Promise<number> {
  const [command, ...args] = argv;

  if (command === "postgres:migrate") {
    return runPostgresMigrateCommand(args, io, options);
  }

  if (command === "sqlite:backup") {
    return runSqliteBackupCommand(args, io, options);
  }

  if (command === "sqlite:restore") {
    return runSqliteRestoreCommand(args, io, options);
  }

  if (command === "sqlite:export") {
    return runSqliteExportCommand(args, io, options);
  }

  if (command === "sqlite:delete-workspace") {
    return runSqliteDeleteWorkspaceCommand(args, io, options);
  }
  if (command === "retention:policy") {
    return runRetentionPolicyCommand(args, io);
  }
  if (command === "retention:operator-packet") {
    return runRetentionOperatorPacketCommand(args, io);
  }
  if (command === "retention:hosted-cleanup-packet") {
    return runHostedRetentionCleanupPacketCommand(args, io);
  }
  if (command === "retention:destructive-approval-readiness-packet") {
    return runDestructiveApprovalReadinessPacketCommand(args, io);
  }
  if (command === "auth:production-readiness-packet") {
    return runAuthProductionReadinessPacketCommand(args, io);
  }
  if (command === "auth:authorization-matrix-packet") {
    return runAuthAuthorizationMatrixPacketCommand(args, io);
  }
  if (command === "rate-limit:production-readiness-packet") {
    return runRateLimitProductionReadinessPacketCommand(args, io);
  }
  if (command === "providers:lifecycle-readiness-packet") {
    return runProviderLifecycleReadinessPacketCommand(args, io);
  }
  if (command === "calendar-ui:production-readiness-packet") {
    return runCalendarUiProductionReadinessPacketCommand(args, io);
  }
  if (command === "web-app:production-readiness-packet") {
    return runWebAppProductionReadinessPacketCommand(args, io);
  }
  if (command === "deployment:production-readiness-packet") {
    return runProductionDeploymentReadinessPacketCommand(args, io);
  }
  if (command === "ics:production-readiness-packet") {
    return runIcsProductionReadinessPacketCommand(args, io);
  }
  if (command === "provider-csv:production-readiness-packet") {
    return runProviderCsvProductionReadinessPacketCommand(args, io);
  }
  if (command === "public-events:hosted-delivery-readiness-packet") {
    return runPublicEventsHostedDeliveryReadinessPacketCommand(args, io);
  }
if (command === "remote-ci:postgres-readiness-packet") {
return runRemoteCiPostgresReadinessPacketCommand(args, io);
}
if (command === "remote-ci:public-readiness-packet") {
return runPublicRemoteCiReadinessPacketCommand(args, io);
}
if (command === "repository:launch-readiness-packet") {
return runRepositoryLaunchReadinessPacketCommand(args, io);
}
if (command === "repository:settings-readiness-packet") {
return runRepositorySettingsReadinessPacketCommand(args, io);
}
if (command === "repository:clean-history-readiness-packet") {
return runCleanHistoryReadinessPacketCommand(args, io);
}
if (command === "release:generated-artifact-review-packet") {
return runGeneratedArtifactReviewPacketCommand(args, io);
}
if (command === "security:policy-contact-readiness-packet") {
return runSecurityPolicyContactReadinessPacketCommand(args, io);
}
 if (command === "security:final-audit-readiness-packet") {
 return runFinalSecurityAuditReadinessPacketCommand(args, io);
 }
  if (command === "licensing:final-audit-readiness-packet") {
    return runFinalLicensingAuditReadinessPacketCommand(args, io);
  }
  if (command === "privacy:final-audit-readiness-packet") {
    return runFinalPrivacyAuditReadinessPacketCommand(args, io);
  }
if (command === "release:final-gate-readiness-packet") {
 return runFinalReleaseGateReadinessPacketCommand(args, io);
 }
 if (command === "dependency:final-audit-readiness-packet") {
 return runDependencyAuditReadinessPacketCommand(args, io);
 }
 if (command === "public-events:delivery-operator-packet") {
 return runPublicEventDeliveryOperatorPacketCommand(args, io);
 }
  if (command === "public-events:dead-letter-queue-packet") {
    return runPublicEventDeadLetterQueuePacketCommand(args, io);
  }
  if (command === "public-events:delivery-incident-drill-packet") {
    return runPublicEventDeliveryIncidentDrillPacketCommand(args, io);
  }
  if (command === "retention:sqlite-cleanup") {
    return runRetentionSqliteCleanupCommand(args, io, options);
  }
 if (command === "retention:postgres-cleanup") {
  return runRetentionPostgresCleanupCommand(args, io, options);
 }

  io.stderr(helpText());
  return 1;
}

const defaultCliIO: CliIO = {
  stdout(message) {
    console.log(message);
  },
  stderr(message) {
    console.error(message);
  }
};

async function runPostgresMigrateCommand(
  args: readonly string[],
  io: CliIO,
  options: CliOptions
): Promise<number> {
  const parsed = parsePostgresMigrateArgs(args);

  if ("error" in parsed) {
    io.stderr(parsed.error);
    return 1;
  }

  const loadMigrations = options.loadMigrations ?? loadPostgresMigrations;
  const migrations = await loadMigrations(parsed.migrationsDir);

  if (parsed.dryRun) {
    writeMigrationDryRun(io, migrations, parsed.json);
    return 0;
  }

  const configuredClient = resolvePostgresClient(options);

  if (!configuredClient) {
    io.stderr(
      "PostgreSQL client not configured. Use --dry-run, set SCHEDULEOS_POSTGRES_URL, or call runCli with a PostgresQueryClient."
    );
    return 1;
  }

  try {
    const result = await runPostgresMigrations(
      configuredClient.client,
      migrations
    );

    if (parsed.json) {
      io.stdout(JSON.stringify(result, null, 2));
      return 0;
    }

    io.stdout(
      [
        "PostgreSQL migrations applied.",
        `Applied versions: ${formatVersions(result.appliedVersions)}`,
        `Skipped versions: ${formatVersions(result.skippedVersions)}`
      ].join("\n")
    );

    return 0;
  } finally {
    if (configuredClient.closeAfterUse) {
      await configuredClient.client.end();
    }
  }
}

function resolvePostgresClient(
  options: CliOptions
):
  | { client: PostgresQueryClient; closeAfterUse: false }
  | { client: CloseablePostgresQueryClient; closeAfterUse: true }
  | undefined {
  if (options.client) {
    return { client: options.client, closeAfterUse: false };
  }

  const client =
    options.createPostgresClient?.() ?? createPgPostgresQueryClientFromEnv();

  return client ? { client, closeAfterUse: true } : undefined;
}

function parsePostgresMigrateArgs(
  args: readonly string[]
): PostgresMigrateCommand | { error: string } {
  let dryRun = false;
  let json = false;
  let migrationsDir = defaultMigrationsDir;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg === "--json") {
      json = true;
      continue;
    }

    if (arg === "--migrations-dir") {
      const value = args[index + 1];

      if (!value) {
        return { error: "--migrations-dir requires a path" };
      }

      migrationsDir = value;
      index += 1;
      continue;
    }

    return { error: `Unknown postgres:migrate option: ${arg}` };
  }

  return { dryRun, json, migrationsDir };
}

async function runSqliteBackupCommand(
  args: readonly string[],
  io: CliIO,
  options: CliOptions
): Promise<number> {
  const parsed = parseSqliteBackupArgs(args);
  if ("error" in parsed) {
    io.stderr(parsed.error);
    return 1;
  }

 const result = await (options.sqliteBackup ?? backupSqliteDatabase)(
  parsed.databasePath,
  parsed.backupPath,
  parsed.encryptionPassphrase
   ? { encryptionPassphrase: parsed.encryptionPassphrase }
   : undefined
 );
  writeCommandResult(
    io,
    parsed.json,
    result,
    `SQLite backup created: ${result.backupPath} (${result.bytes} bytes)`
  );
  return 0;
}

async function runSqliteRestoreCommand(
  args: readonly string[],
  io: CliIO,
  options: CliOptions
): Promise<number> {
  const parsed = parseSqliteRestoreArgs(args);
 if ("error" in parsed) {
  io.stderr(parsed.error);
  return 1;
 }

 if (parsed.overwrite) {
  const approval = requireDestructiveConfirmation(
   parsed.confirm,
   restoreOverwriteConfirmation(parsed.scope, parsed.restorePath),
   "SQLite restore overwrite"
  );
  if (!approval.approved) {
   io.stderr(approval.refusal);
   return 1;
  }
 }

 const result = await (options.sqliteRestore ?? restoreSqliteDatabase)(
  parsed.backupPath,
  parsed.restorePath,
  parsed.scope,
  {
   overwrite: parsed.overwrite,
   ...(parsed.encryptionPassphrase
    ? { encryptionPassphrase: parsed.encryptionPassphrase }
    : {})
  }
 );
  writeCommandResult(
    io,
    parsed.json,
    result,
    `SQLite restore validated: ${result.restorePath} (${result.bytes} bytes)`
  );
  return 0;
}

async function runSqliteExportCommand(
  args: readonly string[],
  io: CliIO,
  options: CliOptions
): Promise<number> {
  const parsed = parseSqliteExportArgs(args);
  if ("error" in parsed) {
    io.stderr(parsed.error);
    return 1;
  }

  const exported = (options.sqliteExport ?? exportSqliteWorkspace)(
    parsed.databasePath,
    { kind: "system" },
    parsed.scope
  );
  const json = JSON.stringify(exported, null, 2);

  if (parsed.outputPath) {
    await (options.writeFile ?? writeFileWithDirectory)(parsed.outputPath, json);
    io.stdout(`SQLite workspace export written: ${parsed.outputPath}`);
  } else {
    io.stdout(json);
  }

  return 0;
}

async function runSqliteDeleteWorkspaceCommand(
  args: readonly string[],
  io: CliIO,
  options: CliOptions
): Promise<number> {
  const parsed = parseSqliteDeleteWorkspaceArgs(args);
  if ("error" in parsed) {
    io.stderr(parsed.error);
    return 1;
  }

  const approval = requireDestructiveConfirmation(
    parsed.confirm,
    scopedConfirmation(parsed.scope),
    "destructive delete"
  );
  if (!approval.approved) {
    io.stderr(approval.refusal);
    return 1;
  }

  const result = (options.sqliteDeleteWorkspace ?? deleteSqliteWorkspace)(
    parsed.databasePath,
    { kind: "system" },
    parsed.scope
  );
  writeCommandResult(
    io,
    parsed.json,
    result,
    `SQLite workspace deleted: ${approval.requiredConfirmation}`
  );
  return 0;
}

function runRetentionPolicyCommand(args: readonly string[], io: CliIO): number {
  const parsed = parseRetentionPolicyArgs(args);
  if ("error" in parsed) {
    io.stderr(parsed.error);
    return 1;
  }

  const cutoffs = calculateRetentionCutoffs(parsed.asOf);
  const result = {
    asOf: parsed.asOf.toISOString(),
    policy: scheduleOSRetentionPolicy,
    cutoffs
  };

  if (parsed.json) {
    io.stdout(JSON.stringify(result, null, 2));
    return 0;
  }

  io.stdout(
    [
      `ScheduleOS retention policy as of ${result.asOf}`,
      ...scheduleOSRetentionPolicy.map((entry) => {
        const cutoff = cutoffs.find((item) => item.category === entry.category);
        const retention =
          entry.retentionDays === null ? "until explicit deletion" : `${entry.retentionDays} days`;
        const deleteBefore = cutoff?.deleteBefore ? ` delete before ${cutoff.deleteBefore}` : "";
        return `${entry.category}: ${retention}; ${entry.action};${deleteBefore}`;
      })
    ].join("\n")
  );
  return 0;
}

function runRetentionOperatorPacketCommand(
  args: readonly string[],
  io: CliIO
): number {
  const parsed = parseRetentionOperatorPacketArgs(args);
  if ("error" in parsed) {
    io.stderr(parsed.error);
    return 1;
  }

  const requiredConfirmation = timedScopedConfirmation(parsed.scope, parsed.asOf);
  const scopedArgs = [
    "--tenant-id",
    parsed.scope.tenantId,
    "--workspace-id",
    parsed.scope.workspaceId,
    "--user-id",
    parsed.scope.userId,
    "--as-of",
    parsed.asOf.toISOString()
  ];
  const dryRunCommand =
    parsed.backend === "sqlite"
      ? [
          "npm",
          "run",
          "retention:sqlite-cleanup",
          "--",
          "--database",
          parsed.databasePath ?? "",
          ...scopedArgs,
          "--json"
        ]
      : ["npm", "run", "retention:postgres-cleanup", "--", ...scopedArgs, "--json"];
  const applyCommand = [
    ...dryRunCommand,
    "--apply",
    "--confirm",
    requiredConfirmation
  ];
  const packet = {
    generatedAt: new Date().toISOString(),
    backend: parsed.backend,
    scope: parsed.scope,
    asOf: parsed.asOf.toISOString(),
    destructiveAction: "retention cleanup apply",
    requiredConfirmation,
    applyAllowedByPacket: false,
    secondOperatorReviewRequired: true,
    dryRunCommand,
    applyCommand,
    reviewSteps: [
      "Run the dry-run command and save the JSON output.",
      "Compare eligible and reviewDue counts against expected retention policy.",
      "Confirm no active tasks, calendar events, working hours, backups, exports, or connected integration state will be deleted.",
      "Have a second operator review the dry-run output, scope, timestamp, and required confirmation token.",
      "Only run the apply command after backup validation and explicit approval are recorded outside ScheduleOS."
    ],
    releaseBoundary:
      "Operator packet foundation only; hosted scheduled cleanup, alerting, approval workflow, and production runbook verification remain release blockers."
  };

  if (parsed.json) {
    io.stdout(JSON.stringify(packet, null, 2));
    return 0;
  }

  io.stdout(
    [
      "ScheduleOS retention operator approval packet.",
      `Backend: ${packet.backend}`,
      `Scope: ${packet.scope.tenantId}/${packet.scope.workspaceId}/${packet.scope.userId}`,
      `As of: ${packet.asOf}`,
      `Required confirmation: ${packet.requiredConfirmation}`,
      "Second operator review required: yes",
      "Apply allowed by this packet: no",
      `Dry run: ${packet.dryRunCommand.join(" ")}`
    ].join("\n")
  );
  return 0;
}

function runHostedRetentionCleanupPacketCommand(
  args: readonly string[],
  io: CliIO
): number {
  const parsed = parseHostedRetentionCleanupPacketArgs(args);
  if ("error" in parsed) {
    io.stderr(parsed.error);
    return 1;
  }

  const dryRunEvidenceCommand = [
    "npm",
    "run",
    "retention:operator-packet",
    "--",
    "--backend",
    "postgres",
    "--tenant-id",
    parsed.scope.tenantId,
    "--workspace-id",
    parsed.scope.workspaceId,
    "--user-id",
    parsed.scope.userId,
    "--as-of",
    parsed.asOf.toISOString(),
    "--json"
  ];
  const packet = {
    generatedAt: new Date().toISOString(),
    operation: "hosted retention cleanup approval",
    environment: parsed.environment,
    scope: parsed.scope,
    asOf: parsed.asOf.toISOString(),
    maintenanceWindow: {
      start: parsed.windowStart.toISOString(),
      end: parsed.windowEnd.toISOString()
    },
dryRunEvidence: parsed.dryRunEvidence,
backupEvidence: parsed.backupEvidence,
externalApprovalRecord: parsed.approvalRecord,
legalSupportReview: parsed.legalSupportReview,
rollbackPlan: parsed.rollbackPlan,
secondOperator: parsed.secondOperator,
dryRunEvidenceCommand,
    applyAllowedByPacket: false,
    deleteAllowedByPacket: false,
    secondOperatorReviewRequired: true,
    backupEvidenceRequired: true,
    hostedSchedulerRequiredForProduction: true,
    approvalRecord: {
      mustBeStoredOutsideCleanupScope: true,
      requiredFields: [
        "environment",
        "scope",
        "asOf",
        "maintenanceWindow",
        "dryRunEvidenceDigest",
        "backupEvidenceDigest",
        "primaryOperatorId",
        "secondOperatorId",
        "legalSupportReview"
      ]
    },
    evidenceRequired: [
      `retention dry-run JSON packet and digest: ${parsed.dryRunEvidence}`,
      `backup or export validation evidence and digest: ${parsed.backupEvidence}`,
      "hosted scheduler job identity and runtime identity",
      "scope-specific eligible counts and reviewDue counts",
      `operator approval record stored outside cleanup scope: ${parsed.approvalRecord}`,
      `legal/support review evidence: ${parsed.legalSupportReview}`,
      `rollback plan evidence: ${parsed.rollbackPlan}`,
      `second-operator review evidence: ${parsed.secondOperator}`,
      "post-window audit-event evidence and failure handling notes"
    ],
    reviewSteps: [
      "Generate and save retention dry-run JSON before the maintenance window, then attach evidence label " + parsed.dryRunEvidence + ".",
      "Confirm dry-run eligible and reviewDue counts match retention policy expectations.",
      `Confirm legal/support review ${parsed.legalSupportReview} covers audit events and deleted-workspace notes.`,
      `Confirm backup/export validation evidence ${parsed.backupEvidence} exists before cleanup approval.`,
      `Confirm rollback plan ${parsed.rollbackPlan} before enabling any hosted cleanup job.`,
      `Require second operator approval ${parsed.secondOperator} before enabling any hosted cleanup job.`,
      "Record final approval outside the tenant/workspace/user cleanup scope."
    ],
    releaseBoundary:
      "Hosted cleanup approval packet foundation only; it does not schedule, approve, apply, or delete records. Production hosted cleanup scheduler, alerting, failure handling, deployment verification, and final security/privacy approval remain release blockers."
  };

  if (parsed.json) {
    io.stdout(JSON.stringify(packet, null, 2));
    return 0;
  }

  io.stdout(
    [
      "ScheduleOS hosted retention cleanup approval packet.",
      `Environment: ${packet.environment}`,
      `Scope: ${packet.scope.tenantId}/${packet.scope.workspaceId}/${packet.scope.userId}`,
      `As of: ${packet.asOf}`,
      `Window: ${packet.maintenanceWindow.start} to ${packet.maintenanceWindow.end}`,
`Dry-run evidence label: ${packet.dryRunEvidence}`,
`Backup evidence label: ${packet.backupEvidence}`,
`External approval record: ${packet.externalApprovalRecord}`,
`Legal/support review: ${packet.legalSupportReview}`,
`Rollback plan: ${packet.rollbackPlan}`,
`Second operator: ${packet.secondOperator}`,
      "Second operator review required: yes",
      "Apply allowed by packet: no",
      "Delete allowed by packet: no",
      `Dry-run evidence: ${packet.dryRunEvidenceCommand.join(" ")}`
    ].join("\n")
  );
  return 0;
}

function runDestructiveApprovalReadinessPacketCommand(
  args: readonly string[],
  io: CliIO
): number {
  const parsed = parseDestructiveApprovalReadinessPacketArgs(args);
  if ("error" in parsed) {
    io.stderr(parsed.error);
    return 1;
  }
  const packet = {
    generatedAt: new Date().toISOString(),
    operation: "destructive operation approval readiness review",
    environment: parsed.environment,
destructiveOperation: parsed.destructiveOperation,
approvalPolicy: parsed.approvalPolicy,
dryRunDiff: parsed.dryRunDiff,
freshBackup: parsed.freshBackup,
restoreSmoke: parsed.restoreSmoke,
exactConfirmation: parsed.exactConfirmation,
twoOperatorApproval: parsed.twoOperatorApproval,
legalSupportApproval: parsed.legalSupportApproval,
scopeProof: parsed.scopeProof,
maintenanceWindow: parsed.maintenanceWindow,
rollbackProcedure: parsed.rollbackProcedure,
auditRetention: parsed.auditRetention,
hostedSchedulerDisablement: parsed.hostedSchedulerDisablement,
remoteCi: parsed.remoteCi,
scope: parsed.scope,
    asOf: parsed.asOf.toISOString(),
    destructiveApprovalGranted: false,
    applyMutationAllowedByPacket: false,
    deleteMutationAllowedByPacket: false,
    hostedJobMutationAllowedByPacket: false,
    externalApprovalRecordMutationAllowedByPacket: false,
    requiresBackupProof: true,
    requiresSecondOperatorProof: true,
    requiresLegalSupportProof: true,
    requiresRollbackProof: true,
    evidenceRequired: [
`dry-run diff proof: ${parsed.dryRunDiff}`,
`fresh backup proof: ${parsed.freshBackup}`,
`restore smoke proof: ${parsed.restoreSmoke}`,
`exact confirmation proof: ${parsed.exactConfirmation}`,
`two-operator approval proof: ${parsed.twoOperatorApproval}`,
`legal support approval proof: ${parsed.legalSupportApproval}`,
`tenant workspace user scope proof: ${parsed.scopeProof}`,
`maintenance window proof: ${parsed.maintenanceWindow}`,
`rollback procedure proof: ${parsed.rollbackProcedure}`,
`audit event retention proof: ${parsed.auditRetention}`,
`hosted scheduler disablement proof: ${parsed.hostedSchedulerDisablement}`,
`remote CI proof: ${parsed.remoteCi}`
    ],
    reviewSteps: [
      "Verify dry-run output identifies eligible record classes, counts, and scoped hashes without raw private content.",
      "Verify fresh backup and restore smoke evidence exist before any destructive apply approval.",
      "Verify exact confirmation, two-operator approval, legal/support approval, and maintenance window evidence are recorded outside the affected scope.",
      "Verify hosted scheduler remains disabled until approval record, rollback procedure, audit retention, and remote CI evidence are attached.",
      "Record final approval outside this packet; this packet cannot authorize deletion."
    ],
    releaseBoundary:
      "Destructive approval readiness packet foundation only; it does not approve destructive operations, schedule hosted cleanup jobs, apply retention cleanup, delete records, create external approval records, rotate backup keys, or complete production security/legal approval."
  };

  if (parsed.json) {
    io.stdout(JSON.stringify(packet, null, 2));
    return 0;
  }

  io.stdout(
    [
      "ScheduleOS destructive approval readiness packet.",
      `Environment: ${packet.environment}`,
      `Operation: ${packet.destructiveOperation}`,
      `Approval policy: ${packet.approvalPolicy}`,
      `Scope: ${packet.scope.tenantId}/${packet.scope.workspaceId}/${packet.scope.userId}`,
      `As of: ${packet.asOf}`,
      "Destructive approval granted: false",
      "Apply mutation allowed by packet: false",
      "Delete mutation allowed by packet: false",
      "Required evidence:",
      ...packet.evidenceRequired.map((item) => `- ${item}`),
      "",
      packet.releaseBoundary
    ].join("\n")
  );
  return 0;
}

function runAuthProductionReadinessPacketCommand(
  args: readonly string[],
  io: CliIO
): number {
  const parsed = parseAuthProductionReadinessPacketArgs(args);
  if ("error" in parsed) {
    io.stderr(parsed.error);
    return 1;
  }
  const packet = {
    generatedAt: new Date().toISOString(),
    operation: "production auth readiness review",
    environment: parsed.environment,
    backend: parsed.backend,
    scope: parsed.scope,
    asOf: parsed.asOf.toISOString(),
    identityProvider: parsed.identityProvider,
    sessionStore: parsed.sessionStore,
    authorizationMatrix: parsed.authorizationMatrix,
    roleMembershipProof: parsed.roleMembershipProof,
    sessionLifecycle: parsed.sessionLifecycle,
    resetTokenLifecycle: parsed.resetTokenLifecycle,
    lockoutPruning: parsed.lockoutPruning,
    cookieTransport: parsed.cookieTransport,
    startupGuard: parsed.startupGuard,
    migrationPlan: parsed.migrationPlan,
    rollbackDrill: parsed.rollbackDrill,
    remoteCi: parsed.remoteCi,
    rollbackPlan: parsed.rollbackPlan,
    secondOperator: parsed.secondOperator,
    productionApprovalGranted: false,
    authMutationAllowedByPacket: false,
    requiresRemoteCiProof: true,
    requiresLiveMigrationProof: true,
    requiresSecondOperatorReview: true,
    requiresIdentityProviderProof: true,
    requiresSessionStoreProof: true,
    requiresResetTokenLifecycleProof: true,
    requiresLockoutPruningProof: true,
    evidenceRequired: [
      "identity provider proof",
      "session store proof",
      "database migration applied evidence",
      "roles memberships repository proof",
      "authorization matrix proof",
      "session issue validate revoke proof",
      "password reset token hash lifecycle proof",
      "credential attempt window pruning proof",
      "expired revoked auth-session pruning proof",
      "owner admin role boundary proof",
      "production cookie secure transport proof",
      "startup safety guard proof",
      "remote CI proof",
      "auth migration plan evidence",
      "auth rollback drill evidence",
      "operator rollback plan",
      "second-operator review proof"
    ],
    reviewSteps: [
      `Verify identity provider evidence through ${parsed.identityProvider}.`,
      `Verify durable session store evidence through ${parsed.sessionStore}.`,
      `Run migration plan ${parsed.migrationPlan} against target auth backend and save migration output.`,
      `Attach role and membership proof ${parsed.roleMembershipProof}.`,
      `Attach authorization matrix evidence ${parsed.authorizationMatrix}.`,
      `Attach session lifecycle evidence ${parsed.sessionLifecycle}.`,
      `Attach reset-token hash lifecycle evidence ${parsed.resetTokenLifecycle}.`,
      `Attach lockout and pruning evidence ${parsed.lockoutPruning}.`,
      `Attach production cookie transport evidence ${parsed.cookieTransport}.`,
      `Attach startup safety guard evidence ${parsed.startupGuard}.`,
      `Attach rollback drill evidence ${parsed.rollbackDrill}.`,
      `Attach remote CI evidence ${parsed.remoteCi}.`,
      `Attach operator rollback plan ${parsed.rollbackPlan}.`,
      "Confirm auth review artifacts contain no passwords, reset tokens, session tokens, credential hashes, raw cookies, or private user data.",
      `Record second-operator security review ${parsed.secondOperator} before changing production auth release status.`
    ],
    releaseBoundary:
      "Production auth readiness packet foundation only; it does not approve production auth, mutate users, create sessions, rotate credentials, run migrations, change cookie policy, complete remote CI/security approval, or close production persisted-auth blockers."
  };

  if (parsed.json) {
    io.stdout(JSON.stringify(packet, null, 2));
    return 0;
  }

  io.stdout(
    [
      "ScheduleOS production auth readiness packet.",
      `Environment: ${packet.environment}`,
      `Backend: ${packet.backend}`,
      `Identity provider: ${packet.identityProvider}`,
      `Session store: ${packet.sessionStore}`,
      `Authorization matrix: ${packet.authorizationMatrix}`,
      `Role membership proof: ${packet.roleMembershipProof}`,
      `Session lifecycle: ${packet.sessionLifecycle}`,
      `Reset token lifecycle: ${packet.resetTokenLifecycle}`,
      `Lockout pruning: ${packet.lockoutPruning}`,
      `Cookie transport: ${packet.cookieTransport}`,
      `Startup guard: ${packet.startupGuard}`,
      `Migration plan: ${packet.migrationPlan}`,
      `Rollback drill: ${packet.rollbackDrill}`,
      `Remote CI: ${packet.remoteCi}`,
      `Rollback plan: ${packet.rollbackPlan}`,
      `Scope: ${packet.scope.tenantId}/${packet.scope.workspaceId}/${packet.scope.userId}`,
      `As of: ${packet.asOf}`,
      "Production approval granted: no",
      "Auth mutation allowed by packet: no",
      "Remote CI proof required: yes",
      "",
      packet.releaseBoundary
    ].join("\n")
  );
  return 0;
}

function runAuthAuthorizationMatrixPacketCommand(
  args: readonly string[],
  io: CliIO
): number {
  const parsed = parseAuthAuthorizationMatrixPacketArgs(args);
  if ("error" in parsed) {
    io.stderr(parsed.error);
    return 1;
  }

  const authorizationRows = [
    {
      scenario: "owner full workspace administration",
      actor: "OWNER",
      target: "same tenant and workspace",
      action: "manage workspace, users, memberships, auth settings",
      expectedDecision: "ALLOW",
      requiredEvidence: "owner scoped management API and repository proof",
      evidenceReferences: [
        "src/api.test.ts::local API lets owners admins manage auth users memberships",
        "src/postgres-repositories.test.ts::PostgreSQL auth repository upserts users memberships sessions"
      ]
    },
    {
      scenario: "admin user and membership management",
      actor: "ADMIN",
      target: "same tenant and workspace",
      action: "manage non-owner users and memberships",
      expectedDecision: "ALLOW",
      requiredEvidence: "admin scoped membership-management proof",
      evidenceReferences: [
        "src/api.test.ts::local API lets owners admins manage auth users memberships",
        "src/api.test.ts::local API retention cleanup requires owner or admin role"
      ]
    },
    {
      scenario: "editor planning write access",
      actor: "EDITOR",
      target: "same tenant and workspace",
      action: "create and update scheduling tasks, events, plans",
      expectedDecision: "ALLOW",
      requiredEvidence: "editor schedule-write API proof",
      evidenceReferences: [
        "src/api.test.ts::local API lets owners admins manage auth users memberships",
        "src/server.test.ts::standalone server config supports explicit static auth role"
      ]
    },
    {
      scenario: "viewer read-only access",
      actor: "VIEWER",
      target: "same tenant and workspace",
      action: "read scoped plans, tasks, and busy/free schedule evidence",
      expectedDecision: "ALLOW",
      requiredEvidence: "viewer read-only API proof",
      evidenceReferences: [
        "src/api.test.ts::local API enforces static API-key read-only role",
        "src/api.test.ts::local API lists reads scoped schedule plans"
      ]
    },
    {
      scenario: "viewer write denial",
      actor: "VIEWER",
      target: "same tenant and workspace",
      action: "create or mutate scheduling tasks, plans, memberships",
      expectedDecision: "DENY",
      requiredEvidence: "viewer write-denial API proof",
      evidenceReferences: [
        "src/api.test.ts::local API enforces static API-key read-only role"
      ]
    },
    {
      scenario: "disabled user denial",
      actor: "DISABLED_USER",
      target: "same tenant and workspace",
      action: "validate session or perform any scoped API request",
      expectedDecision: "DENY",
      requiredEvidence: "disabled-user auth rejection proof",
      evidenceReferences: [
      "src/api.test.ts::local API denies sessions for disabled users and inactive memberships directly",
      "src/api.test.ts::local API rejects disabled users and inactive memberships during credential login"
      ]
    },
    {
      scenario: "inactive membership denial",
      actor: "INACTIVE_MEMBER",
      target: "same tenant and workspace",
      action: "read or write workspace-scoped resources",
      expectedDecision: "DENY",
      requiredEvidence: "inactive-membership repository and API proof",
      evidenceReferences: [
      "src/api.test.ts::local API denies sessions for disabled users and inactive memberships directly",
      "src/api.test.ts::local API rejects disabled users and inactive memberships during credential login",
        "src/repositories.test.ts::auth repository stores users memberships sessions and reset tokens with scope checks"
      ]
    },
    {
      scenario: "cross-tenant denial",
      actor: "AUTHORIZED_USER",
      target: "different tenant",
      action: "read or mutate tasks, events, plans, users, memberships",
      expectedDecision: "DENY",
      requiredEvidence: "cross-tenant isolation proof",
      evidenceReferences: [
        "src/api.test.ts::local API enforces static API-key tenant scope configured",
        "src/postgres-repositories.test.ts::PostgreSQL auth repository rejects cross-scope access"
      ]
    },
    {
      scenario: "cross-workspace denial",
      actor: "AUTHORIZED_USER",
      target: "different workspace in same tenant",
      action: "read or mutate tasks, events, plans, users, memberships",
      expectedDecision: "DENY",
      requiredEvidence: "cross-workspace isolation proof",
      evidenceReferences: [
        "src/api.test.ts::local API prevents cross-scope schedule plan reads",
        "src/postgres-repositories.test.ts::PostgreSQL schedule plan repository rejects cross-scope get"
      ]
    },
    {
      scenario: "cross-user private calendar denial",
      actor: "AUTHORIZED_USER",
      target: "another user's private calendar details",
      action: "read private title, attendees, notes, or provider payload",
      expectedDecision: "DENY",
      requiredEvidence: "cross-user private-calendar minimization proof",
      evidenceReferences: [
        "src/api.test.ts::local API prevents cross-scope calendar event reads updates deletes",
        "src/postgres-repositories.test.ts::PostgreSQL calendar event repository rejects cross-scope access"
      ]
    },
    {
      scenario: "revoked session denial",
      actor: "REVOKED_SESSION",
      target: "same tenant and workspace",
      action: "validate session or perform scoped API request",
    expectedDecision: "DENY",
    requiredEvidence: "revoked-session validation proof",
    evidenceReferences: [
      "src/api.test.ts::local API denies revoked and expired auth sessions directly",
      "src/api.test.ts::local API issues validates and revokes durable auth sessions"
    ]
  },
    {
      scenario: "expired session denial",
      actor: "EXPIRED_SESSION",
      target: "same tenant and workspace",
      action: "validate session or perform scoped API request",
    expectedDecision: "DENY",
    requiredEvidence: "expired-session validation proof",
    evidenceReferences: [
      "src/api.test.ts::local API denies revoked and expired auth sessions directly",
      "src/repositories.test.ts::auth repository stores users memberships sessions and reset tokens with scope checks"
    ]
  }
  ];

  const packet = {
    generatedAt: new Date().toISOString(),
    operation: "authorization matrix production review",
    matrix: parsed.matrix,
    environment: parsed.environment,
    backend: parsed.backend,
    scope: parsed.scope,
    asOf: parsed.asOf.toISOString(),
    productionApprovalGranted: false,
    authMutationAllowedByPacket: false,
    authorizationRows,
    reviewSteps: [
      "Attach this packet to the production auth readiness packet authorization-matrix evidence label.",
      "Run each row against production-like scoped data for the selected backend.",
      "Attach API, repository, session, and audit-event output proving each expected ALLOW or DENY decision.",
      "Confirm evidence contains no raw session tokens, reset tokens, credential hashes, passwords, or sensitive credentials.",
      "Keep the public release production-auth gate unchecked until remote CI and second-operator security review pass."
    ],
    releaseBoundary:
      "Authorization matrix packet is review evidence only; it does not approve production auth, mutate users, create sessions, rotate credentials, or close the release blocker."
  };

  if (parsed.json) {
    io.stdout(JSON.stringify(packet, null, 2));
    return 0;
  }

  io.stdout(
    [
      "ScheduleOS authorization matrix packet.",
      `Matrix: ${packet.matrix}`,
      `Environment: ${packet.environment}`,
      `Backend: ${packet.backend}`,
      `Scope: ${packet.scope.tenantId}/${packet.scope.workspaceId}/${packet.scope.userId}`,
      `As of: ${packet.asOf}`,
      "Production approval granted: no",
      "Auth mutation allowed by packet: no",
      "Required rows:",
      ...packet.authorizationRows.map(
        (row) =>
          `- ${row.scenario}: ${row.expectedDecision} (${row.requiredEvidence})`
      ),
      "",
      packet.releaseBoundary
    ].join("\n")
  );
  return 0;
}

function runRateLimitProductionReadinessPacketCommand(
  args: readonly string[],
  io: CliIO
): number {
  const parsed = parseRateLimitProductionReadinessPacketArgs(args);
  if ("error" in parsed) {
    io.stderr(parsed.error);
    return 1;
  }

  const packet = {
    generatedAt: new Date().toISOString(),
    operation: "production rate limit readiness review",
    environment: parsed.environment,
    scope: parsed.scope,
    asOf: parsed.asOf.toISOString(),
    edgeLayer: parsed.edgeLayer,
    distributedStore: parsed.distributedStore,
    providerQuotaPolicy: parsed.providerQuotaPolicy,
    trustedProxyProof: parsed.trustedProxyProof,
    hostedAlertRouting: parsed.hostedAlertRouting,
    hostedDashboard: parsed.hostedDashboard,
    abuseAnalytics: parsed.abuseAnalytics,
    remoteCi: parsed.remoteCi,
    rollbackPlan: parsed.rollbackPlan,
    secondOperator: parsed.secondOperator,
    productionEnablementGranted: false,
    rateLimitMutationAllowedByPacket: false,
    requiresHostedAlertRoutingProof: true,
    requiresAbuseAnalyticsProof: true,
    requiresProviderQuotaProof: true,
    requiresSecondOperatorReview: true,
    evidenceRequired: [
      "edge or gateway rate-limit policy proof",
      "distributed throttle store proof",
      "provider quota policy proof",
      "trusted proxy deployment proof",
      "authenticated request throttle persistence proof",
      "import abuse threshold proof",
      "public-event delivery alert routing proof",
      "hosted dashboard proof",
      "abuse analytics export proof",
      `remote CI proof: ${parsed.remoteCi}`,
      `operator rollback plan: ${parsed.rollbackPlan}`,
      `second-operator rate-limit review: ${parsed.secondOperator}`
    ],
    reviewSteps: [
      `Verify edge or gateway limits cannot be bypassed by direct origin access through ${parsed.edgeLayer}.`,
      `Verify distributed throttle counters survive process restarts and multiple instances through ${parsed.distributedStore}.`,
      `Verify provider-specific quota policies for imports, webhooks, and calendar sync through ${parsed.providerQuotaPolicy}.`,
      `Verify trusted proxy headers are stripped and rewritten by the deployment proxy through ${parsed.trustedProxyProof}.`,
      `Verify hosted alert routing through ${parsed.hostedAlertRouting}.`,
      `Verify hosted dashboards through ${parsed.hostedDashboard}.`,
      `Verify abuse analytics exports through ${parsed.abuseAnalytics}.`,
      "Verify observability evidence contains counts, hashes, and scopes without raw secrets.",
      `Attach remote CI, load-test, and deployment smoke evidence through ${parsed.remoteCi} before enabling production.`,
      `Attach operator rollback plan ${parsed.rollbackPlan} before enabling production.`,
      `Record second-operator review ${parsed.secondOperator} outside ScheduleOS request-throttle scope.`
    ],
    releaseBoundary:
      "Rate-limit readiness packet foundation only; it does not enable production distributed throttling, mutate quota policies, configure hosted alerts, export analytics, or complete remote CI/security approval."
  };

  if (parsed.json) {
    io.stdout(JSON.stringify(packet, null, 2));
    return 0;
  }

  io.stdout(
    [
      "ScheduleOS production rate-limit readiness packet.",
      `Environment: ${packet.environment}`,
      `Scope: ${packet.scope.tenantId}/${packet.scope.workspaceId}/${packet.scope.userId}`,
      `As of: ${packet.asOf}`,
      `Edge layer: ${packet.edgeLayer}`,
      `Distributed store: ${packet.distributedStore}`,
      `Provider quota policy: ${packet.providerQuotaPolicy}`,
      `Trusted proxy proof: ${packet.trustedProxyProof}`,
      `Hosted alert routing: ${packet.hostedAlertRouting}`,
      `Hosted dashboard: ${packet.hostedDashboard}`,
      `Abuse analytics: ${packet.abuseAnalytics}`,
      `Remote CI: ${packet.remoteCi}`,
      `Rollback plan: ${packet.rollbackPlan}`,
      `Second operator: ${packet.secondOperator}`,
      "Production enablement granted: no",
      "Rate-limit mutation allowed by packet: no",
      "Hosted alert routing proof required: yes"
    ].join("\n")
  );
  return 0;
}

function runProviderLifecycleReadinessPacketCommand(
  args: readonly string[],
  io: CliIO
): number {
  const parsed = parseProviderLifecycleReadinessPacketArgs(args);
  if ("error" in parsed) {
    io.stderr(parsed.error);
    return 1;
  }

  const packet = {
    generatedAt: new Date().toISOString(),
    operation: "provider lifecycle readiness review",
    environment: parsed.environment,
    provider: parsed.provider,
    managedSecretCustody: parsed.managedSecretCustody,
    rotationDrill: parsed.rotationDrill,
    revocationDrill: parsed.revocationDrill,
    writeBackSafety: parsed.writeBackSafety,
    hostedAlertRouting: parsed.hostedAlertRouting,
    providerRunbook: parsed.providerRunbook,
    remoteCi: parsed.remoteCi,
    rollbackPlan: parsed.rollbackPlan,
    secondOperator: parsed.secondOperator,
    scope: parsed.scope,
    asOf: parsed.asOf.toISOString(),
    productionEnforcementGranted: false,
    providerMutationAllowedByPacket: false,
    requiresHostedOperatorAlertProof: true,
    requiresRotationRevocationDrillProof: true,
    requiresProviderSpecificRunbookProof: true,
    requiresWriteBackSafetyProof: true,
    requiredProviderRunbookSections: [...REQUIRED_PROVIDER_RUNBOOK_SECTIONS],
    evidenceRequired: [
      "provider adapter contract proof",
      "credential custody and managed-secret proof",
      "rotation drill proof",
      "emergency revocation drill proof",
      "sync checkpoint idempotency proof",
      "write-back preview and conflict proof",
      "provider-specific quota policy proof",
      "hosted operator alert proof",
      "provider-specific runbook proof",
      `remote CI proof: ${parsed.remoteCi}`,
      `operator rollback plan: ${parsed.rollbackPlan}`,
      `second-operator provider lifecycle review: ${parsed.secondOperator}`
    ],
    reviewSteps: [
      "Verify provider adapter uses public provider-neutral contracts no private compatible leadership system APIs.",
      `Verify provider credentials are stored only through managed-secret boundary ${parsed.managedSecretCustody}.`,
      `Run rotation drill ${parsed.rotationDrill} with content-minimized audit evidence.`,
      `Run emergency revocation drill ${parsed.revocationDrill} with content-minimized audit evidence.`,
      "Verify revoked provider state blocks future sync checkpoints and write-back attempts.",
      `Verify write-back safety through ${parsed.writeBackSafety}.`,
      `Verify provider-specific quota policy, retry policy, and hosted alert routing through ${parsed.hostedAlertRouting}.`,
      `Attach provider-specific runbook review ${parsed.providerRunbook} before production enforcement and verify every required runbook section.`,
      `Attach remote CI evidence ${parsed.remoteCi}.`,
      `Attach operator rollback plan ${parsed.rollbackPlan}.`,
      `Record second-operator review ${parsed.secondOperator} outside ScheduleOS provider credential scope.`
    ],
    releaseBoundary:
      "Provider lifecycle readiness packet foundation only; it does not enforce production provider lifecycle, mutate provider connections, rotate credentials, revoke providers, write back calendar data, configure hosted alerts, or complete remote CI/security approval."
  };

  if (parsed.json) {
    io.stdout(JSON.stringify(packet, null, 2));
    return 0;
  }

  io.stdout(
    [
      "ScheduleOS provider lifecycle readiness packet.",
      `Environment: ${packet.environment}`,
      `Provider: ${packet.provider}`,
      `Scope: ${packet.scope.tenantId}/${packet.scope.workspaceId}/${packet.scope.userId}`,
      `As of: ${packet.asOf}`,
      `Managed secret custody: ${packet.managedSecretCustody}`,
      `Rotation drill: ${packet.rotationDrill}`,
      `Revocation drill: ${packet.revocationDrill}`,
      `Write-back safety: ${packet.writeBackSafety}`,
      `Hosted alert routing: ${packet.hostedAlertRouting}`,
      `Provider runbook: ${packet.providerRunbook}`,
      `Remote CI: ${packet.remoteCi}`,
      `Rollback plan: ${packet.rollbackPlan}`,
      `Second operator: ${packet.secondOperator}`,
      "Production enforcement granted: no",
      "Provider mutation allowed by packet: no",
      "Rotation/revocation drill proof required: yes",
      `Provider runbook sections required: ${packet.requiredProviderRunbookSections.join(", ")}`
    ].join("\n")
  );
  return 0;
}
function runCalendarUiProductionReadinessPacketCommand(
  args: readonly string[],
  io: CliIO
): number {
  const parsed = parseCalendarUiProductionReadinessPacketArgs(args);
  if ("error" in parsed) {
    io.stderr(parsed.error);
    return 1;
  }

  const packet = {
    generatedAt: new Date().toISOString(),
    operation: "calendar UI production readiness review",
    environment: parsed.environment,
    browserMatrix: parsed.browserMatrix,
    conflictWorkflow: parsed.conflictWorkflow,
    writeBackAcknowledgement: parsed.writeBackAcknowledgement,
    accessibilityAudit: parsed.accessibilityAudit,
 responsivePolish: parsed.responsivePolish,
 visualRegression: parsed.visualRegression,
 productOwnerApproval: parsed.productOwnerApproval,
 remoteCi: parsed.remoteCi,
rollbackPlan: parsed.rollbackPlan,
secondOperator: parsed.secondOperator,
scope: parsed.scope,
    asOf: parsed.asOf.toISOString(),
    productionApprovalGranted: false,
    uiMutationAllowedByPacket: false,
    requiresAccessibilityPassProof: true,
 requiresProductOwnerApprovalProof: true,
 requiresResponsivePolishProof: true,
requiresInteractiveConflictWorkflowProof: true,
requiresRemoteCiProof: true,
requiresSecondOperatorProof: true,
evidenceRequired: [
 `desktop browser matrix proof: ${parsed.browserMatrix}`,
 `mobile responsive proof: ${parsed.responsivePolish}`,
 `interactive conflict-preview workflow proof: ${parsed.conflictWorkflow}`,
 `write-back acknowledgement workflow proof: ${parsed.writeBackAcknowledgement}`,
 `keyboard navigation proof: ${parsed.accessibilityAudit}`,
 `screen-reader semantics proof: ${parsed.accessibilityAudit}`,
 `accessibility pass proof: ${parsed.accessibilityAudit}`,
 `responsive polish proof: ${parsed.responsivePolish}`,
 `visual regression proof: ${parsed.visualRegression}`,
 `product-owner visual approval proof: ${parsed.productOwnerApproval}`,
 `remote CI proof: ${parsed.remoteCi}`,
`operator rollback plan: ${parsed.rollbackPlan}`,
`second-operator review proof: ${parsed.secondOperator}`
 ],
    reviewSteps: [
  `Run desktop/mobile browser matrix evidence ${parsed.browserMatrix} for standalone calendar app.`,
  `Verify conflict-preview workflow ${parsed.conflictWorkflow} covers review acknowledgement, write-back controls, and block movement.`,
  `Verify write-back acknowledgement workflow ${parsed.writeBackAcknowledgement} invalidates stale previews before production approval.`,
  `Verify keyboard navigation, focus order, status text, and screen-reader semantics through ${parsed.accessibilityAudit}.`,
  `Attach responsive polish screenshots and notes ${parsed.responsivePolish} for daily, weekly, conflict, and write-back states.`,
  `Attach visual regression evidence ${parsed.visualRegression} before production approval.`,
  `Record product-owner visual approval ${parsed.productOwnerApproval} outside packet before release.`,
  `Attach remote CI evidence ${parsed.remoteCi} for calendar UI workflows.`,
`Attach operator rollback plan ${parsed.rollbackPlan} before production UI approval.`,
`Record second-operator review evidence ${parsed.secondOperator} before production UI approval.`
],
    releaseBoundary:
      "Calendar UI readiness packet foundation only; it does not approve production UI, mutate schedules or calendar events, replace browser/accessibility evidence, provide product-owner approval, or complete remote CI/security approval."
  };

  if (parsed.json) {
    io.stdout(JSON.stringify(packet, null, 2));
    return 0;
  }

  io.stdout(
    [
      "ScheduleOS calendar UI production readiness packet.",
      `Environment: ${packet.environment}`,
      `Browser matrix: ${packet.browserMatrix}`,
      `Conflict workflow: ${packet.conflictWorkflow}`,
      `Write-back acknowledgement: ${packet.writeBackAcknowledgement}`,
      `Accessibility audit: ${packet.accessibilityAudit}`,
      `Responsive polish: ${packet.responsivePolish}`,
      `Visual regression: ${packet.visualRegression}`,
      `Product-owner approval: ${packet.productOwnerApproval}`,
      `Remote CI: ${packet.remoteCi}`,
      `Rollback plan: ${packet.rollbackPlan}`,
      `Scope: ${packet.scope.tenantId}/${packet.scope.workspaceId}/${packet.scope.userId}`,
      `As of: ${packet.asOf}`,
      "Production approval granted: false",
      "UI mutation allowed by packet: false",
      "Required evidence:",
      ...packet.evidenceRequired.map((item) => `- ${item}`),
      "",
      packet.releaseBoundary
    ].join("\n")
  );
  return 0;
}
function runWebAppProductionReadinessPacketCommand(
  args: readonly string[],
  io: CliIO
): number {
  const parsed = parseWebAppProductionReadinessPacketArgs(args);
  if ("error" in parsed) {
    io.stderr(parsed.error);
    return 1;
  }

  const packet = {
    generatedAt: new Date().toISOString(),
    operation: "web app production readiness review",
    environment: parsed.environment,
    deploymentTarget: parsed.deploymentTarget,
    productionBuild: parsed.productionBuild,
    authenticatedWriteFlow: parsed.authenticatedWriteFlow,
    securityHeaders: parsed.securityHeaders,
    csrfCookieTransport: parsed.csrfCookieTransport,
    throttlePolicy: parsed.throttlePolicy,
    durableStorage: parsed.durableStorage,
    cachePolicy: parsed.cachePolicy,
    healthStartupGuard: parsed.healthStartupGuard,
    browserMatrix: parsed.browserMatrix,
    accessibilityAudit: parsed.accessibilityAudit,
    responsivePolish: parsed.responsivePolish,
    visualRegression: parsed.visualRegression,
    operatorReview: parsed.operatorReview,
    remoteCi: parsed.remoteCi,
    rollbackPlan: parsed.rollbackPlan,
    secondOperator: parsed.secondOperator,
    scope: parsed.scope,
    asOf: parsed.asOf.toISOString(),
    productionApprovalGranted: false,
    deploymentMutationAllowedByPacket: false,
    requiresSecurityHeaderProof: true,
    requiresAuthenticatedWriteProof: true,
    requiresRollbackProof: true,
    requiresRemoteCiProof: true,
    evidenceRequired: [
      "production build artifact proof",
      "authenticated write-flow proof",
      "security header deployment proof",
      "CSRF and cookie transport proof",
      "request and import throttle proof",
      "storage durability proof",
      "static asset cache policy proof",
      "health check and startup guard proof",
      "browser smoke proof",
      "accessibility smoke proof",
      "browser matrix evidence",
"accessibility audit evidence",
"responsive polish evidence",
"visual regression evidence",
"operator review evidence",
"remote CI proof",
"operator rollback plan",
"second-operator review evidence"
    ],
    reviewSteps: [
      `Verify production build artifact ${parsed.productionBuild} is reproducible from a clean install.`,
      `Verify authenticated write-flow evidence ${parsed.authenticatedWriteFlow} covers all mutating app flows.`,
      `Verify security header deployment evidence ${parsed.securityHeaders} for the deployment target ${parsed.deploymentTarget}.`,
      `Verify CSRF and cookie transport evidence ${parsed.csrfCookieTransport} when cookie auth is enabled.`,
      `Verify request/import throttle evidence ${parsed.throttlePolicy} in the deployment target.`,
      `Verify durable storage evidence ${parsed.durableStorage} and static asset cache policy ${parsed.cachePolicy}.`,
      `Verify health check and startup guard evidence ${parsed.healthStartupGuard}.`,
      `Attach browser matrix evidence ${parsed.browserMatrix} before production approval.`,
      `Attach accessibility audit evidence ${parsed.accessibilityAudit} before production approval.`,
      `Attach remote CI evidence ${parsed.remoteCi} and rollback plan ${parsed.rollbackPlan} before production approval.`,
      "Record second-operator review outside ScheduleOS session or API-key scope."
    ],
    releaseBoundary:
      "Web app readiness packet foundation only; it does not approve production deployment, mutate application state, configure hosting, create public remote, replace browser/accessibility evidence, or complete remote CI/security approval."
  };

  if (parsed.json) {
    io.stdout(JSON.stringify(packet, null, 2));
    return 0;
  }

  io.stdout(
    [
      "ScheduleOS web app production readiness packet.",
      `Environment: ${packet.environment}`,
      `Deployment target: ${packet.deploymentTarget}`,
      `Production build: ${packet.productionBuild}`,
      `Authenticated write flow: ${packet.authenticatedWriteFlow}`,
      `Security headers: ${packet.securityHeaders}`,
      `CSRF/cookie transport: ${packet.csrfCookieTransport}`,
      `Throttle policy: ${packet.throttlePolicy}`,
      `Durable storage: ${packet.durableStorage}`,
      `Cache policy: ${packet.cachePolicy}`,
      `Health/startup guard: ${packet.healthStartupGuard}`,
      `Browser matrix: ${packet.browserMatrix}`,
`Accessibility audit: ${packet.accessibilityAudit}`,
`Responsive polish: ${packet.responsivePolish}`,
`Visual regression: ${packet.visualRegression}`,
`Operator review: ${packet.operatorReview}`,
`Remote CI: ${packet.remoteCi}`,
`Rollback plan: ${packet.rollbackPlan}`,
`Second operator: ${packet.secondOperator}`,
      `Scope: ${packet.scope.tenantId}/${packet.scope.workspaceId}/${packet.scope.userId}`,
      `As of: ${packet.asOf}`,
      "Production approval granted: false",
      "Deployment mutation allowed by packet: false",
      "Required evidence:",
      ...packet.evidenceRequired.map((item) => `- ${item}`),
      "",
      packet.releaseBoundary
    ].join("\n")
  );
  return 0;
}
function runProductionDeploymentReadinessPacketCommand(
args: readonly string[],
io: CliIO
): number {
const parsed = parseProductionDeploymentReadinessPacketArgs(args);
if ("error" in parsed) {
io.stderr(parsed.error);
return 1;
}

const packet = {
generatedAt: new Date().toISOString(),
operation: "production deployment readiness review",
environment: parsed.environment,
deploymentTopology: parsed.deploymentTopology,
tlsTermination: parsed.tlsTermination,
reverseProxyHeaders: parsed.reverseProxyHeaders,
securityHeaders: parsed.securityHeaders,
startupGuards: parsed.startupGuards,
healthChecks: parsed.healthChecks,
durableStorage: parsed.durableStorage,
cookieCsrfTransport: parsed.cookieCsrfTransport,
trustedProxyThrottle: parsed.trustedProxyThrottle,
staticAssetCache: parsed.staticAssetCache,
logRedaction: parsed.logRedaction,
backupRollback: parsed.backupRollback,
remoteCiDeploymentSmoke: parsed.remoteCiDeploymentSmoke,
operatorReview: parsed.operatorReview,
secondOperator: parsed.secondOperator,
scope: parsed.scope,
asOf: parsed.asOf.toISOString(),
productionDeploymentApproved: false,
hostingMutationAllowedByPacket: false,
dnsMutationAllowedByPacket: false,
secretMutationAllowedByPacket: false,
requiresTlsProxyProof: true,
requiresSecurityHeaderProof: true,
requiresStartupGuardProof: true,
requiresHealthCheckProof: true,
requiresDurableStorageProof: true,
requiresCookieCsrfTransportProof: true,
requiresTrustedProxyThrottleProof: true,
requiresLogRedactionProof: true,
requiresBackupRollbackProof: true,
requiresRemoteCiProof: true,
requiresSecondOperatorProof: true,
evidenceRequired: [
`TLS termination proof: ${parsed.tlsTermination}`,
`reverse proxy header proof: ${parsed.reverseProxyHeaders}`,
`security header proof: ${parsed.securityHeaders}`,
`startup guard proof: ${parsed.startupGuards}`,
`health check proof: ${parsed.healthChecks}`,
`durable storage proof: ${parsed.durableStorage}`,
`secure cookie and CSRF transport proof: ${parsed.cookieCsrfTransport}`,
`trusted proxy and throttle proof: ${parsed.trustedProxyThrottle}`,
`static asset cache policy proof: ${parsed.staticAssetCache}`,
`log redaction proof: ${parsed.logRedaction}`,
`backup and rollback proof: ${parsed.backupRollback}`,
`remote CI deployment smoke proof: ${parsed.remoteCiDeploymentSmoke}`,
`operator review proof: ${parsed.operatorReview}`,
`second-operator review proof: ${parsed.secondOperator}`
],
reviewSteps: [
`Verify TLS termination and HTTPS-only cookie transport using ${parsed.tlsTermination}.`,
`Verify reverse proxy trusted host, protocol, and client IP header behavior using ${parsed.reverseProxyHeaders}.`,
`Verify deployed security headers using ${parsed.securityHeaders}.`,
`Verify production startup guards using ${parsed.startupGuards}.`,
`Verify health checks using ${parsed.healthChecks}.`,
`Verify durable storage and persistence behavior using ${parsed.durableStorage}.`,
`Verify secure cookie and CSRF transport using ${parsed.cookieCsrfTransport}.`,
`Verify trusted proxy and throttle behavior using ${parsed.trustedProxyThrottle}.`,
`Verify static asset cache policy using ${parsed.staticAssetCache}.`,
`Verify log redaction using ${parsed.logRedaction}.`,
`Verify backup restore and rollback procedures using ${parsed.backupRollback}.`,
`Attach remote CI deployment smoke evidence ${parsed.remoteCiDeploymentSmoke}.`,
`Record operator review evidence ${parsed.operatorReview} before approving production deployment.`,
`Record second-operator review evidence ${parsed.secondOperator} before approving production deployment.`
],
releaseBoundary:
"Production deployment readiness packet foundation only; it does not approve production deployment, configure hosting, mutate DNS, write secrets, start services, create a public remote, publish packages, or announce ScheduleOS."
};

if (parsed.json) {
io.stdout(JSON.stringify(packet, null, 2));
return 0;
}

io.stdout(
[
"ScheduleOS production deployment readiness packet.",
`Environment: ${packet.environment}`,
`Deployment topology: ${packet.deploymentTopology}`,
`TLS termination: ${packet.tlsTermination}`,
`Reverse proxy headers: ${packet.reverseProxyHeaders}`,
`Security headers: ${packet.securityHeaders}`,
`Startup guards: ${packet.startupGuards}`,
`Health checks: ${packet.healthChecks}`,
`Durable storage: ${packet.durableStorage}`,
`Cookie/CSRF transport: ${packet.cookieCsrfTransport}`,
`Trusted proxy/throttle: ${packet.trustedProxyThrottle}`,
`Static asset cache: ${packet.staticAssetCache}`,
`Log redaction: ${packet.logRedaction}`,
`Backup/rollback: ${packet.backupRollback}`,
`Remote CI deployment smoke: ${packet.remoteCiDeploymentSmoke}`,
`Operator review: ${packet.operatorReview}`,
`Second operator: ${packet.secondOperator}`,
`Scope: ${packet.scope.tenantId}/${packet.scope.workspaceId}/${packet.scope.userId}`,
`As of: ${packet.asOf}`,
"Production deployment approved: false",
"Hosting mutation allowed by packet: false",
"DNS mutation allowed by packet: false",
"Secret mutation allowed by packet: false",
"Required evidence:",
...packet.evidenceRequired.map((item) => `- ${item}`),
"",
packet.releaseBoundary
].join("\n")
);
return 0;
}

function runIcsProductionReadinessPacketCommand(
  args: readonly string[],
  io: CliIO
): number {
  const parsed = parseIcsProductionReadinessPacketArgs(args);
  if ("error" in parsed) {
    io.stderr(parsed.error);
    return 1;
  }
  const packet = {
    generatedAt: new Date().toISOString(),
    operation: "ICS production readiness review",
    environment: parsed.environment,
    recurrenceSuite: parsed.recurrenceSuite,
    timezoneDstProof: parsed.timezoneDstProof,
    syncIdempotencyProof: parsed.syncIdempotencyProof,
    importPreviewUx: parsed.importPreviewUx,
    exportPrivacyRedaction: parsed.exportPrivacyRedaction,
    writeBackConflictPreview: parsed.writeBackConflictPreview,
    providerNeutralContract: parsed.providerNeutralContract,
    providerFixtureSuite: parsed.providerFixtureSuite,
    largeCalendarFixture: parsed.largeCalendarFixture,
    browserWorkflow: parsed.browserWorkflow,
    remoteCi: parsed.remoteCi,
    rollbackPlan: parsed.rollbackPlan,
    secondOperator: parsed.secondOperator,
    scope: parsed.scope,
    asOf: parsed.asOf.toISOString(),
    productionSyncApprovalGranted: false,
    calendarWriteMutationAllowedByPacket: false,
    requiresRecurrenceRegressionProof: true,
    requiresSyncStateIdempotencyProof: true,
    requiresProviderWriteBackProof: true,
    requiresTimezoneDstProof: true,
    requiresImportPreviewUxProof: true,
    requiresExportPrivacyRedactionProof: true,
    requiresRemoteCiProof: true,
    evidenceRequired: [
      "recurrence regression suite proof",
      "timezone DST regression proof",
      "sync-state idempotency proof",
      "import preview UX proof",
      "export privacy redaction proof",
      "write-back conflict preview proof",
      "provider-neutral ICS contract proof",
      "large calendar fixture proof",
      "browser import-export workflow proof",
      "provider fixture suite proof",
      "operator rollback plan",
      "remote CI proof",
      `second-operator ICS review: ${parsed.secondOperator}`
    ],
    reviewSteps: [
      `Verify RRULE, RDATE, EXDATE, date-only UNTIL, time-window, BYSETPOS, and recurrence exception fixtures through ${parsed.recurrenceSuite}.`,
      `Verify IANA TZID and daylight-saving behavior through ${parsed.timezoneDstProof}.`,
      `Verify sync checkpoints reject conflicting replays and protect accepted blocks from duplicate provider writes through ${parsed.syncIdempotencyProof}.`,
      `Verify import preview UX through ${parsed.importPreviewUx}.`,
      `Verify export privacy redaction through ${parsed.exportPrivacyRedaction}.`,
      `Verify write-back conflict preview through ${parsed.writeBackConflictPreview}.`,
      `Verify provider-neutral ICS contract through ${parsed.providerNeutralContract}.`,
      `Verify provider fixtures through ${parsed.providerFixtureSuite}.`,
      `Verify large calendar fixture coverage through ${parsed.largeCalendarFixture}.`,
      `Attach browser import/export/write-back workflow evidence from ${parsed.browserWorkflow}.`,
      `Attach remote CI evidence ${parsed.remoteCi}.`,
      `Attach operator rollback plan ${parsed.rollbackPlan}.`,
      "Verify import preview/export flows preserve privacy boundaries and avoid raw provider token or private-title output.",
      `Record second-operator review ${parsed.secondOperator} outside calendar provider credential scope.`
    ],
    releaseBoundary:
      "ICS readiness packet foundation only; does not approve production calendar sync, write calendar data, mutate provider state, replace recurrence/browser/CI evidence, complete remote CI/security approval, or close release-grade ICS workflow blockers."
  };

  if (parsed.json) {
    io.stdout(JSON.stringify(packet, null, 2));
    return 0;
  }

  io.stdout(
    [
      "ScheduleOS ICS production readiness packet.",
      `Environment: ${packet.environment}`,
      `Recurrence suite: ${packet.recurrenceSuite}`,
      `Timezone/DST proof: ${packet.timezoneDstProof}`,
      `Sync idempotency proof: ${packet.syncIdempotencyProof}`,
      `Import preview UX: ${packet.importPreviewUx}`,
      `Export privacy redaction: ${packet.exportPrivacyRedaction}`,
      `Write-back conflict preview: ${packet.writeBackConflictPreview}`,
      `Provider-neutral contract: ${packet.providerNeutralContract}`,
      `Provider fixture suite: ${packet.providerFixtureSuite}`,
      `Large calendar fixture: ${packet.largeCalendarFixture}`,
      `Browser workflow: ${packet.browserWorkflow}`,
      `Remote CI: ${packet.remoteCi}`,
      `Rollback plan: ${packet.rollbackPlan}`,
      `Scope: ${packet.scope.tenantId}/${packet.scope.workspaceId}/${packet.scope.userId}`,
      `As of: ${packet.asOf}`,
      "Production sync approval granted: false",
      "Calendar write mutation allowed by packet: false",
      "Required evidence:",
      ...packet.evidenceRequired.map((item) => `- ${item}`),
      "",
      packet.releaseBoundary
    ].join("\n")
  );
  return 0;
}

function runProviderCsvProductionReadinessPacketCommand(
  args: readonly string[],
  io: CliIO
): number {
  const parsed = parseProviderCsvProductionReadinessPacketArgs(args);
  if ("error" in parsed) {
    io.stderr(parsed.error);
    return 1;
  }
  const packet = {
    generatedAt: new Date().toISOString(),
    operation: "provider CSV production readiness review",
    environment: parsed.environment,
    fixtureSuite: parsed.fixtureSuite,
    downloadUploadWorkflow: parsed.downloadUploadWorkflow,
    confirmationUx: parsed.confirmationUx,
    providerPolicy: parsed.providerPolicy,
    browserWorkflow: parsed.browserWorkflow,
    abuseAnalytics: parsed.abuseAnalytics,
    largeFixtureSuite: parsed.largeFixtureSuite,
    formulaInjectionRegression: parsed.formulaInjectionRegression,
fieldMappingPrivacy: parsed.fieldMappingPrivacy,
remoteCi: parsed.remoteCi,
rollbackPlan: parsed.rollbackPlan,
  secondOperator: parsed.secondOperator,
scope: parsed.scope,
    asOf: parsed.asOf.toISOString(),
    productionImportApprovalGranted: false,
    importMutationAllowedByPacket: false,
    providerQuotaMutationAllowedByPacket: false,
    requiresRealProviderFixtureProof: true,
    requiresAbuseAnalyticsProof: true,
    requiresProviderQuotaProof: true,
    requiresBrowserWorkflowProof: true,
    requiresDownloadUploadWorkflowProof: true,
    requiresConfirmationUxProof: true,
    requiresFieldMappingPrivacyProof: true,
requiresRemoteCiProof: true,
requiresSecondOperatorProof: true,
    evidenceRequired: [
      "real-provider export fixture proof",
      "download upload workflow proof",
      "provider-specific confirmation UX proof",
      "provider quota governance proof",
      "import abuse analytics proof",
      "large CSV fixture proof",
      "formula injection regression proof",
      "field mapping privacy proof",
      "browser import workflow proof",
      "operator rollback plan",
      "remote CI proof",
      "second-operator review proof"
    ],
    reviewSteps: [
      `Verify real-provider export fixtures through ${parsed.fixtureSuite} cover Todoist, Linear, Asana, ClickUp, Trello, Microsoft Planner, GitHub Issues, and uncataloged CSV variants.`,
      `Verify download/upload flows through ${parsed.downloadUploadWorkflow} preserve preview-before-import explicit review acknowledgement.`,
      `Verify provider-specific confirmation UX through ${parsed.confirmationUx} before production imports.`,
      "Verify formula-like text, private task titles, provider tokens, and raw attachment data are treated as inert private input.",
      `Attach formula-injection regression evidence ${parsed.formulaInjectionRegression}.`,
      `Attach field-mapping privacy evidence ${parsed.fieldMappingPrivacy}.`,
      `Verify provider-specific quota governance through ${parsed.providerPolicy}.`,
      `Verify import abuse analytics through ${parsed.abuseAnalytics}.`,
      `Attach browser import workflow evidence from ${parsed.browserWorkflow}.`,
      `Attach large fixture suite ${parsed.largeFixtureSuite}.`,
      `Attach remote CI evidence ${parsed.remoteCi}.`,
`Attach operator rollback plan ${parsed.rollbackPlan}.`,
`Record second-operator review ${parsed.secondOperator} outside provider credential imported-data scope.`
    ],
    releaseBoundary:
      "Provider CSV readiness packet foundation only; it does not approve production imports, import rows, mutate provider quota policy, export analytics, configure alerts, complete remote CI/security approval, or close production provider CSV workflow blockers."
  };

  if (parsed.json) {
    io.stdout(JSON.stringify(packet, null, 2));
    return 0;
  }

  io.stdout(
    [
      "ScheduleOS provider CSV production readiness packet.",
      `Environment: ${packet.environment}`,
      `Fixture suite: ${packet.fixtureSuite}`,
      `Download/upload workflow: ${packet.downloadUploadWorkflow}`,
      `Confirmation UX: ${packet.confirmationUx}`,
      `Provider policy: ${packet.providerPolicy}`,
      `Browser workflow: ${packet.browserWorkflow}`,
      `Abuse analytics: ${packet.abuseAnalytics}`,
      `Large fixture suite: ${packet.largeFixtureSuite}`,
      `Formula injection regression: ${packet.formulaInjectionRegression}`,
      `Field mapping privacy: ${packet.fieldMappingPrivacy}`,
`Remote CI: ${packet.remoteCi}`,
`Rollback plan: ${packet.rollbackPlan}`,
`Second operator: ${packet.secondOperator}`,
`Second operator: ${packet.secondOperator}`,
      `Scope: ${packet.scope.tenantId}/${packet.scope.workspaceId}/${packet.scope.userId}`,
      `As of: ${packet.asOf}`,
      "Production import approval granted: false",
      "Import mutation allowed by packet: false",
      "Provider quota mutation allowed by packet: false",
      "Required evidence:",
      ...packet.evidenceRequired.map((item) => `- ${item}`),
      "",
      packet.releaseBoundary
    ].join("\n")
  );
  return 0;
}

function runPublicEventsHostedDeliveryReadinessPacketCommand(
  args: readonly string[],
  io: CliIO
): number {
  const parsed = parsePublicEventsHostedDeliveryReadinessPacketArgs(args);
  if ("error" in parsed) {
    io.stderr(parsed.error);
    return 1;
  }
  const packet = {
    generatedAt: new Date().toISOString(),
    operation: "public events hosted delivery readiness review",
    environment: parsed.environment,
    secretProvider: parsed.secretProvider,
    runtimeIdentity: parsed.runtimeIdentity,
    rotationDrill: parsed.rotationDrill,
    workerTopology: parsed.workerTopology,
    retryQueue: parsed.retryQueue,
    deadLetterQueue: parsed.deadLetterQueue,
    hostedDashboard: parsed.hostedDashboard,
    alertRouting: parsed.alertRouting,
    replayBoundary: parsed.replayBoundary,
    rateLimitHeaderKey: parsed.rateLimitHeaderKey,
    incidentDrill: parsed.incidentDrill,
    remoteCi: parsed.remoteCi,
    rollbackPlan: parsed.rollbackPlan,
secondOperator: parsed.secondOperator,
scope: parsed.scope,
    asOf: parsed.asOf.toISOString(),
    productionHostedDeliveryApprovalGranted: false,
    hostedWorkerMutationAllowedByPacket: false,
    managedSecretProviderMutationAllowedByPacket: false,
    replayMutationAllowedByPacket: false,
    requiresManagedSecretProviderProof: true,
    requiresDurableWorkerProof: true,
    requiresHostedRetryProof: true,
    requiresHostedObservabilityProof: true,
    requiresReplayBoundaryProof: true,
    requiresRemoteCiProof: true,
    evidenceRequired: [
      "managed secret provider selection proof",
      "runtime identity and least-privilege policy proof",
      "secret rotation revocation drill proof",
      "durable subscription worker proof",
      "durable hosted retry queue proof",
      "hosted dead-letter queue proof",
      "hosted delivery dashboard proof",
      "hosted alert routing proof",
      "delivery idempotency and replay-boundary proof",
      "request rate-limit header key proof",
      "operator incident drill proof",
      "remote CI proof",
      "operator rollback plan",
      "second-operator review proof"
    ],
    reviewSteps: [
      `Verify target URL signing-secret refs resolve only through managed-secret boundary ${parsed.secretProvider} with tenant/workspace/purpose scope checks.`,
      `Verify runtime identity and least-privilege policy through ${parsed.runtimeIdentity}.`,
      `Verify secret rotation and revocation drill through ${parsed.rotationDrill}.`,
      `Verify durable subscription workers through ${parsed.workerTopology} survive restarts, process concurrency, duplicate wakeups, and receiver failures.`,
      `Verify durable hosted retry queue through ${parsed.retryQueue}.`,
      `Verify hosted dead-letter queue through ${parsed.deadLetterQueue}.`,
      `Verify hosted dashboards through ${parsed.hostedDashboard}.`,
      `Verify alert routing through ${parsed.alertRouting}.`,
      `Verify idempotency and replay boundary through ${parsed.replayBoundary}.`,
      `Verify request rate-limit header key through ${parsed.rateLimitHeaderKey}.`,
      `Verify operator incident drill through ${parsed.incidentDrill}.`,
      `Attach remote CI evidence ${parsed.remoteCi}.`,
      `Attach operator rollback plan ${parsed.rollbackPlan}.`,
      "Verify hosted observability exposes counts, hashes, statuses, and scopes without raw target URLs, signing secrets, raw secret refs, or raw event bodies.",
      "Record second-operator review outside webhook secret and receiver credential scope."
    ],
    releaseBoundary:
      "Public-events hosted delivery readiness packet foundation only; it does not approve hosted delivery, mutate workers, mutate secrets, mutate subscriptions, replay events, configure hosted alerts, complete remote CI/security approval, or close production hosted-delivery blockers."
  };

  if (parsed.json) {
    io.stdout(JSON.stringify(packet, null, 2));
    return 0;
  }

  io.stdout(
    [
      "ScheduleOS public-events hosted delivery readiness packet.",
      `Environment: ${packet.environment}`,
      `Secret provider: ${packet.secretProvider}`,
      `Runtime identity: ${packet.runtimeIdentity}`,
      `Rotation drill: ${packet.rotationDrill}`,
      `Worker topology: ${packet.workerTopology}`,
      `Retry queue: ${packet.retryQueue}`,
      `Dead-letter queue: ${packet.deadLetterQueue}`,
      `Hosted dashboard: ${packet.hostedDashboard}`,
      `Alert routing: ${packet.alertRouting}`,
      `Replay boundary: ${packet.replayBoundary}`,
      `Rate-limit header key: ${packet.rateLimitHeaderKey}`,
      `Incident drill: ${packet.incidentDrill}`,
      `Remote CI: ${packet.remoteCi}`,
      `Rollback plan: ${packet.rollbackPlan}`,
`Second operator: ${packet.secondOperator}`,
`Scope: ${packet.scope.tenantId}/${packet.scope.workspaceId}/${packet.scope.userId}`,
      `As of: ${packet.asOf}`,
      "Production hosted delivery approval granted: false",
      "Hosted worker mutation allowed by packet: false",
      "Managed secret provider mutation allowed by packet: false",
      "Required evidence:",
      ...packet.evidenceRequired.map((item) => `- ${item}`),
      "",
      packet.releaseBoundary
    ].join("\n")
  );
  return 0;
}

function runRemoteCiPostgresReadinessPacketCommand(
args: readonly string[],
io: CliIO
): number {
  const parsed = parseRemoteCiPostgresReadinessPacketArgs(args);
  if ("error" in parsed) {
    io.stderr(parsed.error);
    return 1;
  }
  const packet = {
    generatedAt: new Date().toISOString(),
    operation: "remote CI PostgreSQL readiness review",
    environment: parsed.environment,
    ciProvider: parsed.ciProvider,
    postgresService: parsed.postgresService,
    scope: parsed.scope,
    asOf: parsed.asOf.toISOString(),
    remoteCiPostgresApprovalGranted: false,
    ciMutationAllowedByPacket: false,
    databaseMutationAllowedByPacket: false,
    remoteMutationAllowedByPacket: false,
    requiresRemoteCiProof: true,
    requiresMigrationProof: true,
    requiresLiveRepositoryProof: true,
    requiresTenantIsolationProof: true,
    evidenceRequired: [
      "remote CI workflow proof",
      "PostgreSQL service container proof",
      "migration apply proof",
      "live PostgreSQL repository test proof",
      "tenant isolation regression proof",
      "connection secret redaction proof",
      "artifact retention proof",
      "CI failure visibility proof",
      "retry and timeout policy proof",
      "rollback or rerun procedure proof",
      "remote CI log sanitization proof",
      "second-operator review proof"
    ],
    reviewSteps: [
      "Verify remote CI provisions PostgreSQL with scoped credentials stored only in the CI secret manager.",
      "Verify migrations apply from a clean database and live PostgreSQL repository tests run against the service.",
      "Verify tenant isolation, migration rollback or rerun procedure, retry timeout policy, and failure annotations.",
      "Verify logs, artifacts, and screenshots never include raw database URLs, passwords, private task titles, provider tokens, or customer data.",
      "Attach remote CI run link, retained artifacts, and second-operator review before marking PostgreSQL remote CI proof complete."
    ],
    releaseBoundary:
      "Remote CI PostgreSQL readiness packet foundation only; it does not create a remote, edit hosted CI settings, mutate databases, store connection secrets, approve remote CI proof, or complete repository/security release gates."
  };

  if (parsed.json) {
    io.stdout(JSON.stringify(packet, null, 2));
    return 0;
  }

  io.stdout(
    [
      "ScheduleOS remote CI PostgreSQL readiness packet.",
      `Environment: ${packet.environment}`,
      `CI provider: ${packet.ciProvider}`,
      `PostgreSQL service: ${packet.postgresService}`,
      `Scope: ${packet.scope.tenantId}/${packet.scope.workspaceId}/${packet.scope.userId}`,
      `As of: ${packet.asOf}`,
      "Remote CI PostgreSQL approval granted: false",
      "CI mutation allowed by packet: false",
      "Database mutation allowed by packet: false",
      "Required evidence:",
      ...packet.evidenceRequired.map((item) => `- ${item}`),
      "",
      packet.releaseBoundary
    ].join("\n")
);
return 0;
}

function runPublicRemoteCiReadinessPacketCommand(
args: readonly string[],
io: CliIO
): number {
const parsed = parsePublicRemoteCiReadinessPacketArgs(args);
if ("error" in parsed) {
io.stderr(parsed.error);
return 1;
}
const packet = {
generatedAt: new Date().toISOString(),
operation: "public remote CI readiness review",
environment: parsed.environment,
ciProvider: parsed.ciProvider,
  workflowSuite: parsed.workflowSuite,
  targetRepository: parsed.targetRepository,
  workflowRun: parsed.workflowRun,
  checkRun: parsed.checkRun,
  productionDependencyAudit: parsed.productionDependencyAudit,
  noGitDirectory: parsed.noGitDirectory,
  releaseSafetyScan: parsed.releaseSafetyScan,
  docsLinkCheck: parsed.docsLinkCheck,
  licenseCheck: parsed.licenseCheck,
  logSanitization: parsed.logSanitization,
  artifactRetention: parsed.artifactRetention,
  branchProtectionReview: parsed.branchProtectionReview,
  repositorySettingsReadiness: parsed.repositorySettingsReadiness,
  secondOperator: parsed.secondOperator,
  scope: parsed.scope,
asOf: parsed.asOf.toISOString(),
publicRemoteCiVerified: false,
workflowDispatchAllowedByPacket: false,
remoteMutationAllowedByPacket: false,
repositoryCreationAllowedByPacket: false,
secretMutationAllowedByPacket: false,
releaseGateMutationAllowedByPacket: false,
requiresFullCheckProof: true,
requiresAuditProof: true,
requiresNoGitDirectoryProof: true,
requiresReleaseSafetyProof: true,
requiresSecondOperatorReviewProof: true,
evidenceRequired: [
"public remote CI workflow run proof",
"npm run check proof",
"production dependency audit proof",
"no .git directory proof",
"release safety scan proof",
"documentation link check proof",
"license check proof",
"remote CI log sanitization proof",
"artifact retention proof",
"branch protection or required-checks review proof",
"public repository settings readiness proof",
"second-operator review proof"
],
reviewSteps: [
"Verify the release-equivalent workflow suite runs on the intended public or private staging remote before publication.",
"Verify CI executes build, test, documentation link, release safety, license, and production dependency audit gates.",
"Verify CI logs and artifacts do not expose tokens, provider secrets, local paths, private task data, customer data, or internal compatible leadership system material.",
"Verify branch protection, required checks, rerun policy, artifact retention, and failure visibility are reviewed before marking public remote CI proof complete.",
"Record second-operator review before repository creation, workflow dispatch for release approval, push, tag, package publication, or public announcement."
],
releaseBoundary:
"Public remote CI readiness packet foundation only; it does not create repositories, initialize git, add remotes, dispatch workflows, store CI secrets, mutate branch protection, mark public remote CI verified, change release gates, push commits, tag releases, publish packages, or announce ScheduleOS."
};

if (parsed.json) {
io.stdout(JSON.stringify(packet, null, 2));
return 0;
}

io.stdout(
[
"ScheduleOS public remote CI readiness packet.",
`Environment: ${packet.environment}`,
`CI provider: ${packet.ciProvider}`,
`Workflow suite: ${packet.workflowSuite}`,
`Target repository: ${packet.targetRepository}`,
`Scope: ${packet.scope.tenantId}/${packet.scope.workspaceId}/${packet.scope.userId}`,
`As of: ${packet.asOf}`,
"Public remote CI verified: false",
"Workflow dispatch allowed by packet: false",
"Remote mutation allowed by packet: false",
"Repository creation allowed by packet: false",
"Required evidence:",
...packet.evidenceRequired.map((item) => `- ${item}`),
"",
packet.releaseBoundary
].join("\n")
);
return 0;
}

function runRepositoryLaunchReadinessPacketCommand(
args: readonly string[],
io: CliIO
): number {
  const parsed = parseRepositoryLaunchReadinessPacketArgs(args);
  if ("error" in parsed) {
    io.stderr(parsed.error);
    return 1;
  }
  const packet = {
    generatedAt: new Date().toISOString(),
    operation: "repository launch readiness review",
    environment: parsed.environment,
    targetRepository: parsed.targetRepository,
    historyPlan: parsed.historyPlan,
    finalReleaseGate: parsed.finalReleaseGate,
    cleanPublicHistory: parsed.cleanPublicHistory,
    privacySecretScan: parsed.privacySecretScan,
    licenseAuditPass: parsed.licenseAuditPass,
    securityAuditPass: parsed.securityAuditPass,
    securityPolicyContact: parsed.securityPolicyContact,
    remoteCiPass: parsed.remoteCiPass,
    nameCollisionReview: parsed.nameCollisionReview,
    trademarkReview: parsed.trademarkReview,
    firstCommitStaging: parsed.firstCommitStaging,
    repositorySettings: parsed.repositorySettings,
    secondOperator: parsed.secondOperator,
    scope: parsed.scope,
    asOf: parsed.asOf.toISOString(),
    publicRepositoryCreationApproved: false,
    pushMutationAllowedByPacket: false,
    tagMutationAllowedByPacket: false,
    releaseMutationAllowedByPacket: false,
    remoteCreationAllowedByPacket: false,
    requiresCleanHistoryProof: true,
    requiresSecurityContactProof: true,
    requiresRemoteCiProof: true,
    requiresFinalGateProof: true,
    evidenceRequired: [
      "final release gate pass proof",
      "clean public history proof",
      "privacy and secret scan proof",
      "license audit pass proof",
      "security audit pass proof",
      "security policy contact proof",
      "remote CI pass proof",
      "repository name collision review proof",
      "trademark review proof",
      "first commit staging review proof",
      "public repository settings proof",
      "second-operator review proof"
    ],
    reviewSteps: [
      "Verify all public-release checklist gates pass before initializing history or creating a remote.",
      "Verify staged source excludes private compatible leadership system logic, real customer data, provider tokens, local databases, backups, logs, dist output, and env files.",
      "Verify security policy contact is configured outside public fixture text and no personal email appears in release evidence.",
      "Verify remote CI passes on a release-equivalent public or private staging remote before public announcement.",
      "Record second-operator review before repository creation, push, tag, release, or announcement."
    ],
    releaseBoundary:
      "Repository launch readiness packet foundation only; it does not create a public repository, initialize git, add remotes, push commits, tag releases, configure security contacts, publish packages, or announce ScheduleOS."
  };

  if (parsed.json) {
    io.stdout(JSON.stringify(packet, null, 2));
    return 0;
  }

  io.stdout(
    [
      "ScheduleOS repository launch readiness packet.",
      `Environment: ${packet.environment}`,
      `Target repository: ${packet.targetRepository}`,
      `History plan: ${packet.historyPlan}`,
      `Scope: ${packet.scope.tenantId}/${packet.scope.workspaceId}/${packet.scope.userId}`,
      `As of: ${packet.asOf}`,
      "Public repository creation approved: false",
      "Push mutation allowed by packet: false",
      "Tag mutation allowed by packet: false",
      "Required evidence:",
      ...packet.evidenceRequired.map((item) => `- ${item}`),
      "",
      packet.releaseBoundary
    ].join("\n")
);
return 0;
}

function runRepositorySettingsReadinessPacketCommand(
args: readonly string[],
io: CliIO
): number {
const parsed = parseRepositorySettingsReadinessPacketArgs(args);
if ("error" in parsed) {
io.stderr(parsed.error);
return 1;
}
const packet = {
generatedAt: new Date().toISOString(),
operation: "repository settings readiness review",
environment: parsed.environment,
    targetRepository: parsed.targetRepository,
    settingsProfile: parsed.settingsProfile,
    branchPolicy: parsed.branchPolicy,
    branchProtectionSettings: parsed.branchProtectionSettings,
    requiredStatusChecks: parsed.requiredStatusChecks,
    securityAdvisorySettings: parsed.securityAdvisorySettings,
    defaultBranchMergePolicy: parsed.defaultBranchMergePolicy,
    maintainerAccessReview: parsed.maintainerAccessReview,
    dependabotAlerts: parsed.dependabotAlerts,
    secretScanningPushProtection: parsed.secretScanningPushProtection,
    releasePackagePermissions: parsed.releasePackagePermissions,
    repositoryMetadata: parsed.repositoryMetadata,
    publicIssueDiscussionSettings: parsed.publicIssueDiscussionSettings,
    secondOperator: parsed.secondOperator,
    scope: parsed.scope,
asOf: parsed.asOf.toISOString(),
publicRepositorySettingsConfigured: false,
repositoryMutationAllowedByPacket: false,
branchProtectionMutationAllowedByPacket: false,
securityAdvisoryMutationAllowedByPacket: false,
maintainerAccessMutationAllowedByPacket: false,
releaseGateMutationAllowedByPacket: false,
requiresBranchProtectionProof: true,
requiresRequiredChecksProof: true,
requiresSecuritySettingsProof: true,
requiresMaintainerAccessProof: true,
requiresSecondOperatorReviewProof: true,
evidenceRequired: [
"branch protection settings proof",
"required status checks proof",
"security advisory settings proof",
"default branch and merge policy proof",
"maintainer access review proof",
"Dependabot and vulnerability alert settings proof",
"secret scanning push protection review proof",
"release and package permission settings proof",
"repository metadata and description proof",
"public issue and discussion settings review proof",
"second-operator review proof"
],
reviewSteps: [
"Verify repository settings only after final local gates pass and clean public history is prepared.",
"Verify default branch, branch protection, required status checks, signed tag or release policy, merge strategy, and deletion restrictions.",
"Verify security advisory reporting, vulnerability alerts, dependency update settings, secret scanning, and push protection are configured or explicitly documented as unavailable.",
"Verify maintainer access follows least privilege and no private compatible leadership system/customer-data access is granted through the public repository.",
"Record second-operator review before changing repository settings, pushing, tagging, publishing packages, or announcing ScheduleOS."
],
releaseBoundary:
"Repository settings readiness packet foundation only; it does not create repositories, initialize git, add remotes, mutate repository settings, mutate branch protection, configure security advisories, change maintainer access, mark repository settings configured, change release gates, push commits, tag releases, publish packages, or announce ScheduleOS."
};

if (parsed.json) {
io.stdout(JSON.stringify(packet, null, 2));
return 0;
}

io.stdout(
[
"ScheduleOS repository settings readiness packet.",
`Environment: ${packet.environment}`,
`Target repository: ${packet.targetRepository}`,
`Settings profile: ${packet.settingsProfile}`,
`Branch policy: ${packet.branchPolicy}`,
`Scope: ${packet.scope.tenantId}/${packet.scope.workspaceId}/${packet.scope.userId}`,
`As of: ${packet.asOf}`,
"Public repository settings configured: false",
"Repository mutation allowed by packet: false",
"Branch protection mutation allowed by packet: false",
"Security advisory mutation allowed by packet: false",
"Required evidence:",
...packet.evidenceRequired.map((item) => `- ${item}`),
"",
packet.releaseBoundary
].join("\n")
);
return 0;
}

function runCleanHistoryReadinessPacketCommand(
 args: readonly string[],
 io: CliIO
): number {
 const parsed = parseCleanHistoryReadinessPacketArgs(args);
 if ("error" in parsed) {
 io.stderr(parsed.error);
 return 1;
 }
 const packet = {
 generatedAt: new Date().toISOString(),
    operation: "clean public history readiness review",
    environment: parsed.environment,
    historyScope: parsed.historyScope,
    sourceRoot: parsed.sourceRoot,
    noGitDirectory: parsed.noGitDirectory,
    releaseSafetyScan: parsed.releaseSafetyScan,
    firstCommitStagingManifest: parsed.firstCommitStagingManifest,
    generatedArtifactReview: parsed.generatedArtifactReview,
    fixtureSanitization: parsed.fixtureSanitization,
    licenseNoticeReadiness: parsed.licenseNoticeReadiness,
    repositoryNaming: parsed.repositoryNaming,
    remoteCiPlan: parsed.remoteCiPlan,
    secondOperator: parsed.secondOperator,
 scope: parsed.scope,
 asOf: parsed.asOf.toISOString(),
 cleanHistoryPrepared: false,
 gitInitializationAllowedByPacket: false,
 remoteMutationAllowedByPacket: false,
 pushMutationAllowedByPacket: false,
 tagMutationAllowedByPacket: false,
 requiresNoGitDirectoryProof: true,
 requiresReleaseSafetyProof: true,
 requiresFirstCommitStagingProof: true,
 requiresGeneratedArtifactReviewProof: true,
 requiresSecondOperatorReviewProof: true,
 evidenceRequired: [
 "no .git directory proof",
 "release safety scan proof",
 "first commit staging manifest proof",
 "generated artifact review proof",
 "fixture and sample data sanitization proof",
 "license and notice readiness proof",
 "repository readiness naming proof",
 "remote CI plan proof",
 "second-operator review proof"
 ],
 reviewSteps: [
 "Verify the release-candidate source tree has no local .git directory before public history staging.",
 "Verify release safety, license, privacy, generated artifact, and fixture reviews are current for the exact source root.",
 "Prepare a first-commit staging manifest outside this packet before initializing git.",
 "Verify repository naming, remote CI plan, and security contact evidence are ready before public repository creation.",
 "Record second-operator review before initializing git, creating remotes, pushing, tagging, or publishing."
 ],
 releaseBoundary:
 "Clean public history readiness packet foundation only; it does not initialize git, create repositories, add remotes, push commits, tag releases, mutate package files, mark clean history prepared, publish packages, or announce ScheduleOS."
 };
 if (parsed.json) {
 io.stdout(JSON.stringify(packet, null, 2));
 return 0;
 }
 io.stdout(
 [
 "ScheduleOS clean public history readiness packet.",
 `Environment: ${packet.environment}`,
 `History scope: ${packet.historyScope}`,
 `Source root: ${packet.sourceRoot}`,
 `Scope: ${packet.scope.tenantId}/${packet.scope.workspaceId}/${packet.scope.userId}`,
 `As of: ${packet.asOf}`,
 "Clean history prepared: false",
 "Git initialization allowed by packet: false",
 "Remote mutation allowed by packet: false",
 "Push mutation allowed by packet: false",
 "Required evidence:",
 ...packet.evidenceRequired.map((item) => `- ${item}`),
 "",
 packet.releaseBoundary
 ].join("\n")
 );
 return 0;
}

function runGeneratedArtifactReviewPacketCommand(
 args: readonly string[],
 io: CliIO
): number {
 const parsed = parseGeneratedArtifactReviewPacketArgs(args);
 if ("error" in parsed) {
 io.stderr(parsed.error);
 return 1;
 }
 const packet = {
 generatedAt: new Date().toISOString(),
 operation: "generated artifact review",
 environment: parsed.environment,
 artifactScope: parsed.artifactScope,
 manifest: parsed.manifest,
 scope: parsed.scope,
 asOf: parsed.asOf.toISOString(),
 generatedArtifactsApproved: false,
 artifactRewriteAllowedByPacket: false,
 artifactDeletionAllowedByPacket: false,
 repositoryMutationAllowedByPacket: false,
 releaseGateMutationAllowedByPacket: false,
 publicationAllowedByPacket: false,
 requiresDistReviewProof: true,
 requiresFixtureReviewProof: true,
 requiresExportBackupReviewProof: true,
 requiresLocalPathPrivateUrlReviewProof: true,
 requiresSecondOperatorReviewProof: true,
 evidenceRequired: [
 "generated artifact manifest proof",
 "dist build output review proof",
 "fixture template and sample output sanitization proof",
 "screenshots exports backups logs review proof",
 "local path and private URL absence proof",
 "provider identifier minimization proof",
 "license and NOTICE trigger proof",
 "first commit staging manifest alignment proof",
 "second-operator review proof"
 ],
 reviewSteps: [
 "Verify generated artifacts are either excluded from first public commit or reviewed against the artifact manifest.",
 "Verify dist output, fixtures, templates, examples, screenshots, exports, backups, logs, and generated docs contain fictional content only.",
 "Verify generated artifacts do not include local absolute paths, private URLs, provider tokens, raw webhook targets, customer data, private compatible leadership system material, or real email-shaped identifiers.",
 "Verify copied-source, asset, media, font, binary, license, and NOTICE triggers are reviewed before final licensing/privacy PASS.",
 "Attach second-operator review before clean-history approval, release-gate mutation, repository creation, push, tag, package publication, or announcement."
 ],
    localEvidenceCommands: [
 "npm run check",
 "npm run release:safety",
 "npm run license:check",
 "find . -maxdepth 2 -name .git -type d -print"
 ],
 releaseBoundary:
 "Generated artifact review packet foundation only; it does not approve generated artifacts, rewrite or delete artifacts, mutate release gates, initialize git, create remotes, push commits, tag releases, publish packages, or announce ScheduleOS."
 };
 if (parsed.json) {
 io.stdout(JSON.stringify(packet, null, 2));
 return 0;
 }
 io.stdout(
 [
 "ScheduleOS generated artifact review packet.",
 `Environment: ${packet.environment}`,
 `Artifact scope: ${packet.artifactScope}`,
 `Manifest: ${packet.manifest}`,
 `Scope: ${packet.scope.tenantId}/${packet.scope.workspaceId}/${packet.scope.userId}`,
 `As of: ${packet.asOf}`,
 "Generated artifacts approved: false",
 "Artifact rewrite allowed by packet: false",
 "Repository mutation allowed by packet: false",
 "Required evidence:",
 ...packet.evidenceRequired.map((item) => `- ${item}`),
 "",
 "Local evidence commands:",
 ...packet.localEvidenceCommands.map((item) => `- ${item}`),
 "",
 packet.releaseBoundary
 ].join("\n")
 );
 return 0;
}

function runSecurityPolicyContactReadinessPacketCommand(
 args: readonly string[],
 io: CliIO
): number {
 const parsed = parseSecurityPolicyContactReadinessPacketArgs(args);
 if ("error" in parsed) {
 io.stderr(parsed.error);
 return 1;
 }

 const packet = {
 generatedAt: new Date().toISOString(),
 operation: "security policy contact readiness review",
    environment: parsed.environment,
    contactChannel: parsed.contactChannel,
    responsibleParty: parsed.responsibleParty,
    disclosureWorkflow: parsed.disclosureWorkflow,
    advisorySettings: parsed.advisorySettings,
    responseSla: parsed.responseSla,
    escalationPath: parsed.escalationPath,
    privateReportSanitization: parsed.privateReportSanitization,
    remoteCiSecurityWorkflow: parsed.remoteCiSecurityWorkflow,
    secondOperator: parsed.secondOperator,
    scope: parsed.scope,
 asOf: parsed.asOf.toISOString(),
 securityContactConfigured: false,
 securityPolicyMutationAllowedByPacket: false,
 repositorySettingsMutationAllowedByPacket: false,
 publicRepositoryMutationAllowedByPacket: false,
 requiresSecurityPolicyProof: true,
 requiresResponsiblePartyProof: true,
 requiresDisclosureWorkflowProof: true,
 requiresRepositorySecuritySettingsProof: true,
 requiresSecondOperatorReviewProof: true,
 evidenceRequired: [
 "SECURITY.md contact-channel proof",
 "responsible maintainer proof",
 "vulnerability disclosure workflow proof",
 "repository security advisory settings proof",
 "security response SLA proof",
 "triage escalation path proof",
 "private report sanitization proof",
 "remote CI security workflow proof",
 "second-operator review proof"
 ],
 reviewSteps: [
 "Verify SECURITY.md names a monitored contact channel without committing personal email addresses or private reporter data.",
 "Verify a responsible maintainer and backup reviewer are assigned outside the public source tree.",
 "Verify vulnerability disclosure, triage, escalation, embargo, and response SLA workflow before publication.",
 "Verify public repository security advisory and private vulnerability reporting settings only after all release gates pass.",
 "Attach remote CI security workflow evidence and second-operator review before changing security contact status."
 ],
    labelReviewSteps: [
      `Verify monitored contact-channel evidence label ${parsed.contactChannel} is reflected in SECURITY.md without personal email addresses.`,
      `Verify responsible maintainer evidence label ${parsed.responsibleParty} has backup reviewer coverage outside public fixtures.`,
      `Verify disclosure workflow evidence label ${parsed.disclosureWorkflow} covers intake, triage, embargo, and coordinated disclosure.`,
      `Verify repository advisory settings evidence label ${parsed.advisorySettings} and response SLA label ${parsed.responseSla} are reviewed before publication.`,
      `Verify escalation-path evidence label ${parsed.escalationPath} and private-report sanitization label ${parsed.privateReportSanitization} keep reporter data out of public artifacts.`,
      `Attach remote CI security workflow evidence ${parsed.remoteCiSecurityWorkflow} and second-operator review ${parsed.secondOperator} before changing security contact status.`
    ],
 releaseBoundary:
 "Security policy contact readiness packet foundation only; it does not configure security contacts, edit repository settings, create a public repository, mutate SECURITY.md, mark security audit PASS, publish packages, or announce ScheduleOS."
 };

 if (parsed.json) {
 io.stdout(JSON.stringify(packet, null, 2));
 return 0;
 }

 io.stdout(
 [
 "ScheduleOS security policy contact readiness packet.",
 `Environment: ${packet.environment}`,
 `Contact channel: ${packet.contactChannel}`,
 `Responsible party: ${packet.responsibleParty}`,
 `Scope: ${packet.scope.tenantId}/${packet.scope.workspaceId}/${packet.scope.userId}`,
 `As of: ${packet.asOf}`,
 "Security contact configured: false",
 "Security policy mutation allowed by packet: false",
 "Repository settings mutation allowed by packet: false",
 "Required evidence:",
 ...packet.evidenceRequired.map((item) => `- ${item}`),
 "",
 packet.releaseBoundary
 ].join("\n")
 );
 return 0;
}

function runFinalSecurityAuditReadinessPacketCommand(
 args: readonly string[],
 io: CliIO
): number {
  const parsed = parseFinalSecurityAuditReadinessPacketArgs(args);
  if ("error" in parsed) {
    io.stderr(parsed.error);
    return 1;
  }

  const packet = {
    generatedAt: new Date().toISOString(),
    operation: "final security audit readiness review",
    environment: parsed.environment,
 auditScope: parsed.auditScope,
 scope: parsed.scope,
 asOf: parsed.asOf.toISOString(),
 dependencyAuditPass: parsed.dependencyAuditPass,
 secretScan: parsed.secretScan,
 privacyScan: parsed.privacyScan,
 productionAuth: parsed.productionAuth,
 roleMembership: parsed.roleMembership,
 resetTokenLifecycle: parsed.resetTokenLifecycle,
 rateLimitAbuseMonitoring: parsed.rateLimitAbuseMonitoring,
 providerManagedSecretLifecycle: parsed.providerManagedSecretLifecycle,
 deploymentTlsProxyHeaders: parsed.deploymentTlsProxyHeaders,
 remoteCi: parsed.remoteCi,
 securityPolicyContact: parsed.securityPolicyContact,
 finalSourceReview: parsed.finalSourceReview,
 secondOperator: parsed.secondOperator,
 securityAuditPassApproved: false,
    releaseGateMutationAllowedByPacket: false,
    productionDeploymentApproved: false,
    securityPolicyMutationAllowedByPacket: false,
    requiresDependencyAuditFinalPass: true,
    requiresSecretScanProof: true,
    requiresPrivacyScanProof: true,
    requiresProductionAuthProof: true,
    requiresProductionRateLimitProof: true,
    requiresProviderLifecycleProof: true,
    requiresRemoteCiProof: true,
    requiresSecurityContactProof: true,
    requiresSecondOperatorReview: true,
    evidenceRequired: [
      "final dependency audit pass proof",
      "secret scan proof",
      "privacy and private-data scan proof",
      "production auth/session proof",
      "production role and membership proof",
      "production reset-token lifecycle proof",
      "production rate-limit and abuse-monitoring proof",
      "provider token lifecycle and managed-secret proof",
      "production deployment TLS/proxy/header proof",
      "remote CI pass proof",
      "security policy contact proof",
      "final release-candidate source review proof",
      "second-operator review proof"
    ],
    reviewSteps: [ `Dependency audit PASS label: ${parsed.dependencyAuditPass}`, `Secret scan label: ${parsed.secretScan}`, `Privacy scan label: ${parsed.privacyScan}`, `Production auth/session label: ${parsed.productionAuth}`, `Role and membership label: ${parsed.roleMembership}`, `Reset-token lifecycle label: ${parsed.resetTokenLifecycle}`, `Rate-limit and abuse-monitoring label: ${parsed.rateLimitAbuseMonitoring}`, `Provider managed-secret lifecycle label: ${parsed.providerManagedSecretLifecycle}`, `Deployment TLS/proxy/header label: ${parsed.deploymentTlsProxyHeaders}`, `Remote CI label: ${parsed.remoteCi}`, `Security policy contact label: ${parsed.securityPolicyContact}`, `Final source review label: ${parsed.finalSourceReview}`, `Second-operator security review label: ${parsed.secondOperator}`,
      "Run dependency audit, release safety scan, secret scan, privacy scan, and documentation checks on the frozen release candidate.",
      "Verify production auth, roles, memberships, sessions, password reset, lockout, pruning, and cookie/CSRF behavior on the selected deployment path.",
      "Verify production rate limiting, abuse monitoring, provider quota governance, hosted alert routing, and dashboards.",
      "Verify provider token lifecycle uses managed secrets, rotation, revocation, scoped access, and sanitized audit evidence.",
      "Verify remote CI and production deployment proof do not expose raw credentials, private task titles, customer data, tokens, logs, databases, or local paths.",
      "Record security policy contact proof and second-operator security review before changing the security audit status to PASS."
    ],
    releaseBoundary:
      "Final security audit readiness packet foundation only; it does not mark security audit PASS, approve production deployment, configure security contacts, mutate release gates, create remotes, publish packages, or announce ScheduleOS."
  };

  if (parsed.json) {
    io.stdout(JSON.stringify(packet, null, 2));
    return 0;
  }

  io.stdout(
    [
      "ScheduleOS final security audit readiness packet.",
      `Environment: ${packet.environment}`,
      `Audit scope: ${packet.auditScope}`,
      `Scope: ${packet.scope.tenantId}/${packet.scope.workspaceId}/${packet.scope.userId}`,
      `As of: ${packet.asOf}`,
      "Security audit PASS approved: false",
      "Release gate mutation allowed by packet: false",
      "Production deployment approved: false",
      "Required evidence:",
      ...packet.evidenceRequired.map((item) => `- ${item}`),
      "",
      packet.releaseBoundary
    ].join("\n")
  );
  return 0;
}

function runFinalLicensingAuditReadinessPacketCommand(
  args: readonly string[],
  io: CliIO
): number {
  const parsed = parseFinalLicensingAuditReadinessPacketArgs(args);
  if ("error" in parsed) {
    io.stderr(parsed.error);
    return 1;
  }

  const packet = {
    generatedAt: new Date().toISOString(),
    operation: "final licensing audit readiness review",
    environment: parsed.environment,
    auditScope: parsed.auditScope,
    scope: parsed.scope,
    asOf: parsed.asOf.toISOString(),
    finalLicenseCheck: parsed.finalLicenseCheck,
    lockfileDependencyLicenses: parsed.lockfileDependencyLicenses,
    installedDependencyMetadata: parsed.installedDependencyMetadata,
    copiedSourceScan: parsed.copiedSourceScan,
    fixtureTemplateExampleReview: parsed.fixtureTemplateExampleReview,
    assetMediaFontBinaryReview: parsed.assetMediaFontBinaryReview,
    documentationReuseScan: parsed.documentationReuseScan,
    reusedMaterialInventory: parsed.reusedMaterialInventory,
    noticeReview: parsed.noticeReview,
    rootLicenseConsistency: parsed.rootLicenseConsistency,
    finalReleaseCandidateFreeze: parsed.finalReleaseCandidateFreeze,
    secondOperator: parsed.secondOperator,
    licensingAuditPassApproved: false,
    releaseGateMutationAllowedByPacket: false,
    noticeMutationAllowedByPacket: false,
    publicationAllowedByPacket: false,
    requiresLockfileLicenseProof: true,
    requiresInstalledDependencyProof: true,
    requiresCopiedSourceProof: true,
    requiresFixtureAssetDocsProof: true,
    requiresNoticeReviewProof: true,
    requiresReusedMaterialInventory: true,
    requiresFinalReleaseCandidateProof: true,
    requiresSecondOperatorReview: true,
    evidenceRequired: [
      "final license check pass proof",
      "lockfile dependency license proof",
      "installed dependency metadata proof",
      "copied-source marker scan proof",
      "fixture template example review proof",
      "asset media font binary review proof",
      "documentation reuse marker proof",
      "third-party reused material inventory proof",
      "NOTICE requirement review proof",
      "root Apache-2.0 license consistency proof",
      "final release-candidate freeze proof",
      "second-operator review proof"
    ],
    reviewSteps: [
      "Run license check on the frozen release candidate after final source, docs, fixtures, package lock, and generated release-surface changes.",
      "Verify dependency lockfile and installed dependency metadata only contain approved licenses or documented exceptions.",
      "Verify copied-source, fixture/template/example, asset/media/font/binary, documentation reuse, and NOTICE trigger scans are clean.",
      "Record every reused project, version or commit, license, usage type, attribution, NOTICE requirement, and final approval status.",
      "Add or update NOTICE only if final dependency or reused-material review requires it, then rerun all release gates.",
    "Record second-operator licensing review before changing the licensing audit status to PASS."
  ],
  localEvidenceCommands: [
    "npm run license:check",
    "npm ls --omit=dev --all",
    "npm run release:safety",
    "find . -maxdepth 2 -name .git -type d -print"
  ],
  localEvidenceBoundary:
    "Local licensing evidence commands are review inputs only; they do not replace final reused-material inventory, NOTICE review, release-candidate freeze, remote CI evidence, or second-operator licensing approval.",
  releaseBoundary:
    "Final licensing audit readiness packet foundation only; it does not mark licensing audit PASS, approve publication, add NOTICE, mutate release gates, create remotes, publish packages, or announce ScheduleOS."
};

  if (parsed.json) {
    io.stdout(JSON.stringify(packet, null, 2));
    return 0;
  }

  io.stdout(
    [
      "ScheduleOS final licensing audit readiness packet.",
      `Environment: ${packet.environment}`,
      `Audit scope: ${packet.auditScope}`,
      `Scope: ${packet.scope.tenantId}/${packet.scope.workspaceId}/${packet.scope.userId}`,
      `As of: ${packet.asOf}`,
      "Licensing audit PASS approved: false",
      "Release gate mutation allowed by packet: false",
"NOTICE mutation allowed by packet: false",
"Required evidence:",
...packet.evidenceRequired.map((item) => `- ${item}`),
"",
    "Local evidence commands:",
    ...packet.localEvidenceCommands.map((item) => `- ${item}`),
    "",
    packet.localEvidenceBoundary,
    "",
packet.releaseBoundary
].join("\n")
  );
  return 0;
}

function runFinalPrivacyAuditReadinessPacketCommand(
  args: readonly string[],
  io: CliIO
): number {
  const parsed = parseFinalPrivacyAuditReadinessPacketArgs(args);
  if ("error" in parsed) {
    io.stderr(parsed.error);
    return 1;
  }

  const packet = {
    generatedAt: new Date().toISOString(),
    operation: "final privacy audit readiness review",
    environment: parsed.environment,
    auditScope: parsed.auditScope,
    scope: parsed.scope,
    asOf: parsed.asOf.toISOString(),
    releaseSafetyScan: parsed.releaseSafetyScan,
    fixtureSanitization: parsed.fixtureSanitization,
    generatedArtifactReview: parsed.generatedArtifactReview,
    logExportBackupReview: parsed.logExportBackupReview,
    providerIdentifierReview: parsed.providerIdentifierReview,
    localPathPrivateUrlReview: parsed.localPathPrivateUrlReview,
    privateLeadershipBoundary: parsed.privateLeadershipBoundary,
    calendarTaskMinimization: parsed.calendarTaskMinimization,
    aiRedactionBoundary: parsed.aiRedactionBoundary,
    retentionExportDeletionRevocation: parsed.retentionExportDeletionRevocation,
    secondOperator: parsed.secondOperator,
    privacyAuditPassApproved: false,
    releaseGateMutationAllowedByPacket: false,
    publicationAllowedByPacket: false,
    generatedArtifactMutationAllowedByPacket: false,
    requiresFixtureSanitizationProof: true,
    requiresGeneratedArtifactReviewProof: true,
    requiresProviderIdentifierReviewProof: true,
    requiresPrivateLeadershipBoundaryProof: true,
    requiresLogScreenshotExportReviewProof: true,
    requiresLocalPathAndMachineNameReviewProof: true,
    requiresFinalReleaseSafetyScanProof: true,
    requiresSecondOperatorReview: true,
    evidenceRequired: [
      "final release safety scan proof",
      "fixture and sample-data sanitization proof",
      "generated artifact sanitization proof",
      "logs screenshots exports backups review proof",
      "provider identifier and tenant-id review proof",
      "local path machine name private URL review proof",
      "private compatible leadership system prompt and customer-data boundary proof",
      "calendar title attendee location description minimization proof",
      "task title description source metadata minimization proof",
      "AI data optional redaction boundary proof",
      "retention export deletion provider-revocation proof",
      "second-operator review proof"
    ],
    reviewSteps: [
      `Release safety scan label: ${parsed.releaseSafetyScan}`,
      `Fixture sanitization label: ${parsed.fixtureSanitization}`,
      `Generated artifact review label: ${parsed.generatedArtifactReview}`,
      `Log/export/backup review label: ${parsed.logExportBackupReview}`,
      `Provider identifier review label: ${parsed.providerIdentifierReview}`,
      `Local path/private URL review label: ${parsed.localPathPrivateUrlReview}`,
      `Private compatible leadership system boundary label: ${parsed.privateLeadershipBoundary}`,
      `Calendar/task minimization label: ${parsed.calendarTaskMinimization}`,
      `AI redaction boundary label: ${parsed.aiRedactionBoundary}`,
      `Retention/export/deletion/revocation label: ${parsed.retentionExportDeletionRevocation}`,
      `Second-operator privacy review label: ${parsed.secondOperator}`,
      "Run release safety and privacy scans on the frozen release candidate, including source, docs, fixtures, samples, generated outputs, dist, scripts, migrations, root config, and GitHub templates.",
      "Verify fixtures, sample calendars, sample tasks, screenshots, logs, exports, backups, and database files are fictional or sanitized.",
      "Verify provider IDs, tenant IDs, workspace IDs, calendar IDs, Slack IDs, Microsoft tenant IDs, local usernames, local paths, machine names, private domains, and private repository URLs are absent or fictional.",
      "Verify no private compatible leadership system prompts, customer metrics, real business data, private task titles, real calendar titles, attendees, locations, descriptions, or message bodies are included in the release surface.",
      "Verify data minimization, export, deletion, retention, provider revocation, AI optionality, and redaction boundaries match `docs/security/data-handling.md`.",
      "Record second-operator privacy review before changing privacy or security release status to PASS."
    ],
    releaseBoundary:
      "Final privacy audit readiness packet foundation only; it does not mark privacy audit PASS, approve publication, mutate release gates, rewrite generated artifacts, create remotes, publish packages, or announce ScheduleOS."
  };

  if (parsed.json) {
    io.stdout(JSON.stringify(packet, null, 2));
    return 0;
  }

  io.stdout(
    [
      "ScheduleOS final privacy audit readiness packet.",
      `Environment: ${packet.environment}`,
      `Audit scope: ${packet.auditScope}`,
      `Scope: ${packet.scope.tenantId}/${packet.scope.workspaceId}/${packet.scope.userId}`,
      `As of: ${packet.asOf}`,
      "Privacy audit PASS approved: false",
      "Release gate mutation allowed by packet: false",
      "Publication allowed by packet: false",
      "Required evidence:",
      ...packet.evidenceRequired.map((item) => `- ${item}`),
      "",
      packet.releaseBoundary
    ].join("\n")
  );
  return 0;
}

function runFinalReleaseGateReadinessPacketCommand(
  args: readonly string[],
  io: CliIO
): number {
  const parsed = parseFinalReleaseGateReadinessPacketArgs(args);
  if ("error" in parsed) {
    io.stderr(parsed.error);
    return 1;
  }

  const packet = {
    generatedAt: new Date().toISOString(),
    operation: "final release gate readiness review",
    environment: parsed.environment,
    releaseScope: parsed.releaseScope,
    scope: parsed.scope,
    asOf: parsed.asOf.toISOString(),
    functionalityGate: parsed.functionalityGate,
    storageGate: parsed.storageGate,
    documentationGate: parsed.documentationGate,
    securityAuditPass: parsed.securityAuditPass,
    licensingAuditPass: parsed.licensingAuditPass,
    privacyAuditPass: parsed.privacyAuditPass,
    dependencyAuditFinalPass: parsed.dependencyAuditFinalPass,
    remoteCiPass: parsed.remoteCiPass,
    cleanHistory: parsed.cleanHistory,
    securityPolicyContact: parsed.securityPolicyContact,
    repositorySettings: parsed.repositorySettings,
    finalSourceReview: parsed.finalSourceReview,
    secondOperator: parsed.secondOperator,
    releaseApproved: false,
    publicationAllowedByPacket: false,
    repositoryMutationAllowedByPacket: false,
    tagMutationAllowedByPacket: false,
    packagePublicationAllowedByPacket: false,
    announcementAllowedByPacket: false,
    requiresFunctionalityGateProof: true,
    requiresStorageGateProof: true,
    requiresDocumentationGateProof: true,
    requiresSecurityAuditPassProof: true,
    requiresLicensingAuditPassProof: true,
    requiresPrivacyAuditPassProof: true,
    requiresRemoteCiProof: true,
    requiresCleanHistoryProof: true,
    requiresSecurityContactProof: true,
    requiresSecondOperatorReview: true,
    evidenceRequired: [
      "functionality gate pass proof",
      "storage gate pass proof",
      "documentation gate pass proof",
      "security audit PASS proof",
      "licensing audit PASS proof",
      "privacy audit PASS proof",
      "dependency audit final pass proof",
      "remote CI pass proof",
      "clean public history proof",
      "security policy contact proof",
      "public repository settings proof",
      "final source and generated-artifact review proof",
      "second-operator release approval proof"
    ],
    reviewSteps: [
      `Functionality gate label: ${parsed.functionalityGate}`,
      `Storage gate label: ${parsed.storageGate}`,
      `Documentation gate label: ${parsed.documentationGate}`,
      `Security audit PASS label: ${parsed.securityAuditPass}`,
      `Licensing audit PASS label: ${parsed.licensingAuditPass}`,
      `Privacy audit PASS label: ${parsed.privacyAuditPass}`,
      `Dependency audit final pass label: ${parsed.dependencyAuditFinalPass}`,
      `Remote CI pass label: ${parsed.remoteCiPass}`,
      `Clean public history label: ${parsed.cleanHistory}`,
      `Security policy contact label: ${parsed.securityPolicyContact}`,
      `Public repository settings label: ${parsed.repositorySettings}`,
      `Final source and generated-artifact review label: ${parsed.finalSourceReview}`,
      `Second-operator release approval label: ${parsed.secondOperator}`,
      "Verify every public-release checklist item is checked against release-candidate evidence, not only readiness packet foundations.",
      "Verify security, licensing, and privacy audit documents each explicitly changed from FAIL to PASS after final release-candidate review.",
      "Verify remote CI passes on release-equivalent remote, clean history is prepared, security contact is configured, and public repository settings are reviewed.",
      "Verify no public repository, tag, package publication, announcement, or hosted production deployment occurs until this packet evidence is satisfied.",
      "Record second-operator release approval only after all final gates pass."
    ],
    releaseBoundary:
      "Final release gate readiness packet foundation only; it does not approve release, create repositories, initialize git, add remotes, push commits, tag releases, publish packages, deploy production, or announce ScheduleOS."
  };

  if (parsed.json) {
    io.stdout(JSON.stringify(packet, null, 2));
    return 0;
  }

  io.stdout(
    [
      "ScheduleOS final release gate readiness packet.",
      `Environment: ${packet.environment}`,
      `Release scope: ${packet.releaseScope}`,
      `Scope: ${packet.scope.tenantId}/${packet.scope.workspaceId}/${packet.scope.userId}`,
      `As of: ${packet.asOf}`,
      "Release approved: false",
      "Publication allowed by packet: false",
      "Repository mutation allowed by packet: false",
      "Required evidence:",
      ...packet.evidenceRequired.map((item) => `- ${item}`),
      "",
      packet.releaseBoundary
    ].join("\n")
  );
  return 0;
}

function runDependencyAuditReadinessPacketCommand(
 args: readonly string[],
 io: CliIO
): number {
 const parsed = parseDependencyAuditReadinessPacketArgs(args);
 if ("error" in parsed) {
 io.stderr(parsed.error);
 return 1;
 }
 const packet = {
 generatedAt: new Date().toISOString(),
 operation: "dependency audit readiness review",
 environment: parsed.environment,
 auditScope: parsed.auditScope,
    packageManager: parsed.packageManager,
    productionAudit: parsed.productionAudit,
    lockfileProof: parsed.lockfileProof,
    installedTree: parsed.installedTree,
    runtimeInventory: parsed.runtimeInventory,
    devDependencyExclusion: parsed.devDependencyExclusion,
    overrideReview: parsed.overrideReview,
    licenseAlignment: parsed.licenseAlignment,
    registrySecretAbsence: parsed.registrySecretAbsence,
    remoteCi: parsed.remoteCi,
    secondOperator: parsed.secondOperator,
 scope: parsed.scope,
 asOf: parsed.asOf.toISOString(),
 dependencyAuditPassApproved: false,
 dependencyMutationAllowedByPacket: false,
 lockfileMutationAllowedByPacket: false,
 releaseGateMutationAllowedByPacket: false,
 packageRegistryMutationAllowedByPacket: false,
 requiresProductionAuditProof: true,
 requiresLockfileProof: true,
 requiresOverrideReviewProof: true,
 requiresInstalledTreeProof: true,
 requiresSecondOperatorReviewProof: true,
 evidenceRequired: [
 "production dependency audit proof",
 "lockfile reproducibility proof",
 "installed dependency tree proof",
 "runtime dependency inventory proof",
 "dev dependency exclusion proof",
 "override and resolution review proof",
 "transitive dependency license alignment proof",
 "package registry secret absence proof",
 "remote CI dependency audit proof",
 "second-operator review proof"
 ],
 reviewSteps: [
 "Verify production dependency audit runs from clean install and uses the release-candidate lockfile.",
 "Verify runtime dependency inventory excludes dev-only tooling from production risk claims.",
 "Verify overrides, resolutions, transitive dependencies, and package-lock changes are reviewed before approving dependency audit PASS.",
 "Verify dependency audit logs do not expose package registry tokens, private package names, or private registry URLs.",
 "Attach remote CI dependency audit evidence and second-operator review before changing release gate status."
 ],
    labelReviewSteps: [
      `Verify production dependency audit evidence label ${parsed.productionAudit} was captured from the release-candidate tree.`,
      `Verify lockfile reproducibility label ${parsed.lockfileProof} and installed production tree label ${parsed.installedTree} match the candidate package-lock.`,
      `Verify runtime inventory label ${parsed.runtimeInventory} excludes dev-only tooling claim boundaries through ${parsed.devDependencyExclusion}.`,
      `Verify overrides, resolutions, transitive dependencies, and package-lock changes are reviewed under ${parsed.overrideReview} and license alignment under ${parsed.licenseAlignment}.`,
      `Verify dependency audit logs prove ${parsed.registrySecretAbsence} without package registry tokens, private package names, or private registry URLs.`,
      `Attach remote CI dependency audit evidence ${parsed.remoteCi} and second-operator review ${parsed.secondOperator} before changing release gate status.`
    ],
 localEvidenceCommands: [
 "npm run check",
 "npm audit --omit=dev --audit-level=high",
 "npm ls --omit=dev --all",
 "npm run license:check",
 "find . -maxdepth 2 -name .git -type d -print"
 ],
 localEvidenceBoundary:
 "Local evidence commands are review inputs only; they do not replace remote CI dependency audit proof or second-operator approval.",
 releaseBoundary:
 "Dependency audit readiness packet foundation only; it does not install, update, remove, override, or publish dependencies, mutate package manifests or lockfiles, configure package registries, mark dependency audit PASS, mutate release gates, create remotes, or announce ScheduleOS."
 };
 if (parsed.json) {
 io.stdout(JSON.stringify(packet, null, 2));
 return 0;
 }
 io.stdout(
 [
 "ScheduleOS dependency audit readiness packet.",
 `Environment: ${packet.environment}`,
 `Audit scope: ${packet.auditScope}`,
 `Package manager: ${packet.packageManager}`,
 `Scope: ${packet.scope.tenantId}/${packet.scope.workspaceId}/${packet.scope.userId}`,
 `As of: ${packet.asOf}`,
 "Dependency audit PASS approved: false",
 "Dependency mutation allowed by packet: false",
      "Lockfile mutation allowed by packet: false",
      "Required evidence:",
      ...packet.evidenceRequired.map((item) => `- ${item}`),
      "",
      "Local evidence commands:",
      ...packet.localEvidenceCommands.map((item) => `- ${item}`),
      "",
      packet.localEvidenceBoundary,
      "",
      packet.releaseBoundary
 ].join("\n")
 );
 return 0;
}

function runPublicEventDeliveryOperatorPacketCommand(
  args: readonly string[],
  io: CliIO
): number {
  const parsed = parsePublicEventDeliveryOperatorPacketArgs(args);
  if ("error" in parsed) {
    io.stderr(parsed.error);
    return 1;
  }

  const request = {
    tenantId: parsed.scope.tenantId,
    workspaceId: parsed.scope.workspaceId,
    userId: parsed.scope.userId,
    dryRun: true,
    ...(parsed.type === undefined ? {} : { type: parsed.type }),
    ...(parsed.sourceSystem === undefined
      ? {}
      : { sourceSystem: parsed.sourceSystem }),
    ...(parsed.maxSubscriptions === undefined
      ? {}
      : { maxSubscriptions: parsed.maxSubscriptions }),
    ...(parsed.maxEvents === undefined ? {} : { maxEvents: parsed.maxEvents })
  };
  const workerCommand = [
    "npm",
    "run",
    "public-events:delivery-operator-packet",
    "--",
    "--tenant-id",
    parsed.scope.tenantId,
    "--workspace-id",
    parsed.scope.workspaceId,
    "--user-id",
    parsed.scope.userId,
    "--dry-run",
    ...(parsed.type === undefined ? [] : ["--type", parsed.type]),
    ...(parsed.sourceSystem === undefined
      ? []
      : ["--source-system", parsed.sourceSystem]),
    ...(parsed.maxSubscriptions === undefined
      ? []
      : ["--max-subscriptions", String(parsed.maxSubscriptions)]),
    ...(parsed.maxEvents === undefined
      ? []
      : ["--max-events", String(parsed.maxEvents)]),
    "--json"
  ];
  const packet = {
    generatedAt: new Date().toISOString(),
    operation: "public-event subscription delivery worker invocation",
    scope: parsed.scope,
    asOf: parsed.asOf.toISOString(),
    request,
    workerCommand,
    applyAllowedByPacket: false,
    managedSecretProviderRequired: true,
    durableWorkerRequiredForProduction: true,
    reviewSteps: [
      "Run this packet in dry-run mode first and save JSON output.",
      "Confirm subscriptionCount, matchedEventCount, processedEventCount, failedCount, and target hashes match expectations.",
      "Confirm the managed secret provider and runtime identity can resolve configured target URL and signing-secret refs for this tenant and workspace.",
      "Confirm delivery logs, packet output, support notes, and audit views contain only hashes, counts, event IDs, and statuses.",
      "Only enable non-dry-run delivery from a durable worker with retry, backoff, alert routing, and incident-review evidence."
    ],
    releaseBoundary:
      "Operator packet foundation only; durable hosted workers, persistent queues, managed secret provider proof, hosted dashboards, alert routing, and incident drills remain release blockers."
  };

  if (parsed.json) {
    io.stdout(JSON.stringify(packet, null, 2));
    return 0;
  }

  io.stdout(
    [
      "Public-event delivery operator packet.",
      `Scope: ${packet.scope.tenantId}/${packet.scope.workspaceId}/${packet.scope.userId}`,
      `As of: ${packet.asOf}`,
      "Dry run required: yes",
      "Apply allowed by packet: no",
      `Worker dry run: ${packet.workerCommand.join(" ")}`
    ].join("\n")
  );
  return 0;
}

function runPublicEventDeadLetterQueuePacketCommand(
  args: readonly string[],
  io: CliIO
): number {
  const parsed = parsePublicEventDeadLetterQueuePacketArgs(args);
  if ("error" in parsed) {
    io.stderr(parsed.error);
    return 1;
  }
  const request = {
    tenantId: parsed.scope.tenantId,
    workspaceId: parsed.scope.workspaceId,
    userId: parsed.scope.userId,
    maxAttempts: parsed.maxAttempts,
    ...(parsed.type === undefined ? {} : { type: parsed.type }),
    ...(parsed.status === undefined ? {} : { status: parsed.status })
  };
  const queueCommand = [
    "npm",
    "run",
    "public-events:dead-letter-queue-packet",
    "--",
    "--tenant-id",
    parsed.scope.tenantId,
    "--workspace-id",
    parsed.scope.workspaceId,
    "--user-id",
    parsed.scope.userId,
    "--as-of",
    parsed.asOf.toISOString(),
    "--max-attempts",
    String(parsed.maxAttempts),
    ...(parsed.type === undefined ? [] : ["--type", parsed.type]),
    ...(parsed.status === undefined ? [] : ["--status", parsed.status]),
    "--json"
  ];
  const packet = {
    generatedAt: new Date().toISOString(),
    operation: "public-event dead-letter queue review",
    scope: parsed.scope,
    asOf: parsed.asOf.toISOString(),
    request,
    queueCommand,
    applyAllowedByPacket: false,
    replayAllowedByPacket: false,
    deleteAllowedByPacket: false,
    durableDeadLetterQueueRequiredForProduction: true,
    reviewSteps: [
      "Fetch the matching dead-letter queue endpoint and save the JSON output with this packet.",
      "Confirm every queue row is scoped to the requested tenant, workspace, and user.",
      "Review unreviewed candidates first; record ACKNOWLEDGED, REPLAY_REQUESTED, or DROPPED decisions only through the review endpoint.",
      "Keep notes sanitized: do not include raw target URLs, signing secrets, raw event bodies, private task titles, private calendar titles, provider tokens, or provider row payloads.",
      "Do not replay, delete, or mark production recovery complete from this packet; durable dead-letter queues and approved replay orchestration remain separate release blockers."
    ],
    releaseBoundary:
      "Dead-letter queue packet foundation only; production durable dead-letter queues, replay orchestration, hosted dashboards, alert routing, and durable workers remain release blockers."
  };
  if (parsed.json) {
    io.stdout(JSON.stringify(packet, null, 2));
    return 0;
  }
  io.stdout(
    [
      "Public-event dead-letter queue packet.",
      `Scope: ${packet.scope.tenantId}/${packet.scope.workspaceId}/${packet.scope.userId}`,
      `As of: ${packet.asOf}`,
      `Max attempts: ${packet.request.maxAttempts}`,
      "Apply allowed by packet: no",
      "Replay allowed by packet: no",
      "Delete allowed by packet: no",
      `Queue review: ${packet.queueCommand.join(" ")}`
    ].join("\n")
  );
  return 0;
}

function runPublicEventDeliveryIncidentDrillPacketCommand(
  args: readonly string[],
  io: CliIO
): number {
  const parsed = parsePublicEventDeliveryIncidentDrillPacketArgs(args);
  if ("error" in parsed) {
    io.stderr(parsed.error);
    return 1;
  }

  const scopedArgs = [
    "--tenant-id",
    parsed.scope.tenantId,
    "--workspace-id",
    parsed.scope.workspaceId,
    "--user-id",
    parsed.scope.userId,
    "--as-of",
    parsed.asOf.toISOString(),
    ...(parsed.type === undefined ? [] : ["--type", parsed.type]),
    ...(parsed.sourceSystem === undefined
      ? []
      : ["--source-system", parsed.sourceSystem]),
    ...(parsed.maxSubscriptions === undefined
      ? []
      : ["--max-subscriptions", String(parsed.maxSubscriptions)]),
    ...(parsed.maxEvents === undefined
      ? []
      : ["--max-events", String(parsed.maxEvents)])
  ];
  const packet = {
    generatedAt: new Date().toISOString(),
    operation: "public-event delivery incident drill",
    incidentId: parsed.incidentId,
    suspectedFailureClass: parsed.failureClass,
    scope: parsed.scope,
    asOf: parsed.asOf.toISOString(),
    boundedDryRunCommand: [
      "npm",
      "run",
      "public-events:delivery-operator-packet",
      "--",
      ...scopedArgs,
      "--json"
    ],
    pauseWorkersFirst: ["privacy", "cross-scope", "signature", "worker"].includes(
      parsed.failureClass
    ),
    applyAllowedByPacket: false,
    replayAllowedByPacket: false,
    liveDeliveryAllowedByPacket: false,
    evidenceToCollect: [
      "delivery IDs, event IDs, subscription IDs, attempt numbers, statuses, and target URL hashes",
      "delivery-health summary counts for delivered, failed, retryable failed, and target counts",
      "oldest retry timestamp, retryable error class counts, exhausted-attempt counts, and disabled subscription counts",
      "managed secret provider key IDs or versions without secret values",
      "operator notes, timeline, customer impact, containment decision, and remediation owner"
    ],
    containmentSteps: [
      "Pause affected workers first when privacy, cross-scope, signature, or worker-health risk is suspected.",
      "Run bounded dry-run packet and save JSON evidence before any replay decision.",
      "Classify failures as network, receiver, throttling, signature, contract, privacy, cross-scope, or worker-health.",
      "Disable subscriptions with repeated non-retryable contract or authorization failures until receiver verification passes.",
      "Escalate privacy or cross-scope evidence as a security incident and preserve evidence outside cleanup paths."
    ],
    privacyBoundaries: [
      "Do not copy raw target URLs, signing secrets, raw secret refs, provider tokens, private task titles, private calendar titles, or raw event bodies into incident notes.",
      "Incident packet output must contain only scopes, IDs, hashes, counts, statuses, failure classes, timestamps, and operator actions.",
      "Replay decisions require separate approval after receiver verification and managed secret provider review."
    ],
    reviewSteps: [
      "Confirm the incident scope matches tenant, workspace, user, optional event type, and optional source-system filters.",
      "Confirm dry-run bounds are small enough for rehearsal and incident triage.",
      "Confirm managed secret provider audit logs show only approved runtime identity access.",
      "Confirm dashboards or manual summaries show whether retry queues are aging or exhausted.",
      "Record whether production workers remain paused, disabled, rate-limited, or ready for separate approved replay."
    ],
    releaseBoundary:
      "Incident drill packet foundation only; durable production workers, persistent retry queues, hosted dashboards, alert routing, managed secret provider proof, and completed production incident drills remain release blockers."
  };

  if (parsed.json) {
    io.stdout(JSON.stringify(packet, null, 2));
    return 0;
  }

  io.stdout(
    [
      "Public-event delivery incident drill packet.",
      `Incident: ${packet.incidentId}`,
      `Failure class: ${packet.suspectedFailureClass}`,
      `Scope: ${packet.scope.tenantId}/${packet.scope.workspaceId}/${packet.scope.userId}`,
      `As of: ${packet.asOf}`,
      `Pause workers first: ${packet.pauseWorkersFirst ? "yes" : "case-by-case"}`,
      "Apply allowed by packet: no",
      "Replay allowed by packet: no",
      `Bounded dry run: ${packet.boundedDryRunCommand.join(" ")}`
    ].join("\n")
  );
  return 0;
}

function runRetentionSqliteCleanupCommand(
  args: readonly string[],
  io: CliIO,
 options: CliOptions
): number {
  const parsed = parseRetentionSqliteCleanupArgs(args);
  if ("error" in parsed) {
    io.stderr(parsed.error);
    return 1;
  }

  const dryRun = !parsed.apply;
 const approval = requireDestructiveConfirmation(
 parsed.confirm,
 timedScopedConfirmation(parsed.scope, parsed.asOf),
 "retention cleanup apply"
 );
 if (!dryRun && !approval.approved) {
 io.stderr(approval.refusal);
 return 1;
 }

  const result = (options.sqliteRetentionCleanup ?? cleanupSqliteRetention)(
    parsed.databasePath,
    { kind: "system" },
    parsed.scope,
    parsed.asOf,
    { dryRun }
  );

  writeCommandResult(
    io,
 parsed.json,
 result,
 dryRun
 ? `SQLite retention cleanup dry run complete: ${approval.requiredConfirmation}`
 : `SQLite retention cleanup applied: ${approval.requiredConfirmation}`
 );
 return 0;
}

async function runRetentionPostgresCleanupCommand(
 args: readonly string[],
 io: CliIO,
 options: CliOptions
): Promise<number> {
 const parsed = parseRetentionPostgresCleanupArgs(args);
 if ("error" in parsed) {
  io.stderr(parsed.error);
  return 1;
 }

 const dryRun = !parsed.apply;
 const approval = requireDestructiveConfirmation(
 parsed.confirm,
 timedScopedConfirmation(parsed.scope, parsed.asOf),
 "retention cleanup apply"
 );
 if (!dryRun && !approval.approved) {
 io.stderr(approval.refusal);
 return 1;
 }

 const configuredClient = resolvePostgresClient(options);
 if (!configuredClient) {
  io.stderr("SCHEDULEOS_POSTGRES_URL is required unless a PostgreSQL client is injected.");
  return 1;
 }

 try {
  const result = await (options.postgresRetentionCleanup ?? cleanupPostgresRetention)(
   configuredClient.client,
   { kind: "system" },
   parsed.scope,
   parsed.asOf,
   { dryRun }
  );
  writeCommandResult(
   io,
 parsed.json,
 result,
 dryRun
 ? `PostgreSQL retention cleanup dry run complete: ${approval.requiredConfirmation}`
 : `PostgreSQL retention cleanup applied: ${approval.requiredConfirmation}`
 );
  return 0;
 } finally {
  if (configuredClient.closeAfterUse) {
   await configuredClient.client.end();
  }
 }
}

interface SqliteBackupCommand {
  databasePath: string;
  backupPath: string;
  encryptionPassphrase?: string;
  json: boolean;
}

interface SqliteRestoreCommand {
  backupPath: string;
  restorePath: string;
 scope: Scope;
 overwrite: boolean;
 confirm?: string;
 encryptionPassphrase?: string;
 json: boolean;
}

interface SqliteExportCommand {
  databasePath: string;
  scope: Scope;
  outputPath?: string;
}

interface SqliteDeleteWorkspaceCommand {
  databasePath: string;
  scope: Scope;
  confirm?: string;
  json: boolean;
}

interface RetentionPolicyCommand {
  asOf: Date;
  json: boolean;
}

interface RetentionOperatorPacketCommand {
  backend: "sqlite" | "postgres";
  databasePath?: string;
  scope: Scope;
  asOf: Date;
  json: boolean;
}

interface HostedRetentionCleanupPacketCommand {
environment: string;
scope: Scope;
asOf: Date;
windowStart: Date;
windowEnd: Date;
dryRunEvidence: string;
backupEvidence: string;
approvalRecord: string;
legalSupportReview: string;
rollbackPlan: string;
secondOperator: string;
json: boolean;
}

interface RetentionSqliteCleanupCommand {
 databasePath: string;
 scope: Scope;
 asOf: Date;
 apply: boolean;
 confirm?: string;
 json: boolean;
}

interface RetentionPostgresCleanupCommand {
 scope: Scope;
 asOf: Date;
 apply: boolean;
 confirm?: string;
 json: boolean;
}

function parseSqliteBackupArgs(
 args: readonly string[]
): SqliteBackupCommand | { error: string } {
 const values = parseNamedArgs(args, ["--database", "--backup"], ["--json"], [
  "--encrypt-key-env"
 ]);
 if ("error" in values) return values;
 const encryptionPassphrase = optionalSecretFromEnv(
  values.optional["--encrypt-key-env"],
  "--encrypt-key-env"
 );
 if ("error" in encryptionPassphrase) return encryptionPassphrase;
 return {
  databasePath: requiredParsedValue(values.required, "--database"),
  backupPath: requiredParsedValue(values.required, "--backup"),
  ...(encryptionPassphrase.value === undefined
   ? {}
   : { encryptionPassphrase: encryptionPassphrase.value }),
  json: values.flags.has("--json")
 };
}

function parseSqliteRestoreArgs(
  args: readonly string[]
): SqliteRestoreCommand | { error: string } {
 const values = parseNamedArgs(
  args,
  ["--backup", "--restore", "--tenant-id", "--workspace-id", "--user-id"],
  ["--overwrite", "--json"],
  ["--confirm", "--decrypt-key-env"]
 );
 if ("error" in values) return values;
 const encryptionPassphrase = optionalSecretFromEnv(
  values.optional["--decrypt-key-env"],
  "--decrypt-key-env"
 );
 if ("error" in encryptionPassphrase) return encryptionPassphrase;
 return {
  backupPath: requiredParsedValue(values.required, "--backup"),
  restorePath: requiredParsedValue(values.required, "--restore"),
  scope: scopeFromArgs(values.required),
  overwrite: values.flags.has("--overwrite"),
  ...(values.optional["--confirm"] === undefined
   ? {}
   : { confirm: values.optional["--confirm"] }),
  ...(encryptionPassphrase.value === undefined
   ? {}
   : { encryptionPassphrase: encryptionPassphrase.value }),
  json: values.flags.has("--json")
 };
}

function parseSqliteExportArgs(
  args: readonly string[]
): SqliteExportCommand | { error: string } {
  const values = parseNamedArgs(
    args,
    ["--database", "--tenant-id", "--workspace-id", "--user-id"],
    [],
    ["--output"]
  );
  if ("error" in values) return values;
  return {
    databasePath: requiredParsedValue(values.required, "--database"),
    scope: scopeFromArgs(values.required),
    ...(values.optional["--output"] === undefined
      ? {}
      : { outputPath: values.optional["--output"] })
  };
}

function parseSqliteDeleteWorkspaceArgs(
  args: readonly string[]
): SqliteDeleteWorkspaceCommand | { error: string } {
  const values = parseNamedArgs(
    args,
    ["--database", "--tenant-id", "--workspace-id", "--user-id"],
    ["--json"],
    ["--confirm"]
  );
  if ("error" in values) return values;
  return {
    databasePath: requiredParsedValue(values.required, "--database"),
    scope: scopeFromArgs(values.required),
    ...(values.optional["--confirm"] === undefined
      ? {}
      : { confirm: values.optional["--confirm"] }),
    json: values.flags.has("--json")
  };
}

function parseRetentionPolicyArgs(
  args: readonly string[]
): RetentionPolicyCommand | { error: string } {
  const values = parseNamedArgs(args, [], ["--json"], ["--as-of"]);
  if ("error" in values) return values;
  const asOfValue = values.optional["--as-of"];
  const asOf = asOfValue === undefined ? new Date() : new Date(asOfValue);
  if (Number.isNaN(asOf.getTime())) {
    return { error: "--as-of must be an ISO date/time" };
  }
  return { asOf, json: values.flags.has("--json") };
}

function parseRetentionOperatorPacketArgs(
  args: readonly string[]
): RetentionOperatorPacketCommand | { error: string } {
  const values = parseNamedArgs(
    args,
    ["--backend", "--tenant-id", "--workspace-id", "--user-id", "--as-of"],
    ["--json"],
    ["--database"]
  );
  if ("error" in values) return values;
  const backend = requiredParsedValue(values.required, "--backend");
  if (backend !== "sqlite" && backend !== "postgres") {
    return { error: "--backend must be sqlite or postgres" };
  }
const asOf = new Date(requiredParsedValue(values.required, "--as-of"));
  if (Number.isNaN(asOf.getTime())) {
    return { error: "--as-of must be an ISO date/time" };
  }
  const databasePath = values.optional["--database"];
  if (backend === "sqlite" && databasePath === undefined) {
    return { error: "--database required for sqlite retention packets" };
  }
  return {
    backend,
    ...(databasePath === undefined ? {} : { databasePath }),
    scope: scopeFromArgs(values.required),
    asOf,
    json: values.flags.has("--json")
  };
}

function parseHostedRetentionCleanupPacketArgs(
  args: readonly string[]
): HostedRetentionCleanupPacketCommand | { error: string } {
  const values = parseNamedArgs(
    args,
    [
      "--environment",
      "--tenant-id",
      "--workspace-id",
      "--user-id",
"--as-of",
"--window-start",
"--window-end",
"--dry-run-evidence",
"--backup-evidence",
"--approval-record",
"--legal-support-review",
"--rollback-plan",
"--second-operator"
    ],
    ["--json"],
    []
  );
  if ("error" in values) return values;
  const environment = requiredParsedValue(values.required, "--environment");
  if (environment.trim().length === 0 || /\s/.test(environment)) {
    return { error: "--environment must be non-empty without spaces" };
  }
  const asOf = new Date(requiredParsedValue(values.required, "--as-of"));
  if (Number.isNaN(asOf.getTime())) {
    return { error: "--as-of must be an ISO date/time" };
  }
  const windowStart = new Date(
    requiredParsedValue(values.required, "--window-start")
  );
  if (Number.isNaN(windowStart.getTime())) {
    return { error: "--window-start must be an ISO date/time" };
  }
  const windowEnd = new Date(requiredParsedValue(values.required, "--window-end"));
  if (Number.isNaN(windowEnd.getTime())) {
    return { error: "--window-end must be an ISO date/time" };
  }
if (windowEnd.getTime() <= windowStart.getTime()) {
return { error: "--window-end must be after --window-start" };
}
const dryRunEvidence = requiredParsedValue(values.required, "--dry-run-evidence");
if (dryRunEvidence.trim().length === 0) {
return { error: "--dry-run-evidence must be non-empty" };
}
const backupEvidence = requiredParsedValue(values.required, "--backup-evidence");
if (backupEvidence.trim().length === 0) {
return { error: "--backup-evidence must be non-empty" };
}
const approvalRecord = requiredParsedValue(values.required, "--approval-record");
if (approvalRecord.trim().length === 0) {
return { error: "--approval-record must be non-empty" };
}
const legalSupportReview = requiredParsedValue(values.required, "--legal-support-review");
if (legalSupportReview.trim().length === 0) {
return { error: "--legal-support-review must be non-empty" };
}
const rollbackPlan = requiredParsedValue(values.required, "--rollback-plan");
if (rollbackPlan.trim().length === 0) {
return { error: "--rollback-plan must be non-empty" };
}
const secondOperator = requiredParsedValue(values.required, "--second-operator");
if (secondOperator.trim().length === 0) {
return { error: "--second-operator must be non-empty" };
}
return {
environment,
scope: scopeFromArgs(values.required),
asOf,
windowStart,
windowEnd,
dryRunEvidence,
backupEvidence,
approvalRecord,
legalSupportReview,
rollbackPlan,
secondOperator,
json: values.flags.has("--json")
};
}

function parseDestructiveApprovalReadinessPacketArgs(
  args: readonly string[]
): DestructiveApprovalReadinessPacketCommand | { error: string } {
  const values = parseNamedArgs(
    args,
    [
      "--environment",
      "--operation",
      "--tenant-id",
      "--workspace-id",
      "--user-id",
      "--as-of",
      "--approval-policy",
      "--dry-run-diff",
      "--fresh-backup",
      "--restore-smoke",
      "--exact-confirmation",
      "--two-operator-approval",
      "--legal-support-approval",
      "--scope-proof",
      "--maintenance-window",
      "--rollback-procedure",
      "--audit-retention",
      "--hosted-scheduler-disablement",
      "--remote-ci"
    ],
    ["--json"],
    []
  );
  if ("error" in values) return values;
  const environment = requiredParsedValue(values.required, "--environment");
  if (environment.trim().length === 0 || /\s/.test(environment)) {
    return { error: "--environment must be non-empty without spaces" };
  }
  const destructiveOperation = requiredParsedValue(values.required, "--operation");
  if (destructiveOperation.trim().length === 0) {
    return { error: "--operation must be non-empty" };
  }
  const approvalPolicy = requiredParsedValue(values.required, "--approval-policy");
  if (approvalPolicy.trim().length === 0) {
    return { error: "--approval-policy must be non-empty" };
  }
  const dryRunDiff = requiredParsedValue(values.required, "--dry-run-diff");
  if (dryRunDiff.trim().length === 0) {
    return { error: "--dry-run-diff must be non-empty" };
  }
  const freshBackup = requiredParsedValue(values.required, "--fresh-backup");
  if (freshBackup.trim().length === 0) {
    return { error: "--fresh-backup must be non-empty" };
  }
  const restoreSmoke = requiredParsedValue(values.required, "--restore-smoke");
  if (restoreSmoke.trim().length === 0) {
    return { error: "--restore-smoke must be non-empty" };
  }
  const exactConfirmation = requiredParsedValue(values.required, "--exact-confirmation");
  if (exactConfirmation.trim().length === 0) {
    return { error: "--exact-confirmation must be non-empty" };
  }
  const twoOperatorApproval = requiredParsedValue(values.required, "--two-operator-approval");
  if (twoOperatorApproval.trim().length === 0) {
    return { error: "--two-operator-approval must be non-empty" };
  }
  const legalSupportApproval = requiredParsedValue(values.required, "--legal-support-approval");
  if (legalSupportApproval.trim().length === 0) {
    return { error: "--legal-support-approval must be non-empty" };
  }
  const scopeProof = requiredParsedValue(values.required, "--scope-proof");
  if (scopeProof.trim().length === 0) {
    return { error: "--scope-proof must be non-empty" };
  }
  const maintenanceWindow = requiredParsedValue(values.required, "--maintenance-window");
  if (maintenanceWindow.trim().length === 0) {
    return { error: "--maintenance-window must be non-empty" };
  }
  const rollbackProcedure = requiredParsedValue(values.required, "--rollback-procedure");
  if (rollbackProcedure.trim().length === 0) {
    return { error: "--rollback-procedure must be non-empty" };
  }
  const auditRetention = requiredParsedValue(values.required, "--audit-retention");
  if (auditRetention.trim().length === 0) {
    return { error: "--audit-retention must be non-empty" };
  }
  const hostedSchedulerDisablement = requiredParsedValue(
    values.required,
    "--hosted-scheduler-disablement"
  );
  if (hostedSchedulerDisablement.trim().length === 0) {
    return { error: "--hosted-scheduler-disablement must be non-empty" };
  }
  const remoteCi = requiredParsedValue(values.required, "--remote-ci");
  if (remoteCi.trim().length === 0) {
    return { error: "--remote-ci must be non-empty" };
  }
  const asOf = new Date(requiredParsedValue(values.required, "--as-of"));
  if (Number.isNaN(asOf.getTime())) {
    return { error: "--as-of must be an ISO date/time" };
  }
  return {
    environment,
    destructiveOperation,
    approvalPolicy,
    dryRunDiff,
    freshBackup,
    restoreSmoke,
    exactConfirmation,
    twoOperatorApproval,
    legalSupportApproval,
    scopeProof,
    maintenanceWindow,
    rollbackProcedure,
    auditRetention,
    hostedSchedulerDisablement,
    remoteCi,
    scope: scopeFromArgs(values.required),
    asOf,
    json: values.flags.has("--json")
  };
}

function parseAuthProductionReadinessPacketArgs(
  args: readonly string[]
): AuthProductionReadinessPacketCommand | { error: string } {
  const values = parseNamedArgs(
    args,
    [
      "--environment",
      "--backend",
      "--tenant-id",
      "--workspace-id",
      "--user-id",
      "--as-of",
      "--identity-provider",
      "--session-store",
      "--authorization-matrix",
      "--role-membership-proof",
      "--session-lifecycle",
      "--reset-token-lifecycle",
      "--lockout-pruning",
      "--cookie-transport",
      "--startup-guard",
      "--migration-plan",
      "--rollback-drill",
      "--remote-ci",
      "--rollback-plan",
      "--second-operator"
    ],
    ["--json"],
    []
  );
  if ("error" in values) return values;
  const environment = requiredParsedValue(values.required, "--environment");
  if (environment.trim().length === 0 || /\s/.test(environment)) {
    return { error: "--environment must be non-empty without spaces" };
  }
  const backend = requiredParsedValue(values.required, "--backend");
  if (backend !== "sqlite" && backend !== "postgres") {
    return { error: "--backend must be sqlite or postgres" };
  }
  const identityProvider = requiredParsedValue(values.required, "--identity-provider");
  if (identityProvider.trim().length === 0) {
    return { error: "--identity-provider must be non-empty" };
  }
  const sessionStore = requiredParsedValue(values.required, "--session-store");
  if (sessionStore.trim().length === 0) {
    return { error: "--session-store must be non-empty" };
  }
  const authorizationMatrix = requiredParsedValue(values.required, "--authorization-matrix");
  if (authorizationMatrix.trim().length === 0) {
    return { error: "--authorization-matrix must be non-empty" };
  }
  const roleMembershipProof = requiredParsedValue(values.required, "--role-membership-proof");
  if (roleMembershipProof.trim().length === 0) {
    return { error: "--role-membership-proof must be non-empty" };
  }
  const sessionLifecycle = requiredParsedValue(values.required, "--session-lifecycle");
  if (sessionLifecycle.trim().length === 0) {
    return { error: "--session-lifecycle must be non-empty" };
  }
  const resetTokenLifecycle = requiredParsedValue(values.required, "--reset-token-lifecycle");
  if (resetTokenLifecycle.trim().length === 0) {
    return { error: "--reset-token-lifecycle must be non-empty" };
  }
  const lockoutPruning = requiredParsedValue(values.required, "--lockout-pruning");
  if (lockoutPruning.trim().length === 0) {
    return { error: "--lockout-pruning must be non-empty" };
  }
  const cookieTransport = requiredParsedValue(values.required, "--cookie-transport");
  if (cookieTransport.trim().length === 0) {
    return { error: "--cookie-transport must be non-empty" };
  }
  const startupGuard = requiredParsedValue(values.required, "--startup-guard");
  if (startupGuard.trim().length === 0) {
    return { error: "--startup-guard must be non-empty" };
  }
  const migrationPlan = requiredParsedValue(values.required, "--migration-plan");
  if (migrationPlan.trim().length === 0) {
    return { error: "--migration-plan must be non-empty" };
  }
  const rollbackDrill = requiredParsedValue(values.required, "--rollback-drill");
  if (rollbackDrill.trim().length === 0) {
    return { error: "--rollback-drill must be non-empty" };
  }
const remoteCi = requiredParsedValue(values.required, "--remote-ci");
  if (remoteCi.trim().length === 0) {
    return { error: "--remote-ci must be non-empty" };
  }
  const rollbackPlan = requiredParsedValue(values.required, "--rollback-plan");
  if (rollbackPlan.trim().length === 0) {
    return { error: "--rollback-plan must be non-empty" };
  }
  const secondOperator = requiredParsedValue(values.required, "--second-operator");
  if (secondOperator.trim().length === 0) {
    return { error: "--second-operator must be non-empty" };
  }
  const asOf = new Date(requiredParsedValue(values.required, "--as-of"));
  if (Number.isNaN(asOf.getTime())) {
    return { error: "--as-of must be an ISO date/time" };
  }
  return {
    environment,
    backend,
    scope: scopeFromArgs(values.required),
    asOf,
    json: values.flags.has("--json"),
    identityProvider,
    sessionStore,
    authorizationMatrix,
    roleMembershipProof,
    sessionLifecycle,
    resetTokenLifecycle,
    lockoutPruning,
    cookieTransport,
    startupGuard,
    migrationPlan,
    rollbackDrill,
    remoteCi,
    rollbackPlan,
    secondOperator
  };
}

function parseAuthAuthorizationMatrixPacketArgs(
  args: readonly string[]
): AuthAuthorizationMatrixPacketCommand | { error: string } {
  const values = parseNamedArgs(
    args,
    [
      "--matrix",
      "--environment",
      "--backend",
      "--tenant-id",
      "--workspace-id",
      "--user-id",
 "--as-of"
    ],
    ["--json"],
    []
  );
  if ("error" in values) return values;
  const matrix = requiredParsedValue(values.required, "--matrix");
  if (matrix.trim().length === 0) {
    return { error: "--matrix must be non-empty" };
  }
  const environment = requiredParsedValue(values.required, "--environment");
  if (environment.trim().length === 0 || /\s/.test(environment)) {
    return { error: "--environment must be non-empty without spaces" };
  }
  const backend = requiredParsedValue(values.required, "--backend");
  if (backend !== "sqlite" && backend !== "postgres") {
    return { error: "--backend must be sqlite or postgres" };
  }
  const asOf = new Date(requiredParsedValue(values.required, "--as-of"));
  if (Number.isNaN(asOf.getTime())) {
    return { error: "--as-of must be an ISO date/time" };
  }
  return {
    matrix,
    environment,
    backend,
    scope: scopeFromArgs(values.required),
    asOf,
    json: values.flags.has("--json")
  };
}

function parseRateLimitProductionReadinessPacketArgs(
  args: readonly string[]
): RateLimitProductionReadinessPacketCommand | { error: string } {
  const values = parseNamedArgs(
    args,
    [
      "--environment",
      "--tenant-id",
      "--workspace-id",
      "--user-id",
      "--as-of",
      "--edge-layer",
      "--store",
      "--provider-quota-policy",
      "--trusted-proxy-proof",
      "--hosted-alert-routing",
      "--hosted-dashboard",
      "--abuse-analytics",
      "--remote-ci",
      "--rollback-plan",
      "--second-operator"
    ],
    ["--json"],
    []
  );
  if ("error" in values) return values;
  const environment = requiredParsedValue(values.required, "--environment");
  if (environment.trim().length === 0 || /\s/.test(environment)) {
    return { error: "--environment must be non-empty without spaces" };
  }
  const asOf = new Date(requiredParsedValue(values.required, "--as-of"));
  if (Number.isNaN(asOf.getTime())) {
    return { error: "--as-of must be an ISO date/time" };
  }
  const edgeLayer = requiredParsedValue(values.required, "--edge-layer");
  if (edgeLayer.trim().length === 0) {
    return { error: "--edge-layer must be non-empty" };
  }
  const distributedStore = requiredParsedValue(values.required, "--store");
  if (distributedStore.trim().length === 0) {
    return { error: "--store must be non-empty" };
  }
  const providerQuotaPolicy = requiredParsedValue(values.required, "--provider-quota-policy");
  if (providerQuotaPolicy.trim().length === 0) {
    return { error: "--provider-quota-policy must be non-empty" };
  }
  const trustedProxyProof = requiredParsedValue(values.required, "--trusted-proxy-proof");
  if (trustedProxyProof.trim().length === 0) {
    return { error: "--trusted-proxy-proof must be non-empty" };
  }
  const hostedAlertRouting = requiredParsedValue(values.required, "--hosted-alert-routing");
  if (hostedAlertRouting.trim().length === 0) {
    return { error: "--hosted-alert-routing must be non-empty" };
  }
  const hostedDashboard = requiredParsedValue(values.required, "--hosted-dashboard");
  if (hostedDashboard.trim().length === 0) {
    return { error: "--hosted-dashboard must be non-empty" };
  }
  const abuseAnalytics = requiredParsedValue(values.required, "--abuse-analytics");
  if (abuseAnalytics.trim().length === 0) {
    return { error: "--abuse-analytics must be non-empty" };
  }
  const remoteCi = requiredParsedValue(values.required, "--remote-ci");
  if (remoteCi.trim().length === 0) {
    return { error: "--remote-ci must be non-empty" };
  }
  const rollbackPlan = requiredParsedValue(values.required, "--rollback-plan");
  if (rollbackPlan.trim().length === 0) {
    return { error: "--rollback-plan must be non-empty" };
  }
  const secondOperator = requiredParsedValue(values.required, "--second-operator");
  if (secondOperator.trim().length === 0) {
    return { error: "--second-operator must be non-empty" };
  }
  return {
    environment,
    scope: scopeFromArgs(values.required),
    asOf,
    edgeLayer,
    distributedStore,
    providerQuotaPolicy,
    trustedProxyProof,
    hostedAlertRouting,
    hostedDashboard,
    abuseAnalytics,
    remoteCi,
    rollbackPlan,
    secondOperator,
    json: values.flags.has("--json")
  };
}

function parseProviderLifecycleReadinessPacketArgs(
  args: readonly string[]
): ProviderLifecycleReadinessPacketCommand | { error: string } {
  const values = parseNamedArgs(
    args,
    [
      "--environment",
      "--provider",
      "--tenant-id",
      "--workspace-id",
      "--user-id",
      "--as-of",
      "--managed-secret-custody",
      "--rotation-drill",
      "--revocation-drill",
      "--write-back-safety",
      "--hosted-alert-routing",
      "--provider-runbook",
      "--remote-ci",
      "--rollback-plan",
      "--second-operator"
    ],
    ["--json"],
    []
  );
  if ("error" in values) return values;

  const environment = requiredParsedValue(values.required, "--environment");
  if (environment.trim().length === 0 || /\s/.test(environment)) {
    return { error: "--environment must be non-empty without spaces" };
  }

  const provider = requiredParsedValue(values.required, "--provider");
  if (provider.trim().length === 0) {
    return { error: "--provider must be non-empty" };
  }

  const managedSecretCustody = requiredParsedValue(values.required, "--managed-secret-custody");
  if (managedSecretCustody.trim().length === 0) {
    return { error: "--managed-secret-custody must be non-empty" };
  }

  const rotationDrill = requiredParsedValue(values.required, "--rotation-drill");
  if (rotationDrill.trim().length === 0) {
    return { error: "--rotation-drill must be non-empty" };
  }

  const revocationDrill = requiredParsedValue(values.required, "--revocation-drill");
  if (revocationDrill.trim().length === 0) {
    return { error: "--revocation-drill must be non-empty" };
  }

  const writeBackSafety = requiredParsedValue(values.required, "--write-back-safety");
  if (writeBackSafety.trim().length === 0) {
    return { error: "--write-back-safety must be non-empty" };
  }

  const hostedAlertRouting = requiredParsedValue(values.required, "--hosted-alert-routing");
  if (hostedAlertRouting.trim().length === 0) {
    return { error: "--hosted-alert-routing must be non-empty" };
  }

const providerRunbook = requiredParsedValue(values.required, "--provider-runbook");
if (providerRunbook.trim().length === 0) {
return { error: "--provider-runbook must be non-empty" };
}
const remoteCi = requiredParsedValue(values.required, "--remote-ci");
if (remoteCi.trim().length === 0) {
return { error: "--remote-ci must be non-empty" };
}
  const rollbackPlan = requiredParsedValue(values.required, "--rollback-plan");
  if (rollbackPlan.trim().length === 0) {
    return { error: "--rollback-plan must be non-empty" };
  }
  const secondOperator = requiredParsedValue(values.required, "--second-operator");
  if (secondOperator.trim().length === 0) {
    return { error: "--second-operator must be non-empty" };
  }

  const asOf = new Date(requiredParsedValue(values.required, "--as-of"));
  if (Number.isNaN(asOf.getTime())) {
    return { error: "--as-of must be an ISO date/time" };
  }

  return {
    environment,
    provider,
    scope: scopeFromArgs(values.required),
    asOf,
 managedSecretCustody,
 rotationDrill,
 revocationDrill,
 writeBackSafety,
 hostedAlertRouting,
    providerRunbook,
    remoteCi,
    rollbackPlan,
    secondOperator,
    json: values.flags.has("--json")
  };
}
function parseCalendarUiProductionReadinessPacketArgs(
  args: readonly string[]
): CalendarUiProductionReadinessPacketCommand | { error: string } {
  const values = parseNamedArgs(
    args,
    [
      "--environment",
      "--tenant-id",
      "--workspace-id",
      "--user-id",
      "--as-of",
      "--browser-matrix",
      "--conflict-workflow",
      "--write-back-acknowledgement",
      "--accessibility-audit",
      "--responsive-polish",
      "--visual-regression",
 "--product-owner-approval",
 "--remote-ci",
"--rollback-plan",
"--second-operator"
    ],
    ["--json"],
    []
  );
  if ("error" in values) return values;

  const environment = requiredParsedValue(values.required, "--environment");
  if (environment.trim().length === 0 || /\s/.test(environment)) {
    return { error: "--environment must be non-empty without spaces" };
  }

  const browserMatrix = requiredParsedValue(values.required, "--browser-matrix");
  if (browserMatrix.trim().length === 0) {
    return { error: "--browser-matrix must be non-empty" };
  }

  const conflictWorkflow = requiredParsedValue(values.required, "--conflict-workflow");
  if (conflictWorkflow.trim().length === 0) {
    return { error: "--conflict-workflow must be non-empty" };
  }

  const writeBackAcknowledgement = requiredParsedValue(values.required, "--write-back-acknowledgement");
  if (writeBackAcknowledgement.trim().length === 0) {
    return { error: "--write-back-acknowledgement must be non-empty" };
  }

  const accessibilityAudit = requiredParsedValue(values.required, "--accessibility-audit");
  if (accessibilityAudit.trim().length === 0) {
    return { error: "--accessibility-audit must be non-empty" };
  }

  const responsivePolish = requiredParsedValue(values.required, "--responsive-polish");
  if (responsivePolish.trim().length === 0) {
    return { error: "--responsive-polish must be non-empty" };
  }

  const visualRegression = requiredParsedValue(values.required, "--visual-regression");
  if (visualRegression.trim().length === 0) {
    return { error: "--visual-regression must be non-empty" };
  }

const productOwnerApproval = requiredParsedValue(values.required, "--product-owner-approval");
if (productOwnerApproval.trim().length === 0) {
return { error: "--product-owner-approval must be non-empty" };
}
const remoteCi = requiredParsedValue(values.required, "--remote-ci");
if (remoteCi.trim().length === 0) {
return { error: "--remote-ci must be non-empty" };
}
const rollbackPlan = requiredParsedValue(values.required, "--rollback-plan");
if (rollbackPlan.trim().length === 0) {
return { error: "--rollback-plan must be non-empty" };
}
const secondOperator = requiredParsedValue(values.required, "--second-operator");
if (secondOperator.trim().length === 0) {
return { error: "--second-operator must be non-empty" };
}

const asOf = new Date(requiredParsedValue(values.required, "--as-of"));
  if (Number.isNaN(asOf.getTime())) {
    return { error: "--as-of must be an ISO date/time" };
  }

  return {
    environment,
    browserMatrix,
    conflictWorkflow,
    writeBackAcknowledgement,
    accessibilityAudit,
 responsivePolish,
 visualRegression,
 productOwnerApproval,
	 remoteCi,
	 rollbackPlan,
	 secondOperator,
	 scope: scopeFromArgs(values.required),
    asOf,
    json: values.flags.has("--json")
  };
}
function parseWebAppProductionReadinessPacketArgs(
  args: readonly string[]
): WebAppProductionReadinessPacketCommand | { error: string } {
  const values = parseNamedArgs(
    args,
    [
      "--environment",
      "--tenant-id",
      "--workspace-id",
      "--user-id",
      "--as-of",
      "--deployment-target",
      "--production-build",
      "--authenticated-write-flow",
      "--security-headers",
      "--csrf-cookie-transport",
      "--throttle-policy",
      "--durable-storage",
      "--cache-policy",
      "--health-startup-guard",
      "--browser-matrix",
      "--accessibility-audit",
"--responsive-polish",
"--visual-regression",
"--operator-review",
"--remote-ci",
"--rollback-plan",
"--second-operator"
    ],
    ["--json"],
    []
  );
  if ("error" in values) return values;

  const environment = requiredParsedValue(values.required, "--environment");
  if (environment.trim().length === 0 || /\s/.test(environment)) {
    return { error: "--environment must be non-empty without spaces" };
  }

  const deploymentTarget = requiredParsedValue(values.required, "--deployment-target");
  if (deploymentTarget.trim().length === 0) {
    return { error: "--deployment-target must be non-empty" };
  }

  const productionBuild = requiredParsedValue(values.required, "--production-build");
  if (productionBuild.trim().length === 0) {
    return { error: "--production-build must be non-empty" };
  }

  const authenticatedWriteFlow = requiredParsedValue(values.required, "--authenticated-write-flow");
  if (authenticatedWriteFlow.trim().length === 0) {
    return { error: "--authenticated-write-flow must be non-empty" };
  }

  const securityHeaders = requiredParsedValue(values.required, "--security-headers");
  if (securityHeaders.trim().length === 0) {
    return { error: "--security-headers must be non-empty" };
  }

  const csrfCookieTransport = requiredParsedValue(values.required, "--csrf-cookie-transport");
  if (csrfCookieTransport.trim().length === 0) {
    return { error: "--csrf-cookie-transport must be non-empty" };
  }

  const throttlePolicy = requiredParsedValue(values.required, "--throttle-policy");
  if (throttlePolicy.trim().length === 0) {
    return { error: "--throttle-policy must be non-empty" };
  }

  const durableStorage = requiredParsedValue(values.required, "--durable-storage");
  if (durableStorage.trim().length === 0) {
    return { error: "--durable-storage must be non-empty" };
  }

  const cachePolicy = requiredParsedValue(values.required, "--cache-policy");
  if (cachePolicy.trim().length === 0) {
    return { error: "--cache-policy must be non-empty" };
  }

  const healthStartupGuard = requiredParsedValue(values.required, "--health-startup-guard");
  if (healthStartupGuard.trim().length === 0) {
    return { error: "--health-startup-guard must be non-empty" };
  }

  const browserMatrix = requiredParsedValue(values.required, "--browser-matrix");
  if (browserMatrix.trim().length === 0) {
    return { error: "--browser-matrix must be non-empty" };
  }

  const accessibilityAudit = requiredParsedValue(values.required, "--accessibility-audit");
if (accessibilityAudit.trim().length === 0) {
return { error: "--accessibility-audit must be non-empty" };
}
const responsivePolish = requiredParsedValue(values.required, "--responsive-polish");
if (responsivePolish.trim().length === 0) {
return { error: "--responsive-polish must be non-empty" };
}
const visualRegression = requiredParsedValue(values.required, "--visual-regression");
if (visualRegression.trim().length === 0) {
return { error: "--visual-regression must be non-empty" };
}
const operatorReview = requiredParsedValue(values.required, "--operator-review");
if (operatorReview.trim().length === 0) {
return { error: "--operator-review must be non-empty" };
}
const remoteCi = requiredParsedValue(values.required, "--remote-ci");
  if (remoteCi.trim().length === 0) {
    return { error: "--remote-ci must be non-empty" };
  }

  const rollbackPlan = requiredParsedValue(values.required, "--rollback-plan");
if (rollbackPlan.trim().length === 0) {
return { error: "--rollback-plan must be non-empty" };
}
const secondOperator = requiredParsedValue(values.required, "--second-operator");
if (secondOperator.trim().length === 0) {
return { error: "--second-operator must be non-empty" };
}
const asOf = new Date(requiredParsedValue(values.required, "--as-of"));
  if (Number.isNaN(asOf.getTime())) {
    return { error: "--as-of must be an ISO date/time" };
  }

  return {
    environment,
    deploymentTarget,
    productionBuild,
    authenticatedWriteFlow,
    securityHeaders,
    csrfCookieTransport,
    throttlePolicy,
    durableStorage,
    cachePolicy,
    healthStartupGuard,
    browserMatrix,
responsivePolish,
visualRegression,
operatorReview,
accessibilityAudit,
	remoteCi,
	rollbackPlan,
	secondOperator,
    scope: scopeFromArgs(values.required),
    asOf,
    json: values.flags.has("--json")
  };
}
function parseProductionDeploymentReadinessPacketArgs(
args: readonly string[]
): ProductionDeploymentReadinessPacketCommand | { error: string } {
const values = parseNamedArgs(
args,
[
"--environment",
"--tenant-id",
"--workspace-id",
"--user-id",
"--as-of",
"--deployment-topology",
"--tls-termination",
"--reverse-proxy-headers",
"--security-headers",
"--startup-guards",
"--health-checks",
"--durable-storage",
"--cookie-csrf-transport",
"--trusted-proxy-throttle",
"--static-asset-cache",
"--log-redaction",
"--backup-rollback",
"--remote-ci-deployment-smoke",
"--operator-review",
"--second-operator"
],
["--json"],
[]
);
if ("error" in values) return values;
const environment = requiredParsedValue(values.required, "--environment");
if (environment.trim().length === 0 || /\s/.test(environment)) {
return { error: "--environment must be non-empty without spaces" };
}
const deploymentTopology = requiredParsedValue(values.required, "--deployment-topology");
if (deploymentTopology.trim().length === 0) {
return { error: "--deployment-topology must be non-empty" };
}
const tlsTermination = requiredParsedValue(values.required, "--tls-termination");
if (tlsTermination.trim().length === 0) {
return { error: "--tls-termination must be non-empty" };
}
const reverseProxyHeaders = requiredParsedValue(values.required, "--reverse-proxy-headers");
if (reverseProxyHeaders.trim().length === 0) {
return { error: "--reverse-proxy-headers must be non-empty" };
}
const securityHeaders = requiredParsedValue(values.required, "--security-headers");
if (securityHeaders.trim().length === 0) {
return { error: "--security-headers must be non-empty" };
}
const startupGuards = requiredParsedValue(values.required, "--startup-guards");
if (startupGuards.trim().length === 0) {
return { error: "--startup-guards must be non-empty" };
}
const healthChecks = requiredParsedValue(values.required, "--health-checks");
if (healthChecks.trim().length === 0) {
return { error: "--health-checks must be non-empty" };
}
const durableStorage = requiredParsedValue(values.required, "--durable-storage");
if (durableStorage.trim().length === 0) {
return { error: "--durable-storage must be non-empty" };
}
const cookieCsrfTransport = requiredParsedValue(values.required, "--cookie-csrf-transport");
if (cookieCsrfTransport.trim().length === 0) {
return { error: "--cookie-csrf-transport must be non-empty" };
}
const trustedProxyThrottle = requiredParsedValue(values.required, "--trusted-proxy-throttle");
if (trustedProxyThrottle.trim().length === 0) {
return { error: "--trusted-proxy-throttle must be non-empty" };
}
const staticAssetCache = requiredParsedValue(values.required, "--static-asset-cache");
if (staticAssetCache.trim().length === 0) {
return { error: "--static-asset-cache must be non-empty" };
}
const logRedaction = requiredParsedValue(values.required, "--log-redaction");
if (logRedaction.trim().length === 0) {
return { error: "--log-redaction must be non-empty" };
}
const backupRollback = requiredParsedValue(values.required, "--backup-rollback");
if (backupRollback.trim().length === 0) {
return { error: "--backup-rollback must be non-empty" };
}
const remoteCiDeploymentSmoke = requiredParsedValue(values.required, "--remote-ci-deployment-smoke");
if (remoteCiDeploymentSmoke.trim().length === 0) {
return { error: "--remote-ci-deployment-smoke must be non-empty" };
}
const operatorReview = requiredParsedValue(values.required, "--operator-review");
if (operatorReview.trim().length === 0) {
return { error: "--operator-review must be non-empty" };
}
const secondOperator = requiredParsedValue(values.required, "--second-operator");
if (secondOperator.trim().length === 0) {
return { error: "--second-operator must be non-empty" };
}
const asOf = new Date(requiredParsedValue(values.required, "--as-of"));
if (Number.isNaN(asOf.getTime())) {
return { error: "--as-of must be an ISO date/time" };
}
return {
environment,
deploymentTopology,
tlsTermination,
reverseProxyHeaders,
securityHeaders,
startupGuards,
healthChecks,
durableStorage,
cookieCsrfTransport,
trustedProxyThrottle,
staticAssetCache,
logRedaction,
backupRollback,
remoteCiDeploymentSmoke,
operatorReview,
secondOperator,
scope: scopeFromArgs(values.required),
asOf,
json: values.flags.has("--json")
};
}

function parseIcsProductionReadinessPacketArgs(
  args: readonly string[]
): IcsProductionReadinessPacketCommand | { error: string } {
  const values = parseNamedArgs(
    args,
    [
      "--environment",
      "--tenant-id",
      "--workspace-id",
      "--user-id",
      "--as-of",
      "--recurrence-suite",
      "--timezone-dst-proof",
      "--sync-idempotency",
      "--import-preview-ux",
      "--export-privacy-redaction",
      "--write-back-conflict-preview",
      "--provider-neutral-contract",
      "--provider-fixture-suite",
      "--large-calendar-fixture",
      "--browser-workflow",
      "--remote-ci",
      "--rollback-plan",
      "--second-operator"
    ],
    ["--json"],
    []
  );
  if ("error" in values) return values;
  const environment = requiredParsedValue(values.required, "--environment");
  if (environment.trim().length === 0 || /\s/.test(environment)) {
    return { error: "--environment must be non-empty without spaces" };
  }
  const recurrenceSuite = requiredParsedValue(values.required, "--recurrence-suite");
  if (recurrenceSuite.trim().length === 0) {
    return { error: "--recurrence-suite must be non-empty" };
  }
  const timezoneDstProof = requiredParsedValue(values.required, "--timezone-dst-proof");
  if (timezoneDstProof.trim().length === 0) {
    return { error: "--timezone-dst-proof must be non-empty" };
  }
  const syncIdempotencyProof = requiredParsedValue(values.required, "--sync-idempotency");
  if (syncIdempotencyProof.trim().length === 0) {
    return { error: "--sync-idempotency must be non-empty" };
  }
  const importPreviewUx = requiredParsedValue(values.required, "--import-preview-ux");
  if (importPreviewUx.trim().length === 0) {
    return { error: "--import-preview-ux must be non-empty" };
  }
  const exportPrivacyRedaction = requiredParsedValue(values.required, "--export-privacy-redaction");
  if (exportPrivacyRedaction.trim().length === 0) {
    return { error: "--export-privacy-redaction must be non-empty" };
  }
  const writeBackConflictPreview = requiredParsedValue(values.required, "--write-back-conflict-preview");
  if (writeBackConflictPreview.trim().length === 0) {
    return { error: "--write-back-conflict-preview must be non-empty" };
  }
  const providerNeutralContract = requiredParsedValue(values.required, "--provider-neutral-contract");
  if (providerNeutralContract.trim().length === 0) {
    return { error: "--provider-neutral-contract must be non-empty" };
  }
  const providerFixtureSuite = requiredParsedValue(values.required, "--provider-fixture-suite");
  if (providerFixtureSuite.trim().length === 0) {
    return { error: "--provider-fixture-suite must be non-empty" };
  }
  const largeCalendarFixture = requiredParsedValue(values.required, "--large-calendar-fixture");
  if (largeCalendarFixture.trim().length === 0) {
    return { error: "--large-calendar-fixture must be non-empty" };
  }
  const browserWorkflow = requiredParsedValue(values.required, "--browser-workflow");
  if (browserWorkflow.trim().length === 0) {
    return { error: "--browser-workflow must be non-empty" };
  }
  const remoteCi = requiredParsedValue(values.required, "--remote-ci");
  if (remoteCi.trim().length === 0) {
    return { error: "--remote-ci must be non-empty" };
  }
  const rollbackPlan = requiredParsedValue(values.required, "--rollback-plan");
  if (rollbackPlan.trim().length === 0) {
    return { error: "--rollback-plan must be non-empty" };
  }
  const secondOperator = requiredParsedValue(values.required, "--second-operator");
  if (secondOperator.trim().length === 0) {
    return { error: "--second-operator must be non-empty" };
  }
  const asOf = new Date(requiredParsedValue(values.required, "--as-of"));
  if (Number.isNaN(asOf.getTime())) {
    return { error: "--as-of must be an ISO date/time" };
  }
  return {
    environment,
    recurrenceSuite,
    timezoneDstProof,
    syncIdempotencyProof,
    importPreviewUx,
    exportPrivacyRedaction,
    writeBackConflictPreview,
    providerNeutralContract,
    providerFixtureSuite,
    largeCalendarFixture,
    browserWorkflow,
    remoteCi,
    rollbackPlan,
    secondOperator,
    scope: scopeFromArgs(values.required),
    asOf,
    json: values.flags.has("--json")
  };
}

function parseProviderCsvProductionReadinessPacketArgs(
  args: readonly string[]
): ProviderCsvProductionReadinessPacketCommand | { error: string } {
  const values = parseNamedArgs(
    args,
    [
      "--environment",
      "--tenant-id",
      "--workspace-id",
      "--user-id",
      "--as-of",
      "--fixture-suite",
      "--download-upload-workflow",
      "--confirmation-ux",
      "--provider-policy",
      "--browser-workflow",
      "--abuse-analytics",
      "--large-fixture-suite",
      "--formula-injection-regression",
      "--field-mapping-privacy",
      "--remote-ci",
"--rollback-plan",
"--second-operator"
    ],
    ["--json"],
    []
  );
  if ("error" in values) return values;
  const environment = requiredParsedValue(values.required, "--environment");
  if (environment.trim().length === 0 || /\s/.test(environment)) {
    return { error: "--environment must be non-empty without spaces" };
  }
  const fixtureSuite = requiredParsedValue(values.required, "--fixture-suite");
  if (fixtureSuite.trim().length === 0) {
    return { error: "--fixture-suite must be non-empty" };
  }
  const downloadUploadWorkflow = requiredParsedValue(values.required, "--download-upload-workflow");
  if (downloadUploadWorkflow.trim().length === 0) {
    return { error: "--download-upload-workflow must be non-empty" };
  }
  const confirmationUx = requiredParsedValue(values.required, "--confirmation-ux");
  if (confirmationUx.trim().length === 0) {
    return { error: "--confirmation-ux must be non-empty" };
  }
  const providerPolicy = requiredParsedValue(values.required, "--provider-policy");
  if (providerPolicy.trim().length === 0) {
    return { error: "--provider-policy must be non-empty" };
  }
  const browserWorkflow = requiredParsedValue(values.required, "--browser-workflow");
  if (browserWorkflow.trim().length === 0) {
    return { error: "--browser-workflow must be non-empty" };
  }
  const abuseAnalytics = requiredParsedValue(values.required, "--abuse-analytics");
  if (abuseAnalytics.trim().length === 0) {
    return { error: "--abuse-analytics must be non-empty" };
  }
  const largeFixtureSuite = requiredParsedValue(values.required, "--large-fixture-suite");
  if (largeFixtureSuite.trim().length === 0) {
    return { error: "--large-fixture-suite must be non-empty" };
  }
  const formulaInjectionRegression = requiredParsedValue(values.required, "--formula-injection-regression");
  if (formulaInjectionRegression.trim().length === 0) {
    return { error: "--formula-injection-regression must be non-empty" };
  }
  const fieldMappingPrivacy = requiredParsedValue(values.required, "--field-mapping-privacy");
  if (fieldMappingPrivacy.trim().length === 0) {
    return { error: "--field-mapping-privacy must be non-empty" };
  }
  const remoteCi = requiredParsedValue(values.required, "--remote-ci");
  if (remoteCi.trim().length === 0) {
    return { error: "--remote-ci must be non-empty" };
  }
  const rollbackPlan = requiredParsedValue(values.required, "--rollback-plan");
  if (rollbackPlan.trim().length === 0) {
    return { error: "--rollback-plan must be non-empty" };
  }
  const secondOperator = requiredParsedValue(values.required, "--second-operator");
if (secondOperator.trim().length === 0) {
return { error: "--second-operator must be non-empty" };
}
const asOf = new Date(requiredParsedValue(values.required, "--as-of"));
  if (Number.isNaN(asOf.getTime())) {
    return { error: "--as-of must be an ISO date/time" };
  }
  return {
    environment,
    fixtureSuite,
    downloadUploadWorkflow,
    confirmationUx,
    providerPolicy,
    browserWorkflow,
    abuseAnalytics,
    largeFixtureSuite,
    formulaInjectionRegression,
    fieldMappingPrivacy,
    remoteCi,
rollbackPlan,
secondOperator,
    scope: scopeFromArgs(values.required),
    asOf,
    json: values.flags.has("--json")
  };
}

function parsePublicEventsHostedDeliveryReadinessPacketArgs(
  args: readonly string[]
): PublicEventsHostedDeliveryReadinessPacketCommand | { error: string } {
  const values = parseNamedArgs(
    args,
    [
      "--environment",
      "--tenant-id",
      "--workspace-id",
      "--user-id",
      "--as-of",
      "--secret-provider",
      "--runtime-identity",
      "--rotation-drill",
      "--worker-topology",
      "--retry-queue",
      "--dead-letter-queue",
      "--hosted-dashboard",
      "--alert-routing",
      "--replay-boundary",
      "--rate-limit-header-key",
      "--incident-drill",
      "--remote-ci",
"--rollback-plan",
"--second-operator"
    ],
    ["--json"],
    []
  );
  if ("error" in values) return values;
  const environment = requiredParsedValue(values.required, "--environment");
  if (environment.trim().length === 0 || /\s/.test(environment)) {
    return { error: "--environment must be non-empty without spaces" };
  }
  const secretProvider = requiredParsedValue(values.required, "--secret-provider");
  if (secretProvider.trim().length === 0) {
    return { error: "--secret-provider must be non-empty" };
  }
  const runtimeIdentity = requiredParsedValue(values.required, "--runtime-identity");
  if (runtimeIdentity.trim().length === 0) {
    return { error: "--runtime-identity must be non-empty" };
  }
  const rotationDrill = requiredParsedValue(values.required, "--rotation-drill");
  if (rotationDrill.trim().length === 0) {
    return { error: "--rotation-drill must be non-empty" };
  }
  const workerTopology = requiredParsedValue(values.required, "--worker-topology");
  if (workerTopology.trim().length === 0) {
    return { error: "--worker-topology must be non-empty" };
  }
  const retryQueue = requiredParsedValue(values.required, "--retry-queue");
  if (retryQueue.trim().length === 0) {
    return { error: "--retry-queue must be non-empty" };
  }
  const deadLetterQueue = requiredParsedValue(values.required, "--dead-letter-queue");
  if (deadLetterQueue.trim().length === 0) {
    return { error: "--dead-letter-queue must be non-empty" };
  }
  const hostedDashboard = requiredParsedValue(values.required, "--hosted-dashboard");
  if (hostedDashboard.trim().length === 0) {
    return { error: "--hosted-dashboard must be non-empty" };
  }
  const alertRouting = requiredParsedValue(values.required, "--alert-routing");
  if (alertRouting.trim().length === 0) {
    return { error: "--alert-routing must be non-empty" };
  }
  const replayBoundary = requiredParsedValue(values.required, "--replay-boundary");
  if (replayBoundary.trim().length === 0) {
    return { error: "--replay-boundary must be non-empty" };
  }
  const rateLimitHeaderKey = requiredParsedValue(values.required, "--rate-limit-header-key");
  if (rateLimitHeaderKey.trim().length === 0) {
    return { error: "--rate-limit-header-key must be non-empty" };
  }
  const incidentDrill = requiredParsedValue(values.required, "--incident-drill");
  if (incidentDrill.trim().length === 0) {
    return { error: "--incident-drill must be non-empty" };
  }
  const remoteCi = requiredParsedValue(values.required, "--remote-ci");
  if (remoteCi.trim().length === 0) {
    return { error: "--remote-ci must be non-empty" };
  }
  const rollbackPlan = requiredParsedValue(values.required, "--rollback-plan");
  if (rollbackPlan.trim().length === 0) {
    return { error: "--rollback-plan must be non-empty" };
  }
  const secondOperator = requiredParsedValue(values.required, "--second-operator");
if (secondOperator.trim().length === 0) {
return { error: "--second-operator must be non-empty" };
}
const asOf = new Date(requiredParsedValue(values.required, "--as-of"));
  if (Number.isNaN(asOf.getTime())) {
    return { error: "--as-of must be an ISO date/time" };
  }
  return {
    environment,
    secretProvider,
    runtimeIdentity,
    rotationDrill,
    workerTopology,
    retryQueue,
    deadLetterQueue,
    hostedDashboard,
    alertRouting,
    replayBoundary,
    rateLimitHeaderKey,
    incidentDrill,
    remoteCi,
rollbackPlan,
secondOperator,
    scope: scopeFromArgs(values.required),
    asOf,
    json: values.flags.has("--json")
  };
}

function parseRemoteCiPostgresReadinessPacketArgs(
args: readonly string[]
): RemoteCiPostgresReadinessPacketCommand | { error: string } {
  const values = parseNamedArgs(
    args,
    [
      "--environment",
      "--tenant-id",
      "--workspace-id",
      "--user-id",
      "--as-of",
      "--ci-provider",
      "--postgres-service"
    ],
    ["--json"],
    []
  );
  if ("error" in values) return values;
  const environment = requiredParsedValue(values.required, "--environment");
  if (environment.trim().length === 0 || /\s/.test(environment)) {
    return { error: "--environment must be non-empty without spaces" };
  }
  const ciProvider = requiredParsedValue(values.required, "--ci-provider");
  if (ciProvider.trim().length === 0) {
    return { error: "--ci-provider must be non-empty" };
  }
  const postgresService = requiredParsedValue(values.required, "--postgres-service");
  if (postgresService.trim().length === 0) {
    return { error: "--postgres-service must be non-empty" };
  }
  const asOf = new Date(requiredParsedValue(values.required, "--as-of"));
  if (Number.isNaN(asOf.getTime())) {
    return { error: "--as-of must be an ISO date/time" };
  }
  return {
    environment,
    ciProvider,
    postgresService,
    scope: scopeFromArgs(values.required),
    asOf,
json: values.flags.has("--json")
};
}

function parsePublicRemoteCiReadinessPacketArgs(
args: readonly string[]
): PublicRemoteCiReadinessPacketCommand | { error: string } {
const values = parseNamedArgs(
args,
[
"--environment",
"--tenant-id",
"--workspace-id",
"--user-id",
"--as-of",
"--ci-provider",
"--workflow-suite",
"--target-repository",
"--workflow-run",
"--check-run",
"--production-dependency-audit",
"--no-git-directory",
"--release-safety-scan",
"--docs-link-check",
"--license-check",
"--log-sanitization",
"--artifact-retention",
"--branch-protection-review",
"--repository-settings-readiness",
"--second-operator"
],
["--json"],
[]
);
if ("error" in values) return values;
const environment = requiredParsedValue(values.required, "--environment");
if (environment.trim().length === 0 || /\s/.test(environment)) {
return { error: "--environment must be non-empty without spaces" };
}
const ciProvider = requiredParsedValue(values.required, "--ci-provider");
if (ciProvider.trim().length === 0) {
return { error: "--ci-provider must be non-empty" };
}
const workflowSuite = requiredParsedValue(values.required, "--workflow-suite");
if (workflowSuite.trim().length === 0) {
return { error: "--workflow-suite must be non-empty" };
}
const targetRepository = requiredParsedValue(values.required, "--target-repository");
if (targetRepository.trim().length === 0) {
return { error: "--target-repository must be non-empty" };
}
const workflowRun = requiredParsedValue(values.required, "--workflow-run");
if (workflowRun.trim().length === 0) return { error: "--workflow-run must be non-empty" };
const checkRun = requiredParsedValue(values.required, "--check-run");
if (checkRun.trim().length === 0) return { error: "--check-run must be non-empty" };
const productionDependencyAudit = requiredParsedValue(values.required, "--production-dependency-audit");
if (productionDependencyAudit.trim().length === 0) return { error: "--production-dependency-audit must be non-empty" };
const noGitDirectory = requiredParsedValue(values.required, "--no-git-directory");
if (noGitDirectory.trim().length === 0) return { error: "--no-git-directory must be non-empty" };
const releaseSafetyScan = requiredParsedValue(values.required, "--release-safety-scan");
if (releaseSafetyScan.trim().length === 0) return { error: "--release-safety-scan must be non-empty" };
const docsLinkCheck = requiredParsedValue(values.required, "--docs-link-check");
if (docsLinkCheck.trim().length === 0) return { error: "--docs-link-check must be non-empty" };
const licenseCheck = requiredParsedValue(values.required, "--license-check");
if (licenseCheck.trim().length === 0) return { error: "--license-check must be non-empty" };
const logSanitization = requiredParsedValue(values.required, "--log-sanitization");
if (logSanitization.trim().length === 0) return { error: "--log-sanitization must be non-empty" };
const artifactRetention = requiredParsedValue(values.required, "--artifact-retention");
if (artifactRetention.trim().length === 0) return { error: "--artifact-retention must be non-empty" };
const branchProtectionReview = requiredParsedValue(values.required, "--branch-protection-review");
if (branchProtectionReview.trim().length === 0) return { error: "--branch-protection-review must be non-empty" };
const repositorySettingsReadiness = requiredParsedValue(values.required, "--repository-settings-readiness");
if (repositorySettingsReadiness.trim().length === 0) return { error: "--repository-settings-readiness must be non-empty" };
const secondOperator = requiredParsedValue(values.required, "--second-operator");
if (secondOperator.trim().length === 0) return { error: "--second-operator must be non-empty" };
const asOf = new Date(requiredParsedValue(values.required, "--as-of"));
if (Number.isNaN(asOf.getTime())) {
return { error: "--as-of must be an ISO date/time" };
}
return {
environment,
ciProvider,
workflowSuite,
targetRepository,
workflowRun,
checkRun,
productionDependencyAudit,
noGitDirectory,
releaseSafetyScan,
docsLinkCheck,
licenseCheck,
logSanitization,
artifactRetention,
branchProtectionReview,
repositorySettingsReadiness,
secondOperator,
scope: scopeFromArgs(values.required),
asOf,
json: values.flags.has("--json")
};
}

function parseRepositoryLaunchReadinessPacketArgs(
args: readonly string[]
): RepositoryLaunchReadinessPacketCommand | { error: string } {
  const values = parseNamedArgs(
    args,
    [
      "--environment",
      "--target",
      "--tenant-id",
"--workspace-id",
"--user-id",
"--as-of",
"--history-plan",
"--final-release-gate",
"--clean-public-history",
"--privacy-secret-scan",
"--license-audit-pass",
"--security-audit-pass",
"--security-policy-contact",
"--remote-ci-pass",
"--name-collision-review",
"--trademark-review",
"--first-commit-staging",
"--repository-settings",
"--second-operator"
    ],
    ["--json"],
    []
  );
  if ("error" in values) return values;
  const environment = requiredParsedValue(values.required, "--environment");
  if (environment.trim().length === 0 || /\s/.test(environment)) {
    return { error: "--environment must be non-empty without spaces" };
  }
  const targetRepository = requiredParsedValue(values.required, "--target");
  if (targetRepository.trim().length === 0) {
    return { error: "--target must be non-empty" };
  }
const historyPlan = requiredParsedValue(values.required, "--history-plan");
if (historyPlan.trim().length === 0) {
return { error: "--history-plan must be non-empty" };
}
const finalReleaseGate = requiredParsedValue(values.required, "--final-release-gate");
if (finalReleaseGate.trim().length === 0) return { error: "--final-release-gate must be non-empty" };
const cleanPublicHistory = requiredParsedValue(values.required, "--clean-public-history");
if (cleanPublicHistory.trim().length === 0) return { error: "--clean-public-history must be non-empty" };
const privacySecretScan = requiredParsedValue(values.required, "--privacy-secret-scan");
if (privacySecretScan.trim().length === 0) return { error: "--privacy-secret-scan must be non-empty" };
const licenseAuditPass = requiredParsedValue(values.required, "--license-audit-pass");
if (licenseAuditPass.trim().length === 0) return { error: "--license-audit-pass must be non-empty" };
const securityAuditPass = requiredParsedValue(values.required, "--security-audit-pass");
if (securityAuditPass.trim().length === 0) return { error: "--security-audit-pass must be non-empty" };
const securityPolicyContact = requiredParsedValue(values.required, "--security-policy-contact");
if (securityPolicyContact.trim().length === 0) return { error: "--security-policy-contact must be non-empty" };
const remoteCiPass = requiredParsedValue(values.required, "--remote-ci-pass");
if (remoteCiPass.trim().length === 0) return { error: "--remote-ci-pass must be non-empty" };
const nameCollisionReview = requiredParsedValue(values.required, "--name-collision-review");
if (nameCollisionReview.trim().length === 0) return { error: "--name-collision-review must be non-empty" };
const trademarkReview = requiredParsedValue(values.required, "--trademark-review");
if (trademarkReview.trim().length === 0) return { error: "--trademark-review must be non-empty" };
const firstCommitStaging = requiredParsedValue(values.required, "--first-commit-staging");
if (firstCommitStaging.trim().length === 0) return { error: "--first-commit-staging must be non-empty" };
const repositorySettings = requiredParsedValue(values.required, "--repository-settings");
if (repositorySettings.trim().length === 0) return { error: "--repository-settings must be non-empty" };
const secondOperator = requiredParsedValue(values.required, "--second-operator");
if (secondOperator.trim().length === 0) return { error: "--second-operator must be non-empty" };
const asOf = new Date(requiredParsedValue(values.required, "--as-of"));
  if (Number.isNaN(asOf.getTime())) {
    return { error: "--as-of must be an ISO date/time" };
  }
  return {
    environment,
targetRepository,
historyPlan,
finalReleaseGate,
cleanPublicHistory,
privacySecretScan,
licenseAuditPass,
securityAuditPass,
securityPolicyContact,
remoteCiPass,
nameCollisionReview,
trademarkReview,
firstCommitStaging,
repositorySettings,
secondOperator,
scope: scopeFromArgs(values.required),
    asOf,
json: values.flags.has("--json")
};
}

function parseRepositorySettingsReadinessPacketArgs(
args: readonly string[]
): RepositorySettingsReadinessPacketCommand | { error: string } {
const values = parseNamedArgs(
args,
[
"--environment",
"--target-repository",
"--tenant-id",
"--workspace-id",
"--user-id",
"--as-of",
"--settings-profile",
"--branch-policy",
"--branch-protection-settings",
"--required-status-checks",
"--security-advisory-settings",
"--default-branch-merge-policy",
"--maintainer-access-review",
"--dependabot-alerts",
"--secret-scanning-push-protection",
"--release-package-permissions",
"--repository-metadata",
"--public-issue-discussion-settings",
"--second-operator"
],
["--json"],
[]
);
if ("error" in values) return values;
const environment = requiredParsedValue(values.required, "--environment");
if (environment.trim().length === 0 || /\s/.test(environment)) {
return { error: "--environment must be non-empty without spaces" };
}
const targetRepository = requiredParsedValue(values.required, "--target-repository");
if (targetRepository.trim().length === 0) {
return { error: "--target-repository must be non-empty" };
}
const settingsProfile = requiredParsedValue(values.required, "--settings-profile");
if (settingsProfile.trim().length === 0) {
return { error: "--settings-profile must be non-empty" };
}
const branchPolicy = requiredParsedValue(values.required, "--branch-policy");
if (branchPolicy.trim().length === 0) {
return { error: "--branch-policy must be non-empty" };
}
const branchProtectionSettings = requiredParsedValue(values.required, "--branch-protection-settings");
if (branchProtectionSettings.trim().length === 0) return { error: "--branch-protection-settings must be non-empty" };
const requiredStatusChecks = requiredParsedValue(values.required, "--required-status-checks");
if (requiredStatusChecks.trim().length === 0) return { error: "--required-status-checks must be non-empty" };
const securityAdvisorySettings = requiredParsedValue(values.required, "--security-advisory-settings");
if (securityAdvisorySettings.trim().length === 0) return { error: "--security-advisory-settings must be non-empty" };
const defaultBranchMergePolicy = requiredParsedValue(values.required, "--default-branch-merge-policy");
if (defaultBranchMergePolicy.trim().length === 0) return { error: "--default-branch-merge-policy must be non-empty" };
const maintainerAccessReview = requiredParsedValue(values.required, "--maintainer-access-review");
if (maintainerAccessReview.trim().length === 0) return { error: "--maintainer-access-review must be non-empty" };
const dependabotAlerts = requiredParsedValue(values.required, "--dependabot-alerts");
if (dependabotAlerts.trim().length === 0) return { error: "--dependabot-alerts must be non-empty" };
const secretScanningPushProtection = requiredParsedValue(values.required, "--secret-scanning-push-protection");
if (secretScanningPushProtection.trim().length === 0) return { error: "--secret-scanning-push-protection must be non-empty" };
const releasePackagePermissions = requiredParsedValue(values.required, "--release-package-permissions");
if (releasePackagePermissions.trim().length === 0) return { error: "--release-package-permissions must be non-empty" };
const repositoryMetadata = requiredParsedValue(values.required, "--repository-metadata");
if (repositoryMetadata.trim().length === 0) return { error: "--repository-metadata must be non-empty" };
const publicIssueDiscussionSettings = requiredParsedValue(values.required, "--public-issue-discussion-settings");
if (publicIssueDiscussionSettings.trim().length === 0) return { error: "--public-issue-discussion-settings must be non-empty" };
const secondOperator = requiredParsedValue(values.required, "--second-operator");
if (secondOperator.trim().length === 0) return { error: "--second-operator must be non-empty" };
const asOf = new Date(requiredParsedValue(values.required, "--as-of"));
if (Number.isNaN(asOf.getTime())) {
return { error: "--as-of must be an ISO date/time" };
}
return {
environment,
targetRepository,
settingsProfile,
branchPolicy,
branchProtectionSettings,
requiredStatusChecks,
securityAdvisorySettings,
defaultBranchMergePolicy,
maintainerAccessReview,
dependabotAlerts,
secretScanningPushProtection,
releasePackagePermissions,
repositoryMetadata,
publicIssueDiscussionSettings,
secondOperator,
scope: scopeFromArgs(values.required),
asOf,
json: values.flags.has("--json")
};
}

function parseCleanHistoryReadinessPacketArgs(
args: readonly string[]
): CleanHistoryReadinessPacketCommand | { error: string } {
  const values = parseNamedArgs(
    args,
    [
      "--environment",
      "--tenant-id",
      "--workspace-id",
      "--user-id",
      "--as-of",
      "--history-scope",
      "--source-root",
      "--no-git-directory",
      "--release-safety-scan",
      "--first-commit-staging-manifest",
      "--generated-artifact-review",
      "--fixture-sanitization",
      "--license-notice-readiness",
      "--repository-naming",
      "--remote-ci-plan",
      "--second-operator"
    ],
    ["--json"],
    []
  );
 if ("error" in values) return values;
 const environment = requiredParsedValue(values.required, "--environment");
 if (environment.trim().length === 0 || /\s/.test(environment)) {
 return { error: "--environment must be non-empty without spaces" };
 }
 const historyScope = requiredParsedValue(values.required, "--history-scope");
 if (historyScope.trim().length === 0) {
 return { error: "--history-scope must be non-empty" };
 }
  const sourceRoot = requiredParsedValue(values.required, "--source-root");
  if (sourceRoot.trim().length === 0) {
    return { error: "--source-root must be non-empty" };
  }
  const noGitDirectory = requiredParsedValue(values.required, "--no-git-directory");
  if (noGitDirectory.trim().length === 0) return { error: "--no-git-directory must be non-empty" };
  const releaseSafetyScan = requiredParsedValue(values.required, "--release-safety-scan");
  if (releaseSafetyScan.trim().length === 0) return { error: "--release-safety-scan must be non-empty" };
  const firstCommitStagingManifest = requiredParsedValue(values.required, "--first-commit-staging-manifest");
  if (firstCommitStagingManifest.trim().length === 0) return { error: "--first-commit-staging-manifest must be non-empty" };
  const generatedArtifactReview = requiredParsedValue(values.required, "--generated-artifact-review");
  if (generatedArtifactReview.trim().length === 0) return { error: "--generated-artifact-review must be non-empty" };
  const fixtureSanitization = requiredParsedValue(values.required, "--fixture-sanitization");
  if (fixtureSanitization.trim().length === 0) return { error: "--fixture-sanitization must be non-empty" };
  const licenseNoticeReadiness = requiredParsedValue(values.required, "--license-notice-readiness");
  if (licenseNoticeReadiness.trim().length === 0) return { error: "--license-notice-readiness must be non-empty" };
  const repositoryNaming = requiredParsedValue(values.required, "--repository-naming");
  if (repositoryNaming.trim().length === 0) return { error: "--repository-naming must be non-empty" };
  const remoteCiPlan = requiredParsedValue(values.required, "--remote-ci-plan");
  if (remoteCiPlan.trim().length === 0) return { error: "--remote-ci-plan must be non-empty" };
  const secondOperator = requiredParsedValue(values.required, "--second-operator");
  if (secondOperator.trim().length === 0) return { error: "--second-operator must be non-empty" };
 const asOf = new Date(requiredParsedValue(values.required, "--as-of"));
 if (Number.isNaN(asOf.getTime())) {
 return { error: "--as-of must be an ISO date/time" };
 }
return {
environment,
historyScope,
    sourceRoot,
    noGitDirectory,
    releaseSafetyScan,
    firstCommitStagingManifest,
    generatedArtifactReview,
    fixtureSanitization,
    licenseNoticeReadiness,
    repositoryNaming,
    remoteCiPlan,
    secondOperator,
scope: scopeFromArgs(values.required),
asOf,
json: values.flags.has("--json")
};
}

function parseGeneratedArtifactReviewPacketArgs(
args: readonly string[]
): GeneratedArtifactReviewPacketCommand | { error: string } {
const values = parseNamedArgs(
args,
[
"--environment",
"--tenant-id",
"--workspace-id",
"--user-id",
"--as-of",
"--artifact-scope",
"--manifest"
],
["--json"],
[]
);
if ("error" in values) return values;
const environment = requiredParsedValue(values.required, "--environment");
if (environment.trim().length === 0 || /\s/.test(environment)) {
return { error: "--environment must be non-empty without spaces" };
}
const artifactScope = requiredParsedValue(values.required, "--artifact-scope");
if (artifactScope.trim().length === 0) {
return { error: "--artifact-scope must be non-empty" };
}
const manifest = requiredParsedValue(values.required, "--manifest");
if (manifest.trim().length === 0) {
return { error: "--manifest must be non-empty" };
}
const asOf = new Date(requiredParsedValue(values.required, "--as-of"));
if (Number.isNaN(asOf.getTime())) {
return { error: "--as-of must be an ISO date/time" };
}
return {
environment,
artifactScope,
manifest,
scope: scopeFromArgs(values.required),
asOf,
json: values.flags.has("--json")
};
}

function parseSecurityPolicyContactReadinessPacketArgs(
args: readonly string[]
): SecurityPolicyContactReadinessPacketCommand | { error: string } {
 const values = parseNamedArgs(
 args,
 [
 "--environment",
 "--tenant-id",
 "--workspace-id",
 "--user-id",
 "--as-of",
      "--contact-channel",
      "--responsible-party",
      "--disclosure-workflow",
      "--advisory-settings",
      "--response-sla",
      "--escalation-path",
      "--private-report-sanitization",
      "--remote-ci-security-workflow",
      "--second-operator"
 ],
 ["--json"],
 []
 );
 if ("error" in values) return values;
 const environment = requiredParsedValue(values.required, "--environment");
 if (environment.trim().length === 0 || /\s/.test(environment)) {
 return { error: "--environment must be non-empty without spaces" };
 }
 const contactChannel = requiredParsedValue(values.required, "--contact-channel");
 if (contactChannel.trim().length === 0) {
 return { error: "--contact-channel must be non-empty" };
 }
  const responsibleParty = requiredParsedValue(values.required, "--responsible-party");
  if (responsibleParty.trim().length === 0) {
    return { error: "--responsible-party must be non-empty" };
  }
  const disclosureWorkflow = requiredParsedValue(values.required, "--disclosure-workflow");
  if (disclosureWorkflow.trim().length === 0) {
    return { error: "--disclosure-workflow must be non-empty" };
  }
  const advisorySettings = requiredParsedValue(values.required, "--advisory-settings");
  if (advisorySettings.trim().length === 0) {
    return { error: "--advisory-settings must be non-empty" };
  }
  const responseSla = requiredParsedValue(values.required, "--response-sla");
  if (responseSla.trim().length === 0) {
    return { error: "--response-sla must be non-empty" };
  }
  const escalationPath = requiredParsedValue(values.required, "--escalation-path");
  if (escalationPath.trim().length === 0) {
    return { error: "--escalation-path must be non-empty" };
  }
  const privateReportSanitization = requiredParsedValue(
    values.required,
    "--private-report-sanitization"
  );
  if (privateReportSanitization.trim().length === 0) {
    return { error: "--private-report-sanitization must be non-empty" };
  }
  const remoteCiSecurityWorkflow = requiredParsedValue(
    values.required,
    "--remote-ci-security-workflow"
  );
  if (remoteCiSecurityWorkflow.trim().length === 0) {
    return { error: "--remote-ci-security-workflow must be non-empty" };
  }
  const secondOperator = requiredParsedValue(values.required, "--second-operator");
  if (secondOperator.trim().length === 0) {
    return { error: "--second-operator must be non-empty" };
  }
  const asOf = new Date(requiredParsedValue(values.required, "--as-of"));
 if (Number.isNaN(asOf.getTime())) {
 return { error: "--as-of must be an ISO date/time" };
 }
 return {
    environment,
    contactChannel,
    responsibleParty,
    disclosureWorkflow,
    advisorySettings,
    responseSla,
    escalationPath,
    privateReportSanitization,
    remoteCiSecurityWorkflow,
    secondOperator,
    scope: scopeFromArgs(values.required),
 asOf,
 json: values.flags.has("--json")
 };
}

function parseFinalSecurityAuditReadinessPacketArgs(
  args: readonly string[]
): FinalSecurityAuditReadinessPacketCommand | { error: string } {
  const values = parseNamedArgs(
    args,
    [
      "--environment",
      "--audit-scope",
      "--tenant-id",
      "--workspace-id",
      "--user-id",
      "--as-of",
      "--dependency-audit-pass",
      "--secret-scan",
      "--privacy-scan",
      "--production-auth",
      "--role-membership",
      "--reset-token-lifecycle",
      "--rate-limit-abuse-monitoring",
      "--provider-managed-secret-lifecycle",
      "--deployment-tls-proxy-headers",
      "--remote-ci",
      "--security-policy-contact",
      "--final-source-review",
      "--second-operator"
    ],
    ["--json"],
    []
  );
  if ("error" in values) return values;

  const environment = requiredParsedValue(values.required, "--environment");
  if (environment.trim().length === 0 || /\s/.test(environment)) {
    return { error: "--environment must be non-empty without spaces" };
  }
  const auditScope = requiredParsedValue(values.required, "--audit-scope");
  if (auditScope.trim().length === 0) return { error: "--audit-scope must be non-empty" };

  const dependencyAuditPass = requiredParsedValue(values.required, "--dependency-audit-pass");
  if (dependencyAuditPass.trim().length === 0) return { error: "--dependency-audit-pass must be non-empty" };
  const secretScan = requiredParsedValue(values.required, "--secret-scan");
  if (secretScan.trim().length === 0) return { error: "--secret-scan must be non-empty" };
  const privacyScan = requiredParsedValue(values.required, "--privacy-scan");
  if (privacyScan.trim().length === 0) return { error: "--privacy-scan must be non-empty" };
  const productionAuth = requiredParsedValue(values.required, "--production-auth");
  if (productionAuth.trim().length === 0) return { error: "--production-auth must be non-empty" };
  const roleMembership = requiredParsedValue(values.required, "--role-membership");
  if (roleMembership.trim().length === 0) return { error: "--role-membership must be non-empty" };
  const resetTokenLifecycle = requiredParsedValue(values.required, "--reset-token-lifecycle");
  if (resetTokenLifecycle.trim().length === 0) return { error: "--reset-token-lifecycle must be non-empty" };
  const rateLimitAbuseMonitoring = requiredParsedValue(values.required, "--rate-limit-abuse-monitoring");
  if (rateLimitAbuseMonitoring.trim().length === 0) return { error: "--rate-limit-abuse-monitoring must be non-empty" };
  const providerManagedSecretLifecycle = requiredParsedValue(values.required, "--provider-managed-secret-lifecycle");
  if (providerManagedSecretLifecycle.trim().length === 0) return { error: "--provider-managed-secret-lifecycle must be non-empty" };
  const deploymentTlsProxyHeaders = requiredParsedValue(values.required, "--deployment-tls-proxy-headers");
  if (deploymentTlsProxyHeaders.trim().length === 0) return { error: "--deployment-tls-proxy-headers must be non-empty" };
  const remoteCi = requiredParsedValue(values.required, "--remote-ci");
  if (remoteCi.trim().length === 0) return { error: "--remote-ci must be non-empty" };
  const securityPolicyContact = requiredParsedValue(values.required, "--security-policy-contact");
  if (securityPolicyContact.trim().length === 0) return { error: "--security-policy-contact must be non-empty" };
  const finalSourceReview = requiredParsedValue(values.required, "--final-source-review");
  if (finalSourceReview.trim().length === 0) return { error: "--final-source-review must be non-empty" };
  const secondOperator = requiredParsedValue(values.required, "--second-operator");
  if (secondOperator.trim().length === 0) return { error: "--second-operator must be non-empty" };

  const asOf = new Date(requiredParsedValue(values.required, "--as-of"));
  if (Number.isNaN(asOf.getTime())) return { error: "--as-of must be an ISO date/time" };

  return {
    environment,
    auditScope,
    dependencyAuditPass,
    secretScan,
    privacyScan,
    productionAuth,
    roleMembership,
    resetTokenLifecycle,
    rateLimitAbuseMonitoring,
    providerManagedSecretLifecycle,
    deploymentTlsProxyHeaders,
    remoteCi,
    securityPolicyContact,
    finalSourceReview,
    secondOperator,
    scope: scopeFromArgs(values.required),
    asOf,
    json: values.flags.has("--json")
  };
}

function parseFinalLicensingAuditReadinessPacketArgs(
  args: readonly string[]
): FinalLicensingAuditReadinessPacketCommand | { error: string } {
  const values = parseNamedArgs(
    args,
    [
      "--environment",
      "--audit-scope",
      "--tenant-id",
      "--workspace-id",
      "--user-id",
      "--as-of",
      "--final-license-check",
      "--lockfile-dependency-licenses",
      "--installed-dependency-metadata",
      "--copied-source-scan",
      "--fixture-template-example-review",
      "--asset-media-font-binary-review",
      "--documentation-reuse-scan",
      "--reused-material-inventory",
      "--notice-review",
      "--root-license-consistency",
      "--final-release-candidate-freeze",
      "--second-operator"
    ],
    ["--json"],
    []
  );
  if ("error" in values) return values;
  const environment = requiredParsedValue(values.required, "--environment");
  if (environment.trim().length === 0 || /\s/.test(environment)) {
    return { error: "--environment must be non-empty without spaces" };
  }
  const auditScope = requiredParsedValue(values.required, "--audit-scope");
  if (auditScope.trim().length === 0) {
    return { error: "--audit-scope must be non-empty" };
  }
  const finalLicenseCheck = requiredParsedValue(values.required, "--final-license-check");
  if (finalLicenseCheck.trim().length === 0) return { error: "--final-license-check must be non-empty" };
  const lockfileDependencyLicenses = requiredParsedValue(values.required, "--lockfile-dependency-licenses");
  if (lockfileDependencyLicenses.trim().length === 0) return { error: "--lockfile-dependency-licenses must be non-empty" };
  const installedDependencyMetadata = requiredParsedValue(values.required, "--installed-dependency-metadata");
  if (installedDependencyMetadata.trim().length === 0) return { error: "--installed-dependency-metadata must be non-empty" };
  const copiedSourceScan = requiredParsedValue(values.required, "--copied-source-scan");
  if (copiedSourceScan.trim().length === 0) return { error: "--copied-source-scan must be non-empty" };
  const fixtureTemplateExampleReview = requiredParsedValue(values.required, "--fixture-template-example-review");
  if (fixtureTemplateExampleReview.trim().length === 0) return { error: "--fixture-template-example-review must be non-empty" };
  const assetMediaFontBinaryReview = requiredParsedValue(values.required, "--asset-media-font-binary-review");
  if (assetMediaFontBinaryReview.trim().length === 0) return { error: "--asset-media-font-binary-review must be non-empty" };
  const documentationReuseScan = requiredParsedValue(values.required, "--documentation-reuse-scan");
  if (documentationReuseScan.trim().length === 0) return { error: "--documentation-reuse-scan must be non-empty" };
  const reusedMaterialInventory = requiredParsedValue(values.required, "--reused-material-inventory");
  if (reusedMaterialInventory.trim().length === 0) return { error: "--reused-material-inventory must be non-empty" };
  const noticeReview = requiredParsedValue(values.required, "--notice-review");
  if (noticeReview.trim().length === 0) return { error: "--notice-review must be non-empty" };
  const rootLicenseConsistency = requiredParsedValue(values.required, "--root-license-consistency");
  if (rootLicenseConsistency.trim().length === 0) return { error: "--root-license-consistency must be non-empty" };
  const finalReleaseCandidateFreeze = requiredParsedValue(values.required, "--final-release-candidate-freeze");
  if (finalReleaseCandidateFreeze.trim().length === 0) return { error: "--final-release-candidate-freeze must be non-empty" };
  const secondOperator = requiredParsedValue(values.required, "--second-operator");
  if (secondOperator.trim().length === 0) return { error: "--second-operator must be non-empty" };
  const asOf = new Date(requiredParsedValue(values.required, "--as-of"));
  if (Number.isNaN(asOf.getTime())) {
    return { error: "--as-of must be an ISO date/time" };
  }
  return {
    environment,
    auditScope,
    finalLicenseCheck,
    lockfileDependencyLicenses,
    installedDependencyMetadata,
    copiedSourceScan,
    fixtureTemplateExampleReview,
    assetMediaFontBinaryReview,
    documentationReuseScan,
    reusedMaterialInventory,
    noticeReview,
    rootLicenseConsistency,
    finalReleaseCandidateFreeze,
    secondOperator,
    scope: scopeFromArgs(values.required),
    asOf,
    json: values.flags.has("--json")
  };
}

function parseFinalPrivacyAuditReadinessPacketArgs(
  args: readonly string[]
): FinalPrivacyAuditReadinessPacketCommand | { error: string } {
  const values = parseNamedArgs(
    args,
    [
      "--environment",
      "--audit-scope",
      "--tenant-id",
      "--workspace-id",
      "--user-id",
      "--as-of",
      "--release-safety-scan",
      "--fixture-sanitization",
      "--generated-artifact-review",
      "--log-export-backup-review",
      "--provider-identifier-review",
      "--local-path-private-url-review",
      "--private-leadership-boundary",
      "--calendar-task-minimization",
      "--ai-redaction-boundary",
      "--retention-export-deletion-revocation",
      "--second-operator"
    ],
    ["--json"],
    []
  );
  if ("error" in values) return values;

  const environment = requiredParsedValue(values.required, "--environment");
  if (environment.trim().length === 0 || /\s/.test(environment)) {
    return { error: "--environment must be non-empty without spaces" };
  }
  const auditScope = requiredParsedValue(values.required, "--audit-scope");
  if (auditScope.trim().length === 0) return { error: "--audit-scope must be non-empty" };

  const releaseSafetyScan = requiredParsedValue(values.required, "--release-safety-scan");
  if (releaseSafetyScan.trim().length === 0) return { error: "--release-safety-scan must be non-empty" };
  const fixtureSanitization = requiredParsedValue(values.required, "--fixture-sanitization");
  if (fixtureSanitization.trim().length === 0) return { error: "--fixture-sanitization must be non-empty" };
  const generatedArtifactReview = requiredParsedValue(values.required, "--generated-artifact-review");
  if (generatedArtifactReview.trim().length === 0) return { error: "--generated-artifact-review must be non-empty" };
  const logExportBackupReview = requiredParsedValue(values.required, "--log-export-backup-review");
  if (logExportBackupReview.trim().length === 0) return { error: "--log-export-backup-review must be non-empty" };
  const providerIdentifierReview = requiredParsedValue(values.required, "--provider-identifier-review");
  if (providerIdentifierReview.trim().length === 0) return { error: "--provider-identifier-review must be non-empty" };
  const localPathPrivateUrlReview = requiredParsedValue(values.required, "--local-path-private-url-review");
  if (localPathPrivateUrlReview.trim().length === 0) return { error: "--local-path-private-url-review must be non-empty" };
  const privateLeadershipBoundary = requiredParsedValue(values.required, "--private-leadership-boundary");
  if (privateLeadershipBoundary.trim().length === 0) return { error: "--private-leadership-boundary must be non-empty" };
  const calendarTaskMinimization = requiredParsedValue(values.required, "--calendar-task-minimization");
  if (calendarTaskMinimization.trim().length === 0) return { error: "--calendar-task-minimization must be non-empty" };
  const aiRedactionBoundary = requiredParsedValue(values.required, "--ai-redaction-boundary");
  if (aiRedactionBoundary.trim().length === 0) return { error: "--ai-redaction-boundary must be non-empty" };
  const retentionExportDeletionRevocation = requiredParsedValue(values.required, "--retention-export-deletion-revocation");
  if (retentionExportDeletionRevocation.trim().length === 0) return { error: "--retention-export-deletion-revocation must be non-empty" };
  const secondOperator = requiredParsedValue(values.required, "--second-operator");
  if (secondOperator.trim().length === 0) return { error: "--second-operator must be non-empty" };

  const asOf = new Date(requiredParsedValue(values.required, "--as-of"));
  if (Number.isNaN(asOf.getTime())) return { error: "--as-of must be an ISO date/time" };

  return {
    environment,
    auditScope,
    releaseSafetyScan,
    fixtureSanitization,
    generatedArtifactReview,
    logExportBackupReview,
    providerIdentifierReview,
    localPathPrivateUrlReview,
    privateLeadershipBoundary,
    calendarTaskMinimization,
    aiRedactionBoundary,
    retentionExportDeletionRevocation,
    secondOperator,
    scope: scopeFromArgs(values.required),
    asOf,
    json: values.flags.has("--json")
  };
}

function parseFinalReleaseGateReadinessPacketArgs(
  args: readonly string[]
): FinalReleaseGateReadinessPacketCommand | { error: string } {
  const values = parseNamedArgs(
    args,
    [
      "--environment",
      "--release-scope",
      "--tenant-id",
      "--workspace-id",
      "--user-id",
      "--as-of",
      "--functionality-gate",
      "--storage-gate",
      "--documentation-gate",
      "--security-audit-pass",
      "--licensing-audit-pass",
      "--privacy-audit-pass",
      "--dependency-audit-final-pass",
      "--remote-ci-pass",
      "--clean-history",
      "--security-policy-contact",
      "--repository-settings",
      "--final-source-review",
      "--second-operator"
    ],
    ["--json"],
    []
  );
  if ("error" in values) return values;
  const environment = requiredParsedValue(values.required, "--environment");
  if (environment.trim().length === 0 || /\s/.test(environment)) {
    return { error: "--environment must be non-empty without spaces" };
  }
  const releaseScope = requiredParsedValue(values.required, "--release-scope");
  if (releaseScope.trim().length === 0) {
    return { error: "--release-scope must be non-empty" };
  }
  const functionalityGate = requiredParsedValue(values.required, "--functionality-gate");
  if (functionalityGate.trim().length === 0) {
    return { error: "--functionality-gate must be non-empty" };
  }
  const storageGate = requiredParsedValue(values.required, "--storage-gate");
  if (storageGate.trim().length === 0) {
    return { error: "--storage-gate must be non-empty" };
  }
  const documentationGate = requiredParsedValue(values.required, "--documentation-gate");
  if (documentationGate.trim().length === 0) {
    return { error: "--documentation-gate must be non-empty" };
  }
  const securityAuditPass = requiredParsedValue(values.required, "--security-audit-pass");
  if (securityAuditPass.trim().length === 0) {
    return { error: "--security-audit-pass must be non-empty" };
  }
  const licensingAuditPass = requiredParsedValue(values.required, "--licensing-audit-pass");
  if (licensingAuditPass.trim().length === 0) {
    return { error: "--licensing-audit-pass must be non-empty" };
  }
  const privacyAuditPass = requiredParsedValue(values.required, "--privacy-audit-pass");
  if (privacyAuditPass.trim().length === 0) {
    return { error: "--privacy-audit-pass must be non-empty" };
  }
  const dependencyAuditFinalPass = requiredParsedValue(values.required, "--dependency-audit-final-pass");
  if (dependencyAuditFinalPass.trim().length === 0) {
    return { error: "--dependency-audit-final-pass must be non-empty" };
  }
  const remoteCiPass = requiredParsedValue(values.required, "--remote-ci-pass");
  if (remoteCiPass.trim().length === 0) {
    return { error: "--remote-ci-pass must be non-empty" };
  }
  const cleanHistory = requiredParsedValue(values.required, "--clean-history");
  if (cleanHistory.trim().length === 0) {
    return { error: "--clean-history must be non-empty" };
  }
  const securityPolicyContact = requiredParsedValue(values.required, "--security-policy-contact");
  if (securityPolicyContact.trim().length === 0) {
    return { error: "--security-policy-contact must be non-empty" };
  }
  const repositorySettings = requiredParsedValue(values.required, "--repository-settings");
  if (repositorySettings.trim().length === 0) {
    return { error: "--repository-settings must be non-empty" };
  }
  const finalSourceReview = requiredParsedValue(values.required, "--final-source-review");
  if (finalSourceReview.trim().length === 0) {
    return { error: "--final-source-review must be non-empty" };
  }
  const secondOperator = requiredParsedValue(values.required, "--second-operator");
  if (secondOperator.trim().length === 0) {
    return { error: "--second-operator must be non-empty" };
  }
  const asOf = new Date(requiredParsedValue(values.required, "--as-of"));
  if (Number.isNaN(asOf.getTime())) {
    return { error: "--as-of must be an ISO date/time" };
  }
  return {
    environment,
    releaseScope,
    functionalityGate,
    storageGate,
    documentationGate,
    securityAuditPass,
    licensingAuditPass,
    privacyAuditPass,
    dependencyAuditFinalPass,
    remoteCiPass,
    cleanHistory,
    securityPolicyContact,
    repositorySettings,
    finalSourceReview,
    secondOperator,
    scope: scopeFromArgs(values.required),
    asOf,
    json: values.flags.has("--json")
  };
}

function parseDependencyAuditReadinessPacketArgs(
 args: readonly string[]
): DependencyAuditReadinessPacketCommand | { error: string } {
 const values = parseNamedArgs(
 args,
 [
 "--environment",
 "--tenant-id",
 "--workspace-id",
 "--user-id",
 "--as-of",
      "--audit-scope",
      "--package-manager",
      "--production-audit",
      "--lockfile-proof",
      "--installed-tree",
      "--runtime-inventory",
      "--dev-dependency-exclusion",
      "--override-review",
      "--license-alignment",
      "--registry-secret-absence",
      "--remote-ci",
      "--second-operator"
 ],
 ["--json"],
 []
 );
 if ("error" in values) return values;
 const environment = requiredParsedValue(values.required, "--environment");
 if (environment.trim().length === 0 || /\s/.test(environment)) {
 return { error: "--environment must be non-empty without spaces" };
 }
 const auditScope = requiredParsedValue(values.required, "--audit-scope");
 if (auditScope.trim().length === 0) {
 return { error: "--audit-scope must be non-empty" };
 }
  const packageManager = requiredParsedValue(values.required, "--package-manager");
  if (packageManager.trim().length === 0) {
    return { error: "--package-manager must be non-empty" };
  }
  const productionAudit = requiredParsedValue(values.required, "--production-audit");
  if (productionAudit.trim().length === 0) {
    return { error: "--production-audit must be non-empty" };
  }
  const lockfileProof = requiredParsedValue(values.required, "--lockfile-proof");
  if (lockfileProof.trim().length === 0) {
    return { error: "--lockfile-proof must be non-empty" };
  }
  const installedTree = requiredParsedValue(values.required, "--installed-tree");
  if (installedTree.trim().length === 0) {
    return { error: "--installed-tree must be non-empty" };
  }
  const runtimeInventory = requiredParsedValue(values.required, "--runtime-inventory");
  if (runtimeInventory.trim().length === 0) {
    return { error: "--runtime-inventory must be non-empty" };
  }
  const devDependencyExclusion = requiredParsedValue(
    values.required,
    "--dev-dependency-exclusion"
  );
  if (devDependencyExclusion.trim().length === 0) {
    return { error: "--dev-dependency-exclusion must be non-empty" };
  }
  const overrideReview = requiredParsedValue(values.required, "--override-review");
  if (overrideReview.trim().length === 0) {
    return { error: "--override-review must be non-empty" };
  }
  const licenseAlignment = requiredParsedValue(values.required, "--license-alignment");
  if (licenseAlignment.trim().length === 0) {
    return { error: "--license-alignment must be non-empty" };
  }
  const registrySecretAbsence = requiredParsedValue(
    values.required,
    "--registry-secret-absence"
  );
  if (registrySecretAbsence.trim().length === 0) {
    return { error: "--registry-secret-absence must be non-empty" };
  }
  const remoteCi = requiredParsedValue(values.required, "--remote-ci");
  if (remoteCi.trim().length === 0) {
    return { error: "--remote-ci must be non-empty" };
  }
  const secondOperator = requiredParsedValue(values.required, "--second-operator");
  if (secondOperator.trim().length === 0) {
    return { error: "--second-operator must be non-empty" };
  }
  const asOf = new Date(requiredParsedValue(values.required, "--as-of"));
  if (Number.isNaN(asOf.getTime())) {
    return { error: "--as-of must be an ISO date/time" };
  }
 return {
    environment,
    auditScope,
    packageManager,
    productionAudit,
    lockfileProof,
    installedTree,
    runtimeInventory,
    devDependencyExclusion,
    overrideReview,
    licenseAlignment,
    registrySecretAbsence,
    remoteCi,
    secondOperator,
    scope: scopeFromArgs(values.required),
 asOf,
 json: values.flags.has("--json")
 };
}

function parsePublicEventDeliveryOperatorPacketArgs(
  args: readonly string[]
): PublicEventDeliveryOperatorPacketCommand | { error: string } {
  const values = parseNamedArgs(
    args,
    ["--tenant-id", "--workspace-id", "--user-id", "--as-of"],
    ["--json"],
    ["--type", "--source-system", "--max-subscriptions", "--max-events"]
  );
  if ("error" in values) return values;
  const asOf = new Date(requiredParsedValue(values.required, "--as-of"));
  if (Number.isNaN(asOf.getTime())) {
    return { error: "--as-of must be an ISO date/time" };
  }
  const maxSubscriptions = optionalPositiveIntegerValue(
    values.optional["--max-subscriptions"],
    "--max-subscriptions"
  );
  if ("error" in maxSubscriptions) return maxSubscriptions;
  const maxEvents = optionalPositiveIntegerValue(
    values.optional["--max-events"],
    "--max-events"
  );
  if ("error" in maxEvents) return maxEvents;
  return {
    scope: scopeFromArgs(values.required),
    asOf,
    json: values.flags.has("--json"),
    ...(values.optional["--type"] === undefined
      ? {}
      : { type: values.optional["--type"] }),
    ...(values.optional["--source-system"] === undefined
      ? {}
      : { sourceSystem: values.optional["--source-system"] }),
    ...(maxSubscriptions.value === undefined
      ? {}
      : { maxSubscriptions: maxSubscriptions.value }),
    ...(maxEvents.value === undefined ? {} : { maxEvents: maxEvents.value })
  };
}

function parsePublicEventDeadLetterQueuePacketArgs(
  args: readonly string[]
): PublicEventDeadLetterQueuePacketCommand | { error: string } {
  const values = parseNamedArgs(
    args,
    ["--tenant-id", "--workspace-id", "--user-id", "--as-of"],
    ["--json"],
    ["--max-attempts", "--type", "--status"]
  );
  if ("error" in values) return values;
  const asOf = new Date(requiredParsedValue(values.required, "--as-of"));
  if (Number.isNaN(asOf.getTime())) {
    return { error: "--as-of must be an ISO date/time" };
  }
  const maxAttempts = optionalPositiveIntegerValue(
    values.optional["--max-attempts"] ?? "3",
    "--max-attempts"
  );
  if ("error" in maxAttempts) return maxAttempts;
  const status = values.optional["--status"];
  if (status !== undefined && !isPublicEventDeadLetterQueueStatus(status)) {
    return { error: "--status must be UNREVIEWED or REVIEWED" };
  }
  return {
    scope: scopeFromArgs(values.required),
    asOf,
    json: values.flags.has("--json"),
    maxAttempts: maxAttempts.value ?? 3,
    ...(values.optional["--type"] === undefined
      ? {}
      : { type: values.optional["--type"] }),
    ...(status === undefined ? {} : { status })
  };
}

function isPublicEventDeadLetterQueueStatus(
  value: string
): value is NonNullable<PublicEventDeadLetterQueuePacketCommand["status"]> {
  return value === "UNREVIEWED" || value === "REVIEWED";
}

function parsePublicEventDeliveryIncidentDrillPacketArgs(
  args: readonly string[]
): PublicEventDeliveryIncidentDrillPacketCommand | { error: string } {
  const values = parseNamedArgs(
    args,
    [
      "--tenant-id",
      "--workspace-id",
      "--user-id",
      "--as-of",
      "--incident-id",
      "--failure-class"
    ],
    ["--json"],
    ["--type", "--source-system", "--max-subscriptions", "--max-events"]
  );
  if ("error" in values) return values;
  const asOf = new Date(requiredParsedValue(values.required, "--as-of"));
  if (Number.isNaN(asOf.getTime())) {
    return { error: "--as-of must be an ISO date/time" };
  }
  const failureClass = requiredParsedValue(
    values.required,
    "--failure-class"
  );
  if (!isPublicEventIncidentFailureClass(failureClass)) {
    return {
      error:
        "--failure-class must be one of network, receiver, signature, throttling, contract, privacy, cross-scope, worker"
    };
  }
  const maxSubscriptions = optionalPositiveIntegerValue(
    values.optional["--max-subscriptions"],
    "--max-subscriptions"
  );
  if ("error" in maxSubscriptions) return maxSubscriptions;
  const maxEvents = optionalPositiveIntegerValue(
    values.optional["--max-events"],
    "--max-events"
  );
  if ("error" in maxEvents) return maxEvents;
  return {
    scope: scopeFromArgs(values.required),
    asOf,
    incidentId: requiredParsedValue(values.required, "--incident-id"),
    failureClass,
    json: values.flags.has("--json"),
    ...(values.optional["--type"] === undefined
      ? {}
      : { type: values.optional["--type"] }),
    ...(values.optional["--source-system"] === undefined
      ? {}
      : { sourceSystem: values.optional["--source-system"] }),
    ...(maxSubscriptions.value === undefined
      ? {}
      : { maxSubscriptions: maxSubscriptions.value }),
    ...(maxEvents.value === undefined ? {} : { maxEvents: maxEvents.value })
  };
}

function isPublicEventIncidentFailureClass(
  value: string
): value is PublicEventDeliveryIncidentDrillPacketCommand["failureClass"] {
  return [
    "network",
    "receiver",
    "signature",
    "throttling",
    "contract",
    "privacy",
    "cross-scope",
    "worker"
  ].includes(value);
}

function parseRetentionSqliteCleanupArgs(
  args: readonly string[]
): RetentionSqliteCleanupCommand | { error: string } {
  const values = parseNamedArgs(
    args,
    ["--database", "--tenant-id", "--workspace-id", "--user-id", "--as-of"],
    ["--apply", "--json"],
    ["--confirm"]
  );
  if ("error" in values) return values;
  const asOf = new Date(requiredParsedValue(values.required, "--as-of"));
  if (Number.isNaN(asOf.getTime())) {
    return { error: "--as-of must be an ISO date/time" };
  }
  return {
    databasePath: requiredParsedValue(values.required, "--database"),
    scope: scopeFromArgs(values.required),
    asOf,
    apply: values.flags.has("--apply"),
    ...(values.optional["--confirm"] === undefined
      ? {}
      : { confirm: values.optional["--confirm"] }),
    json: values.flags.has("--json")
 };
}

function parseRetentionPostgresCleanupArgs(
 args: readonly string[]
): RetentionPostgresCleanupCommand | { error: string } {
 const values = parseNamedArgs(
  args,
  ["--tenant-id", "--workspace-id", "--user-id", "--as-of"],
  ["--apply", "--json"],
  ["--confirm"]
 );
 if ("error" in values) return values;
 const asOf = new Date(requiredParsedValue(values.required, "--as-of"));
 if (Number.isNaN(asOf.getTime())) {
  return { error: "--as-of must be an ISO date/time" };
 }
 return {
  scope: scopeFromArgs(values.required),
  asOf,
  apply: values.flags.has("--apply"),
  ...(values.optional["--confirm"] === undefined
   ? {}
   : { confirm: values.optional["--confirm"] }),
  json: values.flags.has("--json")
 };
}

function parseNamedArgs(
  args: readonly string[],
  requiredNames: readonly string[],
  flagNames: readonly string[] = [],
  optionalNames: readonly string[] = []
):
  | {
      required: Record<string, string>;
      optional: Record<string, string | undefined>;
      flags: Set<string>;
    }
  | { error: string } {
  const required: Record<string, string> = {};
  const optional: Record<string, string | undefined> = {};
  const flags = new Set<string>();
  const allowedValueNames = new Set([...requiredNames, ...optionalNames]);
  const allowedFlagNames = new Set(flagNames);

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg) {
      continue;
    }
    if (allowedFlagNames.has(arg)) {
      flags.add(arg);
      continue;
    }

    if (allowedValueNames.has(arg)) {
      const value = args[index + 1];
      if (!value) {
        return { error: `${arg} requires value` };
      }
      if (requiredNames.includes(arg)) {
        required[arg] = value;
      } else {
        optional[arg] = value;
      }
      index += 1;
      continue;
    }

    return { error: `Unknown option: ${arg}` };
  }

  for (const name of requiredNames) {
    if (!required[name]) return { error: `${name} is required` };
  }

  return { required, optional, flags };
}

function scopeFromArgs(values: Record<string, string>): Scope {
  return {
    tenantId: requiredParsedValue(values, "--tenant-id"),
    workspaceId: requiredParsedValue(values, "--workspace-id"),
    userId: requiredParsedValue(values, "--user-id")
  };
}

function requiredParsedValue(values: Record<string, string>, name: string): string {
  const value = values[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function optionalPositiveIntegerValue(
  value: string | undefined,
  name: string
): { value?: number } | { error: string } {
  if (value === undefined) return {};
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { error: `${name} must be a positive integer` };
  }
  return { value: parsed };
}

function optionalSecretFromEnv(
  envName: string | undefined,
  optionName: string
): { value?: string } | { error: string } {
  if (envName === undefined) return {};
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(envName)) {
    return { error: `${optionName} must name an environment variable` };
  }
  const value = process.env[envName];
  if (!value) {
    return { error: `${optionName} environment variable is not set: ${envName}` };
  }
  return { value };
}

async function writeFileWithDirectory(path: string, data: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, data);
}

function writeCommandResult(
  io: CliIO,
  json: boolean,
  result: unknown,
  message: string
): void {
  if (json) {
    io.stdout(JSON.stringify(result, null, 2));
    return;
  }

  io.stdout(message);
}

function writeMigrationDryRun(
  io: CliIO,
  migrations: readonly PostgresMigration[],
  json: boolean
): void {
  if (json) {
    io.stdout(
      JSON.stringify(
        {
          dryRun: true,
          migrations: migrations.map(({ version, name }) => ({ version, name }))
        },
        null,
        2
      )
    );
    return;
  }

  io.stdout(
    [
      "PostgreSQL migration dry run.",
      ...migrations.map((migration) => `${migration.version} ${migration.name}`)
    ].join("\n")
  );
}

function formatVersions(versions: readonly number[]): string {
  return versions.length === 0 ? "none" : versions.join(", ");
}

function helpText(): string {
  return [
    "Usage:",
      "  postgres:migrate [--dry-run] [--json] [--migrations-dir <path>]",
    "  sqlite:backup --database <path> --backup <path> [--encrypt-key-env <ENV>] [--json]",
    "  sqlite:restore --backup <path> --restore <path> --tenant-id <id> --workspace-id <id> --user-id <id> [--decrypt-key-env <ENV>] [--overwrite --confirm <tenant/workspace/user/overwrite/restore-path>] [--json]",
    "  sqlite:export --database <path> --tenant-id <id> --workspace-id <id> --user-id <id> [--output <path>]",
    "  sqlite:delete-workspace --database <path> --tenant-id <id> --workspace-id <id> --user-id <id> --confirm <tenant/workspace/user> [--json]",
    "  retention:policy [--as-of <iso-date>] [--json]",
    " retention:operator-packet --backend <sqlite|postgres> --tenant-id <id> --workspace-id <id> --user-id <id> --as-of <iso-date> [--database <path>] [--json]",
    " retention:hosted-cleanup-packet --environment <name> --tenant-id <id> --workspace-id <id> --user-id <id> --as-of <iso-date> --window-start <iso-date> --window-end <iso-date> --dry-run-evidence <label> --backup-evidence <label> --approval-record <label> --legal-support-review <label> --rollback-plan <label> --second-operator <label> [--json]",
    " auth:production-readiness-packet --environment <name> --backend <sqlite|postgres> --tenant-id <id> --workspace-id <id> --user-id <id> --as-of <iso-date> --identity-provider <name> --session-store <name> --authorization-matrix <name> --role-membership-proof <name> --session-lifecycle <name> --reset-token-lifecycle <name> --lockout-pruning <name> --cookie-transport <name> --startup-guard <name> --migration-plan <name> --rollback-drill <name> --remote-ci <name> --rollback-plan <name> --second-operator <name> [--json]",
    " auth:authorization-matrix-packet --matrix <name> --environment <name> --backend <sqlite|postgres> --tenant-id <id> --workspace-id <id> --user-id <id> --as-of <iso-date> [--json]",
    " rate-limit:production-readiness-packet --environment <name> --tenant-id <id> --workspace-id <id> --user-id <id> --as-of <iso-date> --edge-layer <name> --store <name> --provider-quota-policy <name> --trusted-proxy-proof <name> --hosted-alert-routing <name> --hosted-dashboard <name> --abuse-analytics <name> --remote-ci <name> --rollback-plan <name> --second-operator <name> [--json]",
    "  providers:lifecycle-readiness-packet --environment <name> --provider <name> --tenant-id <id> --workspace-id <id> --user-id <id> --as-of <iso-date> --managed-secret-custody <label> --rotation-drill <label> --revocation-drill <label> --write-back-safety <label> --hosted-alert-routing <label> --provider-runbook <label> --remote-ci <label> --rollback-plan <label> --second-operator <label> [--json]",
    "  calendar-ui:production-readiness-packet --environment <name> --tenant-id <id> --workspace-id <id> --user-id <id> --as-of <iso-date> --browser-matrix <label> --conflict-workflow <label> --write-back-acknowledgement <label> --accessibility-audit <label> --responsive-polish <label> --visual-regression <label> --product-owner-approval <label> --remote-ci <label> --rollback-plan <label> --second-operator <label> [--json]",
    "  web-app:production-readiness-packet --environment <name> --tenant-id <id> --workspace-id <id> --user-id <id> --as-of <iso-date> --deployment-target <label> --production-build <label> --authenticated-write-flow <label> --security-headers <label> --csrf-cookie-transport <label> --throttle-policy <label> --durable-storage <label> --cache-policy <label> --health-startup-guard <label> --browser-matrix <label> --accessibility-audit <label> --responsive-polish <label> --visual-regression <label> --operator-review <label> --remote-ci <label> --rollback-plan <label> --second-operator <label> [--json]",
    "  deployment:production-readiness-packet --environment <name> --tenant-id <id> --workspace-id <id> --user-id <id> --as-of <iso-date> --deployment-topology <label> --tls-termination <label> --reverse-proxy-headers <label> --security-headers <label> --startup-guards <label> --health-checks <label> --durable-storage <label> --cookie-csrf-transport <label> --trusted-proxy-throttle <label> --static-asset-cache <label> --log-redaction <label> --backup-rollback <label> --remote-ci-deployment-smoke <label> --operator-review <label> --second-operator <label> [--json]",
    "  ics:production-readiness-packet --environment <name> --tenant-id <id> --workspace-id <id> --user-id <id> --as-of <iso-date> --recurrence-suite <name> --timezone-dst-proof <name> --sync-idempotency <name> --import-preview-ux <name> --export-privacy-redaction <name> --write-back-conflict-preview <name> --provider-neutral-contract <name> --provider-fixture-suite <name> --large-calendar-fixture <name> --browser-workflow <name> --remote-ci <name> --rollback-plan <name> --second-operator <name> [--json]",
    "  provider-csv:production-readiness-packet --environment <name> --tenant-id <id> --workspace-id <id> --user-id <id> --as-of <iso-date> --fixture-suite <name> --download-upload-workflow <name> --confirmation-ux <name> --provider-policy <name> --browser-workflow <name> --abuse-analytics <name> --large-fixture-suite <name> --formula-injection-regression <name> --field-mapping-privacy <name> --remote-ci <name> --rollback-plan <name> --second-operator <name> [--json]",
    "  public-events:hosted-delivery-readiness-packet --environment <name> --tenant-id <id> --workspace-id <id> --user-id <id> --as-of <iso-date> --secret-provider <name> --runtime-identity <name> --rotation-drill <name> --worker-topology <name> --retry-queue <name> --dead-letter-queue <name> --hosted-dashboard <name> --alert-routing <name> --replay-boundary <name> --rate-limit-header-key <name> --incident-drill <name> --remote-ci <name> --rollback-plan <name> --second-operator <name> [--json]",
    "  public-events:delivery-operator-packet --tenant-id <id> --workspace-id <id> --user-id <id> --as-of <iso-date> [--type <event-type>] [--source-system <source>] [--max-subscriptions <n>] [--max-events <n>] [--json]",
    "  public-events:dead-letter-queue-packet --tenant-id <id> --workspace-id <id> --user-id <id> --as-of <iso-date> [--max-attempts <n>] [--type <event-type>] [--status <UNREVIEWED|REVIEWED>] [--json]",
    "  retention:sqlite-cleanup --database <path> --tenant-id <id> --workspace-id <id> --user-id <id> --as-of <iso-date> [--apply --confirm <tenant/workspace/user/as-of-iso>] [--json]",
    "  retention:postgres-cleanup --tenant-id <id> --workspace-id <id> --user-id <id> --as-of <iso-date> [--apply --confirm <tenant/workspace/user/as-of-iso>] [--json]",
    "",
    "The packaged script runs a dry run. Set SCHEDULEOS_POSTGRES_URL to apply migrations with postgres:migrate."
  ].join("\n");
}

const executedPath = process.argv[1] ? resolve(process.argv[1]) : undefined;
const modulePath = fileURLToPath(import.meta.url);

if (executedPath === modulePath) {
  const exitCode = await runCli(process.argv.slice(2));
  process.exitCode = exitCode;
}
