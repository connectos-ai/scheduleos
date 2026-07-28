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
  "final-privacy-audit-approval-checklist.md"
);
const evidenceContractPath = path.join(
  root,
  "docs",
  "security",
  "final-privacy-audit-evidence-contract.md"
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
  "FINAL_PRIVACY_AUDIT_APPROVAL_GUARD_20260727.md"
);

const publicChecklist = readRequired(publicChecklistPath);
const approvalChecklist = readRequired(approvalChecklistPath);
const evidenceContract = readRequired(evidenceContractPath);
const finalReleaseChecklist = readRequired(finalReleaseChecklistPath);
const packageJson = readRequired(packagePath);
const cliSource = readRequired(cliPath);
const cliTest = readRequired(cliTestPath);
const guardAudit = readRequired(guardAuditPath);

if (existsSync(path.join(root, ".git"))) {
  failures.push(".git directory exists before final privacy audit approval.");
}

requireText(
  approvalChecklist,
  "Current result: `FAIL`.",
  "final privacy audit checklist must remain FAIL until release-candidate evidence is accepted."
);

for (const expected of [
  "may rely on the final privacy audit",
  "Final release safety scan proof",
  "Fixture",
  "sample-data sanitization proof",
  "Generated artifact review proof",
  "Log, screenshot, export, backup",
  "local database review proof",
  "Provider identifier review proof",
  "Local path",
  "network identifier review proof",
  "Private compatible leadership system boundary proof",
  "Calendar",
  "task minimization proof",
  "AI redaction boundary proof",
  "Retention, export, deletion, provider revocation",
  "Clean public history proof",
  "Remote CI proof",
  "Security and licensing audit evidence remain aligned",
  "Second operator approves final privacy audit evidence packet",
]) {
  requireText(
    approvalChecklist,
    expected,
    `final privacy audit checklist must preserve required evidence: ${expected}`
  );
}

for (const expected of [
  "Current result: `FAIL`.",
  "mark the privacy audit `PASS`",
  "Release surface review",
  "Artifact sanitization",
  "Identifier",
  "private-boundary proof",
  "Calendar/task minimization",
  "AI and automation boundaries",
  "Rights and lifecycle review",
  "Release Boundary",
]) {
  requireText(
    evidenceContract,
    expected,
    `final privacy evidence contract must preserve boundary: ${expected}`
  );
}

requireText(
  finalReleaseChecklist,
  "Final privacy audit `PASS` proof",
  "final release gate checklist must depend on final privacy audit PASS proof."
);

requireText(
  publicChecklist,
  "- [ ] Privacy audit status changed `FAIL` to `PASS`.",
  "public release checklist must keep final privacy audit PASS unchecked."
);
requireText(
  publicChecklist,
  "- [x] Final privacy audit approval guard foundation",
  "public release checklist must record final privacy audit approval guard foundation."
);

for (const expected of [
  "privacy:final-audit-readiness-packet",
  "privacy:final-audit-approval:check",
]) {
  requireText(packageJson, expected, `package.json must keep final privacy audit wiring: ${expected}`);
}

for (const expected of [
  "privacy:final-audit-readiness-packet",
  "runFinalPrivacyAuditReadinessPacketCommand",
]) {
  requireText(cliSource, expected, `CLI must keep final privacy readiness packet: ${expected}`);
}

for (const expected of [
  "final privacy audit readiness packet CLI emits review evidence",
  "privacy:final-audit-readiness-packet",
]) {
  requireText(cliTest, expected, `CLI tests must keep final privacy readiness packet coverage: ${expected}`);
}

requireText(
  guardAudit,
  "This is not final privacy audit approval.",
  "final privacy audit approval guard audit must preserve non-approval caveat."
);

if (failures.length > 0) {
  console.error("Final privacy audit approval guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Final privacy audit approval guard passed.");

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
