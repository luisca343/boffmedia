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
    GOOGLE_CALLBACK_URL: z.string().optional(),

    // Minecraft
    MC_WORLD: z.string(),

    // Wingull
    WINGULL_API: z.string(),
    WINGULL_DB_NAME: z.string(),

    // Discord / StreamElements
    DISCORD_KEY: z.string(),
    STREAMELEMENTS_KEY: z.string().optional(),

    // Email (Resend). When RESEND_API_KEY is unset the MailService logs the
    // email to the console instead of sending (dev fallback).
    RESEND_API_KEY: z.string().optional(),
    MAIL_FROM: z.string().default('BoffMedia <no-reply@boffmedia.com>'),
    // Public base URL of the web app — used to build reset/verify links.
    WEB_URL: z.string().default('http://localhost:3000'),

    // Wigglypop marketplace. OFF until the game server ships /takepokemon + /takeitems.
    // While it is off, a sale only moves money (buyer → escrow → seller) and the two players
    // hand the Pokémon over in-game themselves; the API never calls givePokemon, because
    // without a matching take that would DUPLICATE the mon. Flip it on only once both
    // plugin routes exist — see WigglypopCustodyService.
    WIGGLYPOP_ATOMIC_CUSTODY: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true'),

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
