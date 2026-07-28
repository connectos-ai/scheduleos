#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const files = {
  packageJson: "package.json",
  packageLock: "package-lock.json",
  license: "LICENSE",
  approvalChecklist: "docs/security/final-licensing-audit-approval-checklist.md",
  licensingAudit: "docs/security/licensing-audit.md",
  evidenceContractDoc: "docs/security/final-licensing-audit-evidence-contract.md",
  evidenceContractSource: "src/final-licensing-audit-evidence-contract.ts",
  evidenceContractTest: "src/final-licensing-audit-evidence-contract.test.ts",
  licenseCheck: "scripts/check-licenses.mjs",
  readme: "README.md",
  publicChecklist: "docs/public-release-checklist.md",
  finalReleaseChecklist: "docs/release/final-release-gate-approval-checklist.md",
  dependencyChecklist: "docs/security/final-dependency-audit-approval-checklist.md",
  securityChecklist: "docs/security/final-security-audit-approval-checklist.md",
  privacyChecklist: "docs/security/final-privacy-audit-approval-checklist.md",
  audit: "docs/release-audit/LICENSING_AUDIT_EVIDENCE_REFRESH_GUARD_20260728.md"
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, relativePath]) => [
    key,
    readRequired(relativePath)
  ])
);
const packageJson = parseJson(text.packageJson, "package.json");
const packageLock = parseJson(text.packageLock, "package-lock.json");

if (process.env.SCHEDULEOS_REQUIRE_NO_GIT === "true" && existsSync(path.join(root, ".git"))) {
  failures.push(".git directory exists before final licensing audit approval.");
}

if (packageJson.name !== "scheduleos") {
  failures.push("package.json name must remain scheduleos.");
}
if (packageJson.license !== "Apache-2.0") {
  failures.push("package.json license must remain Apache-2.0.");
}
if (!text.license.includes("Apache License") || !text.license.includes("Version 2.0")) {
  failures.push("root LICENSE must remain Apache License 2.0 text.");
}

const allowedLicenses = new Set(["Apache-2.0", "ISC", "MIT"]);
const packages = packageLock.packages ?? {};
for (const [packagePath, metadata] of Object.entries(packages)) {
  if (packagePath === "") continue;
  if (!allowedLicenses.has(metadata.license)) {
    failures.push(`${packagePath} has unsupported lockfile license ${metadata.license ?? "(missing)"}.`);
  }
  if (!String(metadata.resolved ?? "").startsWith("https://registry.npmjs.org/")) {
    failures.push(`${packagePath} must resolve from public npm registry.`);
  }
  if (!String(metadata.integrity ?? "").startsWith("sha512-")) {
    failures.push(`${packagePath} must keep sha512 lockfile integrity metadata.`);
  }
}

for (const expected of [
  "Current result: `FAIL`.",
  "licensing audit is not approved for public release",
  "No public repository",
  "Final `npm run license:check` proof",
  "Final `npm ls --omit=dev --all` installed production dependency tree review proof",
  "Lockfile dependency license proof",
  "Installed dependency metadata proof",
  "Copied-source scan proof",
  "Fixture, template",
  "Asset, media",
  "Documentation reuse scan proof",
  "Reused-material inventory proof",
  "NOTICE requirement review proof",
  "Root Apache-2.0 consistency proof",
  "Final release-candidate freeze proof",
  "Remote CI proof",
  "audit evidence remain aligned",
  "Second operator approves final licensing audit evidence packet"
]) {
  requireText(
    text.approvalChecklist,
    expected,
    `final licensing audit checklist must preserve evidence requirement: ${expected}`
  );
}

for (const expected of [
  "Current result: `FAIL`.",
  "Apache License 2.0",
  "npm run license:check",
  "package-lock.json",
  "installed package metadata",
  "copied-source",
  "Fixture/template/example-like files",
  "NOTICE trigger",
  "No copied third-party source code",
  "No project-owned binary/media/font assets",
  "Final Licensing Audit Readiness Packet",
  "approve publication",
  "Do not publish ScheduleOS"
]) {
  requireText(
    text.licensingAudit,
    expected,
    `licensing audit must preserve release-candidate license boundary: ${expected}`
  );
}

for (const expected of [
  "Current result: `FAIL`.",
  "validates evidence shape only",
  "Root license proof",
  "Dependency license proof",
  "documentation reuse proof",
  "Fixture, template, example, asset, media, font, icon, binary",
  "Reused-material inventory",
  "NOTICE",
  "Final release alignment",
  "remote CI",
  "security/privacy/dependency alignment",
  "second-operator"
]) {
  requireText(
    text.evidenceContractDoc,
    expected,
    `licensing evidence contract doc must preserve shape requirement: ${expected}`
  );
}

