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
  "final-security-audit-approval-checklist.md"
);
const evidenceContractPath = path.join(
  root,
  "docs",
  "security",
  "final-security-audit-evidence-contract.md"
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
  "FINAL_SECURITY_AUDIT_APPROVAL_GUARD_20260727.md"
);

const publicChecklist = readRequired(publicChecklistPath);
const approvalChecklist = readRequired(approvalChecklistPath);
const evidenceContract = readRequired(evidenceContractPath);
const finalReleaseChecklist = readRequired(finalReleaseChecklistPath);
const packageJson = readRequired(packagePath);
const cliSource = readRequired(cliPath);
const cliTest = readRequired(cliTestPath);
const guardAudit = readRequired(guardAuditPath);

if (process.env.SCHEDULEOS_REQUIRE_NO_GIT === "true" && existsSync(path.join(root, ".git"))) {
  failures.push(".git directory exists before final security audit approval.");
}

requireText(
  approvalChecklist,
  "Current result: `FAIL`.",
  "final security audit checklist must remain FAIL until release-candidate evidence is accepted."
);

for (const expected of [
  "No public repository, hosted deployment, tag, package publication, or release announcement may rely on the final security audit",
  "Dependency audit final pass proof",
  "Secret scan proof",
  "Privacy/private-data scan proof",
  "Production auth/session approval checklist is `PASS`",
  "Production rate-limit and abuse-monitoring approval checklist is `PASS`",
  "Provider managed-secret and lifecycle approvals are `PASS`",
  "Production deployment TLS/proxy/header proof",
  "Remote CI proof",
  "Security policy contact is configured",
  "Final source review",
  "second-operator proof",
]) {
  requireText(
    approvalChecklist,
    expected,
    `final security audit checklist must preserve required evidence: ${expected}`
  );
}

for (const expected of [
  "Current result: `FAIL`.",
  "does not mark the security audit `PASS`",
  "Dependency and supply-chain proof",
  "Release scans",
  "Auth and access proof",
  "Abuse and provider-security proof",
  "Deployment and operations proof",
  "Remote CI and repository proof",
  "Disclosure and final review proof",
  "Release Boundary",
]) {
  requireText(
    evidenceContract,
    expected,
    `final security evidence contract must preserve boundary: ${expected}`
  );
}

requireText(
  finalReleaseChecklist,
  "Final security audit `PASS` proof",
  "final release gate checklist must depend on final security audit PASS proof."
);

requireText(
  publicChecklist,
  "- [ ] Security audit status changed `FAIL` to `PASS`.",
  "public release checklist must keep final security audit PASS unchecked."
);
requireText(
  publicChecklist,
  "- [x] Final security audit approval guard foundation",
  "public release checklist must record final security audit approval guard foundation."
);

for (const expected of [
  "security:final-audit-readiness-packet",
  "security:final-audit-approval:check",
]) {
  requireText(packageJson, expected, `package.json must keep final security audit wiring: ${expected}`);
}

for (const expected of [
  "security:final-audit-readiness-packet",
  "runFinalSecurityAuditReadinessPacketCommand",
]) {
  requireText(cliSource, expected, `CLI must keep final security readiness packet: ${expected}`);
}

for (const expected of [
  "final security audit readiness packet CLI emits review evidence",
  "security:final-audit-readiness-packet",
]) {
  requireText(cliTest, expected, `CLI tests must keep final security readiness packet coverage: ${expected}`);
}

requireText(
  guardAudit,
  "This is not final security audit approval.",
  "final security audit approval guard audit must preserve non-approval caveat."
);

if (failures.length > 0) {
  console.error("Final security audit approval guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Final security audit approval guard passed.");

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
