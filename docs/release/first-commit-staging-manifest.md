# First Commit Staging Manifest

## Status

Draft release-candidate staging manifest for the future clean public initial commit.

This document does not initialize git, create a repository, add a remote, stage files, commit, tag, publish, deploy, or mark clean public history prepared. It exists so the source tree can be reviewed before any public repository mutation.

## Required Before Use

Run and attach current output for:

```bash
npm run check
npm audit --omit=dev --audit-level=high
npm ls --omit=dev --all
npm run license:check
find . -maxdepth 2 -name .git -type d -print
```

The no-`.git` command must return no paths before this manifest is used for public-history preparation.

## Include In First Public Commit

Include source, documentation, configuration, fixtures, and lockfiles needed to build, test, audit, and self-host ScheduleOS as a standalone project:

- `.env.example`
- `.github/`
- `.gitignore`
- `CHANGELOG.md`
- `CODE_OF_CONDUCT.md`
- `CONTRIBUTING.md`
- `LICENSE`
- `NOTICE` if present at release-candidate freeze
- `README.md`
- `SECURITY.md`
- `docker-compose*.yml`
- `docs/`
- `examples/`
- `fixtures/`
- `migrations/`
- `package.json`
- `package-lock.json`
- `scripts/`
- `src/`
- `tsconfig.json`

## Exclude From First Public Commit

Do not include generated, local, private, runtime, credential, backup, or transient files:

- `.git/`
- `.env`
- `.env.*` except `.env.example`
- `node_modules/`
- `dist/`
- `coverage/`
- local SQLite databases, journals, WAL files, and backups
- logs and debug logs
- screenshots or browser artifacts unless explicitly approved release evidence
- real provider exports, real calendars, real task data, customer data, private compatible leadership system code, private prompts, local secrets, SSH keys, certificates, or package-registry credentials

## Review Checklist

- Confirm `docs/release/repository-readiness.md` still names `scheduleos-ai/scheduleos` as preferred target and keeps public repository creation blocked.
- Confirm `docs/public-release-checklist.md` still reports `Current result: FAIL`.
- Confirm release safety scan covers every included source and documentation file.
- Confirm generated-output review covers any generated artifact intentionally retained outside excluded paths.
- Confirm fixture and sample review uses fictional/demo values only and no real email-shaped addresses.
- Confirm license scan covers package lockfile, copied-source markers, fixture/template/example files, and NOTICE triggers.
- Confirm dependency audit evidence includes both local `npm audit --omit=dev --audit-level=high` and remote CI dependency audit proof before any release gate changes.
- Confirm second-operator review happens before git initialization, remote creation, push, tag, package publish, deployment, or announcement.

## Current Boundary

This manifest narrows clean-history preparation only. Clean public history remains incomplete until every release gate passes, a second operator reviews the staging set, git is intentionally initialized from the approved release-candidate tree, and the first public commit is created without private history.
