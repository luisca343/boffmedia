import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"

import { configureToolHost, createWebToolHost } from "@boffmedia/tool-kit"
import { configureUi } from "@boffmedia/ui"

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
if (typeof window !== "undefined") {
  configureToolHost(createWebToolHost({ apiBaseUrl: process.env.NEXT_PUBLIC_API_URL ?? "/api" }))
}
