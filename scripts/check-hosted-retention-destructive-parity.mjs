#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const files = {
  packageJson: "package.json",
  publicChecklist: "docs/public-release-checklist.md",
  approvalChecklist: "docs/security/production-hosted-retention-cleanup-approval-checklist.md",
  retentionPolicy: "docs/security/retention-policy.md",
  operatorRunbook: "docs/operations/retention-operator-runbook.md",
  destructiveApprovalSource: "src/destructive-approval.ts",
  destructiveApprovalTest: "src/destructive-approval.test.ts",
  hostedApprovalGuard: "scripts/check-hosted-retention-approval.mjs",
  audit: "docs/release-audit/HOSTED_RETENTION_DESTRUCTIVE_PARITY_GUARD_20260728.md"
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, filePath]) => [key, readRequired(filePath)])
);

const blocker = "Hosted retention cleanup production destructive-operation approvals";

if (existsSync(path.join(root, ".git"))) {
  failures.push("local .git directory must not exist before intentional clean public repository staging.");
}

requireText(text.packageJson, "\"hosted-retention:approval:check\": \"node scripts/check-hosted-retention-approval.mjs\"", "package scripts must keep hosted retention approval guard.");
requireText(text.packageJson, "\"hosted-retention:destructive-parity:check\": \"node scripts/check-hosted-retention-destructive-parity.mjs\"", "package scripts must include hosted retention destructive parity guard.");
requireText(text.packageJson, "npm run hosted-retention:approval:check && npm run hosted-retention:destructive-parity:check && npm run rate-limit:approval:check", "npm run check must run destructive parity after hosted retention approval and before rate-limit approval.");

requireUnchecked(text.publicChecklist, blocker);
requireText(text.publicChecklist, "Hosted retention destructive-operation parity guard foundation", "public release checklist must include hosted retention destructive-operation parity foundation.");

requireText(text.approvalChecklist, "Current result: `FAIL`.", "hosted retention approval checklist must remain FAIL.");
for (const expected of [
  "Hosted dry-run evidence",
  "Hosted scheduler controls",
  "Production operator visibility",
  "Rollback plan",
  "Audit-retention proof",
  "Remote CI proof",
  "Security, privacy, and licensing audits remain `PASS`",
  "Second operator approves the final hosted retention cleanup destructive-operation evidence packet",
  "These packets do not approve destructive operations",
  "This is not hosted retention cleanup approval."
]) {
  requireText(text.approvalChecklist + text.hostedApprovalGuard, expected, `hosted retention approval evidence boundary missing: ${expected}`);
}

for (const expected of [
  "Hosted scheduled cleanup controls and broader production destructive-operation approval workflow remain release blockers",
  "retention:hosted-cleanup-packet",
  "applyAllowedByPacket",
  "deleteAllowedByPacket",
  "false",
  "dry-run evidence",
  "backup/export evidence",
  "legal/support review",
  "second-operator approval",
  "approval records stored outside the cleanup scope",
  "Apply requires exact confirmation"
]) {
  requireText(text.retentionPolicy, expected, `retention policy must preserve destructive hosted boundary: ${expected}`);
}

for (const expected of [
  "Hosted scheduled retention cleanup",
  "remain release blockers",
  "Operators must not treat packet generation as approval to delete records",
  "tenant/workspace/user/as-of-iso",
  "Validate a backup exists before applying cleanup",
  "second operator review",
  "Hosted approval evidence must be stored outside the tenant/workspace/user cleanup scope",
  "applyAllowedByPacket",
  "deleteAllowedByPacket",
  "false"
]) {
  requireText(text.operatorRunbook, expected, `retention operator runbook must preserve destructive operation review boundary: ${expected}`);
}

for (const expected of [
  "timedScopedConfirmation",
  "restoreOverwriteConfirmation",
  "requireDestructiveConfirmation",
  "provided === requiredConfirmation",
  "Refusing"
]) {
  requireText(text.destructiveApprovalSource, expected, `destructive approval helper must keep exact-confirmation behavior: ${expected}`);
}

for (const expected of [
  "destructive approval requires exact confirmation",
  "approved",
  "Refusing workspace delete",
  "timedScopedConfirmation",
  "restoreOverwriteConfirmation"
]) {
  requireText(text.destructiveApprovalTest, expected, `destructive approval tests must keep exact-confirmation coverage: ${expected}`);
}

for (const expected of [
  "This is not hosted retention destructive-operation approval.",
  "does not mark hosted retention cleanup production destructive-operation approvals complete",
  "ScheduleOS release status remains `FAIL`"
]) {
  requireText(text.audit, expected, `audit note must preserve non-approval caveat: ${expected}`);
}

if (failures.length > 0) {
  console.error("Hosted retention destructive-operation parity guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Hosted retention destructive-operation parity guard passed.");

function readRequired(filePath) {
  const absolutePath = path.join(root, filePath);
  if (!existsSync(absolutePath)) {
    failures.push(`${filePath} is missing.`);
    return "";
  }
  return readFileSync(absolutePath, "utf8");
}

function requireText(value, expected, message) {
  if (!value.includes(expected)) {
    failures.push(message);
  }
}

function requireUnchecked(value, label) {
  const pattern = new RegExp(`^- \\[ \\] ${escapeRegExp(label)}`, "mu");
  if (!pattern.test(value)) {
    failures.push(`public release checklist must keep "${label}" unchecked.`);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
