/**
 * The message contract between the play screen and its battle worker.
 *
 * Named the same as the socket events the server used to send (`protocol`,
 * `request`, `battleEnd`, `error`) because `BattleSession` already understands
 * that vocabulary. Keeping it means the worker is a drop-in for the socket
 * rather than a second event language nobody can diff against the first — and
 * it is what lets PvP (M2), the Showdown relay and local play all feed the same
 * `BattleSession.addLine`, which is the one-pipeline rule from
 * docs/pokemon-battle-refactor-plan.md.
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
  | { type: "choice"; roomId: string; choice: string }
  | { type: "undo"; roomId: string }
  | { type: "forfeit"; roomId: string }
  | { type: "stop"; roomId: string };

/** Worker -> main thread. */
export type BattleWorkerEvent =
  | { type: "battleCreated"; roomId: string; format: string }
  | { type: "protocol"; roomId: string; line: string }
  | { type: "request"; roomId: string; request: unknown }
  | {
      type: "battleEnd";
      roomId: string;
      winner: string;
      /** The full protocol log, ready to store as a ReplayRecord. */
      log: string;
      teams: unknown;
    }
  | { type: "error"; roomId: string; message: string };
