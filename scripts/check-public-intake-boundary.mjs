#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const files = {
  config: ".github/ISSUE_TEMPLATE/config.yml",
  bug: ".github/ISSUE_TEMPLATE/bug_report.md",
  feature: ".github/ISSUE_TEMPLATE/feature_request.md",
  integration: ".github/ISSUE_TEMPLATE/integration_request.md",
  solver: ".github/ISSUE_TEMPLATE/solver_constraint_proposal.md",
  pullRequest: ".github/PULL_REQUEST_TEMPLATE.md",
  ci: ".github/workflows/ci.yml",
  publicChecklist: "docs/public-release-checklist.md",
  securityChecklist: "docs/security/security-policy-contact-approval-checklist.md",
  privacyChecklist: "docs/security/final-privacy-audit-approval-checklist.md",
  audit: "docs/release-audit/PUBLIC_INTAKE_BOUNDARY_GUARD_20260728.md"
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, relativePath]) => [
    key,
    readRequired(relativePath)
  ])
);

if (process.env.SCHEDULEOS_REQUIRE_NO_GIT === "true" && existsSync(path.join(root, ".git"))) {
  failures.push(".git directory exists before public intake boundary review.");
}

for (const expected of [
  "blank_issues_enabled: false",
  "Security vulnerability reports",
  "Private data or secret exposure",
  "do not open public security issues",
  "Do not post tokens, credentials, real calendar data"
]) {
  requireText(text.config, expected, `issue config must preserve public intake boundary: ${expected}`);
}

const issueTemplates = [
  ["bug report", text.bug],
  ["feature request", text.feature],
  ["integration request", text.integration],
  ["solver constraint proposal", text.solver]
];

for (const [label, content] of issueTemplates) {
  requireText(content, "## Safety First", `${label} template must begin with safety guidance.`);
  requireAnyText(
    content,
    [
      "Use fictional data only",
      "Use fictional examples only",
      "Use fictional task",
      "Use fictional provider and scope examples only"
    ],
    `${label} template must require fictional example data.`
  );
  requireAnyText(
    content,
    ["Do not include real", "Do not include provider tokens", "Do not report security vulnerabilities"],
    `${label} template must forbid private, secret, or security data in public issues.`
  );
}

for (const expected of [
  "private vulnerability reporting path",
  "tokens",
  "private workspace details"
]) {
  requireText(text.bug, expected, `bug template must preserve security/private-data route-away guidance: ${expected}`);
}

for (const expected of [
  "Do not request private private leadership-only behavior",
  "standalone open-source functionality",
  "compatible leadership system, OwnerOps, ConnectOS"
]) {
  requireText(text.feature, expected, `feature template must preserve standalone/public-contract boundary: ${expected}`);
}

for (const expected of [
  "OAuth credentials",
  "callback URLs",
  "private vulnerability reporting path",
  "minimum provider permissions or scopes"
]) {
  requireText(text.integration, expected, `integration template must preserve provider safety boundary: ${expected}`);
}

for (const expected of [
  "real task titles",
  "customer data",
  "Expected Result",
  "Failure Mode"
]) {
  requireText(text.solver, expected, `solver template must preserve fictional solver evidence boundary: ${expected}`);
}

for (const expected of [
  "`npm run check`",
  "`npm audit --omit=dev --audit-level=high`",
  "Uses fictional sample data only",
  "Adds no secrets, tokens, private keys, real calendar data",
  "Preserves tenant, workspace, user"
]) {
  requireText(text.pullRequest, expected, `pull request template must preserve release/data safety checklist: ${expected}`);
}

for (const expected of [
  "permissions:",
  "contents: read",
  "npm run check",
  "npm audit --omit=dev --audit-level=high"
]) {
  requireText(text.ci, expected, `CI workflow must preserve read-only release evidence: ${expected}`);
}

for (const forbidden of [
  /\bcontents\s*:\s*write\b/u,
  /\bpermissions\s*:\s*write-all\b/u,
  /\bpull_request_target\s*:/u,
  /\bnpm\s+publish\b/u,
  /\bgh\s+release\b/u,
  /\bgit\s+tag\b/u,
  /\bpages\s*:\s*write\b/u,
  /\bid-token\s*:\s*write\b/u
]) {
  if (forbidden.test(text.ci)) {
    failures.push(`CI workflow contains forbidden public-release mutation pattern: ${forbidden}`);
  }
}

for (const expected of [
  "- [x] Public issue-template intake foundation",
  "- [x] Public intake boundary guard foundation"
]) {
  requireText(text.publicChecklist, expected, `public release checklist must record public intake boundary: ${expected}`);
}

for (const expected of [
  "Public issue-template intake disables blank issues",
  "routes security/private-data reports away from public issues"
]) {
  requireText(text.securityChecklist, expected, `security contact checklist must preserve public intake dependency: ${expected}`);
}

for (const expected of [
  "Public issue-template intake guardrails",
  "route security and private-data reports away from public issues"
]) {
  requireText(text.privacyChecklist, expected, `privacy audit checklist must preserve public intake dependency: ${expected}`);
}

requireText(
  text.audit,
  "This is not public repository launch approval.",
  "public intake boundary audit must preserve non-approval caveat."
);

if (failures.length > 0) {
  console.error("Public intake boundary guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Public intake boundary guard passed.");

function readRequired(relativePath) {
  try {
    return readFileSync(path.join(root, relativePath), "utf8");
  } catch (error) {
    failures.push(`Missing required file: ${relativePath}`);
    return "";
  }
}

function requireText(content, expected, message) {
  if (!content.includes(expected)) {
    failures.push(message);
  }
}

function requireAnyText(content, expectedOptions, message) {
  if (!expectedOptions.some((expected) => content.includes(expected))) {
    failures.push(message);
  }
}
