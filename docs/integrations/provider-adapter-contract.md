# Provider Adapter Contract

Production provider lifecycle approval is tracked in `docs/security/production-provider-lifecycle-approval-checklist.md`. This document defines the local provider-neutral adapter contract foundation used before any real provider adapter can claim release readiness.

This document does not approve production provider lifecycle enforcement, configure hosted alerts, store provider credentials, connect real accounts, write calendar data, create remotes, publish packages, or change release status.

## Status

Current result: `FAIL`.

ScheduleOS now has a local provider adapter contract validator in `src/provider-adapter-contract.ts` with tests in `src/provider-adapter-contract.test.ts`. It is evidence for adapter review shape only.

## Contract Purpose

Every provider adapter in release scope must prove it can satisfy public ScheduleOS contracts without private private leadership-only APIs and without raw credential or provider-content leakage.

The validator checks:

- Public provider-neutral contract use.
- No private leadership-only API requirement.
- Managed-secret reference custody.
- Documented provider scopes.
- Import/export capability declaration.
- Sync checkpoint handling.
- Revocation handling.
- Rotation and emergency revocation drills.
- Quota, retry, and provider error mapping.
- Hosted alert classes.
- Write-back safety.
- Privacy-minimized evidence.

## Required Adapter Evidence

Provider adapters must satisfy:

- `publicContractOnly: true`.
- `noPrivateLeadershipOnlyApis: true`.
- `auth.usesManagedSecretRefs: true`.
- `auth.storesRawSecrets: false`.
- At least one documented provider scope with name, reason, access type, and optional flag.
- At least import or export capability.
- Sync checkpoint capability.
- Revocation capability.
- Rotation drill evidence.
- Emergency revocation drill evidence.
- Sync checkpoint recovery evidence.
- Provider quota policy.
- Retry policy.
- Provider error mapping.

## Hosted Alert Classes

Provider adapters must document hosted alert handling for:

- `TOKEN_FAILURE`
- `WEBHOOK_SIGNATURE_FAILURE`
- `REPLAY_ATTEMPT`
- `PROVIDER_QUOTA_EXHAUSTION`
- `WRITE_BACK_CONFLICT`
- `REVOCATION_FAILURE`
- `SYNC_DRIFT`
- `MANAGED_SECRET_RESOLVER_FAILURE`

These alert labels are review requirements only until production hosted alert routing exists and is approved.

## Write-Back Safety

If an adapter supports write-back, it must require:

- Conflict preview before mutation.
- Explicit review acknowledgement.
- Stable idempotency keys.
- Locked block preservation.
- Separate write-back disablement from read-only sync.

Read-only adapters may omit write-back capability, but they still need revocation, sync checkpoint, managed-secret, privacy, quota, retry, and alert evidence.

## Revocation Safety

Provider revocation must:

- Disable sync.
- Disable write-back.
- Reject new sync checkpoints.
- Clear or quarantine unsafe cursors.
- Require an audit event.

## Privacy Boundary

Provider adapter evidence must be content-minimized and exclude:

- Raw provider payloads.
- Raw provider identifiers.
- Private task or calendar titles.
- Attendees.
- Locations.
- Descriptions.
- Raw credentials.
- Raw webhook secrets.
- Raw provider URLs.

Use fictional evidence labels such as:

```text
tenant_demo
workspace_demo
user_jordan
provider_connection_demo
provider_adapter_contract_demo
secret_ref_hash_demo
write_back_conflict_demo
revocation_drill_demo
hosted_alert_routing_demo
```

## Verification

Focused verification:

```bash
npm run build
node --test dist/provider-adapter-contract.test.js
```

Full verification:

```bash
npm run check
npm audit --omit=dev --audit-level=high
find . -maxdepth 2 -name .git -type d -print
```

## Release Boundary

This contract is a local foundation. ScheduleOS release status remains `FAIL` until real provider-specific adapters, real provider runbooks, hosted operator alerts, managed-secret storage proof, remote CI, final security/privacy/licensing audits, and second-operator approval are complete.
