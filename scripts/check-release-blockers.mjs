#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const checklistPath = path.join(root, "docs", "public-release-checklist.md");
const failures = [];

const requiredUncheckedBlockers = [
  "Standalone production web app beyond local foundations",
  "Production calendar UI hardening",
  "Release-grade ICS workflow",
  "Production-grade provider CSV import workflow",
  "Production managed secret storage and durable hosted public-event workers/observability",
  "Production-grade webhook/provider lifecycle enforcement",
  "Production distributed rate limiting",
  "Production persisted auth, roles, memberships, and session model approved for public release",
  "Successful remote CI PostgreSQL proof",
  "Hosted retention cleanup production destructive-operation approvals",
  "Dependency audit final pass",
  "Security audit status changed `FAIL` to `PASS`",
  "Privacy audit status changed `FAIL` to `PASS`",
  "Licensing audit status changed `FAIL` to `PASS`",
  "Clean public history prepared",
  "CI run verified on public remote",
  "Security policy contact configured",
  "Public repository created only after all gates pass"
];

if (!existsSync(checklistPath)) {
  console.error("Release blocker guard failed:");
  console.error("- docs/public-release-checklist.md is missing.");
  process.exit(1);
}

const checklist = readFileSync(checklistPath, "utf8");

requireText("Current result: `FAIL`.");
requireText(
  "ScheduleOS must not be published, pushed to a public remote, tagged, packaged, deployed publicly, or announced until every required release gate passes."
);

for (const blocker of requiredUncheckedBlockers) {
  const uncheckedPattern = new RegExp(
    `^- \\[ \\] ${escapeRegExp(blocker)}`,
    "mu"
  );
  const checkedPattern = new RegExp(`^- \\[x\\] ${escapeRegExp(blocker)}`, "mui");

  if (!uncheckedPattern.test(checklist)) {
    failures.push(`required release blocker must remain unchecked: ${blocker}`);
  }
  if (checkedPattern.test(checklist)) {
    failures.push(`required release blocker was checked prematurely: ${blocker}`);
  }
}

if (failures.length > 0) {
  console.error("Release blocker guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Release blocker guard passed for ${requiredUncheckedBlockers.length} unchecked blocker(s).`
);

function requireText(text) {
  if (!checklist.includes(text)) {
    failures.push(`public-release-checklist.md must include: ${text}`);
  }
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
