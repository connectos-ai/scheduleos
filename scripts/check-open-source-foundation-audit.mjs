#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const auditPath = path.join(root, "docs", "research", "open-source-scheduler-audit.md");
const refreshPath = path.join(
  root,
  "docs",
  "research",
  "open-source-scheduler-audit-refresh-20260727.md"
);
const publicChecklistPath = path.join(root, "docs", "public-release-checklist.md");
const adrPath = path.join(root, "docs", "architecture", "ADR-001-build-foundation.md");
const solverDesignPath = path.join(root, "docs", "architecture", "solver-design.md");

const audit = readRequired(auditPath);
const refresh = readRequired(refreshPath);
const publicChecklist = readRequired(publicChecklistPath);
const adr = readRequired(adrPath);
const solverDesign = readRequired(solverDesignPath);

if (process.env.SCHEDULEOS_REQUIRE_NO_GIT === "true" && existsSync(path.join(root, ".git"))) {
  failures.push(".git directory exists before open-source foundation audit approval.");
}

for (const expected of [
  "No audited project should be adopted wholesale as ScheduleOS.",
  "Strategy C",
  "FluidCalendar",
  "Plazen",
  "Zero Calendar",
  "Super Productivity",
  "KiraPilot",
  "Timefold Solver",
  "Timefold Solver Python",
  "Google OR-Tools",
  "No source code",
  "Foundation audit gate: PARTIAL PASS",
  "## Remaining Research Work",
]) {
  requireText(audit, expected, `open-source scheduler audit must preserve requirement: ${expected}`);
}

for (const expected of [
  "Date: 2026-07-27",
  "does not approve code copying",
  "foundation audit gate remains `PARTIAL PASS`",
  "FluidCalendar",
  "Plazen",
  "Zero Calendar",
  "Super Productivity",
  "KiraPilot",
  "Timefold Solver",
  "Timefold Solver Python",
  "Google OR-Tools",
  "Do not adopt any audited project wholesale.",
  "tiny Timefold ScheduleOS task-to-timeblock prototype",
  "tiny OR-Tools CP-SAT benchmark",
  "ScheduleOS release status remains `FAIL`.",
]) {
  requireText(refresh, expected, `open-source audit refresh must preserve requirement: ${expected}`);
}

for (const expected of [
  "- [x] Open-source scheduler foundation audit refresh guard",
  "does not approve code copying",
  "Timefold Solver Java/Kotlin",
  "Google OR-Tools",
]) {
  requireText(publicChecklist, expected, `public release checklist must preserve audit guard note: ${expected}`);
}

for (const expected of [
  "Treat Timefold Solver for Java/Kotlin as the primary optimization engine candidate.",
  "Treat Google OR-Tools as the alternate solver and benchmark candidate.",
  "Do not use Timefold Solver Python as the primary engine",
]) {
  requireText(adr, expected, `build foundation ADR must preserve solver candidate decision: ${expected}`);
}

for (const expected of [
  "Do not claim Timefold or OR-Tools support until adapter tests run.",
  "TimefoldSolverAdapter",
  "OR-Tools adapter",
]) {
  requireText(solverDesign, expected, `solver design must preserve solver boundary: ${expected}`);
}

if (failures.length > 0) {
  console.error("Open-source foundation audit guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Open-source foundation audit guard passed.");

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
