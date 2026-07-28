#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const files = {
  workflow: ".github/workflows/ci.yml",
  workflowValidator: "src/ci-workflow-validation.ts",
  workflowValidatorTest: "src/ci-workflow-validation.test.ts",
  approvalChecklist: "docs/release/public-remote-ci-approval-checklist.md",
  publicChecklist: "docs/public-release-checklist.md",
  repositorySettingsChecklist: "docs/release/repository-settings-approval-checklist.md",
  repositoryLaunchChecklist: "docs/release/public-repository-launch-approval-checklist.md",
  cleanHistoryChecklist: "docs/release/clean-public-history-approval-checklist.md",
  dependencyChecklist: "docs/security/final-dependency-audit-approval-checklist.md",
  remotePostgresChecklist: "docs/security/remote-ci-postgresql-approval-checklist.md",
  packageJson: "package.json",
  audit: "docs/release-audit/PUBLIC_REMOTE_CI_EVIDENCE_REFRESH_GUARD_20260728.md"
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, relativePath]) => [
    key,
    readRequired(relativePath)
  ])
);

if (existsSync(path.join(root, ".git"))) {
  failures.push(".git directory exists before public remote CI approval.");
}

const packageJson = parseJson(text.packageJson, "package.json");

for (const expected of [
  "workflow_dispatch:",
  "pull_request:",
  "push:",
  "- main",
  "permissions:",
  "contents: read",
  "cancel-in-progress: true",
  "timeout-minutes: 15",
  "actions/checkout@v4",
  "actions/setup-node@v4",
  "node-version: \"22\"",
  "cache: npm",
  "npm ci",
  "npm run check",
  "npm audit --omit=dev --audit-level=high",
  "npm ls --omit=dev --all",
  "GITHUB_STEP_SUMMARY",
  "public release still requires log sanitization",
  "artifact retention review",
  "branch protection",
  "repository settings",
  "clean public history",
  "second-operator approval",
  "postgres-live:",
  "postgres:16-alpine",
  "pg_isready -U scheduleos -d scheduleos_test",
  "SCHEDULEOS_TEST_POSTGRES_URL",
  "npm run test:postgres:live",
  "successful remote CI PostgreSQL proof still requires retained logs"
]) {
  requireText(text.workflow, expected, `CI workflow must preserve public remote evidence hook: ${expected}`);
}

for (const forbidden of [
  /\bpull_request_target\s*:/u,
  /\bpermissions\s*:\s*write-all\b/u,
  /\bcontents\s*:\s*write\b/u,
  /\bpackages\s*:\s*write\b/u,
  /\bpages\s*:\s*write\b/u,
  /\bid-token\s*:\s*write\b/u,
  /\bdeployments\s*:\s*write\b/u,
  /\bnpm\s+publish\b/u,
  /\bgh\s+release\b/u,
  /\bgit\s+tag\b/u,
  /\bgit\s+push\b/u,
  /\bactions\/upload-artifact@/u
]) {
  if (forbidden.test(text.workflow)) {
    failures.push(`CI workflow contains forbidden public remote mutation or artifact pattern: ${forbidden}`);
  }
}

for (const expected of [
  "workflow_dispatch trigger",
  "read-only contents permission",
  "release safety gate",
  "production dependency audit",
  "production dependency tree evidence",
  "postgres live job",
  "pull_request_target trigger",
  "contents write permission",
  "package publication",
  "tag creation",
  "release creation"
]) {
  requireText(text.workflowValidator, expected, `CI workflow validator must preserve required/forbidden coverage: ${expected}`);
}

for (const expected of [
  "validateScheduleOSCiWorkflow",
  "includes public release evidence foundations",
  "rejects unsafe release mutation patterns",
  "pull_request_target",
  "contents: write",
  "npm publish"
]) {
  requireText(text.workflowValidatorTest, expected, `CI workflow tests must preserve public remote CI coverage: ${expected}`);
}

for (const expected of [
  "Current result: `FAIL`.",
  "Public remote CI is not verified until",
  "No public release, tag, package publication, hosted deployment, or release announcement may rely on public remote CI",
  "workflow run proof",
  "production dependency audit",
  "no-`.git` proof",
  "Release safety scan proof",
  "Documentation link check proof",
  "License check proof",
  "PostgreSQL remote CI proof",
  "Log sanitization proof",
  "Artifact retention proof",
  "Branch protection or required-checks review proof",
  "Repository settings readiness proof",
  "Failure visibility and rerun/rollback proof",
  "Second operator approves public remote CI evidence packet",
  "This packet does not create repositories, initialize git, add remotes, dispatch workflows",
  "Do not mark \"CI run verified on public remote\" complete"
]) {
  requireText(text.approvalChecklist, expected, `public remote CI approval checklist must preserve non-approval evidence: ${expected}`);
}

for (const expected of [
  "- [ ] CI run verified on public remote.",
  "- [x] Public remote CI readiness packet foundation",
  "- [x] GitHub Actions CI workflow foundation",
  "- [x] Local CI workflow validation foundation",
  "- [x] Public remote CI approval guard foundation",
  "- [x] Public remote CI evidence refresh guard foundation"
]) {
  requireText(text.publicChecklist, expected, `public checklist must preserve public remote CI boundary: ${expected}`);
}

for (const [label, content, expected] of [
  ["repository settings", text.repositorySettingsChecklist, "required status checks"],
  ["repository launch", text.repositoryLaunchChecklist, "remote CI"],
  ["clean history", text.cleanHistoryChecklist, "Remote CI plan proof"],
  ["dependency audit", text.dependencyChecklist, "Remote CI proof"],
  ["remote PostgreSQL", text.remotePostgresChecklist, "Current result: `FAIL`."]
]) {
  requireText(content, expected, `${label} checklist must preserve public remote CI dependency: ${expected}`);
}

for (const expected of [
  "ci:workflow",
  "public-remote-ci:approval:check",
  "public-remote-ci:evidence-refresh:check",
  "remote-ci:public-readiness-packet"
]) {
  if (!text.packageJson.includes(expected)) {
    failures.push(`package.json must keep public remote CI wiring: ${expected}`);
  }
}

if (!packageJson.scripts?.check?.includes("npm run public-remote-ci:evidence-refresh:check")) {
  failures.push("npm run check must include public remote CI evidence refresh guard.");
}

requireText(
  text.audit,
  "This is not public remote CI approval.",
  "public remote CI evidence refresh audit must preserve non-approval caveat."
);

if (failures.length > 0) {
  console.error("Public remote CI evidence refresh guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Public remote CI evidence refresh guard passed.");

function readRequired(relativePath) {
  try {
    return readFileSync(path.join(root, relativePath), "utf8");
  } catch (error) {
    failures.push(`Missing required file: ${relativePath}`);
    return "";
  }
}

function parseJson(content, label) {
  try {
    return JSON.parse(content || "{}");
  } catch (error) {
    failures.push(`${label} must be valid JSON.`);
    return {};
  }
}

function requireText(content, expected, message) {
  if (!content.includes(expected)) {
    failures.push(message);
  }
}
