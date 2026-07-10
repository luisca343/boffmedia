import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/authOptions";
import { env } from "@/config/env";
import { getPublicOrigin } from "@/lib/steam-openid";
import { exchangeGoogleCode, fetchGoogleUserId } from "@/lib/google-oauth";
import { UsersService } from "@/services/api/boffmedia/usersService";

// Google OAuth return target for profile linking. Validates the CSRF state,
// exchanges the code, resolves the Google id (`sub`), and attaches it to the
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
    res.cookies.set("google_link_state", "", { path: "/", maxAge: 0 });
    return res;
  };

  try {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const savedState = (await cookies()).get("google_link_state")?.value;
    if (!code || !state || !savedState || state !== savedState) {
      return done({ linked_error: "google" });
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const token = (session?.user as { accessToken?: string } | undefined)?.accessToken;
    if (!userId || !token) {
      return done({ linked_error: "google" });
    }

    const redirectUri = `${origin}/api/google/link/callback`;
    const accessToken = await exchangeGoogleCode(
      code,
      redirectUri,
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
    );
    if (!accessToken) return done({ linked_error: "google" });

    const googleId = await fetchGoogleUserId(accessToken);
    if (!googleId) return done({ linked_error: "google" });

    const res = await UsersService.linkGoogle(Number(userId), googleId, token);
    if (res.success && res.data) {
      return done({ linked: "google" });
    }
    return done({
      linked_error: res.statusCode === 409 ? "google_taken" : "google",
    });
  } catch (error) {
    console.error("Google link callback error:", error);
    return done({ linked_error: "google" });
  }
}
