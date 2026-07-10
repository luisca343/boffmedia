// Minimal Twitch OAuth2 helper for *profile linking* (attach a Twitch id to the
// already-logged-in account, regardless of email). Separate from Twitch *login*
// (NextAuth's TwitchProvider, which merges by email): linking must preserve the
// current session, so it runs its own code exchange and reads the id from Helix.

const TWITCH_AUTH = "https://id.twitch.tv/oauth2/authorize";
const TWITCH_TOKEN = "https://id.twitch.tv/oauth2/token";
const TWITCH_USERS = "https://api.twitch.tv/helix/users";

export function buildTwitchAuthUrl(
  clientId: string,
  redirectUri: string,
  state: string,
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "user:read:email",
    state,
  });
  return `${TWITCH_AUTH}?${params.toString()}`;
}

/** Exchange the auth code for an access token. Returns null on failure. */
export async function exchangeTwitchCode(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string,
): Promise<string | null> {
  try {
    const res = await fetch(TWITCH_TOKEN, {
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
    console.error("Twitch token exchange failed:", error);
    return null;
  }
}

/** Resolve the authenticated user's Twitch id via Helix. Null on failure. */
export async function fetchTwitchUserId(
  accessToken: string,
  clientId: string,
): Promise<string | null> {
  try {
    const res = await fetch(TWITCH_USERS, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Client-Id": clientId,
      },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: Array<{ id?: string }> };
    return json.data?.[0]?.id ?? null;
  } catch (error) {
    console.error("Twitch user fetch failed:", error);
    return null;
  }
}
