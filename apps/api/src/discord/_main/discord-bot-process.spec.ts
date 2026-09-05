import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { isDiscordBotEnabled } from './discord.config';

/**
 * A1. What must stay true about the bot's own process.
 *
 * A full `Test.createTestingModule` on `DiscordBotModule` is not what is wanted
 * here: it would build `VgcMetaModule`, which builds `DrizzleModule`, which
 * wants a database — so the spec would need Docker to assert something that has
 * nothing to do with a database. These are the two properties that actually
 * regress, and both are visible in the source.
 *
 * The regression this guards is specific and quiet: someone adds an import to
 * `DiscordBotModule` for convenience, `AppModule` comes with it, and the bot
 * container starts serving HTTP, running the outbox cron and the retention
 * sweeper — a SECOND copy of every scheduled job, against the same database, on
 * a process nobody thinks of as the API. Nothing would fail. Rows would just be
 * claimed twice.
 */

const SRC = join(__dirname, '..', '..');
const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8');

describe('the Discord bot process (A1)', () => {
  it('never reaches AppModule, directly or by name', () => {
    for (const rel of [
      'discord-main.ts',
      'discord/_main/discord-bot.module.ts',
    ]) {
      const text = read(rel);
      // Comments legitimately discuss AppModule; imports must not.
      const imports = text
        .split('\n')
        .filter((l) => /^\s*import\b/.test(l) || /^\s*from\s+'/.test(l))
        .join('\n');
      expect(imports).not.toMatch(/AppModule|app\.module/);
    }
  });

  it('starts an application CONTEXT, not an HTTP server', () => {
    const main = read('discord-main.ts');
    expect(main).toContain('createApplicationContext');
    // `NestFactory.create(` would build an HTTP adapter and bind a port. The
    // bot has no routes, and a second process listening on 34301 would either
    // fail to bind or, worse, win the race and serve nothing.
    expect(main).not.toMatch(/NestFactory\.create\(/);
    expect(main).not.toMatch(/\.listen\(/);
  });

  it('refuses to run as a bot process with the bot switched off', () => {
    // In the API this is a supported configuration; in a process whose only job
    // is the gateway it means the container is misconfigured, and an idle
    // healthy-looking process is how that goes unnoticed.
    expect(read('discord-main.ts')).toContain('process.exit(1)');

    expect(
      isDiscordBotEnabled({ DISCORD_BOT_ENABLED: false, DISCORD_KEY: 'x' }),
    ).toBe(false);
    expect(
      isDiscordBotEnabled({
        DISCORD_BOT_ENABLED: true,
        DISCORD_KEY: undefined,
      }),
    ).toBe(false);
    expect(
      isDiscordBotEnabled({ DISCORD_BOT_ENABLED: true, DISCORD_KEY: 'x' }),
    ).toBe(true);
  });

  it('keeps the guild out of the command files', () => {
    // It was the literal '516237304101339156' in seven of them, so a staging
    // bot could only ever answer in the production guild.
    const files = [
      'discord/commands/global/ping.ts',
      'discord/commands/global/frases/frase.ts',
      'discord/commands/global/frases/frases.ts',
      'discord/commands/global/frases/nuevafrase.ts',
      'discord/commands/global/voz/join.ts',
      'discord/commands/global/voz/setVoz.ts',
      'discord/_commands/commands.service.ts',
    ];
    for (const rel of files) {
      expect(read(rel)).not.toContain('516237304101339156');
    }
    // And the one place it does live reads it from the environment.
    expect(read('discord/_main/discord.config.ts')).toContain(
      'env.DISCORD_GUILD_ID',
    );
  });
});
