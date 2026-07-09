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
  })
  .parse(process.env);
