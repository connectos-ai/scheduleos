#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const files = {
  packageJson: "package.json",
  readme: "README.md",
  publicChecklist: "docs/public-release-checklist.md",
  finalReleaseChecklist: "docs/release/final-release-gate-approval-checklist.md",
  finalAuditStatus: "scripts/check-final-audit-status.mjs",
  finalAuditRefreshRollup: "scripts/check-final-audit-refresh-rollup.mjs",
  audit: "docs/release-audit/FINAL_AUDIT_APPROVAL_PARITY_GUARD_20260728.md"
};

const auditGates = [
  {
    name: "dependency",
    publicItem: "Dependency audit final pass",
    checklist: "docs/security/final-dependency-audit-approval-checklist.md",
    evidenceContract: "docs/security/final-dependency-audit-evidence-contract.md",
    approvalGuard: "scripts/check-final-dependency-audit-approval.mjs",
    refreshGuard: "scripts/check-dependency-audit-evidence-refresh.mjs",
    approvalScript: "dependency:final-audit-approval:check",
    refreshScript: "dependency:audit-evidence-refresh:check",
    readinessPacket: "dependency:final-audit-readiness-packet",
    finalReleaseProof: "Final dependency audit `PASS` proof",
    foundation: "Final dependency audit approval guard foundation",
    nonApproval: "This is not final dependency audit approval."
  },
  {
    name: "security",
    publicItem: "Security audit status changed `FAIL` to `PASS`",
    checklist: "docs/security/final-security-audit-approval-checklist.md",
    evidenceContract: "docs/security/final-security-audit-evidence-contract.md",
    approvalGuard: "scripts/check-final-security-audit-approval.mjs",
    refreshGuard: "scripts/check-security-audit-evidence-refresh.mjs",
    approvalScript: "security:final-audit-approval:check",
    refreshScript: "security:audit-evidence-refresh:check",
    readinessPacket: "security:final-audit-readiness-packet",
    finalReleaseProof: "Final security audit `PASS` proof",
    foundation: "Final security audit approval guard foundation",
    nonApproval: "This is not final security audit approval."
  },
  {
    name: "privacy",
    publicItem: "Privacy audit status changed `FAIL` to `PASS`",
    checklist: "docs/security/final-privacy-audit-approval-checklist.md",
    evidenceContract: "docs/security/final-privacy-audit-evidence-contract.md",
    approvalGuard: "scripts/check-final-privacy-audit-approval.mjs",
    refreshGuard: "scripts/check-privacy-audit-evidence-refresh.mjs",
    approvalScript: "privacy:final-audit-approval:check",
    refreshScript: "privacy:audit-evidence-refresh:check",
    readinessPacket: "privacy:final-audit-readiness-packet",
    finalReleaseProof: "Final privacy audit `PASS` proof",
    foundation: "Final privacy audit approval guard foundation",
    nonApproval: "This is not final privacy audit approval."
  },
  {
    name: "licensing",
    publicItem: "Licensing audit status changed `FAIL` to `PASS`",
    checklist: "docs/security/final-licensing-audit-approval-checklist.md",
    evidenceContract: "docs/security/final-licensing-audit-evidence-contract.md",
    approvalGuard: "scripts/check-final-licensing-audit-approval.mjs",
    refreshGuard: "scripts/check-licensing-audit-evidence-refresh.mjs",
    approvalScript: "licensing:final-audit-approval:check",
    refreshScript: "licensing:audit-evidence-refresh:check",
    readinessPacket: "licensing:final-audit-readiness-packet",
    finalReleaseProof: "Final licensing audit `PASS` proof",
    foundation: "Final licensing audit approval guard foundation",
    nonApproval: "This is not final licensing audit approval."
  }
];

for (const gate of auditGates) {
  files[`${gate.name}Checklist`] = gate.checklist;
  files[`${gate.name}EvidenceContract`] = gate.evidenceContract;
  files[`${gate.name}ApprovalGuard`] = gate.approvalGuard;
  files[`${gate.name}RefreshGuard`] = gate.refreshGuard;
}

const text = Object.fromEntries(
  Object.entries(files).map(([key, relativePath]) => [key, readRequired(relativePath)])
);
const packageJson = parseJson(text.packageJson, "package.json");
const scripts = packageJson.scripts ?? {};
const checkSteps = String(scripts.check ?? "").split(" && ");

if (process.env.SCHEDULEOS_REQUIRE_NO_GIT === "true" && existsSync(path.join(root, ".git"))) {
  failures.push("local .git directory must not exist before intentional clean public repository staging.");
}

requirePackageScript("final-audit:approval-parity:check");
requireText(text.packageJson, "node scripts/check-final-audit-approval-parity.mjs", "package scripts must wire final audit approval parity guard.");
requireText(text.publicChecklist, "Final audit approval parity guard foundation", "public release checklist must record final audit approval parity guard foundation.");

const refreshRollupIndex = indexOfStep("final-audit:refresh-rollup:check");
const approvalParityIndex = indexOfStep("final-audit:approval-parity:check");
const statusIndex = indexOfStep("final-audit:status:check");
const finalReleaseIndex = indexOfStep("release:final-gate-approval:check");

if (approvalParityIndex < 0) {
  failures.push("npm run check must include final audit approval parity guard.");
}
if (refreshRollupIndex >= 0 && approvalParityIndex >= 0 && refreshRollupIndex > approvalParityIndex) {
  failures.push("final audit approval parity guard must run after final audit refresh rollup guard.");
}
if (approvalParityIndex >= 0 && statusIndex >= 0 && approvalParityIndex > statusIndex) {
  failures.push("final audit approval parity guard must run before final audit status guard.");
}
if (approvalParityIndex >= 0 && finalReleaseIndex >= 0 && approvalParityIndex > finalReleaseIndex) {
  failures.push("final audit approval parity guard must run before final release gate approval guard.");
}

