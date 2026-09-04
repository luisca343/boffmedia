/**
 * The message contract between the play screen and its battle worker.
 *
 * Named the same as the socket events the server sends (`protocol`,
 * `battleEnd`, `error`) because `BattleSession` already understands that
 * vocabulary. Keeping it means the worker is a drop-in for the socket rather
 * than a second event language nobody can diff against the first — and it is
 * what lets PvP, the Showdown relay and local play all feed the same
 * `BattleSession.addLine`, which is the one-pipeline rule from
 * docs/pokemon-battle-refactor-plan.md.
 *
 * REQUESTS ARE LINES NOW. The worker used to post a separate `request` message
 * carrying a parsed object, in a race with the `protocol` messages of the same
 * turn. It does not any more: `|request|{json}` arrives INLINE on the player's
 * own stream, in the position the simulator emitted it, and is forwarded as an
 * ordinary `protocol` line. Same change as the `/battle` gateway, same reason.
 */

/** Main thread -> worker. */
export type BattleWorkerRequest =
  | {
      type: "start";
      roomId: string;
      format: string;
      /** Packed Showdown team for the player. Random formats supply none. */
      p1Team?: string;
      /** Packed team for the bot. Random formats supply none. */
      p2Team?: string;
      p1Name?: string;
      p2Name?: string;
    }
  | {
      type: "choice";
      roomId: string;
      choice: string;
      /**
       * Which request this answers. The worker refuses anything that is not the
       * request it last delivered, so a double-click cannot spend a turn twice.
       */
      rqid?: number | null;
    }
  | { type: "undo"; roomId: string }
  | { type: "forfeit"; roomId: string }
  | { type: "stop"; roomId: string };

/** Worker -> main thread. */
export type BattleWorkerEvent =
  | { type: "battleCreated"; roomId: string; format: string }
  | {
      type: "protocol";
      roomId: string;
      /** Monotonic from 0 per room, exactly as the socket's `protocol.seq`. */
      seq: number;
      /** May be a `|request|{json}` line. */
      line: string;
    }
  /**
   * @deprecated Never emitted. Requests arrive as `|request|` lines inside
   * `protocol`. Kept only so a consumer that still narrows on it compiles.
   */
  | { type: "request"; roomId: string; request: unknown }
  | {
      type: "battleEnd";
      roomId: string;
      seq: number;
      winner: string;
      /** The full protocol log, ready to store as a ReplayRecord. */
      log: string;
      teams: unknown;
    }
  | {
      type: "error";
      roomId: string;
      message: string;
      /** Set when the engine refused a choice: `stale_choice`, `no_request`, … */
      code?: string;
    };
