/**
 * A1. The Discord bot's own process.
 *
 * `createApplicationContext`, not `create`: the bot has no HTTP surface at all,
 * so there is no server to start and no port to bind. That is also why this
 * needs no change to `nest build` — everything under `src/` is compiled, so
 * `dist/discord-main.js` simply appears.
 *
 * RUNNING BOTH IS A CONFIGURATION, NOT A CODE PATH. The API container sets
 * `DISCORD_BOT_ENABLED=false` and the bot container leaves it true; both run the
 * same image. Nothing here forbids the old single-process arrangement, and that
 * is deliberate — a deployment that has not been split yet must keep working,
 * and `isDiscordBotEnabled()` was already the switch for it.
 *
 * THE ONE THING THAT MUST NOT REGRESS: with the bot moved out, the API must
 * still start with `DISCORD_BOT_ENABLED=false`, which it always could. And the
 * bot must not silently do nothing here — a process that boots, finds no token
 * and sits there forever looking healthy is the failure mode this whole backlog
 * keeps recording, so it exits non-zero instead.
 */
import { Logger } from 'nestjs-pino';
import { NestFactory } from '@nestjs/core';

import { env } from '@/config/env';
import { initSentry } from '@/common/observability/sentry';
import { installProcessGuards } from '@/common/process-guards';

import { DiscordBotModule } from './discord/_main/discord-bot.module';
import { isDiscordBotEnabled } from './discord/_main/discord.config';

async function bootstrap(): Promise<void> {
  // Before NestFactory, exactly as main.ts does it: a failure to build the
  // module graph is one of the things most worth reporting.
  initSentry();
  installProcessGuards();

  if (!isDiscordBotEnabled()) {
    // Loud, and a non-zero exit. In the API process "no token" correctly means
    // "run without a bot"; in a process whose ONLY job is the bot it means the
    // container is misconfigured, and a healthy-looking idle process is how
    // that goes unnoticed for a week.
    // eslint-disable-next-line no-console
    console.error(
      'The Discord bot process has nothing to do: DISCORD_KEY is unset or ' +
        'DISCORD_BOT_ENABLED is false. Set both, or do not run this entrypoint.',
    );
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(DiscordBotModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  // Ctrl-C and `docker stop` should close the gateway session rather than drop
  // it, so Discord does not hold a zombie shard until it times out.
  app.enableShutdownHooks();

  app
    .get(Logger)
    .log(
      `Discord bot process up (NODE_ENV=${env.NODE_ENV}). No HTTP server: this ` +
        'process serves the gateway only.',
    );
}

void bootstrap();
