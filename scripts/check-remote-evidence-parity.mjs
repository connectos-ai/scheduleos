#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const files = {
  packageJson: "package.json",
  publicChecklist: "docs/public-release-checklist.md",
  publicRemoteCi: "docs/release/public-remote-ci-approval-checklist.md",
  remotePostgres: "docs/security/remote-ci-postgresql-approval-checklist.md",
  finalRelease: "docs/release/final-release-gate-approval-checklist.md",
  repositoryLaunch: "docs/release/public-repository-launch-approval-checklist.md",
  cleanHistory: "docs/release/clean-public-history-approval-checklist.md",
  repositorySettings: "docs/release/repository-settings-approval-checklist.md",
  securityContact: "docs/security/security-policy-contact-approval-checklist.md",
  publicRemoteCiGuard: "scripts/check-public-remote-ci-evidence-refresh.mjs",
  remotePostgresGuard: "scripts/check-remote-ci-postgresql-approval.mjs",
  finalReleaseGuard: "scripts/check-final-release-gate-approval.mjs",
  repositoryLaunchGuard: "scripts/check-public-repository-launch-approval.mjs",
  audit: "docs/release-audit/REMOTE_EVIDENCE_PARITY_GUARD_20260728.md"
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
  failures.push(".git directory exists before remote evidence parity approval.");
}

for (const [label, content] of [
  ["public remote CI", text.publicRemoteCi],
  ["remote CI PostgreSQL", text.remotePostgres],
  ["final release gate", text.finalRelease],
  ["public repository launch", text.repositoryLaunch],
  ["clean public history", text.cleanHistory],
  ["repository settings", text.repositorySettings],
  ["security contact", text.securityContact]
]) {
  requireText(content, "Current result: `FAIL`.", `${label} checklist must remain FAIL.`);
}

const parityRequirements = [
  {
    label: "public remote CI",
    content: text.publicRemoteCi,
    required: [
      "PostgreSQL remote CI proof",
      "clean-history",
      "repository-settings",
      "final release-gate evidence",
      "Security, privacy, licensing, dependency",
      "Second operator approves public remote CI evidence packet",
      "This packet does not create repositories",
      "Do not mark \"CI run verified on public remote\" complete"
    ]
  },
  {
    label: "remote CI PostgreSQL",
    content: text.remotePostgres,
    required: [
      "Remote CI workflow proof",
      "PostgreSQL service container proof",
      "Migration apply proof",
      "Live PostgreSQL repository test proof",
      "Connection secret redaction proof",
      "Remote CI log sanitization review",
      "Security, privacy, and licensing audits remain `PASS`",
      "Second operator approves the final remote CI PostgreSQL evidence packet",
      "This packet does not create a remote",
      "Do not mark \"Successful remote CI PostgreSQL proof\" complete"
    ]
  },
  {
    label: "final release gate",
    content: text.finalRelease,
    required: [
      "Final dependency audit `PASS` proof",
      "Final security audit `PASS` proof",
      "Final privacy audit `PASS` proof",
      "Final licensing audit `PASS` proof",
      "Public remote CI `PASS` proof",
      "Clean public history `PASS` proof",
      "Security policy contact `PASS` proof",
      "Owner approval plus second-operator final release approval",
      "This packet does not approve release",
      "Do not mark final release ready"
    ]
  },
  {
    label: "public repository launch",
    content: text.repositoryLaunch,
    required: [
      "Final release gate proof",
      "Privacy and secret scan proof",
      "Licensing audit `PASS` proof",
      "Security audit `PASS` proof",
      "Privacy audit `PASS` proof",
      "Security policy contact `PASS` proof",
      "Public remote CI `PASS` proof",
      "Repository settings proof",
      "First-commit staging proof",
      "Owner approval and second-operator repository-launch approval proof",
      "This packet does not create a public repository",
      "Do not mark \"Public repository created only after all gates pass\" complete"
    ]
  },
  {
    label: "clean public history",
    content: text.cleanHistory,
    required: [
      "Current result: `FAIL`.",
      "Remote CI plan proof",
      "no-`.git`",
      "Second operator"
    ]
  }
];

for (const group of parityRequirements) {
  for (const expected of group.required) {
    requireText(group.content, expected, `${group.label} checklist must preserve parity requirement: ${expected}`);
  }
}

for (const expected of [
  "- [ ] Successful remote CI PostgreSQL proof.",
  "- [ ] CI run verified on public remote.",
  "- [ ] Public repository created only after all gates pass.",
  "- [ ] Dependency audit final pass.",
  "- [ ] Security audit status changed `FAIL` to `PASS`.",
  "- [ ] Privacy audit status changed `FAIL` to `PASS`.",
  "- [ ] Licensing audit status changed `FAIL` to `PASS`.",
  "- [x] Public remote CI evidence refresh guard foundation",
  "- [x] Remote evidence parity guard foundation"
]) {
  requireText(text.publicChecklist, expected, `public checklist must preserve remote parity boundary: ${expected}`);
}

for (const [scriptName, afterName] of [
  ["remote-evidence:parity:check", "public-remote-ci:evidence-refresh:check"]
]) {
  requirePackageScript(scriptName);
  const scriptIndex = indexOfStep(scriptName);
  const afterIndex = indexOfStep(afterName);
  if (scriptIndex < 0) {
    failures.push(`${scriptName} must be included in npm run check.`);
  }
  if (afterIndex < 0) {
    failures.push(`${afterName} must be included in npm run check.`);
  }
  if (scriptIndex >= 0 && afterIndex >= 0 && scriptIndex <= afterIndex) {
    failures.push(`${scriptName} must run after ${afterName}.`);
  }
}

for (const [scriptName, beforeName] of [
  ["remote-evidence:parity:check", "repository:settings-approval:check"],
  ["remote-evidence:parity:check", "public-repository:launch-approval:check"]
]) {
  const scriptIndex = indexOfStep(scriptName);
  const beforeIndex = indexOfStep(beforeName);
  if (scriptIndex >= 0 && beforeIndex >= 0 && scriptIndex > beforeIndex) {
    failures.push(`${scriptName} must run before ${beforeName}.`);
  }
}

for (const [label, content, expected] of [
  ["public remote CI guard", text.publicRemoteCiGuard, "This is not public remote CI approval."],
  ["remote PostgreSQL guard", text.remotePostgresGuard, "This is not remote CI PostgreSQL approval."],
  ["final release guard", text.finalReleaseGuard, "This is not final release approval."],
  ["repository launch guard", text.repositoryLaunchGuard, "This is not public repository launch approval."]
]) {
  requireText(content, expected, `${label} must preserve non-approval caveat.`);
  requireText(content, ".git", `${label} must preserve no-git boundary.`);
}

requireText(
  text.audit,
  "This is not remote evidence approval.",
  "remote evidence parity audit must preserve non-approval caveat."
);

if (failures.length > 0) {
  console.error("Remote evidence parity guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Remote evidence parity guard passed.");

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
