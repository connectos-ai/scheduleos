#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const files = {
  packageJson: "package.json",
  readme: "README.md",
  publicChecklist: "docs/public-release-checklist.md",
  approvalChecklist: "docs/security/production-web-app-approval-checklist.md",
  evidenceContractDoc: "docs/security/production-web-app-evidence-contract.md",
  evidenceContractSource: "src/production-web-app-evidence-contract.ts",
  evidenceContractTest: "src/production-web-app-evidence-contract.test.ts",
  webAppTest: "src/web-app.test.ts",
  cliSource: "src/cli.ts",
  cliTest: "src/cli.test.ts",
  browserSmoke: "docs/release-audit/CALENDAR_UI_BROWSER_SMOKE_20260722.md",
  selfHostingGuardAudit: "docs/release-audit/SELF_HOSTING_BOUNDARY_GUARD_20260727.md",
  approvalGuardAudit: "docs/release-audit/PRODUCTION_WEB_APP_APPROVAL_GUARD_20260727.md",
  functionalityParityAudit: "docs/release-audit/PRODUCTION_FUNCTIONALITY_EVIDENCE_PARITY_GUARD_20260728.md",
  finalReleaseChecklist: "docs/release/final-release-gate-approval-checklist.md",
  audit: "docs/release-audit/PRODUCTION_WEB_APP_EVIDENCE_PARITY_GUARD_20260728.md"
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, relativePath]) => [key, readRequired(relativePath)])
);
const packageJson = parseJson(text.packageJson, "package.json");
const scripts = packageJson.scripts ?? {};
const checkSteps = String(scripts.check ?? "").split(" && ");
const blocker = "Standalone production web app beyond local foundations";

if (process.env.SCHEDULEOS_REQUIRE_NO_GIT === "true" && existsSync(path.join(root, ".git"))) {
  failures.push("local .git directory must not exist before intentional clean public repository staging.");
}

requirePackageScript("production-web-app:evidence-parity:check");
requirePackageScript("production-functionality:parity:check");
requirePackageScript("production-web-app:approval:check");
requirePackageScript("web-app:production-readiness-packet");
requireText(text.packageJson, "node scripts/check-production-web-app-evidence-parity.mjs", "package scripts must wire production web app evidence parity guard.");

const functionalityIndex = indexOfStep("production-functionality:parity:check");
const parityIndex = indexOfStep("production-web-app:evidence-parity:check");
const approvalIndex = indexOfStep("production-web-app:approval:check");
if (parityIndex < 0) {
  failures.push("npm run check must include production web app evidence parity guard.");
}
if (functionalityIndex >= 0 && parityIndex >= 0 && functionalityIndex > parityIndex) {
  failures.push("production web app evidence parity guard must run after production functionality parity guard.");
}
if (parityIndex >= 0 && approvalIndex >= 0 && parityIndex > approvalIndex) {
  failures.push("production web app evidence parity guard must run before production web app approval guard.");
}

requireUnchecked(text.publicChecklist, blocker);
for (const expected of [
  "Local standalone planning app shell served at `/app`",
  "Local Chrome browser smoke for standalone calendar drag/drop",
  "Standalone web app production readiness packet foundation",
  "Standalone production web app approval checklist exists",
  "Production web app evidence contract foundation",
  "Production web app approval guard foundation",
  "Production web app evidence parity guard foundation",
  "Self-hosting boundary guard foundation"
]) {
  requireText(text.publicChecklist, expected, `public release checklist must preserve web app foundation: ${expected}`);
}

for (const expected of [
  "Current release gate: `FAIL`.",
  "not ready for public release or production use",
  "Open `http://127.0.0.1:8787/app`",
  "hosted service",
  "subscription",
  "Dependency-free standalone planning app shell at `/app`",
  "Standalone web app production readiness packet, review-only",
  "does not approve production deployment, mutate application state, configure hosting, create public remote, or replace production evidence"
]) {
  requireText(text.readme, expected, `README must preserve web app release boundary: ${expected}`);
}

for (const expected of [
  "Current result: `FAIL`.",
  "No public repository, hosted deployment, tag, package publication, or release announcement may rely on the production web app until this checklist changes to `PASS`.",
  "Production build artifact",
  "Deployment target",
  "authenticated write",
  "CSRF cookie transport",
  "Request throttle",
  "Durable storage",
  "Static asset and app-shell cache policy",
  "Browser matrix",
  "Accessibility audit",
  "Responsive polish",
  "Visual regression",
  "Operator review",
  "Remote CI proof",
  "Rollback plan",
  "Security, privacy, and licensing audits remain `PASS`",
  "Second operator approves the final production web app evidence packet",
  "This packet does not approve production deployment",
  `Do not mark "${blocker}" complete`
]) {
  requireText(text.approvalChecklist, expected, `production web app approval checklist must preserve required boundary: ${expected}`);
}

for (const expected of [
  "Current result: `FAIL`.",
  "does not approve production deployment",
  "no private compatible leadership system dependency",
  "no hosted-service requirement",
  "Browser matrix across Chrome, Firefox, Safari, and mobile WebKit",
  "final audits",
  "second-operator review"
]) {
  requireText(text.evidenceContractDoc, expected, `production web app evidence contract doc must preserve boundary: ${expected}`);
}

