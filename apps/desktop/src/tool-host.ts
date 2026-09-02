// Wires @boffmedia/tool-kit's capability contract to the launcher's runtime.
// This is the launcher's half of the seam that lets the SAME tool code render
// in apps/web and here.
//
// Import-time side effect, exactly like `./i18n` — call it once at bootstrap,
// before any tool renders.

// The MANIFEST module, not the package barrel: the barrel eagerly re-exports
// the tool components and the schematic UI kit, which drags three.js into the
// startup chunk. `./tools` only holds the declarative manifests plus their
// `lazy()` component references, so the heavy code stays behind the split.
import { minecraftTools } from "@boffmedia/tools-minecraft/tools"
import { mhwildsTools } from "@boffmedia/tools-mhwilds/tools"
import { pokemonTools } from "@boffmedia/tools-pokemon/tools"
import { mewgenicsTools } from "@boffmedia/tools-mewgenics/tools"
import {
  configureToolHost,
  createToolSession,
  createWebApi,
  createWebData,
  createWebStorage,
  getToolHost,
  listTools,
  registerTools,
  webSaveFile,
  ToolApiError,
  type SaveFileData,
  type SaveFileRequest,
  type SaveFileResult,
  type ToolApi,
  type ToolData,
  type ToolDb,
  type ToolDoc,
  type ToolNetwork,
  type ToolOutbox,
  type ToolOutboxEntry,
  type ToolOutboxOp,
  type ToolSessionUser,
  type ToolApiRequest,
} from "@boffmedia/tool-kit"

import {
  isDesktop,
  openUrl,
  saveStream,
  saveDialog,
  toolApiRequest,
  toolDbClear,
  toolDbGet,
  toolDbList,
  toolDbPut,
  toolDbRemove,
  toolOutboxEnqueue,
  toolOutboxFlush,
  toolOutboxPending,
  webBaseUrl,
} from "./runtime"
import { isBundledAsset } from "./bundled-assets.generated"

/** 4 MiB — big enough that per-chunk IPC overhead disappears against disk
 *  throughput, small enough that no single message is a memory spike. */
const CHUNK_SIZE = 4 * 1024 * 1024

/** Normalises everything `saveFile` accepts into a chunk stream, so the write
 *  path below never has the whole payload resident. A Blob is NOT read into
 *  memory: `.stream()` pulls it lazily, which is the entire point for the
 *  multi-GB `.prefab` case. */
async function* chunksOf(data: SaveFileData): AsyncGenerator<Uint8Array> {
  if (data instanceof Blob) {
    const reader = data.stream().getReader()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) yield value
    }
    return
  }
  if (data instanceof ReadableStream) {
    const reader = data.getReader()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) yield value
    }
    return
  }
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
  for (let offset = 0; offset < bytes.byteLength; offset += CHUNK_SIZE) {
    yield bytes.subarray(offset, Math.min(offset + CHUNK_SIZE, bytes.byteLength))
  }
}

async function desktopSaveFile(request: SaveFileRequest): Promise<SaveFileResult> {
  const path = await saveDialog(
    request.suggestedName,
    request.filters?.map((f) => [f.name, f.extensions] as [string, string[]]),
  )
  if (!path) return { status: "cancelled" }

  const token = await saveStream.begin(path)
  try {
    for await (const chunk of chunksOf(request.data)) {
      await saveStream.chunk(token, chunk)
    }
    await saveStream.finish(token)
    return { status: "saved", path }
  } catch (err) {
    // Release the handle; the partial file is left on disk deliberately (see
    // the Rust side) rather than deleted behind the user's back.
    await saveStream.abort(token).catch(() => {})
    throw err
  }
}

/** Rust's serialised `ApiError`, as it arrives through `invoke`. */
type WireApiError = { message?: string; needs_signin?: boolean; code?: string }

/**
 * The desktop `api` capability (plan D7).
 *
 * Everything host-shaped happens in Rust — bearer, timeout, 401 handling — so
 * this side is only translation: `query` values are stringified (the Rust
 * struct takes a flat string map, since a query string has no other type) and
 * the rejected `ApiError` becomes the `ToolApiError` the web host also throws.
 */
/**
 * Which API browser dev mode talks to.
 *
 * The default MATTERS, and prod was the wrong one: a page on localhost:5273 is
 * subject to CORS, and the production API's allowlist contains no localhost
 * (deliberately — an origin list is a capability list). So every API-backed
 * tool was dead in `dev:renderer` with a CORS error, which reads as a bug in
 * the tool rather than as pointing at the wrong server.
 *
 * The local API's own default port, then — it allowlists this origin in
 * development (apps/api/src/main.ts, DEV_ONLY_ORIGINS). `VITE_API_URL` still
 * wins for anyone pointing the renderer at staging. None of this touches the
 * packaged app: there the calls go through Rust, which is not a browser and has
 * no origin to be checked.
 */
