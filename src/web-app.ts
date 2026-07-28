export const renderScheduleOsAppHtml = (): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ScheduleOS Planner</title>
<link rel="icon" href="data:,">
<style>
      :root {
        color-scheme: light;
        --bg: #f7f8f4;
        --surface: #ffffff;
        --ink: #17201b;
        --muted: #5c6b63;
        --line: #d9ded6;
        --strong: #0f5f55;
        --strong-ink: #ffffff;
        --accent: #b66b18;
        --soft: #edf4f1;
        --risk: #8a1f11;
        --shadow: 0 1px 2px rgba(20, 31, 26, 0.08);
      }

      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        background: var(--bg);
        color: var(--ink);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.45;
      }
button, input, select, textarea { font: inherit; }
textarea { min-height: 7rem; resize: vertical; }
      button {
        min-height: 2.25rem;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: var(--surface);
        color: var(--ink);
        cursor: pointer;
      }
      button.primary {
        border-color: var(--strong);
        background: var(--strong);
        color: var(--strong-ink);
      }
      button.link {
        min-height: auto;
        border: 0;
        padding: 0;
        background: transparent;
        color: var(--strong);
        text-decoration: underline;
      }
button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
        outline: 3px solid rgba(15, 95, 85, 0.25);
        outline-offset: 2px;
      }
      .app-shell {
        display: grid;
        grid-template-rows: auto 1fr;
        min-height: 100vh;
      }
      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--line);
        background: var(--surface);
      }
      h1, h2, h3, p { margin: 0; }
      h1 { font-size: 1.1rem; }
      h2 { font-size: 0.95rem; }
      h3 { font-size: 0.9rem; }
      .workspace {
        display: grid;
        grid-template-columns: minmax(17rem, 22rem) 1fr;
        min-height: 0;
      }
      aside {
        border-right: 1px solid var(--line);
        background: var(--surface);
        overflow: auto;
      }
      .panel {
        padding: 1rem;
        border-bottom: 1px solid var(--line);
      }
      .stack { display: grid; gap: 0.75rem; }
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
      label { display: grid; gap: 0.25rem; color: var(--muted); font-size: 0.8rem; }
      input, select {
        width: 100%;
        min-height: 2.25rem;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: var(--surface);
        color: var(--ink);
        padding: 0.45rem 0.55rem;
      }
      .check-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--ink);
      }
      .check-row input { width: auto; min-height: auto; }
      main {
        min-width: 0;
        overflow: auto;
        padding: 1rem;
      }
      .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.75rem;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
      }
      .tabs {
        display: inline-flex;
        border: 1px solid var(--line);
        border-radius: 6px;
        overflow: hidden;
        background: var(--surface);
      }
      .tabs button {
        border: 0;
        border-radius: 0;
        border-right: 1px solid var(--line);
        padding: 0 0.75rem;
      }
      .tabs button:last-child { border-right: 0; }
      .tabs button[aria-pressed="true"] {
        background: var(--soft);
        color: var(--strong);
        font-weight: 700;
      }
      .task-list, .event-list, .risk-list {
        display: grid;
        gap: 0.5rem;
        margin-top: 0.75rem;
      }
      .task-item, .event-item, .risk-item, .block, .event {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface);
        box-shadow: var(--shadow);
      }
      .task-item, .event-item, .risk-item {
        padding: 0.65rem;
      }
      .meta,
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        margin-top: 0.4rem;
        color: var(--muted);
        font-size: 0.78rem;
      }
      .actions button {
        min-height: 1.8rem;
        padding: 0 0.45rem;
        font-size: 0.76rem;
      }
      .pill {
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 0.1rem 0.4rem;
        background: var(--soft);
      }
      .calendar-grid {
        display: grid;
        grid-template-columns: 4.25rem repeat(7, minmax(8.5rem, 1fr));
        border: 1px solid var(--line);
        background: var(--surface);
        min-width: 62rem;
      }
      .calendar-grid.day {
        grid-template-columns: 4.25rem minmax(16rem, 1fr);
        min-width: 24rem;
      }
      .time-label, .day-head, .slot {
        border-right: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
        min-height: 3rem;
      }
      .time-label {
        color: var(--muted);
        font-size: 0.75rem;
        padding: 0.35rem;
        background: #fbfcfa;
      }
      .day-head {
        min-height: 2.25rem;
        padding: 0.45rem;
        font-size: 0.8rem;
        font-weight: 700;
        background: #fbfcfa;
      }
      .slot {
        position: relative;
        padding: 0.25rem;
        background: linear-gradient(to bottom, #ffffff, #ffffff 50%, #fbfcfa 50%, #fbfcfa);
        background-size: 100% 1.5rem;
      }
      .slot.drag-over { box-shadow: inset 0 0 0 2px var(--strong); }
      .block {
        display: grid;
        gap: 0.25rem;
        padding: 0.45rem;
        border-left: 4px solid var(--strong);
        cursor: grab;
      }
      .event {
        display: grid;
        gap: 0.25rem;
        padding: 0.45rem;
        border-left: 4px solid var(--accent);
      }
      .block:active { cursor: grabbing; }
      .block .title { font-weight: 700; font-size: 0.84rem; }
      .block .when { color: var(--muted); font-size: 0.74rem; }
      .status-row {
        min-height: 1.5rem;
        color: var(--muted);
        font-size: 0.85rem;
      }
      .auth-panel {
        display: grid;
        gap: 0.4rem;
        min-width: min(100%, 30rem);
      }
      .auth-panel form {
        display: grid;
        grid-template-columns: minmax(7rem, 1fr) minmax(7rem, 1fr) minmax(7rem, 1fr) minmax(8rem, 1fr) auto;
        gap: 0.5rem;
        align-items: end;
      }
      .auth-session {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.75rem;
      }
      .recovery-panel {
        border-top: 1px solid var(--line);
        padding-top: 0.5rem;
      }
      .recovery-panel form,
      .admin-panel form {
        grid-template-columns: minmax(7rem, 1fr) minmax(7rem, 1fr) minmax(7rem, 1fr) minmax(8rem, 1fr) auto;
      }
      .admin-panel {
        border-top: 1px solid var(--line);
        padding-top: 0.5rem;
      }
      .risk-item strong { color: var(--risk); }
      .empty {
        border: 1px dashed var(--line);
        border-radius: 8px;
        color: var(--muted);
        padding: 1rem;
        background: rgba(255, 255, 255, 0.55);
      }
      @media (max-width: 860px) {
        .workspace { grid-template-columns: 1fr; }
        aside { border-right: 0; border-bottom: 1px solid var(--line); }
        main { padding: 0.75rem; }
        .calendar-grid, .calendar-grid.day { min-width: 42rem; }
      }
      @media (max-width: 520px) {
        header { align-items: flex-start; flex-direction: column; }
        .grid-2 { grid-template-columns: 1fr; }
        .auth-panel form { grid-template-columns: 1fr; }
        .auth-session { justify-content: flex-start; }
      }
    </style>
  </head>
  <body>
    <div class="app-shell">
      <header>
        <div>
          <h1 id="app-title">ScheduleOS Planner</h1>
          <p class="status-row" id="status" role="status" aria-live="polite">Ready to plan.</p>
        </div>
        <div class="auth-panel" aria-label="Account access">
          <form id="login-form">
            <label>Tenant <input id="auth-tenant-id" name="tenantId" value="tenant_demo" autocomplete="organization"></label>
            <label>Workspace <input id="auth-workspace-id" name="workspaceId" value="workspace_demo" autocomplete="off"></label>
            <label>User <input id="auth-user-id" name="userId" value="user_jordan" autocomplete="username"></label>
            <label>Password <input id="auth-password" name="password" type="password" autocomplete="current-password"></label>
            <button class="primary" type="submit">Log in</button>
          </form>
          <div class="auth-session" id="auth-session" hidden>
            <span id="auth-session-label" class="status-row">Signed in.</span>
            <button id="logout-button" class="link" type="button">Log out</button>
          </div>
          <details class="recovery-panel">
            <summary>Password recovery</summary>
            <form id="password-reset-request-form">
              <label>Tenant <input name="tenantId" value="tenant_demo" autocomplete="organization"></label>
              <label>Workspace <input name="workspaceId" value="workspace_demo" autocomplete="off"></label>
              <label>User <input name="userId" value="user_jordan" autocomplete="username"></label>
              <button type="submit">Request Reset</button>
            </form>
            <p class="status-row" id="password-reset-request-status">If the account is eligible, a reset token will be prepared by the configured operator delivery path.</p>
            <form id="password-reset-confirm-form">
              <label>Tenant <input name="tenantId" value="tenant_demo" autocomplete="organization"></label>
              <label>Workspace <input name="workspaceId" value="workspace_demo" autocomplete="off"></label>
              <label>User <input name="userId" value="user_jordan" autocomplete="username"></label>
              <label>Reset token <input id="reset-token" name="resetToken" type="password" autocomplete="one-time-code"></label>
              <label>New password <input id="new-password" name="newPassword" type="password" minlength="12" autocomplete="new-password"></label>
              <button class="primary" type="submit">Reset Password</button>
            </form>
          </details>
          <details class="admin-panel">
            <summary>Owner/Admin</summary>
            <form id="admin-user-form">
              <label>Tenant <input name="tenantId" value="tenant_demo" autocomplete="organization"></label>
              <label>User <input name="id" value="user_taylor" autocomplete="username"></label>
              <label>Display <input name="displayName" value="Taylor"></label>
              <label>Email <input name="email" value="user_taylor_at_example_invalid" autocomplete="off"></label>
              <label>Status
                <select name="status">
                  <option>ACTIVE</option>
                  <option>DISABLED</option>
                </select>
              </label>
              <button type="submit">Save User</button>
            </form>
            <form id="admin-membership-form">
              <label>Tenant <input name="tenantId" value="tenant_demo" autocomplete="organization"></label>
              <label>Workspace <input name="workspaceId" value="workspace_demo" autocomplete="off"></label>
              <label>User <input name="userId" value="user_taylor" autocomplete="username"></label>
              <label>Role
                <select name="role">
                  <option>MEMBER</option>
                  <option>VIEWER</option>
                  <option>ADMIN</option>
                  <option>OWNER</option>
                </select>
              </label>
              <label>Status
                <select name="status">
                  <option>ACTIVE</option>
                  <option>DISABLED</option>
                </select>
              </label>
              <button type="submit">Save Membership</button>
            </form>
            <form id="admin-credential-reset-form">
              <label>Tenant <input name="tenantId" value="tenant_demo" autocomplete="organization"></label>
              <label>Workspace <input name="workspaceId" value="workspace_demo" autocomplete="off"></label>
              <label>User <input name="userId" value="user_taylor" autocomplete="username"></label>
              <label>New password <input name="newPassword" type="password" minlength="12" autocomplete="new-password"></label>
              <button type="submit">Reset Credential</button>
            </form>
          </details>
        </div>
      </header>
      <div class="workspace">
        <aside aria-label="Planning controls">
          <section class="panel">
            <form id="scope-form" class="stack">
              <h2>Workspace</h2>
              <div class="grid-2">
                <label>Tenant <input name="tenantId" value="tenant_demo"></label>
                <label>Workspace <input name="workspaceId" value="workspace_demo"></label>
              </div>
              <label>User <input name="userId" value="user_jordan"></label>
            </form>
          </section>
          <section class="panel">
            <form id="working-hours-form" class="stack">
              <h2>Working Hours</h2>
              <div class="grid-2">
                <label>Start <input name="startTime" type="time" value="09:00"></label>
                <label>End <input name="endTime" type="time" value="17:00"></label>
              </div>
              <label>Timezone <input name="timezone" value="UTC"></label>
              <button class="primary" type="submit">Save Hours</button>
            </form>
          </section>
          <section class="panel">
            <form id="task-form" class="stack">
              <h2>Add Task</h2>
              <label>Title <input name="title" required placeholder="Prepare launch plan"></label>
              <div class="grid-2">
                <label>Minutes <input name="minutes" type="number" min="5" step="5" value="45"></label>
                <label>Priority
                  <select name="priority">
                    <option>URGENT</option>
                    <option>HIGH</option>
                    <option selected>MEDIUM</option>
                    <option>LOW</option>
                  </select>
                </label>
              </div>
              <label>Deadline <input name="deadline" type="datetime-local"></label>
              <label class="check-row"><input name="blocked" type="checkbox"> Blocked</label>
              <label class="check-row"><input name="waiting" type="checkbox"> Waiting</label>
<button class="primary" type="submit">Add Task</button>
</form>
</section>
<section class="panel">
<form id="csv-import-form" class="stack">
<h2>Import CSV Tasks</h2>
<label>Template
<select id="csv-template-select" name="templateId">
<option value="">Generic CSV</option>
</select>
</label>
<button id="csv-template-sample-button" type="button">Use Template Sample</button>
<button id="csv-template-download-button" type="button">Download Sample</button>
<label>CSV
<textarea name="csv" spellcheck="false">externalId,title,durationMinutes,deadline,priority
task_demo_csv_1,Prepare volunteer plan,45,2026-07-24T17:00:00.000Z,HIGH</textarea>
</label>
<div class="actions" aria-label="CSV import actions">
<button type="submit">Preview CSV</button>
<button class="primary" id="csv-import-button" type="button" disabled>Import CSV</button>
</div>
<p id="csv-import-status" class="status-row" role="status" aria-live="polite">Preview provider rows before importing.</p>
<div id="csv-provider-policy" class="risk-list" data-testid="csv-provider-policy"></div>
<div id="csv-import-confirmation" class="risk-list" data-testid="csv-import-confirmation" aria-live="polite"></div>
<label class="check-row"><input id="csv-import-reviewed" type="checkbox" disabled> I reviewed the preview rows and provider policy</label>
<div id="csv-import-preview" class="risk-list" aria-live="polite"></div>
</form>
</section>
<section class="panel">
<form id="json-import-form" class="stack">
<h2>Import JSON Tasks</h2>
<label>JSON
<textarea name="json" spellcheck="false">[
  {
    "externalId": "task_demo_json_1",
    "title": "Prepare sermon outline",
    "durationMinutes": 60,
    "deadline": "2026-07-24T17:00:00.000Z",
    "priority": "HIGH",
    "sourceReference": "row_1",
    "tags": ["teaching"]
  }
]</textarea>
</label>
<div class="actions" aria-label="JSON import actions">
<button type="submit">Preview JSON</button>
<button class="primary" id="json-import-button" type="button" disabled>Import JSON</button>
</div>
<div id="json-import-preview" class="risk-list" aria-live="polite"></div>
</form>
</section>
<section class="panel">
<form id="event-form" class="stack">
            <h2>Add Fixed Event</h2>
            <label>Title <input name="title" required placeholder="Client call"></label>
            <div class="grid-2">
              <label>Start <input name="start" type="datetime-local" required></label>
              <label>End <input name="end" type="datetime-local" required></label>
            </div>
<label>Calendar <input name="calendarId" value="calendar_primary"></label>
<button class="primary" type="submit">Add Event</button>
</form>
</section>
<section class="panel">
<form id="ics-import-form" class="stack">
<h2>Import ICS Events</h2>
<label>Calendar <input name="calendarId" value="calendar_primary"></label>
<div class="grid-2">
<label>Range Start <input name="recurrenceRangeStart" type="datetime-local"></label>
<label>Range End <input name="recurrenceRangeEnd" type="datetime-local"></label>
</div>
<label>ICS
<textarea name="ics" spellcheck="false">BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:event_demo_ics_focus
SUMMARY:Imported focus block
DTSTART:20260722T130000Z
DTEND:20260722T140000Z
END:VEVENT
END:VCALENDAR</textarea>
</label>
<div class="actions" aria-label="ICS import actions">
<button type="submit">Review ICS</button>
<button class="primary" id="ics-import-button" type="button" disabled>Import ICS</button>
</div>
<div id="ics-import-preview" class="risk-list" aria-live="polite"></div>
</form>
</section>
<section class="panel">
<h2>Fixed Events</h2>
<div id="event-list" class="event-list" aria-live="polite"></div>
        </section>
        <section class="panel">
          <h2>Tasks</h2>
          <div id="task-list" class="task-list" aria-live="polite"></div>
          </section>
        </aside>
        <main aria-labelledby="app-title">
          <div class="toolbar">
            <div class="tabs" role="group" aria-label="Calendar view">
              <button type="button" data-view="day" aria-pressed="true">Day</button>
              <button type="button" data-view="week" aria-pressed="false">Week</button>
            </div>
            <div class="grid-2">
              <label>Date <input id="plan-date" type="date"></label>
              <label>Range
                <select id="plan-range">
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                </select>
              </label>
            </div>
            <div class="actions" aria-label="Plan actions">
              <button class="primary" id="plan-button" type="button">Plan</button>
              <button id="replan-button" type="button" disabled>Replan</button>
              <button id="accept-plan-button" type="button" disabled>Accept</button>
<button id="reject-plan-button" type="button" disabled>Reject</button>
<button id="export-ics-button" type="button" disabled>Export ICS</button>
</div>
<div class="writeback-panel" aria-label="Calendar write-back">
<label>Calendar ID <input id="writeback-calendar-id" value="calendar_scheduleos"></label>
<p id="writeback-help" class="status-row">Preview conflicts, review the result, then confirm before writing accepted blocks.</p>
<label><input id="writeback-reviewed" type="checkbox" disabled aria-describedby="writeback-help writeback-status"> I reviewed the latest clean conflict preview</label>
<div class="actions">
<button id="preview-writeback-button" type="button" disabled aria-describedby="writeback-help writeback-status">Preview Conflicts</button>
<button id="writeback-button" type="button" disabled aria-describedby="writeback-help writeback-status">Write Back</button>
</div>
<p id="writeback-status" class="status-row" role="status" aria-live="polite">Preview required before write-back.</p>
          <div id="writeback-conflict-list" class="risk-list" aria-live="polite" data-testid="writeback-conflict-list"></div>
        </div>
      </div>
      <section class="stack" aria-label="Calendar plan">
        <div id="calendar" class="calendar-grid day" role="grid" aria-label="Scheduled time blocks" data-testid="calendar-grid"></div>
        <p id="drag-status" class="status-row" role="status" aria-live="polite">Drag or use block controls to adjust accepted time blocks.</p>
        <div>
<h2>Warnings</h2>
<div id="risk-list" class="risk-list"></div>
</div>
<div>
<h2>Plan Explanations</h2>
<div id="explanation-list" class="risk-list" aria-live="polite"></div>
</div>
</section>
        </main>
      </div>
    </div>
    <script>
const state = {
tasks: [],
events: [],
plan: null,
view: "day",
draggedBlockId: null,
csvPreview: null,
 csvTemplates: [],
 csvPolicies: [],
 jsonPreview: null,
        icsPreview: null,
        sessionToken: null,
        csrfToken: null,
 sessionUserId: null,
 writebackPreview: null
      };
const scopeForm = document.getElementById("scope-form");
const taskForm = document.getElementById("task-form");
const csvImportForm = document.getElementById("csv-import-form");
const jsonImportForm = document.getElementById("json-import-form");
const eventForm = document.getElementById("event-form");
const icsImportForm = document.getElementById("ics-import-form");
      const hoursForm = document.getElementById("working-hours-form");
      const statusEl = document.getElementById("status");
      const calendarEl = document.getElementById("calendar");
      const dragStatusEl = document.getElementById("drag-status");
      const taskListEl = document.getElementById("task-list");
const eventListEl = document.getElementById("event-list");
const csvImportPreviewEl = document.getElementById("csv-import-preview");
const csvTemplateSelect = document.getElementById("csv-template-select");
const csvTemplateSampleButton = document.getElementById("csv-template-sample-button");
const csvTemplateDownloadButton = document.getElementById("csv-template-download-button");
const csvImportStatusEl = document.getElementById("csv-import-status");
const csvProviderPolicyEl = document.getElementById("csv-provider-policy");
const csvImportConfirmationEl = document.getElementById("csv-import-confirmation");
const csvImportReviewedEl = document.getElementById("csv-import-reviewed");
const jsonImportPreviewEl = document.getElementById("json-import-preview");
const icsImportPreviewEl = document.getElementById("ics-import-preview");
const explanationListEl = document.getElementById("explanation-list");
const riskListEl = document.getElementById("risk-list");
      const planDateEl = document.getElementById("plan-date");
      const planRangeEl = document.getElementById("plan-range");
const replanButton = document.getElementById("replan-button");
const csvImportButton = document.getElementById("csv-import-button");
const jsonImportButton = document.getElementById("json-import-button");
const icsImportButton = document.getElementById("ics-import-button");
const acceptPlanButton = document.getElementById("accept-plan-button");
const rejectPlanButton = document.getElementById("reject-plan-button");
const exportIcsButton = document.getElementById("export-ics-button");
const writebackCalendarIdEl = document.getElementById("writeback-calendar-id");
const previewWritebackButton = document.getElementById("preview-writeback-button");
const writebackButton = document.getElementById("writeback-button");
const writebackReviewedEl = document.getElementById("writeback-reviewed");
const writebackStatusEl = document.getElementById("writeback-status");
const writebackConflictListEl = document.getElementById("writeback-conflict-list");
const loginForm = document.getElementById("login-form");
      const authSessionEl = document.getElementById("auth-session");
      const authSessionLabelEl = document.getElementById("auth-session-label");
      const logoutButton = document.getElementById("logout-button");
      const passwordResetRequestForm = document.getElementById("password-reset-request-form");
      const passwordResetConfirmForm = document.getElementById("password-reset-confirm-form");
      const passwordResetRequestStatusEl = document.getElementById("password-reset-request-status");
      const adminUserForm = document.getElementById("admin-user-form");
      const adminMembershipForm = document.getElementById("admin-membership-form");
      const adminCredentialResetForm = document.getElementById("admin-credential-reset-form");

      const today = new Date();
      planDateEl.value = today.toISOString().slice(0, 10);

const setStatus = (message) => {
statusEl.textContent = message;
};

const setWritebackStatus = (message) => {
writebackStatusEl.textContent = message;
};

      const authHeaders = (method = "GET") => {
        const headers = {};
        if (state.sessionToken) headers.Authorization = "Bearer " + state.sessionToken;
        if (state.csrfToken && method !== "GET") headers["x-csrf-token"] = state.csrfToken;
        return headers;
      };

      const scope = () => {
        const data = new FormData(scopeForm);
        return {
          tenantId: data.get("tenantId"),
          workspaceId: data.get("workspaceId"),
          userId: data.get("userId")
        };
      };

      const renderAuthSession = () => {
        const signedIn = Boolean(state.sessionUserId);
        loginForm.hidden = signedIn;
        authSessionEl.hidden = !signedIn;
        authSessionLabelEl.textContent = signedIn ? "Signed in as " + state.sessionUserId + "." : "Signed out.";
      };

      const api = async (path, options = {}) => {
        const method = options.method || "GET";
        const headers = {
          ...(options.body ? { "content-type": "application/json" } : {}),
          ...authHeaders(method),
          ...(options.headers || {})
        };
        const response = await fetch(path, { ...options, method, headers, credentials: "same-origin" });
        const text = await response.text();
        const body = text ? JSON.parse(text) : null;
        if (!response.ok) {
          throw new Error(body?.error?.message || "Request failed");
        }
        return body;
      };

      loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = new FormData(loginForm);
        const body = {
          tenantId: data.get("tenantId"),
          workspaceId: data.get("workspaceId"),
          userId: data.get("userId"),
          password: data.get("password")
        };
        try {
          const result = await api("/api/auth/login", {
            method: "POST",
            body: JSON.stringify(body)
          });
          state.sessionToken = result.token || null;
          state.csrfToken = result.csrfToken || null;
          state.sessionUserId = result.data?.userId || body.userId;
          loginForm.reset();
          loginForm.elements.tenantId.value = body.tenantId;
          loginForm.elements.workspaceId.value = body.workspaceId;
          loginForm.elements.userId.value = body.userId;
          renderAuthSession();
          setStatus("Signed in.");
        } catch (error) {
          state.sessionToken = null;
          state.csrfToken = null;
          state.sessionUserId = null;
          renderAuthSession();
          setStatus("Credentials invalid.");
        }
      });

      logoutButton.addEventListener("click", async () => {
        try {
          await api("/api/auth/session", { method: "DELETE" });
        } catch (_error) {
          // Signing out should clear the browser state even if the server session already expired.
        }
        state.sessionToken = null;
        state.csrfToken = null;
        state.sessionUserId = null;
        renderAuthSession();
        setStatus("Signed out.");
      });

      passwordResetRequestForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = new FormData(passwordResetRequestForm);
        try {
          const result = await api("/api/auth/password-reset-requests", {
            method: "POST",
            body: JSON.stringify({
              tenantId: data.get("tenantId"),
              workspaceId: data.get("workspaceId"),
              userId: data.get("userId")
            })
          });
          const localToken = result.resetToken ? " Local development token: " + result.resetToken : "";
          passwordResetRequestStatusEl.textContent =
            "If the account is eligible, reset instructions will be prepared." + localToken;
          setStatus("Password reset requested.");
        } catch (error) {
          passwordResetRequestStatusEl.textContent =
            "If the account is eligible, reset instructions will be prepared.";
          setStatus("Password reset requested.");
        }
      });

      passwordResetConfirmForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = new FormData(passwordResetConfirmForm);
        try {
          await api("/api/auth/password-reset", {
            method: "POST",
            body: JSON.stringify({
              tenantId: data.get("tenantId"),
              workspaceId: data.get("workspaceId"),
              userId: data.get("userId"),
              resetToken: data.get("resetToken"),
              newPassword: data.get("newPassword")
            })
          });
          passwordResetConfirmForm.reset();
          setStatus("Password updated. Log in with the new password.");
        } catch (error) {
          setStatus("Reset token invalid or expired.");
        }
      });

      adminUserForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = new FormData(adminUserForm);
        try {
          await api("/api/auth/users", {
            method: "POST",
            body: JSON.stringify({
              id: data.get("id"),
              tenantId: data.get("tenantId"),
              email: data.get("email"),
              displayName: data.get("displayName"),
              status: data.get("status")
            })
          });
          setStatus("User saved.");
        } catch (error) {
          setStatus(error.message);
        }
      });

      adminMembershipForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = new FormData(adminMembershipForm);
        try {
          await api("/api/auth/memberships", {
            method: "POST",
            body: JSON.stringify({
              tenantId: data.get("tenantId"),
              workspaceId: data.get("workspaceId"),
              userId: data.get("userId"),
              role: data.get("role"),
              status: data.get("status")
            })
          });
          setStatus("Membership saved.");
        } catch (error) {
          setStatus(error.message);
        }
      });

      adminCredentialResetForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = new FormData(adminCredentialResetForm);
        const targetUserId = String(data.get("userId") || "");
        const resetPath = ["", "api", "auth", "users", encodeURIComponent(targetUserId), "password"].join("/");
        try {
          await api(resetPath, {
            method: "POST",
            body: JSON.stringify({
              tenantId: data.get("tenantId"),
              workspaceId: data.get("workspaceId"),
              newPassword: data.get("newPassword")
            })
          });
          adminCredentialResetForm.reset();
          setStatus("Credential reset.");
        } catch (error) {
          setStatus(error.message);
        }
      });

