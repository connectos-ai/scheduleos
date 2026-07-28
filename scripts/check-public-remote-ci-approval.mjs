#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const publicChecklistPath = path.join(root, "docs", "public-release-checklist.md");
const approvalChecklistPath = path.join(root, "docs", "release", "public-remote-ci-approval-checklist.md");
const workflowPath = path.join(root, ".github", "workflows", "ci.yml");
const workflowValidatorPath = path.join(root, "src", "ci-workflow-validation.ts");
const workflowValidatorTestPath = path.join(root, "src", "ci-workflow-validation.test.ts");
const packagePath = path.join(root, "package.json");
const auditPath = path.join(root, "docs", "release-audit", "PUBLIC_REMOTE_CI_APPROVAL_GUARD_20260727.md");

const blocker = "CI run verified on public remote";

const publicChecklist = readRequired(publicChecklistPath);
const approvalChecklist = readRequired(approvalChecklistPath);
const workflow = readRequired(workflowPath);
const workflowValidator = readRequired(workflowValidatorPath);
const workflowValidatorTest = readRequired(workflowValidatorTestPath);
const packageJson = readRequired(packagePath);
const audit = readRequired(auditPath);

requireText(
  approvalChecklist,
  "Current result: `FAIL`.",
  "public remote CI approval checklist must remain FAIL until public-repository workflow evidence is reviewed."
);
requireText(
  approvalChecklist,
  "No public release, tag, package publication, hosted deployment, or release announcement may rely on public remote CI until this checklist changes to `PASS`.",
  "public remote CI approval checklist must preserve the release-use prohibition."
);
requireText(
  approvalChecklist,
  `Do not mark "${blocker}" complete until this checklist changes from \`FAIL\` to \`PASS\` with current public-repository evidence and no premature repository mutation has occurred.`,
  "public remote CI approval checklist must preserve the explicit public checklist release rule."
);

const uncheckedPattern = new RegExp(`^- \\[ \\] ${escapeRegExp(blocker)}\\.?$`, "mu");
const checkedPattern = new RegExp(`^- \\[x\\] ${escapeRegExp(blocker)}\\.?$`, "mui");
if (!uncheckedPattern.test(publicChecklist)) {
  failures.push(`public release checklist must keep unchecked public remote CI blocker: ${blocker}`);
}
if (checkedPattern.test(publicChecklist)) {
  failures.push(`public release checklist checked public remote CI blocker prematurely: ${blocker}`);
}

for (const expected of [
  "workflow run proof",
  "Production dependency audit proof",
  "No-`.git` directory proof",
  "Release safety scan proof",
  "Documentation link check proof",
  "License check proof",
  "PostgreSQL remote CI proof",
  "Log sanitization proof",
  "Artifact retention proof",
  "Branch protection or required-checks review proof",
  "Repository settings readiness proof",
  "Failure visibility and rerun/rollback proof",
  "Second operator approves"
]) {
  requireText(
    approvalChecklist,
    expected,
    `public remote CI approval checklist must keep required evidence item: ${expected}.`
  );
}

for (const expected of [
  "workflow_dispatch:",
  "pull_request:",
  "contents: read",
  "cancel-in-progress: true",
  "npm run check",
  "npm audit --omit=dev --audit-level=high",
  "npm ls --omit=dev --all",
  "GITHUB_STEP_SUMMARY",
  "postgres-live:",
  "postgres:16-alpine",
  "npm run test:postgres:live"
]) {
  requireText(workflow, expected, `.github/workflows/ci.yml must keep public remote CI foundation: ${expected}.`);
}

for (const expected of [
  "workflow_dispatch trigger",
  "release safety gate",
  "production dependency audit",
  "postgres live job",
  "pull_request_target trigger",
  "package publication"
]) {
  requireText(
    workflowValidator,
    expected,
    `CI workflow validator must keep required or forbidden pattern coverage: ${expected}.`
  );
}

requireText(
  workflowValidatorTest,
  "validateScheduleOSCiWorkflow",
  "CI workflow validator tests must exercise validateScheduleOSCiWorkflow."
);
requireText(
  packageJson,
  "ci:workflow",
  "package.json must keep local CI workflow validation script."
);
requireText(
  packageJson,
  "remote-ci:public-readiness-packet",
  "package.json must keep public remote CI readiness packet script."
);
requireText(
  audit,
  "This is not public remote CI approval.",
  "public remote CI approval guard audit must preserve the non-approval caveat."
);

if (failures.length > 0) {
  console.error("Public remote CI approval guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Public remote CI approval guard passed.");

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
