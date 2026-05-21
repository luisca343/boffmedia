import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxies Pokémon sprites from play.pokemonshowdown.com so that
 * html2canvas can render them without cross-origin restrictions.
 * Usage: /api/sprite?name=rotom-wash
 */
export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name');

  // Allowlist: Pokémon names are lowercase letters, digits, and hyphens only.
  if (!name || !/^[a-z0-9-]+$/.test(name)) {
    return new NextResponse(null, { status: 400 });
  }

  const upstream = `https://play.pokemonshowdown.com/sprites/dex/${name}.png`;

  try {
    const res = await fetch(upstream, { next: { revalidate: 86400 } });
    if (!res.ok) {
      return new NextResponse(null, { status: res.status });
    }
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
