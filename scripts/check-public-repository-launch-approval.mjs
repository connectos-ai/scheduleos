#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const publicChecklistPath = path.join(root, "docs", "public-release-checklist.md");
const launchChecklistPath = path.join(
  root,
  "docs",
  "release",
  "public-repository-launch-approval-checklist.md"
);
const readinessPath = path.join(root, "docs", "release", "repository-readiness.md");
const settingsChecklistPath = path.join(
  root,
  "docs",
  "release",
  "repository-settings-approval-checklist.md"
);
const namingChecklistPath = path.join(
  root,
  "docs",
  "release",
  "repository-naming-trademark-approval-checklist.md"
);
const firstCommitManifestPath = path.join(
  root,
  "docs",
  "release",
  "first-commit-staging-manifest.md"
);
const cliPath = path.join(root, "src", "cli.ts");
const cliTestPath = path.join(root, "src", "cli.test.ts");
const packagePath = path.join(root, "package.json");
const guardAuditPath = path.join(
  root,
  "docs",
  "release-audit",
  "PUBLIC_REPOSITORY_LAUNCH_APPROVAL_GUARD_20260727.md"
);

const publicChecklist = readRequired(publicChecklistPath);
const launchChecklist = readRequired(launchChecklistPath);
const readiness = readRequired(readinessPath);
const settingsChecklist = readRequired(settingsChecklistPath);
const namingChecklist = readRequired(namingChecklistPath);
const firstCommitManifest = readRequired(firstCommitManifestPath);
const cliSource = readRequired(cliPath);
const cliTest = readRequired(cliTestPath);
const packageJson = readRequired(packagePath);
const guardAudit = readRequired(guardAuditPath);

if (existsSync(path.join(root, ".git"))) {
  failures.push(".git directory exists before public repository launch approval.");
}

requireText(
  launchChecklist,
  "Current result: `FAIL`.",
  "public repository launch approval checklist must remain FAIL until release-candidate evidence is reviewed."
);
requireText(
  publicChecklist,
  "- [ ] Public repository created only after all gates pass.",
  "public release checklist must keep public repository creation blocker unchecked."
);
requireText(
  publicChecklist,
  "Public repository launch approval guard foundation verifies",
  "public release checklist must document the public repository launch approval guard foundation."
);

for (const expected of [
  "No public repository",
  "remote",
  "push",
  "tag",
  "package publication",
  "hosted deployment",
  "release announcement"
]) {
  requireText(
    launchChecklist,
    expected,
    `public repository launch checklist must preserve release-use prohibition: ${expected}`
  );
}

for (const expected of [
  "Final release gate proof",
  "Privacy",
  "secret scan",
  "Licensing audit `PASS` proof",
  "Security audit `PASS` proof",
  "Privacy audit `PASS` proof",
  "Security policy contact `PASS` proof",
  "Public remote CI `PASS` proof",
  "Repository settings proof",
  "Name-collision review proof",
  "Trademark-risk review proof",
  "First-commit staging proof",
  "owner plus second-operator release approval"
]) {
  requireText(
    launchChecklist,
    expected,
    `public repository launch checklist must keep required PASS evidence: ${expected}`
  );
}

for (const expected of [
  "Preferred organization: `scheduleos-ai`",
  "Preferred repository: `scheduleos`",
  "Public repository creation remains blocked",
  "Do not initialize git",
  "GitHub organization",
  "only after",
  "release gate passes"
]) {
  requireText(
    readiness,
    expected,
    `repository readiness doc must preserve launch boundary: ${expected}`
  );
}

for (const expected of [
  "Current result: `FAIL`.",
  "Repository settings readiness packet foundation",
  "Public repository launch approval checklist requires repository settings proof"
]) {
  requireText(
    settingsChecklist,
    expected,
    `repository settings checklist must preserve launch dependency: ${expected}`
  );
}

for (const expected of [
  "Current result: `FAIL`.",
  "Preferred organization remains `scheduleos-ai`",
  "Preferred repository remains `scheduleos`",
  "public repository launch",
  "name-collision and trademark-review labels"
]) {
  requireText(
    namingChecklist,
    expected,
    `repository naming checklist must preserve launch dependency: ${expected}`
  );
}

for (const expected of [
  "include",
  "exclude",
  "node_modules",
  "dist",
  ".env",
  "release safety"
]) {
  requireText(
    firstCommitManifest,
    expected,
    `first commit staging manifest must preserve staging control: ${expected}`
  );
}

for (const expected of [
  "repository:launch-readiness-packet",
  "runRepositoryLaunchReadinessPacketCommand",
  "publicRepositoryCreationApproved",
  "pushMutationAllowedByPacket",
  "tagMutationAllowedByPacket",
  "releaseMutationAllowedByPacket"
]) {
  requireText(
    cliSource,
    expected,
    `repository launch readiness CLI must keep non-mutating packet field: ${expected}`
  );
}

for (const expected of [
  "repository launch readiness packet CLI emits review evidence without publishing",
  "publicRepositoryCreationApproved",
  "pushMutationAllowedByPacket",
  "repository launch readiness packet CLI rejects blank"
]) {
  requireText(
    cliTest,
    expected,
    `repository launch readiness CLI tests must keep coverage: ${expected}`
  );
}

requireText(
  packageJson,
  "repository:launch-readiness-packet",
  "package.json must keep repository launch readiness packet script."
);
requireText(
  guardAudit,
  "This is not public repository launch approval.",
  "public repository launch approval guard audit must preserve non-approval caveat."
);

if (failures.length > 0) {
  console.error("Public repository launch approval guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Public repository launch approval guard passed.");

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
