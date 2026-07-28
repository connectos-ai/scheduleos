#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const publicChecklistPath = path.join(root, "docs", "public-release-checklist.md");
const approvalChecklistPath = path.join(root, "docs", "security", "production-managed-secret-public-event-approval-checklist.md");
const contractDocPath = path.join(root, "docs", "security", "hosted-public-event-delivery-contract.md");
const contractSourcePath = path.join(root, "src", "hosted-public-event-delivery-contract.ts");
const contractTestPath = path.join(root, "src", "hosted-public-event-delivery-contract.test.ts");
const contractAuditPath = path.join(root, "docs", "release-audit", "HOSTED_PUBLIC_EVENT_DELIVERY_CONTRACT_20260727.md");
const guardAuditPath = path.join(root, "docs", "release-audit", "HOSTED_PUBLIC_EVENT_APPROVAL_GUARD_20260727.md");

const publicChecklist = readRequired(publicChecklistPath);
const approvalChecklist = readRequired(approvalChecklistPath);
const contractDoc = readRequired(contractDocPath);
const contractSource = readRequired(contractSourcePath);
const contractTest = readRequired(contractTestPath);
const contractAudit = readRequired(contractAuditPath);
const guardAudit = readRequired(guardAuditPath);

requireText(
  approvalChecklist,
  "Current result: `FAIL`.",
  "hosted public-event approval checklist must remain FAIL until release-candidate evidence is reviewed."
);

requireText(
  publicChecklist,
  "- [ ] Production managed secret storage and durable hosted public-event workers/observability.",
  "public release checklist must keep hosted public-event worker blocker unchecked."
);

for (const expected of [
  "No public repository",
  "hosted deployment",
  "package publication",
  "hosted public-event delivery",
  "`PASS`"
]) {
  requireText(approvalChecklist, expected, `hosted public-event checklist must keep release prohibition concept: ${expected}`);
}

for (const expected of [
  "Do not mark \"Production managed secret storage",
  "public-event workers/observability\" complete",
  "`FAIL`",
  "`PASS`",
  "release-candidate evidence"
]) {
  requireText(approvalChecklist, expected, `hosted public-event checklist must keep blocker release rule concept: ${expected}`);
}

for (const expected of [
  "managed-secret provider",
  "runtime identity",
  "rotation",
  "revocation",
  "worker topology",
  "retry queue",
  "dead-letter queue",
  "hosted dashboard",
  "alert routing",
  "replay boundary",
  "incident drill",
  "Remote CI proof",
  "Second operator"
]) {
  requireText(approvalChecklist, expected, `hosted public-event checklist must keep required evidence concept: ${expected}`);
}

for (const expected of [
  "does not configure managed secrets",
  "start hosted workers",
  "create queues",
  "send alerts",
  "review shape only",
  "Managed secret provider",
  "Managed secret refs only",
  "Runtime identity",
  "Worker topology",
  "Idempotent delivery",
  "Durable retry queue",
  "dead-letter queue",
  "Hosted dashboard",
  "Alerts for failed attempts",
  "Incident drills",
  "release status remains `FAIL`"
]) {
  requireText(contractDoc, expected, `hosted public-event contract documentation must keep boundary concept: ${expected}`);
}

for (const expected of [
  "validateHostedPublicEventDeliveryContract",
  "REQUIRED_SIGNALS",
  "REQUIRED_ALERTS",
  "HostedDeliveryWorkerSignal",
  "secondOperatorReview"
]) {
  requireText(contractSource, expected, `hosted public-event contract source must keep ${expected}.`);
}

requireText(
  contractTest,
  "validateHostedPublicEventDeliveryContract",
  "hosted public-event contract tests must exercise validateHostedPublicEventDeliveryContract."
);

for (const expected of [
  "This is not production hosted-worker approval.",
  "does not configure managed secrets",
  "start workers",
  "create queues",
  "send alerts",
  "change final release status"
]) {
  requireText(contractAudit, expected, `hosted public-event evidence audit must preserve non-approval boundary: ${expected}`);
}

requireText(
  guardAudit,
  "This is not production hosted public-event worker approval.",
  "hosted public-event approval guard audit must preserve non-approval caveat."
);

if (failures.length > 0) {
  console.error("Hosted public-event approval guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Hosted public-event approval guard passed.");

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
