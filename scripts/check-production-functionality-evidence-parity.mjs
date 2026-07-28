#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const files = {
  packageJson: "package.json",
  publicChecklist: "docs/public-release-checklist.md",
  finalReleaseChecklist: "docs/release/final-release-gate-approval-checklist.md",
  webApp: "docs/security/production-web-app-approval-checklist.md",
  calendarUi: "docs/security/production-calendar-ui-approval-checklist.md",
  ics: "docs/security/production-ics-approval-checklist.md",
  providerCsv: "docs/security/production-provider-csv-approval-checklist.md",
  hostedPublicEvent: "docs/security/production-managed-secret-public-event-approval-checklist.md",
  auth: "docs/security/production-auth-approval-checklist.md",
  rateLimit: "docs/security/production-rate-limit-approval-checklist.md",
  providerLifecycle: "docs/security/production-provider-lifecycle-approval-checklist.md",
  webAppGuard: "scripts/check-production-web-app-approval.mjs",
  calendarUiGuard: "scripts/check-production-calendar-ui-approval.mjs",
  icsGuard: "scripts/check-production-ics-approval.mjs",
  providerCsvGuard: "scripts/check-production-provider-csv-approval.mjs",
  hostedPublicEventGuard: "scripts/check-hosted-public-event-approval.mjs",
  authGuard: "scripts/check-production-auth-approval.mjs",
  rateLimitGuard: "scripts/check-production-rate-limit-approval.mjs",
  providerLifecycleGuard: "scripts/check-production-provider-lifecycle-approval.mjs",
  audit: "docs/release-audit/PRODUCTION_FUNCTIONALITY_EVIDENCE_PARITY_GUARD_20260728.md"
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, relativePath]) => [
    key,
    readRequired(relativePath)
  ])
);
const packageJson = parseJson(text.packageJson, "package.json");
const checkSteps = (packageJson.scripts?.check ?? "").split(" && ");

if (process.env.SCHEDULEOS_REQUIRE_NO_GIT === "true" && existsSync(path.join(root, ".git"))) {
  failures.push(".git directory exists before production functionality evidence approval.");
}

