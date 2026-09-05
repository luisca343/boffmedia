import { SetMetadata } from '@nestjs/common';
import { TOKEN_TYPE, type TokenType } from '@api/_utils/auth/token-types';

/**
 * The three clients that can hold a Boffmedia session, named the way the rest
 * of the codebase names them: `web` is the website, `desktop` is the app's own
 * session (see the app/desktop/launcher split in CLAUDE.md), `ingame` is the
 * MCEF webview inside Minecraft.
 *
 * This is the *caller* axis, deliberately separate from the role axis
 * (`@Roles`) and from the freshness axis (`FullSessionGuard`, `StepUpGuard`):
 * "which program is holding this token" is not the same question as "what may
 * this human do".
 */
export const CLIENT = {
  WEB: 'web',
  DESKTOP: 'desktop',
  INGAME: 'ingame',
} as const;

export type Client = (typeof CLIENT)[keyof typeof CLIENT];

export const CLIENTS_KEY = 'allowedClients';

/**
 * Declares which clients may call a route (or a whole controller).
 *
 *   @Clients(CLIENT.DESKTOP)              // launcher-only
 *   @Clients(CLIENT.WEB, CLIENT.DESKTOP)  // reachable from both
 *
 * Enforced by the global `ClientsGuard`. A route that declares nothing gets
 * `DEFAULT_CLIENTS` — see the guard for why that default is what it is.
 */
export const Clients = (...clients: Client[]) =>
  SetMetadata(CLIENTS_KEY, clients);

/**
 * What an UNDECORATED route accepts: the website and the in-game webview, i.e.
 * exactly `WEBSITE_TOKEN_TYPES`.
 *
 * This is the default because it is what the API already enforces, not a
 * guess: an undecorated route is authenticated by the global `JwtAuthGuard`,
 * whose strategy refuses any `typ` outside `WEBSITE_TOKEN_TYPES`. A desktop
 * session can therefore only ever reach a route that opts in with an explicit
 * `DesktopAuthGuard` / `DesktopOrUserAuthGuard`, so making desktop opt-in here
 * costs nothing and states the model instead of leaving it implied.
 *
 * The alternative default — "any client" — would have preserved the same
 * behaviour while declaring nothing, and "web only" would have silently broken
 * every SmartRotom route the Rotom phone calls.
 */
export const DEFAULT_CLIENTS: readonly Client[] = [CLIENT.WEB, CLIENT.INGAME];

/**
 * Maps a token's `typ` claim onto the client that holds it.
 *
 * `launcher` is the desktop app: the wire value predates the app/desktop naming
 * split and is still what `PacksAuthService` signs, so it must NOT be renamed —
 * 30-day sessions are in the field carrying it. `TOKEN_TYPE.DESKTOP` ('desktop')
 * is the name the model uses; this table is the one place the two meet.
 *
 * `refresh` and `mfa` are not clients — they authenticate one endpoint each and
 * are already refused everywhere else — so they map to nothing and the guard
 * lets their own endpoints answer.
 */
export const CLIENT_BY_TOKEN_TYPE: Readonly<Record<string, Client>> = {
  [TOKEN_TYPE.ACCESS]: CLIENT.WEB,
  [TOKEN_TYPE.INGAME]: CLIENT.INGAME,
  [TOKEN_TYPE.DESKTOP]: CLIENT.DESKTOP,
  launcher: CLIENT.DESKTOP,
};

/** Narrow a raw `typ` claim to the client that holds it, if any. */
export const clientOfTokenType = (
  typ: TokenType | string,
): Client | undefined => CLIENT_BY_TOKEN_TYPE[typ];
