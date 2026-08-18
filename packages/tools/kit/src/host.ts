/**
 * The host contract every Boffmedia tool talks to, mirroring `configureUi()` in
 * `@boffmedia/ui`. A tool NEVER reaches for `next/*`, `@tauri-apps/*` or `fetch`
 * on its own — everything host-shaped goes through the capabilities configured
 * here, so the same tool code runs inside `apps/web` and `apps/launcher`.
 *
 * i18n is deliberately NOT part of this contract: tools keep riding on
 * `@boffmedia/ui`'s `configureUi()` (`useTranslate`/`useLocale`), which both
 * hosts already wire.
 */

/**
 * What a tool can hand to `saveFile`. A `ReadableStream` is the reason this
 * capability exists at all: a `.prefab` export can run to multiple GB, and the
 * launcher must stream it to disk in chunks rather than marshal it across the
 * Tauri IPC boundary as one message.
 */
export type SaveFileData = Blob | ArrayBuffer | Uint8Array | ReadableStream<Uint8Array>;

export interface SaveFileRequest {
  /** File name proposed to the user; the host may let them change it. */
  suggestedName: string;
  data: SaveFileData;
  /** Advisory only — web uses it for the blob type, native hosts ignore it. */
  mimeType?: string;
  /**
   * Extension filters for hosts with a native dialog, e.g.
   * `[{ name: "Structure", extensions: ["nbt", "schem"] }]`. Web ignores it.
   */
  filters?: Array<{ name: string; extensions: string[] }>;
}

export type SaveFileResult =
  /** `path` is only present on hosts with a real filesystem. */
  | { status: "saved"; path?: string }
  | { status: "cancelled" };

/**
 * Whether a call needs the player's Boffmedia session.
 *
 * `optional` is the DEFAULT and the important one: most tool endpoints are
 * `@Public()` (all of `/tools/mhwilds/*`, for instance), and D4 promises the
 * Tools section works with no account at all. An `optional` call therefore
 * attaches a session when one happens to exist — some endpoints personalise
 * their answer — and proceeds anonymously when it does not, instead of
 * failing closed.
 *
 * `required` is for the genuinely per-user calls (a saved collection, a
 * tracker) and fails fast with `needsSignin` rather than sending an anonymous
 * request the API will only reject.
 */
export type ToolApiAuth = "optional" | "required";

export interface ToolApiRequest {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
  /** Defaults to `"optional"` — see {@link ToolApiAuth}. */
  auth?: ToolApiAuth;
}

/**
 * What both hosts throw on a failed API call, so a tool can branch on the
 * failure without knowing which host it is running in. Without this the web
 * host threw a bare `Error` with the status stringified into the message and
 * the launcher threw Tauri's own error shape — nothing portable to catch.
 */
export class ToolApiError extends Error {
  /** HTTP status, or 0 when the request never got an answer. */
  readonly status: number;
  /** The session is gone or was rejected: the tool should offer sign-in. */
  readonly needsSignin: boolean;
  /**
   * Machine-readable cause where the host can tell one: `server_unreachable`
   * (never arrived) and `server_down` (5xx) mirror the codes the launcher
   * shell already switches on for its outage notice.
   */
  readonly code?: string;

  constructor(
    message: string,
    options: { status?: number; needsSignin?: boolean; code?: string } = {},
  ) {
    super(message);
    this.name = "ToolApiError";
    this.status = options.status ?? 0;
    this.needsSignin = options.needsSignin ?? false;
    this.code = options.code;
  }
}

/**
 * D7 — the API seam. Web resolves this to a plain `fetch` against the public
 * API; the launcher routes it through an authenticated Rust proxy (the browser
 * cannot reach the OS keychain where its session JWT lives, and the webview
 * has no cookie for the API origin). Tools that need it must declare `api` in
 * `requiredCapabilities` so a host lacking it can hide them instead of
 * crashing at click time.
 *
 * Both hosts return the API's response body VERBATIM — envelope
 * (`{ success, statusCode, data }`) included — so tool code sees one shape
 * regardless of host, and both throw {@link ToolApiError} on failure.
 */
export interface ToolApi {
  /** Path is relative to the host's API root, e.g. `/scrape/myrient`. */
  request<T = unknown>(path: string, init?: ToolApiRequest): Promise<T>;
}

/**
 * KV seam. Kept even though Dexie/IndexedDB works in WebView2, because the
 * desktop host may later want these bytes under the launcher's profile
 * directory rather than inside the webview's origin storage.
 */
export interface ToolStorage {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface ToolHost {
  saveFile(request: SaveFileRequest): Promise<SaveFileResult>;
  /** Open a URL in the system browser (the launcher already does this). */
  openUrl(url: string): Promise<void> | void;
  storage: ToolStorage;
  api: ToolApi;
}

export type ToolCapability = keyof ToolHost;

let host: ToolHost | null = null;

/** Called once at host bootstrap, before any tool renders. */
export function configureToolHost(next: ToolHost): void {
  host = next;
}

export function getToolHost(): ToolHost {
  if (!host) {
    throw new Error(
      "@boffmedia/tool-kit: configureToolHost() was never called. " +
        "The host must configure its capabilities before rendering a tool.",
    );
  }
  return host;
}

/** Non-throwing probe, for registry filtering and feature gating. */
export function hasToolHost(): boolean {
  return host !== null;
}

export function saveFile(request: SaveFileRequest): Promise<SaveFileResult> {
  return getToolHost().saveFile(request);
}

export function openUrl(url: string): Promise<void> | void {
  return getToolHost().openUrl(url);
}

export function toolStorage(): ToolStorage {
  return getToolHost().storage;
}

export function toolApi(): ToolApi {
  return getToolHost().api;
}