function webModeApiBase(): string {
  const configured = import.meta.env.VITE_API_URL as string | undefined
  if (configured && configured.trim()) return configured.trim()
  return import.meta.env.DEV ? "http://localhost:34301" : "https://api.boffmedia.es"
}

const desktopApi: ToolApi = {
  async request<T>(path: string, init?: ToolApiRequest): Promise<T> {
    const query: Record<string, string> = {}
    for (const [key, value] of Object.entries(init?.query ?? {})) {
      if (value !== undefined) query[key] = String(value)
    }
    // `signal` is deliberately not forwarded: a Tauri command cannot be
    // cancelled mid-flight, so honouring the abort would only hide a request
    // that is still running. Callers that pass one still get their result.
    try {
      return await toolApiRequest<T>({
        path,
        method: init?.method,
        body: init?.body,
        query,
        auth: init?.auth ?? "optional",
      })
    } catch (err) {
      const wire = err as WireApiError
      throw new ToolApiError(wire?.message ?? `${init?.method ?? "GET"} ${path} failed`, {
        needsSignin: wire?.needs_signin === true,
        code: wire?.code,
      })
    }
  },
}

/**
 * Which paths this build serves out of its own bundle instead of fetching.
 *
 * The list is GENERATED by `scripts/sync-tool-assets.mjs` from what that script
 * actually copied, rather than written here by hand, because a hand-kept list
 * fails silently in the worst direction: a prefix named here but missing from
 * the build resolves against `tauri://localhost`, where nothing serves it, and
 * never falls through to the caching protocol that would have worked. The
 * exceptions matter for the same reason — Mewgenics' JSON is bundled while its
 * 419 MB of art is not, so `.../mewgenics/assets/` has to keep going out.
 */

/**
 * Where `boffasset://` lives from the renderer's point of view. Windows (and
 * Android) serve a registered scheme over `http://<scheme>.localhost`, everyone
 * else over `<scheme>://localhost` — this is the same platform test Tauri's own
 * `convertFileSrc` makes, spelled out here because `convertFileSrc` percent-
 * encodes the whole path into one segment, and encoded paths are exactly what
 * WebView2 refused the last time this shell tried to serve files (see
 * `icons.rs`). Plain path segments stay readable in devtools too.
 */
const ASSET_ORIGIN = navigator.userAgent.includes("Windows")
  ? "http://boffasset.localhost"
  : "boffasset://localhost"

/**
 * The desktop `assetUrl`. The shared asset tree is addressed by root-relative
 * paths, which resolve against `tauri://localhost` here — where only what this
 * app ships is served — so everything else goes through the `boffasset://`
 * scheme, which serves it from an on-disk cache and fetches it once on first
 * sight (`src-tauri/src/tool_assets.rs`).
 *
 * Browser dev mode (`dev:renderer`) has no Rust side and therefore no scheme,
 * so there the path is left ROOT-RELATIVE and Vite's dev proxy forwards it to
 * the website (see `vite.config.ts`). It used to return the website's absolute
 * url instead, which is fine for an `<img>` and fatal for a `fetch()`:
 * boffmedia.es sends no `Access-Control-Allow-Origin`, so a tool that loads a
 * JSON dataset — Mewgenics loads 37 files — got nothing but "Failed to fetch".
 * Through the proxy the request is same-origin and CORS never enters into it.
 *
 * Anything already absolute (a `data:` url the shell produced, a CDN link)
 * passes through: a caller should not have to know which kind it is holding.
 */
function desktopAssetUrl(path: string): string {
  if (!path) return path
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return path
  if (isBundledAsset(path)) return path
  const rooted = path.startsWith("/") ? path : `/${path}`
  if (!isDesktop()) return rooted
  return `${ASSET_ORIGIN}${rooted}`
}

/**
 * The desktop `siteUrl`.
 *
 * Deliberately NOT `desktopAssetUrl`. That one answers "where are the bytes",
 * and here the answer is the `boffasset://` cache — an origin that only exists
 * inside this process. A share link built from it is dead the moment it is
 * pasted anywhere else, which is precisely what a share link is for. So this
 * one answers "where is this page on the website" and resolves against
 * `webBaseUrl()` in both modes.
 */
function desktopSiteUrl(path: string): string {
  if (!path) return path
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return path
  const rooted = path.startsWith("/") ? path : `/${path}`
  return `${webBaseUrl().replace(/\/$/, "")}${rooted}`
}

