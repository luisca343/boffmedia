import { NextResponse } from 'next/server';
import { env } from '@/config/env';

/**
 * Exchanges TWITCH_CLIENT_ID/TWITCH_CLIENT_SECRET for a Twitch app access
 * token (client_credentials grant) server-side, so the secret never reaches
 * the browser bundle. No params accepted — nothing to allow-list.
 * Usage: POST /api/twitch/token
 */
export async function POST() {
  if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET) {
    return NextResponse.json({ error: 'Twitch credentials not configured' }, { status: 503 });
  }

  try {
    const upstream = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.TWITCH_CLIENT_ID,
        client_secret: env.TWITCH_CLIENT_SECRET,
        grant_type: 'client_credentials',
      }),
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: 'Failed to obtain Twitch access token' }, { status: 502 });
    }

    const data = await upstream.json();
    // Forward only what the client needs to call the Helix API — never echo credentials.
    // client_id is public (not a secret): the browser must send it in the Client-Id
    // header, and it MUST match the id this token was minted with or Helix 401s.
    return NextResponse.json({
      access_token: data.access_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
      client_id: env.TWITCH_CLIENT_ID,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to obtain Twitch access token' }, { status: 502 });
  }
}