const productionSurfaces = [
  {
    name: "web app",
    scriptName: "production-web-app:approval:check",
    checklist: text.webApp,
    guard: text.webAppGuard,
    publicItem: "Standalone production web app beyond local foundations",
    required: [
      "Production build artifact",
      "Browser matrix",
      "Accessibility audit",
      "Responsive polish",
      "Visual regression",
      "Remote CI proof",
      "Rollback plan",
      "Security, privacy",
      "licensing audits",
      "Second operator",
      "This packet does not approve production deployment"
    ],
    nonApproval: "This is not production web app approval."
  },
  {
    name: "calendar UI",
    scriptName: "production-calendar-ui:approval:check",
    checklist: text.calendarUi,
    guard: text.calendarUiGuard,
    publicItem: "Production calendar UI hardening",
    required: [
      "Browser matrix",
      "Interactive conflict-preview workflow",
      "Write-back acknowledgement proof",
      "Keyboard navigation proof",
      "Screen-reader semantics proof",
      "Accessibility audit",
      "Responsive polish",
      "Visual regression",
      "Product-owner visual approval",
      "Remote CI proof",
      "Second operator",
      "This packet does not approve production UI"
    ],
    nonApproval: "This is not production calendar UI approval."
  },
  {
    name: "ICS",
    scriptName: "production-ics:approval:check",
    checklist: text.ics,
    guard: text.icsGuard,
    publicItem: "Release-grade ICS workflow",
    required: [
      "Provider fixture suite",
      "Browser workflow proof",
      "Remote CI proof",
      "Rollback plan",
      "Security, privacy",
      "licensing audits",
      "Second operator approves final production ICS workflow evidence packet",
      "This packet does not approve production calendar sync"
    ],
    nonApproval: "This is not release-grade ICS approval."
  },
  {
    name: "provider CSV",
    scriptName: "production-provider-csv:approval:check",
    checklist: text.providerCsv,
    guard: text.providerCsvGuard,
    publicItem: "Production-grade provider CSV import workflow",
    required: [
      "Real-provider export fixture suite",
      "Download/upload workflow proof",
      "Provider-specific confirmation UX proof",
      "Production provider quota governance proof",
      "Browser workflow proof",
      "Hosted abuse analytics proof",
      "Remote CI proof",
      "Second operator",
      "This packet does not approve production imports"
    ],
    nonApproval: "This is not production provider CSV import approval."
  },
  {
    name: "hosted public event",
    scriptName: "hosted-public-event:approval:check",
    checklist: text.hostedPublicEvent,
    guard: text.hostedPublicEventGuard,
    publicItem: "Production managed secret storage and durable hosted public-event workers/observability",
    required: [
      "Production managed secret storage",
      "Durable subscription worker topology",
      "Durable hosted retry queue",
      "Durable dead-letter queue",
      "Hosted alert routing",
      "Remote CI proof",
      "Security, privacy",
      "licensing audits",
      "Second operator",
      "This packet does not configure managed secrets"
    ],
    nonApproval: "This is not production hosted public-event worker approval."
  },
  {
    name: "auth",
    scriptName: "auth:approval:check",
    checklist: text.auth,
    guard: text.authGuard,
    publicItem: "Production persisted auth, roles, memberships, and session model approved for public release",
    required: [
      "Identity provider",
      "Durable production session store",
      "Authorization matrix",
      "Session lifecycle",
      "Password reset lifecycle",
      "Cookie",
      "CSRF",
      "Remote CI proof",
      "Browser verification",
      "Security, privacy",
      "licensing audits",
      "Second operator",
      "packets do not approve production auth"
    ],
    nonApproval: "This is not production auth approval."
  },
  {
    name: "rate limit",
    scriptName: "rate-limit:approval:check",
    checklist: text.rateLimit,
    guard: text.rateLimitGuard,
    publicItem: "Production distributed rate limiting, provider-specific quota enforcement, hosted alert delivery/dashboards beyond local summary thresholds, and abuse analytics",
    required: [
      "Edge, gateway, or reverse-proxy rate-limit policy",
      "Distributed throttle store",
      "Provider quota governance",
      "Hosted alert routing",
      "Hosted dashboard",
      "Abuse analytics",
      "Privacy review",
      "Remote CI proof",
      "Security, privacy",
      "licensing audits",
      "Second operator approves rate-limit abuse-monitoring evidence packet",
      "This packet does not enable production throttling"
    ],
    nonApproval: "This is not production rate-limit or abuse-monitoring approval."
  },
  {
    name: "provider lifecycle",
    scriptName: "providers:lifecycle-approval:check",
    checklist: text.providerLifecycle,
    guard: text.providerLifecycleGuard,
    publicItem: "Production-grade webhook/provider lifecycle enforcement, provider-specific adapters, hosted operator alerts, and provider-specific rotation/revocation/write-back runbooks",
    required: [
      "Provider-specific adapter contract",
      "Provider OAuth or secret lifecycle",
      "Provider-specific webhook signature",
      "Provider-specific quota and backoff policy",
      "Provider-specific write-back safety",
      "Provider revocation",
      "Hosted operator alerts",
      "Provider-specific runbook",
      "Privacy review",
      "Remote CI proof",
      "Second operator",
      "This packet does not enforce production provider lifecycle"
    ],
    nonApproval: "This is not production provider lifecycle approval."
  }
];

requireText(text.finalReleaseChecklist, "Current result: `FAIL`.", "final release gate must remain FAIL.");
for (const expected of [
  "Final functionality gate proof",
  "production web app",
  "production calendar UI",
  "release-grade ICS workflow",
  "Public remote CI `PASS` proof",
  "Owner approval plus second-operator final release approval"
]) {
  requireText(text.finalReleaseChecklist, expected, `final release gate must preserve production dependency: ${expected}`);
}

