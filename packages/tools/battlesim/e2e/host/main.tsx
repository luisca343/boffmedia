/**
 * The e2e host: the smallest thing that can mount the battlesim tool.
 *
 * WHY IT IS NOT A PACKAGE. This started as `e2e/host/package.json` declaring
 * `workspace:*` deps, which never installs anything: `pnpm-workspace.yaml`
 * globs `packages/*` and `packages/tools/*`, so a package nested three levels
 * deeper is not a workspace member and pnpm never links it. Vite then failed to
 * resolve every import. There is no package here now — Vite runs with this
 * directory as its root and resolves from the battlesim package's own
 * `node_modules` (which has the @boffmedia links) and the repo root's (which
 * has react and @pkmn).
 *
 * WHY THE IMPORT IS RELATIVE. `@boffmedia/tools-battlesim` is the package this
 * file lives INSIDE. Importing it by name is a self-reference that only
 * resolves if the package is linked into its own node_modules. `../../src` is
 * the same module, unambiguously.
 *
 * NAV: none passed, on purpose. `BsimNavProvider` falls back to `useMemoryNav`
 * when no nav is supplied — the same backing the desktop host uses — so the
 * suite drives the tool through its own in-app navigation rather than through a
 * URL bar. What that does NOT cover is apps/web's `BsimRouted` adapter and
 * Next's router; see the header of tests/battlesim.spec.ts.
 */
import { createRoot } from "react-dom/client"

import "./index.css"

import { BsimRoot, battlesimToolsFor } from "../../src"

// `false`: the Showdown relay is a network path, and this suite has no network.
// The website passes `true` here; the launcher passes `false` as well.
battlesimToolsFor({ showdownProxy: false })

createRoot(document.getElementById("root")!).render(<BsimRoot />)
