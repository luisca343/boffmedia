import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/authOptions";
import { env } from "@/config/env";
import { getPublicOrigin } from "@/lib/steam-openid";
import { buildTwitchAuthUrl } from "@/lib/twitch-oauth";

// Starts Twitch profile-linking: requires a logged-in session, then sends the
// user through Twitch OAuth with a CSRF `state` cookie. The callback attaches
// the resolved Twitch id to *this* account (unlike login, which merges by email).
export async function GET(req: Request) {
  const origin = getPublicOrigin(req);

  if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET) {
    return NextResponse.redirect(new URL("/perfil?linked_error=twitch", origin));
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/entrar?redirect=/perfil", origin));
  }

  const state = crypto.randomUUID();
  const redirectUri = `${origin}/api/twitch/link/callback`;
  const res = NextResponse.redirect(
    buildTwitchAuthUrl(env.TWITCH_CLIENT_ID, redirectUri, state),
  );
  res.cookies.set("twitch_link_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
