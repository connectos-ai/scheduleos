#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const documentPath = path.join(
  root,
  "docs",
  "security",
  "final-dependency-runtime-inventory.md"
);
const packageJsonPath = path.join(root, "package.json");
const packageLockPath = path.join(root, "package-lock.json");
const failures = [];

const readRequiredFile = (filePath) => {
  if (!existsSync(filePath)) {
    failures.push(`${path.relative(root, filePath)} is missing.`);
    return "";
  }
  return readFileSync(filePath, "utf8");
};

const documentText = readRequiredFile(documentPath);
const packageJson = JSON.parse(readRequiredFile(packageJsonPath) || "{}");
const packageLock = JSON.parse(readRequiredFile(packageLockPath) || "{}");

requireText("Current result: `FOUNDATION ONLY`.");
requireText("does not mark dependency audit final pass `PASS`");
requireText("Development dependencies must not be treated as production runtime dependencies");
requireText("No local `.npmrc` file was found");
requireText("Release Boundary");

const rootPackage = packageLock.packages?.[""] ?? {};
const manifestDependencies = packageJson.dependencies ?? {};
const lockDependencies = rootPackage.dependencies ?? {};
const manifestDevDependencies = packageJson.devDependencies ?? {};

for (const [name, range] of Object.entries(manifestDependencies)) {
  requireText(`| \`${name}\` | \`${range}\``);
  if (lockDependencies[name] !== range) {
    failures.push(
      `package-lock root dependency ${name} must match package.json range ${range}.`
    );
  }
}

for (const [name, range] of Object.entries(manifestDevDependencies)) {
  requireText(`| \`${name}\` | \`${range}\``);
}

const productionPackages = Object.entries(packageLock.packages ?? {})
  .filter(([packagePath, metadata]) => packagePath && !metadata.dev)
  .map(([packagePath, metadata]) => ({
    name: metadata.name ?? packagePath.replace(/^node_modules\//u, ""),
    version: metadata.version,
    license: metadata.license,
    requiredness: metadata.optional ? "optional" : "required"
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

for (const dependency of productionPackages) {
  requireText(
    `| \`${dependency.name}\` | \`${dependency.version}\` | \`${dependency.license}\` | ${dependency.requiredness} |`
  );
}

if (/^\s*"overrides"\s*:/mu.test(JSON.stringify(packageJson))) {
  requireText("`overrides`");
}

if (findNpmRc(root)) {
  failures.push(
    "ScheduleOS workspace now contains an .npmrc file; update final-dependency-runtime-inventory.md registry review."
  );
}

if (failures.length > 0) {
  console.error("Dependency runtime inventory check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Dependency runtime inventory check passed for ${productionPackages.length} production package(s).`
);

function requireText(text) {
  if (!documentText.includes(text)) {
    failures.push(
      `final-dependency-runtime-inventory.md must include: ${text}`
    );
  }
}

function findNpmRc(directory) {
  const entries = [];
  try {
    entries.push(...readFileSync(path.join(directory, ".npmrc"), "utf8"));
    return true;
  } catch {
    return false;
  }
}
