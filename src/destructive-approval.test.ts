import test from "node:test";
import assert from "node:assert/strict";
import {
  requireDestructiveConfirmation,
  restoreOverwriteConfirmation,
  scopedConfirmation,
  timedScopedConfirmation
} from "./destructive-approval.js";

const scope = {
  tenantId: "tenant_demo",
  workspaceId: "workspace_demo",
  userId: "user_jordan"
};

test("destructive approval builds scoped confirmation strings", () => {
  assert.equal(scopedConfirmation(scope), "tenant_demo/workspace_demo/user_jordan");
  assert.equal(
    timedScopedConfirmation(scope, new Date("2026-07-22T12:00:00.000Z")),
    "tenant_demo/workspace_demo/user_jordan/2026-07-22T12:00:00.000Z"
  );
  assert.equal(
    restoreOverwriteConfirmation(scope, "restore/scheduleos.db"),
    "tenant_demo/workspace_demo/user_jordan/overwrite/restore/scheduleos.db"
  );
});

test("destructive approval requires exact confirmation", () => {
  const approved = requireDestructiveConfirmation(
    "tenant_demo/workspace_demo/user_jordan",
    "tenant_demo/workspace_demo/user_jordan",
    "workspace delete"
  );
  const rejected = requireDestructiveConfirmation(
    "tenant_demo/wrong/user_jordan",
    "tenant_demo/workspace_demo/user_jordan",
    "workspace delete"
  );

  assert.equal(approved.approved, true);
  assert.equal(rejected.approved, false);
  assert.match(rejected.refusal, /Refusing workspace delete/);
});