const selectedCsvTemplate = () =>
  state.csvTemplates.find((template) => template.id === csvTemplateSelect.value);

const selectedCsvSourceSystem = () => selectedCsvTemplate()?.sourceSystem || "LOCAL_CSV_IMPORT";
const selectedCsvPolicy = () =>
  state.csvPolicies.find((policy) => policy.sourceSystem === selectedCsvSourceSystem());
const csvPreviewReady = () => Boolean(state.csvPreview && (state.csvPreview.data || []).length > 0);
const csvImportReady = () => csvPreviewReady() && csvImportReviewedEl.checked;

const renderCsvProviderPolicy = () => {
  const template = selectedCsvTemplate();
  const policy = selectedCsvPolicy();
  if (!template && !policy) {
    csvProviderPolicyEl.innerHTML =
      '<div class="empty">Generic CSV uses local CSV import policy. Preview rows before importing.</div>';
    return;
  }
  const policyText = policy
    ? policy.recommendedPolicy.maxRows + " rows / " + Math.round(policy.recommendedPolicy.windowMs / 60000) + " min"
    : "No provider policy catalog entry.";
  csvProviderPolicyEl.innerHTML =
    '<article class="risk-item" data-testid="csv-policy-card">' +
    '<strong>' + escapeHtml(template ? template.displayName : selectedCsvSourceSystem()) + '</strong>' +
    '<div>Source: ' + escapeHtml(selectedCsvSourceSystem()) + '</div>' +
    '<div class="meta">' +
    '<span class="pill">Risk: ' + escapeHtml(policy?.riskLevel || "LOCAL") + '</span>' +
    '<span class="pill">Suggested: ' + escapeHtml(policyText) + '</span>' +
    '</div>' +
    '<div>' + escapeHtml(policy?.notes || "Local CSV preview/import only. Provider quotas and hosted abuse analytics remain production release blockers.") + '</div>' +
  '</article>';
};

