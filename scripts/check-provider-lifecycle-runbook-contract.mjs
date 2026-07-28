#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const contractPath = path.join(
  root,
  "docs",
  "operations",
  "provider-lifecycle-runbook-contract.md"
);
const providerRunbookDirectory = path.join(root, "docs", "operations", "providers");

const requiredHeadings = [
  "status",
  "required provider runbook sections",
  "provider setup",
  "permissions and scopes",
  "managed-secret custody",
  "rotation drill",
  "emergency revocation drill",
  "write-back safety",
  "sync checkpoint recovery",
  "hosted operator alerts",
  "incident response",
  "rollback",
  "privacy minimization",
  "support escalation",
  "sanitized evidence examples",
  "release boundary"
];

const requiredProviderRunbookHeadings = requiredHeadings.filter(
  (heading) => heading !== "required provider runbook sections"
);

const forbiddenPatterns = [
  {
    label: "email-shaped string",
    pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu
  },
  {
    label: "raw token example",
    pattern: /\b(?:access|refresh|id)_token\s*[:=]/iu
  },
  {
    label: "raw webhook secret example",
    pattern: /\bwebhook_secret\s*[:=]/iu
  },
  {
    label: "raw URL example",
    pattern: /https?:\/\//iu
  }
];

const findings = [
  ...validateMarkdownFile(contractPath, requiredHeadings, "contract")
];
const providerRunbooks = listProviderRunbooks(providerRunbookDirectory);
if (providerRunbooks.length === 0) {
  findings.push("provider runbooks: no provider lifecycle runbooks found");
}
for (const providerRunbookPath of providerRunbooks) {
  findings.push(
    ...validateMarkdownFile(
      providerRunbookPath,
      requiredProviderRunbookHeadings,
      "provider runbook"
    )
  );
}

if (findings.length > 0) {
  console.error("Provider lifecycle runbook contract check failed.");
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log(
  `Provider lifecycle runbook contract check passed ${requiredHeadings.length} contract headings and ${providerRunbooks.length} provider runbook(s).`
);

function listProviderRunbooks(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.join(directory, entry.name))
    .sort();
}

function validateMarkdownFile(filePath, headingsRequired, label) {
  const text = readFileSync(filePath, "utf8");
  const relativePath = path.relative(root, filePath);
  const headings = new Set(
    text
      .split(/\r?\n/u)
      .filter((line) => line.startsWith("## "))
      .map((line) => line.replace(/^##\s+/u, "").trim().toLowerCase())
  );
  const missing = headingsRequired
    .filter((heading) => !headings.has(heading))
    .map((heading) => `${label} ${relativePath}: missing heading "${heading}"`);
  const forbidden = [];
  text.split(/\r?\n/u).forEach((line, index) => {
    for (const { label: forbiddenLabel, pattern } of forbiddenPatterns) {
      if (pattern.test(line)) {
        forbidden.push(
          `${label} ${relativePath}:${index + 1}: ${forbiddenLabel}`
        );
      }
    }
  });
  return [...missing, ...forbidden];
}
