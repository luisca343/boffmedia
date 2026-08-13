/**
 * Browser-only default capability implementations. `apps/web` wires these
 * verbatim; the launcher uses them as its dev-mode (`dev:renderer`) fallback so
 * every screen stays browser-runnable without Tauri.
 *
 * Nothing here imports `next/*` — this is plain DOM code.
 */

import type {
  SaveFileData,
  SaveFileRequest,
  SaveFileResult,
  ToolApi,
  ToolHost,
  ToolStorage,
} from "./host";

async function toBlob(data: SaveFileData, mimeType?: string): Promise<Blob> {
  const type = mimeType ?? "application/octet-stream";
  if (data instanceof Blob) return data;
  if (data instanceof Uint8Array) {
    // Copy through a fresh ArrayBuffer: a Uint8Array may be a view over a
    // larger (possibly shared) buffer, and Blob would otherwise take the whole
    // thing rather than just this view's bytes.
    return new Blob([data.slice()], { type });
  }
  if (data instanceof ArrayBuffer) return new Blob([data], { type });
  // ReadableStream — buffer it. On the web there is nowhere to stream TO, which
  // is exactly why the launcher implements this capability natively instead.
  const reader = data.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return new Blob(chunks as BlobPart[], { type });
}

/** Anchor-click download — the behaviour the web tools have always had. */
export async function webSaveFile(request: SaveFileRequest): Promise<SaveFileResult> {
  const blob = await toBlob(request.data, request.mimeType);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = request.suggestedName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoking immediately can abort the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  // A browser download is fire-and-forget: there is no cancel signal to observe.
  return { status: "saved" };
}

export function webOpenUrl(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

/** `localStorage`-backed KV. Tools needing bulk storage use Dexie directly. */
export function createWebStorage(namespace = "boffmedia.tools"): ToolStorage {
  const scoped = (key: string) => `${namespace}:${key}`;
  return {
    async get<T>(key: string): Promise<T | null> {
      try {
        const raw = window.localStorage.getItem(scoped(key));
        return raw === null ? null : (JSON.parse(raw) as T);
      } catch {
        // Private-mode quota errors and corrupt JSON both mean "no value".
        return null;
      }
    },
    async set(key: string, value: unknown): Promise<void> {
      window.localStorage.setItem(scoped(key), JSON.stringify(value));
    },
    async remove(key: string): Promise<void> {
      window.localStorage.removeItem(scoped(key));
    },
  };
}

/** Direct `fetch` against the public API — what the web tools do today. */
export function createWebApi(baseUrl: string): ToolApi {
  return {
    async request<T>(
      path: string,
      init?: {
        method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
        body?: unknown;
        query?: Record<string, string | number | boolean | undefined>;
        signal?: AbortSignal;
      },
    ): Promise<T> {
      const url = new URL(path.replace(/^\//, ""), baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
      for (const [key, value] of Object.entries(init?.query ?? {})) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
      const response = await fetch(url, {
        method: init?.method ?? "GET",
        headers: init?.body === undefined ? undefined : { "content-type": "application/json" },
        body: init?.body === undefined ? undefined : JSON.stringify(init.body),
        signal: init?.signal,
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`${init?.method ?? "GET"} ${url.pathname} failed: ${response.status}`);
      }
      return (await response.json()) as T;
    },
  };
}

/** Convenience for hosts that want every browser default at once. */
export function createWebToolHost(options?: { apiBaseUrl?: string }): ToolHost {
  return {
    saveFile: webSaveFile,
    openUrl: webOpenUrl,
    storage: createWebStorage(),
    api: createWebApi(options?.apiBaseUrl ?? "/api"),
  };
}
