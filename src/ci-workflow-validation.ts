export type WorkflowValidationResult = {
  ok: boolean;
  findings: string[];
};

const requiredSnippets = [
  { label: "workflow_dispatch trigger", snippet: "workflow_dispatch:" },
  { label: "pull request trigger", snippet: "pull_request:" },
  { label: "main branch push trigger", snippet: "- main" },
  { label: "read-only contents permission", snippet: "contents: read" },
  { label: "concurrency cancellation", snippet: "cancel-in-progress: true" },
  { label: "quality job", snippet: "quality:" },
  { label: "quality job timeout", snippet: "timeout-minutes: 15" },
  { label: "dependency installation", snippet: "npm ci" },
  { label: "release safety gate", snippet: "npm run check" },
  { label: "production dependency audit", snippet: "npm audit --omit=dev --audit-level=high" },
  { label: "production dependency tree evidence", snippet: "npm ls --omit=dev --all" },
  { label: "step summary evidence", snippet: "GITHUB_STEP_SUMMARY" },
  { label: "postgres live job", snippet: "postgres-live:" },
  { label: "postgres service image", snippet: "postgres:16-alpine" },
  { label: "postgres health check", snippet: "pg_isready -U scheduleos -d scheduleos_test" },
  { label: "postgres disposable database URL", snippet: "SCHEDULEOS_TEST_POSTGRES_URL" },
  { label: "postgres live tests", snippet: "npm run test:postgres:live" }
];

const forbiddenPatterns = [
  { label: "pull_request_target trigger", pattern: /\bpull_request_target\s*:/u },
  { label: "write-all permission", pattern: /\bpermissions\s*:\s*write-all\b/u },
  { label: "contents write permission", pattern: /\bcontents\s*:\s*write\b/u },
  { label: "package publication", pattern: /\bnpm\s+publish\b/u },
  { label: "release creation", pattern: /\bgh\s+release\s+create\b/u },
  { label: "tag creation", pattern: /\bgit\s+tag\b/u },
  { label: "git push", pattern: /\bgit\s+push\b/u },
  { label: "docker image publication", pattern: /\bdocker\s+push\b/u },
  { label: "deployment command", pattern: /\b(vercel|netlify|flyctl|railway)\s+deploy\b/u }
];

export function validateScheduleOSCiWorkflow(text: string): WorkflowValidationResult {
  const findings: string[] = [];

  if (!/^name:\s+CI$/mu.test(text)) {
    findings.push("workflow name must be CI");
  }

  for (const requirement of requiredSnippets) {
    if (!text.includes(requirement.snippet)) {
      findings.push(`missing ${requirement.label}`);
    }
  }

  for (const forbidden of forbiddenPatterns) {
    if (forbidden.pattern.test(text)) {
      findings.push(`forbidden ${forbidden.label}`);
    }
  }

  if (!/jobs:\s*\n\s+quality:/u.test(text)) {
    findings.push("quality job must be nested under jobs");
  }

  if (!/jobs:[\s\S]*\n\s+postgres-live:/u.test(text)) {
    findings.push("postgres-live job must be nested under jobs");
  }

  return {
    ok: findings.length === 0,
    findings
  };
}
