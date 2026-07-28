#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const publicChecklistPath = path.join(root, "docs", "public-release-checklist.md");
const approvalChecklistPath = path.join(root, "docs", "security", "production-hosted-retention-cleanup-approval-checklist.md");
const retentionPolicyPath = path.join(root, "docs", "security", "retention-policy.md");
const operatorRunbookPath = path.join(root, "docs", "operations", "retention-operator-runbook.md");
const destructiveApprovalSourcePath = path.join(root, "src", "destructive-approval.ts");
const destructiveApprovalTestPath = path.join(root, "src", "destructive-approval.test.ts");
const auditPath = path.join(root, "docs", "release-audit", "HOSTED_RETENTION_APPROVAL_GUARD_20260727.md");

const blocker = "Hosted retention cleanup production destructive-operation approvals";

const publicChecklist = readRequired(publicChecklistPath);
const approvalChecklist = readRequired(approvalChecklistPath);
const retentionPolicy = readRequired(retentionPolicyPath);
const operatorRunbook = readRequired(operatorRunbookPath);
const destructiveApprovalSource = readRequired(destructiveApprovalSourcePath);
const destructiveApprovalTest = readRequired(destructiveApprovalTestPath);
const audit = readRequired(auditPath);

requireText(
  approvalChecklist,
  "Current result: `FAIL`.",
  "hosted retention cleanup approval checklist must remain FAIL until production destructive-operation evidence is reviewed."
);
requireText(
  approvalChecklist,
  "No public repository, hosted deployment, tag, package publication, or release announcement may rely on hosted retention cleanup until this checklist changes to `PASS`.",
  "hosted retention cleanup approval checklist must preserve the release-use prohibition."
);
requireText(
  approvalChecklist,
  `Do not mark "${blocker}" complete until this checklist changes from \`FAIL\` to \`PASS\` with current release-candidate evidence.`,
  "hosted retention cleanup approval checklist must preserve the explicit public checklist release rule."
);

const uncheckedPattern = new RegExp(`^- \\[ \\] ${escapeRegExp(blocker)}`, "mu");
const checkedPattern = new RegExp(`^- \\[x\\] ${escapeRegExp(blocker)}`, "mui");
if (!uncheckedPattern.test(publicChecklist)) {
  failures.push(`public release checklist must keep unchecked hosted retention blocker: ${blocker}`);
}
if (checkedPattern.test(publicChecklist)) {
  failures.push(`public release checklist checked hosted retention blocker prematurely: ${blocker}`);
}

for (const expected of [
  "Hosted dry-run evidence",
  "Hosted scheduler controls",
  "Production operator visibility",
  "External approval record",
  "Legal/support review",
  "backup proof",
  "restore proof",
  "Rollback plan",
  "Audit-retention proof",
  "Remote CI proof",
  "Second operator approves"
]) {
  requireText(
    approvalChecklist,
    expected,
    `hosted retention cleanup checklist must keep required evidence item: ${expected}.`
  );
}

for (const expected of [
  "retention:hosted-cleanup-packet",
  "applyAllowedByPacket",
  "false",
  "second-operator"
]) {
  requireText(
    operatorRunbook,
    expected,
    `retention operator runbook must keep review-only hosted cleanup guidance: ${expected}.`
  );
}

requireText(
  approvalChecklist,
  "retention:destructive-approval-readiness-packet",
  "hosted retention cleanup checklist must keep destructive approval readiness packet guidance."
);

for (const expected of [
  "Hosted scheduled cleanup controls",
  "destructive-operation approval workflow",
  "review-only"
]) {
  requireText(
    retentionPolicy,
    expected,
    `retention policy documentation must keep hosted cleanup release boundary: ${expected}.`
  );
}

for (const expected of [
  "timedScopedConfirmation",
  "requireDestructiveConfirmation",
  "provided === requiredConfirmation",
  "Refusing"
]) {
  requireText(
    destructiveApprovalSource,
    expected,
    `destructive approval helper must keep exact-confirmation behavior: ${expected}.`
  );
}

requireText(
  destructiveApprovalTest,
  "requireDestructiveConfirmation",
  "destructive approval tests must exercise requireDestructiveConfirmation."
);
requireText(
  audit,
  "This is not hosted retention cleanup approval.",
  "hosted retention approval guard audit must preserve the non-approval caveat."
);

if (failures.length > 0) {
  console.error("Hosted retention approval guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Hosted retention approval guard passed.");

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
