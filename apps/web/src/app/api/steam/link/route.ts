import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/authOptions";
import { buildSteamAuthUrl, getPublicOrigin } from "@/lib/steam-openid";

// Starts the Steam link: only a logged-in user may link, so bounce anonymous
// visitors to /entrar. Steam is link-only (no standalone account creation).
export async function GET(req: Request) {
  const origin = getPublicOrigin(req);

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(
      new URL("/entrar?redirect=/perfil", origin),
    );
  }

  const returnTo = `${origin}/api/steam/callback`;
  const realm = `${origin}/`;
  return NextResponse.redirect(buildSteamAuthUrl(returnTo, realm));
}
