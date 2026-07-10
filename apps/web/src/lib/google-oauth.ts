// Minimal Google OAuth2 helper for *profile linking* (attach a Google id to the
// already-logged-in account, regardless of email). Separate from Google *login*
// (NextAuth's GoogleProvider, which merges by email): linking must preserve the
// current session, so it runs its own code exchange and reads the `sub`.

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO = "https://openidconnect.googleapis.com/v1/userinfo";

export function buildGoogleAuthUrl(
  clientId: string,
  redirectUri: string,
  state: string,
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH}?${params.toString()}`;
}

/** Exchange the auth code for an access token. Returns null on failure. */
export async function exchangeGoogleCode(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string,
): Promise<string | null> {
  try {
    const res = await fetch(GOOGLE_TOKEN, {
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
    console.error("Google token exchange failed:", error);
    return null;
  }
}

/** Resolve the Google `sub` (stable user id) for an access token. Null on failure. */
export async function fetchGoogleUserId(
  accessToken: string,
): Promise<string | null> {
  try {
    const res = await fetch(GOOGLE_USERINFO, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { sub?: string };
    return json.sub ?? null;
  } catch (error) {
    console.error("Google userinfo fetch failed:", error);
    return null;
  }
}