const parityIndex = indexOfStep("production-functionality:parity:check");
const finalReleaseIndex = indexOfStep("release:final-gate-approval:check");
if (parityIndex < 0) {
  failures.push("npm run check must include production functionality parity guard.");
}
if (finalReleaseIndex < 0) {
  failures.push("npm run check must include final release gate approval guard.");
}
if (parityIndex >= 0 && finalReleaseIndex >= 0 && parityIndex <= finalReleaseIndex) {
  failures.push("production functionality parity guard must run after final release gate approval guard.");
}

for (const surface of productionSurfaces) {
  requirePackageScript(surface.scriptName);
  const surfaceIndex = indexOfStep(surface.scriptName);
  if (surfaceIndex < 0) {
    failures.push(`${surface.scriptName} must be included in npm run check.`);
  }
  if (parityIndex >= 0 && surfaceIndex >= 0 && parityIndex > surfaceIndex) {
    failures.push(`production functionality parity guard must run before ${surface.scriptName}.`);
  }

  requireText(surface.checklist, "Current result: `FAIL`.", `${surface.name} checklist must remain FAIL.`);
  requireText(surface.checklist, "Remote CI proof", `${surface.name} checklist must keep remote CI proof requirement.`);
  requireText(surface.checklist, "Security, privacy", `${surface.name} checklist must keep final audit alignment.`);
  requireText(surface.checklist, "licensing audits", `${surface.name} checklist must keep licensing audit alignment.`);
  for (const expected of surface.required) {
    requireText(surface.checklist, expected, `${surface.name} checklist must preserve evidence requirement: ${expected}`);
  }
  const uncheckedPattern = new RegExp(`^- \\[ \\] ${escapeRegExp(surface.publicItem)}(?:[:.]|$)`, "mu");
  const checkedPattern = new RegExp(`^- \\[x\\] ${escapeRegExp(surface.publicItem)}(?:[:.]|$)`, "mu");
  if (!uncheckedPattern.test(text.publicChecklist)) {
    failures.push(`public checklist must keep unchecked production blocker: ${surface.publicItem}`);
  }
  if (checkedPattern.test(text.publicChecklist)) {
    failures.push(`public checklist checked production blocker prematurely: ${surface.publicItem}`);
  }
  requireText(surface.guard, surface.nonApproval, `${surface.name} guard must preserve non-approval caveat.`);
  requireText(surface.checklist, "no-`.git`", `${surface.name} checklist must preserve no-git proof boundary.`);
}

requireText(
  text.publicChecklist,
  "Production functionality evidence parity guard foundation",
  "public release checklist must record production functionality parity guard foundation."
);
requireText(
  text.audit,
  "This is not production functionality approval.",
  "production functionality parity audit must preserve non-approval caveat."
);
requirePackageScript("production-functionality:parity:check");

if (failures.length > 0) {
  console.error("Production functionality evidence parity guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Production functionality evidence parity guard passed ${productionSurfaces.length} production surface(s).`);

function readRequired(relativePath) {
  try {
    return readFileSync(path.join(root, relativePath), "utf8");
  } catch (error) {
    failures.push(`Missing required file: ${relativePath}`);
    return "";
  }
}

function parseJson(content, label) {
  try {
    return JSON.parse(content || "{}");
  } catch (error) {
    failures.push(`${label} must be valid JSON.`);
    return {};
  }
}

function requirePackageScript(scriptName) {
  if (!text.packageJson.includes(scriptName)) {
    failures.push(`package.json must keep script wiring: ${scriptName}`);
  }
}

function requireText(content, expected, message) {
  if (!content.includes(expected)) {
    failures.push(message);
  }
}

function indexOfStep(scriptName) {
  return checkSteps.findIndex((step) => step.includes(scriptName));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
