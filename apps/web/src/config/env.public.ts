import { z } from 'zod';

// Safe to import in client components — only NEXT_PUBLIC_* and NODE_ENV.
export const env = z
  .object({
    NODE_ENV: z.string().default('development'),
    NEXT_PUBLIC_API: z.string(),
    NEXT_PUBLIC_TERAS_API: z.string(),
    NEXT_PUBLIC_MC_WORLD: z.string(),
    NEXT_PUBLIC_SOCKET_URL: z.string(),
    NEXT_PUBLIC_URL: z.string().default(''),
    NEXT_PUBLIC_ROTOM_API_URL: z.string().default(''),
    NEXT_PUBLIC_TWITCH_CLIENT_ID: z.string().default(''),
    NEXT_PUBLIC_TWITCH_CLIENT_SECRET: z.string().default(''),
  })
  .parse(process.env);
