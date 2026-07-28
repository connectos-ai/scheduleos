#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const publicChecklistPath = path.join(root, "docs", "public-release-checklist.md");
const settingsChecklistPath = path.join(
  root,
  "docs",
  "release",
  "repository-settings-approval-checklist.md"
);
const launchChecklistPath = path.join(
  root,
  "docs",
  "release",
  "public-repository-launch-approval-checklist.md"
);
const remoteCiChecklistPath = path.join(
  root,
  "docs",
  "release",
  "public-remote-ci-approval-checklist.md"
);
const readinessPath = path.join(root, "docs", "release", "repository-readiness.md");
const cliPath = path.join(root, "src", "cli.ts");
const cliTestPath = path.join(root, "src", "cli.test.ts");
const packagePath = path.join(root, "package.json");
const guardAuditPath = path.join(
  root,
  "docs",
  "release-audit",
  "REPOSITORY_SETTINGS_APPROVAL_GUARD_20260727.md"
);

const publicChecklist = readRequired(publicChecklistPath);
const settingsChecklist = readRequired(settingsChecklistPath);
const launchChecklist = readRequired(launchChecklistPath);
const remoteCiChecklist = readRequired(remoteCiChecklistPath);
const readiness = readRequired(readinessPath);
const cliSource = readRequired(cliPath);
const cliTest = readRequired(cliTestPath);
const packageJson = readRequired(packagePath);
const guardAudit = readRequired(guardAuditPath);

if (existsSync(path.join(root, ".git"))) {
  failures.push(".git directory exists before repository settings approval.");
}

requireText(
  settingsChecklist,
  "Current result: `FAIL`.",
  "repository settings approval checklist must remain FAIL until public-repository evidence is reviewed."
);
requireText(
  publicChecklist,
  "- [ ] Public repository created only after all gates pass.",
  "public release checklist must keep public repository creation blocker unchecked."
);
requireText(
  publicChecklist,
  "Repository settings approval guard foundation verifies",
  "public release checklist must document the repository settings approval guard foundation."
);

for (const expected of [
  "No public release",
  "repository launch approval",
  "tag",
  "package publication",
  "hosted deployment",
  "announcement"
]) {
  requireText(
    settingsChecklist,
    expected,
    `repository settings checklist must preserve release-use prohibition: ${expected}`
  );
}

for (const expected of [
  "Target repository proof",
  "Branch protection proof",
  "Required status checks proof",
  "Security advisory settings proof",
  "Default branch",
  "merge policy proof",
  "Dependabot or vulnerability alert proof",
  "Secret scanning",
  "push protection proof",
  "release/package",
  "permission proof",
  "Repository metadata proof",
  "Public issue/discussion settings proof",
  "Log, artifact",
  "workflow retention proof",
  "Second operator approves repository settings evidence packet"
]) {
  requireText(
    settingsChecklist,
    expected,
    `repository settings checklist must keep required PASS evidence: ${expected}`
  );
}

for (const expected of [
  "does not create repositories",
  "initialize git",
  "add remotes",
  "mutate repository settings",
  "mutate branch protection",
  "configure advisories",
  "change maintainer access",
  "push",
  "tag",
  "publish",
  "announce ScheduleOS"
]) {
  requireText(
    settingsChecklist,
    expected,
    `repository settings checklist must preserve non-mutation boundary: ${expected}`
  );
}

for (const expected of [
  "Repository settings proof",
  "Repository settings proof",
  "public repository is not approved"
]) {
  requireText(
    launchChecklist,
    expected,
    `public repository launch checklist must preserve repository-settings dependency: ${expected}`
  );
}

for (const expected of [
  "repository settings readiness",
  "branch-protection review",
  "required-checks review",
  "second-operator"
]) {
  requireText(
    remoteCiChecklist,
    expected,
    `public remote CI checklist must preserve repository-settings dependency: ${expected}`
  );
}

for (const expected of [
  "Preferred organization: `scheduleos-ai`",
  "Preferred repository: `scheduleos`",
  "Public repository creation remains blocked",
  "No public remote has been created"
]) {
  requireText(
    readiness,
    expected,
    `repository readiness doc must preserve settings boundary: ${expected}`
  );
}

for (const expected of [
  "repository:settings-readiness-packet",
  "runRepositorySettingsReadinessPacketCommand",
  "publicRepositorySettingsConfigured",
  "repositoryMutationAllowedByPacket",
  "branchProtectionMutationAllowedByPacket",
  "securityAdvisoryMutationAllowedByPacket",
  "releaseGateMutationAllowedByPacket"
]) {
  requireText(
    cliSource,
    expected,
    `repository settings readiness CLI must keep non-mutating packet field: ${expected}`
  );
}

for (const expected of [
  "repository settings readiness packet CLI emits review evidence without repository mutation",
  "publicRepositorySettingsConfigured",
  "repositoryMutationAllowedByPacket",
  "repository settings readiness packet CLI rejects blank"
]) {
  requireText(
    cliTest,
    expected,
    `repository settings readiness CLI tests must keep coverage: ${expected}`
  );
}

requireText(
  packageJson,
  "repository:settings-readiness-packet",
  "package.json must keep repository settings readiness packet script."
);
requireText(
  guardAudit,
  "This is not repository settings approval.",
  "repository settings approval guard audit must preserve non-approval caveat."
);

if (failures.length > 0) {
  console.error("Repository settings approval guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Repository settings approval guard passed.");

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
