import { z } from 'zod';

export const env = z
  .object({
    NODE_ENV: z.string().default('development'),
    PORT: z.coerce.number().default(34301),

    // MySQL connection
    DB_HOST: z.string(),
    DB_USER: z.string(),
    DB_PASSWORD: z.string(),
    DB_NAME: z.string(),
    DB_PORT: z.coerce.number().default(3306),

    // Drizzle-kit migrations only
    DATABASE_URL: z.string().optional(),

    // Auth
    JWT_SECRET: z.string().min(32),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),

    // Minecraft
    MC_WORLD: z.string(),

    // Wingull
    WINGULL_API: z.string(),
    WINGULL_DB_NAME: z.string(),

    // Discord / StreamElements
    DISCORD_KEY: z.string(),
    STREAMELEMENTS_KEY: z.string().optional(),

    // AI
    GEMINI_API_KEY: z.string().optional(),

    // Browser / scraper
    CHROME_PATH: z.string().optional(),
    MANGA_BROWSER_WS_ENDPOINT: z.string().optional(),
    MANGA_SCRAPER_PROXY: z.string().optional(),
    MANGA_SCRAPER_PROXY_LIST_URL: z.string().optional(),

    // Static files
    PUBLIC_DIR: z.string().optional(),
  })
  .parse(process.env);
