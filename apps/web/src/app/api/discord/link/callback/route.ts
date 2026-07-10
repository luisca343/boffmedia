import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/authOptions";
import { env } from "@/config/env";
import { getPublicOrigin } from "@/lib/steam-openid";
import { exchangeDiscordCode, fetchDiscordUserId } from "@/lib/discord-oauth";
import { UsersService } from "@/services/api/boffmedia/usersService";

// Discord OAuth return target for profile linking. Validates the CSRF state,
// exchanges the code, resolves the Discord id, and attaches it to the logged-in
// user via the guarded link endpoint. Always redirects back to /perfil with a
// status query the profile toasts; clears the state cookie on the way out.
export async function GET(req: Request) {
  const origin = getPublicOrigin(req);
  const url = new URL(req.url);

  const done = (params: Record<string, string>) => {
    const target = new URL("/perfil", origin);
    for (const [key, value] of Object.entries(params)) {
      target.searchParams.set(key, value);
    }
    const res = NextResponse.redirect(target);
    res.cookies.set("discord_link_state", "", { path: "/", maxAge: 0 });
    return res;
  };

  try {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const savedState = (await cookies()).get("discord_link_state")?.value;
    if (!code || !state || !savedState || state !== savedState) {
      return done({ linked_error: "discord" });
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const token = (session?.user as { accessToken?: string } | undefined)?.accessToken;
    if (!userId || !token) {
      return done({ linked_error: "discord" });
    }

    const redirectUri = `${origin}/api/discord/link/callback`;
    const accessToken = await exchangeDiscordCode(
      code,
      redirectUri,
      env.DISCORD_ID,
      env.DISCORD_SECRET,
    );
    if (!accessToken) return done({ linked_error: "discord" });

    const discordId = await fetchDiscordUserId(accessToken);
    if (!discordId) return done({ linked_error: "discord" });

    const res = await UsersService.linkDiscord(Number(userId), discordId, token);
    if (res.success && res.data) {
      return done({ linked: "discord" });
    }
    return done({
      linked_error: res.statusCode === 409 ? "discord_taken" : "discord",
    });
  } catch (error) {
    console.error("Discord link callback error:", error);
    return done({ linked_error: "discord" });
  }
}
