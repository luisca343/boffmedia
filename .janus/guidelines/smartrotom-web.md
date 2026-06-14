---
description: SmartRotom — Pixelmon/Minecraft companion cellphone UI
applyTo:
  - "apps/web/src/app/smartrotom/**/*.tsx"
  - "apps/web/src/components/smartrotom/**/*.tsx"
  - "apps/web/src/services/api/smartrotom/**/*.ts"
  - "apps/web/src/services/mcef/**/*.ts"
---

## Product Context

SmartRotom is a Pixelmon (Minecraft) server companion app, styled as a cellphone UI with individual apps. This is Pixelmon/Minecraft-themed — respect that context for UI and logic suggestions.

## Layout

- Root layout: `apps/web/src/app/smartrotom/layout.tsx`
- Uses `AppWrapper` for cellphone frame.
- Uses `SmartRotomProviders` for domain-specific context.
- Uses `RotomNav` for navigation.

## Design System — NEORUTRALISM

SmartRotom has its **own design system** at `components/smartrotom/ui/`:
- `badge.tsx` — neobrutalism variant
- `button.tsx` — neobrutalism variant

**CRITICAL**: These are incompatible with the global shadcn/Radix primitives. Do NOT:
- Replace SmartRotom UI components with global primitives.
- Force Boffmedia styles onto SmartRotom.
- Import from `components/ui/primitives/` into SmartRotom components unless absolutely necessary.

## Available Apps

SmartRotom apps (each is a separate route under `app/smartrotom/`):
- `pokedex/` — Pokédex
- `liga/` — League
- `misiones/` — Missions
- `equipo/` — Team builder
- `pasaporte/` — Passport/profile
- `starbank/` — Star bank
- `mina/` — Mine
- `chatapp/` — Chat app
- `notas/` — Notes
- `tiempo/` — Weather
- `taxi/` — Taxi/teleport
- `pc/` — PC storage
- `camara/` — Camera
- `arcade/` — Arcade games
- `mewtube/` — Video platform
- `mewtwitch/` — Streaming
- `guias/` — Guides
- `furrettoday/` — News
- `karts/` — Karts
- `bidkea/` — Auction house
- `wigglypop/` — Mini-game
- `rooker/` — Rooker app
- `cinder/` — Cinder app

## MCEF Integration

MCEF (Minecraft Embedded Framework) allows direct client-side communication with Minecraft via `window.mcefQuery`.

- All MCEF functions live in `apps/web/src/services/mcef/`.
- Use `isMinecraft()` to guard MCEF calls.
- `mcefPlaceholders.ts` provides fallbacks for non-Minecraft browsers.
- **Do not invent new MCEF integration patterns.** Extend `mcefApi.ts` using `mcefQuery<T>()`.
- When MCEF is unsuitable, use the NestJS API as a relay.

Available MCEF functions: `getMcUserData`, `openPC`, `getSpawns`, `setCall`, `leaveCall`, `sendChatMessage`, `taxiTeleport`, `darCaja`, `takeScreenshot`, `getZoomLevel`, `setZoomLevel`, `getWaypoints`, `addWaypoint`.

## API Calls

- All HTTP calls go through `apps/web/src/services/api/smartrotom/`.
- Never inline `fetch` in components.
- Types from `@boffmedia/shared`.

## Key Files

- `AppWrapper`: `components/smartrotom/AppWrapper.tsx`
- `RotomNav`: `components/smartrotom/RotomNav.tsx`
- `mcefApi.ts`: `services/mcef/mcefApi.ts`
- `mcefPlaceholders.ts`: `services/mcef/mcefPlaceholders.ts`
