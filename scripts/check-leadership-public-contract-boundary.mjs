#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const publicChecklistPath = path.join(root, "docs", "public-release-checklist.md");
const doBothIntegrationPath = path.join(root, "docs", "integrations", "leadership-system.md");
const ownerOpsIntegrationPath = path.join(root, "docs", "integrations", "ownerops.md");
const connectOsIntegrationPath = path.join(root, "docs", "integrations", "connectos.md");
const readmePath = path.join(root, "README.md");
const apiPath = path.join(root, "src", "api.ts");
const apiTestPath = path.join(root, "src", "api.test.ts");
const privacyContractTestPath = path.join(
  root,
  "src",
  "final-privacy-audit-evidence-contract.test.ts"
);
const auditPath = path.join(
  root,
  "docs",
  "release-audit",
  "LEADERSHIP_PUBLIC_CONTRACT_BOUNDARY_GUARD_20260727.md"
);

const publicChecklist = readRequired(publicChecklistPath);
const doBothIntegration = readRequired(doBothIntegrationPath);
const ownerOpsIntegration = readRequired(ownerOpsIntegrationPath);
const connectOsIntegration = readRequired(connectOsIntegrationPath);
const readme = readRequired(readmePath);
const apiSource = readRequired(apiPath);
const apiTest = readRequired(apiTestPath);
const privacyContractTest = readRequired(privacyContractTestPath);
const audit = readRequired(auditPath);

if (existsSync(path.join(root, ".git"))) {
  failures.push(".git directory exists before compatible leadership system public-contract boundary review.");
}

for (const expected of [
  "compatible leadership system is optional.",
  "ScheduleOS must work when compatible leadership system",
  "There must be no hidden private leadership-only API.",
  "ConnectOS = external signals",
  "OwnerOps = owned work",
  "ScheduleOS = time, capacity",
  "compatible leadership system = leadership judgment",
  "ScheduleOS must not receive or store private compatible leadership system reasoning",
  "compatible leadership system should compose all three pillars through public contracts",
  "compatible leadership system may enrich scheduling requests with public scheduling hints",
  "compatible leadership system is an example consumer, not a privileged caller.",
  "Private compatible leadership system strings do not appear in public fixtures.",
]) {
  requireText(doBothIntegration, expected, `compatible leadership system integration doc must preserve boundary: ${expected}`);
}

for (const expected of [
  "OwnerOps is optional.",
  "ScheduleOS must work when OwnerOps",
  "ScheduleOS must not import private OwnerOps internals.",
  "integrate through public APIs, SDKs, webhooks, or event contracts.",
]) {
  requireText(ownerOpsIntegration, expected, `OwnerOps integration doc must preserve boundary: ${expected}`);
}

for (const expected of [
  "ConnectOS is optional. ScheduleOS must work when ConnectOS is disconnected.",
  "ScheduleOS should not receive raw provider tokens from ConnectOS.",
  "connection reference",
  "capability reference",
  "access token in ScheduleOS logs",
  "refresh token in ScheduleOS storage",
]) {
  requireText(connectOsIntegration, expected, `ConnectOS integration doc must preserve boundary: ${expected}`);
}

for (const expected of [
  "Mock OwnerOps public task import foundation",
  "Mock ConnectOS public calendar import foundation",
  "compatible leadership system may consume ScheduleOS only through the same public interfaces",
]) {
  requireText(readme, expected, `README must preserve public integration foundation: ${expected}`);
}

for (const expected of [
  "parseOwnerOpsTaskImportRequest",
  "parseConnectOsCalendarImportRequest",
  "parseScheduleGuidanceApplyRequest",
  "scheduleGuidanceAuditEvent",
  "ConnectOS payload must not include provider credential field",
]) {
  requireText(apiSource, expected, `API source must keep public integration boundary: ${expected}`);
}

for (const expected of [
  "imports mock OwnerOps work through public contract",
  "imports mock ConnectOS calendar events without provider tokens",
  "applies public schedule guidance without requiring compatible leadership system",
  "runs mock OwnerOps and ConnectOS adapters end to end",
]) {
  requireText(apiTest, expected, `API tests must keep public integration coverage: ${expected}`);
}

for (const expected of [
  "hiddenLeadershipSystemApisAbsent",
  "commercial compatible leadership system scoring",
]) {
  requireText(
    privacyContractTest,
    expected,
    `final privacy audit tests must keep compatible leadership system boundary coverage: ${expected}`
  );
}

requireText(
  publicChecklist,
  "- [x] compatible leadership system public-contract boundary guard foundation",
  "public release checklist must record compatible leadership system public-contract boundary guard foundation."
);
requireText(
  audit,
  "This is not compatible leadership system production integration approval.",
  "compatible leadership system public-contract boundary audit must preserve non-approval caveat."
);

if (failures.length > 0) {
  console.error("compatible leadership system public-contract boundary guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("compatible leadership system public-contract boundary guard passed.");

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