const renderCsvImportConfirmation = () => {
  const template = selectedCsvTemplate();
  const policy = selectedCsvPolicy();
  if (!state.csvPreview) {
    csvImportConfirmationEl.innerHTML =
      '<div class="empty">Preview rows to build a provider-specific import confirmation.</div>';
    return;
  }
  const rows = state.csvPreview.data || [];
  const errors = state.csvPreview.errors || [];
  const sourceSystem = selectedCsvSourceSystem();
  const providerName = template ? template.displayName : sourceSystem;
  const riskLevel = policy?.riskLevel || (template ? "TEMPLATE" : "LOCAL");
  const policyText = policy
    ? policy.recommendedPolicy.maxRows + " rows / " + Math.round(policy.recommendedPolicy.windowMs / 60000) + " min"
    : "Local preview/import policy";
  const outcome = errors.length > 0
    ? "Fix row errors before import."
    : rows.length === 0
      ? "No importable rows found."
      : "Review provider mapping and confirm before import.";
  csvImportConfirmationEl.innerHTML =
    '<article class="risk-item" data-testid="csv-confirmation-card">' +
    '<strong>Provider import confirmation</strong>' +
    '<div>' + escapeHtml(providerName) + ' maps to source ' + escapeHtml(sourceSystem) + '.</div>' +
    '<div class="meta">' +
    '<span class="pill">Rows: ' + rows.length + '</span>' +
    '<span class="pill">Errors: ' + errors.length + '</span>' +
    '<span class="pill">Risk: ' + escapeHtml(riskLevel) + '</span>' +
    '<span class="pill">Policy: ' + escapeHtml(policyText) + '</span>' +
    '</div>' +
    '<div>' + escapeHtml(outcome) + '</div>' +
    '<div class="meta"><span class="pill">Production still needs real-provider fixtures, hosted quota governance, abuse analytics, remote CI, and operator approval.</span></div>' +
    '</article>';
};