for (const expected of [
  "validateProductionWebAppEvidence",
  "noHostedServiceRequirement",
  "noPrivateLeadershipSystemDependency",
  "csrfCookieTransportProof",
  "requestThrottleProof",
  "importThrottleProof",
  "staticAssetCachePolicy",
  "accessibilityAudit",
  "responsivePolish",
  "visualRegressionBaseline",
  "remoteCiProof",
  "rollbackPlan",
  "securityAuditPass",
  "privacyAuditPass",
  "licensingAuditPass",
  "secondOperatorReview",
  "CHROME",
  "FIREFOX",
  "SAFARI",
  "MOBILE_WEBKIT"
]) {
  requireText(text.evidenceContractSource, expected, `production web app evidence source must preserve required field: ${expected}`);
}

for (const expected of [
  "production web app evidence accepts complete release-grade evidence shape",
  "production web app evidence rejects missing deployment independence proof",
  "production web app evidence rejects unsafe authenticated write flow",
  "production web app evidence rejects missing security storage proof",
  "production web app evidence rejects missing browser operations approvals",
  "FIREFOX",
  "accessibility audit",
  "responsive polish",
  "visual regression",
  "remote CI",
  "second operator"
]) {
  requireText(text.evidenceContractTest, expected, `production web app evidence tests must preserve coverage: ${expected}`);
}

for (const expected of [
  "standalone web app keeps calendar accessibility hooks wired",
  "standalone web app keeps responsive calendar layout contract",
  "standalone web app renders browser-verifiable calendar drag and conflict hooks",
  "standalone web app requires in-page provider CSV review before import",
  "standalone web app renders provider CSV confirmation summary",
  "data-testid=\"calendar-grid\"",
  "data-testid=\"calendar-slot\"",
  "data-testid=\"time-block\"",
  "data-testid=\"writeback-conflict-list\"",
  "aria-live=\"polite\""
]) {
  requireText(text.webAppTest, expected, `standalone web app tests must preserve local app evidence: ${expected}`);
}

for (const expected of [
  "web-app:production-readiness-packet",
  "runWebAppProductionReadinessPacketCommand",
  "--deployment-target",
  "--production-build",
  "--authenticated-write-flow",
  "--browser-matrix",
  "--accessibility-audit",
  "--responsive-polish",
  "--visual-regression",
  "--operator-review",
  "--remote-ci",
  "--rollback-plan",
  "--second-operator"
]) {
  requireText(text.cliSource, expected, `CLI must preserve production web app readiness packet wiring: ${expected}`);
}
for (const expected of [
  "web-app:production-readiness-packet",
  "web app production readiness packet",
  "productionApprovalGranted",
  "deploymentMutationAllowedByPacket",
  "secondOperator"
]) {
  requireText(text.cliTest, expected, `CLI tests must preserve production web app readiness packet coverage: ${expected}`);
}

for (const expected of [
  "Local browser smoke passed",
  "not final production UI approval",
  "Desktop viewport",
  "Mobile viewport",
  "Conflict preview showed",
  "Review acknowledgement showed"
]) {
  requireText(text.browserSmoke, expected, `browser smoke must remain local-only evidence: ${expected}`);
}

for (const expected of [
  "README.md",
  "local `/app` URL",
  "standalone web app tests remain present",
  "public release checklist keeps the standalone production web app blocker unchecked",
  "This is not production self-hosting approval."
]) {
  requireText(text.selfHostingGuardAudit, expected, `self-hosting guard audit must preserve web app boundary: ${expected}`);
}
for (const expected of [
  "This is not production web app approval.",
  "does not deploy ScheduleOS",
  "run a production browser matrix",
  "approve accessibility or visual regression",
  "prove remote CI",
  "approve rollback"
]) {
  requireText(text.approvalGuardAudit, expected, `production web app approval audit must preserve non-approval boundary: ${expected}`);
}
requireText(text.functionalityParityAudit, "production web app", "production functionality parity audit must still cover production web app.");
requireText(text.finalReleaseChecklist, "Final functionality gate proof confirming production web app", "final release gate must depend on production web app PASS proof.");
requireText(text.finalReleaseChecklist, "Current result: `FAIL`.", "final release gate must remain FAIL.");

for (const expected of [
  "This is not production web app evidence approval.",
  "does not mark standalone production web app proof complete",
  "ScheduleOS release status remains `FAIL`"
]) {
  requireText(text.audit, expected, `audit note must preserve non-approval caveat: ${expected}`);
}

if (failures.length > 0) {
  console.error("Production web app evidence parity guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Production web app evidence parity guard passed.");

function readRequired(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) {
    failures.push(`${relativePath} is missing.`);
    return "";
  }
  return readFileSync(absolutePath, "utf8");
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
  if (!Object.hasOwn(scripts, scriptName) && !checkSteps.some((step) => step.includes(scriptName))) {
    failures.push(`package.json must keep script wiring: ${scriptName}`);
  }
}

function requireText(content, expected, message) {
  if (!content.includes(expected)) {
    failures.push(message);
  }
}

function requireUnchecked(content, label) {
  const uncheckedPattern = new RegExp(`^- \\[ \\] ${escapeRegExp(label)}`, "mu");
  const checkedPattern = new RegExp(`^- \\[[xX]\\] ${escapeRegExp(label)}`, "mu");
  if (!uncheckedPattern.test(content)) {
    failures.push(`public release checklist must keep unchecked blocker: ${label}`);
  }
  if (checkedPattern.test(content)) {
    failures.push(`public release checklist checked production web app blocker prematurely: ${label}`);
  }
}

function indexOfStep(scriptName) {
  return checkSteps.findIndex((step) => step.includes(scriptName));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
