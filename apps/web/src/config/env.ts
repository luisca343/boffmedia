import { z } from 'zod';

export const env = z
  .object({
    NODE_ENV: z.string().default('development'),

    // Public — available in browser bundles
    NEXT_PUBLIC_API: z.string(),
    NEXT_PUBLIC_MC_WORLD: z.string(),
    NEXT_PUBLIC_SOCKET_URL: z.string(),
    NEXT_PUBLIC_URL: z.string().default(''),
    NEXT_PUBLIC_ROTOM_API_URL: z.string().default(''),
    NEXT_PUBLIC_TWITCH_CLIENT_ID: z.string().default(''),

    // Server-side only — never exposed to browser bundles
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    NEXTAUTH_SECRET: z.string(),
    TWITCH_CLIENT_ID: z.string().default(''),
    TWITCH_CLIENT_SECRET: z.string().default(''),
    // Discord OAuth (login + profile linking) — optional; features only activate
    // when both are set, so the Discord UI stays inert until they're configured.
    // (DISCORD_KEY is the bot token and lives API-side; these are the OAuth app.)
    DISCORD_ID: z.string().default(''),
    DISCORD_SECRET: z.string().default(''),
    // Steam Web API key — optional; only used to resolve the persona name/avatar
    // when linking. The OpenID link itself works without it.
    STEAM_API_KEY: z.string().default(''),
  })
  .parse(process.env);
