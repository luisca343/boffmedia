// Minimal Discord OAuth2 helper for *profile linking* (attach a Discord id to
// the already-logged-in account, regardless of email). This is separate from
// Discord *login* (NextAuth's DiscordProvider, which merges by email): linking
// must preserve the current session, so it runs its own code exchange and only
// asks for the `identify` scope.

const DISCORD_API = "https://discord.com/api";

export function buildDiscordAuthUrl(
  clientId: string,
  redirectUri: string,
  state: string,
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify",
    state,
    prompt: "consent",
  });
  return `${DISCORD_API}/oauth2/authorize?${params.toString()}`;
}

/** Exchange the auth code for an access token. Returns null on failure. */
export async function exchangeDiscordCode(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string,
): Promise<string | null> {
  try {
    const res = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }).toString(),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { access_token?: string };
    return json.access_token ?? null;
  } catch (error) {
    console.error("Discord token exchange failed:", error);
    return null;
  }
}

/** Resolve the Discord snowflake id for an access token. Null on failure. */
export async function fetchDiscordUserId(
  accessToken: string,
): Promise<string | null> {
  try {
    const res = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { id?: string };
    return json.id ?? null;
  } catch (error) {
    console.error("Discord user fetch failed:", error);
    return null;
  }
}