const updateCsvImportControls = () => {
  csvImportReviewedEl.disabled = !csvPreviewReady();
  csvImportButton.disabled = !csvImportReady();
  csvImportStatusEl.textContent = csvPreviewReady()
    ? (csvImportReviewedEl.checked ? "CSV preview reviewed. Import is ready." : "Review preview rows and provider policy before importing.")
    : "Preview provider rows before importing.";
};

const renderCsvTemplates = () => {
        csvTemplateSelect.innerHTML =
          '<option value="">Generic CSV</option>' +
      state.csvTemplates
        .map(
          (template) =>
            '<option value="' +
            escapeHtml(template.id) +
                '">' +
                escapeHtml(template.displayName) +
                '</option>'
        )
        .join("");
      renderCsvProviderPolicy();
    };

    const loadCsvTemplates = async () => {
      try {
        const result = await api("/api/task-sources/csv/templates");
        state.csvTemplates = result.data || [];
        renderCsvTemplates();
      } catch (error) {
        setStatus(error.message);
      }
    };

    const loadCsvPolicies = async () => {
      try {
        const result = await api("/api/import-policies");
        state.csvPolicies = result.data || [];
        renderCsvProviderPolicy();
      } catch (error) {
        setStatus(error.message);
      }
    };

      const isoFromLocal = (value) => value ? new Date(value).toISOString() : null;
      const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60000);
      const formatTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const formatDay = (date) => date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

      const taskTitle = (taskId) => state.tasks.find((task) => task.id === taskId)?.title || taskId;

      const renderTasks = () => {
        if (state.tasks.length === 0) {
          taskListEl.innerHTML = '<div class="empty">No tasks yet.</div>';
          return;
        }
        taskListEl.innerHTML = state.tasks.map((task) => {
          const flags = [
            task.priority,
            task.estimatedDurationMinutes + "m",
            task.blocked ? "blocked" : "",
            task.waiting ? "waiting" : ""
          ].filter(Boolean);
          return '<article class="task-item"><h3>' + escapeHtml(task.title) + '</h3><div class="meta">' +
            flags.map((flag) => '<span class="pill">' + escapeHtml(flag) + '</span>').join("") +
            '</div></article>';
        }).join("");
      };

      const renderEvents = () => {
        if (state.events.length === 0) {
          eventListEl.innerHTML = '<div class="empty">No fixed events yet.</div>';
          return;
        }
        eventListEl.innerHTML = state.events.map((event) =>
          '<article class="event-item"><h3>' + escapeHtml(event.title) + '</h3><div class="meta">' +
          '<span class="pill">' + formatTime(event.start) + ' - ' + formatTime(event.end) + '</span>' +
          '<span class="pill">' + escapeHtml(event.busyStatus.toLowerCase()) + '</span>' +
          '</div></article>'
        ).join("");
      };

      const renderCalendar = () => {
        const start = new Date(planDateEl.value + "T09:00:00");
        const days = state.view === "week" ? 7 : 1;
        calendarEl.className = "calendar-grid " + (state.view === "day" ? "day" : "week");
        const dayDates = Array.from({ length: days }, (_, index) => {
          const day = new Date(start);
          day.setDate(start.getDate() + index);
          return day;
        });
        const hours = Array.from({ length: 9 }, (_, index) => index + 9);
        let html = '<div class="day-head"></div>' + dayDates.map((day) => '<div class="day-head">' + formatDay(day) + '</div>').join("");
        for (const hour of hours) {
          html += '<div class="time-label">' + String(hour).padStart(2, "0") + ':00</div>';
          for (const day of dayDates) {
            const slotStart = new Date(day);
            slotStart.setHours(hour, 0, 0, 0);
        html += '<div class="slot" role="gridcell" tabindex="0" data-testid="calendar-slot" data-start="' + slotStart.toISOString() + '" aria-label="' + escapeHtml(formatDay(slotStart) + " " + String(hour).padStart(2, "0") + ":00 drop target") + '">';
            html += eventsForSlot(slotStart).map(renderEvent).join("");
            html += blocksForSlot(slotStart).map(renderBlock).join("");
            html += '</div>';
          }
        }
        calendarEl.innerHTML = html;
        wireBlockDrag();
      };

      const blocksForSlot = (slotStart) => {
        const slotEnd = addMinutes(slotStart, 60);
        return (state.plan?.blocks || []).filter((block) => {
          const blockStart = new Date(block.start);
          return blockStart >= slotStart && blockStart < slotEnd;
        });
      };

      const eventsForSlot = (slotStart) => {
        const slotEnd = addMinutes(slotStart, 60);
        return state.events.filter((event) => {
          const eventStart = new Date(event.start);
          const eventEnd = new Date(event.end);
          return eventStart < slotEnd && eventEnd > slotStart;
        });
      };

      const renderBlock = (block) => {
      return '<article class="block" draggable="true" tabindex="0" role="button" data-testid="time-block" data-block-id="' + block.id + '" aria-label="' + escapeHtml("Move " + taskTitle(block.taskId) + " scheduled " + formatTime(block.start) + " - " + formatTime(block.end)) + '">' +
          '<div class="title">' + escapeHtml(taskTitle(block.taskId)) + '</div>' +
          '<div class="when">' + formatTime(block.start) + ' - ' + formatTime(block.end) + '</div>' +
          '<div class="meta"><span class="pill">' + escapeHtml(block.status.toLowerCase()) + '</span></div>' +
          '</article>';
      };

      const renderEvent = (event) => {
        return '<article class="event">' +
          '<div class="title">' + escapeHtml(event.title) + '</div>' +
          '<div class="when">' + formatTime(event.start) + ' - ' + formatTime(event.end) + '</div>' +
          '<div class="meta"><span class="pill">busy</span></div>' +
          '</article>';
      };

      const renderRisks = () => {
        const unscheduled = state.plan?.unscheduledTasks || [];
        const warnings = state.plan?.capacityWarnings || [];
        if (unscheduled.length === 0 && warnings.length === 0) {
          riskListEl.innerHTML = '<div class="empty">No warnings for this plan.</div>';
          return;
        }
        riskListEl.innerHTML = [
          ...unscheduled.map((item) => '<article class="risk-item"><strong>' + escapeHtml(item.reason) + '</strong><div>' + escapeHtml(taskTitle(item.taskId)) + '</div></article>'),
          ...warnings.map((item) => '<article class="risk-item"><strong>' + escapeHtml(item.code) + '</strong><div>' + escapeHtml(item.message) + '</div></article>')
        ].join("");
      };

      const renderExplanations = () => {
        const explanations = state.plan?.explanations || [];
        if (explanations.length === 0) {
          explanationListEl.innerHTML = '<div class="empty">No explanations yet.</div>';
          return;
        }
        explanationListEl.innerHTML = explanations.map((item) => {
          const subject = item.taskId ? taskTitle(item.taskId) : item.blockId || item.type;
          const evidence = Object.entries(item.evidence || {})
            .slice(0, 4)
            .map(([key, value]) => '<span class="pill">' + escapeHtml(key + ": " + value) + '</span>')
            .join("");
          return '<article class="risk-item"><strong>' + escapeHtml(item.type) + '</strong><div>' + escapeHtml(subject) + '</div><div>' + escapeHtml(item.message) + '</div><div class="meta">' + evidence + '</div></article>';
        }).join("");
      };

