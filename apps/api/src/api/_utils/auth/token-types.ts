/**
 * The `typ` claim every Boffmedia-signed JWT carries. One secret signs all of
 * them, so the claim is the only thing keeping a token minted for one surface
 * from being replayed against another.
 *
 * `access` is encoded as the *absence* of `typ` for website sessions, so a
 * token carrying no `typ` at all is an access token and nothing else.
 */
export const TOKEN_TYPE = {
  /** Website session. Full account powers. Serialized as no `typ` claim. */
  ACCESS: 'access',
  /** Website refresh token. Only `/auth/refresh` accepts it. */
  REFRESH: 'refresh',
  /** Desktop app session (30 d). Only DesktopAuthGuard accepts it. */
  DESKTOP: 'desktop',
  /**
   * In-game MCEF session, minted only by `/auth/minecraft/session` once Mojang
   * has confirmed the join via hasJoined. The identity behind it is therefore
   * proven, but proving a Minecraft identity is still not the same as signing
   * in to the website, so the scope stays narrow. Reaches the Rotom-phone
   * surface but is refused by every account-sensitive route (FullSessionGuard)
   * so a hijacked one cannot take the account over.
   */
  INGAME: 'ingame',
} as const;

export type TokenType = (typeof TOKEN_TYPE)[keyof typeof TOKEN_TYPE];

/** Token types that may authenticate a normal website API request. */
export const WEBSITE_TOKEN_TYPES: readonly TokenType[] = [
  TOKEN_TYPE.ACCESS,
  TOKEN_TYPE.INGAME,
];

/** Reads the claim back, mapping the legacy no-`typ` shape to `access`. */
export const tokenTypeOf = (payload: { typ?: string }): string =>
  payload.typ ?? TOKEN_TYPE.ACCESS;
