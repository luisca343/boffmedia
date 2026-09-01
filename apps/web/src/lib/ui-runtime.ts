import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"

import { configureToolHost, createToolSession, createWebToolHost } from "@boffmedia/tool-kit"
import { configureUi } from "@boffmedia/ui"

import { env } from "@/config/env.public"

// Runs at import time, once per module graph. Next builds the server and the
// client bundles separately, so this module has to be reachable from BOTH —
// see `UiRuntime` in the root layout, which is a client component, and the
// layout module itself, which is not. Registering the hooks (not their
// results) keeps per-request locale resolution intact.
configureUi({
  useTranslate: () => useTranslations("common.primitives"),
  // Unbound — workspace tool packages resolve their own `tools.*` keys through
  // this. next-intl's `useTranslations()` with no namespace is root-scoped.
  useTranslateRoot: () => useTranslations(),
  useLocale,
  Link,
})

// The tool-package host contract (@boffmedia/tool-kit). On the web every
// capability is its browser default: blob download, window.open, localStorage,
// direct fetch. The launcher swaps these for Tauri-backed ones.
//
// Guarded because this module is imported from the SERVER bundle too, and the
// browser defaults touch `document`/`window` — the capabilities are only ever
// invoked from client components, but constructing them server-side is
// pointless and `createWebStorage` would be handed no `localStorage`.
/**
 * Who the tools think is signed in.
 *
 * Held here rather than read from next-auth inside the kit: `useSession` is a
 * hook and `configureToolHost` runs at import time, so the store is what
 * crosses that gap — `UiRuntimeClient` publishes into it on every session
 * change. Same shape the launcher uses for its own account state.
 */
export const toolSessionStore = createToolSession({
  // `/entrar` is this app's single login entry point (see next.config.mjs,
  // which redirects the legacy /auth forms to it).
  signIn: () => {
    window.location.href = "/entrar"
  },
})

if (typeof window !== "undefined") {
  // NEXT_PUBLIC_API — the same base every `services/http` call uses. There is
  // no NEXT_PUBLIC_API_URL in this app: reading one left the host on the
  // "/api" default, a relative base `new URL()` rejects outright, so every
  // tool request through the `api` capability threw before it was sent.
  configureToolHost(
    createWebToolHost({ apiBaseUrl: env.NEXT_PUBLIC_API, session: toolSessionStore.session }),
  )
}
