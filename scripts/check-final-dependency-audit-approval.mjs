#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const publicChecklistPath = path.join(root, "docs", "public-release-checklist.md");
const approvalChecklistPath = path.join(
  root,
  "docs",
  "security",
  "final-dependency-audit-approval-checklist.md"
);
const evidenceContractPath = path.join(
  root,
  "docs",
  "security",
  "final-dependency-audit-evidence-contract.md"
);
const runtimeInventoryPath = path.join(
  root,
  "docs",
  "security",
  "final-dependency-runtime-inventory.md"
);
const finalSecurityChecklistPath = path.join(
  root,
  "docs",
  "security",
  "final-security-audit-approval-checklist.md"
);
const finalReleaseChecklistPath = path.join(
  root,
  "docs",
  "release",
  "final-release-gate-approval-checklist.md"
);
const packagePath = path.join(root, "package.json");
const cliPath = path.join(root, "src", "cli.ts");
const cliTestPath = path.join(root, "src", "cli.test.ts");
const guardAuditPath = path.join(
  root,
  "docs",
  "release-audit",
  "FINAL_DEPENDENCY_AUDIT_APPROVAL_GUARD_20260727.md"
);

const publicChecklist = readRequired(publicChecklistPath);
const approvalChecklist = readRequired(approvalChecklistPath);
const evidenceContract = readRequired(evidenceContractPath);
const runtimeInventory = readRequired(runtimeInventoryPath);
const finalSecurityChecklist = readRequired(finalSecurityChecklistPath);
const finalReleaseChecklist = readRequired(finalReleaseChecklistPath);
const packageJson = readRequired(packagePath);
const cliSource = readRequired(cliPath);
const cliTest = readRequired(cliTestPath);
const guardAudit = readRequired(guardAuditPath);

if (existsSync(path.join(root, ".git"))) {
  failures.push(".git directory exists before final dependency audit approval.");
}

requireText(
  approvalChecklist,
  "Current result: `FAIL`.",
  "final dependency audit checklist must remain FAIL until release-candidate evidence is accepted."
);

for (const expected of [
  "No public repository, hosted deployment, tag, package publication, or release announcement may rely on the dependency audit",
  "Production dependency audit proof",
  "Lockfile proof",
  "Installed production tree proof",
  "Runtime inventory proof",
  "Dev dependency exclusion proof",
  "Override review",
  "License alignment proof",
  "Registry secret absence proof",
  "Remote CI proof",
  "second-operator approval",
]) {
  requireText(
    approvalChecklist,
    expected,
    `final dependency audit checklist must preserve required evidence: ${expected}`
  );
}

for (const expected of [
  "Current result: `FAIL`.",
  "does not install, update, remove, override, publish, or replace dependencies",
  "npm audit --omit=dev --audit-level=high",
  "npm ls --omit=dev --all",
  "Release Boundary",
]) {
  requireText(
    evidenceContract,
    expected,
    `final dependency evidence contract must preserve boundary: ${expected}`
  );
}

for (const expected of [
  "Direct Production Dependencies",
  "Production Lockfile Packages",
  "Development Dependencies",
  "Release Boundary",
]) {
  requireText(
    runtimeInventory,
    expected,
    `runtime inventory must preserve final dependency audit review field: ${expected}`
  );
}

requireText(
  finalSecurityChecklist,
  "Dependency audit final pass proof",
  "final security audit checklist must depend on dependency audit final pass."
);
requireText(
  finalReleaseChecklist,
  "Final dependency audit `PASS` proof",
  "final release gate checklist must depend on dependency audit final pass."
);

requireText(
  publicChecklist,
  "- [ ] Dependency audit final pass.",
  "public release checklist must keep dependency audit final pass unchecked."
);
requireText(
  publicChecklist,
  "- [x] Final dependency audit approval guard foundation",
  "public release checklist must record final dependency audit approval guard foundation."
);

for (const expected of [
  "dependency:final-audit-readiness-packet",
  "dependency:final-audit-approval:check",
  "dependency:runtime-inventory:check",
]) {
  requireText(packageJson, expected, `package.json must keep dependency audit wiring: ${expected}`);
}

for (const expected of [
  "dependency:final-audit-readiness-packet",
  "runDependencyAuditReadinessPacketCommand",
]) {
  requireText(cliSource, expected, `CLI must keep dependency readiness packet: ${expected}`);
}

for (const expected of [
  "dependency:final-audit-readiness-packet",
  "dependency audit readiness packet CLI emits review evidence",
]) {
  requireText(cliTest, expected, `CLI tests must keep dependency readiness packet coverage: ${expected}`);
}

requireText(
  guardAudit,
  "This is not final dependency audit approval.",
  "final dependency audit approval guard audit must preserve non-approval caveat."
);

if (failures.length > 0) {
  console.error("Final dependency audit approval guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Final dependency audit approval guard passed.");

function readRequired(filePath) {
  try {
    return readFileSync(filePath, "utf8");
  } catch (error) {
    failures.push(`Missing required file: ${path.relative(root, filePath)}`);
    return "";
  }
}

function requireText(text, expected, message) {
  if (!text.includes(expected)) {
    failures.push(message);
  }
}
