#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const securityPolicyPath = "SECURITY.md";
const checklistPath = "docs/public-release-checklist.md";
const approvalChecklistPath =
  "docs/security/security-policy-contact-approval-checklist.md";

const failures = [];

const readRequiredFile = (filePath) => {
  if (!existsSync(filePath)) {
    failures.push(`${filePath} is missing.`);
    return "";
  }
  return readFileSync(filePath, "utf8");
};

const securityPolicy = readRequiredFile(securityPolicyPath);
const publicChecklist = readRequiredFile(checklistPath);
const approvalChecklist = readRequiredFile(approvalChecklistPath);

requireText(
  securityPolicy,
  "Do not treat this policy as a configured public vulnerability contact yet.",
  "SECURITY.md must clearly state the public vulnerability contact is not configured."
);
requireText(
  securityPolicy,
  "do not open public issues for security reports",
  "SECURITY.md must route security reports away from public issues until a private path exists."
);
requireText(
  securityPolicy,
  "Do not add fictional email addresses, personal contact details, private workspace URLs, or unmonitored placeholder channels.",
  "SECURITY.md must forbid fictional, personal, private, or unmonitored contact placeholders."
);
requireNoMatch(
  securityPolicy,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu,
  "SECURITY.md must not contain email-shaped contact addresses before the contact is approved."
);
requireNoMatch(
  securityPolicy,
  /\b(?:TBD|TODO|coming soon|example\.com|localhost|\.local|workspace URL)\b/iu,
  "SECURITY.md must not rely on placeholder, local, or private contact wording."
);
requireText(
  approvalChecklist,
  "Current result: `FAIL`.",
  "Security policy contact approval checklist must remain FAIL until real evidence is approved."
);
requireText(
  publicChecklist,
  "- [ ] Security policy contact configured.",
  "Public release checklist must keep security policy contact unchecked before real contact approval."
);

if (failures.length > 0) {
  console.error("Security policy contact check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Security policy contact check passed.");

function requireText(text, expected, message) {
  if (!text.includes(expected)) failures.push(message);
}

function requireNoMatch(text, pattern, message) {
  if (pattern.test(text)) failures.push(message);
}
