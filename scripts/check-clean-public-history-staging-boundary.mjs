#!/usr/bin/env node
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync
} from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const files = {
  manifest: "docs/release/first-commit-staging-manifest.md",
  readiness: "docs/release/repository-readiness.md",
  approvalChecklist: "docs/release/clean-public-history-approval-checklist.md",
  publicChecklist: "docs/public-release-checklist.md",
  gitignore: ".gitignore",
  packageJson: "package.json",
  releaseSafety: "scripts/check-release-safety.mjs",
  manifestGuard: "scripts/check-first-commit-staging-manifest.mjs",
  approvalGuard: "scripts/check-clean-public-history-approval.mjs",
  audit: "docs/release-audit/CLEAN_PUBLIC_HISTORY_STAGING_BOUNDARY_GUARD_20260728.md"
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, relativePath]) => [
    key,
    readRequired(relativePath)
  ])
);

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

const excludedButToleratedTopLevelEntries = new Set([".git", "dist", "node_modules"]);

if (process.env.SCHEDULEOS_REQUIRE_NO_GIT === "true" && existsSync(path.join(root, ".git"))) {
  failures.push(".git directory exists before clean public history staging approval.");
}

for (const entry of readdirSync(root)) {
  if (!allowedTopLevelEntries.has(entry)) {
    failures.push(`Unexpected top-level entry before public first-commit staging review: ${entry}`);
  }
}

for (const entry of excludedButToleratedTopLevelEntries) {
  if (!text.manifest.includes(`${entry}/`)) {
    failures.push(`first-commit staging manifest must explicitly exclude ${entry}/.`);
  }
}

for (const expected of [
  "document does not initialize git",
  "public repository mutation",
  "first public commit is created without private history",
  "Clean public history remains incomplete",
  ".env.example",
  ".github/",
  "package-lock.json",
  "scripts/",
  "src/",
  ".git/",
  ".env.*",
  "node_modules/",
  "dist/",
  "coverage/",
  "local SQLite databases",
  "screenshots or browser artifacts",
  "real provider exports",
  "private compatible leadership system code",
  "SSH keys",
  "package-registry credentials"
]) {
  requireText(text.manifest, expected, `first-commit staging manifest must preserve boundary text: ${expected}`);
}

for (const expected of [
  "Public repository creation remains blocked",
  "local ScheduleOS folder intentionally has no `.git` directory",
  "Do not initialize git",
  "Review `docs/release/first-commit-staging-manifest.md`",
  "clean initial history",
  "verified release candidate"
]) {
  requireText(text.readiness, expected, `repository readiness must preserve clean-history staging rule: ${expected}`);
}

for (const expected of [
  "Current result: `FAIL`.",
  "Clean public history is not prepared",
  "No git initialization, public repository creation, remote creation, push, tag, package publication, hosted deployment, or release announcement may rely on clean public history",
  "Second operator approves clean public history evidence packet before git initialization and first public commit."
]) {
  requireText(text.approvalChecklist, expected, `clean public history approval checklist must preserve non-approval rule: ${expected}`);
}

for (const expected of [
  "- [ ] Clean public history prepared.",
  "- [x] First-commit staging manifest guard foundation",
  "- [x] Clean public history approval guard foundation",
  "- [x] Clean public history staging boundary guard foundation"
]) {
  requireText(text.publicChecklist, expected, `public release checklist must preserve staging boundary: ${expected}`);
}

for (const expected of [
  "node_modules/",
  "dist/",
  ".env",
  ".env.*",
  "!.env.example",
  "*.log",
  "*.sqlite",
  "*.sqlite3",
  "*.db",
  "coverage/"
]) {
  requireText(text.gitignore, expected, `.gitignore must preserve public staging exclusion: ${expected}`);
}

for (const expected of [
  "release:first-commit-manifest:check",
  "clean-history:approval:check",
  "clean-history:staging-boundary:check",
  "repository:clean-history-readiness-packet",
  "release:generated-artifact-review-packet"
]) {
  requireText(text.packageJson, expected, `package.json must keep clean-history staging wiring: ${expected}`);
}

for (const expected of [
  "local absolute path",
  ".env.example",
  "email",
  "personal email address"
]) {
  requireText(text.releaseSafety, expected, `release safety scan must keep public-history sanitizer coverage: ${expected}`);
}

for (const expected of [
  "allowedTopLevelEntries",
  "excludedTopLevelEntries",
  "existsSync(path.join(root, \".git\"))",
  "Clean public history prepared"
]) {
  requireText(text.manifestGuard, expected, `first-commit manifest guard must keep staging invariant: ${expected}`);
}

for (const expected of [
  "repository:clean-history-readiness-packet",
  "Clean public history approval guard failed"
]) {
  requireText(text.approvalGuard, expected, `clean-history approval guard must preserve non-approval invariant: ${expected}`);
}

requireText(
  text.audit,
  "This is not clean public history approval.",
  "clean public history staging boundary audit must preserve non-approval caveat."
);

scanForForbiddenLocalArtifacts(root);
scanReleaseDocsForLocalMachineMarkers();

if (failures.length > 0) {
  console.error("Clean public history staging boundary guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Clean public history staging boundary guard passed.");

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

function scanForForbiddenLocalArtifacts(directory) {
  for (const entry of readdirSync(directory)) {
    const absolutePath = path.join(directory, entry);
    const relativePath = path.relative(root, absolutePath);

    if (relativePath === ".env.example") continue;
    if (entry === "node_modules" || entry === "dist" || entry === ".git") continue;

    const stats = statSync(absolutePath);
    if (stats.isDirectory()) {
      scanForForbiddenLocalArtifacts(absolutePath);
      continue;
    }

    if (isForbiddenLocalArtifact(entry)) {
      failures.push(`Forbidden local/private artifact present before public staging: ${relativePath}`);
    }
  }
}

function isForbiddenLocalArtifact(fileName) {
  if (fileName === ".env") return true;
  if (fileName.startsWith(".env.") && fileName !== ".env.example") return true;
  return /\.(sqlite3?|db|log|pem|key|p12|pfx|crt)$/iu.test(fileName);
}

function scanReleaseDocsForLocalMachineMarkers() {
  const releaseDocRoots = [
    path.join(root, "docs", "release"),
    path.join(root, "docs", "release-audit")
  ];
  const markerPattern = /\/Users\/|\/home\/ubuntu\/|codex_imac|ubuntu-imacpro|100\.104\.111\.51/u;

  for (const directory of releaseDocRoots) {
    scanMarkdown(directory, (relativePath, content) => {
      if (markerPattern.test(content)) {
        failures.push(`Release documentation contains local machine marker: ${relativePath}`);
      }
    });
  }
}

function scanMarkdown(directory, visit) {
  for (const entry of readdirSync(directory)) {
    const absolutePath = path.join(directory, entry);
    const stats = statSync(absolutePath);
    if (stats.isDirectory()) {
      scanMarkdown(absolutePath, visit);
      continue;
    }
    if (entry.endsWith(".md")) {
      visit(path.relative(root, absolutePath), readFileSync(absolutePath, "utf8"));
    }
  }
}