/**
 * The desktop `network`.
 *
 * `navigator.onLine` alone is not the truth a tool needs here: the launcher's
 * own probe knows whether api.boffmedia.es is ANSWERING, and "wifi is up, the
 * API is 502" is the case a player actually hits — it is what blanked the PMD
 * portraits, and it looks exactly like a working connection from inside a tool.
 * So the shell publishes its backend verdict here and the two are ANDed.
 *
 * A module-level signal rather than a React context, for the same reason
 * `setIconFailureSink` is one: the tool host is configured at import time,
 * before any provider exists, and `configureToolHost` cannot wait for React.
 */
let backendReachable = true
const networkListeners = new Set<(online: boolean) => void>()

/** Called by the shell whenever its backend probe changes verdict. */
export function setToolBackendReachable(reachable: boolean): void {
  if (reachable === backendReachable) return
  backendReachable = reachable
  const online = isToolNetworkOnline()
  for (const listener of networkListeners) listener(online)
  // The connection returning is the whole trigger for a replay, and no tool
  // needs to be on screen for it: the queue is Rust's, so a flush works while
  // the player is on Packs. Flushed for EVERY namespace, since one connection
  // coming back fixes all of them at once.
  if (online && isDesktop()) {
    void toolOutboxFlush().then((result) => {
      for (const namespace of outboxListeners.keys()) void announceOutbox(namespace)
      return result
    })
  }
}

function isToolNetworkOnline(): boolean {
  return backendReachable && (typeof navigator === "undefined" || navigator.onLine)
}

const desktopNetwork: ToolNetwork = {
  isOnline: isToolNetworkOnline,
  subscribe(listener) {
    networkListeners.add(listener)
    const relay = () => listener(isToolNetworkOnline())
    window.addEventListener("online", relay)
    window.addEventListener("offline", relay)
    return () => {
      networkListeners.delete(listener)
      window.removeEventListener("online", relay)
      window.removeEventListener("offline", relay)
    }
  },
}

/**
 * The desktop `data`: SQLite in Rust (`src-tauri/src/tool_db.rs`).
 *
 * Documents cross as JSON text, so this side is only encode/decode. A row whose
 * text will not parse is treated as absent rather than thrown: the store is a
 * cache of the player's own work, and one corrupt row must not take down the
 * screen that reads the other four hundred.
 */
function desktopDb(namespace: string): ToolDb {
  const decode = <T>(text: string | null): T | null => {
    if (text === null) return null
    try {
      return JSON.parse(text) as T
    } catch {
      return null
    }
  }
  return {
    async get<T>(collection: string, id: string) {
      return decode<T>(await toolDbGet(namespace, collection, id))
    },
    put(collection, id, value) {
      return toolDbPut(namespace, collection, id, JSON.stringify(value))
    },
    remove(collection, id) {
      return toolDbRemove(namespace, collection, id)
    },
    async list<T>(collection: string): Promise<Array<ToolDoc<T>>> {
      const rows = await toolDbList(namespace, collection)
      const out: Array<ToolDoc<T>> = []
      for (const row of rows) {
        const value = decode<T>(row.value)
        if (value !== null) out.push({ id: row.id, value, updatedAt: row.updatedAt })
      }
      return out
    },
    clear(collection) {
      return toolDbClear(namespace, collection)
    },
  }
}

/** Listeners per namespace, so a flush started by the shell still updates a
 *  tool that is on screen watching its own queue. */
const outboxListeners = new Map<string, Set<(pending: number) => void>>()

async function announceOutbox(namespace: string): Promise<void> {
  const listeners = outboxListeners.get(namespace)
  if (!listeners?.size) return
  const pending = (await toolOutboxPending(namespace)).length
  for (const listener of listeners) listener(pending)
}

