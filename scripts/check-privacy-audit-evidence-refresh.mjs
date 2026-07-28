#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const files = {
  approvalChecklist: "docs/security/final-privacy-audit-approval-checklist.md",
  privacyAudit: "docs/security/privacy-audit.md",
  evidenceContractDoc: "docs/security/final-privacy-audit-evidence-contract.md",
  evidenceContractSource: "src/final-privacy-audit-evidence-contract.ts",
  evidenceContractTest: "src/final-privacy-audit-evidence-contract.test.ts",
  releaseSafety: "scripts/check-release-safety.mjs",
  readme: "README.md",
  securityPolicy: "SECURITY.md",
  publicChecklist: "docs/public-release-checklist.md",
  finalReleaseChecklist: "docs/release/final-release-gate-approval-checklist.md",
  securityChecklist: "docs/security/final-security-audit-approval-checklist.md",
  licensingChecklist: "docs/security/final-licensing-audit-approval-checklist.md",
  packageJson: "package.json",
  audit: "docs/release-audit/PRIVACY_AUDIT_EVIDENCE_REFRESH_GUARD_20260728.md"
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, relativePath]) => [
    key,
    readRequired(relativePath)
  ])
);
const packageJson = parseJson(text.packageJson, "package.json");

if (existsSync(path.join(root, ".git"))) {
  failures.push(".git directory exists before final privacy audit approval.");
}

for (const expected of [
  "Current result: `FAIL`.",
  "privacy audit is not approved",
  "No public repository",
  "Final release safety scan proof",
  "sample-data sanitization",
  "Generated artifact review proof",
  "Log, screenshot",
  "Provider identifier review proof",
  "Local path, machine-name",
  "Private compatible leadership system boundary proof",
  "task minimization",
  "AI redaction boundary proof",
  "Retention, export, deletion, provider revocation",
  "Clean public history proof",
  "Remote CI proof",
  "audit evidence remain aligned",
  "Second operator approves final privacy audit evidence packet"
]) {
  requireText(
    text.approvalChecklist,
    expected,
    `final privacy audit checklist must preserve evidence requirement: ${expected}`
  );
}

for (const expected of [
  "Current result: `FAIL`.",
  "Do not publish ScheduleOS",
  "Source code",
  "Fixtures, examples",
  "Logs, screenshots, exports, backups, local databases, source maps, coverage outputs",
  "Clean public history",
  "Public issue templates",
  "Screenshots, logs",
  "Calendar title, attendee, location, description, task title, task description, source metadata",
  "AI input",
  "Retention, export, deletion, provider revocation",
  "Remote CI",
  "second operator"
]) {
  requireText(
    text.privacyAudit,
    expected,
    `privacy audit must preserve release-candidate privacy boundary: ${expected}`
  );
}

for (const expected of [
  "Current result: `FAIL`.",
  "validates evidence shape only",
  "Release surface review",
  "Artifact sanitization",
  "private-boundary",
  "Calendar/task minimization",
  "AI and automation boundaries",
  "Rights and lifecycle review",
  "clean public history",
  "remote CI",
  "security/licensing",
  "second-operator"
]) {
  requireText(
    text.evidenceContractDoc,
    expected,
    `privacy evidence contract doc must preserve shape requirement: ${expected}`
  );
}

for (const expected of [
  "releaseSafetyScanPass",
  "fixturesExamplesSanitized",
  "generatedArtifactsReviewed",
  "logsReviewed",
  "screenshotsReviewed",
  "exportsReviewed",
  "backupsReviewed",
  "localDatabasesExcludedOrSanitized",
  "providerIdentifiersMinimized",
  "tenantWorkspaceUserIdsFictional",
  "localPathsAbsent",
  "machineNamesAbsent",
  "privateUrlsAbsent",
  "privateLeadershipSystemMaterialAbsent",
  "hiddenLeadershipSystemApisAbsent",
  "calendarTitlesSanitized",
  "attendeesLocationsDescriptionsSanitized",
  "taskTitlesDescriptionsSanitized",
  "publicEventPayloadsMinimized",
  "providerTokensExcluded",
  "optionalAiInputsReviewed",
  "optionalAiOutputsReviewed",
  "promptsReviewed",
  "tracesLogsReviewed",
  "noPrivateOwnerData",
  "noCommercialLeadershipSystemScoringLogic",
  "retentionReviewed",
  "exportReviewed",
  "deletionReviewed",
  "providerRevocationReviewed",
  "cleanPublicHistoryReviewed",
  "remoteCiPrivacyProof",
  "securityAuditPass",
  "licensingAuditPass",
  "secondOperatorReview"
]) {
  requireText(
    text.evidenceContractSource,
    expected,
    `privacy evidence contract source must keep required field: ${expected}`
  );
}

