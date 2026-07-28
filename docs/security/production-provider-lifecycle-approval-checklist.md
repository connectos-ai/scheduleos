# Production Provider Lifecycle Approval Checklist

## Status

Current result: `FAIL`.

ScheduleOS has local/self-host provider policy foundations, webhook signature/replay protections, provider revocation foundations, sync checkpoint foundations, write-back safety foundations, and review-only provider lifecycle readiness packets. Production-grade webhook/provider lifecycle enforcement, provider-specific adapters, hosted operator alerts, and provider-specific rotation/revocation/write-back runbooks are not approved for public release until the evidence below is attached, reviewed, and accepted.

No public repository, hosted deployment, tag, package publication, or release announcement may claim production provider lifecycle support until this checklist changes to `PASS`.

## Verified Local Foundations

Current local evidence covers:

- Provider-neutral adapter contract validator in `src/provider-adapter-contract.ts` with tests covering private leadership-only API rejection, raw secret rejection, write-back safety, revocation safety, hosted-alert classes, and privacy minimization.
- Generic webhook HMAC signature verification using timestamp-bound raw body signing.
- Current/previous webhook secret rotation list support for self-hosted inputs.
- Source-specific replay windows, reused event ID rejection, and replay conflict detection.
- Provider-specific import policy and CSV header mapping foundations.
- ICS import/export, sync checkpoint, provider revocation, local write-back protection, and local write-back conflict preview foundations.
- Mock ConnectOS and OwnerOps adapter verification foundations.
- Managed-secret storage contract and webhook secret lifecycle runbook foundations.
- Public-event delivery target secret-ref scope checks and sanitized resolver audit evidence.
- `providers:lifecycle-readiness-packet` review-only evidence labels for managed-secret custody, rotation drill, revocation drill, write-back safety, hosted alert routing, provider runbook, remote CI, rollback, and second operator.

- Provider-specific lifecycle runbook contract exists at `docs/operations/provider-lifecycle-runbook-contract.md` and is checked by `npm run providers:lifecycle-runbook-contract:check` during `npm run check`.
- Demo calendar provider lifecycle runbook template exists at `docs/operations/providers/demo-calendar-provider-runbook.md` and is validated by the provider lifecycle runbook checker as local/review-only evidence.

These foundations do not approve production provider lifecycle enforcement.

## Required Evidence Before PASS

Attach current evidence for every provider or provider class in release scope:

- Provider-specific adapter contract reviewed for auth, token custody, capability discovery, import, export, sync, write-back, revocation, retries, rate limits, and error mapping.
- Provider OAuth or secret lifecycle reviewed for least privilege, encrypted custody, rotation, overlap windows, emergency revocation, audit logging, and operator access controls.
- Provider-specific webhook signature, replay, event ID, timestamp, and retry behavior reviewed.
- Provider-specific replay retention and idempotency strategy reviewed for duplicates, out-of-order events, and conflicting event IDs.
- Provider-specific quota and backoff policy reviewed for imports, exports, write-back, webhook delivery, and polling.
- Provider-specific write-back safety reviewed for dry-run previews, conflict previews, owner approval, locked blocks, duplicate prevention, and rollback.
- Provider revocation reviewed for disconnect state, sync cursor clearing, token invalidation, webhook disablement, and audit events.
- Hosted operator alerts reviewed for token failures, webhook signature failures, replay attempts, provider quota exhaustion, write-back conflicts, revocation failures, and sync drift.
- Provider-specific runbook exists for setup, permissions, rotation, revocation, incident response, rollback, privacy minimization, and support escalation.
- Privacy review confirms provider lifecycle evidence does not expose raw tokens, raw webhook secrets, raw provider identifiers, real account IDs, private calendar titles, private task titles, attendees, locations, descriptions, raw row payloads, or raw provider responses.
- Remote CI proof exists for adapter contract tests, provider lifecycle readiness packet coverage, webhook policy tests, provider revocation tests, write-back safety tests, and release safety.
- Security, privacy, and licensing audits are still `PASS` after provider evidence is attached.
- Second operator approves the final provider lifecycle evidence packet.

## Required Commands

Run these before changing this checklist to `PASS`:

```bash
npm run check
npm audit --omit=dev --audit-level=high
find . -maxdepth 2 -name .git -type d -print
```

The no-`.git` check must return no output until the intentional clean public repository history is prepared.

## Review-Only Packet

Use this command to prepare evidence labels only:

```bash
npm run providers:lifecycle-readiness-packet -- --environment production-demo --provider provider-demo --tenant-id tenant_demo --workspace-id workspace_demo --user-id user_jordan --as-of 2026-07-23T12:00:00.000Z --managed-secret-custody managed-secret-custody-demo --rotation-drill provider-rotation-drill-demo --revocation-drill provider-revocation-drill-demo --write-back-safety provider-write-back-safety-demo --hosted-alert-routing provider-hosted-alert-routing-demo --provider-runbook provider-runbook-demo --remote-ci remote-ci-provider-lifecycle-demo --rollback-plan provider-rollback-plan-demo --second-operator second-operator-provider-lifecycle-demo --json
```

This packet does not enforce production provider lifecycle, rotate or revoke credentials, configure alerts, mutate provider connections, write provider data, mark audits `PASS`, create remotes, publish packages, or announce ScheduleOS.

## Current Remaining Risk

High. Local provider foundations reduce integration risk, but production provider lifecycle remains unproven until provider-specific adapters, lifecycle runbooks, token custody, rotation/revocation, write-back safety, hosted alerts, remote CI, final audits, and second-operator review are complete.

## Release Rule

Do not mark "Production-grade webhook/provider lifecycle enforcement, provider-specific adapters, hosted operator alerts, provider-specific rotation/revocation/write-back runbooks" complete until this checklist changes from `FAIL` to `PASS` with current release-candidate evidence.
