---
description: SmartRotom domain rules — cellphone UI, Pixelmon/Minecraft context, neobrutalism design
applyTo:
  - "apps/web/src/app/smartrotom/**/*"
  - "apps/web/src/components/smartrotom/**/*"
  - "apps/web/src/services/api/smartrotom/**/*"
  - "apps/web/src/services/mcef/**/*"
  - "apps/api/src/api/smartrotom/**/*.ts"
---

## SmartRotom is a cellphone UI

- Wrapper: `AppWrapper.tsx` renders the cellphone frame.
- Nav: `RotomNav.tsx` (bottom navigation bar).
- Each "app" is a route under `/smartrotom/{appName}`.
- Layout: `GlobalProviders` → `SmartRotomProviders` (PokemonProvider, TooltipProvider, SpriteManifestProvider, RotomErrorBoundary) → `AppWrapper`.

## Design system — neobrutalism

- SmartRotom uses its own design tokens in `components/smartrotom/ui/`.
- `badge.tsx` and `button.tsx` are neobrutalism variants incompatible with global shadcn primitives.
- Do NOT replace SmartRotom components with global equivalents.
- Do NOT force Boffmedia styles onto SmartRotom.

## MCEF integration

- MCEF (Minecraft Embedded Framework) allows direct client ↔ game communication via `window.mcefQuery`.
- Always guard with `isMinecraft()` before calling MCEF functions.
- `mcefPlaceholders.ts` provides fallbacks for non-Minecraft browsers.
- Available functions: `getMcUserData`, `openPC`, `getSpawns`, `setCall`, `leaveCall`, `sendChatMessage`, `taxiTeleport`, `darCaja`, `takeScreenshot`, `getZoomLevel`, `setZoomLevel`, `getWaypoints`, `addWaypoint`.
- Do not invent new MCEF integration patterns — use existing functions in `services/mcef/`.

## Pixelmon/Minecraft context

- This is a companion for a Pixelmon Minecraft server. UI and logic should respect that context.
- Pokemon data comes from the API, not from static files.
- Minecraft player identity is separate from web user identity — `MinecraftMiddleware` validates `MC_WORLD` on SmartRotom POST routes.

## SmartRotom API services

- 18 service files in `services/api/smartrotom/`.
- Each maps to a NestJS submodule under `apps/api/src/api/smartrotom/`.
- Use `rotomGET`/`rotomPOST` wrappers from `boffAPI.ts`.

## Error handling

- `RotomErrorBoundary` catches React errors in SmartRotom.
- `GlobalErrorThrower` component for programmatic error display.
- `globalErrorStore` (Zustand) for error state.
