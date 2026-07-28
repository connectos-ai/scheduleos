#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const publicChecklistPath = path.join(root, "docs", "public-release-checklist.md");
const approvalChecklistPath = path.join(root, "docs", "security", "production-rate-limit-approval-checklist.md");
const quotaContractPath = path.join(root, "docs", "security", "provider-quota-policy-contract.md");
const abuseContractPath = path.join(root, "docs", "security", "hosted-abuse-analytics-contract.md");
const quotaSourcePath = path.join(root, "src", "provider-quota-policy.ts");
const quotaTestPath = path.join(root, "src", "provider-quota-policy.test.ts");
const abuseSourcePath = path.join(root, "src", "hosted-abuse-analytics-contract.ts");
const abuseTestPath = path.join(root, "src", "hosted-abuse-analytics-contract.test.ts");
const requestAbuseAuditPath = path.join(root, "docs", "release-audit", "REQUEST_ABUSE_SUMMARY_20260727.md");
const quotaAuditPath = path.join(root, "docs", "release-audit", "PROVIDER_QUOTA_POLICY_CONTRACT_20260727.md");
const abuseAuditPath = path.join(root, "docs", "release-audit", "HOSTED_ABUSE_ANALYTICS_CONTRACT_20260727.md");
const guardAuditPath = path.join(root, "docs", "release-audit", "PRODUCTION_RATE_LIMIT_APPROVAL_GUARD_20260727.md");

const publicChecklist = readRequired(publicChecklistPath);
const approvalChecklist = readRequired(approvalChecklistPath);
const quotaContract = readRequired(quotaContractPath);
const abuseContract = readRequired(abuseContractPath);
const quotaSource = readRequired(quotaSourcePath);
const quotaTest = readRequired(quotaTestPath);
const abuseSource = readRequired(abuseSourcePath);
const abuseTest = readRequired(abuseTestPath);
const requestAbuseAudit = readRequired(requestAbuseAuditPath);
const quotaAudit = readRequired(quotaAuditPath);
const abuseAudit = readRequired(abuseAuditPath);
const guardAudit = readRequired(guardAuditPath);

requireText(
  approvalChecklist,
  "Current result: `FAIL`.",
  "production rate-limit approval checklist must remain FAIL until release-candidate evidence is reviewed."
);
requireText(
  publicChecklist,
  "- [ ] Production distributed rate limiting, provider-specific quota enforcement, hosted alert delivery/dashboards beyond local summary thresholds, and abuse analytics.",
  "public release checklist must keep production rate-limit and abuse-monitoring blocker unchecked."
);
requireText(
  publicChecklist,
  "Production rate-limit approval guard foundation verifies",
  "public release checklist must document the production rate-limit approval guard foundation."
);

for (const expected of [
  "No public repository",
  "hosted deployment",
  "package publication",
  "release announcement",
  "production abuse protection"
]) {
  requireText(
    approvalChecklist,
    expected,
    `production rate-limit checklist must preserve release-use prohibition: ${expected}`
  );
}

for (const expected of [
  "Edge, gateway, or reverse-proxy rate-limit policy",
  "Distributed throttle store",
  "Trusted proxy configuration",
  "Provider quota governance",
  "Hosted alert routing",
  "Hosted dashboard",
  "Abuse analytics",
  "Privacy review confirms abuse evidence",
  "Remote CI proof exists",
  "Second operator approves rate-limit abuse-monitoring evidence packet"
]) {
  requireText(
    approvalChecklist,
    expected,
    `production rate-limit checklist must keep required PASS evidence: ${expected}`
  );
}

for (const expected of [
  "Distributed quota store requirement",
  "Tenant/workspace/user/provider/operation quota keys",
  "Retry-after guidance",
  "Separate enforcement lanes",
  "Hosted alert classes",
  "Privacy-minimized quota evidence",
  "Release Boundary"
]) {
  requireText(
    quotaContract,
    expected,
    `provider quota policy contract must preserve requirement: ${expected}`
  );
}

for (const expected of [
  "Hosted-only evidence",
  "Distributed event correlation",
  "Required Signals",
  "Required Operator Evidence",
  "Operator overview dashboard",
  "Alert destination",
  "privacy-minimized"
]) {
  requireText(
    abuseContract,
    expected,
    `hosted abuse analytics contract must preserve requirement: ${expected}`
  );
}

for (const expected of [
  "validateProviderQuotaPolicy",
  "REQUIRED_OPERATIONS",
  "REQUIRED_ALERTS",
  "distributedStoreRequired",
  "hashedQuotaKeys",
  "excludesRawTokens",
  "excludesRawProviderAccountIds"
]) {
  requireText(
    quotaSource,
    expected,
    `provider quota policy source must keep protection: ${expected}`
  );
}

for (const expected of [
  "validateHostedAbuseAnalyticsEvidence",
  "REQUIRED_SIGNALS",
  "REQUIRED_METRICS",
  "REQUIRED_ALERTS",
  "hostedOnly",
  "distributedCorrelationRequired",
  "excludesRawTokens",
  "excludesProviderAccountIds"
]) {
  requireText(
    abuseSource,
    expected,
    `hosted abuse analytics source must keep protection: ${expected}`
  );
}

requireText(
  quotaTest,
  "validateProviderQuotaPolicy",
  "provider quota policy tests must exercise validateProviderQuotaPolicy."
);
requireText(
  abuseTest,
  "validateHostedAbuseAnalyticsEvidence",
  "hosted abuse analytics tests must exercise validateHostedAbuseAnalyticsEvidence."
);

for (const expected of [
  "Local/self-host evidence only",
  "does not approve production distributed rate limiting",
  "hosted abuse analytics"
]) {
  requireText(
    requestAbuseAudit,
    expected,
    `request abuse audit must preserve local-only boundary: ${expected}`
  );
}

requireText(
  quotaAudit,
  "This is not production rate-limit approval.",
  "provider quota policy audit must preserve non-approval caveat."
);
requireText(
  abuseAudit,
  "This is not production rate-limit approval.",
  "hosted abuse analytics audit must preserve non-approval caveat."
);
requireText(
  guardAudit,
  "This is not production rate-limit or abuse-monitoring approval.",
  "production rate-limit approval guard audit must preserve non-approval caveat."
);

if (failures.length > 0) {
  console.error("Production rate-limit approval guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Production rate-limit approval guard passed.");

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
