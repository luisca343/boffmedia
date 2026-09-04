import { DynamicModule } from '@nestjs/common';
import { IntentsBitField } from 'discord.js';
import { env } from '@/config/env';
import { resilientNecord } from './necord-resilient.module';

/** Just the two variables the switch reads, so a spec can hand in a literal
 *  instead of rebuilding the whole env object. */
export type DiscordEnv = Pick<
  typeof env,
  'DISCORD_BOT_ENABLED' | 'DISCORD_KEY'
>;

/**
 * The kill switch. Running the API with no Discord bot is a SUPPORTED
 * configuration, not a degraded one: a box that never got a token, a
 * staging deploy that must not answer in the production guild, or an incident
 * where the bot is the thing misbehaving.
 *
 * A missing token counts as off rather than as a boot error — that is the
 * `TERAS_API_TOKEN` / `SECRET_ENCRYPTION_KEY` idiom in `config/env.ts`: the
 * feature turns itself off instead of taking the process with it.
 */
export function isDiscordBotEnabled(source: DiscordEnv = env): boolean {
  return source.DISCORD_BOT_ENABLED && Boolean(source.DISCORD_KEY);
}

/**
 * The gateway module, or nothing at all. Returning `[]` is what makes the kill
 * switch total: with no Necord module there is no `Client` provider, so nothing
 * opens a websocket to Discord, registers a command or holds a session.
 */
export function discordGatewayImports(
  source: DiscordEnv = env,
): DynamicModule[] {
  if (!isDiscordBotEnabled(source)) return [];

  return [
    resilientNecord({
      // Non-null is safe: `isDiscordBotEnabled` already refused an empty token.
      token: source.DISCORD_KEY as string,
      intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildPresences,
        IntentsBitField.Flags.GuildVoiceStates,
      ],
    }),
  ];
}
