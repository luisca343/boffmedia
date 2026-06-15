---
description: Next.js client standards for routing, components, services, and state
applyTo:
  - "apps/web/**/*.ts"
  - "apps/web/**/*.tsx"
  - "apps/web/**/*.js"
  - "apps/web/**/*.jsx"
---

## Routing (App Router)

- Route groups use `(name)` syntax — no URL impact.
- Route-private components go in `_components/` within the route directory.
- Layouts wrap children with providers, nav, and shared chrome.
- `"use client"` only when the component needs browser APIs, hooks, or event handlers.

## Component architecture (4 layers)

1. **Primitives** (`components/ui/primitives/`) — shadcn/Radix, zero business logic. 33 files.
2. **Global UI** (`components/ui/{navigation,display,form,interactive}/`) — cross-section UI.
3. **Shared utilities** (`components/shared/`) — technical components with no domain models.
4. **Domain** (`components/boffmedia/`, `components/smartrotom/`) — business logic.
5. **Route-private** (`app/**/_components/`) — default for new components.

Promotion path: `_components/` → `features/` → `components/` — justify each step.

## Two design systems

- **Boffmedia**: shadcn/Radix globals (`components/ui/primitives/`).
- **SmartRotom**: neobrutalism variants (`components/smartrotom/ui/badge.tsx`, `button.tsx`).
- Never replace SmartRotom neobrutalism components with global primitives or vice versa.

## API calls

- All HTTP calls go through `services/api/{domain}Service.ts`.
- Use `boffAPI.ts` wrappers: `apiGET`, `apiPOST`, `rotomGET`, `wingullGET`, `apiAuthedPOST`, `apiMultipartPOST`.
- Never inline `fetch` in components. Direct fetch is only allowed for external APIs not proxied through the NestJS backend.

## State management

- **Zustand** stores in `stores/` for client-side state.
- **React contexts** in `providers/` for app-wide concerns (session, socket, pokemon data).
- **Feature slices** in `features/` for domain-specific modules spanning 2+ routes.

## i18n

- Uses `next-intl`. All user-facing strings must use translation keys.
- Translation files in `locales/`.
- Never hardcode text in components.

## Styling

- Tailwind CSS with `cn()` utility (clsx + tailwind-merge).
- Boffmedia uses the global color system documented in `lib/COLOR_SYSTEM.md`.
- SmartRotom has its own CSS in `smartrotom/smartrotom.css` and theme definitions.

## Testing

- Playwright e2e tests in `apps/web/tests/`.
- Run with `pnpm --filter web test`.
