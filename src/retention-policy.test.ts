import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateRetentionCutoffs,
  scheduleOSRetentionPolicy
} from "./retention-policy.js";

test("retention policy defines concrete operational durations", () => {
  const byCategory = new Map(
    scheduleOSRetentionPolicy.map((entry) => [entry.category, entry.retentionDays])
  );

  assert.equal(byCategory.get("ACTIVE_USER_DATA"), null);
  assert.equal(byCategory.get("WORKSPACE_EXPORT"), 7);
  assert.equal(byCategory.get("PLAINTEXT_BACKUP"), 7);
  assert.equal(byCategory.get("ENCRYPTED_BACKUP"), 30);
  assert.equal(byCategory.get("AUDIT_EVENT"), 365);
  assert.equal(byCategory.get("IDEMPOTENCY_RECORD"), 30);
  assert.equal(byCategory.get("AUTH_SESSION"), 30);
  assert.equal(byCategory.get("AUTH_PASSWORD_RESET_TOKEN"), 7);
  assert.equal(byCategory.get("AUTH_LOGIN_ATTEMPT_WINDOW"), 14);
  assert.equal(byCategory.get("IMPORT_THROTTLE_WINDOW"), 14);
  assert.equal(byCategory.get("CALENDAR_SYNC_STATE"), 90);
  assert.equal(byCategory.get("INTEGRATION_SYNC_METADATA"), 90);
  assert.equal(byCategory.get("SCHEDULE_PLAN_HISTORY"), 180);
  assert.equal(byCategory.get("DELETED_WORKSPACE_OPERATOR_NOTE"), 365);
});

test("retention cutoffs calculate delete-before timestamps from as-of date", () => {
  const cutoffs = calculateRetentionCutoffs(new Date("2026-07-22T12:00:00.000Z"));
  const byCategory = new Map(cutoffs.map((cutoff) => [cutoff.category, cutoff]));

  assert.equal(byCategory.get("ACTIVE_USER_DATA")?.deleteBefore, null);
  assert.equal(byCategory.get("WORKSPACE_EXPORT")?.deleteBefore, "2026-07-15T12:00:00.000Z");
  assert.equal(byCategory.get("PLAINTEXT_BACKUP")?.deleteBefore, "2026-07-15T12:00:00.000Z");
  assert.equal(byCategory.get("ENCRYPTED_BACKUP")?.deleteBefore, "2026-06-22T12:00:00.000Z");
  assert.equal(byCategory.get("AUTH_LOGIN_ATTEMPT_WINDOW")?.deleteBefore, "2026-07-08T12:00:00.000Z");
  assert.equal(byCategory.get("IMPORT_THROTTLE_WINDOW")?.deleteBefore, "2026-07-08T12:00:00.000Z");
});

test("retention cutoffs reject invalid dates", () => {
  assert.throws(
    () => calculateRetentionCutoffs(new Date("not-a-date")),
    /Retention cutoff date is invalid/
  );
});
