# VGC Architecture Refactor Tracker

> Working document for architectural follow-up after the VGC meta + tracker review.
> Keep this file updated as implementation progresses.

---

## Goals

- Reduce security and data-integrity risk in the tracker sync model.
- Standardize VGC API contracts across meta, tracker, and supporting tools.
- Improve ingestion reliability for Smogon, VGCPastes, and Limitless.
- Reduce long-term maintenance cost by tightening module boundaries and types.

---

## Current Priorities

### P0

- [ ] Tracker endpoints must derive identity from JWT, not client-supplied `userId`
- [ ] Tracker mutations must enforce row ownership server-side
- [ ] Unified paste upsert must stop resolving non-pokepaste rows by `raw_text`
- [ ] VGCPastes refresh must stop doing destructive delete-and-rebuild without a recoverable job/state model

### P1

- [ ] Remove duplicate regulations surfaces and choose one canonical endpoint family
- [ ] Fix DTO drift where documented query fields are not implemented
- [ ] Split lean usage-list payloads from heavy detail payloads
- [ ] Add missing secondary indexes for regulation/tournament/paste lookup paths

### P2

- [ ] Introduce tracker sync conflict detection (`updatedAt` or version-based)
- [ ] Add durable client outbox/retry model for tracker sync
- [ ] Unify ingestion jobs under a shared status/retry/revision model
- [ ] Move personal-vs-meta comparative analytics to backend contracts

---

## Slice Plan

### Slice 1 - Tracker Auth + Ownership

Problem:
Tracker API currently accepts `userId` from query/body and performs mutations by entity ID without ownership checks.

Scope:

- Web tracker sync client sends bearer token
- Tracker controller requires JWT auth
- Tracker service derives user identity from `req.user`
- Tracker repository mutations/reads are scoped by `userId`

Status:

- [ ] Not started
- [x] In progress
- [ ] Done

Success criteria:

- Sync pull works without `userId` query param
- Preset/session/match/series mutations cannot read or modify another user's rows
- Existing authenticated tracker UX still works

Implemented in current slice:

- [x] Web tracker sync now uses bearer-authenticated requests
- [x] Tracker controller now requires JWT auth on all endpoints
- [x] Tracker reads now derive user scope from `req.user.userId`
- [x] Tracker upserts now ignore client-supplied ownership and persist the authenticated user
- [x] Tracker deletes now require ownership checks before mutation
- [x] Repository delete paths now scope by `(id, user_id)` instead of bare entity ID
- [ ] Runtime verification in browser against a real authenticated tracker session

### Slice 2 - Paste Identity Hardening

Problem:
`vgc_pastes` currently resolves inline pastes by `raw_text`, which is not a stable identity key.

Status:

- [ ] Not started
- [x] In progress
- [x] Done

Implemented in current slice:

- [x] Inline paste writes now return the actual MySQL `insertId` instead of re-querying by `raw_text`
- [ ] Add a durable identity model for non-pokepaste sources if cross-source deduplication becomes necessary
- [ ] Audit downstream callers for assumptions about inline paste deduplication

### Slice 3 - VGCPastes Import Reliability

Problem:
Champions refresh deletes all existing rows before the new dataset and follow-up paste fetch are fully stable.

Status:

- [ ] Not started
- [x] In progress
- [ ] Done

Implemented in current slice:

- [x] Refresh no longer deletes all rows before importing the next CSV snapshot
- [x] CSV import now upserts seen teams first and only prunes stale rows after a successful pass
- [x] Import state is persisted on `vgc_regulations` (`import_status`, `import_error`, timestamps, team count)
- [x] Paste-fetch phase updates the same persisted import state instead of being fire-and-forget invisible work
- [x] Admin Champions panel now surfaces regulation import status and error state
- [ ] Add explicit progress counters for paste fetch, not just terminal state

---

## Notes

- Keep endpoint changes incremental and backward-aware where practical.
- Prefer fixing ownership and consistency at the server boundary before UI cleanup.
- Avoid adding new VGC endpoint families unless they replace an existing duplicated surface.

---

## Changelog

| Date | Change |
|---|---|
| 2026-04-29 | Created refactor tracker from architecture review. Priorities grouped into P0/P1/P2 and implementation slices defined. |
| 2026-04-29 | Started Slice 1: tracker auth + ownership enforcement. |
| 2026-04-29 | Implemented Slice 1 backend/frontend auth wiring: tracker sync now uses bearer auth, tracker endpoints are JWT-guarded, and tracker mutations/reads are scoped to the authenticated user. |
| 2026-04-29 | Started Slice 2: inline paste identity hardening by removing the `raw_text` re-query path and returning the inserted row ID directly from MySQL metadata. |
| 2026-04-29 | Completed Slice 2 first hardening step and started Slice 3: VGCPastes refresh is now non-destructive during CSV ingest, persists import state on regulations, and exposes status/errors in the admin Champions fetcher. |