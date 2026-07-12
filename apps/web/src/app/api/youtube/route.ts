import { NextRequest, NextResponse } from "next/server"
import { env } from "@/config/env"

/**
 * Server-side proxy for the YouTube Data API. Injects YOUTUBE_API_KEY (kept out
 * of the browser bundle) and forwards the remaining query params to an
 * allow-listed read resource. Usage: GET /api/youtube?resource=search&q=…
 */
const ALLOWED = new Set(["videos", "search", "channels", "playlistItems", "commentThreads"])

export async function GET(req: NextRequest) {
  const key = env.YOUTUBE_API_KEY
  if (!key) {
    return NextResponse.json({ error: "YouTube API key not configured" }, { status: 503 })
  }

  const { searchParams } = new URL(req.url)
  const resource = searchParams.get("resource") ?? "search"
  if (!ALLOWED.has(resource)) {
    return NextResponse.json({ error: "Unsupported resource" }, { status: 400 })
  }

  const params = new URLSearchParams(searchParams)
  params.delete("resource")
  params.set("key", key)

  try {
    const upstream = await fetch(`https://www.googleapis.com/youtube/v3/${resource}?${params.toString()}`, {
      // short cache to soften the daily quota; content is not time-critical
      next: { revalidate: 60 },
    })
    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch {
    return NextResponse.json({ error: "YouTube request failed" }, { status: 502 })
  }
}
