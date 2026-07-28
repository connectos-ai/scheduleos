#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const fixturePath = path.join(root, "examples", "fictional-demo-workspace.json");
const docsPath = path.join(root, "docs", "product", "examples-and-demo-data.md");
const testPath = path.join(root, "src", "demo-workspace-example.test.ts");
const publicChecklistPath = path.join(root, "docs", "public-release-checklist.md");
const auditPath = path.join(
  root,
  "docs",
  "release-audit",
  "FICTIONAL_DEMO_WORKSPACE_FOUNDATION_20260727.md"
);
const transferPath = path.join(
  root,
  "docs",
  "SESSION_TRANSFER_2026-07-27_FICTIONAL_DEMO_WORKSPACE_FOUNDATION.md"
);

const fixtureText = readRequired(fixturePath);
const docs = readRequired(docsPath);
const testSource = readRequired(testPath);
const publicChecklist = readRequired(publicChecklistPath);
const audit = readRequired(auditPath);
const transfer = readRequired(transferPath);

if (existsSync(path.join(root, ".git"))) {
  failures.push(".git directory exists before fictional demo-data public boundary review.");
}

let fixture;
try {
  fixture = JSON.parse(fixtureText);
} catch (error) {
  failures.push("examples/fictional-demo-workspace.json must remain valid JSON.");
  fixture = {};
}

if (fixture.status !== "fictional-demo-only") {
  failures.push("fictional demo workspace status must remain fictional-demo-only.");
}
for (const [field, expected] of [
  ["tenantId", "tenant_demo"],
  ["workspaceId", "workspace_demo"],
  ["userId", "user_jordan"],
  ["timezone", "UTC"],
]) {
  if (fixture[field] !== expected) {
    failures.push(`fictional demo workspace ${field} must remain ${expected}.`);
  }
}

if (!Array.isArray(fixture.calendarEvents) || fixture.calendarEvents.length < 2) {
  failures.push("fictional demo workspace must include local and ConnectOS-shaped calendar events.");
}
if (!Array.isArray(fixture.tasks) || fixture.tasks.length < 6) {
  failures.push("fictional demo workspace must include required task coverage.");
}
if (!Array.isArray(fixture.leadershipSystemPublicGuidance) || fixture.leadershipSystemPublicGuidance.length < 1) {
  failures.push("fictional demo workspace must include compatible leadership system public guidance example.");
}
if (!fixture.newMeetingForReplan) {
  failures.push("fictional demo workspace must include newMeetingForReplan.");
}

for (const expected of [
  "Riverstone creative deep work",
  "Northstar split report",
  "Harbor Community",
  "event_harbor_fixed_meeting",
  "event_connectos_private_hold",
  "task_riverstone_deep_work",
  "task_northstar_split_report",
  "task_harbor_follow_up",
  "task_morning_habit",
  "ownerops_OWNEROPS_ownerops_demo_decision",
  "task_over_capacity",
  "DOBOTH_PUBLIC_EXAMPLE",
]) {
  requireText(fixtureText, expected, `fictional demo fixture must preserve coverage marker: ${expected}`);
}

for (const forbidden of [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu,
  /\b(accessToken|refreshToken|idToken|apiKey|clientSecret|password|authorization)\b/iu,
  /\b(slack|gmail|google|microsoft|outlook|todoist|linear|asana|clickup|trello)\b/iu,
  /\b100\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/u,
  /\bubuntu-imacpro\b/iu,
  /\bcodex-macbook\b/iu,
]) {
  if (forbidden.test(fixtureText)) {
    failures.push(`fictional demo fixture contains forbidden public-demo pattern: ${forbidden}`);
  }
}

for (const expected of [
  "Local fictional demo-data foundation",
  "does not approve public release",
  "examples/fictional-demo-workspace.json",
  "OwnerOps task import shape",
  "ConnectOS private calendar event shape",
  "compatible leadership system public leadership-priority enrichment shape",
  "fixture is not production data",
]) {
  requireText(docs, expected, `examples and demo data doc must preserve boundary: ${expected}`);
}

for (const expected of [
  "fictional demo workspace validates required open-source example coverage",
  "fictional-demo-only",
  "tenant_demo",
  "CONNECTOS",
  "OWNEROPS",
  "leadershipSystemPublicGuidance",
  "BLOCK_PRESERVED",
]) {
  requireText(testSource, expected, `demo workspace test must preserve coverage: ${expected}`);
}

for (const expected of [
  "- [x] Fictional demo data boundary guard foundation",
  "email-shaped strings",
  "credential fields",
  "production provider names",
]) {
  requireText(publicChecklist, expected, `public release checklist must record demo-data guard: ${expected}`);
}

for (const expected of [
  "does not approve production provider fixtures",
  "Release remains `FAIL`",
]) {
  requireText(audit, expected, `fictional demo audit must preserve boundary: ${expected}`);
}

requireText(
  transfer,
  "fictional demo workspace",
  "fictional demo transfer note must remain available."
);

if (failures.length > 0) {
  console.error("Fictional demo data boundary guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Fictional demo data boundary guard passed.");

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
