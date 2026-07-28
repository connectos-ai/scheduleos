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
  "security-policy-contact-approval-checklist.md"
);
const finalReleaseChecklistPath = path.join(
  root,
  "docs",
  "release",
  "final-release-gate-approval-checklist.md"
);
const publicLaunchChecklistPath = path.join(
  root,
  "docs",
  "release",
  "public-repository-launch-approval-checklist.md"
);
const securityPolicyPath = path.join(root, "SECURITY.md");
const packagePath = path.join(root, "package.json");
const cliPath = path.join(root, "src", "cli.ts");
const cliTestPath = path.join(root, "src", "cli.test.ts");
const guardAuditPath = path.join(
  root,
  "docs",
  "release-audit",
  "SECURITY_POLICY_CONTACT_APPROVAL_GUARD_20260727.md"
);

const publicChecklist = readRequired(publicChecklistPath);
const approvalChecklist = readRequired(approvalChecklistPath);
const finalReleaseChecklist = readRequired(finalReleaseChecklistPath);
const publicLaunchChecklist = readRequired(publicLaunchChecklistPath);
const securityPolicy = readRequired(securityPolicyPath);
const packageJson = readRequired(packagePath);
const cliSource = readRequired(cliPath);
const cliTest = readRequired(cliTestPath);
const guardAudit = readRequired(guardAuditPath);

if (existsSync(path.join(root, ".git"))) {
  failures.push(".git directory exists before security policy contact approval.");
}

requireText(
  approvalChecklist,
  "Current result: `FAIL`.",
  "security policy contact approval checklist must remain FAIL until public-repository evidence is accepted."
);
requireText(
  approvalChecklist,
  "No public release, repository creation, tag, package publication, hosted deployment, security audit `PASS`, or release announcement may rely on the security policy contact until this checklist changes to `PASS`.",
  "security policy contact approval checklist must preserve release-use prohibition."
);

for (const expected of [
  "Monitored contact-channel proof",
  "Repository advisory settings proof",
  "Response SLA proof",
  "Escalation-path proof",
  "Private report sanitization proof",
  "Remote CI security workflow proof",
  "`SECURITY.md` final review proof",
  "Public issue-template final review proof",
  "Second operator approves the security policy contact evidence packet.",
]) {
  requireText(
    approvalChecklist,
    expected,
    `security policy contact checklist must preserve required evidence: ${expected}`
  );
}

requireText(
  publicChecklist,
  "- [ ] Security policy contact configured.",
  "public release checklist must keep security policy contact unchecked."
);
requireText(
  publicChecklist,
  "- [x] Security policy contact approval guard foundation",
  "public release checklist must record security policy contact approval guard foundation."
);

requireText(
  finalReleaseChecklist,
  "Security policy contact `PASS` proof",
  "final release gate checklist must depend on security policy contact PASS proof."
);
requireText(
  publicLaunchChecklist,
  "Security policy contact approval checklist exists and remains `FAIL`",
  "public repository launch checklist must depend on security policy contact approval."
);

for (const expected of [
  "public release security gate is currently `FAIL`",
  "do not open public issues for security reports",
  "Do not add fictional email addresses",
]) {
  requireText(securityPolicy, expected, `SECURITY.md must preserve pre-release contact boundary: ${expected}`);
}
if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu.test(securityPolicy)) {
  failures.push("SECURITY.md must not contain email-shaped contact addresses before approval.");
}

for (const expected of [
  "security:policy-contact-readiness-packet",
  "security:policy-contact:check",
  "security:contact-final-status:check",
  "security:policy-contact-approval:check",
]) {
  requireText(packageJson, expected, `package.json must keep security policy contact wiring: ${expected}`);
}

for (const expected of [
  "security:policy-contact-readiness-packet",
  "runSecurityPolicyContactReadinessPacketCommand",
]) {
  requireText(cliSource, expected, `CLI must keep security policy contact readiness packet: ${expected}`);
}

for (const expected of [
  "security policy contact readiness packet CLI emits review evidence",
  "security:policy-contact-readiness-packet",
]) {
  requireText(cliTest, expected, `CLI tests must keep security policy contact readiness packet coverage: ${expected}`);
}

requireText(
  guardAudit,
  "This is not security policy contact approval.",
  "security policy contact approval guard audit must preserve non-approval caveat."
);

if (failures.length > 0) {
  console.error("Security policy contact approval guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Security policy contact approval guard passed.");

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
