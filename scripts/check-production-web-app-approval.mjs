#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const publicChecklistPath = path.join(root, "docs", "public-release-checklist.md");
const approvalChecklistPath = path.join(root, "docs", "security", "production-web-app-approval-checklist.md");
const contractDocPath = path.join(root, "docs", "security", "production-web-app-evidence-contract.md");
const contractSourcePath = path.join(root, "src", "production-web-app-evidence-contract.ts");
const contractTestPath = path.join(root, "src", "production-web-app-evidence-contract.test.ts");
const browserSmokePath = path.join(root, "docs", "release-audit", "CALENDAR_UI_BROWSER_SMOKE_20260722.md");
const auditPath = path.join(root, "docs", "release-audit", "PRODUCTION_WEB_APP_APPROVAL_GUARD_20260727.md");

const blocker = "Standalone production web app beyond local foundations";

const publicChecklist = readRequired(publicChecklistPath);
const approvalChecklist = readRequired(approvalChecklistPath);
const contractDoc = readRequired(contractDocPath);
const contractSource = readRequired(contractSourcePath);
const contractTest = readRequired(contractTestPath);
const browserSmoke = readRequired(browserSmokePath);
const audit = readRequired(auditPath);

requireText(
  approvalChecklist,
  "Current result: `FAIL`.",
  "production web app approval checklist must remain FAIL until release-candidate evidence is reviewed."
);
requireText(
  approvalChecklist,
  "No public repository, hosted deployment, tag, package publication, or release announcement may rely on the production web app until this checklist changes to `PASS`.",
  "production web app approval checklist must preserve the release-use prohibition."
);
requireText(
  approvalChecklist,
  `Do not mark "${blocker}" complete until this checklist changes from \`FAIL\` to \`PASS\` with current release-candidate evidence.`,
  "production web app approval checklist must preserve the explicit public checklist release rule."
);

const uncheckedPattern = new RegExp(`^- \\[ \\] ${escapeRegExp(blocker)}`, "mu");
const checkedPattern = new RegExp(`^- \\[x\\] ${escapeRegExp(blocker)}`, "mui");
if (!uncheckedPattern.test(publicChecklist)) {
  failures.push(`public release checklist must keep unchecked production web app blocker: ${blocker}`);
}
if (checkedPattern.test(publicChecklist)) {
  failures.push(`public release checklist checked production web app blocker prematurely: ${blocker}`);
}

for (const expected of [
  "Production build artifact",
  "Deployment target",
  "Authenticated write-flow",
  "CSRF/cookie transport",
  "Request throttle",
  "Durable storage",
  "Browser matrix",
  "Accessibility audit",
  "Responsive polish",
  "Visual regression",
  "Operator review",
  "Remote CI proof",
  "Rollback plan",
  "Second operator approves"
]) {
  requireText(
    approvalChecklist,
    expected,
    `production web app approval checklist must keep required evidence item: ${expected}.`
  );
}

for (const expected of [
  "deployment",
  "authenticatedWriteFlow",
  "platformSecurity",
  "storageOperations",
  "browserQuality",
  "operations",
  "CHROME",
  "FIREFOX",
  "SAFARI",
  "MOBILE_WEBKIT",
  "secondOperatorReview"
]) {
  requireText(
    contractSource,
    expected,
    `production web app evidence contract source must keep ${expected} coverage.`
  );
}

requireText(
  contractDoc,
  "does not approve production deployment",
  "production web app evidence contract documentation must state it is review-only."
);
requireText(
  contractTest,
  "validateProductionWebAppEvidence",
  "production web app evidence contract tests must exercise validateProductionWebAppEvidence."
);
for (const expected of [
  "Desktop viewport",
  "Mobile viewport",
  "Conflict preview showed",
  "Review acknowledgement showed"
]) {
  requireText(browserSmoke, expected, `local browser smoke evidence must keep ${expected}.`);
}
requireText(
  audit,
  "This is not production web app approval.",
  "production web app approval guard audit must preserve the non-approval caveat."
);

if (failures.length > 0) {
  console.error("Production web app approval guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Production web app approval guard passed.");

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
