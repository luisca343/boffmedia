// Minimal Steam OpenID 2.0 helper. Steam has no OAuth2 — it exposes an OpenID
// endpoint that returns only a SteamID64 (no email), which is why Steam is
// link-only here. No dependency needed: the flow is a fixed redirect + a
// check_authentication round-trip.

const STEAM_OPENID_ENDPOINT = "https://steamcommunity.com/openid/login";
const STEAM_ID_REGEX = /^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/;

/**
 * Public origin used to build OAuth/OpenID redirect URIs. Prefers an explicitly
 * configured canonical base (`NEXTAUTH_URL`, then `NEXT_PUBLIC_URL`) so the
 * redirect_uri is deterministic and matches what NextAuth's login flow sends
 * (NextAuth also builds from `NEXTAUTH_URL`) — falling back to proxy headers.
 * A mismatch here is exactly what triggers Discord's "redirect_uri no válido".
 */
export function getPublicOrigin(req: Request): string {
  const configured = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_URL;
  if (configured) return configured.replace(/\/+$/, "");

  const headers = req.headers;
  const forwardedHost = headers.get("x-forwarded-host") ?? headers.get("host");
  const proto = headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) return `${proto}://${forwardedHost}`;
  return new URL(req.url).origin;
}

/** Build the redirect URL that sends the user to Steam to authenticate. */
export function buildSteamAuthUrl(returnTo: string, realm: string): string {
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnTo,
    "openid.realm": realm,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });
  return `${STEAM_OPENID_ENDPOINT}?${params.toString()}`;
}

/**
 * Verify a Steam OpenID positive assertion and return the SteamID64, or null.
 * Re-sends the exact params Steam gave us with mode=check_authentication; Steam
 * confirms the signature it produced, so a forged callback cannot pass.
 */
export async function verifySteamOpenId(
  query: URLSearchParams,
): Promise<string | null> {
  if (query.get("openid.mode") !== "id_res") return null;

  const claimedId = query.get("openid.claimed_id") ?? "";
  const match = STEAM_ID_REGEX.exec(claimedId);
  if (!match) return null;
  const steamId = match[1];

  const body = new URLSearchParams();
  query.forEach((value, key) => {
    if (key.startsWith("openid.")) body.set(key, value);
  });
  body.set("openid.mode", "check_authentication");

  try {
    const res = await fetch(STEAM_OPENID_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const text = await res.text();
    return /is_valid\s*:\s*true/i.test(text) ? steamId : null;
  } catch (error) {
    console.error("Steam OpenID verification failed:", error);
    return null;
  }
}
