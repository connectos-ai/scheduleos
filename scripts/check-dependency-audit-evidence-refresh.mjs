#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const files = {
  packageJson: "package.json",
  packageLock: "package-lock.json",
  runtimeInventory: "docs/security/final-dependency-runtime-inventory.md",
  approvalChecklist: "docs/security/final-dependency-audit-approval-checklist.md",
  publicChecklist: "docs/public-release-checklist.md",
  securityChecklist: "docs/security/final-security-audit-approval-checklist.md",
  licensingChecklist: "docs/security/final-licensing-audit-approval-checklist.md",
  finalReleaseChecklist: "docs/release/final-release-gate-approval-checklist.md",
  workflow: ".github/workflows/ci.yml",
  audit: "docs/release-audit/DEPENDENCY_AUDIT_EVIDENCE_REFRESH_GUARD_20260728.md"
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, relativePath]) => [
    key,
    readRequired(relativePath)
  ])
);

const packageJson = parseJson(text.packageJson, "package.json");
const packageLock = parseJson(text.packageLock, "package-lock.json");

if (process.env.SCHEDULEOS_REQUIRE_NO_GIT === "true" && existsSync(path.join(root, ".git"))) {
  failures.push(".git directory exists before final dependency audit approval.");
}

for (const forbiddenPath of [
  ".npmrc",
  "npmrc",
  ".yarnrc",
  ".yarnrc.yml",
  ".pnpmfile.cjs",
  "patches"
]) {
  if (existsSync(path.join(root, forbiddenPath))) {
    failures.push(`${forbiddenPath} exists before dependency registry/patch review approval.`);
  }
}

if (packageJson.name !== "scheduleos") failures.push("package.json name must remain scheduleos.");
if (packageJson.version !== "0.0.0") failures.push("package.json version must remain 0.0.0 before release approval.");
if (packageJson.private !== true) failures.push("package.json must remain private true before public package approval.");
if (packageJson.license !== "Apache-2.0") failures.push("package.json license must remain Apache-2.0.");

for (const forbiddenField of [
  "overrides",
  "resolutions",
  "pnpm",
  "bundledDependencies",
  "bundleDependencies",
  "publishConfig"
]) {
  if (Object.prototype.hasOwnProperty.call(packageJson, forbiddenField)) {
    failures.push(`package.json must not define ${forbiddenField} before dependency audit review.`);
  }
}

const expectedProdDependencies = { pg: "^8.22.0" };
const expectedDevDependencies = {
  "@types/node": "^20.14.10",
  "@types/pg": "^8.20.0",
  typescript: "^5.5.4"
};

assertExactObject(
  packageJson.dependencies ?? {},
  expectedProdDependencies,
  "package.json production dependencies"
);
assertExactObject(
  packageJson.devDependencies ?? {},
  expectedDevDependencies,
  "package.json development dependencies"
);

if (packageLock.name !== "scheduleos") failures.push("package-lock.json name must remain scheduleos.");
if (packageLock.version !== "0.0.0") failures.push("package-lock.json version must remain 0.0.0.");
if (packageLock.lockfileVersion !== 3) failures.push("package-lock.json lockfileVersion must remain 3.");

const lockRoot = packageLock.packages?.[""] ?? {};
assertExactObject(
  lockRoot.dependencies ?? {},
  expectedProdDependencies,
  "package-lock root production dependencies"
);
assertExactObject(
  lockRoot.devDependencies ?? {},
  expectedDevDependencies,
  "package-lock root development dependencies"
);

