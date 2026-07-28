# Managed Secret Storage Runbook

Production managed-secret and hosted public-event worker approval is tracked in `docs/security/production-managed-secret-public-event-approval-checklist.md`. This runbook defines the managed-secret storage contract; it does not approve production hosted delivery.


## Status

Production managed-secret storage contract foundation accepted 2026-07-23.

This runbook defines the production contract ScheduleOS must satisfy before public hosted delivery is release-ready. It does not claim production managed secret storage is complete. Current local/self-host foundations may use process config for webhook secrets and public-event delivery targets. The API also exposes an implementation-facing `managedSecrets` resolver boundary for public-event delivery target URL and signing-secret refs, with tenant/workspace/purpose scope validation before provider lookup. Production release still requires a selected managed secret provider, runtime identity policy, rotation proof, operator access controls, hosted logs review, and incident drill evidence.

## Purpose

ScheduleOS must never expose provider tokens, webhook signing secrets, public-event delivery target URLs, or delivery signing secrets through public APIs, exported workspace data, audit views, support notes, issue templates, or general logs.

Managed secret storage is required for production features that need private credentials:

- Generic webhook source signing secrets.
- Public-event webhook delivery target URLs.
- Public-event webhook delivery signing secrets.
- Provider OAuth client secrets.
- Provider refresh tokens or token references.
- Future AI provider credentials when optional AI mode is enabled.

Public ScheduleOS records may store secret references and hashes. They must not store raw secret values.

## Secret Classes

| Secret Class | Example Use | Public Metadata Allowed | Raw Value Location |
| --- | --- | --- | --- |
| Inbound webhook signing secret | `POST /api/task-sources/webhook` verification. | Source system, secret version/key ID, hash, rotation status. | Managed secret provider only. |
| Public-event delivery target URL | Receiver endpoint for `ScheduleOSEvent` webhooks. | Target URL hash, target reference hash, status, owner approval metadata. | Managed config/secret provider only. |
| Public-event delivery signing secret | HMAC signing secret for outgoing events. | Secret hash, version/key ID, rotation status. | Managed secret provider only. |
| Provider OAuth refresh token | Calendar/task provider access. | Provider, connection reference, capability status, token version/key ID. | Managed secret provider only. |
| Optional AI provider key | Understanding/explanation adapter. | Provider name, model policy, key version/key ID. | Managed secret provider only. |

## Reference Contract

Production code should resolve secrets by opaque references, not by raw values from request bodies, public records, or logs.

Recommended reference format:

```text
secretRef = scheduleos/{tenantId}/{workspaceId}/{purpose}/{stableId}/{version}
```

Examples:

```text
scheduleos/tenant_demo/workspace_demo/public-event-target/target_demo/v1
scheduleos/tenant_demo/workspace_demo/public-event-signing/target_demo/v3
scheduleos/tenant_demo/workspace_demo/webhook-source/json_import/v2
scheduleos/tenant_demo/workspace_demo/provider/google_calendar/v5
```

Reference requirements:

- Must be opaque to API clients.
- Must include tenant and workspace scope.
- Must include purpose.
- Must include version or key ID.
- Must not include raw target URL, token, secret, email address, provider account ID, customer name, or private content.
- Must be validated against the caller's tenant/workspace scope before resolution.
- Must be safe to log only when classified as a reference, never as proof a secret exists.

## Production Resolution Flow

```text
Public subscription metadata
-> scoped secret/config reference
-> managed secret resolver
-> in-memory delivery target and signing secret
-> signed delivery
-> attempt record with hashes and key IDs only
```

Production workers must:

1. Read scoped subscription metadata.
2. Validate tenant/workspace/user scope before resolving any secret reference.
3. Resolve target URL and signing secret from managed storage.
4. Keep raw values in memory only for the delivery attempt.
5. Sign delivery using the resolved secret.
6. Record delivery attempt with delivery ID, event ID, status, HTTP status or error code, target URL hash, secret version/key ID, and timestamp.
7. Never write raw target URL, signing secret, token, signature, task title, calendar title, provider payload, or event body into general logs.

## Resolver Audit Evidence

Current local/self-host implementation records content-minimized `MANAGED_SECRET_RESOLUTION_CHECKED` audit rows when public-event delivery target URL or signing-secret refs are resolved through the `managedSecrets` boundary.

