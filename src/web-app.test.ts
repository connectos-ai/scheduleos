import test from "node:test";
import assert from "node:assert/strict";
import { renderScheduleOsAppHtml } from "./web-app.js";

test("standalone web app renders credential login controls instead of API-key auth", () => {
  const html = renderScheduleOsAppHtml();

  assert.match(html, /id="login-form"/);
  assert.match(html, /id="logout-button"/);
  assert.match(html, /id="auth-password"/);
  assert.match(html, /api\/auth\/login/);
  assert.match(html, /api\/auth\/session/);
  assert.match(html, /x-csrf-token/);
  assert.match(html, /credentials: "same-origin"/);
  assert.doesNotMatch(html, /id="api-key"/);
  assert.doesNotMatch(html, /localStorage/);
  assert.doesNotMatch(html, /sessionStorage/);
});

test("standalone web app renders local password reset request and confirmation controls", () => {
  const html = renderScheduleOsAppHtml();

  assert.match(html, /id="password-reset-request-form"/);
  assert.match(html, /id="password-reset-confirm-form"/);
  assert.match(html, /id="reset-token"/);
  assert.match(html, /api\/auth\/password-reset-requests/);
  assert.match(html, /api\/auth\/password-reset/);
  assert.match(html, /If the account is eligible/);
  assert.doesNotMatch(html, /localStorage/);
  assert.doesNotMatch(html, /sessionStorage/);
});

test("standalone web app renders local owner admin management controls", () => {
  const html = renderScheduleOsAppHtml();

  assert.match(html, /id="admin-user-form"/);
  assert.match(html, /id="admin-membership-form"/);
  assert.match(html, /id="admin-credential-reset-form"/);
assert.ok(html.includes("api/auth/users"));
assert.ok(html.includes("api/auth/memberships"));
assert.match(html, /encodeURIComponent\(targetUserId\)/);
assert.match(html, /resetPath/);
assert.match(html, /"password"/);
  assert.match(html, /OWNER/);
  assert.match(html, /ADMIN/);
  assert.doesNotMatch(html, /credentialHash/);
});

