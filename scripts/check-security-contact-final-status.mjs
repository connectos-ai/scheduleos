#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const publicChecklistPath = path.join(root, "docs", "public-release-checklist.md");
const approvalChecklistPath = path.join(root, "docs", "security", "security-policy-contact-approval-checklist.md");
const securityPolicyPath = path.join(root, "SECURITY.md");
const contactCheckerPath = path.join(root, "scripts", "check-security-policy-contact.mjs");
const packagePath = path.join(root, "package.json");
const auditPath = path.join(root, "docs", "release-audit", "SECURITY_CONTACT_FINAL_STATUS_GUARD_20260727.md");

const blocker = "Security policy contact configured";

const publicChecklist = readRequired(publicChecklistPath);
const approvalChecklist = readRequired(approvalChecklistPath);
const securityPolicy = readRequired(securityPolicyPath);
const contactChecker = readRequired(contactCheckerPath);
const packageJson = readRequired(packagePath);
const audit = readRequired(auditPath);

requireText(
  approvalChecklist,
  "Current result: `FAIL`.",
  "security policy contact approval checklist must remain FAIL until public-repository evidence is reviewed."
);
requireText(
  approvalChecklist,
  "No public release, repository creation, tag, package publication, hosted deployment, security audit `PASS`, or release announcement may rely on the security policy contact until this checklist changes to `PASS`.",
  "security policy contact approval checklist must preserve the release-use prohibition."
);
requireText(
  approvalChecklist,
  `Do not mark "${blocker}" complete until this checklist changes from \`FAIL\` to \`PASS\` with current release-candidate and public-repository evidence.`,
  "security policy contact approval checklist must preserve the explicit public checklist release rule."
);

const uncheckedPattern = new RegExp(`^- \\[ \\] ${escapeRegExp(blocker)}\\.?$`, "mu");
const checkedPattern = new RegExp(`^- \\[x\\] ${escapeRegExp(blocker)}\\.?$`, "mui");
if (!uncheckedPattern.test(publicChecklist)) {
  failures.push(`public release checklist must keep unchecked security contact blocker: ${blocker}`);
}
if (checkedPattern.test(publicChecklist)) {
  failures.push(`public release checklist checked security contact blocker prematurely: ${blocker}`);
}

for (const expected of [
  "real monitored channel",
  "repository security settings",
  "remote CI security workflow proof",
  "second-operator review",
  "Do not add fictional email addresses",
  "do not open public issues"
]) {
  requireText(securityPolicy, expected, `SECURITY.md must keep pre-release security-contact boundary: ${expected}.`);
}

if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu.test(securityPolicy)) {
  failures.push("SECURITY.md must not contain email-shaped contact addresses before security contact approval.");
}

for (const expected of [
  "security:policy-contact:check",
  "Security policy contact configured",
  "email-shaped contact addresses",
  "placeholder"
]) {
  const source = expected === "security:policy-contact:check" ? packageJson : contactChecker;
  requireText(source, expected, `security contact checker wiring must keep ${expected}.`);
}

requireText(
  packageJson,
  "check-security-policy-contact.mjs",
  "package.json must keep security policy contact checker script wiring."
);

for (const expected of [
  "Monitored contact-channel proof",
  "Repository advisory settings proof",
  "Response SLA proof",
  "Escalation-path proof",
  "Private report sanitization proof",
  "Remote CI security workflow proof",
  "Second operator approves"
]) {
  requireText(
    approvalChecklist,
    expected,
    `security policy contact approval checklist must keep required evidence item: ${expected}.`
  );
}

requireText(
  audit,
  "This is not security policy contact configuration.",
  "security contact final-status guard audit must preserve the non-configuration caveat."
);

if (failures.length > 0) {
  console.error("Security contact final-status guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Security contact final-status guard passed.");

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