const renderWritebackConflicts = (conflicts = []) => {
      if (conflicts.length === 0) {
        const preview = state.writebackPreview;
writebackConflictListEl.innerHTML = preview && preview.conflictCount === 0
? '<div class="empty">Preview clear. Accepted blocks are ready for write-back.</div>'
: '<div class="empty">Preview conflicts before writing accepted blocks.</div>';
setWritebackStatus(preview && preview.conflictCount === 0 ? "Clean preview ready for review acknowledgement." : "Preview required before write-back.");
return;
}
setWritebackStatus(conflicts.length + " write-back conflict(s) found. Resolve conflicts before writing blocks.");
writebackConflictListEl.innerHTML = conflicts.map((item) =>
          '<article class="risk-item"><strong>' + escapeHtml(item.severity) + '</strong><div>' +
          escapeHtml(item.conflictTitle) + '</div><div class="meta"><span class="pill">' +
          escapeHtml(formatTime(item.overlapStart) + ' - ' + formatTime(item.overlapEnd)) +
          '</span><span class="pill">' + escapeHtml(item.conflictEventId) + '</span></div></article>'
        ).join("");
};

const clearWritebackPreview = () => {
state.writebackPreview = null;
writebackReviewedEl.checked = false;
setWritebackStatus("Preview required before write-back.");
};

const renderCsvPreview = () => {
if (!state.csvPreview) {
csvImportPreviewEl.innerHTML = '<div class="empty">Preview rows before importing.</div>';
csvImportReviewedEl.checked = false;
renderCsvImportConfirmation();
updateCsvImportControls();
return;
}
const rows = state.csvPreview.data || [];
const errors = state.csvPreview.errors || [];
csvImportPreviewEl.innerHTML = [
          '<article class="risk-item"><strong>Preview</strong><div>' + rows.length + ' ready, ' + errors.length + ' error(s).</div></article>',
          ...rows.slice(0, 4).map((task) => '<article class="task-item"><h3>' + escapeHtml(task.title) + '</h3><div class="meta"><span class="pill">' + escapeHtml(task.priority) + '</span><span class="pill">' + escapeHtml(task.estimatedDurationMinutes + "m") + '</span></div></article>'),
          ...errors.map((item) => '<article class="risk-item"><strong>Row ' + (item.index + 1) + '</strong><div>' + escapeHtml(item.message) + '</div></article>')
].join("");
updateCsvImportControls();
};

      const renderJsonPreview = () => {
        if (!state.jsonPreview) {
          jsonImportPreviewEl.innerHTML = '<div class="empty">Preview rows before importing.</div>';
          jsonImportButton.disabled = true;
          return;
        }
        const rows = state.jsonPreview.data || [];
        const errors = state.jsonPreview.errors || [];
        jsonImportButton.disabled = rows.length === 0;
        jsonImportPreviewEl.innerHTML = [
          '<article class="risk-item"><strong>Preview</strong><div>' + rows.length + ' ready, ' + errors.length + ' error(s).</div></article>',
          ...rows.slice(0, 4).map((task) => '<article class="task-item"><h3>' + escapeHtml(task.title) + '</h3><div class="meta"><span class="pill">' + escapeHtml(task.priority) + '</span><span class="pill">' + escapeHtml(task.estimatedDurationMinutes + "m") + '</span></div></article>'),
          ...errors.map((item) => '<article class="risk-item"><strong>Row ' + (item.index + 1) + '</strong><div>' + escapeHtml(item.message) + '</div></article>')
].join("");
renderCsvImportConfirmation();
updateCsvImportControls();
};

      const renderIcsPreview = () => {
        if (!state.icsPreview) {
          icsImportPreviewEl.innerHTML = '<div class="empty">Review calendar events before importing.</div>';
          icsImportButton.disabled = true;
          return;
        }
        icsImportButton.disabled = state.icsPreview.eventCount === 0;
        icsImportPreviewEl.innerHTML =
          '<article class="risk-item"><strong>Review</strong><div>' +
          state.icsPreview.eventCount + ' event(s) found for ' + escapeHtml(state.icsPreview.calendarId) +
          '.</div></article>';
      };

