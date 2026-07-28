#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const publicChecklistPath = path.join(root, "docs", "public-release-checklist.md");
const approvalChecklistPath = path.join(root, "docs", "security", "remote-ci-postgresql-approval-checklist.md");
const contractDocPath = path.join(root, "docs", "security", "remote-ci-postgresql-evidence-contract.md");
const contractSourcePath = path.join(root, "src", "remote-ci-postgresql-evidence-contract.ts");
const contractTestPath = path.join(root, "src", "remote-ci-postgresql-evidence-contract.test.ts");
const workflowPath = path.join(root, ".github", "workflows", "ci.yml");
const auditPath = path.join(root, "docs", "release-audit", "REMOTE_CI_POSTGRESQL_APPROVAL_GUARD_20260727.md");

const blocker = "Successful remote CI PostgreSQL proof";

const publicChecklist = readRequired(publicChecklistPath);
const approvalChecklist = readRequired(approvalChecklistPath);
const contractDoc = readRequired(contractDocPath);
const contractSource = readRequired(contractSourcePath);
const contractTest = readRequired(contractTestPath);
const workflow = readRequired(workflowPath);
const audit = readRequired(auditPath);

requireText(
  approvalChecklist,
  "Current result: `FAIL`.",
  "remote CI PostgreSQL approval checklist must remain FAIL until hosted CI evidence is reviewed."
);
requireText(
  approvalChecklist,
  "No public repository, hosted deployment, tag, package publication, or release announcement may rely on remote CI PostgreSQL proof until this checklist changes to `PASS`.",
  "remote CI PostgreSQL approval checklist must preserve the release-use prohibition."
);
requireText(
  approvalChecklist,
  `Do not mark "${blocker}" complete until this checklist changes from \`FAIL\` to \`PASS\` with current release-candidate evidence.`,
  "remote CI PostgreSQL approval checklist must preserve the explicit public checklist release rule."
);

const uncheckedPattern = new RegExp(`^- \\[ \\] ${escapeRegExp(blocker)}\\.?$`, "mu");
const checkedPattern = new RegExp(`^- \\[x\\] ${escapeRegExp(blocker)}\\.?$`, "mui");
if (!uncheckedPattern.test(publicChecklist)) {
  failures.push(`public release checklist must keep unchecked remote CI PostgreSQL blocker: ${blocker}`);
}
if (checkedPattern.test(publicChecklist)) {
  failures.push(`public release checklist checked remote CI PostgreSQL proof prematurely: ${blocker}`);
}

for (const expected of [
  "workflow",
  "postgresService",
  "migrationsAndTests",
  "failureVisibility",
  "retryTimeoutRollback",
  "sanitization",
  "operations"
]) {
  requireText(
    contractSource,
    expected,
    `remote CI PostgreSQL evidence contract source must keep ${expected} coverage.`
  );
}

for (const expected of [
  "publicRepositoryRun",
  "disposableServiceContainer",
  "cleanDatabaseMigrationApply",
  "tenantIsolationRegression",
  "jobLogsRetained",
  "artifactsRetained",
  "noRawDatabaseUrls",
  "noDatabasePasswords",
  "noPrivateLeadershipSystemMaterial",
  "secondOperatorReview"
]) {
  requireText(
    contractSource,
    expected,
    `remote CI PostgreSQL evidence contract must keep ${expected} requirement.`
  );
}

for (const expected of [
  "postgres:16-alpine",
  "SCHEDULEOS_TEST_POSTGRES_URL",
  "npm run test:postgres:live"
]) {
  requireText(workflow, expected, `.github/workflows/ci.yml must keep ${expected} remote PostgreSQL proof foundation.`);
}

requireText(
  contractDoc,
  "does not create a remote repository",
  "remote CI PostgreSQL contract documentation must state it is review-only."
);
requireText(
  contractTest,
  "validateRemoteCiPostgresqlEvidence",
  "remote CI PostgreSQL evidence contract tests must exercise validateRemoteCiPostgresqlEvidence."
);
requireText(
  audit,
  "This is not remote CI PostgreSQL approval.",
  "remote CI PostgreSQL guard audit must preserve the non-approval caveat."
);

if (failures.length > 0) {
  console.error("Remote CI PostgreSQL approval guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Remote CI PostgreSQL approval guard passed.");

function readRequired(filePath) {
  if (!existsSync(filePath)) {
    failures.push(`${path.relative(root, filePath)} is missing.`);
    return "";
  }
  return readFileSync(filePath, "utf8");
}

function requireText(text, expected, message) {
  if (!text.includes(expected)) {
    failures.push(message);
  }
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
