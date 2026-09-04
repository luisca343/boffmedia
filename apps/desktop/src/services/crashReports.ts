/**
 * Crash reporting for the renderer — OPT-IN, and off until the player says so.
 *
 * Three gates, and all three must be open before a single byte leaves the
 * machine:
 *   1. a DSN baked in at build time (`VITE_SENTRY_DSN`). A build without one
 *      never imports the SDK at all, which is what makes `dev:renderer` and any
 *      fork's build carry no reporting and no warning about it.
 *   2. the player's `crashReports` setting, default false, persisted in
 *      settings.json next to every other preference (see settings.rs).
 *   3. `beforeSend`, which drops the event outright while the setting is off
 *      and scrubs it when it is on.
 *
 * Gate 2 is checked inside `beforeSend` rather than only at load time so that
 * turning the toggle OFF stops reporting immediately: the SDK cannot be
 * un-initialised once loaded, and "it stops at the next restart" is not what
 * the switch in Ajustes says.
 *
 * Deliberately NOT in `@boffmedia/ui` (which must stay host-agnostic) and it
 * imports no `@tauri-apps/*` — `runtime.ts` owns that boundary, and this module
 * has to keep working in `dev:renderer`, where there is no shell at all.
 */

const DSN = (import.meta.env?.VITE_SENTRY_DSN as string | undefined)?.trim()

/** What a Sentry event looks like from the outside — see the note on the dynamic import below. */
interface ScrubbableEvent {
  user?: Record<string, unknown> | null
  request?: Record<string, unknown> | null
  server_name?: unknown
  [k: string]: unknown
}

interface SentryLike {
  init(options: Record<string, unknown>): void
  captureException(exception: unknown): string
}

const REDACTED = "[redacted]"

/** Keys whose value is dropped whole. Substring match, case-insensitive. */
const SENSITIVE_KEY =
  /authorization|cookie|token|secret|password|passwd|api[-_]?key|jwt|session|credential|dsn|email|correo|uuid|access[-_]?token|refresh/i

const VALUE_PATTERNS: readonly RegExp[] = [
  // Email addresses — the Boffmedia account login.
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi,
  // Boffmedia session JWTs, which reach the renderer on the sign-in path.
  /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\b/g,
  // Minecraft UUIDs: the dashed form and the undashed 32-hex one Mojang uses.
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
  /\b[0-9a-f]{32}\b/gi,
  // IPv4 with an optional port — pack server addresses a player has typed in.
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d{1,5})?\b/g,
]

/**
 * The leak that is specific to a desktop app and does not exist on the web: a
 * file path contains the OS account name. `C:\Users\luisca\AppData\...` names
 * the person as surely as their email does, and half the error strings the
 * Rust side produces are paths.
 */
const HOME_PATHS: readonly RegExp[] = [
  /([A-Za-z]:\\Users\\)[^\\/:*?"<>|\r\n]+/g,
  /(\/Users\/)[^/\s]+/g,
  /(\/home\/)[^/\s]+/g,
]

const MAX_DEPTH = 8
const MAX_STRING = 20000

function scrubString(value: string): string {
  let out = value.length > MAX_STRING ? value.slice(0, MAX_STRING) + "…" : value
  for (const pattern of HOME_PATHS) out = out.replace(pattern, `$1${REDACTED}`)
  for (const pattern of VALUE_PATTERNS) out = out.replace(pattern, REDACTED)
  return out
}

function scrubValue(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (typeof value === "string") return scrubString(value)
  if (value === null || typeof value !== "object") return value
  if (depth >= MAX_DEPTH) return REDACTED
  if (seen.has(value)) return REDACTED
  seen.add(value)

  if (Array.isArray(value)) return value.map((v) => scrubValue(v, depth + 1, seen))

  const out: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SENSITIVE_KEY.test(key) ? REDACTED : scrubValue(item, depth + 1, seen)
  }
  return out
}

/**
 * The `beforeSend` hook: the last thing that runs before an event would leave.
 * Returns `null` to drop it — which is also how the opt-out is enforced.
 *
 * Exported for its unit test; nothing else should call it.
 */
export function scrubDesktopEvent<T extends ScrubbableEvent>(event: T): T | null {
  if (!event || typeof event !== "object") return null

  // There is no Boffmedia account identifier worth keeping here. The two things
  // Sentry would put in `user` are the email and the Minecraft UUID, which are
  // exactly the two we are trying not to send.
  delete event.user
  delete event.request
  // The hostname of a home PC is very often the owner's name.
  delete event.server_name

  return scrubValue(event, 0, new WeakSet()) as T
}

// ── Wiring ──────────────────────────────────────────────────────────────────

let enabled = false
let loading: Promise<SentryLike | null> | null = null

function load(): Promise<SentryLike | null> {
  if (loading) return loading
  loading = (async () => {
    try {
      // @ts-ignore -- @sentry/browser is declared in package.json but the
      // renderer has to keep type-checking on a checkout where the install has
      // not run. `@ts-expect-error` would be wrong: it inverts into an error
      // the moment the package IS installed.
      const mod = (await import("@sentry/browser")) as SentryLike
      mod.init({
        dsn: DSN,
        release: `boffmedia-app@${import.meta.env?.VITE_APP_VERSION ?? "dev"}`,
        // Release correlation needs the platform too: the same version behaves
        // differently on WebView2 and WebKitGTK, and a crash that only happens
        // on one of them is unreadable without knowing which.
        initialScope: {
          tags: { surface: "renderer", platform: guessPlatform() },
        },
        tracesSampleRate: 0,
        sendDefaultPii: false,
        beforeSend: (event: ScrubbableEvent) =>
          enabled ? scrubDesktopEvent(event) : null,
        beforeBreadcrumb: (breadcrumb: ScrubbableEvent) =>
          enabled ? scrubDesktopEvent(breadcrumb) : null,
      })
      return mod
    } catch {
      // A DSN was baked in but the package is missing: a packaging mistake, not
      // a reason to take the app down on the player.
      console.warn("[crash-reports] @sentry/browser is not installed — reporting is off.")
      return null
    }
  })()
  return loading
}

/** Coarse and deliberately not `navigator.userAgentData` — this is a tag, not a fingerprint. */
function guessPlatform(): string {
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent
  if (/Windows/i.test(ua)) return "windows"
  if (/Mac OS X|Macintosh/i.test(ua)) return "macos"
  if (/Linux/i.test(ua)) return "linux"
  return "unknown"
}

/**
 * Apply the player's choice. Called once when settings load and again the
 * moment the toggle moves — not on the debounced save, because switching
 * reporting OFF has to take effect immediately, not 300 ms later.
 *
 * A no-op when no DSN was baked in, so `dev:renderer` and any build without one
 * never load the SDK.
 */
export function setCrashReporting(on: boolean): void {
  enabled = on
  if (!DSN || !on) return
  void load()
}

/** Report an error the app handled itself. No-op unless the player opted in. */
export function reportDesktopError(error: unknown): void {
  if (!DSN || !enabled) return
  void load().then((mod) => mod?.captureException(error))
}
