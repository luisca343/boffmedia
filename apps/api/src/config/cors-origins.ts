/**
 * Origins allowed to READ responses from this API.
 *
 * Hoisted out of `bootstrap()` (2026-09-02) because the websocket gateways need
 * the same list. They used to declare `cors: true`, which is a wildcard and
 * bypasses `app.enableCors()` entirely — socket.io does its own CORS handling,
 * so the allowlist below never applied to `/battle` or `/showdown` at all.
 *
 * Kept split because an origin list is a capability list: any origin on it can
 * read authenticated responses, so a production list that admits localhost
 * extends that to any page running on any developer's machine.
 */
export const PUBLIC_ORIGINS = [
  'https://lizardon.es',
  'https://boffmedia.es',
  'https://ficuslab.es',
  'https://blog.ficuslab.es',
  // The packaged desktop app's webview. Its HTTP tool calls are proxied through
  // Rust — not a browser, no Origin header, never needed CORS — but a websocket
  // is opened by the webview ITSELF, so the origin is real and must be allowed
  // or the battle socket is refused in the shipped app. Windows serves the app
  // from `http://tauri.localhost`; macOS and Linux from `tauri://localhost`.
  'http://tauri.localhost',
  'tauri://localhost',
];

/**
 * Never reachable by a real user: hosts-file names, and the production box
 * addressed directly by IP over plaintext HTTP — which is why that one is here
 * rather than above, despite being the production machine.
 */
export const DEV_ONLY_ORIGINS = [
  'http://localhost:3000',
  // apps/desktop's renderer in browser mode (`pnpm --filter desktop
  // dev:renderer`, the port in tauri.conf.json's devUrl). The packaged app
  // never needs this — its tool calls are proxied through Rust, which is not a
  // browser and has no origin — but in dev the renderer IS a page, so every
  // API-backed tool is unusable there without it.
  'http://localhost:5273',
  'http://local.boffmedia.es',
  'http://smartrotom.local.boffmedia.es',
  'http://148.251.3.244:34333',
];

/** The list that applies for the current environment. */
export function allowedOrigins(isProduction: boolean): string[] {
  return isProduction ? [...PUBLIC_ORIGINS] : [...PUBLIC_ORIGINS, ...DEV_ONLY_ORIGINS];
}