Rows include only:

- Tenant/workspace/user scope.
- `purpose`, such as `PUBLIC_EVENT_TARGET_URL` or `PUBLIC_EVENT_SIGNING_SECRET`.
- SHA-256 `secretRefHash`.
- Resolution `outcome`: `RESOLVED`, `UNAVAILABLE`, `PROVIDER_UNAVAILABLE`, `PROVIDER_ERROR`, or `REJECTED_SCOPE`.
- Optional internal error code.

Rows do not include raw target URLs, signing secrets, raw secret refs, provider tokens, signatures, raw event bodies, private task titles, or private calendar titles. This provides implementation-facing resolver evidence and cross-scope rejection proof; it is not a production managed secret provider, runtime identity policy, provider audit-log export, or rotation/revocation drill.

## Provider Requirements

ScheduleOS may support any managed secret provider that satisfies the contract. Production release evidence must name the provider and prove the following:

- Encryption at rest is enabled.
- Access is restricted to the ScheduleOS runtime identity and approved operators.
- Secret reads are audit logged.
- Rotation can be performed without code changes.
- Deleted or revoked secrets cannot be resolved.
- Secret values do not appear in application logs, audit views, workspace exports, backup metadata, support bundles, or release evidence.
- Local development values are clearly separate from production secrets.

Acceptable production provider categories:

- Cloud secret manager.
- Kubernetes secret with external secret operator.
- Vault-compatible service.
- Self-hosted secret manager with encryption, audit logs, access policy, and backup/restore procedure.

Plain `.env` files, source-controlled config, issue text, support tickets, unencrypted database rows, and exported workspace JSON are not acceptable production managed secret storage.

## Rotation

Planned rotation:

1. Create new secret version in managed storage.
2. Update secret reference or active version metadata.
3. Keep previous version only during approved overlap window.
4. Send fictional verification event.
5. Confirm receiver accepts new signature and rejects stale or unknown signatures.
6. Confirm delivery attempts record only target URL hash and secret version/key ID.
7. Disable previous version.
8. Record operator, reviewer, time, scope, purpose, version, and verification result.

Emergency revocation:

1. Disable affected subscription, source, or provider connection.
2. Revoke affected secret version in managed storage.
3. Confirm ScheduleOS cannot resolve revoked version.
4. Rotate dependent receiver/provider config.
5. Send fictional verification event after replacement.
6. Review audit attempts, invalid signatures, provider sync failures, and unusual source systems.
7. Preserve incident notes outside any workspace cleanup path.

## Access Control

Production managed secret access must be least privilege.

- Runtime identity may read only secrets for its deployed environment.
- Operators may create, rotate, disable, and audit secrets through approved tooling.
- Support users must not view raw secret values.
- Public API users must not receive raw secret values.
- Workspace export and delete flows must not include raw secret values.
- Backup metadata must not contain raw secret values.
- Logs may include hashes and key IDs only.

## Evidence Required For Release

Before ScheduleOS can pass public release gates, provide evidence for at least one production-like environment:

- Managed secret provider selected and documented.
- Managed secret resolver wired to the selected provider.
- Runtime identity policy reviewed.
- Operator access policy reviewed.
- Secret reference naming convention tested.
- Target URL and signing secret resolved by worker without raw values in API body.
- Rotation drill completed with fictional receiver.
- Emergency revocation drill completed.
- Log scan proves no raw target URLs, secrets, signatures, task titles, calendar titles, provider tokens, or provider payloads in delivery logs.
- Workspace export scan proves no raw secrets.
- Backup metadata scan proves no raw secrets.
- Cross-scope secret resolution attempt rejected.
- Hosted delivery attempt records expose only hashes and key IDs.

## Local/Self-Host Boundary

Local/self-host ScheduleOS may continue to use process config for development and small deployments. In that mode:

- Do not commit `.env` files.
- Use fictional demo secrets in examples.
- Prefer configured delivery-target references over raw target URLs in request bodies.
- Keep public APIs limited to hashes and references.
- Treat local process config as an operator responsibility, not production managed secret storage.

Production release remains blocked until managed secret storage is implemented and verified.
