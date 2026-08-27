import { z } from 'zod';

export const env = z
  .object({
    // App
    NODE_ENV: z.string().default('development'),
    PORT: z.coerce.number().default(34301),
    // WebSocket gateway port. Kept env-driven so it can move without a code
    // change; 34304 stays the effective default.
    SOCKET_PORT: z.coerce.number().default(34304),
    // Public base URL of the web app — used to build reset/verify links.
    WEB_URL: z.string().default('http://localhost:3000'),
    // Public base URL of the asset tree (no trailing slash) — the origin that
    // `config/asset-url.ts` prefixes onto stored, relative asset paths. Unset =
    // the URLs come out root-relative, which is right whenever the API and the
    // assets share an origin.
    PUBLIC_DIR: z.string().optional(),
    // Filesystem root of the writable uploads store. Unset = <cwd>/var/uploads.
    // Keep it on local disk: these files are read on ordinary page loads, and
    // the laboon mount is network storage.
    UPLOADS_ROOT: z.string().optional(),
    // Filesystem root of the read-only asset tree. Unset = <cwd>/public, which
    // is the bind-mount path in both dev and the container; set it only when the
    // tree lives somewhere else on disk.
    PUBLIC_ROOT: z.string().optional(),

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
    // The Minecraft mod's opaque outbound token — must equal its
    // `TerasConfig.apiToken`, which the mod sends as `Authorization: Bearer`
    // only when that config value is non-empty (it defaults to ""). Authenticates
    // server-to-server money/admin and item-grant calls. Optional so dev/tests run
    // without it; when unset, server auth is unavailable and the mod is locked out
    // (JWT still works). NOT a JWT — see GameOrUserAuthGuard.
    TERAS_API_TOKEN: z.string().optional(),
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

    // Launcher pack distribution. The CurseForge key never
    // reaches the launcher: since 16 July 2026 edge.forgecdn.net 401s without an
    // `x-api-key` header, and an embedded key is an extracted key, so every CF
    // byte is proxied by us. Optional so dev/tests boot without it — the proxy
    // route reports 503 while it is unset instead of failing obscurely.
    CURSEFORGE_API_KEY: z.string().optional(),
    // Where override blobs live, content-addressed by their sha512. Deliberately
    // OUTSIDE PUBLIC_DIR: overrides are gated by the pack ACL, and anything under
    // the static root would be world-readable by URL.
    //
    // CURRENTLY INERT, like DESKTOP_RELEASE_DIR below: both stores resolve
    // through `laboonPath()` (cwd + /laboon) so uploads work with zero env
    // setup. Kept in the schema because deploy envs already set them; setting
    // one changes nothing until `config/paths.ts`'s TEMP note is unwound.
    PACK_BLOB_DIR: z.string().optional(),
    // Boffmedia App auto-update artifacts (Tauri v2 updater). Inert for the same
    // reason as PACK_BLOB_DIR and, like it, deliberately OUTSIDE PUBLIC_DIR:
    // the bytes are served by a controller route so downloads stay countable
    // and the layout on disk is not part of the public contract.
    DESKTOP_RELEASE_DIR: z.string().optional(),
    // Absolute origin the updater feed puts in its `url` fields. Tauri fetches
    // that URL from a separate process, so a relative path is useless. Unset =
    // derive it from the incoming request (x-forwarded-proto/host), which is
    // right in dev and behind a well-configured proxy, wrong behind a bad one.
    DESKTOP_UPDATE_BASE_URL: z.string().optional(),

    // Browser / manga scraper
    CHROME_PATH: z.string().optional(),
    MANGA_BROWSER_WS_ENDPOINT: z.string().optional(),
    MANGA_SCRAPER_PROXY: z.string().optional(),
    MANGA_SCRAPER_PROXY_LIST_URL: z.string().optional(),

    // Randomizer (FVX jar runner)
    RANDOMIZER_JAR: z.string().optional(),
    RANDOMIZER_JAVA: z.string().default('java'),
    RANDOMIZER_SCRATCH_DIR: z.string().optional(),
    RANDOMIZER_MAX_CONCURRENCY: z.coerce.number().default(2),
    RANDOMIZER_TIMEOUT_MS: z.coerce.number().default(180000),
    // Settings shim (JSON ↔ .rnqs converter)
    RANDOMIZER_SHIM_JAR: z.string().optional(),
    RANDOMIZER_SHIM_MAX_CONCURRENCY: z.coerce.number().default(2),
    RANDOMIZER_SHIM_TIMEOUT_MS: z.coerce.number().default(30000),

    // Pokémon Showdown log scraper
    // Google Sheets API key file path (relative to cwd or absolute).
    POKEMON_LOG_SERVICE_KEY_FILE: z.string().optional(),
    // The Pokémon Showdown username to identify as the local player in battle logs.
    POKEMON_LOG_LOCAL_PLAYER: z.string().optional(),

    // Data retention windows: daily sweep removes old rows beyond their retention
    // period. Set any to 0 to disable that sweep. All times are parsed as positive
    // integers; durations are in days for notifications/invites, months for audits.
    // Deletes are bounded by LIMIT and loop until fewer rows match; a first run
    // against a large table will not lock it for minutes or blow the binlog.
    RETENTION_NOTIFICATIONS_DAYS: z.coerce.number().default(90), // read only
    RETENTION_AUDIT_MONTHS: z.coerce.number().default(12), // boffmedia + pack + randomizer
    RETENTION_GOBIERNO_AUDIT_MONTHS: z.coerce.number().default(12), // rotom_gobierno_auditoria
    RETENTION_EVENT_INVITES_GRACE_DAYS: z.coerce.number().default(30), // expired + grace
    RETENTION_NOTE_VERSIONS_KEEP: z.coerce.number().default(20), // most recent N per note
    RETENTION_OUTBOX_DAYS: z.coerce.number().default(30), // DELIVERED rows only; failed ones are kept
  })
  .superRefine((cfg, ctx) => {
    // In production a missing/localhost WEB_URL would silently ship localhost
    // links (password reset, launcher approval). Fail at boot instead.
    if (cfg.NODE_ENV === 'production') {
      const web = cfg.WEB_URL;
      if (!web || /localhost|127\.0\.0\.1/.test(web)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['WEB_URL'],
          message:
            'WEB_URL must be set to the public web origin in production (not localhost)',
        });
      }
    }
  })
  .parse(process.env);
