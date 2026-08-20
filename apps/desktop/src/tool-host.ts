// Wires @boffmedia/tool-kit's capability contract to the launcher's runtime.
// This is the launcher's half of the seam that lets the SAME tool code render
// in apps/web and here (plan §3, "Host contract").
//
// Import-time side effect, exactly like `./i18n` — call it once at bootstrap,
// before any tool renders.

// The MANIFEST module, not the package barrel: the barrel eagerly re-exports
// the tool components and the schematic UI kit, which drags three.js into the
// startup chunk. `./tools` only holds the declarative manifests plus their
// `lazy()` component references, so the heavy code stays behind the split.
import { minecraftTools } from "@boffmedia/tools-minecraft/tools"
import { mhwildsTools } from "@boffmedia/tools-mhwilds/tools"
import {
  configureToolHost,
  createWebApi,
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
  type ToolApiRequest,
} from "@boffmedia/tool-kit"

import { isDesktop, openUrl, saveStream, saveDialog, toolApiRequest } from "./runtime"

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

configureToolHost({
  // Browser dev mode (`dev:renderer`) has no Rust side, so it falls back to the
  // ordinary blob download — every tool screen stays browser-runnable.
  saveFile: (request) => (isDesktop() ? desktopSaveFile(request) : webSaveFile(request)),
  openUrl,
  storage: createWebStorage("boffmedia.tools"),
  // D7. Browser dev mode has no Rust side and no keychain, so it falls back to
  // an anonymous direct fetch — enough for the public tool endpoints, which is
  // what `dev:renderer` needs to stay useful.
  api: isDesktop()
    ? desktopApi
    : createWebApi(import.meta.env.VITE_API_URL ?? "https://api.boffmedia.es"),
})

// D6 — the Tools hub renders from the registry, so a domain package becomes
// visible by being registered here and nowhere else.
registerTools([...minecraftTools, ...mhwildsTools])

// Dev-only console handle for the capabilities: it exercises a capability
// directly, without having to drive a tool UI to the screen that happens to use
// it. Stripped from release bundles by the `import.meta.env.DEV` guard (Vite
// folds the constant, so the branch is dead code eliminated).
if (import.meta.env.DEV) {
  ;(window as unknown as { boffTools: unknown }).boffTools = {
    api: (path: string, init?: ToolApiRequest) => getToolHost().api.request(path, init),
    host: () => getToolHost(),
    tools: () => listTools().map((t) => t.id),
    isDesktop,
  }
}
