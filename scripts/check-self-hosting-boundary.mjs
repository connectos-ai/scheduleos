#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const selfHostingPath = path.join(root, "docs", "self-hosting.md");
const deploymentPath = path.join(root, "docs", "deployment.md");
const readmePath = path.join(root, "README.md");
const publicChecklistPath = path.join(root, "docs", "public-release-checklist.md");
const serverConfigTestPath = path.join(root, "src", "server.test.ts");
const webAppTestPath = path.join(root, "src", "web-app.test.ts");
const auditPath = path.join(
  root,
  "docs",
  "release-audit",
  "SELF_HOSTING_BOUNDARY_GUARD_20260727.md"
);

const selfHosting = readRequired(selfHostingPath);
const deployment = readRequired(deploymentPath);
const readme = readRequired(readmePath);
const publicChecklist = readRequired(publicChecklistPath);
const serverConfigTest = readRequired(serverConfigTestPath);
const webAppTest = readRequired(webAppTestPath);
const audit = readRequired(auditPath);

if (process.env.SCHEDULEOS_REQUIRE_NO_GIT === "true" && existsSync(path.join(root, ".git"))) {
  failures.push(".git directory exists before self-hosting release boundary approval.");
}

for (const expected of [
  "not ready for production self-hosting yet",
  "npm run check",
  "npm run dev",
  "http://127.0.0.1:8787/app",
  "Do not expose",
  "binds to `127.0.0.1:8787`",
  "SCHEDULEOS_STORAGE_PATH=.local/scheduleos.dev.json",
  "session-cookie transport",
  "Local Planning App",
  "standalone ScheduleOS loop",
  "Horizontally scaled production still needs distributed throttling",
  "Production Gaps",
  "Live PostgreSQL proof in CI.",
]) {
  requireText(selfHosting, expected, `self-hosting guide must preserve boundary: ${expected}`);
}

for (const expected of [
  "pre-release and should not be deployed for production use yet",
  "There is no production web app",
  "npm run check",
  "npm audit --omit=dev --audit-level=high",
  "does not approve production deployment",
  "Pre-Production Checklist",
  "Production public binds also require",
  "SCHEDULEOS_AUTH_SESSION_COOKIE_SECURE=true",
  "SCHEDULEOS_AUTH_PASSWORD_RESET_RETURN_TOKEN=false",
]) {
  requireText(deployment, expected, `deployment guide must preserve boundary: ${expected}`);
}

for (const expected of [
  "ScheduleOS is a public open-source baseline",
  "Current public repository gate: `PASS`.",
  "http://127.0.0.1:8787/app",
  "ScheduleOS must work without",
  "A hosted service.",
  "A commercial subscription.",
]) {
  requireText(readme, expected, `README must preserve standalone boundary: ${expected}`);
}

for (const expected of [
  "- [x] Self-hosting boundary guard foundation",
  "local/self-host guide",
  "production deployment notes",
  "production web app blocker remains unchecked",
]) {
  requireText(publicChecklist, expected, `public release checklist must record self-host boundary: ${expected}`);
}

for (const expected of [
  "standalone server config uses safe local defaults",
  "rejects unauthenticated production public bind",
  "rejects production public bind without request throttling",
  "rejects production public bind without durable storage",
  "rejects production public bind without persisted throttling",
  "rejects insecure production session cookies",
]) {
  requireText(serverConfigTest, expected, `standalone server tests must keep production startup guard: ${expected}`);
}

for (const expected of [
  "responsive calendar layout contract",
  "drag-status",
  "provider CSV review before import",
]) {
  requireText(webAppTest, expected, `web app tests must keep standalone app coverage: ${expected}`);
}

requireText(
  publicChecklist,
  "- [ ] Standalone production web app beyond local foundations",
  "public release checklist must keep production web app blocker unchecked."
);
requireText(
  audit,
  "This is not production self-hosting approval.",
  "self-hosting boundary audit must preserve non-approval caveat."
);

if (failures.length > 0) {
  console.error("Self-hosting boundary guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Self-hosting boundary guard passed.");

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