for (const expected of [
  "final privacy audit evidence accepts complete release-grade evidence shape",
  "rejects missing release surface and artifact proof",
  "private identifiers",
  "missing AI",
  "rejects missing final release alignment",
  "/provider identifier/",
  "/private compatible leadership system/",
  "/hidden private leadership-only API/",
  "/security audit/",
  "/licensing audit/"
]) {
  requireText(
    text.evidenceContractTest,
    expected,
    `privacy evidence contract tests must keep rejection coverage: ${expected}`
  );
}

for (const expected of [
  "local absolute path",
  "personal email address",
  "private key block",
  "AWS access key",
  "OpenAI-style API key",
  "OAuth client secret assignment",
  "OAuth refresh token assignment",
  "OAuth access token assignment"
]) {
  requireText(
    text.releaseSafety,
    expected,
    `release safety scan must keep privacy/security rule: ${expected}`
  );
}

for (const expected of [
  "privacy:final-audit-readiness-packet",
  "final privacy audit packet requires explicit release safety scan",
  "private compatible leadership system boundary proof",
  "calendar/task minimization proof",
  "AI redaction boundary",
  "It does not mark privacy audit `PASS`"
]) {
  requireText(text.readme, expected, `README must preserve privacy readiness packet boundary: ${expected}`);
}

for (const expected of [
  "docs/security/privacy-audit.md",
  "do not open public issues",
  "Never commit real customer",
  "Use fictional demo IDs",
  "Redact secrets, tenant IDs",
  "privacy audit"
]) {
  requireText(text.securityPolicy, expected, `SECURITY.md must preserve privacy reporting boundary: ${expected}`);
}

for (const expected of [
  "- [ ] Privacy audit status changed `FAIL` to `PASS`.",
  "- [x] Final privacy audit approval guard foundation",
  "- [x] Privacy audit evidence refresh guard foundation"
]) {
  requireText(text.publicChecklist, expected, `public release checklist must preserve privacy audit boundary: ${expected}`);
}

for (const [label, content, expected] of [
  ["final release", text.finalReleaseChecklist, "Final privacy audit `PASS` proof"],
  ["security", text.securityChecklist, "Privacy/private-data scan proof"],
  ["licensing", text.licensingChecklist, "Security and privacy audit evidence remain aligned"]
]) {
  requireText(content, expected, `${label} checklist must preserve privacy audit dependency: ${expected}`);
}

for (const expected of [
  "privacy:final-audit-readiness-packet",
  "privacy:final-audit-approval:check",
  "privacy:audit-evidence-refresh:check",
  "release:safety",
  "security:audit-evidence-refresh:check",
  "security:final-audit-approval:check",
  "licensing:final-audit-approval:check"
]) {
  requireText(text.packageJson, expected, `package.json must keep privacy audit wiring: ${expected}`);
}

if (!packageJson.scripts?.check?.includes("npm run privacy:audit-evidence-refresh:check")) {
  failures.push("npm run check must include privacy audit evidence refresh guard.");
}

requireText(
  text.audit,
  "This is not final privacy audit approval.",
  "privacy audit evidence refresh audit must preserve non-approval caveat."
);

if (failures.length > 0) {
  console.error("Privacy audit evidence refresh guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Privacy audit evidence refresh guard passed.");

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

function requireText(content, expected, message) {
  if (!content.includes(expected)) {
    failures.push(message);
  }
}