for (const expected of [
  "Current public repository gate: `PASS`.",
  "Production deployment remains operator-owned",
  "Dependency audit readiness packet",
  "Final security audit readiness packet",
  "Final licensing audit readiness packet",
  "Final privacy audit readiness packet"
]) {
  requireText(text.readme, expected, `README must preserve release/audit boundary: ${expected}`);
}

for (const expected of [
  "Current result: `FAIL`.",
  "final audits are changed to `PASS`",
  "No public repository, git initialization, remote, push, tag, package publication, hosted deployment, public announcement, or launch claim"
]) {
  requireText(text.finalReleaseChecklist, expected, `final release checklist must preserve final audit dependency: ${expected}`);
}

for (const expected of [
  "dependency",
  "security",
  "privacy",
  "licensing"
]) {
  requireText(text.finalAuditStatus, expected, `final audit status guard must still cover ${expected}.`);
  requireText(text.finalAuditRefreshRollup, expected, `final audit refresh rollup guard must still cover ${expected}.`);
}

for (const gate of auditGates) {
  const checklist = text[`${gate.name}Checklist`];
  const evidenceContract = text[`${gate.name}EvidenceContract`];
  const approvalGuard = text[`${gate.name}ApprovalGuard`];
  const refreshGuard = text[`${gate.name}RefreshGuard`];

  requirePackageScript(gate.approvalScript);
  requirePackageScript(gate.refreshScript);
  requirePackageScript(gate.readinessPacket);
  requireUnchecked(text.publicChecklist, gate.publicItem);
  requireText(text.publicChecklist, gate.foundation, `public release checklist must keep ${gate.name} approval guard foundation.`);
  requireText(text.finalReleaseChecklist, gate.finalReleaseProof, `final release gate must depend on ${gate.name} final audit PASS proof.`);
  requireText(text.readme, gate.readinessPacket, `README must document ${gate.name} readiness packet.`);

  requireText(checklist, "Current result: `FAIL`.", `${gate.name} final audit checklist must remain FAIL.`);
  requireText(checklist, "No public repository, hosted deployment, tag, package publication, or release announcement may rely", `${gate.name} final audit checklist must preserve release-use prohibition.`);
  requireText(checklist, "changes from `FAIL` to `PASS`", `${gate.name} final audit checklist must preserve PASS transition boundary.`);
  requireText(evidenceContract, "Current result: `FAIL`.", `${gate.name} evidence contract must preserve FAIL status.`);
  requireText(evidenceContract, "Release Boundary", `${gate.name} evidence contract must preserve release boundary.`);
  requireText(approvalGuard, ".git", `${gate.name} approval guard must preserve no-git boundary.`);
  requireText(approvalGuard, gate.nonApproval, `${gate.name} approval guard must preserve non-approval caveat.`);
  requireText(refreshGuard, ".git", `${gate.name} refresh guard must preserve no-git boundary.`);
  requireText(refreshGuard, gate.nonApproval, `${gate.name} refresh guard must preserve non-approval caveat.`);

  const refreshIndex = indexOfStep(gate.refreshScript);
  const approvalIndex = indexOfStep(gate.approvalScript);
  if (refreshIndex < 0) {
    failures.push(`${gate.refreshScript} must be included in npm run check.`);
  }
  if (approvalIndex < 0) {
    failures.push(`${gate.approvalScript} must be included in npm run check.`);
  }
  if (refreshIndex >= 0 && approvalIndex >= 0 && refreshIndex > approvalIndex) {
    failures.push(`${gate.refreshScript} must run before ${gate.approvalScript}.`);
  }
}

for (const expected of [
  "This is not final audit approval.",
  "does not mark dependency, security, privacy, or licensing audits `PASS`",
  "ScheduleOS release status remains `FAIL`"
]) {
  requireText(text.audit, expected, `audit note must preserve non-approval caveat: ${expected}`);
}

if (failures.length > 0) {
  console.error("Final audit approval parity guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Final audit approval parity guard passed ${auditGates.length} final audit gate(s).`);

function readRequired(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) {
    failures.push(`${relativePath} is missing.`);
    return "";
  }
  return readFileSync(absolutePath, "utf8");
}

function parseJson(content, label) {
  try {
    return JSON.parse(content || "{}");
  } catch (error) {
    failures.push(`${label} must be valid JSON.`);
    return {};
  }
}

function requirePackageScript(scriptName) {
  if (!Object.hasOwn(scripts, scriptName) && !checkSteps.some((step) => step.includes(scriptName))) {
    failures.push(`package.json must keep script wiring: ${scriptName}`);
  }
}

function requireText(content, expected, message) {
  if (!content.includes(expected)) {
    failures.push(message);
  }
}

function requireUnchecked(content, label) {
  const uncheckedPattern = new RegExp(`^- \\[ \\] ${escapeRegExp(label)}`, "mu");
  const checkedPattern = new RegExp(`^- \\[[xX]\\] ${escapeRegExp(label)}`, "mu");
  if (!uncheckedPattern.test(content)) {
    failures.push(`public release checklist must keep unchecked audit gate: ${label}`);
  }
  if (checkedPattern.test(content)) {
    failures.push(`public release checklist checked final audit gate prematurely: ${label}`);
  }
}

function indexOfStep(scriptName) {
  return checkSteps.findIndex((step) => step.includes(scriptName));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
