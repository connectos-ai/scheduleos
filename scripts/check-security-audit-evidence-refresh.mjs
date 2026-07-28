#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const files = {
  approvalChecklist: "docs/security/final-security-audit-approval-checklist.md",
  evidenceContractDoc: "docs/security/final-security-audit-evidence-contract.md",
  evidenceContractSource: "src/final-security-audit-evidence-contract.ts",
  evidenceContractTest: "src/final-security-audit-evidence-contract.test.ts",
  releaseSafety: "scripts/check-release-safety.mjs",
  securityPolicy: "SECURITY.md",
  publicChecklist: "docs/public-release-checklist.md",
  finalReleaseChecklist: "docs/release/final-release-gate-approval-checklist.md",
  dependencyChecklist: "docs/security/final-dependency-audit-approval-checklist.md",
  privacyChecklist: "docs/security/final-privacy-audit-approval-checklist.md",
  licensingChecklist: "docs/security/final-licensing-audit-approval-checklist.md",
  packageJson: "package.json",
  audit: "docs/release-audit/SECURITY_AUDIT_EVIDENCE_REFRESH_GUARD_20260728.md"
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, relativePath]) => [
    key,
    readRequired(relativePath)
  ])
);

const packageJson = parseJson(text.packageJson, "package.json");

if (existsSync(path.join(root, ".git"))) {
  failures.push(".git directory exists before final security audit approval.");
}

for (const expected of [
  "Current result: `FAIL`.",
  "The security audit is not approved for public release",
  "No public repository, hosted deployment, tag, package publication, or release announcement may rely on the final security audit",
  "Dependency audit final pass proof",
  "Secret scan proof",
  "Privacy/private-data scan proof",
  "Production auth/session approval checklist is `PASS`",
  "Production rate-limit and abuse-monitoring approval checklist is `PASS`",
  "provider managed-secret lifecycle",
  "Production deployment TLS/proxy/header proof",
  "Remote CI proof",
  "Security policy contact is configured",
  "Final source review confirms no private compatible leadership system code",
  "final privacy/licensing audit alignment",
  "clean public history",
  "Second operator approves the final security audit evidence packet",
  "This packet does not mark security audit `PASS`",
  "Do not mark \"Security audit status changed `FAIL` to `PASS`\" complete"
]) {
  requireText(text.approvalChecklist, expected, `final security checklist must preserve evidence boundary: ${expected}`);
}

for (const expected of [
  "Current result: `FAIL`.",
  "does not mark the security audit `PASS`",
  "Dependency and supply-chain proof",
  "Release scans",
  "Auth and access proof",
  "Abuse and provider-security proof",
  "Deployment and operations proof",
  "Remote CI and repository proof",
  "Disclosure and final review proof",
  "second_operator_security_review_demo",
  "ScheduleOS release status remains `FAIL`"
]) {
  requireText(text.evidenceContractDoc, expected, `security evidence contract doc must preserve evidence shape: ${expected}`);
}

for (const expected of [
  "dependencyAndSupplyChain",
  "dependencyAuditPass",
  "noRegistrySecrets",
  "releaseSafetyPass",
  "secretScanPass",
  "personalDataScanPass",
  "noPrivateLeadershipSystemMaterial",
  "noPrivateMachinePaths",
  "productionAuthApproved",
  "sessionCookieCsrfReviewed",
  "productionRateLimitApproved",
  "distributedThrottleProof",
  "managedSecretLifecycleApproved",
  "tlsProxyHeadersReviewed",
  "securityHeadersReviewed",
  "logRedactionReviewed",
  "remoteCiProof",
  "postgresProofAccepted",
  "branchProtectionReviewed",
  "repositorySettingsReviewed",
  "securityPolicyContactConfigured",
  "privateReportSanitizationReviewed",
  "privacyAuditPass",
  "licensingAuditPass",
  "secondOperatorReview"
]) {
  requireText(text.evidenceContractSource, expected, `security evidence contract source must keep field: ${expected}`);
}

for (const expected of [
  "accepts complete release-grade evidence shape",
  "rejects missing dependency and scan proof",
  "rejects missing auth abuse and provider proof",
  "rejects missing deployment and remote CI proof",
  "rejects missing disclosure final approvals",
  "dependency audit",
  "releaseSafetyPass",
  "production auth",
  "managed-secret",
  "TLS and proxy",
  "remote CI proof",
  "security policy contact",
  "second operator"
]) {
  requireText(text.evidenceContractTest, expected, `security evidence contract tests must keep coverage: ${expected}`);
}

for (const expected of [
  "local absolute path",
  "AWS access key",
  "Slack token",
  "OpenAI-style API key",
  "private key block",
  "OAuth client secret assignment",
  "OAuth refresh token assignment",
  "OAuth access token assignment",
  "personal email address"
]) {
  requireText(text.releaseSafety, expected, `release safety scan must keep security rule: ${expected}`);
}

for (const expected of [
  "Current Status",
  "Do not treat this policy as a configured public vulnerability contact yet.",
  "Until a public repository security contact is configured",
  "do not open public issues for security reports",
  "Do not add fictional email addresses",
  "Never commit secrets",
  "Use fictional demo IDs",
  "Treat imported calendar, task, message, webhook, CSV, ICS, and AI input as untrusted.",
  "security audit may only change from `FAIL` to `PASS`"
]) {
  requireText(text.securityPolicy, expected, `SECURITY.md must preserve pre-release security boundary: ${expected}`);
}

for (const expected of [
  "- [ ] Security audit status changed `FAIL` to `PASS`.",
  "- [x] Final security audit approval guard foundation",
  "- [x] Security audit evidence refresh guard foundation"
]) {
  requireText(text.publicChecklist, expected, `public release checklist must preserve security audit boundary: ${expected}`);
}

for (const [label, content, expected] of [
  ["final release", text.finalReleaseChecklist, "Final security audit `PASS` proof"],
  ["dependency", text.dependencyChecklist, "Security, privacy, and licensing audits remain `PASS`"],
  ["privacy", text.privacyChecklist, "security/licensing audit alignment"],
  ["licensing", text.licensingChecklist, "security/privacy audit alignment"]
]) {
  requireText(content, expected, `${label} checklist must preserve security audit dependency: ${expected}`);
}

for (const expected of [
  "security:final-audit-readiness-packet",
  "security:final-audit-approval:check",
  "security:audit-evidence-refresh:check",
  "release:safety",
  "privacy:final-audit-approval:check",
  "licensing:final-audit-approval:check",
  "dependency:final-audit-approval:check"
]) {
  requireText(text.packageJson, expected, `package.json must keep security audit wiring: ${expected}`);
}

if (!packageJson.scripts?.check?.includes("npm run security:audit-evidence-refresh:check")) {
  failures.push("npm run check must include security audit evidence refresh guard.");
}

requireText(
  text.audit,
  "This is not final security audit approval.",
  "security audit evidence refresh audit must preserve non-approval caveat."
);

if (failures.length > 0) {
  console.error("Security audit evidence refresh guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Security audit evidence refresh guard passed.");

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
