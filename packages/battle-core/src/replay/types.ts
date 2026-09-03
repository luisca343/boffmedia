/**
 * Replay and team DTO shapes shared by tool, API, and outbox.
 *
 * Plain interfaces, no decorators (this package must not depend on Nest).
 */

export interface ReplayRecord {
  /** UUID, generated locally. */
  id: string;
  /** Format id, e.g. 'gen9randombattle'. */
  format: string;
  /** Player 1 name. */
  p1: string;
  /** Player 2 name. */
  p2: string;
  /** 'p1', 'p2', or 'tie'. */
  winner: string;
  /** Full battle log (newline-separated protocol lines). */
  log: string;
  /** Teams on both sides. */
  teams: Array<Array<{ speciesForme: string; name: string; gender?: string; fainted: boolean }>>;
  /** Timestamp of battle completion. */
  playedAt: number;
  /** 'local' for AI battles, 'pvp' for matches. */
  source: 'local' | 'pvp';
}

export interface TeamRecord {
  /** UUID assigned by the client (tool store key). */
  clientId: string;
  /** User display name (stored for reference). */
  name: string;
  /** Format id, e.g. 'gen9ou'. */
  format: string;
  /** Packed team string from Teams.pack(). */
  packed: string;
  /** Last modification timestamp. */
  updatedAt: number;
  /** Soft-delete marker. */
  deletedAt?: number;
}