function desktopOutbox(namespace: string): ToolOutbox {
  return {
    async enqueue(op: ToolOutboxOp) {
      const opId = await toolOutboxEnqueue({
        ns: namespace,
        method: op.method,
        path: op.path,
        body: op.body,
        dedupeKey: op.dedupeKey,
      })
      void announceOutbox(namespace)
      return opId
    },
    async pending(): Promise<ToolOutboxEntry[]> {
      const rows = await toolOutboxPending(namespace)
      return rows.map((row) => ({
        opId: row.opId,
        method: row.method as ToolOutboxOp["method"],
        path: row.path,
        body: row.body,
        dedupeKey: row.dedupeKey ?? undefined,
        createdAt: row.createdAt,
        attempts: row.attempts,
        lastError: row.lastError ?? null,
      }))
    },
    async flush() {
      const result = await toolOutboxFlush(namespace)
      void announceOutbox(namespace)
      return {
        sent: result.sent,
        rejected: result.rejected.map(({ opId, path, status, message }) => ({
          opId,
          path,
          status,
          message,
        })),
        remaining: result.remaining,
        stopped: result.stopped ?? null,
      }
    },
    subscribe(listener) {
      let listeners = outboxListeners.get(namespace)
      if (!listeners) {
        listeners = new Set()
        outboxListeners.set(namespace, listeners)
      }
      listeners.add(listener)
      void toolOutboxPending(namespace).then((rows) => listener(rows.length))
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

/** Browser dev mode has no Rust side, so it falls back to the IndexedDB
 *  implementation — every screen stays runnable in `dev:renderer`. */
const webData = createWebData(() => getToolHost().api)

const desktopData: ToolData = {
  db: (namespace) => (isDesktop() ? desktopDb(namespace) : webData.db(namespace)),
  outbox: (namespace) => (isDesktop() ? desktopOutbox(namespace) : webData.outbox(namespace)),
}

/**
 * Who the tools think is signed in.
 *
 * The shell owns the Boffmedia account (it is the principal the pack library
 * keys on), and it learns about it through a reducer — so this store is what
 * bridges React to a tool host configured at import time. `app.tsx` publishes
 * into it and registers the sign-in, which here is the device flow rather than
 * a route.
 */
let signInHandler: (() => void) | null = null

/** Registered by the shell, which owns the device flow. */
export function setToolSignIn(handler: (() => void) | null): void {
  signInHandler = handler
}

const toolSessionStore = createToolSession({
  signIn: () => signInHandler?.(),
})

/** Called by the shell whenever the Boffmedia account changes. `null` while the
 *  boot is still restoring a stored session — a tool must not draw the
 *  signed-out branch over a session that is about to arrive. */
export function setToolSessionAccount(user: ToolSessionUser | null, restoring = false): void {
  if (restoring) {
    toolSessionStore.publish({ status: "loading" })
    return
  }
  toolSessionStore.publish(
    user ? { status: "signed-in", user } : { status: "anonymous" },
  )
}

configureToolHost({
  // Browser dev mode (`dev:renderer`) has no Rust side, so it falls back to the
  // ordinary blob download — every tool screen stays browser-runnable.
  saveFile: (request) => (isDesktop() ? desktopSaveFile(request) : webSaveFile(request)),
  openUrl,
  storage: createWebStorage("boffmedia.tools"),
  // D7. Browser dev mode has no Rust side and no keychain, so it falls back to
  // an anonymous direct fetch — enough for the public tool endpoints, which is
  // what `dev:renderer` needs to stay useful.
  api: isDesktop() ? desktopApi : createWebApi(webModeApiBase()),
  assetUrl: desktopAssetUrl,
  siteUrl: desktopSiteUrl,
  network: desktopNetwork,
  data: desktopData,
  session: toolSessionStore.session,
})

// The Tools hub renders from the registry, so a domain package becomes visible
// by being registered here and nowhere else.
registerTools([...minecraftTools, ...mhwildsTools, ...pokemonTools, ...mewgenicsTools])

// Dev-only console handle for the capabilities: it exercises a capability
// directly, without having to drive a tool UI to the screen that happens to use
// it. Stripped from release bundles by the `import.meta.env.DEV` guard (Vite
// folds the constant, so the branch is dead code eliminated).
if (import.meta.env.DEV) {
  ;(window as unknown as { boffTools: unknown }).boffTools = {
    api: (path: string, init?: ToolApiRequest) => getToolHost().api.request(path, init),
    // The asset seam, exercisable without a tool that happens to show an image:
    // `assetUrl` says where a path resolves, `assetProbe` proves the bytes
    // actually arrive through it — which is the half that has silently failed
    // twice in this shell's history.
    assetUrl: (path: string) => getToolHost().assetUrl(path),
    assetProbe: (path: string) =>
      new Promise<{ src: string; ok: boolean; width: number }>((resolve) => {
        const src = getToolHost().assetUrl(path)
        const img = new Image()
        img.onload = () => resolve({ src, ok: true, width: img.naturalWidth })
        img.onerror = () => resolve({ src, ok: false, width: 0 })
        img.src = src
      }),
    host: () => getToolHost(),
    tools: () => listTools().map((t) => t.id),
    // The offline data seam, exercisable without a tool that writes yet.
    db: (ns: string) => getToolHost().data.db(ns),
    outbox: (ns: string) => getToolHost().data.outbox(ns),
    isDesktop,
  }
}
