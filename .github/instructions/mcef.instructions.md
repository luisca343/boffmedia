---
applyTo: "apps/web/src/services/mcef/**,apps/web/src/**/*mcef*"
---
## Minecraft Integration (MCEF)

MCEF (Minecraft Embedded Framework) allows direct client-side communication with the Minecraft game process via `window.mcefQuery`.

- All MCEF functions live in `apps/web/src/services/mcef/`.
- Use `isMinecraft()` to guard MCEF calls; `mcefPlaceholders.ts` provides fallbacks for non-Minecraft browsers.
- **Do not invent new MCEF integration patterns.** Rely on existing functions in `mcefApi.ts` or server-side relay endpoints.
- When MCEF is unsuitable (server-authoritative actions), use the NestJS API as a relay instead.
- Available MCEF functions: `getMcUserData`, `openPC`, `getSpawns`, `setCall`, `leaveCall`, `sendChatMessage`, `taxiTeleport`, `darCaja`, `takeScreenshot`, `getZoomLevel`, `setZoomLevel`, `getWaypoints`, `addWaypoint`.
