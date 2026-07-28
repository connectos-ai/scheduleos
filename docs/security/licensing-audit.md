# Licensing Audit

## Status

Current result: `FAIL`.

Reason: ScheduleOS has an Apache-2.0 package license and root license file. `npm run license:check` now verifies the package lock, installed dependency metadata, forbidden asset extensions, copied-source marker scans across release text files, fixture/template/example-like files, documentation reuse markers, and NOTICE triggers. The current copied-source, fixture, asset, docs, and notice audit foundation is complete for the present tree. Licensing status still remains `FAIL` until the final release-candidate repeat review is complete.

## Intended Project License

Apache License 2.0.

This matches `package.json` and the root `LICENSE` file.

## Current Dependency Snapshot

Source: installed `node_modules/*/package.json` metadata reviewed locally on 2026-07-21, then automated against `package-lock.json` and installed package metadata with `npm run license:check` on 2026-07-22.

| Dependency | Usage | Declared License Check | Release Status |
| --- | --- | --- | --- |
| `@types/node@20.19.43` | Development TypeScript types. | MIT. | Automated lockfile pass |
| `@types/pg@8.20.0` | Development TypeScript types. | MIT. | Automated lockfile pass |
| `pg@8.22.0` | Runtime PostgreSQL adapter. | MIT. | Automated lockfile pass |
| `pg-cloudflare@1.4.0` | Transitive PostgreSQL dependency. | MIT. | Automated lockfile pass |
| `pg-connection-string@2.14.0` | Transitive PostgreSQL dependency. | MIT. | Automated lockfile pass |
| `pg-int8@1.0.1` | Transitive PostgreSQL dependency. | ISC. | Automated lockfile pass |
| `pg-pool@3.14.0` | Transitive PostgreSQL dependency. | MIT. | Automated lockfile pass |
| `pg-protocol@1.15.0` | Transitive PostgreSQL dependency. | MIT. | Automated lockfile pass |
| `pg-types@2.2.0` | Transitive PostgreSQL dependency. | MIT. | Automated lockfile pass |
| `pgpass@1.0.5` | Transitive PostgreSQL dependency. | MIT. | Automated lockfile pass |
| `postgres-array@2.0.0` | Transitive PostgreSQL dependency. | MIT. | Automated lockfile pass |
| `postgres-bytea@1.0.1` | Transitive PostgreSQL dependency. | MIT. | Automated lockfile pass |
| `postgres-date@1.0.7` | Transitive PostgreSQL dependency. | MIT. | Automated lockfile pass |
| `postgres-interval@1.2.0` | Transitive PostgreSQL dependency. | MIT. | Automated lockfile pass |
| `split2@4.2.0` | Transitive PostgreSQL dependency. | ISC. | Automated lockfile pass |
| `typescript@5.9.3` | Development compiler. | Apache-2.0. | Automated lockfile pass |
| `undici-types@6.21.0` | Transitive type dependency. | MIT. | Automated lockfile pass |
| `xtend@4.0.2` | Transitive PostgreSQL dependency. | MIT. | Automated lockfile pass |

Current conclusion: package lock and installed dependency license metadata are compatible with Apache-2.0 release under the current dependency set, subject to final notice review and repeat check on the release candidate.

## Automated License Check

`npm run license:check` currently verifies:

- Root `package.json` license is `Apache-2.0`.
- Root `LICENSE` contains Apache License 2.0 text.
- `package-lock.json` dependency license metadata is one of `Apache-2.0`, `ISC`, or `MIT`.
- Installed package metadata matches the lockfile license when `node_modules` is present.
- Project-owned files do not include binary, media, icon, image, or font extensions requiring separate asset review.
- Release text files across docs, source, scripts, migrations, GitHub templates, root docs, and config do not include common copied-source markers.
- Fixture/template/example-like files are counted and scanned as part of the release text surface.
- NOTICE trigger phrases are scanned. No `NOTICE` file is currently required by the present tree.

The checker intentionally excludes `LICENSE`, the checker itself, and audit/history documents that discuss copied-source policy so their explanatory text does not create false positives.

Latest local result on 2026-07-22:

```text
License check passed: 18 package-lock licenses reviewed, 99 release text files scanned, 6 fixture/template/example-like files reviewed, assets, copied-source markers, and NOTICE triggers clean.
```

## Reused Source Components

No copied third-party source code has been approved for release at this time.

Open-source scheduling projects may be used as references only until license compatibility, attribution requirements, source headers, copied snippets, dependency risks, and notice obligations are reviewed.

## Copied Source, Fixture, Asset, Docs, Notice Review

Status: complete for current local tree; repeat required on final release candidate.

Current evidence:

- No approved copied third-party source code exists in this tree.
- No project-owned binary/media/font assets are present outside ignored generated or dependency folders.
- Documentation, source, scripts, migrations, GitHub templates, root docs, and config pass copied-source marker scanning.
- Fixture/template/example-like files are present only as local release templates/config examples and pass the same copied-source marker scan.
- No NOTICE obligation is currently identified for the present dependency and source set.

Before publication, repeat `npm run license:check` after final release-candidate freeze.

## Final Licensing Audit Readiness Packet

`licensing:final-audit-readiness-packet` emits review-only final licensing audit evidence requirements for final license check, lockfile dependency licenses, installed dependency metadata, copied-source marker scan, fixture/template/example review, asset/media/font/binary review, documentation reuse scan, third-party reused-material inventory, NOTICE requirement review, root Apache-2.0 consistency, final release-candidate freeze, and second-operator review. It does not mark this audit `PASS`, approve publication, add NOTICE, mutate release gates, create remotes, publish packages, or announce ScheduleOS.

## Required Before PASS

- Repeat `npm run license:check` on final release candidate.
- Record every reused project, version or commit, license, usage type, attribution, required notice, and final approval status if any third-party material is added before release.
- Add `NOTICE` if required by any final dependency or reused material.
- Change licensing audit status from `FAIL` to `PASS` only after final release-candidate review.

## Release Rule

Do not publish ScheduleOS until this audit passes with no unresolved incompatible or unknown licenses.
