# Furret Today News Follow-ups

This file tracks deferred work for the SmartRotom Furret Today news editor so it can be resumed later without losing context.

## Current status

- News creation now uses the proper create endpoint.
- The editor refreshes after save, so newly created items appear in the list.
- The create modal was rebuilt to stop shifting away from the cursor.
- News mutation endpoints are currently guarded for `ROTOM_ADMIN` and `ROTOM_FURRET`.

## Deferred fixes

### 1. Fix the create DTO contract

Problem:
- The shared `CreateNewsDto` still requires an `id`, even though the backend generates the real persisted ID.
- The frontend currently works around that mismatch by sending a placeholder value.

Why it matters:
- This is the root contract mismatch in the news flow.
- It makes the client lie about ownership of the identifier.

Suggested direction:
- Update the server DTO for create so `id` is not required on creation.
- Regenerate shared types with `pnpm generate:shared`.
- Remove placeholder ID generation from the client create flow.

Relevant files:
- `apps/web/src/app/smartrotom/furrettoday/_components/NewsManager.tsx`
- `apps/api/src/api/smartrotom/documents/documents.controller.ts`
- `apps/api/src/api/smartrotom/documents/services/news.service.ts`

### 2. Replace generic thrown errors with Nest exceptions

Problem:
- The SmartRotom documents/news controller and service still throw raw `Error` objects for invalid input and missing data.

Why it matters:
- HTTP semantics become less explicit.
- Client-side error handling becomes less predictable.

Suggested direction:
- Replace raw throws with `BadRequestException`, `NotFoundException`, and related Nest exceptions where appropriate.

Relevant files:
- `apps/api/src/api/smartrotom/documents/documents.controller.ts`
- `apps/api/src/api/smartrotom/documents/services/news.service.ts`

### 3. Clarify the featured/published rules

Problem:
- The current status flow requires a featured news item before saving status changes.
- The UI allows draft creation, but the status save path is stricter than that editing model suggests.

Why it matters:
- The rule may be correct, but if so it should be explicit in the UI.
- If the rule is too strict, it should be relaxed on the backend and reflected in the editor flow.

Suggested direction:
- Decide whether the system must always have exactly one featured published item.
- Either enforce and explain it clearly in the editor, or allow empty featured state when saving drafts only.

Relevant files:
- `apps/web/src/app/smartrotom/furrettoday/editar/_hooks/useNews.ts`
- `apps/api/src/api/smartrotom/documents/services/news.service.ts`

### 4. Add client-side form validation

Problem:
- The modal is stable now, but validation still leans heavily on the backend.

Why it matters:
- Simple invalid submissions should be blocked before the request is sent.

Suggested direction:
- Validate required fields such as title and content on the client.
- Validate image URLs before submit.
- Show inline feedback in the modal.

Relevant files:
- `apps/web/src/app/smartrotom/furrettoday/_components/NewsManager.tsx`

## Priority if this work resumes

1. Fix the create DTO contract.
2. Replace generic errors with Nest exceptions.
3. Clarify featured/published business rules.
4. Add client-side validation.

## Focus note

News follow-up work is intentionally deferred for now.
Current active focus has moved back to the VGC area.