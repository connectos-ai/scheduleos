#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const files = {
  packageJson: "package.json",
  publicChecklist: "docs/public-release-checklist.md",
  finalAuditStatus: "scripts/check-final-audit-status.mjs",
  dependencyScript: "scripts/check-dependency-audit-evidence-refresh.mjs",
  securityScript: "scripts/check-security-audit-evidence-refresh.mjs",
  privacyScript: "scripts/check-privacy-audit-evidence-refresh.mjs",
  licensingScript: "scripts/check-licensing-audit-evidence-refresh.mjs",
  dependencyAudit: "docs/release-audit/DEPENDENCY_AUDIT_EVIDENCE_REFRESH_GUARD_20260728.md",
  securityAudit: "docs/release-audit/SECURITY_AUDIT_EVIDENCE_REFRESH_GUARD_20260728.md",
  privacyAudit: "docs/release-audit/PRIVACY_AUDIT_EVIDENCE_REFRESH_GUARD_20260728.md",
  licensingAudit: "docs/release-audit/LICENSING_AUDIT_EVIDENCE_REFRESH_GUARD_20260728.md",
  dependencyChecklist: "docs/security/final-dependency-audit-approval-checklist.md",
  securityChecklist: "docs/security/final-security-audit-approval-checklist.md",
  privacyChecklist: "docs/security/final-privacy-audit-approval-checklist.md",
  licensingChecklist: "docs/security/final-licensing-audit-approval-checklist.md",
  audit: "docs/release-audit/FINAL_AUDIT_REFRESH_ROLLUP_GUARD_20260728.md"
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, relativePath]) => [
    key,
    readRequired(relativePath)
  ])
);
const packageJson = parseJson(text.packageJson, "package.json");
const checkCommand = packageJson.scripts?.check ?? "";
const checkSteps = checkCommand.split(" && ");

if (process.env.SCHEDULEOS_REQUIRE_NO_GIT === "true" && existsSync(path.join(root, ".git"))) {
  failures.push(".git directory exists before final audit refresh rollup approval.");
}

const refreshGuards = [
  {
    name: "dependency",
    scriptName: "dependency:audit-evidence-refresh:check",
    approvalScriptName: "dependency:final-audit-approval:check",
    scriptText: text.dependencyScript,
    auditText: text.dependencyAudit,
    checklistText: text.dependencyChecklist,
    publicItem: "Dependency audit final pass",
    publicFoundation: "Dependency audit evidence refresh guard foundation",
    nonApproval: "This is not final dependency audit approval."
  },
  {
    name: "security",
    scriptName: "security:audit-evidence-refresh:check",
    approvalScriptName: "security:final-audit-approval:check",
    scriptText: text.securityScript,
    auditText: text.securityAudit,
    checklistText: text.securityChecklist,
    publicItem: "Security audit status changed `FAIL` to `PASS`",
    publicFoundation: "Security audit evidence refresh guard foundation",
    nonApproval: "This is not final security audit approval."
  },
  {
    name: "privacy",
    scriptName: "privacy:audit-evidence-refresh:check",
    approvalScriptName: "privacy:final-audit-approval:check",
    scriptText: text.privacyScript,
    auditText: text.privacyAudit,
    checklistText: text.privacyChecklist,
    publicItem: "Privacy audit status changed `FAIL` to `PASS`",
    publicFoundation: "Privacy audit evidence refresh guard foundation",
    nonApproval: "This is not final privacy audit approval."
  },
  {
    name: "licensing",
    scriptName: "licensing:audit-evidence-refresh:check",
    approvalScriptName: "licensing:final-audit-approval:check",
    scriptText: text.licensingScript,
    auditText: text.licensingAudit,
    checklistText: text.licensingChecklist,
    publicItem: "Licensing audit status changed `FAIL` to `PASS`",
    publicFoundation: "Licensing audit evidence refresh guard foundation",
    nonApproval: "This is not final licensing audit approval."
  }
];

requirePackageScript("final-audit:refresh-rollup:check");
requirePackageScript("final-audit:status:check");

