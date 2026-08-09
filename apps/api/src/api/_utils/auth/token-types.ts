/**
 * The `typ` claim every Boffmedia-signed JWT carries. One secret signs all of
 * them, so the claim is the only thing keeping a token minted for one surface
 * from being replayed against another.
 *
 * `access` is encoded as the *absence* of `typ` for website sessions: tokens
 * issued before this claim existed must keep working until they expire.
 */
export const TOKEN_TYPE = {
  /** Website session. Full account powers. Serialized as no `typ` claim. */
  ACCESS: 'access',
  /** Website refresh token. Only `/auth/refresh` accepts it. */
  REFRESH: 'refresh',
  /** Launcher session (30 d). Only LauncherAuthGuard accepts it. */
  LAUNCHER: 'launcher',
  /**
   * In-game MCEF session minted by `/auth/loginmc`, whose only proof of
   * identity is the non-secret `MC_WORLD` string. Reaches the Rotom-phone
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
