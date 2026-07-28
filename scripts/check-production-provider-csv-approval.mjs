#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const publicChecklistPath = path.join(root, "docs", "public-release-checklist.md");
const approvalChecklistPath = path.join(root, "docs", "security", "production-provider-csv-approval-checklist.md");
const contractDocPath = path.join(root, "docs", "security", "production-provider-csv-evidence-contract.md");
const contractSourcePath = path.join(root, "src", "production-provider-csv-evidence-contract.ts");
const contractTestPath = path.join(root, "src", "production-provider-csv-evidence-contract.test.ts");
const fixtureAuditPath = path.join(root, "docs", "release-audit", "PROVIDER_CSV_EXPORT_FIXTURE_REGRESSION_20260727.md");
const contractAuditPath = path.join(root, "docs", "release-audit", "PRODUCTION_PROVIDER_CSV_EVIDENCE_CONTRACT_20260727.md");
const guardAuditPath = path.join(root, "docs", "release-audit", "PRODUCTION_PROVIDER_CSV_APPROVAL_GUARD_20260727.md");

const publicChecklist = readRequired(publicChecklistPath);
const approvalChecklist = readRequired(approvalChecklistPath);
const contractDoc = readRequired(contractDocPath);
const contractSource = readRequired(contractSourcePath);
const contractTest = readRequired(contractTestPath);
const fixtureAudit = readRequired(fixtureAuditPath);
const contractAudit = readRequired(contractAuditPath);
const guardAudit = readRequired(guardAuditPath);

requireText(
  approvalChecklist,
  "Current result: `FAIL`.",
  "production provider CSV approval checklist must remain FAIL until release-candidate evidence is reviewed."
);

requireText(
  publicChecklist,
  "- [ ] Production-grade provider CSV import workflow:",
  "public release checklist must keep the production-grade provider CSV blocker unchecked."
);

for (const expected of [
  "No public repository",
  "hosted deployment",
  "package publication",
  "production provider CSV imports",
  "`PASS`"
]) {
  requireText(approvalChecklist, expected, `production provider CSV checklist must keep release prohibition concept: ${expected}`);
}

for (const expected of [
  "Do not mark \"Production-grade provider CSV import workflow\" complete",
  "`FAIL`",
  "`PASS`",
  "release-candidate evidence"
]) {
  requireText(approvalChecklist, expected, `production provider CSV checklist must keep blocker release rule concept: ${expected}`);
}

for (const expected of [
  "Real-provider export fixture suite",
  "Download/upload workflow proof",
  "Provider-specific confirmation UX proof",
  "Production provider quota governance proof",
  "Browser workflow proof",
  "Hosted abuse analytics proof",
  "Large fixture suite proof",
  "Formula-injection regression proof",
  "Field-mapping privacy proof",
  "Remote CI proof",
  "Rollback plan",
  "Second operator"
]) {
  requireText(approvalChecklist, expected, `production provider CSV checklist must keep required evidence concept: ${expected}`);
}

for (const expected of [
  "does not approve production imports",
  "validates evidence shape only",
  "Provider fixture breadth",
  "Todoist",
  "Linear",
  "Asana",
  "ClickUp",
  "Trello",
  "Microsoft Planner",
  "GitHub Issues",
  "Download/upload workflow proof",
  "Provider-specific confirmation UX evidence",
  "Provider quota governance",
  "hosted abuse analytics",
  "Formula-injection regression",
  "Content-minimized logs",
  "Remote CI",
  "second-operator review",
  "release status remains `FAIL`"
]) {
  requireText(contractDoc, expected, `production provider CSV evidence contract documentation must keep boundary concept: ${expected}`);
}

for (const expected of [
  "validateProductionProviderCsvEvidence",
  "REQUIRED_PROVIDERS",
  "REQUIRED_WORKFLOW_STEPS",
  "REQUIRED_ABUSE_SIGNALS",
  "secondOperatorReview"
]) {
  requireText(contractSource, expected, `production provider CSV evidence contract source must keep ${expected}.`);
}

requireText(
  contractTest,
  "validateProductionProviderCsvEvidence",
  "production provider CSV evidence contract tests must exercise validateProductionProviderCsvEvidence."
);

for (const expected of [
  "Local evidence only",
  "Todoist",
  "Linear",
  "Asana",
  "ClickUp",
  "Trello",
  "Microsoft Planner",
  "GitHub Issues",
  "does not approve production provider CSV import"
]) {
  requireText(fixtureAudit, expected, `provider CSV fixture audit must preserve local-only evidence: ${expected}`);
}

for (const expected of [
  "This is not production provider CSV import approval",
  "does not use real provider exports",
  "does not",
  "change final release status"
]) {
  requireText(contractAudit, expected, `production provider CSV evidence audit must preserve non-approval boundary: ${expected}`);
}

requireText(
  guardAudit,
  "This is not production provider CSV import approval.",
  "production provider CSV approval guard audit must preserve non-approval caveat."
);

if (failures.length > 0) {
  console.error("Production provider CSV approval guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Production provider CSV approval guard passed.");

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
