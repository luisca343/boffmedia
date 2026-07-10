import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/authOptions";
import { env } from "@/config/env";
import { getPublicOrigin } from "@/lib/steam-openid";
import { exchangeTwitchCode, fetchTwitchUserId } from "@/lib/twitch-oauth";
import { UsersService } from "@/services/api/boffmedia/usersService";

// Twitch OAuth return target for profile linking. Validates the CSRF state,
// exchanges the code, resolves the Twitch id via Helix, and attaches it to the
// logged-in user via the guarded link endpoint. Always redirects back to
// /perfil with a status query the profile toasts; clears the state cookie.
export async function GET(req: Request) {
  const origin = getPublicOrigin(req);
  const url = new URL(req.url);

  const done = (params: Record<string, string>) => {
    const target = new URL("/perfil", origin);
    for (const [key, value] of Object.entries(params)) {
      target.searchParams.set(key, value);
    }
    const res = NextResponse.redirect(target);
    res.cookies.set("twitch_link_state", "", { path: "/", maxAge: 0 });
    return res;
  };

  try {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const savedState = (await cookies()).get("twitch_link_state")?.value;
    if (!code || !state || !savedState || state !== savedState) {
      return done({ linked_error: "twitch" });
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const token = (session?.user as { accessToken?: string } | undefined)?.accessToken;
    if (!userId || !token) {
      return done({ linked_error: "twitch" });
    }

    const redirectUri = `${origin}/api/twitch/link/callback`;
    const accessToken = await exchangeTwitchCode(
      code,
      redirectUri,
      env.TWITCH_CLIENT_ID,
      env.TWITCH_CLIENT_SECRET,
    );
    if (!accessToken) return done({ linked_error: "twitch" });

    const twitchId = await fetchTwitchUserId(accessToken, env.TWITCH_CLIENT_ID);
    if (!twitchId) return done({ linked_error: "twitch" });

    const res = await UsersService.linkTwitch(Number(userId), twitchId, token);
    if (res.success && res.data) {
      return done({ linked: "twitch" });
    }
    return done({
      linked_error: res.statusCode === 409 ? "twitch_taken" : "twitch",
    });
  } catch (error) {
    console.error("Twitch link callback error:", error);
    return done({ linked_error: "twitch" });
  }
}
