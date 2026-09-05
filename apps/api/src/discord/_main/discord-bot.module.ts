import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { env } from '@/config/env';
import { LoggerModule } from '@/api/_utils/logger/logger.module';

import { DiscordModule } from './discord.module';

/**
 * A1. The root module of the BOT PROCESS — everything the gateway needs and
 * nothing the HTTP API does.
 *
 * THE SEAM TURNED OUT TO BE ONE-DIRECTIONAL, which is what made this small.
 * The finding assumed the outbox dispatched Discord announcements through the
 * bot; it does not. `TournamentAnnouncerService` is a bare `fetch` to a Discord
 * WEBHOOK URL, it never touches the gateway client, and it works with
 * `DISCORD_BOT_ENABLED=false`. Counted properly, there are ZERO call sites
 * outside `src/discord/` that inject a Discord service, hold the `Client`, or
 * send a message through it — `DiscordModule` is `@Global()` but exports
 * nothing, `DiscordService` has no public methods, and `DiscordController` had
 * no routes (it is deleted in this change). So nothing had to be converted into
 * an IPC message or a queue topic: the API loses a subtree it never called.
 *
 * The other direction costs something, and it is one thing: `VgcMetaModule`,
 * injected at 13 sites across the eleven `/meta` commands and their two
 * autocomplete interceptors. It is a DB-only module — repositories plus
 * `DrizzleModule` — with no HTTP surface, so the bot process simply carries it.
 * Reaching the same data over HTTP would have put the API back in the bot's
 * critical path, which is the coupling this change exists to remove.
 *
 * WHAT ISOLATION THIS ACTUALLY BUYS. Not much in the way of crash containment:
 * the boundary interceptor and the resilient login already stopped a Discord
 * failure from taking the API down, and that was the in-process half of A1.
 * What it buys is the part hardening could not — a bot restart no longer
 * restarts the API, an API deploy no longer drops the gateway session (and its
 * reconnect backoff), and the two stop sharing a heap, which matters because
 * `@discordjs/voice` and a Playwright browser were living in the same 4 GB.
 */
@Module({
  imports: [
    // Same shape as AppModule's, so anything reading config through Nest sees
    // the identical object rather than a second, subtly different one.
    ConfigModule.forRoot({ isGlobal: true, load: [() => ({ env })] }),
    LoggerModule,
    DiscordModule,
  ],
})
export class DiscordBotModule {}
