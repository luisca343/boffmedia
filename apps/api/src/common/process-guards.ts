/**
 * Process-level crash handling, shared by both entrypoints.
 *
 * Extracted from `main.ts` for A1: the Discord bot runs in its own process now,
 * and a second copy of this would be a second policy -- the two would drift on
 * exactly the question of which errors are survivable, which is the one thing
 * they must agree on.
 *
 * `service` stays "boffmedia-api" in the log lines: both processes ship the same
 * image and the same log pipeline, and renaming it per entrypoint would split
 * one incident across two service names.
 */
import { captureApiException, flushSentry } from './observability/sentry';

/**
 * Socket failures that say nothing about this process's health: the peer went
 * away. They arrive as an 'error' event on whichever client emitted them, and
 * an EventEmitter with no listener for 'error' is fatal to Node — so a public
 * WebSocket dropping an idle connection could take the whole API down, taking
 * every unrelated route with it.
 */
const RECOVERABLE_SOCKET_CODES = new Set([
  'ECONNRESET',
  'EPIPE',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'EAI_AGAIN',
]);

function installProcessGuards(): void {
  process.on('uncaughtException', (error: NodeJS.ErrnoException) => {
    if (error?.code && RECOVERABLE_SOCKET_CODES.has(error.code)) {
      // Deliberately kept alive: a dropped peer connection is not a reason to
      // stop serving requests that have nothing to do with it.
      console.error(
        JSON.stringify({
          level: 50,
          service: 'boffmedia-api',
          msg: `Recovered from an unhandled socket error (${error.code})`,
          err: { message: error.message, stack: error.stack },
        }),
      );
      return;
    }
    // Anything else is a real defect, and continuing from an unknown state is
    // worse than restarting: let the process die so the supervisor replaces it.
    console.error(
      JSON.stringify({
        level: 60,
        service: 'boffmedia-api',
        msg: 'Fatal uncaught exception — exiting',
        err: { message: error?.message, stack: error?.stack },
      }),
    );
    captureApiException(error, { mechanism: 'uncaughtException' });
    // The ONLY place a flush is warranted: the process is about to leave, and
    // an event still in Sentry's buffer dies with it — which is exactly the
    // class of crash we most want to see. `flushSentry` resolves immediately
    // when Sentry is off, and the timer below is the backstop for a flush that
    // never settles, so the exit path is unchanged on a box with no DSN.
    setTimeout(() => process.exit(1), 2500).unref();
    void flushSentry(2000).then(() => process.exit(1));
  });

  process.on('unhandledRejection', (reason: unknown) => {
    const error = reason as NodeJS.ErrnoException;
    console.error(
      JSON.stringify({
        level: 50,
        service: 'boffmedia-api',
        msg: 'Unhandled promise rejection',
        err: { message: error?.message ?? String(reason), stack: error?.stack },
      }),
    );
    captureApiException(reason, { mechanism: 'unhandledRejection' });
  });
}

export { installProcessGuards };
