import { z } from 'zod';

export const env = z
  .object({
    // App
    NODE_ENV: z.string().default('development'),
    PORT: z.coerce.number().default(34301),
    // Public base URL of the web app — used to build reset/verify links.
    WEB_URL: z.string().default('http://localhost:3000'),
    // Directory served as static files.
    PUBLIC_DIR: z.string().optional(),

    // Database (MySQL)
    DB_HOST: z.string(),
    DB_PORT: z.coerce.number().default(3306),
    DB_USER: z.string(),
    DB_PASSWORD: z.string(),
    DB_NAME: z.string(),
    // Wingull game-server database (read alongside the main DB).
    WINGULL_DB_NAME: z.string(),
    // Drizzle-kit migrations only.
    DATABASE_URL: z.string().optional(),

    // Auth
    JWT_SECRET: z.string().min(32),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    GOOGLE_CALLBACK_URL: z.string().optional(),
    // Public URL of the web app, used to build absolute links in Discord
    // announcements. Falls back to the production host when unset.
    NEXTAUTH_URL: z.string().optional(),

    // Minecraft / game server
    MC_WORLD: z.string(),
    // Wingull plugin HTTP API base URL.
    WINGULL_API: z.string(),
    // Shared secret the Minecraft plugin sends as `X-Server-Key` to authenticate
    // server-to-server money/admin calls. Optional so dev/tests run without it;
    // when unset, server-key auth is simply unavailable (JWT still works).
    GAME_SERVER_SECRET: z.string().optional(),
    // Rollout flag for money/admin route auth. While false (default), the guard
    // still accepts the legacy `body.server === MC_WORLD` tripwire so nothing
    // breaks before the plugin ships `X-Server-Key`. Flip to true once the
    // plugin update is deployed to require a JWT (web) or the server key (game).
    ENFORCE_MONEY_AUTH: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true'),
    // Wigglypop marketplace. OFF until the game server ships /takepokemon + /takeitems.
    // While it is off, a sale only moves money (buyer → escrow → seller) and the two players
    // hand the Pokémon over in-game themselves; the API never calls givePokemon, because
    // without a matching take that would DUPLICATE the mon. Flip it on only once both
    // plugin routes exist — see WigglypopCustodyService.
    WIGGLYPOP_ATOMIC_CUSTODY: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true'),

    // Discord / StreamElements
    DISCORD_KEY: z.string(),
    STREAMELEMENTS_KEY: z.string().optional(),
    // Discord webhook for tournament announcements. TOURNAMENTS_* takes
    // precedence; both optional — announcements are silently disabled if unset.
    TOURNAMENTS_DISCORD_WEBHOOK_URL: z.string().optional(),
    DISCORD_WEBHOOK_URL: z.string().optional(),

    // Pokémon Showdown battle simulator websocket endpoint.
    SHOWDOWN_SERVER_URL: z
      .string()
      .default('wss://sim3.psim.us/showdown/websocket'),

    // Email (Resend). When RESEND_API_KEY is unset the MailService logs the
    // email to the console instead of sending (dev fallback).
    RESEND_API_KEY: z.string().optional(),
    MAIL_FROM: z.string().default('BoffMedia <no-reply@boffmedia.com>'),

    // Third-party APIs
    GEMINI_API_KEY: z.string().optional(),

    // Browser / manga scraper
    CHROME_PATH: z.string().optional(),
    MANGA_BROWSER_WS_ENDPOINT: z.string().optional(),
    MANGA_SCRAPER_PROXY: z.string().optional(),
    MANGA_SCRAPER_PROXY_LIST_URL: z.string().optional(),
  })
  .parse(process.env);
