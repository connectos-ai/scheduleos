#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const publicChecklistPath = path.join(root, "docs", "public-release-checklist.md");
const approvalChecklistPath = path.join(root, "docs", "release", "clean-public-history-approval-checklist.md");
const stagingManifestPath = path.join(root, "docs", "release", "first-commit-staging-manifest.md");
const manifestGuardPath = path.join(root, "scripts", "check-first-commit-staging-manifest.mjs");
const gitignorePath = path.join(root, ".gitignore");
const packagePath = path.join(root, "package.json");
const auditPath = path.join(root, "docs", "release-audit", "CLEAN_PUBLIC_HISTORY_APPROVAL_GUARD_20260727.md");

const blocker = "Clean public history prepared";

const publicChecklist = readRequired(publicChecklistPath);
const approvalChecklist = readRequired(approvalChecklistPath);
const stagingManifest = readRequired(stagingManifestPath);
const manifestGuard = readRequired(manifestGuardPath);
const gitignore = readRequired(gitignorePath);
const packageJson = readRequired(packagePath);
const audit = readRequired(auditPath);

requireText(
  approvalChecklist,
  "Current result: `FAIL`.",
  "clean public history approval checklist must remain FAIL until current release-candidate evidence is reviewed."
);
requireText(
  approvalChecklist,
  "No git initialization, public repository creation, remote creation, push, tag, package publication, hosted deployment, or release announcement may rely on clean public history until this checklist changes to `PASS`.",
  "clean public history approval checklist must preserve the release-use prohibition."
);
requireText(
  approvalChecklist,
  `Do not mark "${blocker}" complete until this checklist changes from \`FAIL\` to \`PASS\` with current release-candidate evidence and no public repository mutation has occurred prematurely.`,
  "clean public history approval checklist must preserve the explicit public checklist release rule."
);

const uncheckedPattern = new RegExp(`^- \\[ \\] ${escapeRegExp(blocker)}\\.?$`, "mu");
const checkedPattern = new RegExp(`^- \\[x\\] ${escapeRegExp(blocker)}\\.?$`, "mui");
if (!uncheckedPattern.test(publicChecklist)) {
  failures.push(`public release checklist must keep unchecked clean public history blocker: ${blocker}`);
}
if (checkedPattern.test(publicChecklist)) {
  failures.push(`public release checklist checked clean public history blocker prematurely: ${blocker}`);
}

for (const expected of [
  "no-`.git`",
  "First-commit staging manifest",
  "Generated artifact review proof",
  "Fixture sample-data sanitization proof",
  "License NOTICE readiness proof",
  "Repository naming proof",
  "Remote CI plan proof",
  "Second operator approves"
]) {
  requireText(
    approvalChecklist,
    expected,
    `clean public history approval checklist must keep required evidence item: ${expected}.`
  );
}

for (const expected of [
  ".env.example",
  ".github/",
  "docs/",
  "examples/",
  "fixtures/",
  "migrations/",
  "scripts/",
  "src/",
  ".git/",
  "node_modules/",
  "dist/",
  "private compatible leadership system code",
  "real provider exports",
  "SSH keys"
]) {
  requireText(stagingManifest, expected, `first commit staging manifest must keep include/exclude entry: ${expected}.`);
}

for (const expected of [
  "requiredIncludeEntries",
  "requiredExcludeEntries",
  "allowedTopLevelEntries",
  "excludedTopLevelEntries",
  "existsSync(path.join(root, \".git\"))",
  "Clean public history prepared"
]) {
  requireText(manifestGuard, expected, `first commit staging manifest guard must keep ${expected}.`);
}

for (const expected of ["node_modules", "dist", ".env", "*.sqlite", "*.db", "coverage"]) {
  requireText(gitignore, expected, `.gitignore must keep public-history exclusion: ${expected}.`);
}

requireText(
  packageJson,
  "release:first-commit-manifest:check",
  "package.json must keep first-commit staging manifest guard script."
);
requireText(
  packageJson,
  "repository:clean-history-readiness-packet",
  "package.json must keep clean public history readiness packet script."
);
requireText(
  audit,
  "This is not clean public history approval.",
  "clean public history approval guard audit must preserve the non-approval caveat."
);

if (failures.length > 0) {
  console.error("Clean public history approval guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Clean public history approval guard passed.");

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

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
