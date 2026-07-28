import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateScheduleOSCiWorkflow } from "./ci-workflow-validation.js";

test("GitHub Actions CI workflow includes public release evidence foundations", () => {
  const text = readFileSync(".github/workflows/ci.yml", "utf8");
  const result = validateScheduleOSCiWorkflow(text);

  assert.deepEqual(result, { ok: true, findings: [] });
});

test("GitHub Actions CI workflow validator rejects unsafe release mutation patterns", () => {
  const text = [
    "name: CI",
    "on:",
    " pull_request_target:",
    "permissions:",
    " contents: write",
    "jobs:",
    " quality:",
    " runs-on: ubuntu-latest",
    " timeout-minutes: 15",
    " steps:",
    " - run: npm publish",
    " - run: git tag v0.0.0",
    " - run: git push origin main"
  ].join("\n");

  const result = validateScheduleOSCiWorkflow(text);

  assert.equal(result.ok, false);
  assert.match(result.findings.join("\n"), /forbidden pull_request_target trigger/);
  assert.match(result.findings.join("\n"), /forbidden contents write permission/);
  assert.match(result.findings.join("\n"), /forbidden package publication/);
  assert.match(result.findings.join("\n"), /forbidden tag creation/);
  assert.match(result.findings.join("\n"), /forbidden git push/);
});