const updatePlanActionButtons = () => {
const hasPlan = Boolean(state.plan);
const accepted = state.plan?.status === "ACCEPTED";
const cleanPreview = Boolean(state.writebackPreview &&
state.writebackPreview.planId === state.plan?.id &&
state.writebackPreview.calendarId === writebackCalendarIdEl.value &&
state.writebackPreview.conflictCount === 0);
const reviewed = writebackReviewedEl.checked;
const canWriteBack = accepted && cleanPreview && reviewed;
replanButton.disabled = !hasPlan;
acceptPlanButton.disabled = !hasPlan || accepted;
rejectPlanButton.disabled = !hasPlan || state.plan?.status === "REJECTED";
exportIcsButton.disabled = !hasPlan || !accepted;
previewWritebackButton.disabled = !hasPlan || !accepted;
writebackReviewedEl.disabled = !accepted || !cleanPreview;
writebackButton.disabled = !hasPlan || !canWriteBack;
};

writebackCalendarIdEl.addEventListener("input", () => {
clearWritebackPreview();
renderWritebackConflicts([]);
updatePlanActionButtons();
});

writebackReviewedEl.addEventListener("change", () => {
setWritebackStatus(writebackReviewedEl.checked ? "Review acknowledged. Write-back is ready." : "Clean preview ready for review acknowledgement.");
updatePlanActionButtons();
});

