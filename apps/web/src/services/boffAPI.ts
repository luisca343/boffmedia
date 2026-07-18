// Barrel for the HTTP client. The implementation is split by domain under
// `./http/*` so each file carries one set of auth rules:
//   - core.ts        — fetch primitives, envelope/error types, session token
//   - boff-client.ts — Boffmedia (api*, boff*, upload); plain + Bearer variants
//   - rotom-client.ts — SmartRotom (rotom*); always sends `server`, optional Bearer
//   - wingull-client.ts — Wingull (wingull*); plain, no `server`, no Bearer
// Import from `@/services/boffAPI` as before — every symbol is re-exported here.
export * from "./http/core";
export * from "./http/boff-client";
export * from "./http/rotom-client";
export * from "./http/wingull-client";
