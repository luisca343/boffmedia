import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { EMPTY, Observable, from } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NecordBaseDiscovery } from 'necord';
import { MessageFlags } from 'discord.js';
import { captureApiException } from '@/common/observability/sentry';

/** Deliberately vague: whatever broke is our defect, not something the user
 *  can act on, and the detail belongs in the log and in Sentry, not in a
 *  channel. English to match the text the meta commands already reply with. */
const USER_FACING_FAILURE =
  'Something went wrong running that command. It has been reported.';

/** A repliable discord.js interaction, described structurally so this file does
 *  not have to narrow across the six interaction subclasses. */
interface RepliableLike {
  isRepliable(): boolean;
  deferred: boolean;
  replied: boolean;
  reply(options: unknown): Promise<unknown>;
  editReply(options: unknown): Promise<unknown>;
}

function isRepliable(value: unknown): value is RepliableLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as RepliableLike).isRepliable === 'function' &&
    (value as RepliableLike).isRepliable()
  );
}

/**
 * Name the offending handler without depending on which Discovery subclass
 * Necord happened to build. `getName` (commands), `getEvent` (listeners) and
 * `getCustomId` (components/modals) live on different classes and none of them
 * is on the shared base, so we ask by duck-typing rather than by `instanceof`
 * against five imports that would then have to track Necord's class layout.
 */
const DISCOVERY_LABELS: ReadonlyArray<readonly [string, string]> = [
  ['command', 'getName'],
  ['listener', 'getEvent'],
  ['component', 'getCustomId'],
];

function describeDiscovery(discovery: NecordBaseDiscovery): string {
  const bag = discovery as unknown as Record<string, unknown>;
  for (const [kind, method] of DISCOVERY_LABELS) {
    const fn = bag[method];
    if (typeof fn !== 'function') continue;
    try {
      const value = (fn as () => unknown).call(discovery);
      if (value) return `${kind} ${String(value)}`;
    } catch {
      // A discovery that refuses to describe itself is not worth a second error.
    }
  }
  return discovery.constructor?.name ?? 'unknown';
}

/**
 * The one error boundary around every Discord handler — the 19 command
 * providers, the message listener, autocomplete interceptors and anything added
 * later — instead of a try/catch copy-pasted into each of them.
 *
 * It works because Necord binds each handler through Nest's
 * `ExternalContextCreator`, which applies global interceptors just as it does
 * for HTTP (`ResponseInterceptor` documents the same fact from the other side).
 * So a single APP_INTERCEPTOR covers the whole surface, and a command added
 * tomorrow is covered without anyone remembering to wrap it.
 *
 * Registered from `DiscordModule`, not `AppModule`: an APP_INTERCEPTOR is
 * global wherever it is declared, and keeping it here means the Discord
 * boundary lives entirely inside `discord/`.
 *
 * `GlobalExceptionFilter` still has its own non-HTTP branch and remains the
 * backstop for throws that never reach an interceptor (Necord's own dispatch,
 * a guard rejecting). Because this interceptor swallows rather than rethrows,
 * the two never report the same failure to Sentry twice.
 */
@Injectable()
export class DiscordBoundaryInterceptor implements NestInterceptor {
  constructor(private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Necord calls the bound handler as `(eventArgs, discovery)`, so argument 1
    // is the exact, version-proof marker of a Discord context. `getType()` is
    // not usable here: the API also has three WebSocket gateways, and they are
    // just as "not http" as Discord is.
    const discovery = context.getArgByIndex(1);
    if (!(discovery instanceof NecordBaseDiscovery)) {
      return next.handle();
    }

    const label = describeDiscovery(discovery);

    return next.handle().pipe(
      catchError((error: unknown) => {
        this.logger.error(
          {
            err:
              error instanceof Error
                ? { message: error.message, stack: error.stack }
                : error,
            discord: label,
          },
          `Discord ${label} failed`,
        );
        // Same reporting path as HTTP 500s and the process guards — one Sentry
        // integration, not a second one bolted to the bot.
        captureApiException(error, { mechanism: 'discord', path: label });

        // Tell the user something happened, best effort. An interaction token
        // expires after 15 minutes and a handler that already replied cannot
        // reply twice, so this is allowed to fail quietly.
        const eventArgs = context.getArgByIndex(0);
        const first = Array.isArray(eventArgs) ? eventArgs[0] : undefined;
        if (isRepliable(first)) {
          return from(this.notify(first)).pipe(catchError(() => EMPTY));
        }
        // Swallow: the whole point is that a broken command cannot become an
        // unhandled rejection in the process that also serves HTTP.
        return EMPTY;
      }),
    );
  }

  private async notify(interaction: RepliableLike): Promise<void> {
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: USER_FACING_FAILURE });
        return;
      }
      await interaction.reply({
        content: USER_FACING_FAILURE,
        flags: MessageFlags.Ephemeral,
      });
    } catch {
      // Reporting the failure must never become the failure.
    }
  }
}
