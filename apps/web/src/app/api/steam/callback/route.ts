import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/authOptions";
import { getPublicOrigin, verifySteamOpenId } from "@/lib/steam-openid";
import { UsersService } from "@/services/api/boffmedia/usersService";

function backToProfile(origin: string, params: Record<string, string>) {
  const url = new URL("/perfil", origin);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url);
}

// Steam OpenID return target. Verifies the assertion, then persists the
// SteamID64 against the logged-in user via the guarded link endpoint. Every
// exit redirects back to /perfil with a status query the profile toasts.
export async function GET(req: Request) {
  const origin = getPublicOrigin(req);

  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const token = (session?.user as { accessToken?: string } | undefined)?.accessToken;
    if (!userId || !token) {
      return backToProfile(origin, { linked_error: "steam" });
    }

    const steamId = await verifySteamOpenId(new URL(req.url).searchParams);
    if (!steamId) {
      return backToProfile(origin, { linked_error: "steam" });
    }

    const res = await UsersService.linkSteam(Number(userId), steamId, token);
    if (res.success && res.data) {
      return backToProfile(origin, { linked: "steam" });
    }
    return backToProfile(origin, {
      linked_error: res.statusCode === 409 ? "steam_taken" : "steam",
    });
  } catch (error) {
    console.error("Steam link callback error:", error);
    return backToProfile(origin, { linked_error: "steam" });
  }
}
