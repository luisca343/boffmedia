import { z } from 'zod';

// Each var is referenced directly so Next.js inlines the value at build time.
// Passing `process.env` as a whole object does NOT work on the client — Next.js
// only performs static replacement for explicit `process.env.NEXT_PUBLIC_*` accesses.
export const env = z
  .object({
    NODE_ENV: z.string().default('development'),
    NEXT_PUBLIC_URL: z.string().default(''),
    NEXT_PUBLIC_API: z.string(),
    // Origin serving the static asset tree, without a trailing slash.
    // Empty = the assets share this app's origin, which is what `staticAsset`
    // assumes by default; set it to move every asset URL to another host.
    NEXT_PUBLIC_STATIC_URL: z.string().default(''),
    NEXT_PUBLIC_SOCKET_URL: z.string(),
    NEXT_PUBLIC_ROTOM_API_URL: z.string().default(''),
    NEXT_PUBLIC_MC_WORLD: z.string(),
    // Pokémon Showdown iframe target. Override per-environment; prefer an HTTPS host.
    NEXT_PUBLIC_SHOWDOWN_URL: z.string().default('http://148.251.3.244:8002/'),
    NEXT_PUBLIC_TWITCH_CLIENT_ID: z.string().default(''),
  })
  .parse({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    NEXT_PUBLIC_API: process.env.NEXT_PUBLIC_API,
    NEXT_PUBLIC_STATIC_URL: process.env.NEXT_PUBLIC_STATIC_URL,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
    NEXT_PUBLIC_ROTOM_API_URL: process.env.NEXT_PUBLIC_ROTOM_API_URL,
    NEXT_PUBLIC_MC_WORLD: process.env.NEXT_PUBLIC_MC_WORLD,
    NEXT_PUBLIC_SHOWDOWN_URL: process.env.NEXT_PUBLIC_SHOWDOWN_URL,
    NEXT_PUBLIC_TWITCH_CLIENT_ID: process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID,
  });
