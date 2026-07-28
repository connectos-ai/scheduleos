#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "docs", "release", "first-commit-staging-manifest.md");
const gitignorePath = path.join(root, ".gitignore");
const publicChecklistPath = path.join(root, "docs", "public-release-checklist.md");
const failures = [];

const requiredIncludeEntries = [
  ".env.example",
  ".github/",
  ".gitignore",
  "CHANGELOG.md",
  "CODE_OF_CONDUCT.md",
  "CONTRIBUTING.md",
  "LICENSE",
  "README.md",
  "SECURITY.md",
  "docker-compose*.yml",
  "docs/",
  "examples/",
  "fixtures/",
  "migrations/",
  "package.json",
  "package-lock.json",
  "scripts/",
  "src/",
  "tsconfig.json"
];

const requiredExcludeEntries = [
  ".git/",
  ".env",
  ".env.*",
  "node_modules/",
  "dist/",
  "coverage/",
  "local SQLite databases",
  "logs",
  "screenshots or browser artifacts",
  "real provider exports",
  "private compatible leadership system code",
  "SSH keys",
  "package-registry credentials"
];

const allowedTopLevelEntries = new Set([
  ".env.example",
  ".git",
  ".github",
  ".gitignore",
  "CHANGELOG.md",
  "CODE_OF_CONDUCT.md",
  "CONTRIBUTING.md",
  "LICENSE",
  "README.md",
  "SECURITY.md",
  "dist",
  "docker-compose.postgres-test.yml",
  "docs",
  "examples",
  "fixtures",
  "migrations",
  "node_modules",
  "package-lock.json",
  "package.json",
  "scripts",
  "src",
  "tsconfig.json"
]);

const excludedTopLevelEntries = new Set([".git", "dist", "node_modules"]);

const manifest = readRequiredFile(manifestPath);
const gitignore = readRequiredFile(gitignorePath);
const publicChecklist = readRequiredFile(publicChecklistPath);

requireManifestText("document does not initialize git");
requireManifestText("create a repository");
requireManifestText("stage files");
requireManifestText("commit");
requireManifestText("Clean public history remains incomplete");
requireManifestText("no-`.git` command");

for (const entry of requiredIncludeEntries) {
  requireManifestText(`- \`${entry}\``);
}

for (const entry of requiredExcludeEntries) {
  requireManifestText(entry);
}

requireGitignoreText("node_modules/");
requireGitignoreText("dist/");
requireGitignoreText(".env");
requireGitignoreText(".env.*");
requireGitignoreText("!.env.example");
requireGitignoreText("*.sqlite");
requireGitignoreText("*.sqlite3");
requireGitignoreText("*.db");
requireGitignoreText("coverage/");

if (process.env.SCHEDULEOS_REQUIRE_NO_GIT === "true" && existsSync(path.join(root, ".git"))) {
  failures.push("ScheduleOS must not contain a .git directory before intentional public-history preparation.");
}

for (const entry of readdirSync(root, { withFileTypes: true })) {
  if (!allowedTopLevelEntries.has(entry.name)) {
    failures.push(`top-level entry is not represented in staging manifest review: ${entry.name}`);
  }
}

for (const entry of excludedTopLevelEntries) {
  if (!manifest.includes(`- \`${entry}/\``)) {
    failures.push(`excluded top-level runtime/generated path missing from manifest: ${entry}/`);
  }
}

if (!publicChecklist.includes("- [ ] Clean public history prepared.")) {
  failures.push("Public release checklist must keep clean public history unchecked.");
}

if (failures.length > 0) {
  console.error("First-commit staging manifest check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("First-commit staging manifest check passed.");

function readRequiredFile(filePath) {
  if (!existsSync(filePath)) {
    failures.push(`${path.relative(root, filePath)} is missing.`);
    return "";
  }
  return readFileSync(filePath, "utf8");
}

function requireManifestText(text) {
  if (!manifest.includes(text)) {
    failures.push(`first-commit-staging-manifest.md must include: ${text}`);
  }
}

function requireGitignoreText(text) {
  if (!gitignore.includes(text)) {
    failures.push(`.gitignore must include: ${text}`);
  }
}