for (const expected of [
  "packageMetadataApache2",
  "licenseFileApache2",
  "readmeLicenseConsistent",
  "packagePublicationMetadataReviewed",
  "repositorySettingsReviewed",
  "finalLicenseCheckPass",
  "packageLockReviewed",
  "installedDependencyMetadataReviewed",
  "productionDependencyTreeReviewed",
  "allowedLicensesOnly",
  "transitiveLicensesReviewed",
  "copiedSourceScanPass",
  "documentationReuseScanPass",
  "thirdPartySnippetsAbsentOrApproved",
  "generatedSummariesReviewed",
  "screenshotsDiagramsReviewed",
  "attributionRequirementsRecorded",
  "fixturesTemplatesExamplesReviewed",
  "samplesFictionalAndProjectOwned",
  "assetsMediaFontsIconsReviewed",
  "binaryArtifactsAbsentOrApproved",
  "sourceMapsCoverageReviewed",
  "inventoryComplete",
  "projectVersionCommitRecorded",
  "licenseRecorded",
  "copiedVsReferencedRecorded",
  "noticeRequirementReviewed",
  "noticeFileAddedWhenRequired",
  "noticeAbsenceApprovedWhenUnneeded",
  "distributionArtifactsReviewed",
  "packageTarballReviewed",
  "releaseCandidateFrozen",
  "dependencyAuditPass",
  "securityAuditPass",
  "privacyAuditPass",
  "remoteCiLicenseProof",
  "cleanPublicHistoryReviewed",
  "secondOperatorReview"
]) {
  requireText(
    text.evidenceContractSource,
    expected,
    `licensing evidence contract source must keep required field: ${expected}`
  );
}

for (const expected of [
  "final licensing audit evidence accepts complete release-grade evidence shape",
  "rejects missing root and dependency proof",
  "rejects copied material and artifact gaps",
  "rejects incomplete reused-material and NOTICE proof",
  "rejects missing final release alignment",
  "package metadata",
  "license:check",
  "installed dependency metadata",
  "copied-source",
  "documentation reuse",
  "fixture, template, and example",
  "binary artifacts",
  "reused-material inventory",
  "NOTICE requirement",
  "dependency audit",
  "security audit",
  "privacy audit",
  "remote CI licensing",
  "second operator"
]) {
  requireText(
    text.evidenceContractTest,
    expected,
    `licensing evidence contract tests must keep rejection coverage: ${expected}`
  );
}

for (const expected of [
  "allowedLicenses",
  "Apache-2.0",
  "ISC",
  "MIT",
  "forbiddenAssetExtensions",
  ".png",
  ".svg",
  ".woff2",
  "copiedSourcePatterns",
  "SPDX-License-Identifier",
  "Permission is hereby",
  "copied",
  "adapted",
  "noticeTriggerPatterns",
  "requires",
  "NOTICE file",
  "third-party",
  "fixtureLikePathPattern",
  "package-lock.json",
  "package-lock license",
  "does not match installed package license",
  "License check passed"
]) {
  requireText(text.licenseCheck, expected, `license checker must preserve rule: ${expected}`);
}

for (const expected of [
  "licensing:final-audit-readiness-packet",
  "final licensing audit packet records required final license check",
  "lockfile dependency licenses",
  "installed dependency metadata",
  "copied-source scan",
  "fixture/template/example review",
  "asset/media/font/binary review",
  "documentation reuse scan",
  "reused-material inventory",
  "NOTICE review",
  "root Apache-2.0 consistency",
  "final release-candidate freeze",
  "It does not mark licensing audit `PASS`",
  "Local licensing evidence commands reviewers should attach"
]) {
  requireText(text.readme, expected, `README must preserve licensing readiness packet boundary: ${expected}`);
}

for (const expected of [
  "- [ ] Licensing audit status changed `FAIL` to `PASS`.",
  "- [x] Final licensing audit approval guard foundation",
  "- [x] Licensing audit evidence refresh guard foundation"
]) {
  requireText(text.publicChecklist, expected, `public release checklist must preserve licensing audit boundary: ${expected}`);
}

for (const [label, content, expected] of [
  ["final release", text.finalReleaseChecklist, "Final licensing audit `PASS` proof"],
  ["dependency", text.dependencyChecklist, "license-alignment"],
  ["security", text.securityChecklist, "final privacy/licensing alignment"],
  ["privacy", text.privacyChecklist, "security/licensing audit alignment"]
]) {
  requireText(content, expected, `${label} checklist must preserve licensing audit dependency: ${expected}`);
}

for (const expected of [
  "license:check",
  "licensing:final-audit-readiness-packet",
  "licensing:audit-evidence-refresh:check",
  "licensing:final-audit-approval:check",
  "dependency:audit-evidence-refresh:check",
  "security:audit-evidence-refresh:check",
  "privacy:audit-evidence-refresh:check"
]) {
  requireText(text.packageJson, expected, `package.json must keep licensing audit wiring: ${expected}`);
}

if (!packageJson.scripts?.check?.includes("npm run licensing:audit-evidence-refresh:check")) {
  failures.push("npm run check must include licensing audit evidence refresh guard.");
}

requireText(
  text.audit,
  "This is not final licensing audit approval.",
  "licensing audit evidence refresh audit must preserve non-approval caveat."
);

if (failures.length > 0) {
  console.error("Licensing audit evidence refresh guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Licensing audit evidence refresh guard passed.");

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