const rollupIndex = indexOfStep("final-audit:refresh-rollup:check");
const statusIndex = indexOfStep("final-audit:status:check");
if (rollupIndex < 0) {
  failures.push("npm run check must include final audit refresh rollup guard.");
}
if (statusIndex < 0) {
  failures.push("npm run check must include final audit status guard.");
}
if (rollupIndex >= 0 && statusIndex >= 0 && rollupIndex > statusIndex) {
  failures.push("final audit refresh rollup guard must run before final audit status guard.");
}

for (const guard of refreshGuards) {
  requirePackageScript(guard.scriptName);
  requirePackageScript(guard.approvalScriptName);

  const refreshIndex = indexOfStep(guard.scriptName);
  const approvalIndex = indexOfStep(guard.approvalScriptName);
  if (refreshIndex < 0) {
    failures.push(`${guard.scriptName} must be included in npm run check.`);
  }
  if (approvalIndex < 0) {
    failures.push(`${guard.approvalScriptName} must be included in npm run check.`);
  }
  if (refreshIndex >= 0 && approvalIndex >= 0 && refreshIndex > approvalIndex) {
    failures.push(`${guard.scriptName} must run before ${guard.approvalScriptName}.`);
  }

  requireText(guard.scriptText, ".git", `${guard.name} refresh guard must keep no-git boundary.`);
  requireText(guard.scriptText, guard.nonApproval, `${guard.name} refresh guard must preserve non-approval check.`);
  requireText(guard.auditText, guard.nonApproval, `${guard.name} refresh audit must preserve non-approval caveat.`);
  requireText(guard.auditText, "ScheduleOS release status remains `FAIL`", `${guard.name} refresh audit must preserve FAIL release status.`);
  requireText(guard.checklistText, "Current result: `FAIL`.", `${guard.name} final audit checklist must remain FAIL.`);

  const uncheckedPattern = new RegExp(`^- \\[ \\] ${escapeRegExp(guard.publicItem)}`, "mu");
  const checkedPattern = new RegExp(`^- \\[x\\] ${escapeRegExp(guard.publicItem)}`, "mu");
  if (!uncheckedPattern.test(text.publicChecklist)) {
    failures.push(`public release checklist must keep unchecked final audit gate: ${guard.publicItem}`);
  }
  if (checkedPattern.test(text.publicChecklist)) {
    failures.push(`public release checklist checked final audit gate prematurely: ${guard.publicItem}`);
  }
  requireText(
    text.publicChecklist,
    guard.publicFoundation,
    `public release checklist must record ${guard.publicFoundation}.`
  );
}

for (const expected of [
  "dependency",
  "security",
  "privacy",
  "licensing",
  "Current result: `FAIL`.",
  "public release checklist must keep unchecked audit gate",
  "Final audit status check passed"
]) {
  requireText(text.finalAuditStatus, expected, `final audit status guard must preserve rollup dependency: ${expected}`);
}

requireText(
  text.publicChecklist,
  "Final audit refresh rollup guard foundation",
  "public release checklist must record final audit refresh rollup guard foundation."
);

requireText(
  text.audit,
  "This is not final audit approval.",
  "final audit refresh rollup audit must preserve non-approval caveat."
);

if (failures.length > 0) {
  console.error("Final audit refresh rollup guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Final audit refresh rollup guard passed ${refreshGuards.length} refresh guard(s).`);

function readRequired(relativePath) {
  try {
    return readFileSync(path.join(root, relativePath), "utf8");
  } catch (error) {
    failures.push(`Missing required file: ${relativePath}`);
    return "";
  }
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
  if (!text.packageJson.includes(scriptName)) {
    failures.push(`package.json must keep script wiring: ${scriptName}`);
  }
}

function requireText(content, expected, message) {
  if (!content.includes(expected)) {
    failures.push(message);
  }
}

function indexOfStep(scriptName) {
  return checkSteps.findIndex((step) => step.includes(scriptName));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
