#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const publicChecklistPath = path.join(root, "docs", "public-release-checklist.md");
const approvalChecklistPath = path.join(root, "docs", "security", "production-ics-approval-checklist.md");
const contractDocPath = path.join(root, "docs", "security", "production-ics-evidence-contract.md");
const contractSourcePath = path.join(root, "src", "production-ics-evidence-contract.ts");
const contractTestPath = path.join(root, "src", "production-ics-evidence-contract.test.ts");
const fixtureAuditPath = path.join(root, "docs", "release-audit", "ICS_PROVIDER_FIXTURE_IDEMPOTENCY_20260727.md");
const contractAuditPath = path.join(root, "docs", "release-audit", "PRODUCTION_ICS_EVIDENCE_CONTRACT_20260727.md");
const guardAuditPath = path.join(root, "docs", "release-audit", "PRODUCTION_ICS_APPROVAL_GUARD_20260727.md");

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
  "production ICS approval checklist must remain FAIL until release-candidate evidence is reviewed."
);

requireText(
  publicChecklist,
  "- [ ] Release-grade ICS workflow:",
  "public release checklist must keep the release-grade ICS workflow blocker unchecked."
);

for (const expected of [
  "No public repository",
  "hosted deployment",
  "package publication",
  "production ICS sync",
  "`PASS`"
]) {
  requireText(approvalChecklist, expected, `production ICS checklist must keep release prohibition concept: ${expected}`);
}

for (const expected of [
  "Do not mark \"Release-grade ICS workflow\" complete",
  "`FAIL`",
  "`PASS`",
  "release-candidate evidence"
]) {
  requireText(approvalChecklist, expected, `production ICS checklist must keep blocker release rule concept: ${expected}`);
}

for (const expected of [
  "provider-shaped ICS fixture",
  "Google Calendar-style",
  "Outlook-style",
  "iCloud-style",
  "recurrence",
  "IANA `TZID`",
  "DST",
  "Import preview UX",
  "Export privacy redaction",
  "Write-back conflict preview",
  "Provider-neutral contract",
  "Large calendar fixture",
  "Browser workflow",
  "Remote CI proof",
  "Rollback plan",
  "Second operator"
]) {
  requireText(approvalChecklist, expected, `production ICS checklist must keep required evidence concept: ${expected}`);
}

for (const expected of [
  "does not connect to a real provider",
  "review shape only",
  "Sanitized provider fixtures",
  "Google Calendar",
  "Microsoft Outlook",
  "Apple iCloud",
  "generic ICS",
  "RDATE;VALUE=PERIOD",
  "RECURRENCE-ID",
  "Import preview before mutation",
  "Accepted-plan export and private title redaction",
  "Idempotent reimport",
  "duplicate prevention",
  "Writable calendar proof",
  "read-only refusal",
  "busy conflict preview",
  "remote CI",
  "second-operator review",
  "release status remains `FAIL`"
]) {
  requireText(contractDoc, expected, `production ICS evidence contract documentation must keep boundary concept: ${expected}`);
}

for (const expected of [
  "validateProductionIcsEvidence",
  "REQUIRED_PROVIDERS",
  "REQUIRED_WORKFLOWS",
  "REQUIRED_RECURRENCE_FEATURES",
  "secondOperatorReview"
]) {
  requireText(contractSource, expected, `production ICS evidence contract source must keep ${expected}.`);
}

requireText(
  contractTest,
  "validateProductionIcsEvidence",
  "production ICS evidence contract tests must exercise validateProductionIcsEvidence."
);

for (const expected of [
  "Local evidence only",
  "Google Calendar-style",
  "Outlook-style",
  "iCloud-style",
  "idempotently",
  "does not approve release-grade ICS workflow"
]) {
  requireText(fixtureAudit, expected, `ICS fixture audit must preserve local-only evidence: ${expected}`);
}

for (const expected of [
  "This is not release-grade ICS approval",
  "does not connect real providers",
  "not release-grade ICS approval"
]) {
  requireText(contractAudit, expected, `production ICS evidence audit must preserve non-approval boundary: ${expected}`);
}

requireText(
  guardAudit,
  "This is not release-grade ICS approval.",
  "production ICS approval guard audit must preserve non-approval caveat."
);

if (failures.length > 0) {
  console.error("Production ICS approval guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Production ICS approval guard passed.");

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
