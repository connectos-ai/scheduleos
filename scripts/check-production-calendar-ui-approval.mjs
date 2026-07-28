#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const publicChecklistPath = path.join(root, "docs", "public-release-checklist.md");
const approvalChecklistPath = path.join(root, "docs", "security", "production-calendar-ui-approval-checklist.md");
const contractDocPath = path.join(root, "docs", "security", "production-calendar-ui-evidence-contract.md");
const contractSourcePath = path.join(root, "src", "production-calendar-ui-evidence-contract.ts");
const contractTestPath = path.join(root, "src", "production-calendar-ui-evidence-contract.test.ts");
const browserSmokePath = path.join(root, "docs", "release-audit", "CALENDAR_UI_BROWSER_SMOKE_20260722.md");
const auditPath = path.join(root, "docs", "release-audit", "PRODUCTION_CALENDAR_UI_APPROVAL_GUARD_20260727.md");

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
  "production calendar UI approval checklist must remain FAIL until release-candidate evidence is reviewed."
);

requireText(
  publicChecklist,
  "- [ ] Production calendar UI hardening:",
  "public release checklist must keep the production calendar UI blocker unchecked."
);

for (const expected of [
  "No public repository",
  "hosted deployment",
  "package publication",
  "production calendar UI",
  "`PASS`"
]) {
  requireText(approvalChecklist, expected, `production calendar UI checklist must keep release prohibition concept: ${expected}`);
}

for (const expected of [
  "Do not mark \"Production calendar UI hardening\" complete",
  "`FAIL`",
  "`PASS`",
  "release-candidate evidence"
]) {
  requireText(approvalChecklist, expected, `production calendar UI checklist must keep blocker release rule concept: ${expected}`);
}

for (const expected of [
  "Browser matrix",
  "Chrome",
  "Firefox",
  "Safari",
  "mobile viewport",
  "Interactive conflict-preview workflow",
  "conflicted writes",
  "read-only calendars",
  "stale previews",
  "server-side refusal",
  "Accessibility audit",
  "Responsive polish",
  "Visual regression",
  "Product-owner visual approval",
  "Remote CI proof",
  "Rollback plan",
  "Second operator"
]) {
  requireText(approvalChecklist, expected, `production calendar UI checklist must keep required evidence concept: ${expected}`);
}

for (const expected of [
  "does not approve production UI",
  "Browser matrix",
  "Chrome",
  "Firefox",
  "Safari",
  "mobile WebKit",
  "Conflict workflow",
  "busy conflicts",
  "read-only calendars",
  "stale previews",
  "server-side refusal",
  "Accessibility audit",
  "keyboard navigation",
  "screen-reader semantics",
  "Responsive review",
  "Visual regression states",
  "write-back-ready states",
  "second-operator review"
]) {
  requireText(contractDoc, expected, `production calendar UI evidence contract documentation must keep boundary concept: ${expected}`);
}

for (const expected of [
  "validateProductionCalendarUiEvidence",
  "REQUIRED_BROWSERS",
  "REQUIRED_CONFLICT_SCENARIOS",
  "REQUIRED_VISUAL_STATES",
  "secondOperatorReview"
]) {
  requireText(contractSource, expected, `production calendar UI evidence contract source must keep ${expected}.`);
}

requireText(
  contractTest,
  "validateProductionCalendarUiEvidence",
  "production calendar UI evidence contract tests must exercise validateProductionCalendarUiEvidence."
);

for (const expected of [
  "Desktop viewport",
  "Mobile viewport",
  "draggable",
  "Conflict preview",
  "Review acknowledgement"
]) {
  requireText(browserSmoke, expected, `local calendar UI smoke evidence must keep ${expected}.`);
}

requireText(
  audit,
  "This is not production calendar UI approval.",
  "production calendar UI approval guard audit must preserve non-approval caveat."
);

if (failures.length > 0) {
  console.error("Production calendar UI approval guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Production calendar UI approval guard passed.");

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
