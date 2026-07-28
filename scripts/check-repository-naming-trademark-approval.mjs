#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const publicChecklistPath = path.join(root, "docs", "public-release-checklist.md");
const namingChecklistPath = path.join(
  root,
  "docs",
  "release",
  "repository-naming-trademark-approval-checklist.md"
);
const readinessPath = path.join(root, "docs", "release", "repository-readiness.md");
const launchChecklistPath = path.join(
  root,
  "docs",
  "release",
  "public-repository-launch-approval-checklist.md"
);
const cleanHistoryChecklistPath = path.join(
  root,
  "docs",
  "release",
  "clean-public-history-approval-checklist.md"
);
const packagePath = path.join(root, "package.json");
const guardAuditPath = path.join(
  root,
  "docs",
  "release-audit",
  "REPOSITORY_NAMING_TRADEMARK_APPROVAL_GUARD_20260727.md"
);

const publicChecklist = readRequired(publicChecklistPath);
const namingChecklist = readRequired(namingChecklistPath);
const readiness = readRequired(readinessPath);
const launchChecklist = readRequired(launchChecklistPath);
const cleanHistoryChecklist = readRequired(cleanHistoryChecklistPath);
const packageJson = readRequired(packagePath);
const guardAudit = readRequired(guardAuditPath);

if (existsSync(path.join(root, ".git"))) {
  failures.push(".git directory exists before repository naming/trademark approval.");
}

requireText(
  namingChecklist,
  "Current result: `FAIL`.",
  "repository naming/trademark checklist must remain FAIL until final evidence is accepted."
);

for (const expected of [
  "No public repository, organization, remote, push, tag, package publication, hosted deployment, marketing page, or announcement",
  "GitHub namespace proof",
  "GitHub repository path proof",
  "Public-web search proof",
  "trademark databases",
  "Legal or owner naming decision",
  "Package-name review",
  "Second-operator review",
]) {
  requireText(
    namingChecklist,
    expected,
    `repository naming/trademark checklist must preserve required evidence: ${expected}`
  );
}

for (const expected of [
  "Preferred organization: `scheduleos-ai`",
  "Preferred repository: `scheduleos`",
  "Preferred URL: `https://github.com/scheduleos-ai/scheduleos`",
  "Public repository creation remains blocked",
  "GitHub repository search for exact `ScheduleOS`",
  "Current naming status remains review-only",
]) {
  requireText(
    readiness,
    expected,
    `repository readiness doc must preserve naming/trademark evidence: ${expected}`
  );
}

for (const expected of [
  "Repository readiness docs record GitHub name, naming-collision, trademark-risk",
  "Name-collision review proof",
  "Trademark-risk review proof",
]) {
  requireText(
    launchChecklist,
    expected,
    `public repository launch checklist must depend on naming/trademark review: ${expected}`
  );
}

for (const expected of [
  "Repository naming proof",
  "naming and remote CI plans",
  "Current result: `FAIL`.",
]) {
  requireText(
    cleanHistoryChecklist,
    expected,
    `clean public history checklist must depend on naming/trademark review: ${expected}`
  );
}

requireText(
  publicChecklist,
  "- [x] Repository naming and trademark approval checklist exists",
  "public release checklist must keep naming/trademark checklist foundation marked complete."
);
requireText(
  publicChecklist,
  "- [x] Repository naming/trademark approval guard foundation",
  "public release checklist must record naming/trademark approval guard foundation."
);
requireText(
  publicChecklist,
  "- [ ] Public repository created only after all gates pass.",
  "public release checklist must keep public repository creation unchecked."
);

requireText(
  packageJson,
  "repository:naming-trademark-approval:check",
  "package.json must wire naming/trademark approval guard."
);
requireText(
  guardAudit,
  "This is not repository naming or trademark approval.",
  "naming/trademark approval guard audit must preserve non-approval caveat."
);

if (failures.length > 0) {
  console.error("Repository naming/trademark approval guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Repository naming/trademark approval guard passed.");

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
