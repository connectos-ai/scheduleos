# Final Dependency Runtime Inventory

## Status

Current result: `FOUNDATION ONLY`. This inventory supports final dependency audit review, but it does not mark dependency audit final pass `PASS`, approve public release, create a public repository, configure registries, publish packages, or replace remote CI and second-operator approval.

## Scope

This inventory records the current release-candidate production dependency surface from `package.json`, `package-lock.json`, and local installed package metadata.

## Direct Production Dependencies

| Package | Manifest Range | Runtime Purpose | Boundary |
| --- | --- | --- | --- |
| `pg` | `^8.22.0` | Optional PostgreSQL storage adapter and live PostgreSQL verification path. | ScheduleOS can still run local JSON/SQLite-style foundations without requiring a hosted PostgreSQL service, but PostgreSQL support is part of the public self-hosting path. |

## Production Lockfile Packages

| Package | Version | License | Requiredness |
| --- | --- | --- | --- |
| `pg` | `8.22.0` | `MIT` | required |
| `pg-cloudflare` | `1.4.0` | `MIT` | optional |
| `pg-connection-string` | `2.14.0` | `MIT` | required |
| `pg-int8` | `1.0.1` | `ISC` | required |
| `pg-pool` | `3.14.0` | `MIT` | required |
| `pg-protocol` | `1.15.0` | `MIT` | required |
| `pg-types` | `2.2.0` | `MIT` | required |
| `pgpass` | `1.0.5` | `MIT` | required |
| `postgres-array` | `2.0.0` | `MIT` | required |
| `postgres-bytea` | `1.0.1` | `MIT` | required |
| `postgres-date` | `1.0.7` | `MIT` | required |
| `postgres-interval` | `1.2.0` | `MIT` | required |
| `split2` | `4.2.0` | `ISC` | required |
| `xtend` | `4.0.2` | `MIT` | required |

## Development Dependencies

| Package | Manifest Range | Boundary |
| --- | --- | --- |
| `@types/node` | `^20.14.10` | TypeScript compile-time types only. |
| `@types/pg` | `^8.20.0` | TypeScript compile-time PostgreSQL types only. |
| `typescript` | `^5.5.4` | Build tool only. |

Development dependencies must not be treated as production runtime dependencies in final audit evidence.

## Override And Registry Review

- `package.json` currently defines no `overrides`, `resolutions`, or package patch policy.
- No local `.npmrc` file was found in the ScheduleOS workspace during this inventory foundation pass.
- `package-lock.json` package resolutions point to the public npm registry.
- No registry token evidence is approved or required for this local inventory.

## Verification

Local inventory contract:

```bash
npm run dependency:runtime-inventory:check
```

The checker compares this document to `package.json` and `package-lock.json`, requires every current production lockfile package to be listed, requires dev dependency boundary language, and keeps this inventory marked `FOUNDATION ONLY`.

## Release Boundary

This narrows dependency-audit review work only. Final dependency audit remains incomplete until the final release candidate has current production audit output, installed tree evidence, clean-install proof, runtime inventory approval, dev dependency exclusion approval, override and registry review approval, license alignment, remote CI proof, final security/privacy/licensing alignment, and second-operator review.
