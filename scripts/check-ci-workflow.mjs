#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { validateScheduleOSCiWorkflow } from "../dist/ci-workflow-validation.js";

const workflowPath = ".github/workflows/ci.yml";
const result = validateScheduleOSCiWorkflow(readFileSync(workflowPath, "utf8"));

if (!result.ok) {
  console.error("GitHub Actions CI workflow validation failed:");
  for (const finding of result.findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log("GitHub Actions CI workflow validation passed.");
