/**
 * Browser-only default capability implementations. `apps/web` wires these
 * verbatim; the launcher uses them as its dev-mode (`dev:renderer`) fallback so
 * every screen stays browser-runnable without Tauri.
 *
 * Nothing here imports `next/*` — this is plain DOM code.
 */

import { createWebData } from "./web-data";
import { createToolSession } from "./session";
import type { ToolSession } from "./session";
import { ToolApiError } from "./host";
import type {
  SaveFileData,
  SaveFileRequest,
  SaveFileResult,
  ToolApi,
  ToolApiRequest,
  ToolHost,
  ToolNetwork,
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

/**
 * Pull the most human sentence out of an API error body, mirroring the Rust
 * `error_message`: `userMessage` is the only field the API marks as safe to
 * show verbatim, and `message` is developer text used solely so a failure is
 * never a blank dialog.
 */
async function errorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { userMessage?: string; message?: unknown };
    if (typeof body.userMessage === "string" && body.userMessage) return body.userMessage;
    if (typeof body.message === "string" && body.message) return body.message;
    // class-validator returns an array of strings for a 400.
    if (Array.isArray(body.message)) {
      const first = body.message.find((entry) => typeof entry === "string");
      if (typeof first === "string") return first;
    }
  } catch {
    // A non-JSON body (a gateway's HTML error page) tells us nothing useful.
  }
  return fallback;
}

/** Direct `fetch` against the public API — what the web tools do today. */
export function createWebApi(baseUrl: string): ToolApi {
  return {
    async request<T>(path: string, init?: ToolApiRequest): Promise<T> {
      const method = init?.method ?? "GET";
      // `new URL()` REJECTS a relative base outright, and "/api" — this
      // capability's own default — is exactly that. Resolve it against the
      // page origin first so a same-origin base works instead of throwing a
      // raw TypeError before the request is ever sent.
      const root = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
      const base = /^[a-z][a-z0-9+.-]*:/i.test(root)
        ? root
        : new URL(root, window.location.origin).toString();
      const url = new URL(path.replace(/^\//, ""), base);
      for (const [key, value] of Object.entries(init?.query ?? {})) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }

      let response: Response;
      try {
        response = await fetch(url, {
          method,
          headers: init?.body === undefined ? undefined : { "content-type": "application/json" },
          body: init?.body === undefined ? undefined : JSON.stringify(init.body),
          signal: init?.signal,
          // NOT `credentials: "include"`. The API is a different origin and its
          // `enableCors()` (apps/api/src/main.ts) sends no
          // `Access-Control-Allow-Credentials`, so "include" made the browser
          // block every response — a 200 on the wire, "Failed to fetch" in the
          // page. Nothing is lost: the web session is a NextAuth Bearer JWT,
          // not a cookie on the API origin, and the launcher does not come
          // through here at all — it proxies through Rust precisely because
          // its webview has no such cookie either.
        });
      } catch (err) {
        // An AbortError is the caller's own doing — it must stay an
        // AbortError so `signal`-based cancellation is not reported as an
        // outage the tool then shows the player.
        if (err instanceof DOMException && err.name === "AbortError") throw err;
        throw new ToolApiError(err instanceof Error ? err.message : `${method} ${path} failed`, {
          code: "server_unreachable",
        });
      }

      if (!response.ok) {
        throw new ToolApiError(
          await errorMessage(response, `${method} ${url.pathname} failed: ${response.status}`),
          {
            status: response.status,
            needsSignin: response.status === 401,
            code: response.status >= 500 ? "server_down" : undefined,
          },
        );
      }
      return (await response.json()) as T;
    },
  };
}

/**
 * The browser's own view of connectivity.
 *
 * `navigator.onLine` is famously weak — it reports a link, not reachability, so
 * a captive portal or a dead upstream still reads as online. It is kept anyway
 * because the failure it DOES catch (the laptop's wifi is off) is the common
 * one, and because a false "online" costs a failed request the tool already
 * handles, while a false "offline" would hide a working tool behind a notice.
 * The desktop host layers the API's real reachability on top of this.
 */
export function createWebNetwork(): ToolNetwork {
  return {
    isOnline: () => (typeof navigator === "undefined" ? true : navigator.onLine),
    subscribe(listener) {
      const online = () => listener(true);
      const offline = () => listener(false);
      window.addEventListener("online", online);
      window.addEventListener("offline", offline);
      return () => {
        window.removeEventListener("online", online);
        window.removeEventListener("offline", offline);
      };
    },
  };
}

/**
 * The web's `assetUrl`: the identity. apps/web serves the asset tree itself, so
 * a root-relative path already points at it and rewriting it to an absolute url
 * would only break local development against a different port.
 */
export function webAssetUrl(path: string): string {
  return path;
}

/**
 * The web's `siteUrl`: also the identity, and for the same reason — the page
 * the tool is rendering in IS the public site, so a root-relative path is
 * already a link someone else can open. Only the desktop host has to do work.
 */
export function webSiteUrl(path: string): string {
  return path;
}

/**
 * Convenience for hosts that want every browser default at once.
 *
 * `session` has no browser default worth inventing — who is signed in is the
 * host's own business (next-auth here, the device flow in the app) — so a host
 * with accounts passes its own store. The fallback reports `anonymous` and
 * offers no sign-in, which is the truth for a host that has no accounts and
 * keeps every tool rendering rather than throwing.
 */
export function createWebToolHost(options?: {
  apiBaseUrl?: string;
  session?: ToolSession;
}): ToolHost {
  const api = createWebApi(options?.apiBaseUrl ?? "/api");
  const fallback = createToolSession({ signIn: () => {} });
  fallback.publish({ status: "anonymous" });
  return {
    saveFile: webSaveFile,
    openUrl: webOpenUrl,
    storage: createWebStorage(),
    api,
    assetUrl: webAssetUrl,
    siteUrl: webSiteUrl,
    network: createWebNetwork(),
    // The queue replays through the same `api` this host uses, so a flush is
    // subject to exactly the auth and error handling every other call is.
    data: createWebData(() => api),
    session: options?.session ?? fallback.session,
  };
}
