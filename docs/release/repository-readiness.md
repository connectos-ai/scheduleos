# Repository Readiness

## Status

Checked on 2026-07-22. Public repository creation remains blocked until every public-release gate passes.

## Target

- Preferred organization: `scheduleos-ai`
- Preferred repository: `scheduleos`
- Preferred URL: `https://github.com/scheduleos-ai/scheduleos`
- Preferred description: `Open-source intelligent task scheduling calendar optimization.`

## GitHub Name Check

Refreshed on 2026-07-23:

- `https://github.com/scheduleos-ai` still returned GitHub 404 during browser review. This suggests the preferred organization/user namespace is not publicly claimed, but it does not guarantee GitHub will allow creation.
- `https://github.com/scheduleos-ai/scheduleos` still returned GitHub 404 during browser review. This suggests the preferred target repository path is not publicly claimed.
- GitHub repository search for exact `ScheduleOS` still returned one public repository: `Agent4343/ScheduleOS`.
- Public web search also surfaced adjacent `scheduleOS` usage in project-controls/software contexts, including Nodes & Links public/social material. This is not proof of trademark conflict, but it raises a final naming-review item before launch.
- Dedicated naming and trademark review now lives in `docs/release/repository-naming-trademark-approval-checklist.md`.
- Current naming status remains review-only. The preferred target is not reserved, not legally cleared, not approved for package naming, and not approved for public launch.

Current findings:

- `https://github.com/scheduleos-ai` returned a GitHub 404 during the check. This suggests the preferred organization/user namespace is not publicly claimed, but it is not a guarantee that GitHub will allow creation.
- `https://github.com/scheduleos-ai/scheduleos` returned a GitHub 404 during the check. This suggests the preferred target repository path is not publicly claimed.
- GitHub repository search for `ScheduleOS` returned one public repository: `Agent4343/ScheduleOS`.
- `Agent4343/ScheduleOS` is an unrelated workforce scheduling platform whose README title is `ShiftSync`, not a public intelligent task/calendar optimization project.

Decision:

- Keep the working name `ScheduleOS`.
- Keep preferred target `scheduleos-ai/scheduleos`.
- Treat the existing `Agent4343/ScheduleOS` repository as a naming collision to review before launch copy is finalized, not as an immediate blocker to using the org-scoped `scheduleos-ai/scheduleos` path.

## Obvious Trademark Conflict Check

Current findings:

- USPTO provides the official Trademark Search system for federal trademark searching.
- Web searches for exact `ScheduleOS` trademark phrasing did not surface an obvious active software scheduling product trademark conflict.
- Search results did surface many generic uses of "schedule OS" or "ScheduleOSUpdate" related to operating-system update scheduling, mobile-device management, and Apple MDM terminology.
- The exact working name `ScheduleOS` is therefore potentially usable, but it is close to generic "schedule OS" language and should not be treated as legal clearance.

Decision:

- Keep `ScheduleOS` as the internal working and preferred public name for now.
- Before public announcement, run a final USPTO Trademark Search and a broader marketplace search for exact and confusingly similar marks.
- If a later conflict appears, preserve the internal architecture and choose a neutral alternative rather than weakening the standalone project boundary.

## Clean Public History Strategy

Current local state:

- The local ScheduleOS folder intentionally has no `.git` directory.
- No public remote has been created.
- No tags, releases, or public pushes have been made.
- Generated/runtime paths are excluded by `.gitignore`, including `node_modules/`, `dist/`, `.env`, `.env.*`, SQLite database files, logs, and coverage output.

Strategy:

1. Do not initialize git until the release gate is ready for the final repository preparation pass.
2. Before the first commit, run the complete release gate: `npm run check`, `npm audit --omit=dev --audit-level=high`, privacy/security scans, license audit, fixture audit, and final generated-output review.
3. Review `docs/release/first-commit-staging-manifest.md` and confirm no secrets, real customer data, private compatible leadership system code, private prompts, local databases, backup files, logs, or generated build output are staged.
4. Create a clean initial commit from the vetted source tree only.
5. Create the public GitHub organization/repository only after the local release gate passes.
6. Push the clean initial history normally. Do not force-push unless a documented secret-remediation incident requires replacing the public history.

This strategy satisfies the current git-history planning gate, but the public-history preparation gate remains open until the final repository is initialized from a verified release candidate.