const productionPackages = Object.entries(packageLock.packages ?? {})
  .filter(([packagePath, metadata]) => packagePath && !metadata.dev)
  .map(([packagePath, metadata]) => ({
    path: packagePath,
    name: packagePath.replace(/^node_modules\//u, ""),
    version: metadata.version,
    license: metadata.license,
    resolved: metadata.resolved,
    integrity: metadata.integrity,
    optional: Boolean(metadata.optional)
  }))
  .sort((left, right) => left.name.localeCompare(right.name));

const expectedProductionPackages = new Map([
  ["pg", { version: "8.22.0", license: "MIT", optional: false }],
  ["pg-cloudflare", { version: "1.4.0", license: "MIT", optional: true }],
  ["pg-connection-string", { version: "2.14.0", license: "MIT", optional: false }],
  ["pg-int8", { version: "1.0.1", license: "ISC", optional: false }],
  ["pg-pool", { version: "3.14.0", license: "MIT", optional: false }],
  ["pg-protocol", { version: "1.15.0", license: "MIT", optional: false }],
  ["pg-types", { version: "2.2.0", license: "MIT", optional: false }],
  ["pgpass", { version: "1.0.5", license: "MIT", optional: false }],
  ["postgres-array", { version: "2.0.0", license: "MIT", optional: false }],
  ["postgres-bytea", { version: "1.0.1", license: "MIT", optional: false }],
  ["postgres-date", { version: "1.0.7", license: "MIT", optional: false }],
  ["postgres-interval", { version: "1.2.0", license: "MIT", optional: false }],
  ["split2", { version: "4.2.0", license: "ISC", optional: false }],
  ["xtend", { version: "4.0.2", license: "MIT", optional: false }]
]);

if (productionPackages.length !== expectedProductionPackages.size) {
  failures.push(
    `production lockfile package count changed: expected ${expectedProductionPackages.size}, found ${productionPackages.length}.`
  );
}

for (const packageInfo of productionPackages) {
  const expected = expectedProductionPackages.get(packageInfo.name);
  if (!expected) {
    failures.push(`unexpected production lockfile package: ${packageInfo.name}`);
    continue;
  }
  if (packageInfo.version !== expected.version) {
    failures.push(`${packageInfo.name} version must remain ${expected.version}.`);
  }
  if (packageInfo.license !== expected.license) {
    failures.push(`${packageInfo.name} license must remain ${expected.license}.`);
  }
  if (packageInfo.optional !== expected.optional) {
    failures.push(`${packageInfo.name} optional flag must remain ${expected.optional}.`);
  }
  if (!String(packageInfo.resolved ?? "").startsWith("https://registry.npmjs.org/")) {
    failures.push(`${packageInfo.name} must resolve from public npm registry.`);
  }
  if (!String(packageInfo.integrity ?? "").startsWith("sha512-")) {
    failures.push(`${packageInfo.name} must keep sha512 lockfile integrity metadata.`);
  }
}

for (const expected of [
  "Current result: `FOUNDATION ONLY`.",
  "does not mark dependency audit final pass `PASS`",
  "Development dependencies must not be treated as production runtime dependencies",
  "No local `.npmrc` file was found",
  "package-lock.json` package resolutions point to the public npm registry",
  "Release Boundary"
]) {
  requireText(text.runtimeInventory, expected, `runtime inventory must preserve dependency boundary: ${expected}`);
}

for (const packageName of expectedProductionPackages.keys()) {
  requireText(
    text.runtimeInventory,
    `| \`${packageName}\` |`,
    `runtime inventory must list production package ${packageName}.`
  );
}

for (const expected of [
  "Current result: `FAIL`.",
  "Dependency audit final pass",
  "Registry secret absence proof",
  "Remote CI proof",
  "Second operator approves",
  "This packet does not install, update, remove, override, or publish dependencies"
]) {
  requireText(text.approvalChecklist, expected, `dependency approval checklist must preserve non-approval evidence: ${expected}`);
}

for (const expected of [
  "- [ ] Dependency audit final pass.",
  "- [x] Final dependency runtime inventory foundation",
  "- [x] Final dependency audit approval guard foundation",
  "- [x] Dependency audit evidence refresh guard foundation"
]) {
  requireText(text.publicChecklist, expected, `public checklist must preserve dependency audit boundary: ${expected}`);
}

for (const expected of [
  "npm audit --omit=dev --audit-level=high",
  "npm ls --omit=dev --all"
]) {
  requireText(text.workflow, expected, `CI workflow must preserve dependency evidence command: ${expected}`);
  requireText(text.approvalChecklist, expected, `dependency approval checklist must preserve dependency evidence command: ${expected}`);
}

requireText(
  text.securityChecklist,
  "npm audit --omit=dev --audit-level=high",
  "security checklist must preserve production dependency audit command."
);

requireText(
  text.licensingChecklist,
  "Current package-lock dependency license metadata is limited to Apache-2.0, MIT, and ISC",
  "licensing checklist must preserve dependency license boundary."
);

requireText(
  text.finalReleaseChecklist,
  "Final dependency audit `PASS` proof",
  "final release checklist must require dependency audit PASS proof."
);

requireText(
  text.audit,
  "This is not final dependency audit approval.",
  "dependency audit evidence refresh audit must preserve non-approval caveat."
);

scanForRegistrySecrets(root);

if (failures.length > 0) {
  console.error("Dependency audit evidence refresh guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Dependency audit evidence refresh guard passed ${productionPackages.length} production package(s).`);

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

function requireText(content, expected, message) {
  if (!content.includes(expected)) {
    failures.push(message);
  }
}

function assertExactObject(actual, expected, label) {
  const actualKeys = Object.keys(actual).sort();
  const expectedKeys = Object.keys(expected).sort();
  if (actualKeys.join("\n") !== expectedKeys.join("\n")) {
    failures.push(`${label} changed: expected ${expectedKeys.join(", ")}, found ${actualKeys.join(", ")}.`);
    return;
  }
  for (const key of expectedKeys) {
    if (actual[key] !== expected[key]) {
      failures.push(`${label} ${key} must remain ${expected[key]}.`);
    }
  }
}

function scanForRegistrySecrets(directory) {
  const ignoredDirectories = new Set(["node_modules", "dist"]);
  const secretPattern = /\/\/registry\.npmjs\.org\/:_authToken|npm_[A-Za-z0-9]{20,}|NPM_TOKEN\s*=/u;

  for (const entry of readdirSync(directory)) {
    const absolutePath = path.join(directory, entry);
    const relativePath = path.relative(root, absolutePath);
    const stats = statSync(absolutePath);
    if (stats.isDirectory()) {
      if (!ignoredDirectories.has(entry)) scanForRegistrySecrets(absolutePath);
      continue;
    }
    if (stats.size > 1024 * 1024) continue;
    const content = readFileSync(absolutePath, "utf8");
    if (secretPattern.test(content)) {
      failures.push(`potential npm registry secret found in ${relativePath}.`);
    }
  }
}
