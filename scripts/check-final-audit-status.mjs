#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const publicChecklistPath = path.join(root, "docs", "public-release-checklist.md");
const failures = [];

const auditGates = [
  {
    name: "dependency",
    checklistPath: "docs/security/final-dependency-audit-approval-checklist.md",
    publicItem: "Dependency audit final pass",
    releaseRule: 'Do not mark "Dependency audit final pass" complete'
  },
  {
    name: "security",
    checklistPath: "docs/security/final-security-audit-approval-checklist.md",
    publicItem: "Security audit status changed `FAIL` to `PASS`",
    releaseRule: 'Do not mark "Security audit status changed `FAIL` to `PASS`" complete'
  },
  {
    name: "privacy",
    checklistPath: "docs/security/final-privacy-audit-approval-checklist.md",
    publicItem: "Privacy audit status changed `FAIL` to `PASS`",
    releaseRule: 'Do not mark "Privacy audit status changed `FAIL` to `PASS`" complete'
  },
  {
    name: "licensing",
    checklistPath: "docs/security/final-licensing-audit-approval-checklist.md",
    publicItem: "Licensing audit status changed `FAIL` to `PASS`",
    releaseRule: 'Do not mark "Licensing audit status changed `FAIL` to `PASS`" complete'
  }
];

const publicChecklist = readRequiredFile(publicChecklistPath);

for (const gate of auditGates) {
  const checklist = readRequiredFile(path.join(root, gate.checklistPath));
  requireText(
    checklist,
    "Current result: `FAIL`.",
    `${gate.checklistPath} must remain FAIL until real final audit evidence is approved.`
  );
  requireText(
    checklist,
    "changes from `FAIL` to `PASS`",
    `${gate.checklistPath} must keep its PASS transition boundary.`
  );
  requireText(
    checklist,
    gate.releaseRule,
    `${gate.checklistPath} must keep its release rule for ${gate.name} audit.`
  );

  const uncheckedPattern = new RegExp(
    `^- \\[ \\] ${escapeRegExp(gate.publicItem)}`,
    "mu"
  );
  const checkedPattern = new RegExp(
    `^- \\[x\\] ${escapeRegExp(gate.publicItem)}`,
    "mui"
  );

  if (!uncheckedPattern.test(publicChecklist)) {
    failures.push(`public release checklist must keep unchecked audit gate: ${gate.publicItem}`);
  }
  if (checkedPattern.test(publicChecklist)) {
    failures.push(`public release checklist checked final audit gate prematurely: ${gate.publicItem}`);
  }
}

if (failures.length > 0) {
  console.error("Final audit status check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Final audit status check passed for ${auditGates.length} final audit gate(s).`);

function readRequiredFile(filePath) {
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
