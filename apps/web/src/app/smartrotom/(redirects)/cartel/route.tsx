import { HighwaySign } from '@/app/smartrotom/gobierno/_components/admin/HighwaySign';
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Shares a saved Señalización cartel as an image. `tipo`/`via`/`dest#`/`dist#`/`dir#` are
// the exact param names the Señalización builder (apps/web/src/app/smartrotom/gobierno/
// admin/senalizacion) writes into its shareable link.
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const tipo = searchParams.get('tipo') || 'autopista'
    const highway = searchParams.get('via') || 'A-1'
    const destinations = []

    // Get up to 4 destinations, distances, and directions
    for (let i = 1; i <= 4; i++) {
      const dest = searchParams.get(`dest${i}`)
      const dist = searchParams.get(`dist${i}`)
      const dir = searchParams.get(`dir${i}`) || 'recto'
      if (dest && dist) {
        destinations.push({ dest, dist, dir })
      }
    }

    return new ImageResponse(
      (
        <HighwaySign type={tipo} highway={highway} destinations={destinations} width={500} />
      ),
      {
        width: 500,
        height: 300,
      }
    )
  }