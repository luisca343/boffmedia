import { DynamicModule, Logger } from '@nestjs/common';
import { NecordModule } from 'necord';
import { captureApiException } from '@/common/observability/sentry';

type NecordOptions = Parameters<typeof NecordModule.forRoot>[0];

/**
 * Initial-login retry ladder. discord.js reconnects a session it has already
 * established (WebSocketManager owns that, and we deliberately do not
 * reimplement it — see DiscordHealthListener), but a `client.login()` that
 * REJECTS is never retried: the client just sits there, logged out, forever.
 *
 * Before this module the process crashed instead, and the supervisor's restart
 * was the retry. Now that boot survives a Discord outage, something has to take
 * that job over, or "the API stays up" would quietly mean "the bot never comes
 * back until someone redeploys".
 */
const LOGIN_RETRY_DELAYS_MS = [5_000, 15_000, 45_000, 120_000, 300_000];

/**
 * `NecordModule` with a login that cannot take the API down with it.
 *
 * Necord's own hook is literally:
 *
 *     onApplicationBootstrap() { return this.client.login(this.options.token); }
 *
 * Nest AWAITS lifecycle hooks, so that promise is on the critical path of
 * `app.init()`. An invalid token, a DNS blip, a 429 storm or Discord being down
 * rejects it, `app.listen()` is never reached, and the API serves no HTTP and no
 * websockets — for all three clients — because of a third-party chat service.
 * That is finding A1's real teeth.
 *
 * We subclass rather than monkey-patch the prototype: `@Module()` metadata and
 * the constructor's `design:paramtypes` are read through `Reflect.getMetadata`,
 * which walks the prototype chain, so the subclass inherits Necord's providers,
 * imports, exports and injection wholesale. `resilientNecord()` then swaps only
 * the `module` token on the dynamic module Necord builds.
 */
export class ResilientNecordModule extends NecordModule {
  private static readonly log = new Logger('DiscordLogin');
  private loginAttempt = 0;
  private retryTimer?: NodeJS.Timeout;

  override onApplicationBootstrap(): Promise<string> {
    void this.attemptLogin();
    // Detached on purpose: boot must not wait on Discord. Nest discards this
    // value (Necord's own return is the login token, which nothing reads), so
    // resolving immediately is the whole change.
    return Promise.resolve('');
  }

  override async onApplicationShutdown(signal?: string): Promise<void> {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    await super.onApplicationShutdown(signal);
  }

  private async attemptLogin(): Promise<void> {
    try {
      await super.onApplicationBootstrap();
      ResilientNecordModule.log.log('Discord client logged in');
      this.loginAttempt = 0;
    } catch (error: unknown) {
      this.scheduleRetry(error);
    }
  }

  private scheduleRetry(error: unknown): void {
    const delay = LOGIN_RETRY_DELAYS_MS[this.loginAttempt];
    const message = error instanceof Error ? error.message : String(error);

    if (delay === undefined) {
      ResilientNecordModule.log.error(
        `Discord login failed ${this.loginAttempt} times — giving up. The API ` +
          `keeps serving HTTP and websockets; the bot stays offline until a restart. (${message})`,
      );
      // Only reported once the ladder is exhausted: a transient outage that the
      // retries absorb is an operational fact, not a defect worth an alert.
      captureApiException(error, { mechanism: 'discord.login' });
      return;
    }

    this.loginAttempt += 1;
    ResilientNecordModule.log.warn(
      `Discord login failed (attempt ${this.loginAttempt}) — retrying in ${delay}ms: ${message}`,
    );
    // unref: a pending retry must never be the reason the process refuses to exit.
    this.retryTimer = setTimeout(() => void this.attemptLogin(), delay);
    this.retryTimer.unref?.();
  }
}

/** `NecordModule.forRoot()` with the resilient lifecycle. Same options, same
 *  providers, same exports — only the module token changes. */
export function resilientNecord(options: NecordOptions): DynamicModule {
  return { ...NecordModule.forRoot(options), module: ResilientNecordModule };
}
