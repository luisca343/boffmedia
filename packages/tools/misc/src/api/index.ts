/**
 * Every server call these five tools make, expressed against the host contract
 * instead of against `apps/web`'s `ScrapeService` / `boffAPI`.
 *
 * The rewrite is not cosmetic. Those web services read `env.NEXT_PUBLIC_API`
 * and call `fetch` directly, neither of which exists in the launcher: its
 * session is a JWT in the OS credential store that JavaScript deliberately
 * cannot read, so its requests are proxied through Rust. Going through
 * `toolApi()` is what lets one copy of the tool code run in both.
 *
 * Paths are kept BYTE-IDENTICAL to the web originals. They are the contract
 * with `apps/api`, and a port is not the moment to renegotiate it.
 */

import { toolApi, apiUrl, ToolApiError } from "@boffmedia/tool-kit";
import type {
  LocalGamesResult,
  CatalogSearchResult,
  CatalogSearchConsoleResult,
  SearchLocalGamesResult,
  SearchConsoleResult,
  BulkDownloadResult,
} from "@boffmedia/shared";

export type {
  LocalGamesResult,
  CatalogSearchResult,
  CatalogSearchConsoleResult,
  SearchLocalGamesResult,
  SearchConsoleResult,
  BulkDownloadResult,
};

const SCRAPE = "/boffmedia/herramientas/scrape/myrient";

/**
 * The API's global response envelope, as `@/services/boffAPI` declared it.
 *
 * Which calls carry it is NOT a style choice, it is per-controller: the scrape
 * routes below go through the envelope interceptor, while `AppController` — the
 * three Steam routes at the bottom of this file — is `@SkipEnvelope()` and
 * answers raw. Getting this backwards type-checks perfectly and then reads
 * `undefined` off an envelope at runtime, so the two halves of this file
 * deliberately have different return shapes.
 */
export interface ApiResponse<T = unknown> {
  statusCode: number;
  /** Machine text (English) for logs — never render it to users. */
  message?: string;
  /** Explicitly user-facing; safe to render. */
  userMessage?: string;
  code?: string;
  data?: T;
  error?: string;
  success: boolean;
}

/**
 * A scrape GET, keeping the envelope AND the NON-throwing contract `apiGET` had.
 *
 * The capability throws `ToolApiError`; turning that back into a failed
 * envelope here is what let every call site move across unchanged, since each
 * was written as `if (!res.success || !res.data) …`. Same shape as
 * `@boffmedia/tools-mhwilds`' service, for the same reason.
 */
async function scrapeGet<T>(
  path: string,
  query?: Record<string, string>,
): Promise<ApiResponse<T>> {
  try {
    // The capability returns the body verbatim, envelope included, so the
    // response IS an ApiResponse already.
    return await toolApi().request<ApiResponse<T>>(path, { query });
  } catch (err) {
    if (err instanceof ToolApiError) {
      return { success: false, statusCode: err.status, error: err.message };
    }
    return {
      success: false,
      statusCode: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── Myrient / Biblioteca ────────────────────────────────────────────────────

export interface GameFileEntry {
  name: string;
  link: string;
  size: string;
}

export interface CatalogResult {
  count: number;
  totalSize: string;
  totalSizeBytes: number;
  files: GameFileEntry[];
}

export type FileDownloadStatus =
  | "pending"
  | "downloading"
  | "downloaded"
  | "skipped"
  | "failed";

export interface FileDownloadEntry {
  filename: string;
  status: FileDownloadStatus;
  size?: string;
  sizeBytes?: number;
  error?: string;
}

/** The frames `download-selected/stream` emits, in order: one `start`, many
 *  `progress`, one `done`. */
export type SseStartEvent = { type: "start"; total: number };
export type SseProgressEvent = {
  type: "progress";
  index: number;
  total: number;
} & FileDownloadEntry;
export type SseDoneEvent = { type: "done" } & Omit<
  BulkDownloadResult,
  "files" | "regions" | "totalMatched"
>;
export type SseEvent = SseStartEvent | SseProgressEvent | SseDoneEvent;

/** `regions` is omitted rather than sent empty — the API treats an absent
 *  parameter as "no filter" and an empty one as "match nothing". */
const withRegions = (
  query: Record<string, string>,
  regions?: string[],
): Record<string, string> =>
  regions?.length ? { ...query, regions: regions.join(",") } : query;

/** Games already mirrored to the server's own library. */
export function getLocalGames(consoleKey: string, regions?: string[]) {
  return scrapeGet<LocalGamesResult>(`${SCRAPE}/local`, withRegions({ console: consoleKey }, regions));
}

export function searchLocalGames(query: string, regions?: string[]) {
  return scrapeGet<SearchLocalGamesResult>(`${SCRAPE}/search`, withRegions({ q: query }, regions));
}

/** The remote Myrient catalogue — what COULD be fetched, not what is held. */
export function getCatalog(consoleKey: string, regions?: string[]) {
  return scrapeGet<CatalogResult>(`${SCRAPE}/catalog`, withRegions({ console: consoleKey }, regions));
}

export function searchCatalog(query: string, regions?: string[]) {
  return scrapeGet<CatalogSearchResult>(`${SCRAPE}/catalog/search`, withRegions({ q: query }, regions));
}

/**
 * An absolute, openable URL for one file in the server's library.
 *
 * `apiUrl` and not `request`: the endpoint answers with a
 * `Content-Disposition: attachment` of a file that can run to several GB, so it
 * is handed to the host to OPEN — the browser's own download on the web, the
 * system browser in the launcher — rather than pulled through a JSON call that
 * would hold the whole thing in memory first.
 */
export function serveFileUrl(consoleKey: string, filename: string): string {
  const query = new URLSearchParams({ console: consoleKey, filename });
  return apiUrl(`${SCRAPE}/serve-file?${query}`);
}

/**
 * Ask the server to fetch a selection into its library, and follow the job.
 *
 * The answer arrives as SSE frames over minutes or hours, which is why this
 * takes the stream seam rather than `request`.
 */
export function streamDownloadSelected(
  dto: { console: string; games: GameFileEntry[]; concurrency?: number },
  onEvent: (event: SseEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  return toolApi().stream<SseEvent>(`${SCRAPE}/download-selected/stream`, {
    method: "POST",
    body: dto,
    signal,
    onMessage: onEvent,
  });
}

// ── Steam ───────────────────────────────────────────────────────────────────
//
// These three answer RAW: `AppController` in apps/api carries a class-level
// `@SkipEnvelope()`, so there is no `{ success, data }` to unwrap and no
// non-throwing wrapper — a failure here throws `ToolApiError`, which is what
// the call sites already expected from `apiGET` against this controller.

/**
 * The Steam key inventory. BOFF_ADMIN only — the API refuses everyone else, and
 * the manifest's `requiredRoles` is what keeps the tile out of a hub where it
 * would only ever 403.
 *
 * `auth: "required"` so a signed-out caller is told to sign in instead of
 * sending an anonymous request purely to be handed the rejection back.
 */
export function getSteamKeys<T = unknown>() {
  return toolApi().request<T>("/steamkeys", { auth: "required" });
}

/** Store metadata for one app id. Public: Steam Free needs it too. */
export function getSteamData<T = unknown>(steamId: string) {
  return toolApi().request<T>(`/steamdata/${steamId}`);
}

/** Games Steam is giving away right now. `lang` is the viewer's locale — the
 *  API localises the store copy, so this is part of the request, not of the
 *  rendering. */
export function getSteamFreeGames<T = unknown>(lang?: string) {
  return toolApi().request<T>("/steamfree", {
    query: lang ? { lang } : undefined,
  });
}
