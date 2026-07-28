#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const publicChecklistPath = path.join(root, "docs", "public-release-checklist.md");
const approvalChecklistPath = path.join(
  root,
  "docs",
  "security",
  "production-provider-lifecycle-approval-checklist.md"
);
const runbookContractPath = path.join(
  root,
  "docs",
  "operations",
  "provider-lifecycle-runbook-contract.md"
);
const demoRunbookPath = path.join(
  root,
  "docs",
  "operations",
  "providers",
  "demo-calendar-provider-runbook.md"
);
const adapterContractSourcePath = path.join(
  root,
  "src",
  "provider-adapter-contract.ts"
);
const adapterContractTestPath = path.join(
  root,
  "src",
  "provider-adapter-contract.test.ts"
);
const runbookContractCheckPath = path.join(
  root,
  "scripts",
  "check-provider-lifecycle-runbook-contract.mjs"
);
const runbookAuditPath = path.join(
  root,
  "docs",
  "release-audit",
  "PROVIDER_LIFECYCLE_RUNBOOK_CONTRACT_20260727.md"
);
const guardAuditPath = path.join(
  root,
  "docs",
  "release-audit",
  "PRODUCTION_PROVIDER_LIFECYCLE_APPROVAL_GUARD_20260727.md"
);

const publicChecklist = readRequired(publicChecklistPath);
const approvalChecklist = readRequired(approvalChecklistPath);
const runbookContract = readRequired(runbookContractPath);
const demoRunbook = readRequired(demoRunbookPath);
const adapterContractSource = readRequired(adapterContractSourcePath);
const adapterContractTest = readRequired(adapterContractTestPath);
const runbookContractCheck = readRequired(runbookContractCheckPath);
const runbookAudit = readRequired(runbookAuditPath);
const guardAudit = readRequired(guardAuditPath);

requireText(
  approvalChecklist,
  "Current result: `FAIL`.",
  "production provider lifecycle approval checklist must remain FAIL until release-candidate evidence is reviewed."
);
requireText(
  publicChecklist,
  "- [ ] Production-grade webhook/provider lifecycle enforcement, provider-specific adapters, hosted operator alerts, and provider-specific rotation/revocation/write-back runbooks.",
  "public release checklist must keep production provider lifecycle blocker unchecked."
);
requireText(
  publicChecklist,
  "Production provider lifecycle approval guard foundation verifies",
  "public release checklist must document the provider lifecycle approval guard foundation."
);

for (const expected of [
  "No public repository",
  "hosted deployment",
  "package publication",
  "release announcement",
  "production provider lifecycle support"
]) {
  requireText(
    approvalChecklist,
    expected,
    `production provider lifecycle checklist must preserve release-use prohibition: ${expected}`
  );
}

for (const expected of [
  "Provider-specific lifecycle runbook contract exists",
  "Provider-specific webhook signature",
  "replay retention",
  "idempotency strategy",
  "quota",
  "backoff",
  "Provider-specific write-back safety",
  "Provider revocation reviewed",
  "Hosted operator alerts reviewed",
  "provider-specific adapters, lifecycle runbooks",
  "Remote CI proof exists",
  "second operator"
]) {
  requireText(
    approvalChecklist,
    expected,
    `production provider lifecycle checklist must keep required PASS evidence: ${expected}`
  );
}

for (const expected of [
  "production-provider-lifecycle-approval-checklist.md",
  "does not approve any provider",
  "Managed-Secret Custody",
  "Rotation Drill",
  "Emergency Revocation Drill",
  "Write-Back Safety",
  "Hosted Operator Alerts",
  "Release Boundary"
]) {
  requireText(
    runbookContract,
    expected,
    `provider lifecycle runbook contract must preserve boundary/section: ${expected}`
  );
}

for (const expected of [
  "Current result: `FAIL`.",
  "local/review-only evidence",
  "does not approve production calendar-provider support",
  "Managed-Secret Custody",
  "Emergency Revocation Drill",
  "Write-Back Safety",
  "Hosted Operator Alerts",
  "Privacy Minimization"
]) {
  requireText(
    demoRunbook,
    expected,
    `demo provider lifecycle runbook must preserve review-only evidence: ${expected}`
  );
}

for (const expected of [
  "validateProviderAdapterContract",
  "REQUIRED_ALERT_CLASSES",
  "TOKEN_FAILURE",
  "WEBHOOK_SIGNATURE_FAILURE",
  "PROVIDER_QUOTA_EXHAUSTION",
  "MANAGED_SECRET_RESOLVER_FAILURE",
  "excludesRawProviderPayloads",
  "excludesPrivateTitles"
]) {
  requireText(
    adapterContractSource,
    expected,
    `provider adapter contract source must keep lifecycle protection: ${expected}`
  );
}

requireText(
  adapterContractTest,
  "validateProviderAdapterContract",
  "provider adapter contract tests must exercise validateProviderAdapterContract."
);
requireText(
  runbookContractCheck,
  "forbiddenPatterns",
  "provider lifecycle runbook contract check must keep forbidden evidence patterns."
);
requireText(
  runbookAudit,
  "local/review-only provider-runbook evidence",
  "provider lifecycle runbook audit must preserve non-approval caveat."
);
requireText(
  guardAudit,
  "This is not production provider lifecycle approval.",
  "production provider lifecycle approval guard audit must preserve non-approval caveat."
);

if (failures.length > 0) {
  console.error("Production provider lifecycle approval guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Production provider lifecycle approval guard passed.");

function readRequired(filePath) {
  if (!existsSync(filePath)) {
    failures.push(`${path.relative(root, filePath)} is missing.`);
    return "";
  }

  return readFileSync(filePath, "utf8");
}

function requireText(text, expected, message) {
  if (!text.includes(expected)) {
    failures.push(message);
  }
}
