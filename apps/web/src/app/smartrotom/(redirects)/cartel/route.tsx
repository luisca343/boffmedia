import HighwaySign from '@/app/smartrotom/admin/carteles/_components/HighwaySign';
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';


export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const highway = searchParams.get('highway') || 'A-1'
    const destinations = []
  
    // Get up to 4 destinations, distances, and directions
    for (let i = 1; i <= 4; i++) {
      const name = searchParams.get(`dest${i}`)
      const distance = searchParams.get(`dist${i}`)
      const direction = (searchParams.get(`dir${i}`) as 'down' | 'left' | 'right') || 'down'
      if (name && distance) {
        destinations.push({ name, distance, direction })
      }
    }
  
    return new ImageResponse(
      (
        <HighwaySign highway={highway} destinations={destinations} width={500} height={300} />
      ),
      {
        width: 500,
        height: 300,
      }
    )
  }