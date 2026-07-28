#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const publicChecklistPath = path.join(root, "docs", "public-release-checklist.md");
const finalGateChecklistPath = path.join(
  root,
  "docs",
  "release",
  "final-release-gate-approval-checklist.md"
);
const packagePath = path.join(root, "package.json");
const cliPath = path.join(root, "src", "cli.ts");
const cliTestPath = path.join(root, "src", "cli.test.ts");
const readmePath = path.join(root, "README.md");
const guardAuditPath = path.join(
  root,
  "docs",
  "release-audit",
  "FINAL_RELEASE_GATE_APPROVAL_GUARD_20260727.md"
);

const publicChecklist = readRequired(publicChecklistPath);
const finalGateChecklist = readRequired(finalGateChecklistPath);
const packageJson = readRequired(packagePath);
const cliSource = readRequired(cliPath);
const cliTest = readRequired(cliTestPath);
const readme = readRequired(readmePath);
const guardAudit = readRequired(guardAuditPath);

if (process.env.SCHEDULEOS_REQUIRE_NO_GIT === "true" && existsSync(path.join(root, ".git"))) {
  failures.push(".git directory exists before final release gate approval.");
}

requireText(
  finalGateChecklist,
  "Current result: `FAIL`.",
  "final release gate checklist must remain FAIL until all release-candidate evidence is accepted."
);
requireText(
  finalGateChecklist,
  "No public repository, git initialization, remote, push, tag, package publication, hosted deployment, public announcement, or launch claim may rely on this checklist until it changes to `PASS`.",
  "final release gate checklist must preserve release-use prohibition."
);

for (const expected of [
  "Final functionality gate proof",
  "Final documentation gate proof",
  "Final dependency audit `PASS` proof",
  "Final security audit `PASS` proof",
  "Final privacy audit `PASS` proof",
  "Final licensing audit `PASS` proof",
  "Public remote CI `PASS` proof",
  "Clean public history `PASS` proof",
  "Security policy contact `PASS` proof",
  "Public repository settings `PASS` proof",
  "Repository naming/trademark `PASS` proof",
  "Final source/generated-artifact review proof",
  "Owner approval plus second-operator final release approval",
]) {
  requireText(
    finalGateChecklist,
    expected,
    `final release gate checklist must preserve required evidence: ${expected}`
  );
}

for (const unchecked of [
  "Dependency audit final pass.",
  "Security audit status changed `FAIL` to `PASS`.",
  "Privacy audit status changed `FAIL` to `PASS`.",
  "Licensing audit status changed `FAIL` to `PASS`.",
  "Clean public history prepared.",
  "CI run verified on public remote.",
  "Security policy contact configured.",
  "Public repository created only after all gates pass.",
]) {
  requireText(
    publicChecklist,
    `- [ ] ${unchecked}`,
    `public release checklist must keep final release dependency unchecked: ${unchecked}`
  );
}

requireText(
  publicChecklist,
  "ScheduleOS release status remains `FAIL`",
  "public release checklist must keep final release status FAIL."
);
requireText(
  publicChecklist,
  "- [x] Final release gate approval guard foundation",
  "public release checklist must record final release gate approval guard foundation."
);

requireText(readme, "Current release gate: `FAIL`.", "README must keep current release gate FAIL.");

for (const expected of [
  "release:final-gate-readiness-packet",
  "release:final-gate-approval:check",
]) {
  requireText(packageJson, expected, `package.json must keep final release gate wiring: ${expected}`);
}

for (const expected of [
  "release:final-gate-readiness-packet",
  "runFinalReleaseGateReadinessPacketCommand",
]) {
  requireText(cliSource, expected, `CLI must keep final release readiness packet: ${expected}`);
}

for (const expected of [
  "final release gate readiness packet CLI emits review evidence",
  "release:final-gate-readiness-packet",
]) {
  requireText(cliTest, expected, `CLI tests must keep final release readiness packet coverage: ${expected}`);
}

requireText(
  guardAudit,
  "This is not final release approval.",
  "final release gate approval guard audit must preserve non-approval caveat."
);

if (failures.length > 0) {
  console.error("Final release gate approval guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Final release gate approval guard passed.");

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
