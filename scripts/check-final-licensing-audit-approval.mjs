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
  "final-licensing-audit-approval-checklist.md"
);
const evidenceContractPath = path.join(
  root,
  "docs",
  "security",
  "final-licensing-audit-evidence-contract.md"
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
  "FINAL_LICENSING_AUDIT_APPROVAL_GUARD_20260727.md"
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
  failures.push(".git directory exists before final licensing audit approval.");
}

requireText(
  approvalChecklist,
  "Current result: `FAIL`.",
  "final licensing audit checklist must remain FAIL until release-candidate evidence is accepted."
);

for (const expected of [
  "final licensing audit until this checklist changes to `PASS`",
  "Final `npm run license:check` proof",
  "Final `npm ls --omit=dev --all` installed production dependency tree review proof",
  "Lockfile dependency license proof",
  "Installed dependency metadata proof",
  "Copied-source scan proof",
  "Fixture",
  "template",
  "example review proof",
  "Asset",
  "media",
  "binary review proof",
  "Documentation reuse scan proof",
  "Reused-material inventory proof",
  "NOTICE requirement review proof",
  "Root Apache-2.0 consistency proof",
  "Final release-candidate freeze proof",
  "Remote CI proof",
  "Security and privacy audit evidence remain aligned",
  "Second operator approves final licensing audit evidence packet",
]) {
  requireText(
    approvalChecklist,
    expected,
    `final licensing audit checklist must preserve required evidence: ${expected}`
  );
}

for (const expected of [
  "Current result: `FAIL`.",
  "mark the licensing audit `PASS`",
  "Root license proof",
  "Dependency license proof",
  "Source and documentation reuse proof",
  "Fixture, template, example, asset, media, font, icon, binary",
  "Reused-material inventory",
  "NOTICE and distribution proof",
  "Final release alignment",
  "Release Boundary",
]) {
  requireText(
    evidenceContract,
    expected,
    `final licensing evidence contract must preserve boundary: ${expected}`
  );
}

requireText(
  finalReleaseChecklist,
  "Final licensing audit `PASS` proof",
  "final release gate checklist must depend on final licensing audit PASS proof."
);

requireText(
  publicChecklist,
  "- [ ] Licensing audit status changed `FAIL` to `PASS`.",
  "public release checklist must keep final licensing audit PASS unchecked."
);
requireText(
  publicChecklist,
  "- [x] Final licensing audit approval guard foundation",
  "public release checklist must record final licensing audit approval guard foundation."
);

for (const expected of [
  "licensing:final-audit-readiness-packet",
  "licensing:final-audit-approval:check",
]) {
  requireText(packageJson, expected, `package.json must keep final licensing audit wiring: ${expected}`);
}

for (const expected of [
  "licensing:final-audit-readiness-packet",
  "runFinalLicensingAuditReadinessPacketCommand",
]) {
  requireText(cliSource, expected, `CLI must keep final licensing readiness packet: ${expected}`);
}

for (const expected of [
  "final licensing audit readiness packet CLI emits review evidence",
  "licensing:final-audit-readiness-packet",
]) {
  requireText(cliTest, expected, `CLI tests must keep final licensing readiness packet coverage: ${expected}`);
}

requireText(
  guardAudit,
  "This is not final licensing audit approval.",
  "final licensing audit approval guard audit must preserve non-approval caveat."
);

if (failures.length > 0) {
  console.error("Final licensing audit approval guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Final licensing audit approval guard passed.");

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
