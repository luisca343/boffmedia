import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { Context, ContextOf, On, Once } from 'necord';
import { captureApiException } from '@/common/observability/sentry';

/**
 * The client-level half of the Discord failure isolation.
 *
 * The one that is not optional: discord.js's `Client` is an EventEmitter, and
 * an EventEmitter that emits `'error'` with NO listener attached THROWS. That
 * throw comes out of a timer/socket callback, so it lands in main.ts's
 * `uncaughtException` guard, which — correctly, for an unknown-state crash —
 * exits the process. A REST 5xx from Discord was therefore enough to stop the
 * API. Subscribing here is the entire fix; there is nothing to "handle".
 *
 * We deliberately do NOT reconnect. `@discordjs/ws`'s WebSocketManager already
 * owns shard resume/reconnect with its own backoff, and a second reconnect loop
 * racing it is how you turn one outage into a rate-limit ban. `shardDisconnect`
 * and `shardReconnecting` are logged so an outage is visible, not acted on.
 * The one exception is `invalidated`, which is discord.js saying it has GIVEN UP
 * — that is worth an alert, because nothing will bring the bot back on its own.
 *
 * Initial login is the other gap discord.js does not cover; see
 * `necord-resilient.module.ts`.
 */
@Injectable()
export class DiscordHealthListener {
  constructor(private readonly logger: Logger) {}

  @Once('ready')
  public onReady(@Context() [client]: ContextOf<'ready'>) {
    this.logger.log(`Discord client ready as ${client.user.tag}`);
  }

  @On('error')
  public onError(@Context() [error]: ContextOf<'error'>) {
    this.logger.error(
      { err: { message: error.message, stack: error.stack } },
      'Discord client error',
    );
    captureApiException(error, { mechanism: 'discord.client' });
  }

  @On('shardError')
  public onShardError(@Context() [error, shardId]: ContextOf<'shardError'>) {
    this.logger.error(
      { err: { message: error.message, stack: error.stack }, shardId },
      `Discord shard ${shardId} error`,
    );
    captureApiException(error, { mechanism: 'discord.shard' });
  }

  @On('shardDisconnect')
  public onShardDisconnect(
    @Context() [event, shardId]: ContextOf<'shardDisconnect'>,
  ) {
    // warn, not error: discord.js is about to reconnect this shard itself.
    this.logger.warn(
      { shardId, code: event?.code },
      `Discord shard ${shardId} disconnected (code ${event?.code})`,
    );
  }

  @On('shardReconnecting')
  public onShardReconnecting(
    @Context() [shardId]: ContextOf<'shardReconnecting'>,
  ) {
    this.logger.warn({ shardId }, `Discord shard ${shardId} reconnecting`);
  }

  @On('shardResume')
  public onShardResume(@Context() [shardId]: ContextOf<'shardResume'>) {
    this.logger.log({ shardId }, `Discord shard ${shardId} resumed`);
  }

  @On('invalidated')
  public onInvalidated() {
    // discord.js has stopped trying: the session cannot be resumed and it will
    // not re-login by itself. HTTP and websockets are unaffected, but the bot
    // is gone until the process restarts, so this one is worth waking someone.
    this.logger.error('Discord session invalidated — the bot is offline');
    captureApiException(
      new Error('Discord session invalidated'),
      { mechanism: 'discord.invalidated' },
    );
  }
}
