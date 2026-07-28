#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const publicChecklistPath = path.join(root, "docs", "public-release-checklist.md");
const authChecklistPath = path.join(root, "docs", "security", "production-auth-approval-checklist.md");
const authContractDocPath = path.join(root, "docs", "security", "production-auth-evidence-contract.md");
const authContractSourcePath = path.join(root, "src", "production-auth-evidence-contract.ts");
const authContractTestPath = path.join(root, "src", "production-auth-evidence-contract.test.ts");
const auditPath = path.join(root, "docs", "release-audit", "PRODUCTION_AUTH_APPROVAL_GUARD_20260727.md");

const authBlocker =
  "Production persisted auth, roles, memberships, and session model approved for public release";

const publicChecklist = readRequired(publicChecklistPath);
const authChecklist = readRequired(authChecklistPath);
const authContractDoc = readRequired(authContractDocPath);
const authContractSource = readRequired(authContractSourcePath);
const authContractTest = readRequired(authContractTestPath);
const audit = readRequired(auditPath);

requireText(
  authChecklist,
  "Current result: `FAIL`.",
  "production auth approval checklist must remain FAIL until final release-candidate evidence is reviewed."
);
requireText(
  authChecklist,
  "No public repository, hosted deployment, tag, package publication, or release announcement may rely on production auth until this checklist changes to `PASS`.",
  "production auth approval checklist must preserve the release-use prohibition."
);
requireText(
  authChecklist,
  `Do not mark "${authBlocker}" complete until this checklist changes from \`FAIL\` to \`PASS\` with current release-candidate evidence.`,
  "production auth approval checklist must preserve the explicit public checklist release rule."
);

const uncheckedPattern = new RegExp(`^- \\[ \\] ${escapeRegExp(authBlocker)}`, "mu");
const checkedPattern = new RegExp(`^- \\[x\\] ${escapeRegExp(authBlocker)}`, "mui");
if (!uncheckedPattern.test(publicChecklist)) {
  failures.push(`public release checklist must keep auth blocker unchecked: ${authBlocker}`);
}
if (checkedPattern.test(publicChecklist)) {
  failures.push(`public release checklist checked production auth blocker prematurely: ${authBlocker}`);
}

for (const expected of [
  "identity",
  "sessionStore",
  "authorization",
  "resetTokens",
  "transport",
  "lockoutRetention",
  "operations",
  "browser",
  "secondOperatorReview"
]) {
  requireText(
    authContractSource,
    expected,
    `production auth evidence contract source must keep ${expected} evidence coverage.`
  );
}

for (const expected of [
  "OWNER",
  "ADMIN",
  "EDITOR",
  "VIEWER",
  "DISABLED_USER",
  "INACTIVE_MEMBERSHIP",
  "CROSS_TENANT",
  "CROSS_WORKSPACE",
  "CROSS_USER"
]) {
  requireText(
    authContractSource,
    expected,
    `production auth evidence contract must keep authorization matrix role ${expected}.`
  );
}

requireText(
  authContractDoc,
  "does not configure an identity provider",
  "production auth evidence contract documentation must state it is review-only."
);
requireText(
  authContractTest,
  "validateProductionAuthEvidence",
  "production auth evidence contract tests must exercise validateProductionAuthEvidence."
);
requireText(
  audit,
  "This is not production auth approval.",
  "production auth approval guard audit must preserve the non-approval caveat."
);

if (failures.length > 0) {
  console.error("Production auth approval guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Production auth approval guard passed.");

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