test("standalone web app renders accepted-plan calendar write-back preview controls", () => {
  const html = renderScheduleOsAppHtml();

  assert.match(html, /id="writeback-calendar-id"/);
  assert.match(html, /id="preview-writeback-button"/);
assert.match(html, /id="writeback-button"/);
assert.match(html, /id="writeback-reviewed"/);
assert.match(html, /id="writeback-help"/);
assert.match(html, /id="writeback-status"/);
assert.match(html, /aria-describedby="writeback-help writeback-status"/);
assert.match(html, /role="status" aria-live="polite"/);
assert.match(html, /id="writeback-conflict-list"/);
assert.match(html, /calendar-writeback\/preview/);
assert.match(html, /calendar-writeback/);
assert.match(html, /readOnly: false/);
assert.match(html, /writebackPreview: null/);
assert.match(html, /writebackCalendarIdEl\.addEventListener\("input"/);
assert.match(html, /writebackReviewedEl\.addEventListener\("change"/);
assert.match(html, /const reviewed = writebackReviewedEl\.checked/);
assert.match(html, /canWriteBack = accepted && cleanPreview && reviewed/);
assert.match(html, /Preview conflicts before writing accepted blocks/);
  assert.doesNotMatch(html, /localStorage/);
  assert.doesNotMatch(html, /sessionStorage/);
});

test("standalone web app keeps calendar accessibility hooks wired", () => {
  const html = renderScheduleOsAppHtml();

  assert.match(html, /<html lang="en">/);
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
  assert.match(html, /<main aria-labelledby="app-title">/);
  assert.match(html, /<aside aria-label="Planning controls">/);
  assert.match(html, /<section class="stack" aria-label="Calendar plan">/);
  assert.match(html, /class="tabs" role="group" aria-label="Calendar view"/);
  assert.match(html, /data-view="day" aria-pressed="true"/);
  assert.match(html, /data-view="week" aria-pressed="false"/);
  assert.match(html, /id="status" role="status" aria-live="polite"/);
  assert.match(html, /id="drag-status" class="status-row" role="status" aria-live="polite"/);
  assert.match(html, /id="writeback-status" class="status-row" role="status" aria-live="polite"/);
  assert.match(html, /id="calendar" class="calendar-grid day" role="grid" aria-label="Scheduled time blocks"/);
  assert.match(html, /role="gridcell" tabindex="0" data-testid="calendar-slot"/);
  assert.match(html, /class="block" draggable="true" tabindex="0" role="button" data-testid="time-block"/);
  assert.match(html, /aria-label="' \+ escapeHtml\("Move " \+ taskTitle\(block\.taskId\)/);
  assert.match(html, /aria-describedby="writeback-help writeback-status"/);
  assert.match(html, /data-block-action="move-later"/);
  assert.match(html, /data-block-action="move-earlier"/);
  assert.match(html, />Earlier<\/button>/);
  assert.match(html, />Later<\/button>/);
});

test("standalone web app keeps responsive calendar layout contract", () => {
  const html = renderScheduleOsAppHtml();

  assert.match(html, /\.workspace \{\s*display: grid;\s*grid-template-columns: minmax\(17rem, 22rem\) 1fr;/);
  assert.match(html, /main \{[\s\S]*?min-width: 0;[\s\S]*?overflow: auto;/);
  assert.match(html, /\.toolbar \{\s*display: flex;\s*flex-wrap: wrap;/);
  assert.match(html, /\.actions \{\s*display: flex;\s*flex-wrap: wrap;/);
  assert.match(html, /\.calendar-grid \{\s*display: grid;\s*grid-template-columns: 4\.25rem repeat\(7, minmax\(8\.5rem, 1fr\)\);[\s\S]*?min-width: 62rem;/);
  assert.match(html, /\.calendar-grid\.day \{\s*grid-template-columns: 4\.25rem minmax\(16rem, 1fr\);\s*min-width: 24rem;/);
  assert.match(html, /@media \(max-width: 860px\) \{\s*\.workspace \{ grid-template-columns: 1fr; \}/);
  assert.match(html, /@media \(max-width: 860px\)[\s\S]*?aside \{ border-right: 0; border-bottom: 1px solid var\(--line\); \}/);
  assert.match(html, /@media \(max-width: 860px\)[\s\S]*?\.calendar-grid, \.calendar-grid\.day \{ min-width: 42rem; \}/);
  assert.match(html, /@media \(max-width: 520px\) \{\s*header \{ align-items: flex-start; flex-direction: column; \}/);
  assert.match(html, /@media \(max-width: 520px\)[\s\S]*?\.grid-2 \{ grid-template-columns: 1fr; \}/);
  assert.match(html, /@media \(max-width: 520px\)[\s\S]*?\.auth-panel form \{ grid-template-columns: 1fr; \}/);
  assert.match(html, /@media \(max-width: 520px\)[\s\S]*?\.auth-session \{ justify-content: flex-start; \}/);
});

test("standalone web app renders browser-verifiable calendar drag and conflict hooks", () => {
  const html = renderScheduleOsAppHtml();

  assert.match(html, /id="calendar" class="calendar-grid day" role="grid"/);
  assert.match(html, /data-testid="calendar-grid"/);
  assert.match(html, /id="drag-status" class="status-row" role="status" aria-live="polite"/);
  assert.match(html, /data-testid="calendar-slot"/);
  assert.match(html, /role="gridcell"/);
  assert.match(html, /data-testid="time-block"/);
  assert.match(html, /draggable="true" tabindex="0" role="button"/);
  assert.match(html, /data-testid="writeback-conflict-list"/);
  assert.match(html, /Block moved to/);
  assert.match(html, /Block move failed/);
});

test("standalone web app requires in-page provider CSV review before import", () => {
  const html = renderScheduleOsAppHtml();

  assert.match(html, /id="csv-import-status" class="status-row" role="status" aria-live="polite"/);
  assert.match(html, /id="csv-provider-policy" class="risk-list" data-testid="csv-provider-policy"/);
  assert.match(html, /id="csv-import-reviewed" type="checkbox" disabled/);
  assert.match(html, /I reviewed the preview rows and provider policy/);
  assert.match(html, /api\/import-policies/);
  assert.match(html, /csvPolicies: \[\]/);
  assert.match(html, /csvImportReady/);
  assert.match(html, /Review CSV preview and provider policy before importing/);
  assert.match(html, /Provider quotas and hosted abuse analytics remain production release blockers/);
  assert.doesNotMatch(html, /confirm\("Import " \+ importedCount/);
});

test("standalone web app renders provider CSV confirmation summary", () => {
 const html = renderScheduleOsAppHtml();

 assert.match(html, /id="csv-import-confirmation" class="risk-list" data-testid="csv-import-confirmation" aria-live="polite"/);
 assert.match(html, /Provider import confirmation/);
 assert.match(html, /Rows: /);
 assert.match(html, /Errors: /);
 assert.match(html, /Risk: /);
 assert.match(html, /Policy: /);
 assert.match(html, /real-provider fixtures, hosted quota governance, abuse analytics, remote CI, and operator approval/);
});
