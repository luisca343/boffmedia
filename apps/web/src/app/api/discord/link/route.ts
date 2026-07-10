import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/authOptions";
import { env } from "@/config/env";
import { getPublicOrigin } from "@/lib/steam-openid";
import { buildDiscordAuthUrl } from "@/lib/discord-oauth";

// Starts Discord profile-linking: requires a logged-in session, then sends the
// user through Discord OAuth with a CSRF `state` cookie. The callback attaches
// the resolved Discord id to *this* account (unlike login, which merges by email).
export async function GET(req: Request) {
  const origin = getPublicOrigin(req);

  if (!env.DISCORD_ID || !env.DISCORD_SECRET) {
    return NextResponse.redirect(new URL("/perfil?linked_error=discord", origin));
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/entrar?redirect=/perfil", origin));
  }

  const state = crypto.randomUUID();
  const redirectUri = `${origin}/api/discord/link/callback`;
  const res = NextResponse.redirect(
    buildDiscordAuthUrl(env.DISCORD_ID, redirectUri, state),
  );
  res.cookies.set("discord_link_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
