/**
 * The worker's messages, applied to a session. No React, no worker.
 *
 * Extracted from `useLocalBattle` for the same reason `pvpInbox` was extracted
 * from the PvP provider: the interesting part of a transport is what it does to
 * the session, and that is worth a test that does not need a Web Worker, a
 * bundler that can resolve one, or a React renderer.
 */

import type { BattleSession } from '../engine/BattleSession';
import type { BattleWorkerEvent } from './worker-protocol';

/** What the hook still has to do itself when a battle ends or fails. */
export interface WorkerInboxHooks {
  /** The battle is over: store the replay, refresh the screen. */
  onEnd?(message: Extract<BattleWorkerEvent, { type: 'battleEnd' }>): void;
  /** Anything visible changed. */
  onChange?(): void;
}

export type WorkerInboxSession = Pick<
  BattleSession,
  | 'acceptFrame'
  | 'winner'
  | 'replay'
  | 'status'
  | 'error'
  | 'isWaitingForChoice'
  | 'currentRequest'
>;

export function applyWorkerEvent(
  session: WorkerInboxSession,
  message: BattleWorkerEvent,
  hooks: WorkerInboxHooks = {},
): void {
  switch (message.type) {
    case 'protocol':
      // Sequenced exactly as the socket's `protocol.seq` is. A worker cannot
      // resync, but a duplicate frame (a re-posted message, a handler attached
      // twice) is still dropped instead of applied twice. `|request|` lines
      // arrive INLINE on this stream — there is no separate request message.
      session.acceptFrame(message.seq, message.line);
      break;

    case 'request':
      // Never emitted any more; the variant survives so a narrow still
      // compiles. If it ever appears again, that is a worker regression.
      console.warn(
        '[battlesim] worker emitted a `request` message; requests are `|request|` lines now',
        message.roomId,
      );
      break;

    case 'battleEnd':
      // NO synthetic `|win|` (C4). The engine already forwards the real one on
      // the protocol stream, and adding a second made the end fire twice: the
      // end screen appeared, then the queue caught up and the last turn played
      // out underneath it. Only the bookkeeping belongs to the transport —
      // `battleComplete` is the session's, and it reaches it when `|win|` has
      // been through the queue like every other line.
      //
      // AND `status` IS NOT BOOKKEEPING. It said so above and then set it
      // anyway, which cost the fix everything: the screen shows the end on
      // `battleComplete || status === 'finished'`, so writing `'finished'`
      // here jumped the queue exactly as a synthetic `|win|` would have. The
      // worker posts this the instant the engine finishes, while the last
      // turn is still several seconds of animation away from being drawn.
      // Nothing else needs the status: the tab bar, the reload guard and the
      // room list all read `battleComplete`, which the session sets when the
      // queue is genuinely empty. (Replays never saw this — they have no
      // transport to race.)
      session.winner = message.winner;
      session.replay = message.log;
      session.isWaitingForChoice = false;
      session.currentRequest = null;
      hooks.onEnd?.(message);
      break;

    case 'error':
      // A refused choice is not a dead battle: the worker is still running and
      // still waiting for an answer to the request it last sent, so the local
      // "sent, waiting" state comes off and the prompt comes back.
      if (message.code === 'stale_choice' || message.code === 'no_request') {
        console.warn('[battlesim] worker rejected a choice:', message.code, message.roomId);
        session.isWaitingForChoice = false;
        session.currentRequest = null;
        break;
      }
      console.warn('[battlesim] worker error', message.roomId, message.code ?? '', message.message);
      session.error = message.message;
      session.status = 'error';
      break;

    case 'battleCreated':
      session.status = 'active';
      break;
  }
  hooks.onChange?.();
}