const wireBlockDrag = () => {
        document.querySelectorAll(".block").forEach((block) => {
          block.addEventListener("dragstart", () => {
            state.draggedBlockId = block.dataset.blockId;
            dragStatusEl.textContent = "Moving " + block.textContent.trim() + ". Choose a calendar slot.";
          });
          block.addEventListener("dragend", () => {
            if (state.draggedBlockId) {
              dragStatusEl.textContent = "Drag ended. Drop a block on a calendar slot to move it.";
            }
          });
        });
        document.querySelectorAll(".slot").forEach((slot) => {
          slot.addEventListener("dragover", (event) => {
            event.preventDefault();
            slot.classList.add("drag-over");
            dragStatusEl.textContent = "Drop on " + slot.getAttribute("aria-label") + ".";
          });
          slot.addEventListener("dragleave", () => slot.classList.remove("drag-over"));
          slot.addEventListener("drop", async (event) => {
            event.preventDefault();
            slot.classList.remove("drag-over");
            const block = (state.plan?.blocks || []).find((candidate) => candidate.id === state.draggedBlockId);
            if (!block) return;
            const start = new Date(slot.dataset.start);
            const duration = (new Date(block.end).getTime() - new Date(block.start).getTime()) / 60000;
            const end = addMinutes(start, duration);
            try {
              const updated = await api(\`/api/time-blocks/\${block.id}\`, {
                method: "PATCH",
                body: JSON.stringify({ start: start.toISOString(), end: end.toISOString() })
              });
              state.plan.blocks = state.plan.blocks.map((candidate) => candidate.id === updated.id ? updated : candidate);
              state.draggedBlockId = null;
              renderCalendar();
              dragStatusEl.textContent = "Block moved to " + slot.getAttribute("aria-label") + ".";
              setStatus("Block moved.");
            } catch (error) {
              dragStatusEl.textContent = "Block move failed.";
              setStatus(error.message);
            }
          });
        });
      };

      const refreshTasks = async () => {
        const s = scope();
        const params = new URLSearchParams(s);
        const result = await api("/api/tasks?" + params.toString());
        state.tasks = result.data;
        renderTasks();
      };

      const refreshEvents = async () => {
        const s = scope();
        const params = new URLSearchParams(s);
        const result = await api("/api/calendar-events?" + params.toString());
        state.events = result.data;
        renderEvents();
        renderCalendar();
      };

      hoursForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = new FormData(hoursForm);
        try {
          await api("/api/working-hours", {
            method: "PUT",
            body: JSON.stringify({
              userId: scope().userId,
              timezone: data.get("timezone"),
              daysOfWeek: [1, 2, 3, 4, 5],
              startTime: data.get("startTime"),
              endTime: data.get("endTime")
            })
          });
          setStatus("Working hours saved.");
        } catch (error) {
          setStatus(error.message);
        }
      });

      const submitCsvImport = async (dryRun) => {
        const data = new FormData(csvImportForm);
        const csv = String(data.get("csv") || "");
        const templateId = String(data.get("templateId") || "");
        const body = {
          ...scope(),
          csv,
          dryRun
        };
        if (templateId) {
          body.templateId = templateId;
        } else {
          body.sourceSystem = "LOCAL_CSV_IMPORT";
        }
const result = await api("/api/task-sources/csv/import", {
method: "POST",
body: JSON.stringify(body)
});
state.csvPreview = result;
if (dryRun) csvImportReviewedEl.checked = false;
renderCsvPreview();
        if (!dryRun) {
          await refreshTasks();
          setStatus("CSV imported. Use Replan to schedule imported tasks.");
        } else {
          setStatus("CSV preview ready.");
        }
      };

      csvImportForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
          await submitCsvImport(true);
        } catch (error) {
          state.csvPreview = null;
          renderCsvPreview();
          setStatus(error.message);
        }
      });

csvTemplateSelect.addEventListener("change", () => {
state.csvPreview = null;
csvImportReviewedEl.checked = false;
renderCsvPreview();
renderCsvProviderPolicy();
renderCsvImportConfirmation();
});

      csvTemplateSampleButton.addEventListener("click", () => {
        const template = selectedCsvTemplate();
        if (!template) {
          setStatus("Choose a CSV template first.");
          return;
        }
csvImportForm.elements.csv.value = template.sampleCsv;
state.csvPreview = null;
csvImportReviewedEl.checked = false;
renderCsvPreview();
setStatus(template.displayName + " sample loaded.");
});

csvTemplateDownloadButton.addEventListener("click", () => {
const template = selectedCsvTemplate();
if (!template) {
setStatus("Choose a CSV template first.");
return;
}
window.location.href = "/api/task-sources/csv/templates/" + encodeURIComponent(template.id) + "/sample";
});

      csvImportButton.addEventListener("click", async () => {
        if (!state.csvPreview || csvImportButton.disabled) return;
        if (!csvImportReady()) {
          setStatus("Review CSV preview and provider policy before importing.");
          return;
        }
        try {
          await submitCsvImport(false);
          csvImportReviewedEl.checked = false;
          updateCsvImportControls();
        } catch (error) {
          setStatus(error.message);
        }
      });

      csvImportReviewedEl.addEventListener("change", () => {
        updateCsvImportControls();
      });

      const submitJsonImport = async (dryRun) => {
        const data = new FormData(jsonImportForm);
        const parsed = JSON.parse(String(data.get("json") || "[]"));
        const tasks = Array.isArray(parsed) ? parsed : parsed.tasks;
        if (!Array.isArray(tasks)) throw new Error("JSON must be an array of tasks or an object with a tasks array.");
        const result = await api("/api/task-sources/json/import", {
          method: "POST",
          body: JSON.stringify({
            ...scope(),
            sourceSystem: "LOCAL_JSON_IMPORT",
            tasks,
            dryRun
          })
        });
        state.jsonPreview = result;
        renderJsonPreview();
        if (!dryRun) {
          await refreshTasks();
          setStatus("JSON imported. Use Replan to schedule imported tasks.");
        } else {
          setStatus("JSON preview ready.");
        }
      };

      jsonImportForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
          await submitJsonImport(true);
        } catch (error) {
          state.jsonPreview = null;
          renderJsonPreview();
          setStatus(error.message);
        }
      });

      jsonImportButton.addEventListener("click", async () => {
        if (!state.jsonPreview || jsonImportButton.disabled) return;
        if (!confirm("Import previewed JSON tasks?")) return;
        try {
          await submitJsonImport(false);
          jsonImportButton.disabled = true;
        } catch (error) {
          setStatus(error.message);
        }
      });

      const icsImportPayload = () => {
        const data = new FormData(icsImportForm);
        const payload = {
          ...scope(),
          calendarId: data.get("calendarId"),
          ics: String(data.get("ics") || "")
        };
        const recurrenceRangeStart = isoFromLocal(data.get("recurrenceRangeStart"));
        const recurrenceRangeEnd = isoFromLocal(data.get("recurrenceRangeEnd"));
        if (recurrenceRangeStart) payload.recurrenceRangeStart = recurrenceRangeStart;
        if (recurrenceRangeEnd) payload.recurrenceRangeEnd = recurrenceRangeEnd;
        return payload;
      };

      icsImportForm.addEventListener("submit", (event) => {
        event.preventDefault();
        try {
          const payload = icsImportPayload();
          const eventCount = (payload.ics.match(/BEGIN:VEVENT/g) || []).length;
          if (eventCount === 0) throw new Error("ICS must include at least one VEVENT.");
          state.icsPreview = {
            calendarId: payload.calendarId,
            eventCount
          };
          renderIcsPreview();
          setStatus("ICS review ready.");
        } catch (error) {
          state.icsPreview = null;
          renderIcsPreview();
          setStatus(error.message);
        }
      });

      icsImportButton.addEventListener("click", async () => {
        if (!state.icsPreview || icsImportButton.disabled) return;
        if (!confirm("Import reviewed ICS events?")) return;
        try {
          const result = await api("/api/calendar-events/ics/import", {
            method: "POST",
            body: JSON.stringify(icsImportPayload())
          });
          await refreshEvents();
          icsImportButton.disabled = true;
          setStatus("ICS imported: " + result.createdCount + " created, " + result.updatedCount + " updated. Use Replan to account for fixed events.");
        } catch (error) {
          setStatus(error.message);
        }
      });

      eventForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = new FormData(eventForm);
        const now = Date.now();
        try {
          await api("/api/calendar-events", {
            method: "POST",
            body: JSON.stringify({
              ...scope(),
              id: "event_" + now,
              calendarId: data.get("calendarId"),
              title: data.get("title"),
              start: isoFromLocal(data.get("start")),
              end: isoFromLocal(data.get("end")),
              timezone: hoursForm.elements.timezone.value || "UTC",
              allDay: false,
              status: "CONFIRMED",
              busyStatus: "BUSY",
              movable: false,
              locked: true,
              privacyLevel: "BUSY_ONLY",
              version: 1,
              sourceSystem: "LOCAL_APP"
            })
          });
          eventForm.reset();
          eventForm.elements.calendarId.value = "calendar_primary";
          await refreshEvents();
          setStatus("Fixed event added.");
        } catch (error) {
          setStatus(error.message);
        }
      });

      taskForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = new FormData(taskForm);
        const now = new Date().toISOString();
        const minutes = Number(data.get("minutes"));
        const blocked = data.get("blocked") === "on";
        const waiting = data.get("waiting") === "on";
        const task = {
          ...scope(),
          id: "task_" + Date.now(),
          ownerId: scope().userId,
          title: data.get("title"),
          priority: data.get("priority"),
          estimatedDurationMinutes: minutes,
          remainingDurationMinutes: minutes,
          deadline: isoFromLocal(data.get("deadline")) || addMinutes(new Date(), 8 * 60).toISOString(),
          schedulingMode: "DEADLINE_DRIVEN",
          splittable: false,
          schedulingEligible: !blocked && !waiting,
          blocked,
          waiting,
          confidence: "CONFIRMED",
          createdAt: now,
          updatedAt: now,
          sourceSystem: "LOCAL_APP"
        };
        try {
          await api("/api/tasks", { method: "POST", body: JSON.stringify(task) });
          taskForm.reset();
          taskForm.elements.minutes.value = "45";
          taskForm.elements.priority.value = "MEDIUM";
          await refreshTasks();
          setStatus("Task added.");
        } catch (error) {
          setStatus(error.message);
        }
      });

      document.querySelectorAll("[data-view]").forEach((button) => {
        button.addEventListener("click", () => {
          state.view = button.dataset.view;
          planRangeEl.value = state.view;
          document.querySelectorAll("[data-view]").forEach((candidate) => {
            candidate.setAttribute("aria-pressed", String(candidate === button));
          });
          renderCalendar();
        });
      });

      document.getElementById("plan-button").addEventListener("click", async () => {
        const date = new Date(planDateEl.value + "T00:00:00");
        const start = new Date(date);
        start.setHours(9, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + (planRangeEl.value === "week" ? 7 : 1));
        state.view = planRangeEl.value;
        try {
          await refreshTasks();
          await refreshEvents();
          state.plan = await api("/api/schedule-plans", {
            method: "POST",
            body: JSON.stringify({
              ...scope(),
              rangeStart: start.toISOString(),
              rangeEnd: end.toISOString(),
              timezone: hoursForm.elements.timezone.value || "UTC"
            })
          });
          clearWritebackPreview();
          renderCalendar();
          renderRisks();
          renderExplanations();
          updatePlanActionButtons();
          setStatus("Plan created.");
        } catch (error) {
          setStatus(error.message);
        }
      });

      replanButton.addEventListener("click", async () => {
        if (!state.plan) return;
        try {
          await refreshTasks();
          await refreshEvents();
          state.plan = await api(\`/api/schedule-plans/\${state.plan.id}/replan\`, {
            method: "POST"
          });
          clearWritebackPreview();
          renderCalendar();
          renderRisks();
          renderExplanations();
          updatePlanActionButtons();
          setStatus("Plan replanned.");
        } catch (error) {
          setStatus(error.message);
        }
      });

      acceptPlanButton.addEventListener("click", async () => {
        if (!state.plan) return;
        try {
          state.plan = await api(\`/api/schedule-plans/\${state.plan.id}/accept\`, {
            method: "POST"
          });
          clearWritebackPreview();
          renderCalendar();
          renderRisks();
          renderExplanations();
          updatePlanActionButtons();
          setStatus("Plan accepted.");
        } catch (error) {
          setStatus(error.message);
        }
      });

      rejectPlanButton.addEventListener("click", async () => {
        if (!state.plan) return;
        try {
          state.plan = await api(\`/api/schedule-plans/\${state.plan.id}/reject\`, {
            method: "POST"
          });
          clearWritebackPreview();
          renderCalendar();
          renderRisks();
          renderExplanations();
          updatePlanActionButtons();
          setStatus("Plan rejected.");
        } catch (error) {
          setStatus(error.message);
        }
      });

      previewWritebackButton.addEventListener("click", async () => {
        if (!state.plan) return;
        try {
const result = await api("/api/schedule-plans/" + encodeURIComponent(state.plan.id) + "/calendar-writeback/preview", {
method: "POST",
body: JSON.stringify({ ...scope(), calendarId: writebackCalendarIdEl.value, readOnly: false })
});
state.writebackPreview = {
planId: state.plan.id,
calendarId: writebackCalendarIdEl.value,
conflictCount: result.conflictCount || 0
};
writebackReviewedEl.checked = false;
renderWritebackConflicts(result.data || []);
updatePlanActionButtons();
setStatus(result.conflictCount === 0 ? "No write-back conflicts." : result.conflictCount + " write-back conflict(s) found.");
} catch (error) {
clearWritebackPreview();
updatePlanActionButtons();
setStatus(error.message);
}
});

writebackButton.addEventListener("click", async () => {
if (!state.plan) return;
const cleanPreview = Boolean(state.writebackPreview &&
state.writebackPreview.planId === state.plan.id &&
state.writebackPreview.calendarId === writebackCalendarIdEl.value &&
state.writebackPreview.conflictCount === 0);
const reviewed = writebackReviewedEl.checked;
if (!cleanPreview || !reviewed) {
const message = cleanPreview ? "Confirm the clean conflict preview before writing accepted blocks." : "Preview conflicts before writing accepted blocks.";
setWritebackStatus(message);
setStatus(message);
updatePlanActionButtons();
return;
}
try {
const result = await api("/api/schedule-plans/" + encodeURIComponent(state.plan.id) + "/calendar-writeback", {
method: "POST",
body: JSON.stringify({ ...scope(), calendarId: writebackCalendarIdEl.value, readOnly: false })
});
clearWritebackPreview();
renderWritebackConflicts([]);
await refreshEvents();
updatePlanActionButtons();
setWritebackStatus("Write-back complete. Preview required before another write-back.");
setStatus("Wrote " + result.createdCount + " new and " + result.updatedCount + " updated calendar block(s).");
} catch (error) {
clearWritebackPreview();
updatePlanActionButtons();
setWritebackStatus(error.message);
setStatus(error.message);
}
});

      exportIcsButton.addEventListener("click", async () => {
        if (!state.plan) return;
        try {
          const result = await api(\`/api/schedule-plans/\${state.plan.id}/ics/export\`);
          const blob = new Blob([result.ics], { type: result.contentType });
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = "scheduleos-plan.ics";
          anchor.click();
          URL.revokeObjectURL(url);
          setStatus("ICS exported.");
        } catch (error) {
          setStatus(error.message);
        }
      });

      const escapeHtml = (value) => String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");

      const localInputFromIso = (iso) => {
        const date = new Date(iso);
        const offsetMs = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
      };

      const updatePlanBlock = (updatedBlock) => {
        if (!state.plan) return;
        state.plan.blocks = state.plan.blocks.map((block) =>
          block.id === updatedBlock.id ? updatedBlock : block
        );
        renderCalendar();
      };

      const decorateTaskList = () => {
        taskListEl.querySelectorAll(".task-item").forEach((item, index) => {
          if (item.dataset.enhanced === "true") return;
          const task = state.tasks[index];
          if (!task) return;
          item.dataset.enhanced = "true";
          item.dataset.taskId = task.id;
          item.insertAdjacentHTML(
            "beforeend",
            '<div class="actions" aria-label="Task actions">' +
              '<button type="button" data-task-action="edit">Edit</button>' +
              '<button type="button" data-task-action="delete">Delete</button>' +
            '</div>'
          );
        });
      };

      const decorateEventList = () => {
        eventListEl.querySelectorAll(".event-item").forEach((item, index) => {
          if (item.dataset.enhanced === "true") return;
          const fixedEvent = state.events[index];
          if (!fixedEvent) return;
          item.dataset.enhanced = "true";
          item.dataset.eventId = fixedEvent.id;
          item.insertAdjacentHTML(
            "beforeend",
            '<div class="actions" aria-label="Fixed event actions">' +
              '<button type="button" data-event-action="edit">Edit</button>' +
              '<button type="button" data-event-action="delete">Delete</button>' +
            '</div>'
          );
        });
      };

      const decorateBlocks = () => {
        calendarEl.querySelectorAll(".block").forEach((item) => {
          if (item.dataset.enhanced === "true") return;
          const block = (state.plan?.blocks || []).find((candidate) => candidate.id === item.dataset.blockId);
          if (!block) return;
          const lockAction = block.locked ? "unlock" : "lock";
          const lockLabel = block.locked ? "Unlock" : "Lock";
          item.dataset.enhanced = "true";
          item.insertAdjacentHTML(
            "beforeend",
            '<div class="actions" aria-label="Time block actions">' +
              '<button type="button" data-block-action="move-earlier">Earlier</button>' +
              '<button type="button" data-block-action="move-later">Later</button>' +
              '<button type="button" data-block-action="' + lockAction + '">' + lockLabel + '</button>' +
              '<button type="button" data-block-action="complete">Done</button>' +
              '<button type="button" data-block-action="missed">Missed</button>' +
            '</div>'
          );
        });
      };

      new MutationObserver(decorateTaskList).observe(taskListEl, { childList: true });
      new MutationObserver(decorateEventList).observe(eventListEl, { childList: true });
      new MutationObserver(decorateBlocks).observe(calendarEl, { childList: true, subtree: true });

      taskListEl.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-task-action]");
        if (!button) return;
        const item = button.closest(".task-item");
        const task = state.tasks.find((candidate) => candidate.id === item?.dataset.taskId);
        if (!task) return;
        try {
          if (button.dataset.taskAction === "delete") {
            if (!confirm("Delete this task?")) return;
            await api("/api/tasks/" + encodeURIComponent(task.id) + "?" + new URLSearchParams(scope()).toString(), {
              method: "DELETE"
            });
            await refreshTasks();
            renderCalendar();
            setStatus("Task deleted. Use Replan to reflect the change.");
            return;
          }
          const title = prompt("Task title", task.title);
          if (title === null) return;
          const minutes = prompt("Minutes", String(task.estimatedDurationMinutes));
          if (minutes === null) return;
          const priority = prompt("Priority: URGENT, HIGH, MEDIUM, or LOW", task.priority);
          if (priority === null) return;
          const duration = Number(minutes);
          const updated = await api("/api/tasks/" + encodeURIComponent(task.id), {
            method: "PATCH",
            body: JSON.stringify({
              ...scope(),
              title,
              priority,
              estimatedDurationMinutes: duration,
              remainingDurationMinutes: duration
            })
          });
          state.tasks = state.tasks.map((candidate) => candidate.id === updated.id ? updated : candidate);
          renderTasks();
          renderCalendar();
          setStatus("Task updated. Use Replan to reflect the change.");
        } catch (error) {
          setStatus(error.message);
        }
      });

      eventListEl.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-event-action]");
        if (!button) return;
        const item = button.closest(".event-item");
        const fixedEvent = state.events.find((candidate) => candidate.id === item?.dataset.eventId);
        if (!fixedEvent) return;
        try {
          if (button.dataset.eventAction === "delete") {
            if (!confirm("Delete this fixed event?")) return;
            await api("/api/calendar-events/" + encodeURIComponent(fixedEvent.id) + "?" + new URLSearchParams(scope()).toString(), {
              method: "DELETE"
            });
            await refreshEvents();
            setStatus("Fixed event deleted. Use Replan to reflect the change.");
            return;
          }
          const title = prompt("Fixed event title", fixedEvent.title);
          if (title === null) return;
          const start = prompt("Start", localInputFromIso(fixedEvent.start));
          if (start === null) return;
          const end = prompt("End", localInputFromIso(fixedEvent.end));
          if (end === null) return;
          const updated = await api("/api/calendar-events/" + encodeURIComponent(fixedEvent.id), {
            method: "PATCH",
            body: JSON.stringify({
              ...scope(),
              title,
              start: isoFromLocal(start),
              end: isoFromLocal(end)
            })
          });
          state.events = state.events.map((candidate) => candidate.id === updated.id ? updated : candidate);
          renderEvents();
          renderCalendar();
          setStatus("Fixed event updated. Use Replan to reflect the change.");
        } catch (error) {
          setStatus(error.message);
        }
      });

      calendarEl.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-block-action]");
        if (!button) return;
        const item = button.closest(".block");
        if (!item?.dataset.blockId) return;
        try {
          const action = button.dataset.blockAction;
          if (action === "move-earlier" || action === "move-later") {
            const block = (state.plan?.blocks || []).find((candidate) => candidate.id === item.dataset.blockId);
            if (!block) return;
            const deltaMinutes = action === "move-earlier" ? -30 : 30;
            const start = addMinutes(new Date(block.start), deltaMinutes);
            const end = addMinutes(new Date(block.end), deltaMinutes);
            const updated = await api("/api/time-blocks/" + encodeURIComponent(block.id), {
              method: "PATCH",
              body: JSON.stringify({ start: start.toISOString(), end: end.toISOString() })
            });
            updatePlanBlock(updated);
            setStatus("Block moved " + (deltaMinutes > 0 ? "later" : "earlier") + ".");
            return;
          }
          const updated = await api("/api/time-blocks/" + encodeURIComponent(item.dataset.blockId) + "/" + button.dataset.blockAction, {
            method: "POST"
          });
          updatePlanBlock(updated);
          setStatus("Block marked " + button.dataset.blockAction + ".");
        } catch (error) {
          setStatus(error.message);
        }
      });

      renderTasks();
      renderEvents();
      renderCsvPreview();
      renderJsonPreview();
      renderIcsPreview();
      renderAuthSession();
      renderCalendar();
renderExplanations();
updatePlanActionButtons();
loadCsvTemplates();
loadCsvPolicies();
</script>
  </body>
</html>`;
