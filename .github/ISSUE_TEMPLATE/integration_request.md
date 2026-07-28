---
name: Integration request
about: Propose a new calendar, task, or provider integration
title: "[Integration]: "
labels: integration
assignees: ""
---

## Safety First

Do not include real provider tokens, OAuth credentials, callback URLs, account IDs, emails, calendar data, task titles, customer data, screenshots, exports, logs, or private workspace details. Use fictional provider and scope examples only.

Do not report provider security vulnerabilities in public issues. Use the private vulnerability reporting path in `SECURITY.md` after the public repository contact is configured.

## Provider

Which provider, protocol, or standard should ScheduleOS support?

## Use Case

What tasks, events, capabilities, schedule outputs, or sync state should move through this integration?

## Direction

- [ ] Import tasks
- [ ] Export tasks
- [ ] Import calendar events
- [ ] Export time blocks
- [ ] Provider capability discovery
- [ ] Webhook sync

## Required Permissions

List the minimum provider permissions or scopes required. Use fictional scope names if needed.

## Safety Notes

How should ScheduleOS avoid duplicate blocks, token leakage, replay attacks, accidental writes, unsafe write-back, quota abuse, and provider revocation failures?
