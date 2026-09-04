/**
 * The header a step-up confirmation travels in. Mirrors `STEP_UP_HEADER` in
 * `apps/api/src/api/_utils/guards/step-up.guard.ts`.
 *
 * A header rather than a body field because the desktop release upload is a raw
 * octet-stream body with nowhere to put one — and gating "publish" but not
 * "upload the artifact" would gate the wrong half.
 */
export const STEP_UP_HEADER = "X-Step-Up-Token"
