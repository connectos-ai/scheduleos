#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([".git", "dist", "node_modules"]);
const ignoredFiles = new Set(["package-lock.json"]);
const findings = [];
const scannedFiles = [];

const rules = [
  {
    name: "local absolute path",
    pattern: new RegExp(
      ["/" + "Users/", "Documents/" + "New project", "Documents/" + "Codex", "\\." + "codex"].join("|"),
      "iu"
    )
  },
  {
    name: "AWS access key",
    pattern: /AKIA[0-9A-Z]{16}/u
  },
  {
    name: "Slack token",
    pattern: /xox[baprs]-[A-Za-z0-9-]+/u
  },
  {
    name: "OpenAI-style API key",
    pattern: /sk-[A-Za-z0-9_-]{20,}/u
  },
  {
    name: "private key block",
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/u
  },
  {
    name: "OAuth client secret assignment",
    pattern: /\bclient_secret\s*[:=]\s*["']?[^"'\s]+/iu
  },
  {
    name: "OAuth refresh token assignment",
    pattern: /\brefresh_token\s*[:=]\s*["']?[^"'\s]+/iu
  },
  {
    name: "OAuth access token assignment",
    pattern: /\baccess_token\s*[:=]\s*["']?[^"'\s]+/iu
  },
  {
    name: "personal email address",
    pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu
  }
];

walk(root);

for (const filePath of scannedFiles) {
  const text = readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const rule of rules) {
      if (rule.pattern.test(line) && !isAllowedMatch(filePath, line, rule.name)) {
        findings.push({
          file: path.relative(root, filePath),
          line: index + 1,
          rule: rule.name
        });
      }
    }
  });
}

if (findings.length > 0) {
  console.error("Release safety scan failed:");
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line}: ${finding.rule}`);
  }
  process.exit(1);
}

console.log(`Release safety scan passed for ${scannedFiles.length} files.`);

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) walk(fullPath);
      continue;
    }
    if (!entry.isFile() || ignoredFiles.has(entry.name)) continue;
    if (isTextFile(fullPath)) scannedFiles.push(fullPath);
  }
}

function isTextFile(filePath) {
  const extension = path.extname(filePath);
  if (extension.length === 0) return true;
  return [
    ".css",
    ".example",
    ".gitignore",
    ".js",
    ".json",
    ".md",
    ".mjs",
    ".sql",
    ".ts",
    ".txt",
    ".yml",
    ".yaml"
  ].includes(extension);
}

function isAllowedMatch(filePath, line, ruleName) {
  const relativePath = path.relative(root, filePath);
  if (
    relativePath === ".env.example" &&
    (line.includes("dev_scheduleos_change_me") ||
      line.includes("postgres://scheduleos:scheduleos@localhost"))
  ) {
    return true;
  }
  if (
    relativePath === "docker-compose.postgres-test.yml" &&
    line.includes("POSTGRES_PASSWORD: scheduleos")
  ) {
    return true;
  }
  if (
    relativePath === ".github/workflows/ci.yml" &&
    line.includes("postgres://scheduleos:scheduleos@localhost")
  ) {
    return true;
  }
  if (
    ruleName === "personal email address" &&
    (line.includes("security@example.com") ||
      line.includes("opencode@microsoft.com") ||
      line.includes("secure@microsoft.com"))
  ) {
    return true;
  }
  return false;
}
