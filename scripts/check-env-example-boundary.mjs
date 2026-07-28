#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const envExamplePath = path.join(root, ".env.example");
const gitignorePath = path.join(root, ".gitignore");
const deploymentPath = path.join(root, "docs", "deployment.md");
const selfHostingPath = path.join(root, "docs", "self-hosting.md");
const securityAuditPath = path.join(root, "docs", "security", "public-release-security-audit.md");
const serverTestPath = path.join(root, "src", "server.test.ts");
const releaseSafetyPath = path.join(root, "scripts", "check-release-safety.mjs");
const publicChecklistPath = path.join(root, "docs", "public-release-checklist.md");
const auditPath = path.join(
  root,
  "docs",
  "release-audit",
  "ENV_EXAMPLE_BOUNDARY_GUARD_20260727.md"
);

const envExample = readRequired(envExamplePath);
const gitignore = readRequired(gitignorePath);
const deployment = readRequired(deploymentPath);
const selfHosting = readRequired(selfHostingPath);
const securityAudit = readRequired(securityAuditPath);
const serverTest = readRequired(serverTestPath);
const releaseSafety = readRequired(releaseSafetyPath);
const publicChecklist = readRequired(publicChecklistPath);
const audit = readRequired(auditPath);

if (existsSync(path.join(root, ".git"))) {
  failures.push(".git directory exists before env example public boundary review.");
}

for (const expected of [
  "Do not commit .env",
  "SCHEDULEOS_HOST=127.0.0.1",
  "SCHEDULEOS_PORT=8787",
  "SCHEDULEOS_API_KEY=dev_scheduleos_change_me",
  "SCHEDULEOS_API_ROLE=EDITOR",
  "SCHEDULEOS_TENANT_ID=tenant_demo",
  "SCHEDULEOS_WORKSPACE_ID=workspace_demo",
  "SCHEDULEOS_USER_ID=user_jordan",
  "SCHEDULEOS_AUTH_SESSION_COOKIE=false",
  "SCHEDULEOS_AUTH_SESSION_COOKIE_SECURE=false",
  "SCHEDULEOS_AUTH_PASSWORD_RESET_RETURN_TOKEN=false",
  "SCHEDULEOS_STORAGE_PATH=.local/scheduleos.dev.json",
  "SCHEDULEOS_RATE_LIMIT_PERSISTED=false",
  "SCHEDULEOS_TEST_POSTGRES_URL=postgres://scheduleos:scheduleos@localhost:55432/scheduleos_test",
]) {
  requireText(envExample, expected, `.env.example must preserve safe local default: ${expected}`);
}

for (const forbidden of [
  /SCHEDULEOS_HOST=0\.0\.0\.0/u,
  /SCHEDULEOS_API_ROLE=OWNER/u,
  /SCHEDULEOS_AUTH_SESSION_COOKIE=true/u,
  /SCHEDULEOS_AUTH_SESSION_COOKIE_SECURE=true/u,
  /SCHEDULEOS_AUTH_PASSWORD_RESET_RETURN_TOKEN=true/u,
  /AKIA[0-9A-Z]{16}/u,
  /sk-[A-Za-z0-9_-]{20,}/u,
  /xox[baprs]-[A-Za-z0-9-]+/u,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu,
]) {
  if (forbidden.test(envExample)) {
    failures.push(`.env.example contains forbidden public-example pattern: ${forbidden}`);
  }
}

for (const expected of [
  ".env",
  "!.env.example",
]) {
  requireText(gitignore, expected, `.gitignore must preserve env/local-data rule: ${expected}`);
}

for (const expected of [
  "Replace the `.env.example` `SCHEDULEOS_API_KEY` value before production",
  "Replace `.env.example` tenant/workspace/user IDs before production static",
  "SCHEDULEOS_AUTH_PASSWORD_RESET_RETURN_TOKEN=false",
]) {
  requireText(deployment, expected, `deployment docs must preserve env caveat: ${expected}`);
}

for (const expected of [
  "SCHEDULEOS_API_KEY=dev_scheduleos_change_me",
  "SCHEDULEOS_STORAGE_PATH=.local/scheduleos.dev.json",
  "Do not expose the local API publicly",
]) {
  requireText(selfHosting, expected, `self-hosting docs must preserve env caveat: ${expected}`);
}

for (const expected of [
  ".env.example",
  "fictional local-development values only",
  ".gitignore",
  "allowing `.env.example`",
  "rejects `NODE_ENV=production` static API-key auth",
]) {
  requireText(securityAudit, expected, `security audit must preserve env evidence: ${expected}`);
}

for (const expected of [
  "default development API key in production",
  "rejects production static auth with demo scope",
  "rejects production password reset token return",
]) {
  requireText(serverTest, expected, `server tests must preserve env startup guard: ${expected}`);
}

for (const expected of [
  "relativePath === \".env.example\"",
  "dev_scheduleos_change_me",
  "postgres://scheduleos:scheduleos@localhost",
]) {
  requireText(releaseSafety, expected, `release safety scan must preserve env allowlist: ${expected}`);
}

for (const expected of [
  "- [x] `.env.example`.",
  "- [x] Env example boundary guard foundation",
]) {
  requireText(publicChecklist, expected, `public release checklist must preserve env boundary: ${expected}`);
}

requireText(
  audit,
  "This is not production environment approval.",
  "env example boundary audit must preserve non-approval caveat."
);

if (failures.length > 0) {
  console.error("Env example boundary guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Env example boundary guard passed.");

function readRequired(filePath) {
  try {
    return readFileSync(filePath, "utf8");
  } catch (error) {
    failures.push(`Missing required file: ${path.relative(root, filePath)}`);
    return "";
  }
}

function requireText(text, expected, message) {
  if (!text.includes(expected)) {
    failures.push(message);
  }
}
