import {
  DiscordEnv,
  discordGatewayImports,
  isDiscordBotEnabled,
} from './discord.config';
import { ResilientNecordModule } from './necord-resilient.module';

const withEnv = (overrides: Partial<DiscordEnv> = {}): DiscordEnv => ({
  DISCORD_BOT_ENABLED: true,
  DISCORD_KEY: 'a-token',
  ...overrides,
});

describe('isDiscordBotEnabled', () => {
  it('is on with a token and the flag left at its default', () => {
    expect(isDiscordBotEnabled(withEnv())).toBe(true);
  });

  it('is off when the kill switch is thrown, token or not', () => {
    expect(isDiscordBotEnabled(withEnv({ DISCORD_BOT_ENABLED: false }))).toBe(
      false,
    );
  });

  it('is off when no token was configured — degrade, do not crash', () => {
    expect(isDiscordBotEnabled(withEnv({ DISCORD_KEY: undefined }))).toBe(
      false,
    );
    expect(isDiscordBotEnabled(withEnv({ DISCORD_KEY: '' }))).toBe(false);
  });
});

describe('discordGatewayImports', () => {
  it('registers the resilient Necord module when the bot is on', () => {
    const imports = discordGatewayImports(withEnv());
    expect(imports).toHaveLength(1);
    expect(imports[0].module).toBe(ResilientNecordModule);
  });

  it.each([
    ['the kill switch is off', { DISCORD_BOT_ENABLED: false }],
    ['there is no token', { DISCORD_KEY: undefined }],
  ])('registers nothing when %s', (_label, overrides) => {
    // No Necord module means no `Client` provider, which means nothing can open
    // a gateway connection — the switch is total, not cosmetic.
    expect(discordGatewayImports(withEnv(overrides))).toEqual([]);
  });
});
